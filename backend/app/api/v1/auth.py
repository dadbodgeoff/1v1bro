"""
Authentication API endpoints.
"""

from fastapi import APIRouter, Response, status

from app.api.deps import AuthServiceDep, CurrentUser
from app.core.responses import APIResponse
from app.schemas.auth import (
    LoginRequest,
    RegisterRequest,
    AuthResponse,
    UserResponse,
    TwoFactorSetup,
    TwoFactorVerify,
    TwoFactorStatus,
    PasswordResetRequest,
    PasswordResetConfirm,
    PasswordResetResponse,
    RefreshTokenRequest,
    TokenValidationResponse,
)


router = APIRouter(prefix="/auth", tags=["Authentication"])


@router.post(
    "/register",
    response_model=APIResponse[AuthResponse],
    status_code=status.HTTP_201_CREATED,
)
async def register(
    request: RegisterRequest,
    response: Response,
    auth_service: AuthServiceDep,
):
    """
    Register a new user.
    
    Creates a new user account via Supabase Auth and returns
    an access token with user information.
    """
    token, user_data = await auth_service.register(
        email=request.email,
        password=request.password,
        display_name=request.display_name,
    )
    
    # Set httpOnly cookie for web clients
    response.set_cookie(
        key="access_token",
        value=token,
        httponly=True,
        secure=True,
        samesite="lax",
        max_age=auth_service.get_token_expiration(),
    )
    
    return APIResponse.ok(
        AuthResponse(
            access_token=token,
            token_type="bearer",
            expires_in=auth_service.get_token_expiration(),
            user=UserResponse(
                id=user_data["id"],
                email=user_data.get("email"),
                display_name=user_data.get("display_name"),
                games_played=user_data.get("games_played", 0),
                games_won=user_data.get("games_won", 0),
                total_score=0,
            ),
        )
    )


@router.post(
    "/login",
    response_model=APIResponse[AuthResponse],
)
async def login(
    request: LoginRequest,
    response: Response,
    auth_service: AuthServiceDep,
):
    """
    Login with email and password.
    
    Authenticates via Supabase Auth and returns an access token.
    Token is also set as an httpOnly cookie for web clients.
    """
    token, user_data = await auth_service.login(
        email=request.email,
        password=request.password,
        totp_code=request.totp_code,
    )
    
    # Set httpOnly cookie
    response.set_cookie(
        key="access_token",
        value=token,
        httponly=True,
        secure=True,
        samesite="lax",
        max_age=auth_service.get_token_expiration(),
    )
    
    return APIResponse.ok(
        AuthResponse(
            access_token=token,
            token_type="bearer",
            expires_in=auth_service.get_token_expiration(),
            user=UserResponse(
                id=user_data["id"],
                email=user_data.get("email"),
                display_name=user_data.get("display_name"),
                games_played=user_data.get("games_played", 0),
                games_won=user_data.get("games_won", 0),
                total_score=0,
            ),
        )
    )


@router.post(
    "/logout",
    response_model=APIResponse[dict],
)
async def logout(
    response: Response,
    current_user: CurrentUser,
    auth_service: AuthServiceDep,
):
    """
    Logout current user.
    
    Invalidates the session and clears the auth cookie.
    """
    # Get token from cookie or header
    token = response.headers.get("Authorization", "").replace("Bearer ", "")
    await auth_service.logout(current_user.id, token)
    
    # Clear cookie
    response.delete_cookie(key="access_token")
    
    return APIResponse.ok({"message": "Logged out successfully"})


@router.get(
    "/me",
    response_model=APIResponse[UserResponse],
)
async def get_current_user_info(
    current_user: CurrentUser,
    auth_service: AuthServiceDep,
):
    """
    Get current authenticated user's information.
    """
    profile = await auth_service.get_user_profile(current_user.id)
    
    return APIResponse.ok(
        UserResponse(
            id=current_user.id,
            email=current_user.email,
            display_name=profile.get("display_name") if profile else None,
            avatar_url=profile.get("avatar_url") if profile else None,
            games_played=profile.get("games_played", 0) if profile else 0,
            games_won=profile.get("games_won", 0) if profile else 0,
            total_score=profile.get("total_score", 0) if profile else 0,
        )
    )


# ============================================
# Token Management Endpoints
# ============================================

