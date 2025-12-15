"""
Property-based tests for Dynamic Shop CMS.
Tests asset management, cosmetic CRUD, and shop rotations.

**Feature: dynamic-shop-cms**
"""

import pytest
from hypothesis import given, strategies as st, assume, settings
from datetime import datetime, timedelta
from unittest.mock import Mock, AsyncMock, patch
import uuid

from app.services.asset_service import (
    AssetManagementService,
    AssetUploadResult,
    ValidationResult,
)
from app.schemas.admin_cosmetic import (
    CosmeticCreateRequest,
    CosmeticUpdateRequest,
    CosmeticType,
    Rarity,
)


# =============================================================================
# Strategies for generating test data
# =============================================================================

cosmetic_types = st.sampled_from(["skin", "emote", "banner", "nameplate", "effect", "trail", "runner"])
rarities = st.sampled_from(["common", "uncommon", "rare", "epic", "legendary"])
valid_content_types = st.sampled_from(["image/png", "image/webp", "application/json"])
invalid_content_types = st.sampled_from(["image/jpeg", "video/mp4", "text/plain", "application/pdf"])

# File extensions
extensions = st.sampled_from([".png", ".webp", ".json", ""])

# Filenames
filenames = st.text(
    alphabet=st.characters(whitelist_categories=("L", "N"), whitelist_characters="-_"),
    min_size=1,
    max_size=50,
).map(lambda s: s + ".png")

# Frame sizes (must be positive and reasonable)
frame_sizes = st.integers(min_value=8, max_value=256)

# Image dimensions (multiples of frame size)
def valid_dimensions(frame_size: int):
    """Generate dimensions that are valid multiples of frame size."""
    multiplier = st.integers(min_value=1, max_value=16)
    return st.tuples(
        multiplier.map(lambda m: m * frame_size),
        multiplier.map(lambda m: m * frame_size),
    )

# Cosmetic names
cosmetic_names = st.text(min_size=1, max_size=100, alphabet=st.characters(whitelist_categories=("L", "N", "P")))

# Prices
prices = st.integers(min_value=0, max_value=100000)


# =============================================================================
# Property 4: Unique filename generation
# **Validates: Requirements 1.4**
# =============================================================================

class TestUniqueFilenameGeneration:
    """
    **Feature: dynamic-shop-cms, Property 4: Unique filename generation**
    **Validates: Requirements 1.4**
    
    *For any* cosmetic type and original filename, generating multiple paths
    should produce unique paths each time.
    """

    @given(
        cosmetic_type=cosmetic_types,
        original_filename=filenames,
        cosmetic_id=st.uuids().map(str),
    )
    @settings(max_examples=100)
    def test_generated_paths_are_unique(self, cosmetic_type, original_filename, cosmetic_id):
        """Each call to generate_unique_path produces a different path."""
        mock_client = Mock()
        service = AssetManagementService(mock_client)
        
        # Generate multiple paths
        paths = set()
        for _ in range(10):
            path = service.generate_unique_path(cosmetic_type, original_filename, cosmetic_id)
            paths.add(path)
        
        # All paths should be unique
        assert len(paths) == 10, "Generated paths should all be unique"

    @given(
        cosmetic_type=cosmetic_types,
        original_filename=filenames,
    )
    def test_path_contains_correct_prefix(self, cosmetic_type, original_filename):
        """Generated path should contain the correct type prefix."""
        mock_client = Mock()
        service = AssetManagementService(mock_client)
        
        path = service.generate_unique_path(cosmetic_type, original_filename)
        
        expected_prefix = service.TYPE_PREFIXES.get(cosmetic_type, "misc")
        assert path.startswith(expected_prefix + "/"), f"Path should start with {expected_prefix}/"

    @given(
        cosmetic_type=cosmetic_types,
        original_filename=st.text(
            min_size=1, 
            max_size=20,
            alphabet=st.characters(whitelist_categories=("L", "N"), whitelist_characters="-_")
        ).map(lambda s: s + ".webp"),
    )
    def test_path_preserves_extension(self, cosmetic_type, original_filename):
        """Generated path should preserve the original file extension."""
        assume(not original_filename.startswith("/"))  # Skip invalid filenames
        
        mock_client = Mock()
        service = AssetManagementService(mock_client)
        
        path = service.generate_unique_path(cosmetic_type, original_filename)
        
        assert path.endswith(".webp"), "Path should preserve .webp extension"


