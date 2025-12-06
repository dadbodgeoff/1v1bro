"""
Authentication schemas.
Requirements: 1.5, 1.8, 1.10
"""

from datetime import datetime
from typing import Optional, List

from pydantic import EmailStr, Field, field_validator

from app.schemas.base import BaseSchema, TimestampMixin


class LoginRequest(BaseSchema):
    """Request schema for user login."""

    email: EmailStr = Field(..., description="User email address")
    password: str = Field(..., min_length=6, description="User password")
    totp_code: Optional[str] = Field(None, min_length=6, max_length=6, description="2FA TOTP code")


class RegisterRequest(BaseSchema):
    """Request schema for user registration."""

    email: EmailStr = Field(..., description="User email address")
    password: str = Field(..., min_length=6, description="User password")
    display_name: Optional[str] = Field(
        None,
        min_length=2,
        max_length=50,
        description="Display name for the user",
    )


class AuthResponse(BaseSchema):
    """Response schema for authentication operations."""

    access_token: str = Field(..., description="JWT access token")
    token_type: str = Field(default="bearer", description="Token type")
    expires_in: int = Field(..., description="Token expiration in seconds")
    user: "UserResponse" = Field(..., description="Authenticated user info")


class UserResponse(BaseSchema, TimestampMixin):
    """Response schema for user information."""

    id: str = Field(..., description="User UUID")
    email: Optional[str] = Field(None, description="User email")
    display_name: Optional[str] = Field(None, description="Display name")
    avatar_url: Optional[str] = Field(None, description="Avatar URL")
    games_played: int = Field(default=0, description="Total games played")
    games_won: int = Field(default=0, description="Total games won")
    total_score: int = Field(default=0, description="Cumulative score")


class TokenPayload(BaseSchema):
    """JWT token payload schema with RS256 claims."""

    sub: str = Field(..., description="Subject (user ID)")
    email: Optional[str] = Field(None, description="User email")
    exp: int = Field(..., description="Expiration timestamp")
    iat: int = Field(..., description="Issued at timestamp")
    type: str = Field(default="access", description="Token type")
    alg: str = Field(default="RS256", description="Algorithm used for signing")


# ============================================
# 2FA Schemas
# ============================================

class TwoFactorSetup(BaseSchema):
    """Response for 2FA setup initiation."""
    
    secret: str = Field(..., description="TOTP secret key (base32 encoded)")
    qr_code_url: str = Field(..., description="URL for QR code image")
    backup_codes: List[str] = Field(..., description="One-time backup codes")


class TwoFactorVerify(BaseSchema):
    """Request to verify and enable 2FA."""
    
    code: str = Field(..., min_length=6, max_length=6, description="6-digit TOTP code")


class TwoFactorStatus(BaseSchema):
    """Response for 2FA status check."""
    
    enabled: bool = Field(..., description="Whether 2FA is enabled")
    enabled_at: Optional[datetime] = Field(None, description="When 2FA was enabled")


# ============================================
# Password Reset Schemas
# ============================================

class PasswordResetRequest(BaseSchema):
    """Request to initiate password reset."""
    
    email: EmailStr = Field(..., description="Email address for password reset")


class PasswordResetConfirm(BaseSchema):
    """Request to complete password reset."""
    
    token: str = Field(..., description="Password reset token from email")
    new_password: str = Field(..., min_length=8, description="New password")
    
    @field_validator('new_password')
    @classmethod
    def validate_password_strength(cls, v: str) -> str:
        """Validate password meets security requirements."""
        if not any(c.isupper() for c in v):
            raise ValueError('Password must contain at least one uppercase letter')
        if not any(c.islower() for c in v):
            raise ValueError('Password must contain at least one lowercase letter')
        if not any(c.isdigit() for c in v):
            raise ValueError('Password must contain at least one number')
        if not any(c in '!@#$%^&*()_+-=[]{}|;:,.<>?' for c in v):
            raise ValueError('Password must contain at least one special character')
        return v


class PasswordResetResponse(BaseSchema):
    """Response for password reset initiation."""
    
    message: str = Field(default="If the email exists, a reset link has been sent")
    expires_in_minutes: int = Field(default=15, description="Token expiration time")


# ============================================
# Token Refresh Schemas
# ============================================

class RefreshTokenRequest(BaseSchema):
    """Request to refresh access token."""
    
    refresh_token: str = Field(..., description="Refresh token")


class TokenValidationResponse(BaseSchema):
    """Response for token validation."""
    
    valid: bool = Field(..., description="Whether token is valid")
    user_id: Optional[str] = Field(None, description="User ID if valid")
    expires_at: Optional[datetime] = Field(None, description="Token expiration time")


# Update forward reference
AuthResponse.model_rebuild()
