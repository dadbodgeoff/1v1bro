"""
Asset Management Service for Supabase Storage operations.
Handles cosmetic asset uploads, validation, and metadata management.
Requirements: 1.1-1.4, 6.3
"""

import os
import uuid
import logging
from datetime import datetime
from typing import Optional, Tuple
from io import BytesIO
from dataclasses import dataclass

from PIL import Image

logger = logging.getLogger(__name__)


@dataclass
class AssetUploadResult:
    """Result of an asset upload operation."""
    success: bool
    public_url: Optional[str] = None
    storage_path: Optional[str] = None
    error_message: Optional[str] = None
    content_type: Optional[str] = None
    file_size: Optional[int] = None
    width: Optional[int] = None
    height: Optional[int] = None
    frame_count: Optional[int] = None


@dataclass
class ValidationResult:
    """Result of asset validation."""
    valid: bool
    error_message: Optional[str] = None
    width: Optional[int] = None
    height: Optional[int] = None
    frame_count: Optional[int] = None


class AssetManagementService:
    """Service for managing cosmetic assets in Supabase Storage."""
    
    BUCKET_NAME = "cosmetics"
    ALLOWED_TYPES = ["image/png", "image/webp", "application/json"]
    MAX_FILE_SIZE = 10 * 1024 * 1024  # 10MB
    
    # Folder prefixes by cosmetic type
    TYPE_PREFIXES = {
        "skin": "skins",
        "emote": "emotes",
        "banner": "banners",
        "nameplate": "banners",
        "effect": "previews",
        "trail": "previews",
    }
    
    def __init__(self, supabase_client):
        """
        Initialize asset management service.
        
        Args:
            supabase_client: Initialized Supabase client
        """
        self._client = supabase_client
        self._storage = supabase_client.storage
    
    def _get_bucket(self):
        """Get the cosmetics storage bucket."""
        return self._storage.from_(self.BUCKET_NAME)
    
    def generate_unique_path(
        self,
        cosmetic_type: str,
        original_filename: str,
        cosmetic_id: Optional[str] = None,
    ) -> str:
        """
        Generate a unique storage path for an asset.
        
        Property 4: Unique filename generation - uses UUID to prevent collisions.
        
        Args:
            cosmetic_type: Type of cosmetic (skin, emote, etc.)
            original_filename: Original filename for extension
            cosmetic_id: Optional cosmetic ID for organizing
            
        Returns:
            Unique storage path
        """
        prefix = self.TYPE_PREFIXES.get(cosmetic_type, "misc")
        unique_id = str(uuid.uuid4())
        
        # Extract extension from original filename
        ext = os.path.splitext(original_filename)[1].lower()
        if not ext:
            ext = ".png"
        
        if cosmetic_id:
            return f"{prefix}/{cosmetic_id}/{unique_id}{ext}"
        return f"{prefix}/{unique_id}{ext}"
    
    def validate_content_type(self, content_type: str) -> ValidationResult:
        """
        Validate that content type is allowed.
        
        Args:
            content_type: MIME type to validate
            
        Returns:
            ValidationResult
        """
        if content_type not in self.ALLOWED_TYPES:
            return ValidationResult(
                valid=False,
                error_message=f"Invalid content type: {content_type}. Allowed: {self.ALLOWED_TYPES}"
            )
        return ValidationResult(valid=True)
    
    def validate_file_size(self, file_data: bytes) -> ValidationResult:
        """
        Validate that file size is within limits.
        
        Args:
            file_data: Raw file bytes
            
        Returns:
            ValidationResult
        """
        size = len(file_data)
        if size > self.MAX_FILE_SIZE:
            return ValidationResult(
                valid=False,
                error_message=f"File too large: {size} bytes. Maximum: {self.MAX_FILE_SIZE} bytes"
            )
        return ValidationResult(valid=True)

    
    def validate_sprite_sheet(
        self,
        file_data: bytes,
        expected_frame_size: int = 64,
    ) -> ValidationResult:
        """
        Validate sprite sheet dimensions.
        
        Property 2: Sprite sheet dimension validation.
        Dimensions must be divisible by expected frame size.
        
        Args:
            file_data: Raw image bytes
            expected_frame_size: Expected frame width/height (default 64px)
            
        Returns:
            ValidationResult with dimensions and frame count
        """
        try:
            image = Image.open(BytesIO(file_data))
            width, height = image.size
            
            # Check if dimensions are divisible by frame size
            if width % expected_frame_size != 0:
                return ValidationResult(
                    valid=False,
                    error_message=f"Width {width} not divisible by frame size {expected_frame_size}",
                    width=width,
                    height=height,
                )
            
            if height % expected_frame_size != 0:
                return ValidationResult(
                    valid=False,
                    error_message=f"Height {height} not divisible by frame size {expected_frame_size}",
                    width=width,
                    height=height,
                )
            
            # Calculate frame count
            cols = width // expected_frame_size
            rows = height // expected_frame_size
            frame_count = cols * rows
            
            return ValidationResult(
                valid=True,
                width=width,
                height=height,
                frame_count=frame_count,
            )
            
        except Exception as e:
            return ValidationResult(
                valid=False,
                error_message=f"Failed to parse image: {str(e)}"
            )
    
    async def upload_asset(
        self,
        file_data: bytes,
        filename: str,
        content_type: str,
        cosmetic_type: str,
        cosmetic_id: Optional[str] = None,
        validate_sprite: bool = False,
        expected_frame_size: int = 64,
    ) -> AssetUploadResult:
        """
        Upload an asset to Supabase Storage.
        
        Property 1: Asset upload returns valid URL.
        Property 3: Upload error messages.
        Property 4: Unique filename generation.
        
        Args:
            file_data: Raw file bytes
            filename: Original filename
            content_type: MIME type
            cosmetic_type: Type of cosmetic (skin, emote, etc.)
            cosmetic_id: Optional cosmetic ID for organizing
            validate_sprite: Whether to validate as sprite sheet
            expected_frame_size: Frame size for sprite validation
            
        Returns:
            AssetUploadResult with public_url and metadata
        """
        # Validate content type
        type_result = self.validate_content_type(content_type)
        if not type_result.valid:
            return AssetUploadResult(
                success=False,
                error_message=type_result.error_message,
            )
        
        # Validate file size
        size_result = self.validate_file_size(file_data)
        if not size_result.valid:
            return AssetUploadResult(
                success=False,
                error_message=size_result.error_message,
            )
        
        # Validate sprite sheet if requested
        width, height, frame_count = None, None, None
        if validate_sprite and content_type.startswith("image/"):
            sprite_result = self.validate_sprite_sheet(file_data, expected_frame_size)
            if not sprite_result.valid:
                return AssetUploadResult(
                    success=False,
                    error_message=sprite_result.error_message,
                )
            width = sprite_result.width
            height = sprite_result.height
            frame_count = sprite_result.frame_count
        elif content_type.startswith("image/"):
            # Get dimensions for non-sprite images
            try:
                image = Image.open(BytesIO(file_data))
                width, height = image.size
            except Exception:
                pass
        
        # Generate unique path
        storage_path = self.generate_unique_path(cosmetic_type, filename, cosmetic_id)
        
        try:
            # Upload to Supabase Storage
            bucket = self._get_bucket()
            result = bucket.upload(
                path=storage_path,
                file=file_data,
                file_options={"content-type": content_type}
            )
            
            # Get public URL
            public_url = bucket.get_public_url(storage_path)
            
            logger.info(f"Uploaded asset: {storage_path}")
            
            return AssetUploadResult(
                success=True,
                public_url=public_url,
                storage_path=storage_path,
                content_type=content_type,
                file_size=len(file_data),
                width=width,
                height=height,
                frame_count=frame_count,
            )
            
        except Exception as e:
            logger.error(f"Failed to upload asset: {e}")
            return AssetUploadResult(
                success=False,
                error_message=f"Storage error: {str(e)}",
            )
    
    async def delete_asset(self, storage_path: str) -> bool:
        """
        Delete an asset from storage.
        
        Args:
            storage_path: Path to the asset in storage
            
        Returns:
            True if deleted successfully
        """
        try:
            bucket = self._get_bucket()
            bucket.remove([storage_path])
            logger.info(f"Deleted asset: {storage_path}")
            return True
        except Exception as e:
            logger.error(f"Failed to delete asset {storage_path}: {e}")
            return False
    
    def get_public_url(self, storage_path: str) -> str:
        """
        Get public URL for an asset.
        
        Args:
            storage_path: Path to the asset in storage
            
        Returns:
            Public URL
        """
        bucket = self._get_bucket()
        return bucket.get_public_url(storage_path)
