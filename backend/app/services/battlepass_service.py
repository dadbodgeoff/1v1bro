"""
Battle Pass service for seasonal progression and XP tracking.
Requirements: 4.1-4.10
"""

import logging
import math
from typing import Optional, List

from supabase import Client

from app.database.repositories.battlepass_repo import BattlePassRepository
from app.services.cosmetics_service import CosmeticsService
from app.schemas.battlepass import (
    Season,
    BattlePassTier,
    Reward,
    RewardType,
    PlayerBattlePass,
    XPSource,
    XPAwardResult,
    MatchXPCalculation,
    SurvivalXPCalculation,
    ClaimResult,
    SeasonResponse,
)
from app.schemas.cosmetic import Cosmetic

logger = logging.getLogger(__name__)


# XP Constants - Arena Shooter (Requirements: 4.3, 4.4)
XP_WIN = 100
XP_LOSS = 50
XP_PER_KILL = 5
XP_PER_STREAK = 10
XP_PER_SECOND = 0.1
XP_MIN = 50
XP_MAX = 300

# XP Constants - Survival Runner (balanced to match arena shooter)
SURVIVAL_XP_BASE = 50  # Participation XP
SURVIVAL_XP_PER_METER = 0.1  # 100m = 10 XP, 500m = 50 XP, 1000m = 100 XP
SURVIVAL_XP_PER_COMBO = 2  # 10x combo = 20 XP, 25x = 50 XP
SURVIVAL_XP_PER_TRIVIA = 5  # Per correct trivia answer
SURVIVAL_XP_PER_MILESTONE = 10  # Per milestone reached
SURVIVAL_MILESTONES = [100, 250, 500, 750, 1000, 1500, 2000]  # Distance milestones

# Default tier settings
DEFAULT_MAX_TIER = 35  # Default max tier (can be overridden per season)
MAX_TIER = 100  # Legacy constant for backwards compatibility with tests
DEFAULT_XP_PER_TIER = 400  # ~3-4 games per tier at avg 100-130 XP/game


