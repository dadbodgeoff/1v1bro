"""
Admin Cosmetic schemas for CMS operations.
Requirements: 2.1, 2.2, 6.1, 6.2
"""

from datetime import datetime
from typing import Optional, List
from pydantic import Field, field_validator

from app.schemas.base import BaseSchema
from app.schemas.cosmetic import CosmeticType, Rarity


class CosmeticCreateRequest(BaseSchema):
    """
    Schema for creating a new cosmetic via Admin API.
    
    Property 9: Required field validation - validates required fields.
    """
    
    name: str = Field(..., min_length=1, max_length=100)
    type: CosmeticType
    rarity: Rarity
    description: Optional[str] = Field(None, max_length=500)
    image_url: str = Field(..., min_length=1)
    sprite_sheet_url: Optional[str] = None
    sprite_meta_url: Optional[str] = None
    preview_video_url: Optional[str] = None
    price_coins: int = Field(..., ge=0)
    price_premium: Optional[int] = Field(None, ge=0)
    event: Optional[str] = Field(None, max_length=50)
    is_limited: bool = False
    is_featured: bool = False
    available_from: Optional[datetime] = None
    available_until: Optional[datetime] = None
    skin_id: Optional[str] = Field(None, max_length=50)
    rotation_group: Optional[str] = Field(None, max_length=50)
    sort_order: int = Field(default=0)
    
    @field_validator('available_until')
    @classmethod
    def validate_dates(cls, v, info):
        """Ensure available_until is after available_from if both set."""
        if v and info.data.get('available_from'):
            if v <= info.data['available_from']:
                raise ValueError('available_until must be after available_from')
        return v


class CosmeticUpdateRequest(BaseSchema):
    """
    Schema for updating a cosmetic via Admin API.
    
    Property 6: Partial update - all fields optional.
    """
    
    name: Optional[str] = Field(None, min_length=1, max_length=100)
    description: Optional[str] = Field(None, max_length=500)
    image_url: Optional[str] = None
    sprite_sheet_url: Optional[str] = None
    sprite_meta_url: Optional[str] = None
    preview_video_url: Optional[str] = None
    price_coins: Optional[int] = Field(None, ge=0)
    price_premium: Optional[int] = Field(None, ge=0)
    event: Optional[str] = Field(None, max_length=50)
    is_limited: Optional[bool] = None
    is_featured: Optional[bool] = None
    available_from: Optional[datetime] = None
    available_until: Optional[datetime] = None
    skin_id: Optional[str] = Field(None, max_length=50)
    rotation_group: Optional[str] = Field(None, max_length=50)
    sort_order: Optional[int] = None


class AssetUploadResponse(BaseSchema):
    """Response after uploading an asset."""
    
    success: bool
    public_url: Optional[str] = None
    storage_path: Optional[str] = None
    asset_type: Optional[str] = None
    content_type: Optional[str] = None
    file_size: Optional[int] = None
    width: Optional[int] = None
    height: Optional[int] = None
    frame_count: Optional[int] = None
    error_message: Optional[str] = None


class AdminCosmeticResponse(BaseSchema):
    """Full cosmetic response for admin view."""
    
    id: str
    name: str
    type: CosmeticType
    rarity: Rarity
    description: Optional[str] = None
    image_url: str
    sprite_sheet_url: Optional[str] = None
    sprite_meta_url: Optional[str] = None
    preview_video_url: Optional[str] = None
    price_coins: int
    price_premium: Optional[int] = None
    release_date: Optional[datetime] = None
    event: Optional[str] = None
    is_limited: bool = False
    is_featured: bool = False
    available_from: Optional[datetime] = None
    available_until: Optional[datetime] = None
    skin_id: Optional[str] = None
    rotation_group: Optional[str] = None
    sort_order: int = 0
    owned_by_count: int = 0
    created_at: Optional[datetime] = None


class AdminCosmeticListResponse(BaseSchema):
    """Paginated list of cosmetics for admin."""
    
    items: List[AdminCosmeticResponse] = Field(default_factory=list)
    total: int = 0
    page: int = 1
    page_size: int = 20
