"""
Unit tests for storage service.
Tests signed URL generation, image processing, and file validation.
Requirements: 10.1-10.10
"""

import pytest
from datetime import datetime, timedelta
from io import BytesIO
from unittest.mock import Mock, patch, MagicMock

from app.services.storage_service import StorageService


class TestStorageServiceConfig:
    """Tests for StorageService configuration."""

    def test_avatar_bucket_name(self):
        """Should have correct avatar bucket name."""
        service = StorageService(client=Mock())
        assert service.AVATAR_BUCKET == "avatars"

    def test_banner_bucket_name(self):
        """Should have correct banner bucket name."""
        service = StorageService(client=Mock())
        assert service.BANNER_BUCKET == "banners"

    def test_file_size_limits(self):
        """Should have correct file size limits."""
        service = StorageService(client=Mock())
        assert service.AVATAR_MAX_SIZE == 5 * 1024 * 1024  # 5MB
        assert service.BANNER_MAX_SIZE == 10 * 1024 * 1024  # 10MB

    def test_allowed_types(self):
        """Should allow JPEG, PNG, WebP."""
        service = StorageService(client=Mock())
        assert "image/jpeg" in service.ALLOWED_TYPES
        assert "image/png" in service.ALLOWED_TYPES
        assert "image/webp" in service.ALLOWED_TYPES

    def test_upload_url_expiration(self):
        """Should have 5-minute URL expiration."""
        service = StorageService(client=Mock())
        assert service.UPLOAD_URL_EXPIRATION_SECONDS == 300


class TestGenerateSignedUploadUrl:
    """Tests for generate_signed_upload_url method."""

    def test_generates_avatar_url(self):
        """Should generate signed URL for avatar upload."""
        mock_client = Mock()
        mock_client.supabase_url = "https://test.supabase.co"
        mock_storage = Mock()
        mock_bucket = Mock()
        mock_bucket.create_signed_upload_url.return_value = {"signedURL": "https://test.supabase.co/signed-url"}
        mock_storage.from_.return_value = mock_bucket
        mock_client.storage = mock_storage
        
        service = StorageService(client=mock_client)
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
        assert "bucket" in result
        
        assert result["bucket"] == "avatars"
        assert result["storage_path"].startswith("user123/")
        assert result["storage_path"].endswith(".jpg")
        assert result["max_size_bytes"] == 5 * 1024 * 1024

    def test_generates_banner_url(self):
        """Should generate signed URL for banner upload."""
        mock_client = Mock()
        mock_client.supabase_url = "https://test.supabase.co"
        mock_storage = Mock()
        mock_bucket = Mock()
        mock_bucket.create_signed_upload_url.return_value = {"signedURL": "https://test.supabase.co/signed-url"}
        mock_storage.from_.return_value = mock_bucket
        mock_client.storage = mock_storage
        
        service = StorageService(client=mock_client)
        result = service.generate_signed_upload_url(
            user_id="user123",
            file_type="png",
            content_type="image/png",
            is_avatar=False
        )
        
        assert result["bucket"] == "banners"
        assert result["storage_path"].startswith("user123/")
        assert result["storage_path"].endswith(".png")
        assert result["max_size_bytes"] == 10 * 1024 * 1024

    def test_generates_unique_paths(self):
        """Should generate unique storage paths."""
        mock_client = Mock()
        mock_client.supabase_url = "https://test.supabase.co"
        mock_storage = Mock()
        mock_bucket = Mock()
        mock_bucket.create_signed_upload_url.return_value = {"signedURL": "https://test.supabase.co/signed-url"}
        mock_storage.from_.return_value = mock_bucket
        mock_client.storage = mock_storage
        
        service = StorageService(client=mock_client)
        
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
        mock_client = Mock()
        mock_client.supabase_url = "https://test.supabase.co"
        mock_storage = Mock()
        mock_bucket = Mock()
        mock_bucket.create_signed_upload_url.return_value = {"signedURL": "https://test.supabase.co/signed-url"}
        mock_storage.from_.return_value = mock_bucket
        mock_client.storage = mock_storage
        
        service = StorageService(client=mock_client)
        before = datetime.utcnow()
        
        result = service.generate_signed_upload_url(
            user_id="user123",
            file_type="jpg",
            content_type="image/jpeg",
            is_avatar=True
        )
        
        after = datetime.utcnow()
        expected_min = before + timedelta(seconds=300)
        expected_max = after + timedelta(seconds=300)
        
        assert expected_min <= result["expires_at"] <= expected_max

    def test_rejects_invalid_content_type(self):
        """Should reject invalid content types."""
        service = StorageService(client=Mock())
        
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
        mock_client = Mock()
        mock_client.supabase_url = "https://test.supabase.co"
        mock_storage = Mock()
        mock_bucket = Mock()
        mock_bucket.create_signed_upload_url.return_value = {"signedURL": "https://test.supabase.co/signed-url"}
        mock_storage.from_.return_value = mock_bucket
        mock_client.storage = mock_storage
        
        service = StorageService(client=mock_client)
        result = service.generate_signed_upload_url(
            user_id="user123",
            file_type="webp",
            content_type="image/webp",
            is_avatar=True
        )
        
        assert result["storage_path"].endswith(".webp")


