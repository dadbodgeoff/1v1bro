"""
Unit tests for ProfileService.
Tests profile management operations.
Requirements: 2.1-2.10
"""

import pytest
from unittest.mock import MagicMock, AsyncMock, patch
from datetime import datetime

from app.services.profile_service import ProfileService, PROFILE_CACHE_TTL
from app.schemas.profile import ProfileUpdate, PrivacySettings, SocialLinks


@pytest.fixture
def mock_client():
    """Create a mock Supabase client."""
    return MagicMock()


@pytest.fixture
def mock_storage():
    """Create a mock StorageService."""
    storage = MagicMock()
    storage.generate_signed_upload_url = MagicMock(return_value={
        "upload_url": "https://storage.example.com/upload",
        "storage_path": "avatars/user-123/abc.jpg",
        "expires_at": datetime.utcnow(),
        "max_size_bytes": 5 * 1024 * 1024,
        "allowed_types": ["image/jpeg", "image/png", "image/webp"],
    })
    storage.process_avatar = AsyncMock(return_value=[
        "https://cdn.example.com/avatar_128x128.webp",
        "https://cdn.example.com/avatar_256x256.webp",
        "https://cdn.example.com/avatar_512x512.webp",
    ])
    storage.process_banner = AsyncMock(return_value=[
        "https://cdn.example.com/banner_960x270.webp",
        "https://cdn.example.com/banner_1920x540.webp",
    ])
    storage.delete_old_versions = AsyncMock(return_value=2)
    storage.get_cdn_url = MagicMock(return_value="https://cdn.example.com/file.jpg")
    storage._get_extension_from_content_type = MagicMock(return_value=".jpg")
    storage.AVATAR_PREFIX = "avatars/"
    storage.BANNER_PREFIX = "banners/"
    return storage


@pytest.fixture
def mock_cache():
    """Create a mock CacheManager."""
    cache = MagicMock()
    cache.get_json = AsyncMock(return_value=None)
    cache.set_json = AsyncMock()
    cache.delete = AsyncMock()
    return cache


@pytest.fixture
def profile_service(mock_client, mock_storage, mock_cache):
    """Create ProfileService with mocks."""
    return ProfileService(mock_client, mock_storage, mock_cache)


class TestGetProfile:
    """Tests for get_profile method."""

    @pytest.mark.asyncio
    async def test_get_profile_returns_cached_for_owner(self, profile_service, mock_cache):
        """Should return cached profile for owner."""
        cached_profile = {
            "user_id": "user-123",
            "display_name": "TestUser",
            "bio": "My bio",
            "avatar_url": None,
            "banner_url": None,
            "banner_color": "#1a1a2e",
            "level": 1,
            "total_xp": 0,
            "title": "Rookie",
            "country": None,
            "social_links": {},
            "is_public": True,
            "accept_friend_requests": True,
            "allow_messages": True,
            "created_at": "2024-01-01T00:00:00Z",
            "updated_at": "2024-12-01T00:00:00Z",
        }
        mock_cache.get_json = AsyncMock(return_value=cached_profile)
        
        result = await profile_service.get_profile("user-123", "user-123")
        
        assert result is not None
        assert result.user_id == "user-123"
        mock_cache.get_json.assert_called_once()

    @pytest.mark.asyncio
    async def test_get_profile_fetches_from_db_when_not_cached(self, profile_service, mock_client, mock_cache):
        """Should fetch from database when not cached."""
        mock_cache.get_json = AsyncMock(return_value=None)
        
        profile_data = {
            "id": "user-123",
            "display_name": "TestUser",
            "bio": "My bio",
            "avatar_url": None,
            "banner_url": None,
            "banner_color": "#1a1a2e",
            "level": 1,
            "total_xp": 0,
            "title": "Rookie",
            "country": None,
            "social_links": {},
            "is_public": True,
            "accept_friend_requests": True,
            "allow_messages": True,
            "created_at": "2024-01-01T00:00:00Z",
            "updated_at": "2024-12-01T00:00:00Z",
        }
        
        with patch.object(profile_service.profile_repo, 'get_profile', new_callable=AsyncMock) as mock_get:
            mock_get.return_value = profile_data
            
            result = await profile_service.get_profile("user-123", "user-123")
            
            assert result is not None
            assert result.user_id == "user-123"
            mock_get.assert_called_once_with("user-123", "user-123")

    @pytest.mark.asyncio
    async def test_get_profile_returns_none_for_nonexistent(self, profile_service):
        """Should return None for non-existent profile."""
        with patch.object(profile_service.profile_repo, 'get_profile', new_callable=AsyncMock) as mock_get:
            mock_get.return_value = None
            
            result = await profile_service.get_profile("nonexistent")
            
            assert result is None