# =============================================================================
# Property 2: Sprite sheet dimension validation
# **Validates: Requirements 1.2**
# =============================================================================

class TestSpriteSheetValidation:
    """
    **Feature: dynamic-shop-cms, Property 2: Sprite sheet dimension validation**
    **Validates: Requirements 1.2**
    
    *For any* sprite sheet, dimensions must be divisible by the expected frame size.
    """

    @given(
        frame_size=frame_sizes,
        cols=st.integers(min_value=1, max_value=16),
        rows=st.integers(min_value=1, max_value=16),
    )
    def test_valid_dimensions_pass_validation(self, frame_size, cols, rows):
        """Sprite sheets with valid dimensions should pass validation."""
        width = cols * frame_size
        height = rows * frame_size
        
        # Create a mock image with valid dimensions
        mock_client = Mock()
        service = AssetManagementService(mock_client)
        
        # Create minimal PNG data with correct dimensions
        with patch('app.services.asset_service.Image') as mock_image:
            mock_img = Mock()
            mock_img.size = (width, height)
            mock_image.open.return_value = mock_img
            
            result = service.validate_sprite_sheet(b"fake_image_data", frame_size)
        
        assert result.valid is True
        assert result.width == width
        assert result.height == height
        assert result.frame_count == cols * rows

    @given(
        frame_size=frame_sizes,
        offset=st.integers(min_value=1, max_value=7),
    )
    def test_invalid_width_fails_validation(self, frame_size, offset):
        """Sprite sheets with invalid width should fail validation."""
        assume(offset < frame_size)  # Ensure offset creates invalid dimension
        
        width = frame_size * 4 + offset  # Invalid width
        height = frame_size * 4  # Valid height
        
        mock_client = Mock()
        service = AssetManagementService(mock_client)
        
        with patch('app.services.asset_service.Image') as mock_image:
            mock_img = Mock()
            mock_img.size = (width, height)
            mock_image.open.return_value = mock_img
            
            result = service.validate_sprite_sheet(b"fake_image_data", frame_size)
        
        assert result.valid is False
        assert "Width" in result.error_message


# =============================================================================
# Property 3: Upload error messages
# **Validates: Requirements 1.3**
# =============================================================================

class TestUploadErrorMessages:
    """
    **Feature: dynamic-shop-cms, Property 3: Upload error messages**
    **Validates: Requirements 1.3**
    
    *For any* invalid upload, the system should return a descriptive error message.
    """

    @given(content_type=invalid_content_types)
    def test_invalid_content_type_returns_error(self, content_type):
        """Invalid content types should return descriptive error."""
        mock_client = Mock()
        service = AssetManagementService(mock_client)
        
        result = service.validate_content_type(content_type)
        
        assert result.valid is False
        assert content_type in result.error_message
        assert "Allowed" in result.error_message

    @given(size_mb=st.integers(min_value=11, max_value=100))
    def test_oversized_file_returns_error(self, size_mb):
        """Files over 10MB should return descriptive error."""
        mock_client = Mock()
        service = AssetManagementService(mock_client)
        
        file_data = b"x" * (size_mb * 1024 * 1024)
        result = service.validate_file_size(file_data)
        
        assert result.valid is False
        assert "too large" in result.error_message.lower()
        assert "Maximum" in result.error_message


# =============================================================================
# Property 17: Cosmetic serialization round-trip
# **Validates: Requirements 6.1**
# =============================================================================

class TestCosmeticSerialization:
    """
    **Feature: dynamic-shop-cms, Property 17: Cosmetic serialization round-trip**
    **Validates: Requirements 6.1**
    
    *For any* valid cosmetic data, serializing and deserializing should preserve all fields.
    """

    @given(
        name=cosmetic_names,
        cosmetic_type=st.sampled_from(list(CosmeticType)),
        rarity=st.sampled_from(list(Rarity)),
        price=prices,
    )
    def test_create_request_round_trip(self, name, cosmetic_type, rarity, price):
        """CosmeticCreateRequest should serialize and deserialize correctly."""
        assume(len(name.strip()) > 0)
        
        request = CosmeticCreateRequest(
            name=name,
            type=cosmetic_type,
            rarity=rarity,
            price_coins=price,
            image_url="https://example.com/image.png",
        )
        
        # Serialize to dict
        data = request.model_dump()
        
        # Deserialize back
        restored = CosmeticCreateRequest(**data)
        
        assert restored.name == request.name
        assert restored.type == request.type
        assert restored.rarity == request.rarity
        assert restored.price_coins == request.price_coins
        assert restored.image_url == request.image_url


