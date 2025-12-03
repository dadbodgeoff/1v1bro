"""
Authentication middleware.
JWT + Supabase auth with support for both cookie and Authorization header.
"""

from datetime import datetime, timedelta
from typing import Optional, NamedTuple

from fastapi import Depends, Request
from jose import jwt, JWTError

from app.core.config import get_settings
from app.core.exceptions import AuthenticationError
from app.database.supabase_client import get_supabase_client


settings = get_settings()


class AuthenticatedUser(NamedTuple):
    """Authenticated user context."""
    id: str
    email: Optional[str] = None


async def get_current_user(
    request: Request,
    supabase=Depends(get_supabase_client),
) -> AuthenticatedUser:
    """
    Extract and validate JWT token from httpOnly cookie or Authorization header.
    Supports both methods for flexibility.
    
    Args:
        request: FastAPI request object
        supabase: Supabase client (injected)
        
    Returns:
        AuthenticatedUser with user ID and email
        
    Raises:
        AuthenticationError: If token is missing, invalid, or expired
    """
    token = None
    
    # Try cookie first (secure method for web)
    token = request.cookies.get("access_token")
    
    # Fallback to Authorization header (for API clients)
    if not token:
        authorization = request.headers.get("Authorization")
        if authorization and authorization.startswith("Bearer "):
            token = authorization.split(" ")[1]
    
    if not token:
        raise AuthenticationError("Not authenticated")
    
    try:
        payload = jwt.decode(
            token,
            settings.JWT_SECRET_KEY,
            algorithms=[settings.JWT_ALGORITHM],
        )
        
        user_id: Optional[str] = payload.get("sub")
        email: Optional[str] = payload.get("email")
        
        if user_id is None:
            raise AuthenticationError("Invalid authentication token")
        
        # Verify token expiration
        exp = payload.get("exp")
        if exp and datetime.utcnow().timestamp() > exp:
            raise AuthenticationError("Token has expired")
        
        auth_user = AuthenticatedUser(id=user_id, email=email)
        request.state.user = auth_user
        return auth_user
        
    except JWTError:
        raise AuthenticationError("Invalid authentication token")


async def get_current_user_optional(
    request: Request,
    supabase=Depends(get_supabase_client),
) -> Optional[AuthenticatedUser]:
    """
    Try to get current user without requiring authentication.
    Returns None if not authenticated instead of raising an error.
    """
    try:
        return await get_current_user(request, supabase)
    except AuthenticationError:
        return None


def create_jwt_token(user_id: str, email: Optional[str] = None) -> str:
    """
    Create a JWT token for the user.
    
    Args:
        user_id: User UUID
        email: User email (optional)
        
    Returns:
        Encoded JWT token string
    """
    expire = datetime.utcnow() + timedelta(hours=settings.JWT_EXPIRATION_HOURS)
    to_encode = {
        "sub": user_id,
        "email": email,
        "exp": expire,
        "iat": datetime.utcnow(),
        "type": "access",
    }
    return jwt.encode(
        to_encode,
        settings.JWT_SECRET_KEY,
        algorithm=settings.JWT_ALGORITHM,
    )


def decode_jwt_token(token: str) -> dict:
    """
    Decode and validate a JWT token.
    
    Args:
        token: JWT token string
        
    Returns:
        Decoded token payload
        
    Raises:
        AuthenticationError: If token is invalid
    """
    try:
        payload = jwt.decode(
            token,
            settings.JWT_SECRET_KEY,
            algorithms=[settings.JWT_ALGORITHM],
        )
        return payload
    except JWTError:
        raise AuthenticationError("Invalid token")


def get_token_expiration_seconds() -> int:
    """Get token expiration time in seconds."""
    return settings.JWT_EXPIRATION_HOURS * 3600
