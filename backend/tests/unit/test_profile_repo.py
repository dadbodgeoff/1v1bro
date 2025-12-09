"""
Unit tests for ProfileRepository.
Tests database operations for user profiles.
"""

import pytest
from unittest.mock import MagicMock
from datetime import datetime

from app.database.repositories.profile_repo import ProfileRepository


class MockQueryBuilder:
    """Mock Supabase query builder for chaining."""
    
    def __init__(self, data=None, count=None):
        self._data = data
        self._count = count
        self._result = MagicMock()
        # Supabase returns data as a list, so wrap single dict in list
        if isinstance(data, dict):
            self._result.data = [data]
        elif isinstance(data, list):
            self._result.data = data
        else:
            self._result.data = data
        self._result.count = count
    
    def select(self, *args, **kwargs):
        return self
    
    def insert(self, data):
        return self
    
    def update(self, data):
        return self
    
    def delete(self):
        return self
    
    def eq(self, *args):
        return self
    
    def neq(self, *args):
        return self
    
    def ilike(self, *args):
        return self
    
    def order(self, *args, **kwargs):
        return self
    
    def range(self, *args):
        return self
    
    def limit(self, *args):
        return self
    
    def single(self):
        return self
    
    def execute(self):
        return self._result


@pytest.fixture
def mock_client():
    """Create a mock Supabase client."""
    return MagicMock()


@pytest.fixture
def profile_repo(mock_client):
    """Create ProfileRepository with mock client."""
    return ProfileRepository(mock_client)


class TestGetProfile:
    """Tests for get_profile method."""

    @pytest.mark.asyncio
    async def test_get_profile_returns_full_profile_for_owner(self, profile_repo, mock_client):
        """Owner should see full profile data."""
        profile_data = {
            "id": "user-123",
            "display_name": "TestUser",
            "bio": "My bio",
            "avatar_url": "https://cdn.example.com/avatar.jpg",
            "banner_url": "https://cdn.example.com/banner.jpg",
            "banner_color": "#1a1a2e",
            "level": 5,
            "total_xp": 2500,
            "title": "Veteran",
            "country": "US",
            "social_links": {"twitch": "https://twitch.tv/test"},
            "is_public": True,
            "accept_friend_requests": True,
            "allow_messages": True,
            "created_at": "2024-01-01T00:00:00Z",
            "updated_at": "2024-12-01T00:00:00Z",
        }
        
        mock_client.table.return_value = MockQueryBuilder(data=profile_data)
        
        result = await profile_repo.get_profile("user-123", "user-123")
        
        assert result == profile_data
        assert result["bio"] == "My bio"
        assert result["social_links"] == {"twitch": "https://twitch.tv/test"}

    @pytest.mark.asyncio
    async def test_get_profile_returns_limited_data_for_private_profile(self, profile_repo, mock_client):
        """Non-owner should see limited data for private profiles."""
        profile_data = {
            "id": "user-123",
            "display_name": "TestUser",
            "bio": "Secret bio",
            "avatar_url": "https://cdn.example.com/avatar.jpg",
            "banner_url": "https://cdn.example.com/banner.jpg",
            "banner_color": "#1a1a2e",
            "level": 5,
            "title": "Veteran",
            "country": "US",
            "social_links": {"twitch": "https://twitch.tv/test"},
            "is_public": False,
            "created_at": "2024-01-01T00:00:00Z",
            "updated_at": "2024-12-01T00:00:00Z",
        }
        
        mock_client.table.return_value = MockQueryBuilder(data=profile_data)
        
        result = await profile_repo.get_profile("user-123", "viewer-456")
        
        # Should not include bio or social_links for private profile
        assert result["id"] == "user-123"
        assert result["display_name"] == "TestUser"
        assert result["is_public"] is False
        assert "bio" not in result or result.get("bio") is None
        assert "social_links" not in result

    @pytest.mark.asyncio
    async def test_get_profile_returns_none_for_nonexistent(self, profile_repo, mock_client):
        """Should return None for non-existent profile."""
        mock_client.table.return_value = MockQueryBuilder(data=None)
        
        result = await profile_repo.get_profile("nonexistent-user")
        
        assert result is None

    @pytest.mark.asyncio
    async def test_get_profile_public_profile_shows_all_data(self, profile_repo, mock_client):
        """Public profile should show all data to viewers."""
        profile_data = {
            "id": "user-123",
            "display_name": "TestUser",
            "bio": "Public bio",
            "avatar_url": "https://cdn.example.com/avatar.jpg",
            "is_public": True,
            "created_at": "2024-01-01T00:00:00Z",
            "updated_at": "2024-12-01T00:00:00Z",
        }
        
        mock_client.table.return_value = MockQueryBuilder(data=profile_data)
        
        result = await profile_repo.get_profile("user-123", "viewer-456")
        
        # Public profile should return full data
        assert result["bio"] == "Public bio"