class TestUpdateProfile:
    """Tests for update_profile method."""

    @pytest.mark.asyncio
    async def test_update_profile_success(self, profile_service, mock_cache):
        """Should update profile and invalidate cache."""
        updated_data = {
            "id": "user-123",
            "display_name": "NewName",
            "bio": "New bio",
            "avatar_url": None,
            "banner_url": None,
            "banner_color": "#1a1a2e",
            "level": 1,
            "total_xp": 0,
            "title": "Rookie",
            "country": "US",
            "social_links": {},
            "is_public": True,
            "accept_friend_requests": True,
            "allow_messages": True,
            "created_at": "2024-01-01T00:00:00Z",
            "updated_at": "2024-12-01T00:00:00Z",
        }
        
        with patch.object(profile_service.profile_repo, 'update_profile', new_callable=AsyncMock) as mock_update:
            mock_update.return_value = updated_data
            
            updates = ProfileUpdate(display_name="NewName", bio="New bio", country="US")
            result = await profile_service.update_profile("user-123", updates)
            
            assert result is not None
            assert result.display_name == "NewName"
            mock_cache.delete.assert_called_once()

    @pytest.mark.asyncio
    async def test_update_profile_returns_none_for_nonexistent(self, profile_service):
        """Should return None for non-existent profile."""
        with patch.object(profile_service.profile_repo, 'update_profile', new_callable=AsyncMock) as mock_update:
            mock_update.return_value = None
            
            updates = ProfileUpdate(display_name="NewName")
            result = await profile_service.update_profile("nonexistent", updates)
            
            assert result is None


class TestAvatarUpload:
    """Tests for avatar upload methods."""

    @pytest.mark.asyncio
    async def test_get_avatar_upload_url(self, profile_service, mock_storage):
        """Should generate signed URL for avatar upload."""
        result = await profile_service.get_avatar_upload_url("user-123", "image/jpeg")
        
        assert result.upload_url == "https://storage.example.com/upload"
        assert result.max_size_bytes == 5 * 1024 * 1024
        mock_storage.generate_signed_upload_url.assert_called_once()

    @pytest.mark.asyncio
    async def test_confirm_avatar_upload(self, profile_service, mock_storage, mock_cache):
        """Should process avatar and update profile."""
        with patch.object(profile_service.profile_repo, 'update_avatar_url', new_callable=AsyncMock) as mock_update:
            mock_update.return_value = {"id": "user-123", "avatar_url": "https://cdn.example.com/avatar_256x256.webp"}
            
            result = await profile_service.confirm_avatar_upload("user-123", "avatars/user-123/abc.jpg")
            
            assert result.url == "https://cdn.example.com/avatar_256x256.webp"
            assert len(result.variants) == 3
            mock_storage.process_avatar.assert_called_once()
            mock_storage.delete_old_versions.assert_called_once()
            mock_cache.delete.assert_called_once()



class TestBannerUpload:
    """Tests for banner upload methods."""

    @pytest.mark.asyncio
    async def test_get_banner_upload_url(self, profile_service, mock_storage):
        """Should generate signed URL for banner upload."""
        result = await profile_service.get_banner_upload_url("user-123", "image/png")
        
        assert result.upload_url == "https://storage.example.com/upload"
        mock_storage.generate_signed_upload_url.assert_called_once()

    @pytest.mark.asyncio
    async def test_confirm_banner_upload(self, profile_service, mock_storage, mock_cache):
        """Should process banner and update profile."""
        with patch.object(profile_service.profile_repo, 'update_banner_url', new_callable=AsyncMock) as mock_update:
            mock_update.return_value = {"id": "user-123", "banner_url": "https://cdn.example.com/banner_1920x540.webp"}
            
            result = await profile_service.confirm_banner_upload("user-123", "banners/user-123/abc.jpg")
            
            assert result.url == "https://cdn.example.com/banner_1920x540.webp"
            assert len(result.variants) == 2
            mock_storage.process_banner.assert_called_once()
            mock_storage.delete_old_versions.assert_called_once()
            mock_cache.delete.assert_called_once()