class TestGetPublicUrl:
    """Tests for get_public_url method."""

    def test_generates_public_url(self):
        """Should generate correct public URL."""
        mock_client = Mock()
        mock_client.supabase_url = "https://test.supabase.co"
        mock_storage = Mock()
        mock_bucket = Mock()
        mock_bucket.get_public_url.return_value = "https://test.supabase.co/storage/v1/object/public/avatars/user123/image.jpg"
        mock_storage.from_.return_value = mock_bucket
        mock_client.storage = mock_storage
        
        service = StorageService(client=mock_client)
        url = service.get_public_url("avatars", "user123/image.jpg")
        
        assert "user123/image.jpg" in url

    def test_fallback_url_on_error(self):
        """Should construct URL manually on error."""
        mock_client = Mock()
        mock_client.supabase_url = "https://test.supabase.co"
        mock_storage = Mock()
        mock_bucket = Mock()
        mock_bucket.get_public_url.side_effect = Exception("API error")
        mock_storage.from_.return_value = mock_bucket
        mock_client.storage = mock_storage
        
        service = StorageService(client=mock_client)
        url = service.get_public_url("avatars", "test/path.jpg")
        
        assert "https://test.supabase.co" in url
        assert "avatars" in url
        assert "test/path.jpg" in url


class TestValidateFileType:
    """Tests for validate_file_type method."""

    def test_valid_jpeg(self):
        """Should accept valid JPEG files."""
        service = StorageService(client=Mock())
        assert service.validate_file_type("photo.jpg", "image/jpeg") is True
        assert service.validate_file_type("photo.jpeg", "image/jpeg") is True

    def test_valid_png(self):
        """Should accept valid PNG files."""
        service = StorageService(client=Mock())
        assert service.validate_file_type("photo.png", "image/png") is True

    def test_valid_webp(self):
        """Should accept valid WebP files."""
        service = StorageService(client=Mock())
        assert service.validate_file_type("photo.webp", "image/webp") is True

    def test_invalid_content_type(self):
        """Should reject invalid content types."""
        service = StorageService(client=Mock())
        assert service.validate_file_type("photo.gif", "image/gif") is False
        assert service.validate_file_type("photo.bmp", "image/bmp") is False

    def test_invalid_extension(self):
        """Should reject invalid extensions."""
        service = StorageService(client=Mock())
        assert service.validate_file_type("photo.gif", "image/jpeg") is False

    def test_case_insensitive_extension(self):
        """Should handle case-insensitive extensions."""
        service = StorageService(client=Mock())
        assert service.validate_file_type("photo.JPG", "image/jpeg") is True
        assert service.validate_file_type("photo.PNG", "image/png") is True


class TestExtensionFromContentType:
    """Tests for _get_extension_from_content_type method."""

    def test_jpeg_extension(self):
        """Should return .jpg for JPEG."""
        service = StorageService(client=Mock())
        assert service._get_extension_from_content_type("image/jpeg") == ".jpg"

    def test_png_extension(self):
        """Should return .png for PNG."""
        service = StorageService(client=Mock())
        assert service._get_extension_from_content_type("image/png") == ".png"

    def test_webp_extension(self):
        """Should return .webp for WebP."""
        service = StorageService(client=Mock())
        assert service._get_extension_from_content_type("image/webp") == ".webp"

    def test_unknown_defaults_to_jpg(self):
        """Should default to .jpg for unknown types."""
        service = StorageService(client=Mock())
        assert service._get_extension_from_content_type("image/unknown") == ".jpg"