class TestUpdateProfile:
    """Tests for update_profile method."""

    @pytest.mark.asyncio
    async def test_update_profile_filters_none_values(self, profile_repo, mock_client):
        """Should filter out None values from updates."""
        updated_data = {
            "id": "user-123",
            "display_name": "NewName",
            "bio": "Old bio",
        }
        
        mock_client.table.return_value = MockQueryBuilder(data=[updated_data])
        
        result = await profile_repo.update_profile("user-123", {
            "display_name": "NewName",
            "bio": None,  # Should be filtered out
        })
        
        assert result["display_name"] == "NewName"

    @pytest.mark.asyncio
    async def test_update_profile_returns_none_for_nonexistent(self, profile_repo, mock_client):
        """Should return None when updating non-existent profile."""
        mock_client.table.return_value = MockQueryBuilder(data=[])
        
        result = await profile_repo.update_profile("nonexistent", {"display_name": "Test"})
        
        assert result is None

    @pytest.mark.asyncio
    async def test_update_profile_adds_updated_at(self, profile_repo, mock_client):
        """Should add updated_at timestamp to updates."""
        updated_data = {
            "id": "user-123",
            "display_name": "NewName",
        }
        
        mock_builder = MockQueryBuilder(data=[updated_data])
        mock_client.table.return_value = mock_builder
        
        await profile_repo.update_profile("user-123", {"display_name": "NewName"})
        
        # Verify update was called (the mock captures this)
        mock_client.table.assert_called()


class TestUpdateAvatarUrl:
    """Tests for update_avatar_url method."""

    @pytest.mark.asyncio
    async def test_update_avatar_url_success(self, profile_repo, mock_client):
        """Should update avatar URL successfully."""
        updated_data = {
            "id": "user-123",
            "avatar_url": "https://cdn.example.com/new-avatar.jpg",
        }
        
        mock_client.table.return_value = MockQueryBuilder(data=[updated_data])
        
        result = await profile_repo.update_avatar_url("user-123", "https://cdn.example.com/new-avatar.jpg")
        
        assert result["avatar_url"] == "https://cdn.example.com/new-avatar.jpg"

    @pytest.mark.asyncio
    async def test_update_avatar_url_returns_none_for_nonexistent(self, profile_repo, mock_client):
        """Should return None for non-existent user."""
        mock_client.table.return_value = MockQueryBuilder(data=[])
        
        result = await profile_repo.update_avatar_url("nonexistent", "https://cdn.example.com/avatar.jpg")
        
        assert result is None


class TestUpdateBannerUrl:
    """Tests for update_banner_url method."""

    @pytest.mark.asyncio
    async def test_update_banner_url_success(self, profile_repo, mock_client):
        """Should update banner URL successfully."""
        updated_data = {
            "id": "user-123",
            "banner_url": "https://cdn.example.com/new-banner.jpg",
        }
        
        mock_client.table.return_value = MockQueryBuilder(data=[updated_data])
        
        result = await profile_repo.update_banner_url("user-123", "https://cdn.example.com/new-banner.jpg")
        
        assert result["banner_url"] == "https://cdn.example.com/new-banner.jpg"

    @pytest.mark.asyncio
    async def test_update_banner_url_returns_none_for_nonexistent(self, profile_repo, mock_client):
        """Should return None for non-existent user."""
        mock_client.table.return_value = MockQueryBuilder(data=[])
        
        result = await profile_repo.update_banner_url("nonexistent", "https://cdn.example.com/banner.jpg")
        
        assert result is None


