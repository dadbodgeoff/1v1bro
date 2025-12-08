"""
Storage service for Supabase Storage operations.
Handles avatar and banner uploads with signed URLs.
Requirements: 10.1-10.10
"""

import os
import uuid
import logging
from datetime import datetime, timedelta
from typing import List, Optional, Tuple

from supabase import Client

from app.database.supabase_client import get_supabase_service_client

logger = logging.getLogger(__name__)


class StorageService:
    """Service for Supabase Storage operations."""
    
    # Bucket names
    AVATAR_BUCKET = "avatars"
    BANNER_BUCKET = "banners"
    
    # Path prefixes within buckets
    AVATAR_PREFIX = ""
    BANNER_PREFIX = ""
    
    # File constraints
    AVATAR_MAX_SIZE = 5 * 1024 * 1024  # 5MB
    BANNER_MAX_SIZE = 10 * 1024 * 1024  # 10MB
    ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"]
    ALLOWED_EXTENSIONS = [".jpg", ".jpeg", ".png", ".webp"]
    
    # URL expiration
    UPLOAD_URL_EXPIRATION_SECONDS = 300  # 5 minutes
    
    def __init__(self, client: Optional[Client] = None):
        """Initialize storage service with Supabase client."""
        self._client = client
    
    @property
    def client(self) -> Client:
        """Get Supabase client (lazy load)."""
        if self._client is None:
            self._client = get_supabase_service_client()
        return self._client
    
    def _get_supabase_url(self) -> str:
        """Get Supabase project URL from client."""
        # Extract from client's URL
        return self.client.supabase_url
    
    def generate_signed_upload_url(
        self,
        user_id: str,
        file_type: str,
        content_type: str,
        is_avatar: bool = True
    ) -> dict:
        """
        Generate a signed URL for direct client upload to Supabase Storage.
        
        Args:
            user_id: User ID for path generation
            file_type: File extension (jpg, png, webp)
            content_type: MIME type of the file
            is_avatar: True for avatar, False for banner
            
        Returns:
            Dict with upload_url, storage_path, expires_at, max_size_bytes, allowed_types
        """
        # Validate content type
        if content_type not in self.ALLOWED_TYPES:
            raise ValueError(f"Invalid content type: {content_type}. Allowed: {self.ALLOWED_TYPES}")
        
        # Generate unique filename
        unique_id = str(uuid.uuid4())
        extension = self._get_extension_from_content_type(content_type)
        
        # Determine bucket and path
        bucket = self.AVATAR_BUCKET if is_avatar else self.BANNER_BUCKET
        storage_path = f"{user_id}/{unique_id}{extension}"
        
        # Calculate expiration
        expires_at = datetime.utcnow() + timedelta(seconds=self.UPLOAD_URL_EXPIRATION_SECONDS)
        
        try:
            # Create signed upload URL using Supabase Storage
            result = self.client.storage.from_(bucket).create_signed_upload_url(storage_path)
            
            # Handle different response formats from supabase-py
            if isinstance(result, dict):
                upload_url = result.get("signedURL") or result.get("signed_url") or result.get("signedUrl")
                # Also check for token-based URL
                if not upload_url and "token" in result:
                    base_url = self._get_supabase_url()
                    upload_url = f"{base_url}/storage/v1/object/upload/sign/{bucket}/{storage_path}?token={result['token']}"
            elif hasattr(result, 'signed_url'):
                upload_url = result.signed_url
            elif hasattr(result, 'path') and hasattr(result, 'token'):
                # New supabase-py format
                base_url = self._get_supabase_url()
                upload_url = f"{base_url}/storage/v1/object/upload/sign/{bucket}/{result.path}?token={result.token}"
            else:
                logger.warning(f"Signed URL response format unexpected: {result}")
                upload_url = None
            
            if not upload_url:
                upload_url = self._construct_upload_url(bucket, storage_path)
                
        except Exception as e:
            logger.error(f"Failed to generate signed URL: {e}")
            # Fallback for development/testing
            upload_url = self._construct_upload_url(bucket, storage_path)
        
        max_size = self.AVATAR_MAX_SIZE if is_avatar else self.BANNER_MAX_SIZE
        
        return {
            "upload_url": upload_url,
            "storage_path": storage_path,
            "bucket": bucket,
            "expires_at": expires_at,
            "max_size_bytes": max_size,
            "allowed_types": self.ALLOWED_TYPES,
        }
    
    def _construct_upload_url(self, bucket: str, path: str) -> str:
        """Construct a direct upload URL as fallback."""
        base_url = self._get_supabase_url()
        return f"{base_url}/storage/v1/object/{bucket}/{path}"
    
    def get_public_url(self, bucket: str, path: str) -> str:
        """
        Get public URL for a file in Supabase Storage.
        
        Args:
            bucket: Bucket name
            path: File path within bucket
            
        Returns:
            Public URL for the file
        """
        try:
            result = self.client.storage.from_(bucket).get_public_url(path)
            return result
        except Exception as e:
            logger.error(f"Failed to get public URL: {e}")
            # Construct URL manually
            base_url = self._get_supabase_url()
            return f"{base_url}/storage/v1/object/public/{bucket}/{path}"
    
    async def process_avatar(self, storage_path: str, user_id: str) -> List[str]:
        """
        Process uploaded avatar - for Supabase we just return the public URL.
        Image resizing can be done client-side or via Supabase Image Transformations.
        
        Args:
            storage_path: Path to uploaded source image
            user_id: User ID
            
        Returns:
            List of URLs (single URL for Supabase)
        """
        public_url = self.get_public_url(self.AVATAR_BUCKET, storage_path)
        return [public_url]
    
    async def process_banner(self, storage_path: str, user_id: str) -> List[str]:
        """
        Process uploaded banner - for Supabase we just return the public URL.
        
        Args:
            storage_path: Path to uploaded source image
            user_id: User ID
            
        Returns:
            List of URLs (single URL for Supabase)
        """
        public_url = self.get_public_url(self.BANNER_BUCKET, storage_path)
        return [public_url]
    
    async def delete_old_versions(
        self,
        user_id: str,
        prefix: str,
        keep_latest: int = 1
    ) -> int:
        """
        Delete old file versions for a user, keeping the most recent.
        
        Args:
            user_id: User ID
            prefix: Not used for Supabase (bucket determines type)
            keep_latest: Number of versions to keep
            
        Returns:
            Number of files deleted
        """
        deleted_count = 0
        
        # Determine bucket based on prefix
        bucket = self.AVATAR_BUCKET if "avatar" in prefix.lower() else self.BANNER_BUCKET
        
        try:
            # List files for user
            result = self.client.storage.from_(bucket).list(user_id)
            
            if not result:
                return 0
            
            # Sort by created_at (newest first)
            files = sorted(
                result,
                key=lambda f: f.get("created_at", ""),
                reverse=True
            )
            
            # Delete all but the latest
            for file_info in files[keep_latest:]:
                file_name = file_info.get("name")
                if file_name:
                    file_path = f"{user_id}/{file_name}"
                    self.client.storage.from_(bucket).remove([file_path])
                    deleted_count += 1
            
            logger.info(f"Deleted {deleted_count} old versions for user {user_id}")
            
        except Exception as e:
            logger.error(f"Failed to delete old versions: {e}")
        
        return deleted_count
    
    def validate_file_type(self, filename: str, content_type: str) -> bool:
        """
        Validate file type by extension and content type.
        
        Args:
            filename: Original filename
            content_type: MIME type
            
        Returns:
            True if valid, False otherwise
        """
        # Check content type
        if content_type not in self.ALLOWED_TYPES:
            return False
        
        # Check extension
        ext = os.path.splitext(filename.lower())[1]
        if ext not in self.ALLOWED_EXTENSIONS:
            return False
        
        return True
    
    def _get_extension_from_content_type(self, content_type: str) -> str:
        """Get file extension from content type."""
        mapping = {
            "image/jpeg": ".jpg",
            "image/png": ".png",
            "image/webp": ".webp",
        }
        return mapping.get(content_type, ".jpg")
