"""
Global exception handler middleware.
Maps AppException hierarchy to JSON responses.
"""

from fastapi import Request
from fastapi.responses import JSONResponse

from app.core.exceptions import AppException
from app.core.responses import APIResponse


async def app_exception_handler(request: Request, exc: AppException) -> JSONResponse:
    """
    Handle AppException and return standardized JSON response.
    
    Args:
        request: FastAPI request object
        exc: AppException instance
        
    Returns:
        JSONResponse with error details
    """
    return JSONResponse(
        status_code=exc.status_code,
        content=APIResponse.fail(
            error=exc.message,
            error_code=exc.error_code,
            details=exc.details,
        ).model_dump(),
    )


async def generic_exception_handler(request: Request, exc: Exception) -> JSONResponse:
    """
    Handle unexpected exceptions.
    
    Args:
        request: FastAPI request object
        exc: Exception instance
        
    Returns:
        JSONResponse with generic error
    """
    return JSONResponse(
        status_code=500,
        content=APIResponse.fail(
            error="An unexpected error occurred",
            error_code="INTERNAL_ERROR",
        ).model_dump(),
    )