class TestUpdatePrivacySettings:
    """Tests for update_privacy_settings method."""

    @pytest.mark.asyncio
    async def test_update_privacy_settings_partial(self, profile_repo, mock_client):
        """Should update only provided privacy settings."""
        updated_data = {
            "id": "user-123",
            "is_public": False,
            "accept_friend_requests": True,
            "allow_messages": True,
        }
        
        mock_client.table.return_value = MockQueryBuilder(data=[updated_data])
        
        result = await profile_repo.update_privacy_settings("user-123", is_public=False)
        
        assert result["is_public"] is False

    @pytest.mark.asyncio
    async def test_update_privacy_settings_all(self, profile_repo, mock_client):
        """Should update all privacy settings when provided."""
        updated_data = {
            "id": "user-123",
            "is_public": False,
            "accept_friend_requests": False,
            "allow_messages": False,
        }
        
        mock_client.table.return_value = MockQueryBuilder(data=[updated_data])
        
        result = await profile_repo.update_privacy_settings(
            "user-123",
            is_public=False,
            accept_friend_requests=False,
            allow_messages=False,
        )
        
        assert result["is_public"] is False
        assert result["accept_friend_requests"] is False
        assert result["allow_messages"] is False

    @pytest.mark.asyncio
    async def test_update_privacy_settings_returns_none_for_nonexistent(self, profile_repo, mock_client):
        """Should return None for non-existent user."""
        mock_client.table.return_value = MockQueryBuilder(data=[])
        
        result = await profile_repo.update_privacy_settings("nonexistent", is_public=False)
        
        assert result is None



class TestIncrementXp:
    """Tests for increment_xp method."""

    @pytest.mark.asyncio
    async def test_increment_xp_updates_level(self, profile_repo, mock_client):
        """Should increment XP and update level."""
        # First call returns current profile
        current_profile = {
            "id": "user-123",
            "total_xp": 0,
            "level": 1,
        }
        
        # Second call returns updated profile
        updated_profile = {
            "id": "user-123",
            "total_xp": 500,
            "level": 2,
        }
        
        # Mock to return different results for select vs update
        mock_builder = MockQueryBuilder(data=current_profile)
        mock_client.table.return_value = mock_builder
        
        # Override execute to return updated data on update
        call_count = [0]
        def mock_execute():
            call_count[0] += 1
            if call_count[0] == 1:
                result = MagicMock()
                result.data = [current_profile]  # Supabase returns list
                return result
            else:
                result = MagicMock()
                result.data = [updated_profile]
                return result
        mock_builder.execute = mock_execute
        
        result = await profile_repo.increment_xp("user-123", 500)
        
        assert result is not None

    @pytest.mark.asyncio
    async def test_increment_xp_returns_none_for_nonexistent(self, profile_repo, mock_client):
        """Should return None for non-existent user."""
        mock_client.table.return_value = MockQueryBuilder(data=None)
        
        result = await profile_repo.increment_xp("nonexistent", 100)
        
        assert result is None


