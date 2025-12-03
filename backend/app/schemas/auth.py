"""
Authentication schemas.
"""

from typing import Optional

from pydantic import EmailStr, Field

from app.schemas.base import BaseSchema, TimestampMixin


class LoginRequest(BaseSchema):
    """Request schema for user login."""

    email: EmailStr = Field(..., description="User email address")
    password: str = Field(..., min_length=6, description="User password")


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
    """JWT token payload schema."""

    sub: str = Field(..., description="Subject (user ID)")
    email: Optional[str] = Field(None, description="User email")
    exp: int = Field(..., description="Expiration timestamp")
    iat: int = Field(..., description="Issued at timestamp")
    type: str = Field(default="access", description="Token type")


# Update forward reference
AuthResponse.model_rebuild()
