"""
Authentication service.
Handles user registration, login, token management, 2FA, and password reset.
Requirements: 1.1, 1.2, 1.7, 1.8, 1.9, 1.10
"""

import os
import secrets
import hashlib
from datetime import datetime, timedelta
from typing import Optional, Tuple, List, Set

import bcrypt
import jwt
import pyotp
from supabase import Client

from app.core.exceptions import AuthenticationError, ValidationError
from app.database.repositories.user_repo import UserRepository
from app.database.supabase_client import get_supabase_service_client
from app.middleware.auth import get_token_expiration_seconds
from app.services.base import BaseService
from app.schemas.auth import TwoFactorSetup, TokenPayload


# Token blacklist (in production, use Redis)
_token_blacklist: Set[str] = set()

# Password reset tokens (in production, use database)
_reset_tokens: dict = {}


def get_private_key() -> str:
    """Get RS256 private key from environment or file."""
    key = os.getenv("JWT_PRIVATE_KEY")
    if key:
        return key.replace("\\n", "\n")
    key_path = os.getenv("JWT_PRIVATE_KEY_PATH", "keys/private.pem")
    if os.path.exists(key_path):
        with open(key_path, "r") as f:
            return f.read()
    # Fallback for development - generate a simple key
    return os.getenv("JWT_SECRET", "dev-secret-key-change-in-production")


def get_public_key() -> str:
    """Get RS256 public key from environment or file."""
    key = os.getenv("JWT_PUBLIC_KEY")
    if key:
        return key.replace("\\n", "\n")
    key_path = os.getenv("JWT_PUBLIC_KEY_PATH", "keys/public.pem")
    if os.path.exists(key_path):
        with open(key_path, "r") as f:
            return f.read()
    return os.getenv("JWT_SECRET", "dev-secret-key-change-in-production")


def hash_password(password: str) -> str:
    """Hash password using bcrypt with cost factor 12."""
    salt = bcrypt.gensalt(rounds=12)
    # bcrypt has 72-byte limit, truncate if needed
    password_bytes = password.encode('utf-8')[:72]
    return bcrypt.hashpw(password_bytes, salt).decode('utf-8')


def verify_password(password: str, hashed: str) -> bool:
    """Verify password against bcrypt hash."""
    # bcrypt has 72-byte limit, truncate to match hashing
    password_bytes = password.encode('utf-8')[:72]
    return bcrypt.checkpw(password_bytes, hashed.encode('utf-8'))


def create_rs256_token(user_id: str, email: str, token_type: str = "access") -> str:
    """Create JWT token signed with RS256."""
    now = datetime.utcnow()
    exp_hours = 24 if token_type == "access" else 168  # 7 days for refresh
    
    payload = {
        "sub": user_id,
        "email": email,
        "iat": int(now.timestamp()),
        "exp": int((now + timedelta(hours=exp_hours)).timestamp()),
        "type": token_type,
    }
    
    private_key = get_private_key()
    # Use RS256 if we have a proper key, otherwise fall back to HS256
    algorithm = "RS256" if "BEGIN" in private_key else "HS256"
    
    return jwt.encode(payload, private_key, algorithm=algorithm)


def decode_token(token: str) -> TokenPayload:
    """Decode and validate JWT token."""
    public_key = get_public_key()
    # Try both algorithms - RS256 for production, HS256 for dev
    algorithms = ["RS256", "HS256"]
    
    try:
        # Allow small leeway for clock skew
        payload = jwt.decode(
            token, 
            public_key, 
            algorithms=algorithms,
            options={"verify_iat": False}  # Don't fail on iat timing
        )
        return TokenPayload(**payload)
    except jwt.ExpiredSignatureError:
        raise AuthenticationError("Token has expired")
    except jwt.InvalidTokenError as e:
        raise AuthenticationError(f"Invalid token: {str(e)}")


