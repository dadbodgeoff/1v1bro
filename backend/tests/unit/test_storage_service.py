"""
Unit tests for storage service.
Tests signed URL generation, image processing, and file validation.
Requirements: 10.1-10.10
"""

import pytest
from datetime import datetime, timedelta
from io import BytesIO
from unittest.mock import Mock, patch, MagicMock

from app.services.storage_service import StorageService, MockStorageClient, MockBucket, MockBlob


class TestStorageServiceConfig:
    """Tests for StorageService configuration."""

    def test_default_bucket_name(self):
        """Should have default bucket name."""
        service = StorageService()
        assert service.BUCKET_NAME == "1v1bro-user-media"

    def test_avatar_sizes(self):
        """Should have correct avatar sizes."""
        service = StorageService()
        assert service.AVATAR_SIZES == [(128, 128), (256, 256), (512, 512)]

    def test_banner_sizes(self):
        """Should have correct banner sizes."""
        service = StorageService()
        assert service.BANNER_SIZES == [(960, 270), (1920, 540)]

    def test_file_size_limits(self):
        """Should have correct file size limits."""
        service = StorageService()
        assert service.AVATAR_MAX_SIZE == 5 * 1024 * 1024  # 5MB
        assert service.BANNER_MAX_SIZE == 10 * 1024 * 1024  # 10MB

    def test_allowed_types(self):
        """Should allow JPEG, PNG, WebP."""
        service = StorageService()
        assert "image/jpeg" in service.ALLOWED_TYPES
        assert "image/png" in service.ALLOWED_TYPES
        assert "image/webp" in service.ALLOWED_TYPES

    def test_upload_url_expiration(self):
        """Should have 5-minute URL expiration."""
        service = StorageService()
        assert service.UPLOAD_URL_EXPIRATION_MINUTES == 5


class TestGenerateSignedUploadUrl:
    """Tests for generate_signed_upload_url method."""

    def test_generates_avatar_url(self):
        """Should generate signed URL for avatar upload."""
        service = StorageService()
        result = service.generate_signed_upload_url(
            user_id="user123",
            file_type="jpg",
            content_type="image/jpeg",
            is_avatar=True
        )
        
        assert "upload_url" in result
        assert "storage_path" in result
        assert "expires_at" in result
        assert "max_size_bytes" in result
        assert "allowed_types" in result
        
        assert result["storage_path"].startswith("avatars/user123/")
        assert result["storage_path"].endswith(".jpg")
        assert result["max_size_bytes"] == 5 * 1024 * 1024

    def test_generates_banner_url(self):
        """Should generate signed URL for banner upload."""
        service = StorageService()
        result = service.generate_signed_upload_url(
            user_id="user123",
            file_type="png",
            content_type="image/png",
            is_avatar=False
        )
        
        assert result["storage_path"].startswith("banners/user123/")
        assert result["storage_path"].endswith(".png")
        assert result["max_size_bytes"] == 10 * 1024 * 1024

    def test_generates_unique_paths(self):
        """Should generate unique storage paths."""
        service = StorageService()
        
        result1 = service.generate_signed_upload_url(
            user_id="user123",
            file_type="jpg",
            content_type="image/jpeg",
            is_avatar=True
        )
        result2 = service.generate_signed_upload_url(
            user_id="user123",
            file_type="jpg",
            content_type="image/jpeg",
            is_avatar=True
        )
        
        assert result1["storage_path"] != result2["storage_path"]

    def test_expiration_is_5_minutes(self):
        """Should set expiration to 5 minutes from now."""
        service = StorageService()
        before = datetime.utcnow()
        
        result = service.generate_signed_upload_url(
            user_id="user123",
            file_type="jpg",
            content_type="image/jpeg",
            is_avatar=True
        )
        
        after = datetime.utcnow()
        expected_min = before + timedelta(minutes=5)
        expected_max = after + timedelta(minutes=5)
        
        assert expected_min <= result["expires_at"] <= expected_max

    def test_rejects_invalid_content_type(self):
        """Should reject invalid content types."""
        service = StorageService()
        
        with pytest.raises(ValueError) as exc_info:
            service.generate_signed_upload_url(
                user_id="user123",
                file_type="gif",
                content_type="image/gif",
                is_avatar=True
            )
        
        assert "Invalid content type" in str(exc_info.value)

    def test_webp_content_type(self):
        """Should accept WebP content type."""
        service = StorageService()
        result = service.generate_signed_upload_url(
            user_id="user123",
            file_type="webp",
            content_type="image/webp",
            is_avatar=True
        )
        
        assert result["storage_path"].endswith(".webp")


class TestGetCdnUrl:
    """Tests for get_cdn_url method."""

    def test_generates_cdn_url(self):
        """Should generate correct CDN URL."""
        service = StorageService()
        url = service.get_cdn_url("avatars/user123/image.jpg")
        
        assert url.startswith("https://")
        assert "avatars/user123/image.jpg" in url

    def test_includes_bucket_name(self):
        """Should include bucket name in URL."""
        service = StorageService()
        url = service.get_cdn_url("test/path.jpg")
        
        assert service.BUCKET_NAME in url