class BattlePassService:
    """Service for battle pass progression."""
    
    def __init__(
        self,
        client: Client,
        cosmetics_service: Optional[CosmeticsService] = None,
    ):
        self.battlepass_repo = BattlePassRepository(client)
        self.cosmetics_service = cosmetics_service
        self._client = client
    
    # ============================================
    # Season Operations
    # ============================================
    
    async def get_current_season(self) -> Optional[Season]:
        """
        Get the currently active season.
        
        Requirements: 4.1 - Support seasons with is_active flag.
        """
        data = await self.battlepass_repo.get_current_season()
        if not data:
            return None
        return Season(**data)
    
    async def get_season(self, season_id: str) -> Optional[Season]:
        """Get a season by ID."""
        data = await self.battlepass_repo.get_season(season_id)
        if not data:
            return None
        return Season(**data)
    
    async def get_season_with_tiers(self, season_id: str) -> Optional[SeasonResponse]:
        """Get season info with all tier rewards."""
        season = await self.get_season(season_id)
        if not season:
            return None
        
        tiers = await self.get_tier_rewards(season_id)
        
        # Use season's max_tier or count actual tiers
        max_tier = season.max_tier if hasattr(season, 'max_tier') and season.max_tier else len(tiers) or DEFAULT_MAX_TIER
        
        return SeasonResponse(
            season=season,
            tiers=tiers,
            total_tiers=max_tier,
        )
    
    # ============================================
    # Tier Operations
    # ============================================
    
    async def get_tier_rewards(self, season_id: str) -> List[BattlePassTier]:
        """
        Get all tier rewards for a season.
        
        Requirements: 4.8 - Support free_reward and premium_reward per tier.
        
        Performance: Uses batch fetching to avoid N+1 queries when loading
        cosmetic details for tier rewards.
        """
        tiers_data = await self.battlepass_repo.get_tier_rewards(season_id)
        logger.info(f"Fetched {len(tiers_data)} tiers for season {season_id}")
        
        # Batch fetch all cosmetic IDs upfront to avoid N+1 queries
        cosmetic_ids = []
        for tier_data in tiers_data:
            free_reward = tier_data.get("free_reward")
            if free_reward and free_reward.get("type") == "cosmetic" and free_reward.get("value"):
                cosmetic_ids.append(str(free_reward["value"]))
            premium_reward = tier_data.get("premium_reward")
            if premium_reward and premium_reward.get("type") == "cosmetic" and premium_reward.get("value"):
                cosmetic_ids.append(str(premium_reward["value"]))
        
        # Single batch query for all cosmetics
        cosmetics_map: dict = {}
        if cosmetic_ids and self.cosmetics_service:
            cosmetics_map = await self.cosmetics_service.get_cosmetics_by_ids(cosmetic_ids)
            logger.info(f"Batch fetched {len(cosmetics_map)} cosmetics for tier rewards")
        
        # Build tier list using pre-fetched cosmetics
        tiers = []
        for tier_data in tiers_data:
            tier_num = tier_data.get("tier_number", 0)
            free_reward = None
            premium_reward = None
            
            # Parse free reward with pre-fetched cosmetics
            free_reward_data = tier_data.get("free_reward")
            if free_reward_data:
                free_reward = self._parse_reward_with_cache(free_reward_data, cosmetics_map)
            
            # Parse premium reward with pre-fetched cosmetics
            premium_reward_data = tier_data.get("premium_reward")
            if premium_reward_data:
                premium_reward = self._parse_reward_with_cache(premium_reward_data, cosmetics_map)
            
            tiers.append(BattlePassTier(
                tier_number=tier_num,
                free_reward=free_reward,
                premium_reward=premium_reward,
            ))
        
        return tiers
    
    def _parse_reward_with_cache(
        self, reward_data: dict, cosmetics_map: dict
    ) -> Reward:
        """
        Parse reward data using pre-fetched cosmetics map.
        
        This is the fast path that uses batch-fetched cosmetics instead of
        making individual DB queries.
        """
        reward_type = RewardType(reward_data.get("type", "coins"))
        value = reward_data.get("value")
        cosmetic = None
        cosmetic_preview_url = None
        
        # Look up cosmetic from pre-fetched map
        if reward_type == RewardType.COSMETIC and value:
            cosmetic = cosmetics_map.get(str(value))
            if cosmetic:
                cosmetic_preview_url = cosmetic.image_url
        
        return Reward(
            type=reward_type,
            value=value,
            cosmetic=cosmetic,
            cosmetic_preview_url=cosmetic_preview_url,
        )
    
    async def _parse_reward(self, reward_data: dict) -> Reward:
        """Parse reward data and populate cosmetic if needed."""
        reward_type = RewardType(reward_data.get("type", "coins"))
        value = reward_data.get("value")
        cosmetic = None
        
        logger.info(f"_parse_reward: type={reward_type.value}, value={value}, has_cosmetics_service={self.cosmetics_service is not None}")
        
        # If cosmetic reward, fetch the cosmetic details
        if reward_type == RewardType.COSMETIC and value and self.cosmetics_service:
            try:
                logger.info(f"Fetching cosmetic details for ID: {value}")
                cosmetic = await self.cosmetics_service.get_cosmetic(str(value))
                if cosmetic:
                    logger.info(f"SUCCESS: Fetched cosmetic {value}: name={cosmetic.name}, type={cosmetic.type}, image_url={cosmetic.image_url}")
                else:
                    logger.warning(f"FAILED: Cosmetic {value} not found in catalog")
            except Exception as e:
                logger.error(f"ERROR fetching cosmetic {value}: {e}", exc_info=True)
        elif reward_type == RewardType.COSMETIC and not self.cosmetics_service:
            logger.error(f"CRITICAL: cosmetics_service is None, cannot fetch cosmetic {value}")
        elif reward_type == RewardType.COSMETIC and not value:
            logger.warning(f"Cosmetic reward has no value/ID")
        
        # Extract preview URL for legacy frontend compatibility
        cosmetic_preview_url = None
        if cosmetic:
            cosmetic_preview_url = cosmetic.image_url
        
        reward = Reward(
            type=reward_type,
            value=value,
            cosmetic=cosmetic,
            cosmetic_preview_url=cosmetic_preview_url,
        )
        
        # Log the final reward object for debugging
        logger.info(f"Created Reward: type={reward.type.value}, value={reward.value}, has_cosmetic={reward.cosmetic is not None}, preview_url={cosmetic_preview_url}")
        
        return reward
    
    # ============================================
    # Player Progress Operations
    # ============================================
    
    async def get_player_progress(self, user_id: str) -> Optional[PlayerBattlePass]:
        """
        Get player's battle pass progress for current season.
        
        Requirements: 4.2 - Track current_tier, current_xp, is_premium.
        
        AUTO-UNLOCK: With auto-claim, claimable_rewards will typically be empty
        since rewards are claimed automatically on tier-up. This field now
        represents any rewards that failed to auto-claim or legacy unclaimed.
        """
        season = await self.get_current_season()
        if not season:
            return None
        
        # Get or create progress
        progress_data = await self.battlepass_repo.get_or_create_progress(
            user_id, season.id
        )
        
        # Calculate claimable rewards (should be empty with auto-claim)
        # This catches any rewards that failed to auto-claim
        claimed = progress_data.get("claimed_rewards", []) or []
        current_tier = progress_data.get("current_tier", 0)
        claimable = [t for t in range(1, current_tier + 1) if t not in claimed]
        
        # Calculate XP to next tier
        current_xp = progress_data.get("current_xp", 0)
        xp_per_tier = season.xp_per_tier or DEFAULT_XP_PER_TIER
        xp_to_next = xp_per_tier - current_xp
        
        # Calculate total XP
        total_xp = (current_tier * xp_per_tier) + current_xp
        
        return PlayerBattlePass(
            user_id=user_id,
            season=season,
            current_tier=current_tier,
            current_xp=current_xp,
            xp_to_next_tier=xp_to_next,
            total_xp=total_xp,
            is_premium=progress_data.get("is_premium", False),
            claimed_rewards=claimed,
            claimable_rewards=claimable,
            last_updated=progress_data.get("last_updated"),
        )
    
    # ============================================
    # XP Operations
    # ============================================
    
    async def award_xp(
        self,
        user_id: str,
        amount: int,
        source: XPSource,
        match_id: Optional[str] = None,
    ) -> Optional[XPAwardResult]:
        """
        Award XP and handle tier advancement with auto-unlock.
        
        Requirements: 4.5 - Advance tier when XP exceeds threshold.
        Requirements: 4.10 - Log XP gains with source.
        
        AUTO-UNLOCK: When tiers are gained, free rewards are automatically
        claimed and added to inventory. Premium rewards require manual claim.
        """
        logger.info(f"[XP] award_xp called: user={user_id}, amount={amount}, source={source}, match={match_id}")
        
        season = await self.get_current_season()
        if not season:
            logger.warning(f"[XP] No active season found, cannot award XP to {user_id}")
            return None
        
        logger.info(f"[XP] Active season: {season.name} (id={season.id})")
        
        # Get current progress
        try:
            progress_data = await self.battlepass_repo.get_or_create_progress(
                user_id, season.id
            )
            logger.info(f"[XP] Got progress for {user_id}: tier={progress_data.get('current_tier')}, xp={progress_data.get('current_xp')}")
        except Exception as e:
            logger.error(f"[XP] Failed to get/create progress for {user_id}: {e}")
            raise
        
        previous_tier = progress_data.get("current_tier", 0)
        current_xp = progress_data.get("current_xp", 0)
        is_premium = progress_data.get("is_premium", False)
        xp_per_tier = season.xp_per_tier or DEFAULT_XP_PER_TIER
        max_tier = season.max_tier if hasattr(season, 'max_tier') and season.max_tier else DEFAULT_MAX_TIER
        
        # Add XP
        new_xp = current_xp + amount
        new_tier = previous_tier
        tiers_gained = 0
        
        # Check for tier advancement (Requirements: 4.5)
        while new_xp >= xp_per_tier and new_tier < max_tier:
            new_xp -= xp_per_tier
            new_tier += 1
            tiers_gained += 1
        
        # Cap at max tier
        if new_tier >= max_tier:
            new_tier = max_tier
            new_xp = 0  # No overflow XP at max tier
        
        # Update progress
        logger.info(f"[XP] Updating progress: {user_id} tier {previous_tier}->{new_tier}, xp {current_xp}->{new_xp}")
        try:
            await self.battlepass_repo.update_progress(
                user_id, season.id, new_tier, new_xp
            )
            logger.info(f"[XP] Progress updated successfully for {user_id}")
        except Exception as e:
            logger.error(f"[XP] Failed to update progress for {user_id}: {e}")
            raise
        
        # Log XP gain (Requirements: 4.10)
        try:
            await self.battlepass_repo.log_xp_gain(
                user_id=user_id,
                source=source.value,
                amount=amount,
                match_id=match_id,
            )
            logger.info(f"[XP] XP log created for {user_id}: {amount} from {source.value}")
        except Exception as e:
            logger.error(f"[XP] Failed to log XP for {user_id}: {e}")
            # Don't raise - logging failure shouldn't block XP award
        
        # AUTO-UNLOCK: Claim rewards for newly gained tiers
        claimed = progress_data.get("claimed_rewards", []) or []
        new_claimable = []
        
        if tiers_gained > 0:
            for tier_num in range(previous_tier + 1, new_tier + 1):
                if tier_num not in claimed:
                    # Auto-claim this tier's reward
                    await self._auto_claim_tier_reward(
                        user_id, season.id, tier_num, is_premium
                    )
                    new_claimable.append(tier_num)
        
        # Calculate new total XP
        new_total_xp = (new_tier * xp_per_tier) + new_xp
        
        return XPAwardResult(
            xp_awarded=amount,
            new_total_xp=new_total_xp,
            previous_tier=previous_tier,
            new_tier=new_tier,
            tier_advanced=new_tier > previous_tier,
            tiers_gained=tiers_gained,
            new_claimable_rewards=new_claimable,
        )
    
    async def _auto_claim_tier_reward(
        self,
        user_id: str,
        season_id: str,
        tier_number: int,
        is_premium: bool,
    ) -> bool:
        """
        Auto-claim a tier's reward and add cosmetic to inventory.
        
        AUTO-UNLOCK: Called when user reaches a new tier.
        - Free rewards are always claimed
        - Premium rewards are claimed if user has premium pass
        
        Returns True if reward was successfully claimed.
        """
        try:
            # Get tier data
            tier_data = await self.battlepass_repo.get_tier(season_id, tier_number)
            if not tier_data:
                logger.warning(f"No tier {tier_number} found for season {season_id}")
                return False
            
            # Claim free reward
            free_reward = tier_data.get("free_reward")
            if free_reward:
                await self._grant_reward(user_id, free_reward)
            
            # Claim premium reward if user has premium
            if is_premium:
                premium_reward = tier_data.get("premium_reward")
                if premium_reward:
                    await self._grant_reward(user_id, premium_reward)
            
            # Mark tier as claimed
            await self.battlepass_repo.mark_reward_claimed(user_id, season_id, tier_number)
            
            logger.info(f"Auto-claimed tier {tier_number} for user {user_id}")
            return True
            
        except Exception as e:
            logger.error(f"Failed to auto-claim tier {tier_number} for user {user_id}: {e}")
            return False
    
    async def _grant_reward(self, user_id: str, reward_data: dict) -> bool:
        """
        Grant a reward to the user.
        
        Handles different reward types:
        - cosmetic: Add to inventory
        - coins: Credit to balance (future)
        - xp: Award XP (future)
        """
        reward_type = reward_data.get("type")
        reward_value = reward_data.get("value")
        
        if not reward_type or not reward_value:
            return False
        
        if reward_type == "cosmetic" and self.cosmetics_service:
            # Add cosmetic to inventory
            try:
                item = await self.cosmetics_service.purchase_cosmetic(
                    user_id, str(reward_value)
                )
                if item:
                    logger.info(f"Granted cosmetic {reward_value} to user {user_id}")
                    return True
            except Exception as e:
                logger.error(f"Failed to grant cosmetic {reward_value}: {e}")
        
        # TODO: Handle coins and XP rewards when needed
        
        return False
    
    def calculate_match_xp(
        self,
        won: bool,
        kills: int,
        streak: int,
        duration_seconds: int,
    ) -> MatchXPCalculation:
        """
        Calculate XP from match results.
        
        Requirements: 4.3 - Win=100, Loss=50, +5/kill, +10/streak, +0.1/sec
        Requirements: 4.4 - Clamp to [50, 300]
        """
        # Base XP
        base_xp = XP_WIN if won else XP_LOSS
        
        # Bonuses
        kill_bonus = kills * XP_PER_KILL
        streak_bonus = streak * XP_PER_STREAK
        duration_bonus = int(duration_seconds * XP_PER_SECOND)
        
        # Total before clamping
        raw_total = base_xp + kill_bonus + streak_bonus + duration_bonus
        
        # Clamp to bounds (Requirements: 4.4)
        total_xp = max(XP_MIN, min(XP_MAX, raw_total))
        was_clamped = total_xp != raw_total
        
        return MatchXPCalculation(
            base_xp=base_xp,
            kill_bonus=kill_bonus,
            streak_bonus=streak_bonus,
            duration_bonus=duration_bonus,
            total_xp=total_xp,
            was_clamped=was_clamped,
        )
    
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
        Calculate and award XP from a match.
        
        Combines calculate_match_xp and award_xp.
        """
        logger.info(f"[XP] award_match_xp called: user={user_id}, won={won}, kills={kills}, streak={streak}, duration={duration_seconds}s, match={match_id}")
        
        # Calculate XP
        calc = self.calculate_match_xp(won, kills, streak, duration_seconds)
        logger.info(f"[XP] Calculated XP for {user_id}: base={calc.base_xp}, kills={calc.kill_bonus}, streak={calc.streak_bonus}, duration={calc.duration_bonus}, total={calc.total_xp}")
        
        # Determine source
        source = XPSource.MATCH_WIN if won else XPSource.MATCH_LOSS
        
        # Award XP
        result = await self.award_xp(user_id, calc.total_xp, source, match_id)
        if result:
            logger.info(f"[XP] Successfully awarded {result.xp_awarded} XP to {user_id}, tier {result.previous_tier}->{result.new_tier}")
        else:
            logger.warning(f"[XP] award_xp returned None for {user_id}")
        return result
    
    # ============================================
    # Survival Runner XP Operations
    # ============================================
    
    def calculate_survival_xp(
        self,
        distance: float,
        max_combo: int,
        trivia_correct: int = 0,
    ) -> SurvivalXPCalculation:
        """
        Calculate XP from a survival run.
        
        Balanced to match arena shooter XP rates (50-300 XP range).
        
        Formula:
        - Base: 50 XP (participation)
        - Distance: +0.1 XP per meter
        - Combo: +2 XP per max combo
        - Trivia: +5 XP per correct answer
        - Milestone: +10 XP per milestone reached
        
        Example runs:
        - Short run (100m, 5x combo): 50 + 10 + 10 + 10 = 80 XP
        - Medium run (500m, 15x combo): 50 + 50 + 30 + 30 = 160 XP
        - Long run (1000m, 25x combo, 5 trivia): 50 + 100 + 50 + 25 + 50 = 275 XP
        """
        # Base XP
        base_xp = SURVIVAL_XP_BASE
        
        # Distance bonus
        distance_bonus = int(distance * SURVIVAL_XP_PER_METER)
        
        # Combo bonus
        combo_bonus = max_combo * SURVIVAL_XP_PER_COMBO
        
        # Trivia bonus
        trivia_bonus = trivia_correct * SURVIVAL_XP_PER_TRIVIA
        
        # Milestone bonus - count how many milestones were reached
        milestones_reached = sum(1 for m in SURVIVAL_MILESTONES if distance >= m)
        milestone_bonus = milestones_reached * SURVIVAL_XP_PER_MILESTONE
        
        # Total before clamping
        raw_total = base_xp + distance_bonus + combo_bonus + trivia_bonus + milestone_bonus
        
        # Clamp to bounds (same as arena shooter)
        total_xp = max(XP_MIN, min(XP_MAX, raw_total))
        was_clamped = total_xp != raw_total
        
        return SurvivalXPCalculation(
            base_xp=base_xp,
            distance_bonus=distance_bonus,
            combo_bonus=combo_bonus,
            trivia_bonus=trivia_bonus,
            milestone_bonus=milestone_bonus,
            total_xp=total_xp,
            was_clamped=was_clamped,
        )
    
    async def award_survival_xp(
        self,
        user_id: str,
        distance: float,
        max_combo: int,
        trivia_correct: int = 0,
        run_id: Optional[str] = None,
    ) -> Optional[XPAwardResult]:
        """
        Calculate and award XP from a survival run.
        
        Combines calculate_survival_xp and award_xp.
        """
        logger.info(f"[XP] award_survival_xp called: user={user_id}, distance={distance}m, combo={max_combo}x, trivia={trivia_correct}, run={run_id}")
        
        # Calculate XP
        calc = self.calculate_survival_xp(distance, max_combo, trivia_correct)
        logger.info(f"[XP] Calculated survival XP for {user_id}: base={calc.base_xp}, distance={calc.distance_bonus}, combo={calc.combo_bonus}, trivia={calc.trivia_bonus}, milestone={calc.milestone_bonus}, total={calc.total_xp}")
        
        # Award XP
        result = await self.award_xp(user_id, calc.total_xp, XPSource.SURVIVAL_RUN, run_id)
        if result:
            logger.info(f"[XP] Successfully awarded {result.xp_awarded} survival XP to {user_id}, tier {result.previous_tier}->{result.new_tier}")
        else:
            logger.warning(f"[XP] award_xp returned None for {user_id}")
        return result
    
    # ============================================
    # Reward Claiming
    # ============================================
    
    async def claim_reward(
        self, user_id: str, tier: int
    ) -> Optional[ClaimResult]:
        """
        Claim reward for a completed tier.
        
        Requirements: 4.6 - Make tier reward claimable when reached.
        Requirements: 4.7 - Add reward to inventory and mark claimed.
        """
        season = await self.get_current_season()
        if not season:
            return None
        
        # Get progress
        progress_data = await self.battlepass_repo.get_player_progress(
            user_id, season.id
        )
        if not progress_data:
            return None
        
        current_tier = progress_data.get("current_tier", 0)
        claimed = progress_data.get("claimed_rewards", []) or []
        is_premium = progress_data.get("is_premium", False)
        
        # Validate tier is reachable
        if tier > current_tier:
            return None  # Tier not reached yet
        
        # Check if already claimed
        if tier in claimed:
            return None  # Already claimed
        
        # Get tier rewards
        tier_data = await self.battlepass_repo.get_tier(season.id, tier)
        if not tier_data:
            return None
        
        # Determine which reward to give
        reward_data = tier_data.get("free_reward")
        is_premium_reward = False
        
        # If premium and has premium reward, give premium reward
        if is_premium and tier_data.get("premium_reward"):
            reward_data = tier_data.get("premium_reward")
            is_premium_reward = True
        
        if not reward_data:
            return None  # No reward for this tier
        
        # Parse reward
        reward = await self._parse_reward(reward_data)
        
        # Grant reward
        inventory_item_id = None
        if reward.type == RewardType.COSMETIC and self.cosmetics_service:
            # Add cosmetic to inventory
            item = await self.cosmetics_service.purchase_cosmetic(
                user_id, str(reward.value)
            )
            if item:
                inventory_item_id = item.id
        
        # Mark as claimed
        await self.battlepass_repo.mark_reward_claimed(user_id, season.id, tier)
        
        return ClaimResult(
            success=True,
            tier=tier,
            reward=reward,
            is_premium_reward=is_premium_reward,
            inventory_item_id=inventory_item_id,
        )
    
    # ============================================
    # Premium Operations
    # ============================================
    
    async def purchase_premium(self, user_id: str) -> Optional[PlayerBattlePass]:
        """
        Upgrade to premium battle pass.
        
        Requirements: 4.9 - Set is_premium=true and unlock premium rewards.
        
        AUTO-UNLOCK: When upgrading to premium, automatically grants all
        premium rewards for tiers the user has already reached.
        """
        season = await self.get_current_season()
        if not season:
            return None
        
        # Get or create progress
        progress_data = await self.battlepass_repo.get_or_create_progress(
            user_id, season.id
        )
        
        current_tier = progress_data.get("current_tier", 0)
        
        # Set premium
        await self.battlepass_repo.set_premium(user_id, season.id, True)
        
        # AUTO-UNLOCK: Grant all premium rewards for reached tiers
        for tier_num in range(1, current_tier + 1):
            tier_data = await self.battlepass_repo.get_tier(season.id, tier_num)
            if tier_data:
                premium_reward = tier_data.get("premium_reward")
                if premium_reward:
                    await self._grant_reward(user_id, premium_reward)
                    logger.info(f"Granted premium reward for tier {tier_num} to user {user_id}")
        
        # Return updated progress
        return await self.get_player_progress(user_id)