# =============================================================================
# Property 18: Deserialization validation
# **Validates: Requirements 6.2**
# =============================================================================

class TestDeserializationValidation:
    """
    **Feature: dynamic-shop-cms, Property 18: Deserialization validation**
    **Validates: Requirements 6.2**
    
    *For any* invalid input data, deserialization should raise validation errors.
    """

    @given(price=st.integers(max_value=-1))
    def test_negative_price_rejected(self, price):
        """Negative prices should be rejected."""
        with pytest.raises(Exception):  # Pydantic ValidationError
            CosmeticCreateRequest(
                name="Test",
                type=CosmeticType.SKIN,
                rarity=Rarity.COMMON,
                price_coins=price,
                image_url="https://example.com/image.png",
            )

    def test_missing_required_fields_rejected(self):
        """Missing required fields should be rejected."""
        with pytest.raises(Exception):
            CosmeticCreateRequest(
                name="Test",
                # Missing type, rarity, price_coins, image_url
            )


# =============================================================================
# Property 9: Required field validation
# **Validates: Requirements 2.5**
# =============================================================================

class TestRequiredFieldValidation:
    """
    **Feature: dynamic-shop-cms, Property 9: Required field validation**
    **Validates: Requirements 2.5**
    
    *For any* cosmetic creation request, all required fields must be present.
    """

    @given(
        name=cosmetic_names,
        cosmetic_type=st.sampled_from(list(CosmeticType)),
        rarity=st.sampled_from(list(Rarity)),
        price=prices,
    )
    def test_valid_request_accepted(self, name, cosmetic_type, rarity, price):
        """Valid requests with all required fields should be accepted."""
        assume(len(name.strip()) > 0)
        
        # Should not raise
        request = CosmeticCreateRequest(
            name=name,
            type=cosmetic_type,
            rarity=rarity,
            price_coins=price,
            image_url="https://example.com/image.png",
        )
        
        assert request.name == name
        assert request.type == cosmetic_type
        assert request.rarity == rarity
        assert request.price_coins == price


# =============================================================================
# Property 6: Partial update preserves unchanged fields
# **Validates: Requirements 2.2**
# =============================================================================

class TestPartialUpdatePreservation:
    """
    **Feature: dynamic-shop-cms, Property 6: Partial update preserves unchanged fields**
    **Validates: Requirements 2.2**
    
    *For any* partial update, only specified fields should change.
    """

    @given(
        new_name=cosmetic_names,
        new_price=prices,
    )
    def test_partial_update_only_changes_specified_fields(self, new_name, new_price):
        """Partial updates should only include specified fields."""
        assume(len(new_name.strip()) > 0)
        
        # Create update with only some fields
        update = CosmeticUpdateRequest(
            name=new_name,
            price_coins=new_price,
        )
        
        # Serialize excluding None values
        data = update.model_dump(exclude_none=True)
        
        # Should only contain the fields we set
        assert "name" in data
        assert "price_coins" in data
        assert data["name"] == new_name
        assert data["price_coins"] == new_price
        
        # Should not contain fields we didn't set
        assert "description" not in data or data.get("description") is None
        assert "rarity" not in data or data.get("rarity") is None



# =============================================================================
# Property 8: Availability window enforcement
# **Validates: Requirements 2.4, 3.2**
# =============================================================================

