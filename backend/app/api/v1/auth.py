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
    await auth_service.logout(current_user.id)
    
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
