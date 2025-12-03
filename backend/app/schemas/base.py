"""
Base schema classes for Pydantic models.
"""

from datetime import datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict


class BaseSchema(BaseModel):
    """
    Base schema with common configuration.
    All schemas should inherit from this class.
    """

    model_config = ConfigDict(
        from_attributes=True,  # Enable ORM mode for SQLAlchemy/Supabase
        populate_by_name=True,  # Allow population by field name or alias
        str_strip_whitespace=True,  # Strip whitespace from strings
    )


class TimestampMixin(BaseModel):
    """Mixin for models with timestamp fields."""

    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None


class IDMixin(BaseModel):
    """Mixin for models with UUID id field."""

    id: str