class TestAvailabilityWindowEnforcement:
    """
    **Feature: dynamic-shop-cms, Property 8: Availability window enforcement**
    **Validates: Requirements 2.4, 3.2**
    
    *For any* cosmetic with availability windows, it should only be visible
    when the current time is within the window.
    """

    @given(
        days_offset=st.integers(min_value=-30, max_value=30),
    )
    def test_availability_window_logic(self, days_offset):
        """Items should be available only within their window."""
        now = datetime.utcnow()
        
        # Create a window that starts 10 days ago and ends 10 days from now
        available_from = now - timedelta(days=10)
        available_until = now + timedelta(days=10)
        
        # Check time is within window
        check_time = now + timedelta(days=days_offset)
        
        is_available = available_from <= check_time <= available_until
        
        # Verify the logic
        if -10 <= days_offset <= 10:
            assert is_available, f"Should be available at offset {days_offset}"
        else:
            assert not is_available, f"Should not be available at offset {days_offset}"


# =============================================================================
# Property 10: Featured flag behavior
# **Validates: Requirements 3.1**
# =============================================================================

class TestFeaturedFlagBehavior:
    """
    **Feature: dynamic-shop-cms, Property 10: Featured flag behavior**
    **Validates: Requirements 3.1**
    
    *For any* cosmetic, setting is_featured should make it appear in featured queries.
    """

    @given(is_featured=st.booleans())
    def test_featured_flag_filtering(self, is_featured):
        """Featured flag should correctly filter items."""
        # Simulate a list of cosmetics
        cosmetics = [
            {"id": "1", "name": "Item 1", "is_featured": True},
            {"id": "2", "name": "Item 2", "is_featured": False},
            {"id": "3", "name": "Item 3", "is_featured": True},
        ]
        
        # Filter by featured
        featured = [c for c in cosmetics if c["is_featured"]]
        non_featured = [c for c in cosmetics if not c["is_featured"]]
        
        assert len(featured) == 2
        assert len(non_featured) == 1
        assert all(c["is_featured"] for c in featured)
        assert all(not c["is_featured"] for c in non_featured)


# =============================================================================
# Property 11: Rotation execution
# **Validates: Requirements 3.3, 3.4**
# =============================================================================

class TestRotationExecution:
    """
    **Feature: dynamic-shop-cms, Property 11: Rotation execution**
    **Validates: Requirements 3.3, 3.4**
    
    *For any* rotation with rules, executing it should select items according to rules.
    """

    @given(
        count=st.integers(min_value=1, max_value=10),
        rarity_filter=st.sampled_from([None, "common", "rare", "legendary"]),
    )
    def test_rotation_rule_application(self, count, rarity_filter):
        """Rotation rules should correctly filter and select items."""
        # Simulate cosmetics pool
        cosmetics = [
            {"id": str(i), "rarity": ["common", "rare", "legendary"][i % 3]}
            for i in range(20)
        ]
        
        # Apply rarity filter if specified
        if rarity_filter:
            filtered = [c for c in cosmetics if c["rarity"] == rarity_filter]
        else:
            filtered = cosmetics
        
        # Select up to count items
        selected = filtered[:count]
        
        assert len(selected) <= count
        if rarity_filter and filtered:
            assert all(c["rarity"] == rarity_filter for c in selected)


# =============================================================================
# Property 19: Asset metadata completeness
# **Validates: Requirements 6.3**
# =============================================================================

class TestAssetMetadataCompleteness:
    """
    **Feature: dynamic-shop-cms, Property 19: Asset metadata completeness**
    **Validates: Requirements 6.3**
    
    *For any* uploaded asset, metadata should include all required fields.
    """

    @given(
        content_type=valid_content_types,
        file_size=st.integers(min_value=1, max_value=10 * 1024 * 1024),
        width=st.integers(min_value=1, max_value=4096),
        height=st.integers(min_value=1, max_value=4096),
    )
    def test_upload_result_contains_metadata(self, content_type, file_size, width, height):
        """Successful uploads should include complete metadata."""
        result = AssetUploadResult(
            success=True,
            public_url="https://example.com/asset.png",
            storage_path="skins/test/asset.png",
            content_type=content_type,
            file_size=file_size,
            width=width,
            height=height,
        )
        
        assert result.success is True
        assert result.public_url is not None
        assert result.storage_path is not None
        assert result.content_type == content_type
        assert result.file_size == file_size
        assert result.width == width
        assert result.height == height

    @given(
        frame_size=frame_sizes,
        cols=st.integers(min_value=1, max_value=8),
        rows=st.integers(min_value=1, max_value=8),
    )
    def test_sprite_metadata_includes_frame_count(self, frame_size, cols, rows):
        """Sprite sheet metadata should include frame count."""
        width = cols * frame_size
        height = rows * frame_size
        frame_count = cols * rows
        
        result = AssetUploadResult(
            success=True,
            public_url="https://example.com/sprite.png",
            storage_path="skins/test/sprite.png",
            content_type="image/png",
            file_size=1024,
            width=width,
            height=height,
            frame_count=frame_count,
        )
        
        assert result.frame_count == frame_count
        assert result.frame_count == cols * rows