class TestValidateFileType:
    """Tests for validate_file_type method."""

    def test_valid_jpeg(self):
        """Should accept valid JPEG files."""
        service = StorageService()
        assert service.validate_file_type("photo.jpg", "image/jpeg") is True
        assert service.validate_file_type("photo.jpeg", "image/jpeg") is True

    def test_valid_png(self):
        """Should accept valid PNG files."""
        service = StorageService()
        assert service.validate_file_type("photo.png", "image/png") is True

    def test_valid_webp(self):
        """Should accept valid WebP files."""
        service = StorageService()
        assert service.validate_file_type("photo.webp", "image/webp") is True

    def test_invalid_content_type(self):
        """Should reject invalid content types."""
        service = StorageService()
        assert service.validate_file_type("photo.gif", "image/gif") is False
        assert service.validate_file_type("photo.bmp", "image/bmp") is False

    def test_invalid_extension(self):
        """Should reject invalid extensions."""
        service = StorageService()
        assert service.validate_file_type("photo.gif", "image/jpeg") is False

    def test_case_insensitive_extension(self):
        """Should handle case-insensitive extensions."""
        service = StorageService()
        assert service.validate_file_type("photo.JPG", "image/jpeg") is True
        assert service.validate_file_type("photo.PNG", "image/png") is True


class TestExtensionFromContentType:
    """Tests for _get_extension_from_content_type method."""

    def test_jpeg_extension(self):
        """Should return .jpg for JPEG."""
        service = StorageService()
        assert service._get_extension_from_content_type("image/jpeg") == ".jpg"

    def test_png_extension(self):
        """Should return .png for PNG."""
        service = StorageService()
        assert service._get_extension_from_content_type("image/png") == ".png"

    def test_webp_extension(self):
        """Should return .webp for WebP."""
        service = StorageService()
        assert service._get_extension_from_content_type("image/webp") == ".webp"

    def test_unknown_defaults_to_jpg(self):
        """Should default to .jpg for unknown types."""
        service = StorageService()
        assert service._get_extension_from_content_type("image/unknown") == ".jpg"


class TestMockStorageClient:
    """Tests for mock storage client."""

    def test_mock_client_creates_bucket(self):
        """Mock client should create bucket."""
        client = MockStorageClient()
        bucket = client.bucket("test-bucket")
        
        assert isinstance(bucket, MockBucket)
        assert bucket.name == "test-bucket"

    def test_mock_bucket_creates_blob(self):
        """Mock bucket should create blob."""
        bucket = MockBucket("test-bucket")
        blob = bucket.blob("test/path.jpg")
        
        assert isinstance(blob, MockBlob)
        assert blob.name == "test/path.jpg"

    def test_mock_blob_generates_signed_url(self):
        """Mock blob should generate signed URL."""
        blob = MockBlob("test/path.jpg", "test-bucket")
        url = blob.generate_signed_url(version="v4", expiration=timedelta(minutes=5))
        
        assert "https://" in url
        assert "test-bucket" in url
        assert "test/path.jpg" in url

    def test_mock_bucket_lists_blobs(self):
        """Mock bucket should list blobs with prefix."""
        bucket = MockBucket("test-bucket")
        bucket.blob("avatars/user1/img1.jpg")
        bucket.blob("avatars/user1/img2.jpg")
        bucket.blob("banners/user1/img1.jpg")
        
        avatar_blobs = bucket.list_blobs(prefix="avatars/user1/")
        assert len(avatar_blobs) == 2
        
        banner_blobs = bucket.list_blobs(prefix="banners/")
        assert len(banner_blobs) == 1


class TestResizeImage:
    """Tests for _resize_image method."""

    def test_resize_square_image(self):
        """Should resize square image correctly."""
        from PIL import Image
        
        service = StorageService()
        
        # Create a 1000x1000 test image
        original = Image.new('RGB', (1000, 1000), color='red')
        resized = service._resize_image(original, 128, 128)
        
        assert resized.size == (128, 128)

    def test_resize_wide_image(self):
        """Should crop and resize wide image."""
        from PIL import Image
        
        service = StorageService()
        
        # Create a 2000x1000 wide image
        original = Image.new('RGB', (2000, 1000), color='blue')
        resized = service._resize_image(original, 256, 256)
        
        assert resized.size == (256, 256)

    def test_resize_tall_image(self):
        """Should crop and resize tall image."""
        from PIL import Image
        
        service = StorageService()
        
        # Create a 1000x2000 tall image
        original = Image.new('RGB', (1000, 2000), color='green')
        resized = service._resize_image(original, 256, 256)
        
        assert resized.size == (256, 256)

    def test_resize_banner_aspect_ratio(self):
        """Should resize to banner aspect ratio."""
        from PIL import Image
        
        service = StorageService()
        
        # Create a square image
        original = Image.new('RGB', (1000, 1000), color='yellow')
        resized = service._resize_image(original, 960, 270)
        
        assert resized.size == (960, 270)
