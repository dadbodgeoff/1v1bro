"""
Progression Service - Unified Progression Orchestrator.

UNIFIED PROGRESSION: This service coordinates progress initialization with auto-claim,
handles XP award flow with WebSocket events, manages tier advancement logic,
and ensures data consistency across services.

Requirements: 1.1-1.7, 2.1-2.8, 3.1-3.6, 5.1-5.6, 8.1-8.5
"""

import logging
from typing import Optional, List, TYPE_CHECKING

from supabase import Client

from app.database.repositories.battlepass_repo import BattlePassRepository
from app.services.battlepass_service import BattlePassService
from app.services.cosmetics_service import CosmeticsService
from app.schemas.battlepass import (
    PlayerBattlePass,
    XPAwardResult,
    XPSource,
    RewardType,
)

if TYPE_CHECKING:
    from app.services.achievement_service import AchievementService

logger = logging.getLogger(__name__)


class ProgressionService:
    """
    Unified Progression Orchestrator.
    
    Coordinates:
    - Progress initialization with auto-claim tier 1
    - XP award flow with WebSocket events
    - Tier advancement logic
    - Legacy user migration (tier 0 → tier 1)
    - Inventory integration for cosmetic rewards
    - Achievement checking after match completion
    """
    
    def __init__(
        self,
        client: Client,
        battlepass_service: Optional[BattlePassService] = None,
        cosmetics_service: Optional[CosmeticsService] = None,
        achievement_service: Optional["AchievementService"] = None,
    ):
        self._client = client
        self.battlepass_repo = BattlePassRepository(client)
        self.battlepass_service = battlepass_service or BattlePassService(client, cosmetics_service)
        self.cosmetics_service = cosmetics_service or CosmeticsService(client)
        self._achievement_service = achievement_service
    
    async def initialize_progress(self, user_id: str) -> Optional[PlayerBattlePass]:
        """
        Initialize or get player progress with tier 1 auto-claim.
        
        UNIFIED PROGRESSION: Ensures all new players start at tier 1 with
        the tier 1 cosmetic added to their inventory.
        
        Flow:
        1. Get or create progress (now starts at tier 1)
        2. If newly created (tier 1, claimed=[1]), triggers auto-claim flow
        3. Gets tier 1 cosmetic from season tiers
        4. Adds cosmetic to inventory via cosmetics_service
        5. Equips skin if no skin currently equipped
        6. Returns progress
        
        Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 1.7
        """
        # Get current season
        season = await self.battlepass_service.get_current_season()
        if not season:
            logger.warning(f"No active season for user {user_id}")
            return None
        
        # Check if progress already exists
        existing_progress = await self.battlepass_repo.get_player_progress(
            user_id, season.id
        )
        
        if existing_progress:
            # Check if migration needed (tier 0 users)
            if existing_progress.get("current_tier", 0) == 0:
                return await self.migrate_tier_zero_user(user_id)
            
            # Return existing progress
            return await self.battlepass_service.get_player_progress(user_id)
        
        # Create new progress (will be tier 1 with claimed=[1])
        progress_data = await self.battlepass_repo.create_player_progress(
            user_id, season.id
        )
        
        if not progress_data:
            logger.error(f"Failed to create progress for user {user_id}")
            return None
        
        # Auto-claim tier 1 cosmetic
        await self._auto_claim_tier_1(user_id, season.id)
        
        logger.info(f"Initialized progress for user {user_id} at tier 1")
        
        return await self.battlepass_service.get_player_progress(user_id)
    
    async def _auto_claim_tier_1(self, user_id: str, season_id: str) -> bool:
        """
        Auto-claim tier 1 reward and add to inventory.
        
        Requirements: 1.3, 1.4
        """
        try:
            # Get tier 1 reward
            tier_1 = await self.battlepass_repo.get_tier(season_id, 1)
            if not tier_1:
                logger.warning(f"No tier 1 found for season {season_id}")
                return False
            
            # Get the free reward (tier 1 is always free)
            free_reward = tier_1.get("free_reward")
            if not free_reward:
                logger.warning(f"No free reward for tier 1 in season {season_id}")
                return False
            
            reward_type = free_reward.get("type")
            reward_value = free_reward.get("value")
            
            if reward_type == "cosmetic" and reward_value:
                # Add cosmetic to inventory
                try:
                    item = await self.cosmetics_service.purchase_cosmetic(
                        user_id, str(reward_value)
                    )
                    if item:
                        logger.info(
                            f"Auto-claimed tier 1 cosmetic {reward_value} for user {user_id}"
                        )
                        
                        # Auto-equip if no skin equipped
                        await self._auto_equip_if_needed(user_id, str(reward_value))
                        return True
                except Exception as e:
                    logger.error(f"Failed to add tier 1 cosmetic to inventory: {e}")
            
            return False
            
        except Exception as e:
            logger.error(f"Error in auto-claim tier 1 for user {user_id}: {e}")
            return False
    
    async def _auto_equip_if_needed(self, user_id: str, cosmetic_id: str) -> bool:
        """
        Auto-equip the tier 1 skin if user has no skin equipped.
        
        Requirements: 1.4
        """
        try:
            # Check if user has any skin equipped
            loadout = await self.cosmetics_service.get_loadout(user_id)
            
            if not loadout or not loadout.skin_equipped:
                # No skin equipped, equip the tier 1 skin
                await self.cosmetics_service.equip_cosmetic(user_id, cosmetic_id)
                logger.info(f"Auto-equipped tier 1 skin for user {user_id}")
                return True
            
            return False
            
        except Exception as e:
            logger.error(f"Error auto-equipping skin for user {user_id}: {e}")
            return False
    
    async def migrate_tier_zero_user(self, user_id: str) -> Optional[PlayerBattlePass]:
        """
        Migrate existing tier 0 user to tier 1 with auto-claim.
        
        UNIFIED PROGRESSION: Ensures legacy users are upgraded to the new
        tier 1 starting point with the tier 1 cosmetic.
        
        Flow:
        1. Check if user is at tier 0
        2. Update to tier 1
        3. Add tier 1 to claimed_rewards if not present
        4. Add tier 1 cosmetic to inventory
        5. Equip if no skin equipped
        6. Log migration
        7. Return updated progress
        
        Requirements: 8.1, 8.2, 8.3, 8.4, 8.5
        """
        try:
            season = await self.battlepass_service.get_current_season()
            if not season:
                return None
            
            # Get current progress
            progress = await self.battlepass_repo.get_player_progress(user_id, season.id)
            if not progress:
                return None
            
            current_tier = progress.get("current_tier", 0)
            
            # Only migrate if at tier 0
            if current_tier > 0:
                return await self.battlepass_service.get_player_progress(user_id)
            
            # Preserve existing XP
            current_xp = progress.get("current_xp", 0)
            
            # Update to tier 1
            await self.battlepass_repo.update_progress(
                user_id, season.id, 1, current_xp
            )
            
            # Add tier 1 to claimed_rewards if not present
            claimed = progress.get("claimed_rewards", []) or []
            if 1 not in claimed:
                await self.battlepass_repo.mark_reward_claimed(user_id, season.id, 1)
                
                # Add tier 1 cosmetic to inventory
                await self._auto_claim_tier_1(user_id, season.id)
            
            logger.info(f"Migrated user {user_id} from tier 0 to tier 1")
            
            return await self.battlepass_service.get_player_progress(user_id)
            
        except Exception as e:
            logger.error(f"Failed to migrate user {user_id}: {e}")
            # Don't corrupt existing data
            return await self.battlepass_service.get_player_progress(user_id)
    
    async def award_match_xp(
        self,
        user_id: str,
        won: bool,
        kills: int,
        streak: int,
        duration_seconds: int,
        match_id: Optional[str] = None,
    ) -> Optional[XPAwardResult]:
        """
        Award XP from match and handle tier advancement.
        
        UNIFIED PROGRESSION: Calculates XP using the formula and awards it,
        handling tier advancement, logging, and achievement checking.
        
        Flow:
        1. Calculate XP (base + bonuses, clamped to [50, 300])
        2. Update progress (may advance tier)
        3. Log XP gain
        4. Check and award any newly earned achievements
        5. Return XPAwardResult
        
        Requirements: 2.1-2.8, 3.1-3.6, 5.1-5.6
        """
        try:
            # Ensure user has progress initialized
            progress = await self.initialize_progress(user_id)
            if not progress:
                logger.warning(f"Could not initialize progress for user {user_id}")
                return None
            
            # Award XP using battlepass service
            result = await self.battlepass_service.award_match_xp(
                user_id=user_id,
                won=won,
                kills=kills,
                streak=streak,
                duration_seconds=duration_seconds,
                match_id=match_id,
            )
            
            if result:
                logger.info(
                    f"Awarded {result.xp_awarded} XP to user {user_id} "
                    f"(Tier {result.previous_tier} -> {result.new_tier})"
                )
                
                # Check achievements after match completion
                await self._check_achievements_after_match(user_id)
            
            return result
            
        except Exception as e:
            logger.error(f"Failed to award XP to user {user_id}: {e}")
            return None
    
    async def _check_achievements_after_match(self, user_id: str) -> List[dict]:
        """
        Check and award achievements after match completion.
        
        This is called automatically after awarding match XP to ensure
        achievements are checked without requiring a separate API call.
        
        Args:
            user_id: User UUID
            
        Returns:
            List of newly awarded achievements
        """
        try:
            # Lazy import to avoid circular dependency
            if self._achievement_service is None:
                from app.services.achievement_service import AchievementService
                self._achievement_service = AchievementService(self._client)
            
            newly_awarded = await self._achievement_service.check_achievements_for_user(user_id)
            
            if newly_awarded:
                logger.info(
                    f"Awarded {len(newly_awarded)} achievements to user {user_id} after match: "
                    f"{[a['name'] for a in newly_awarded]}"
                )
            
            return newly_awarded
            
        except Exception as e:
            # Don't fail the XP award if achievement check fails
            logger.error(f"Failed to check achievements for user {user_id}: {e}")
            return []
    
    async def get_player_progress(self, user_id: str) -> Optional[PlayerBattlePass]:
        """
        Get player progress with on-access migration for tier 0 users.
        
        Requirements: 8.1
        """
        progress = await self.battlepass_service.get_player_progress(user_id)
        
        if progress and progress.current_tier == 0:
            # Trigger migration
            progress = await self.migrate_tier_zero_user(user_id)
        
        return progress
