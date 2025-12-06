"""
Storage service for Cloud Storage operations.
Handles avatar and banner uploads with signed URLs and image processing.
Requirements: 10.1-10.10
"""

import os
import uuid
import logging
from datetime import datetime, timedelta
from typing import List, Optional, Tuple
from io import BytesIO

from PIL import Image

logger = logging.getLogger(__name__)


class StorageService:
    """Service for Cloud Storage operations."""
    
    # Bucket configuration
    BUCKET_NAME = os.getenv("GCS_BUCKET_NAME", "1v1bro-user-media")
    CDN_BASE_URL = os.getenv("CDN_BASE_URL", f"https://storage.googleapis.com/{BUCKET_NAME}")
    
    # Path prefixes
    AVATAR_PREFIX = "avatars/"
    BANNER_PREFIX = "banners/"
    
    # Image size configurations
    AVATAR_SIZES: List[Tuple[int, int]] = [(128, 128), (256, 256), (512, 512)]
    BANNER_SIZES: List[Tuple[int, int]] = [(960, 270), (1920, 540)]
    
    # File constraints
    AVATAR_MAX_SIZE = 5 * 1024 * 1024  # 5MB
    BANNER_MAX_SIZE = 10 * 1024 * 1024  # 10MB
    ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"]
    ALLOWED_EXTENSIONS = [".jpg", ".jpeg", ".png", ".webp"]
    
    # URL expiration
    UPLOAD_URL_EXPIRATION_MINUTES = 5
    
    def __init__(self, project_id: Optional[str] = None):
        """Initialize storage service."""
        self.project_id = project_id or os.getenv("GCP_PROJECT_ID")
        self._client = None
        self._bucket = None
    
    @property
    def client(self):
        """Lazy-load Google Cloud Storage client."""
        if self._client is None:
            try:
                from google.cloud import storage
                self._client = storage.Client(project=self.project_id)
            except ImportError:
                logger.warning("google-cloud-storage not installed, using mock client")
                self._client = MockStorageClient()
        return self._client
    
    @property
    def bucket(self):
        """Get storage bucket."""
        if self._bucket is None:
            self._bucket = self.client.bucket(self.BUCKET_NAME)
        return self._bucket
    
    def generate_signed_upload_url(
        self,
        user_id: str,
        file_type: str,
        content_type: str,
        is_avatar: bool = True
    ) -> dict:
        """
        Generate a signed URL for direct client upload.
        
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
        prefix = self.AVATAR_PREFIX if is_avatar else self.BANNER_PREFIX
        extension = self._get_extension_from_content_type(content_type)
        storage_path = f"{prefix}{user_id}/{unique_id}{extension}"
        
        # Calculate expiration
        expires_at = datetime.utcnow() + timedelta(minutes=self.UPLOAD_URL_EXPIRATION_MINUTES)
        
        # Generate signed URL
        try:
            blob = self.bucket.blob(storage_path)
            upload_url = blob.generate_signed_url(
                version="v4",
                expiration=timedelta(minutes=self.UPLOAD_URL_EXPIRATION_MINUTES),
                method="PUT",
                content_type=content_type,
            )
        except Exception as e:
            logger.error(f"Failed to generate signed URL: {e}")
            # Fallback for development/testing
            upload_url = f"{self.CDN_BASE_URL}/{storage_path}?upload=true"
        
        max_size = self.AVATAR_MAX_SIZE if is_avatar else self.BANNER_MAX_SIZE
        
        return {
            "upload_url": upload_url,
            "storage_path": storage_path,
            "expires_at": expires_at,
            "max_size_bytes": max_size,
            "allowed_types": self.ALLOWED_TYPES,
        }
    
    async def process_avatar(self, source_path: str, user_id: str) -> List[str]:
        """
        Resize avatar to standard sizes (128x128, 256x256, 512x512).
        
        Args:
            source_path: Path to uploaded source image
            user_id: User ID for output path
            
        Returns:
            List of CDN URLs for resized variants
        """
        return await self._process_image(
            source_path=source_path,
            user_id=user_id,
            sizes=self.AVATAR_SIZES,
            prefix=self.AVATAR_PREFIX,
        )
    
    async def process_banner(self, source_path: str, user_id: str) -> List[str]:
        """
        Resize banner to standard sizes (960x270, 1920x540).
        
        Args:
            source_path: Path to uploaded source image
            user_id: User ID for output path
            
        Returns:
            List of CDN URLs for resized variants
        """
        return await self._process_image(
            source_path=source_path,
            user_id=user_id,
            sizes=self.BANNER_SIZES,
            prefix=self.BANNER_PREFIX,
        )
    
    async def _process_image(
        self,
        source_path: str,
        user_id: str,
        sizes: List[Tuple[int, int]],
        prefix: str,
    ) -> List[str]:
        """
        Process and resize image to multiple sizes.
        
        Args:
            source_path: Path to source image in bucket
            user_id: User ID for output path
            sizes: List of (width, height) tuples
            prefix: Path prefix (avatars/ or banners/)
            
        Returns:
            List of CDN URLs for resized variants
        """
        urls = []
        
        try:
            # Download source image
            source_blob = self.bucket.blob(source_path)
            image_data = source_blob.download_as_bytes()
            
            # Open with PIL
            image = Image.open(BytesIO(image_data))
            
            # Convert to RGB if necessary (for JPEG output)
            if image.mode in ('RGBA', 'P'):
                image = image.convert('RGB')
            
            # Get base filename without extension
            base_name = source_path.rsplit('/', 1)[-1].rsplit('.', 1)[0]
            
            for width, height in sizes:
                # Resize image
                resized = self._resize_image(image, width, height)
                
                # Save to buffer
                buffer = BytesIO()
                resized.save(buffer, format='WEBP', quality=85)
                buffer.seek(0)
                
                # Upload resized version
                output_path = f"{prefix}{user_id}/{base_name}_{width}x{height}.webp"
                output_blob = self.bucket.blob(output_path)
                output_blob.upload_from_file(buffer, content_type='image/webp')
                
                # Set cache headers (1 year for versioned files)
                output_blob.cache_control = 'public, max-age=31536000'
                output_blob.patch()
                
                urls.append(self.get_cdn_url(output_path))
            
            logger.info(f"Processed image for user {user_id}: {len(urls)} variants created")
            
        except Exception as e:
            logger.error(f"Failed to process image: {e}")
            # Return source URL as fallback
            urls = [self.get_cdn_url(source_path)]
        
        return urls
    
    def _resize_image(self, image: Image.Image, width: int, height: int) -> Image.Image:
        """
        Resize image to target dimensions with center crop.
        
        Args:
            image: PIL Image object
            width: Target width
            height: Target height
            
        Returns:
            Resized PIL Image
        """
        # Calculate aspect ratios
        target_ratio = width / height
        image_ratio = image.width / image.height
        
        if image_ratio > target_ratio:
            # Image is wider - crop width
            new_width = int(image.height * target_ratio)
            left = (image.width - new_width) // 2
            image = image.crop((left, 0, left + new_width, image.height))
        elif image_ratio < target_ratio:
            # Image is taller - crop height
            new_height = int(image.width / target_ratio)
            top = (image.height - new_height) // 2
            image = image.crop((0, top, image.width, top + new_height))
        
        # Resize to target dimensions
        return image.resize((width, height), Image.Resampling.LANCZOS)
    
    def get_cdn_url(self, path: str) -> str:
        """
        Get CDN URL for serving file.
        
        Args:
            path: Storage path
            
        Returns:
            Public CDN URL
        """
        return f"{self.CDN_BASE_URL}/{path}"
    
    async def delete_old_versions(
        self,
        user_id: str,
        prefix: str,
        keep_latest: int = 1
    ) -> int:
        """
        Delete old file versions, keeping the most recent.
        
        Args:
            user_id: User ID
            prefix: Path prefix (avatars/ or banners/)
            keep_latest: Number of versions to keep
            
        Returns:
            Number of files deleted
        """
        deleted_count = 0
        
        try:
            # List all blobs for user
            full_prefix = f"{prefix}{user_id}/"
            blobs = list(self.bucket.list_blobs(prefix=full_prefix))
            
            # Group by base filename (without size suffix)
            from collections import defaultdict
            versions = defaultdict(list)
            
            for blob in blobs:
                # Extract base name (remove size suffix like _128x128)
                name = blob.name.rsplit('/', 1)[-1]
                base = name.split('_')[0] if '_' in name else name.rsplit('.', 1)[0]
                versions[base].append(blob)
            
            # Sort each group by time and delete old versions
            for base, blob_list in versions.items():
                blob_list.sort(key=lambda b: b.time_created or datetime.min, reverse=True)
                
                # Delete all but the latest
                for blob in blob_list[keep_latest:]:
                    blob.delete()
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


class MockStorageClient:
    """Mock storage client for development/testing."""
    
    def bucket(self, name: str):
        return MockBucket(name)


class MockBucket:
    """Mock bucket for development/testing."""
    
    def __init__(self, name: str):
        self.name = name
        self._blobs = {}
    
    def blob(self, path: str):
        if path not in self._blobs:
            self._blobs[path] = MockBlob(path, self.name)
        return self._blobs[path]
    
    def list_blobs(self, prefix: str = ""):
        return [b for p, b in self._blobs.items() if p.startswith(prefix)]


class MockBlob:
    """Mock blob for development/testing."""
    
    def __init__(self, path: str, bucket_name: str):
        self.name = path
        self.bucket_name = bucket_name
        self.cache_control = None
        self.time_created = datetime.utcnow()
        self._data = b""
    
    def generate_signed_url(self, **kwargs) -> str:
        return f"https://storage.googleapis.com/{self.bucket_name}/{self.name}?signed=true"
    
    def download_as_bytes(self) -> bytes:
        return self._data
    
    def upload_from_file(self, file_obj, content_type: str = None):
        self._data = file_obj.read()
    
    def patch(self):
        pass
    
    def delete(self):
        pass