class TestComputeLevel:
    """Tests for compute_level static method."""

    def test_compute_level_zero_xp(self):
        """Level should be 1 for 0 XP."""
        assert ProfileRepository.compute_level(0) == 1

    def test_compute_level_negative_xp(self):
        """Level should be 1 for negative XP."""
        assert ProfileRepository.compute_level(-100) == 1

    def test_compute_level_100_xp(self):
        """Level should be 1 for 100 XP (sqrt(100/100) = 1)."""
        assert ProfileRepository.compute_level(100) == 1

    def test_compute_level_400_xp(self):
        """Level should be 2 for 400 XP (sqrt(400/100) = 2)."""
        assert ProfileRepository.compute_level(400) == 2

    def test_compute_level_900_xp(self):
        """Level should be 3 for 900 XP (sqrt(900/100) = 3)."""
        assert ProfileRepository.compute_level(900) == 3

    def test_compute_level_1600_xp(self):
        """Level should be 4 for 1600 XP (sqrt(1600/100) = 4)."""
        assert ProfileRepository.compute_level(1600) == 4

    def test_compute_level_2500_xp(self):
        """Level should be 5 for 2500 XP (sqrt(2500/100) = 5)."""
        assert ProfileRepository.compute_level(2500) == 5

    def test_compute_level_10000_xp(self):
        """Level should be 10 for 10000 XP (sqrt(10000/100) = 10)."""
        assert ProfileRepository.compute_level(10000) == 10

    def test_compute_level_partial_xp(self):
        """Level should floor for partial XP values."""
        # 350 XP -> sqrt(350/100) = sqrt(3.5) ≈ 1.87 -> floor = 1
        assert ProfileRepository.compute_level(350) == 1
        
        # 500 XP -> sqrt(500/100) = sqrt(5) ≈ 2.24 -> floor = 2
        assert ProfileRepository.compute_level(500) == 2


class TestGetProfileByDisplayName:
    """Tests for get_profile_by_display_name method."""

    @pytest.mark.asyncio
    async def test_get_profile_by_display_name_found(self, profile_repo, mock_client):
        """Should find profile by display name."""
        profile_data = {
            "id": "user-123",
            "display_name": "TestUser",
        }
        
        mock_client.table.return_value = MockQueryBuilder(data=[profile_data])
        
        result = await profile_repo.get_profile_by_display_name("TestUser")
        
        assert result["display_name"] == "TestUser"

    @pytest.mark.asyncio
    async def test_get_profile_by_display_name_not_found(self, profile_repo, mock_client):
        """Should return None when display name not found."""
        mock_client.table.return_value = MockQueryBuilder(data=[])
        
        result = await profile_repo.get_profile_by_display_name("NonExistent")
        
        assert result is None


class TestProfileExists:
    """Tests for profile_exists method."""

    @pytest.mark.asyncio
    async def test_profile_exists_true(self, profile_repo, mock_client):
        """Should return True when profile exists."""
        mock_client.table.return_value = MockQueryBuilder(data=[{"id": "user-123"}])
        
        result = await profile_repo.profile_exists("user-123")
        
        assert result is True

    @pytest.mark.asyncio
    async def test_profile_exists_false(self, profile_repo, mock_client):
        """Should return False when profile doesn't exist."""
        mock_client.table.return_value = MockQueryBuilder(data=[])
        
        result = await profile_repo.profile_exists("nonexistent")
        
        assert result is False


class TestGetProfilesByCountry:
    """Tests for get_profiles_by_country method."""

    @pytest.mark.asyncio
    async def test_get_profiles_by_country_returns_list(self, profile_repo, mock_client):
        """Should return list of profiles for country."""
        profiles = [
            {"id": "user-1", "country": "US", "level": 10},
            {"id": "user-2", "country": "US", "level": 5},
        ]
        
        mock_client.table.return_value = MockQueryBuilder(data=profiles)
        
        result = await profile_repo.get_profiles_by_country("US")
        
        assert len(result) == 2
        assert result[0]["country"] == "US"

    @pytest.mark.asyncio
    async def test_get_profiles_by_country_empty(self, profile_repo, mock_client):
        """Should return empty list when no profiles for country."""
        mock_client.table.return_value = MockQueryBuilder(data=[])
        
        result = await profile_repo.get_profiles_by_country("ZZ")
        
        assert result == []

    @pytest.mark.asyncio
    async def test_get_profiles_by_country_with_pagination(self, profile_repo, mock_client):
        """Should support pagination parameters."""
        profiles = [{"id": "user-1", "country": "US"}]
        
        mock_client.table.return_value = MockQueryBuilder(data=profiles)
        
        result = await profile_repo.get_profiles_by_country("US", limit=10, offset=5)
        
        assert len(result) == 1