class TestPrivacySettings:
    """Tests for privacy settings methods."""

    @pytest.mark.asyncio
    async def test_update_privacy_settings(self, profile_service, mock_cache):
        """Should update privacy settings and invalidate cache."""
        updated_data = {
            "id": "user-123",
            "display_name": "TestUser",
            "bio": None,
            "avatar_url": None,
            "banner_url": None,
            "banner_color": "#1a1a2e",
            "level": 1,
            "total_xp": 0,
            "title": "Rookie",
            "country": None,
            "social_links": {},
            "is_public": False,
            "accept_friend_requests": False,
            "allow_messages": True,
            "created_at": "2024-01-01T00:00:00Z",
            "updated_at": "2024-12-01T00:00:00Z",
        }
        
        with patch.object(profile_service.profile_repo, 'update_privacy_settings', new_callable=AsyncMock) as mock_update:
            mock_update.return_value = updated_data
            
            settings = PrivacySettings(is_public=False, accept_friend_requests=False, allow_messages=True)
            result = await profile_service.update_privacy_settings("user-123", settings)
            
            assert result is not None
            assert result.is_public is False
            assert result.accept_friend_requests is False
            mock_cache.delete.assert_called_once()

    @pytest.mark.asyncio
    async def test_update_privacy_settings_returns_none_for_nonexistent(self, profile_service):
        """Should return None for non-existent profile."""
        with patch.object(profile_service.profile_repo, 'update_privacy_settings', new_callable=AsyncMock) as mock_update:
            mock_update.return_value = None
            
            settings = PrivacySettings(is_public=False)
            result = await profile_service.update_privacy_settings("nonexistent", settings)
            
            assert result is None


class TestComputeLevel:
    """Tests for compute_level static method."""

    def test_compute_level_zero_xp(self):
        """Level should be 1 for 0 XP."""
        assert ProfileService.compute_level(0) == 1

    def test_compute_level_negative_xp(self):
        """Level should be 1 for negative XP."""
        assert ProfileService.compute_level(-100) == 1

    def test_compute_level_100_xp(self):
        """Level should be 1 for 100 XP."""
        assert ProfileService.compute_level(100) == 1

    def test_compute_level_400_xp(self):
        """Level should be 2 for 400 XP."""
        assert ProfileService.compute_level(400) == 2

    def test_compute_level_900_xp(self):
        """Level should be 3 for 900 XP."""
        assert ProfileService.compute_level(900) == 3

    def test_compute_level_10000_xp(self):
        """Level should be 10 for 10000 XP."""
        assert ProfileService.compute_level(10000) == 10


class TestAddXp:
    """Tests for add_xp method."""

    @pytest.mark.asyncio
    async def test_add_xp_success(self, profile_service, mock_cache):
        """Should add XP and invalidate cache."""
        updated_data = {
            "id": "user-123",
            "display_name": "TestUser",
            "bio": None,
            "avatar_url": None,
            "banner_url": None,
            "banner_color": "#1a1a2e",
            "level": 2,
            "total_xp": 500,
            "title": "Rookie",
            "country": None,
            "social_links": {},
            "is_public": True,
            "accept_friend_requests": True,
            "allow_messages": True,
            "created_at": "2024-01-01T00:00:00Z",
            "updated_at": "2024-12-01T00:00:00Z",
        }
        
        with patch.object(profile_service.profile_repo, 'increment_xp', new_callable=AsyncMock) as mock_increment:
            mock_increment.return_value = updated_data
            
            result = await profile_service.add_xp("user-123", 500)
            
            assert result is not None
            assert result.total_xp == 500
            assert result.level == 2
            mock_cache.delete.assert_called_once()

    @pytest.mark.asyncio
    async def test_add_xp_returns_none_for_nonexistent(self, profile_service):
        """Should return None for non-existent profile."""
        with patch.object(profile_service.profile_repo, 'increment_xp', new_callable=AsyncMock) as mock_increment:
            mock_increment.return_value = None
            
            result = await profile_service.add_xp("nonexistent", 100)
            
            assert result is None


class TestCacheKeyGeneration:
    """Tests for cache key generation."""

    def test_profile_cache_key_format(self, profile_service):
        """Should generate correct cache key format."""
        key = profile_service._profile_cache_key("user-123")
        assert key == "profile:user:user-123"
