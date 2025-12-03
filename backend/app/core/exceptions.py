"""
Custom exception hierarchy for the application.
All exceptions inherit from AppException for consistent error handling.
"""

from typing import Any, Optional


class AppException(Exception):
    """
    Base exception for all application errors.
    Provides consistent structure for error responses.
    """

    def __init__(
        self,
        message: str,
        status_code: int = 500,
        error_code: str = "INTERNAL_ERROR",
        details: Optional[Any] = None,
    ):
        self.message = message
        self.status_code = status_code
        self.error_code = error_code
        self.details = details
        super().__init__(message)

    def __repr__(self) -> str:
        return f"{self.__class__.__name__}(message={self.message!r}, status_code={self.status_code})"


class AuthenticationError(AppException):
    """Raised when authentication fails."""

    def __init__(
        self,
        message: str = "Authentication failed",
        details: Optional[Any] = None,
    ):
        super().__init__(
            message=message,
            status_code=401,
            error_code="AUTH_ERROR",
            details=details,
        )


class AuthorizationError(AppException):
    """Raised when user lacks permission for an action."""

    def __init__(
        self,
        message: str = "Not authorized",
        details: Optional[Any] = None,
    ):
        super().__init__(
            message=message,
            status_code=403,
            error_code="FORBIDDEN",
            details=details,
        )


class NotFoundError(AppException):
    """Raised when a requested resource is not found."""

    def __init__(
        self,
        resource: str,
        identifier: str,
    ):
        super().__init__(
            message=f"{resource} not found: {identifier}",
            status_code=404,
            error_code="NOT_FOUND",
            details={"resource": resource, "identifier": identifier},
        )


class ValidationError(AppException):
    """Raised when input validation fails."""

    def __init__(
        self,
        message: str,
        details: Optional[Any] = None,
    ):
        super().__init__(
            message=message,
            status_code=422,
            error_code="VALIDATION_ERROR",
            details=details,
        )


class LobbyFullError(AppException):
    """Raised when attempting to join a full lobby."""

    def __init__(self, lobby_code: str):
        super().__init__(
            message=f"Lobby {lobby_code} is full",
            status_code=409,
            error_code="LOBBY_FULL",
            details={"lobby_code": lobby_code},
        )


class GameStateError(AppException):
    """Raised when an action is invalid for the current game state."""

    def __init__(self, message: str, details: Optional[Any] = None):
        super().__init__(
            message=message,
            status_code=409,
            error_code="GAME_STATE_ERROR",
            details=details,
        )


class LobbyNotFoundError(NotFoundError):
    """Raised when a lobby is not found."""

    def __init__(self, code: str):
        super().__init__(resource="Lobby", identifier=code)


class GameNotFoundError(NotFoundError):
    """Raised when a game is not found."""

    def __init__(self, game_id: str):
        super().__init__(resource="Game", identifier=game_id)


class UserNotFoundError(NotFoundError):
    """Raised when a user is not found."""

    def __init__(self, user_id: str):
        super().__init__(resource="User", identifier=user_id)
