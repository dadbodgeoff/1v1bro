"""
Authentication middleware.
JWT + Supabase auth with RS256 support, token blacklist, and request tracing.
Requirements: 1.2, 1.6, 7.8
"""

import hashlib
import uuid
from datetime import datetime, timedelta
from typing import Optional, NamedTuple, Set

from fastapi import Depends, Request
from jose import jwt, JWTError
from starlette.middleware.base import BaseHTTPMiddleware

from app.core.config import get_settings
from app.core.exceptions import AuthenticationError
from app.database.supabase_client import get_supabase_client


settings = get_settings()

# Token blacklist (in production, use Redis via cache_manager)
_token_blacklist: Set[str] = set()


class AuthenticatedUser(NamedTuple):
    """Authenticated user context."""
    id: str
    email: Optional[str] = None


def add_to_blacklist(token: str) -> None:
    """Add token to blacklist. Requirements: 1.6"""
    token_hash = hashlib.sha256(token.encode()).hexdigest()
    _token_blacklist.add(token_hash)


def is_blacklisted(token: str) -> bool:
    """Check if token is blacklisted. Requirements: 1.6"""
    token_hash = hashlib.sha256(token.encode()).hexdigest()
    return token_hash in _token_blacklist


def clear_blacklist() -> None:
    """Clear blacklist (for testing)."""
    _token_blacklist.clear()


def _get_public_key() -> str:
    """Get RS256 public key or fallback to secret."""
    import os
    key = os.getenv("JWT_PUBLIC_KEY")
    if key:
        return key.replace("\\n", "\n")
    key_path = os.getenv("JWT_PUBLIC_KEY_PATH", "keys/public.pem")
    if os.path.exists(key_path):
        with open(key_path, "r") as f:
            return f.read()
    return settings.JWT_SECRET_KEY


async def get_current_user(
    request: Request,
    supabase=Depends(get_supabase_client),
) -> AuthenticatedUser:
    """
    Extract and validate JWT token from httpOnly cookie or Authorization header.
    Supports RS256 and HS256, with token blacklist checking.
    
    Requirements: 1.2 - RS256 JWT verification
    Requirements: 1.6 - Token blacklist checking
    Requirements: 7.8 - Request tracing with X-Request-ID
    
    Args:
        request: FastAPI request object
        supabase: Supabase client (injected)
        
    Returns:
        AuthenticatedUser with user ID and email
        
    Raises:
        AuthenticationError: If token is missing, invalid, blacklisted, or expired
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
    
    # Check token blacklist (Requirements: 1.6)
    if is_blacklisted(token):
        raise AuthenticationError("Token has been invalidated")
    
    try:
        # Get public key for RS256 or secret for HS256
        public_key = _get_public_key()
        
        # Try both algorithms - RS256 for production, HS256 for dev
        algorithms = ["RS256", "HS256"] if "BEGIN" in public_key else [settings.JWT_ALGORITHM]
        
        payload = jwt.decode(
            token,
            public_key,
            algorithms=algorithms,
            options={"verify_iat": False}  # Allow clock skew
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


class RequestTracingMiddleware(BaseHTTPMiddleware):
    """
    Middleware to add X-Request-ID header for request tracing.
    Requirements: 7.8
    """
    
    async def dispatch(self, request: Request, call_next):
        # Get or generate request ID
        request_id = request.headers.get("X-Request-ID")
        if not request_id:
            request_id = str(uuid.uuid4())
        
        # Store in request state for logging
        request.state.request_id = request_id
        
        # Process request
        response = await call_next(request)
        
        # Add request ID to response headers
        response.headers["X-Request-ID"] = request_id
        
        return response
