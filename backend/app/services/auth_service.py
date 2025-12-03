"""
Authentication service.
Handles user registration, login, and token management.
"""

from typing import Optional, Tuple

from supabase import Client

from app.core.exceptions import AuthenticationError, ValidationError
from app.database.repositories.user_repo import UserRepository
from app.database.supabase_client import get_supabase_service_client
from app.middleware.auth import create_jwt_token, get_token_expiration_seconds
from app.services.base import BaseService


class AuthService(BaseService):
    """Service for authentication operations."""

    def __init__(self, client: Client):
        super().__init__(client)
        # Use service client for profile operations (bypasses RLS)
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
            
            # Create JWT token
            token = create_jwt_token(user_id, email)
            
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

    async def login(self, email: str, password: str) -> Tuple[str, dict]:
        """
        Login user via Supabase Auth.
        
        Args:
            email: User email
            password: User password
            
        Returns:
            Tuple of (access_token, user_data)
            
        Raises:
            AuthenticationError: If login fails
        """
        try:
            response = self.client.auth.sign_in_with_password({
                "email": email,
                "password": password,
            })
            
            if not response.user:
                raise AuthenticationError("Invalid credentials")
            
            user_id = response.user.id
            
            # Create our own JWT token
            token = create_jwt_token(user_id, email)
            
            # Get user profile
            profile = await self.user_repo.get_by_id(user_id)
            
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
            # Don't reveal whether email or password was wrong
            raise AuthenticationError("Invalid credentials")

    async def logout(self, user_id: str) -> bool:
        """
        Logout user (invalidate session on Supabase side).
        
        Args:
            user_id: User UUID
            
        Returns:
            True if successful
        """
        try:
            self.client.auth.sign_out()
            return True
        except Exception:
            return True  # Consider logout successful even if Supabase fails

    async def get_user_profile(self, user_id: str) -> Optional[dict]:
        """
        Get user profile by ID.
        
        Args:
            user_id: User UUID
            
        Returns:
            User profile dict or None
        """
        return await self.user_repo.get_by_id(user_id)

    def get_token_expiration(self) -> int:
        """Get token expiration time in seconds."""
        return get_token_expiration_seconds()
