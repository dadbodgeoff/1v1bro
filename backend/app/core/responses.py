"""
Standardized API response models.
All API endpoints return responses wrapped in APIResponse for consistency.
"""

from typing import Any, Generic, Optional, TypeVar

from pydantic import BaseModel, Field

T = TypeVar("T")


class APIResponse(BaseModel, Generic[T]):
    """
    Generic API response envelope.
    
    All API responses follow this structure:
    - success: bool indicating if the request succeeded
    - data: the response payload (on success)
    - error: human-readable error message (on failure)
    - error_code: machine-readable error code (on failure)
    - details: additional error context (on failure)
    """

    success: bool = Field(..., description="Whether the request succeeded")
    data: Optional[T] = Field(default=None, description="Response payload")
    error: Optional[str] = Field(default=None, description="Error message")
    error_code: Optional[str] = Field(default=None, description="Machine-readable error code")
    details: Optional[Any] = Field(default=None, description="Additional error details")

    @classmethod
    def ok(cls, data: T) -> "APIResponse[T]":
        """Create a successful response with data."""
        return cls(success=True, data=data)

    @classmethod
    def fail(
        cls,
        error: str,
        error_code: str = "ERROR",
        details: Optional[Any] = None,
    ) -> "APIResponse[None]":
        """Create a failure response with error information."""
        return cls(
            success=False,
            error=error,
            error_code=error_code,
            details=details,
        )

    model_config = {
        "json_schema_extra": {
            "examples": [
                {
                    "success": True,
                    "data": {"id": "123", "name": "Example"},
                    "error": None,
                    "error_code": None,
                    "details": None,
                },
                {
                    "success": False,
                    "data": None,
                    "error": "Resource not found",
                    "error_code": "NOT_FOUND",
                    "details": {"resource": "Lobby", "identifier": "ABC123"},
                },
            ]
        }
    }


class PaginatedResponse(BaseModel, Generic[T]):
    """Response model for paginated data."""

    items: list[T] = Field(..., description="List of items")
    total: int = Field(..., description="Total number of items")
    page: int = Field(..., description="Current page number")
    page_size: int = Field(..., description="Items per page")
    has_more: bool = Field(..., description="Whether more pages exist")