class AuthService(BaseService):
    """Service for authentication operations with RS256 JWT and 2FA support."""

    BCRYPT_COST = 12
    RESET_TOKEN_EXPIRY_MINUTES = 15

    def __init__(self, client: Client):
        super().__init__(client)
        service_client = get_supabase_service_client()
        self.user_repo = UserRepository(service_client)

    async def register(
        self,
        email: str,
        password: str,
        display_name: Optional[str] = None,
    ) -> Tuple[str, dict]:
        """
        Register a new user via Supabase Auth.
        
        Args:
            email: User email
            password: User password
            display_name: Optional display name
            
        Returns:
            Tuple of (access_token, user_data)
            
        Raises:
            ValidationError: If registration fails
        """
        try:
            # Use service client for admin operations
            service_client = get_supabase_service_client()
            
            # Register with Supabase Auth using admin API to auto-confirm
            response = service_client.auth.admin.create_user({
                "email": email,
                "password": password,
                "email_confirm": True,  # Auto-confirm email
                "user_metadata": {"display_name": display_name}
            })
            
            if not response.user:
                raise ValidationError("Registration failed")
            
            user_id = response.user.id
            
            # Create RS256 JWT token
            token = create_rs256_token(user_id, email)
            
            # Get or create user profile
            profile = await self.user_repo.get_by_id(user_id)
            if not profile:
                profile = await self.user_repo.create_profile(
                    user_id=user_id,
                    display_name=display_name or email.split("@")[0],
                )
            
            return token, {
                "id": user_id,
                "email": email,
                "display_name": profile.get("display_name"),
                "games_played": profile.get("games_played", 0),
                "games_won": profile.get("games_won", 0),
            }
            
        except Exception as e:
            if "already registered" in str(e).lower():
                raise ValidationError("Email already registered")
            raise ValidationError(f"Registration failed: {str(e)}")

    async def login(
        self, 
        email: str, 
        password: str,
        totp_code: Optional[str] = None
    ) -> Tuple[str, dict]:
        """
        Login user via Supabase Auth with optional 2FA.
        
        Args:
            email: User email
            password: User password
            totp_code: Optional 2FA TOTP code
            
        Returns:
            Tuple of (access_token, user_data)
            
        Raises:
            AuthenticationError: If login fails or 2FA required
        """
        try:
            response = self.client.auth.sign_in_with_password({
                "email": email,
                "password": password,
            })
            
            if not response.user:
                raise AuthenticationError("Invalid credentials")
            
            user_id = response.user.id
            
            # Get user profile to check 2FA status
            profile = await self.user_repo.get_by_id(user_id)
            
            # Check if 2FA is enabled
            if profile and profile.get("two_factor_enabled"):
                if not totp_code:
                    raise AuthenticationError("2FA code required", code="2FA_REQUIRED")
                
                # Verify TOTP code
                secret = profile.get("two_factor_secret")
                if not self._verify_totp(secret, totp_code):
                    raise AuthenticationError("Invalid 2FA code")
            
            # Create RS256 JWT token
            token = create_rs256_token(user_id, email)
            
            return token, {
                "id": user_id,
                "email": email,
                "display_name": profile.get("display_name") if profile else None,
                "games_played": profile.get("games_played", 0) if profile else 0,
                "games_won": profile.get("games_won", 0) if profile else 0,
            }
            
        except AuthenticationError:
            raise
        except Exception:
            raise AuthenticationError("Invalid credentials")

    async def logout(self, user_id: str, token: str) -> bool:
        """
        Logout user and blacklist token.
        
        Args:
            user_id: User UUID
            token: JWT token to invalidate
            
        Returns:
            True if successful
        """
        try:
            # Add token to blacklist
            token_hash = hashlib.sha256(token.encode()).hexdigest()
            _token_blacklist.add(token_hash)
            
            self.client.auth.sign_out()
            return True
        except Exception:
            return True

    async def validate_token(self, token: str) -> TokenPayload:
        """
        Validate JWT token and check blacklist.
        
        Args:
            token: JWT token
            
        Returns:
            TokenPayload if valid
            
        Raises:
            AuthenticationError: If token invalid or blacklisted
        """
        # Check blacklist
        token_hash = hashlib.sha256(token.encode()).hexdigest()
        if token_hash in _token_blacklist:
            raise AuthenticationError("Token has been invalidated")
        
        return decode_token(token)

    async def refresh_token(self, refresh_token: str) -> str:
        """
        Generate new access token from refresh token.
        
        Args:
            refresh_token: Valid refresh token
            
        Returns:
            New access token
        """
        payload = await self.validate_token(refresh_token)
        if payload.type != "refresh":
            raise AuthenticationError("Invalid refresh token")
        
        return create_rs256_token(payload.sub, payload.email or "", "access")

    # ============================================
    # 2FA Methods
    # ============================================

    async def enable_2fa(self, user_id: str) -> TwoFactorSetup:
        """
        Generate TOTP secret and QR code for 2FA setup.
        
        Args:
            user_id: User UUID
            
        Returns:
            TwoFactorSetup with secret and QR code
        """
        profile = await self.user_repo.get_by_id(user_id)
        if not profile:
            raise ValidationError("User not found")
        
        email = profile.get("display_name", "user")
        
        # Generate TOTP secret
        secret = pyotp.random_base32()
        
        # Generate provisioning URI for QR code
        totp = pyotp.TOTP(secret)
        provisioning_uri = totp.provisioning_uri(
            name=email,
            issuer_name="1v1bro"
        )
        
        # Generate backup codes
        backup_codes = [secrets.token_hex(4).upper() for _ in range(8)]
        
        # Store secret temporarily (user must verify to enable)
        await self.user_repo.update_profile(user_id, {
            "two_factor_secret": secret,
            "two_factor_enabled": False,
        })
        
        return TwoFactorSetup(
            secret=secret,
            qr_code_url=provisioning_uri,
            backup_codes=backup_codes
        )

    async def verify_2fa(self, user_id: str, code: str) -> bool:
        """
        Verify TOTP code and enable 2FA.
        
        Args:
            user_id: User UUID
            code: 6-digit TOTP code
            
        Returns:
            True if verified and enabled
        """
        profile = await self.user_repo.get_by_id(user_id)
        if not profile:
            raise ValidationError("User not found")
        
        secret = profile.get("two_factor_secret")
        if not secret:
            raise ValidationError("2FA not initialized")
        
        if not self._verify_totp(secret, code):
            raise AuthenticationError("Invalid 2FA code")
        
        # Enable 2FA
        await self.user_repo.update_profile(user_id, {
            "two_factor_enabled": True,
        })
        
        return True

    def _verify_totp(self, secret: str, code: str) -> bool:
        """Verify TOTP code against secret."""
        totp = pyotp.TOTP(secret)
        return totp.verify(code, valid_window=1)

    # ============================================
    # Password Reset Methods
    # ============================================

    async def initiate_password_reset(self, email: str) -> bool:
        """
        Send password reset email with time-limited token.
        
        Args:
            email: User email
            
        Returns:
            True (always, to prevent email enumeration)
        """
        # Generate reset token
        token = secrets.token_urlsafe(32)
        expiry = datetime.utcnow() + timedelta(minutes=self.RESET_TOKEN_EXPIRY_MINUTES)
        
        # Store token (in production, use database)
        _reset_tokens[token] = {
            "email": email,
            "expires_at": expiry,
        }
        
        # In production, send email here
        # For now, just log it
        print(f"Password reset token for {email}: {token}")
        
        return True

    async def complete_password_reset(self, token: str, new_password: str) -> bool:
        """
        Reset password using valid reset token.
        
        Args:
            token: Password reset token
            new_password: New password
            
        Returns:
            True if successful
        """
        token_data = _reset_tokens.get(token)
        if not token_data:
            raise ValidationError("Invalid or expired reset token")
        
        if datetime.utcnow() > token_data["expires_at"]:
            del _reset_tokens[token]
            raise ValidationError("Reset token has expired")
        
        email = token_data["email"]
        
        # Update password via Supabase
        try:
            service_client = get_supabase_service_client()
            # Get user by email
            users = service_client.auth.admin.list_users()
            user = next((u for u in users if u.email == email), None)
            
            if user:
                service_client.auth.admin.update_user_by_id(
                    user.id,
                    {"password": new_password}
                )
        except Exception as e:
            raise ValidationError(f"Failed to reset password: {str(e)}")
        
        # Remove used token
        del _reset_tokens[token]
        
        return True

    async def get_user_profile(self, user_id: str) -> Optional[dict]:
        """Get user profile by ID."""
        return await self.user_repo.get_by_id(user_id)

    def get_token_expiration(self) -> int:
        """Get token expiration time in seconds."""
        return get_token_expiration_seconds()