@router.post(
    "/refresh",
    response_model=APIResponse[AuthResponse],
)
async def refresh_token(
    request: RefreshTokenRequest,
    response: Response,
    auth_service: AuthServiceDep,
):
    """
    Refresh access token using refresh token.
    """
    new_token = await auth_service.refresh_token(request.refresh_token)
    
    # Set new cookie
    response.set_cookie(
        key="access_token",
        value=new_token,
        httponly=True,
        secure=True,
        samesite="lax",
        max_age=auth_service.get_token_expiration(),
    )
    
    return APIResponse.ok(
        AuthResponse(
            access_token=new_token,
            token_type="bearer",
            expires_in=auth_service.get_token_expiration(),
            user=UserResponse(id="", email=None, display_name=None),
        )
    )


@router.get(
    "/validate",
    response_model=APIResponse[TokenValidationResponse],
)
async def validate_token(
    current_user: CurrentUser,
):
    """
    Validate current token and return status.
    """
    from datetime import datetime
    
    return APIResponse.ok(
        TokenValidationResponse(
            valid=True,
            user_id=current_user.id,
            expires_at=datetime.utcnow(),  # Would need actual exp from token
        )
    )


# ============================================
# Password Reset Endpoints
# ============================================

@router.post(
    "/password-reset",
    response_model=APIResponse[PasswordResetResponse],
)
async def request_password_reset(
    request: PasswordResetRequest,
    auth_service: AuthServiceDep,
):
    """
    Initiate password reset flow.
    
    Sends a password reset email with a time-limited token (15 minutes).
    Always returns success to prevent email enumeration.
    """
    await auth_service.initiate_password_reset(request.email)
    
    return APIResponse.ok(
        PasswordResetResponse(
            message="If the email exists, a reset link has been sent",
            expires_in_minutes=15,
        )
    )


@router.post(
    "/password-reset/confirm",
    response_model=APIResponse[dict],
)
async def confirm_password_reset(
    request: PasswordResetConfirm,
    auth_service: AuthServiceDep,
):
    """
    Complete password reset using token from email.
    """
    await auth_service.complete_password_reset(
        token=request.token,
        new_password=request.new_password,
    )
    
    return APIResponse.ok({"message": "Password reset successfully"})


# ============================================
# 2FA Endpoints
# ============================================

@router.post(
    "/2fa/enable",
    response_model=APIResponse[TwoFactorSetup],
)
async def enable_2fa(
    current_user: CurrentUser,
    auth_service: AuthServiceDep,
):
    """
    Enable 2FA for current user.
    
    Returns TOTP secret and QR code URL for authenticator app setup.
    User must verify with a code to complete setup.
    """
    setup = await auth_service.enable_2fa(current_user.id)
    return APIResponse.ok(setup)


@router.post(
    "/2fa/verify",
    response_model=APIResponse[TwoFactorStatus],
)
async def verify_2fa(
    request: TwoFactorVerify,
    current_user: CurrentUser,
    auth_service: AuthServiceDep,
):
    """
    Verify 2FA code and complete setup.
    
    Must be called after /2fa/enable with a valid TOTP code.
    """
    from datetime import datetime
    
    await auth_service.verify_2fa(current_user.id, request.code)
    
    return APIResponse.ok(
        TwoFactorStatus(
            enabled=True,
            enabled_at=datetime.utcnow(),
        )
    )


@router.delete(
    "/2fa/disable",
    response_model=APIResponse[TwoFactorStatus],
)
async def disable_2fa(
    request: TwoFactorVerify,
    current_user: CurrentUser,
    auth_service: AuthServiceDep,
):
    """
    Disable 2FA for current user.
    
    Requires valid TOTP code to confirm.
    """
    # Verify code first
    profile = await auth_service.get_user_profile(current_user.id)
    if profile and profile.get("two_factor_secret"):
        if not auth_service._verify_totp(profile["two_factor_secret"], request.code):
            from app.core.exceptions import AuthenticationError
            raise AuthenticationError("Invalid 2FA code")
    
    # Disable 2FA
    await auth_service.user_repo.update_profile(current_user.id, {
        "two_factor_enabled": False,
        "two_factor_secret": None,
    })
    
    return APIResponse.ok(
        TwoFactorStatus(
            enabled=False,
            enabled_at=None,
        )
    )