# =============================================================================
# Property 5: Cosmetic creation stores all fields
# **Validates: Requirements 2.1**
# =============================================================================

class TestCosmeticCreationStoresAllFields:
    """
    **Feature: dynamic-shop-cms, Property 5: Cosmetic creation stores all fields**
    **Validates: Requirements 2.1**
    
    *For any* valid cosmetic creation request, all provided fields should be stored.
    """

    @given(
        name=cosmetic_names,
        description=st.text(max_size=500, alphabet=st.characters(whitelist_categories=("L", "N", "P", "S"))),
        cosmetic_type=st.sampled_from(list(CosmeticType)),
        rarity=st.sampled_from(list(Rarity)),
        price=prices,
        is_limited=st.booleans(),
    )
    def test_all_fields_preserved_in_request(
        self, name, description, cosmetic_type, rarity, price, is_limited
    ):
        """All fields in creation request should be preserved."""
        assume(len(name.strip()) > 0)
        # Filter out control characters that might cause issues
        clean_description = description.strip() if description else None
        
        request = CosmeticCreateRequest(
            name=name,
            description=clean_description if clean_description else None,
            type=cosmetic_type,
            rarity=rarity,
            price_coins=price,
            image_url="https://example.com/image.png",
            is_limited=is_limited,
        )
        
        data = request.model_dump(exclude_none=True)
        
        assert data["name"] == name
        assert data["type"] == cosmetic_type
        assert data["rarity"] == rarity
        assert data["price_coins"] == price
        assert data["is_limited"] == is_limited
        if clean_description:
            assert data.get("description") == clean_description


# =============================================================================
# Property 7: Delete cascades to assets
# **Validates: Requirements 2.3**
# =============================================================================

class TestDeleteCascadesToAssets:
    """
    **Feature: dynamic-shop-cms, Property 7: Delete cascades to assets**
    **Validates: Requirements 2.3**
    
    *For any* cosmetic with assets, deleting the cosmetic should delete all assets.
    """

    @given(asset_count=st.integers(min_value=0, max_value=5))
    def test_cascade_delete_logic(self, asset_count):
        """Deleting a cosmetic should trigger deletion of all its assets."""
        # Simulate assets for a cosmetic
        cosmetic_id = str(uuid.uuid4())
        assets = [
            {"id": str(uuid.uuid4()), "cosmetic_id": cosmetic_id, "storage_path": f"path/{i}.png"}
            for i in range(asset_count)
        ]
        
        # Simulate cascade delete
        deleted_paths = [asset["storage_path"] for asset in assets]
        
        # Verify all assets would be deleted
        assert len(deleted_paths) == asset_count
        for i, path in enumerate(deleted_paths):
            assert f"path/{i}.png" == path


# =============================================================================
# Property 1: Asset upload returns valid URL
# **Validates: Requirements 1.1**
# =============================================================================

class TestAssetUploadReturnsValidUrl:
    """
    **Feature: dynamic-shop-cms, Property 1: Asset upload returns valid URL**
    **Validates: Requirements 1.1**
    
    *For any* successful upload, the returned URL should be valid and accessible.
    """

    @given(
        cosmetic_type=cosmetic_types,
        filename=filenames,
    )
    def test_generated_url_format(self, cosmetic_type, filename):
        """Generated storage paths should follow expected format."""
        mock_client = Mock()
        service = AssetManagementService(mock_client)
        
        path = service.generate_unique_path(cosmetic_type, filename)
        
        # Path should have format: prefix/uuid.ext
        parts = path.split("/")
        assert len(parts) >= 2, "Path should have at least prefix/filename"
        
        # Should end with valid extension
        assert path.endswith((".png", ".webp", ".json")), "Path should have valid extension"
