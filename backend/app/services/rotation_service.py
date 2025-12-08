"""
Shop Rotation Service for managing shop rotations.
Requirements: 3.3, 3.4
"""

import logging
import random
from typing import Optional, List
from datetime import datetime

from supabase import Client

from app.database.repositories.rotation_repo import ShopRotationRepository
from app.database.repositories.cosmetics_repo import CosmeticsRepository

logger = logging.getLogger(__name__)


class ShopRotationService:
    """Service for managing shop rotations."""
    
    def __init__(self, client: Client):
        self.rotation_repo = ShopRotationRepository(client)
        self.cosmetics_repo = CosmeticsRepository(client)
    
    async def get_current_rotation(self) -> Optional[dict]:
        """Get the currently active shop rotation."""
        return await self.rotation_repo.get_active()
    
    async def schedule_rotation(
        self,
        name: str,
        rotation_type: str,
        starts_at: datetime,
        ends_at: Optional[datetime] = None,
        rotation_rules: Optional[dict] = None,
        created_by: Optional[str] = None,
    ) -> Optional[dict]:
        """
        Schedule a new shop rotation.
        
        Args:
            name: Name of the rotation
            rotation_type: Type (daily, weekly, event, manual)
            starts_at: When the rotation starts
            ends_at: When the rotation ends (optional)
            rotation_rules: Rules for selecting items
            created_by: User ID who created
            
        Returns:
            Created rotation
        """
        data = {
            "name": name,
            "rotation_type": rotation_type,
            "starts_at": starts_at.isoformat(),
            "is_active": False,
            "rotation_rules": rotation_rules or {},
        }
        
        if ends_at:
            data["ends_at"] = ends_at.isoformat()
        if created_by:
            data["created_by"] = created_by
        
        return await self.rotation_repo.create(data)
    
    async def execute_rotation(self, rotation_id: str) -> bool:
        """
        Execute a scheduled rotation.
        
        Property 11: Rotation execution - selects items based on rules.
        
        Args:
            rotation_id: ID of the rotation to execute
            
        Returns:
            True if executed successfully
        """
        rotation = await self.rotation_repo.get(rotation_id)
        if not rotation:
            logger.error(f"Rotation {rotation_id} not found")
            return False
        
        rules = rotation.get("rotation_rules", {})
        
        # Select items based on rules
        selected_ids = await self._select_items_by_rules(rules)
        
        if not selected_ids:
            logger.warning(f"No items selected for rotation {rotation_id}")
            return False
        
        # Clear current featured items
        current_featured = await self.cosmetics_repo.get_featured()
        for item in current_featured:
            await self.cosmetics_repo.set_featured(item["id"], False)
        
        # Set new featured items
        for cosmetic_id in selected_ids:
            await self.cosmetics_repo.set_featured(cosmetic_id, True)
        
        # Update rotation with selected IDs and activate
        await self.rotation_repo.deactivate_all()
        await self.rotation_repo.update(rotation_id, {
            "featured_cosmetic_ids": selected_ids,
            "is_active": True,
        })
        
        logger.info(f"Executed rotation {rotation_id} with {len(selected_ids)} items")
        return True
    
    async def _select_items_by_rules(self, rules: dict) -> List[str]:
        """
        Select cosmetic IDs based on rotation rules.
        
        Rules format:
        {
            "count": 6,  # Number of items to select
            "by_rarity": {"legendary": 1, "epic": 2, "rare": 3},  # Items per rarity
            "by_type": {"skin": 3, "emote": 2, "banner": 1},  # Items per type
            "include_ids": ["uuid1", "uuid2"],  # Always include these
            "exclude_ids": ["uuid3"],  # Never include these
            "random": true  # Randomly select from pool
        }
        """
        selected = []
        
        # Always include specified IDs
        include_ids = rules.get("include_ids", [])
        selected.extend(include_ids)
        
        exclude_ids = set(rules.get("exclude_ids", []))
        
        # Get available cosmetics
        all_cosmetics = await self.cosmetics_repo.get_available_shop(limit=500)
        available = [c for c in all_cosmetics if c["id"] not in exclude_ids and c["id"] not in selected]
        
        # Select by rarity
        by_rarity = rules.get("by_rarity", {})
        for rarity, count in by_rarity.items():
            rarity_items = [c for c in available if c["rarity"] == rarity and c["id"] not in selected]
            if rules.get("random", True):
                random.shuffle(rarity_items)
            for item in rarity_items[:count]:
                selected.append(item["id"])
        
        # Select by type
        by_type = rules.get("by_type", {})
        for cosmetic_type, count in by_type.items():
            type_items = [c for c in available if c["type"] == cosmetic_type and c["id"] not in selected]
            if rules.get("random", True):
                random.shuffle(type_items)
            for item in type_items[:count]:
                selected.append(item["id"])
        
        # Fill remaining with random if count specified
        total_count = rules.get("count", 0)
        if total_count > len(selected):
            remaining = [c for c in available if c["id"] not in selected]
            if rules.get("random", True):
                random.shuffle(remaining)
            for item in remaining[:total_count - len(selected)]:
                selected.append(item["id"])
        
        return selected
    
    async def get_featured_items(self) -> List[dict]:
        """Get currently featured items based on active rotation."""
        return await self.cosmetics_repo.get_featured()
    
    async def check_availability(self, cosmetic_id: str) -> bool:
        """Check if a cosmetic is currently available for purchase."""
        cosmetic = await self.cosmetics_repo.get_cosmetic(cosmetic_id)
        if not cosmetic:
            return False
        
        now = datetime.utcnow()
        
        # Check available_from
        if cosmetic.get("available_from"):
            available_from = datetime.fromisoformat(cosmetic["available_from"].replace("Z", "+00:00"))
            if now < available_from.replace(tzinfo=None):
                return False
        
        # Check available_until
        if cosmetic.get("available_until"):
            available_until = datetime.fromisoformat(cosmetic["available_until"].replace("Z", "+00:00"))
            if now > available_until.replace(tzinfo=None):
                return False
        
        return True
