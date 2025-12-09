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
    ClaimResult,
    SeasonResponse,
)
from app.schemas.cosmetic import Cosmetic

logger = logging.getLogger(__name__)


# XP Constants (Requirements: 4.3, 4.4)
XP_WIN = 100
XP_LOSS = 50
XP_PER_KILL = 5
XP_PER_STREAK = 10
XP_PER_SECOND = 0.1
XP_MIN = 50
XP_MAX = 300

# Default tier settings
MAX_TIER = 100
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
        
        return SeasonResponse(
            season=season,
            tiers=tiers,
            total_tiers=MAX_TIER,
        )
    
    # ============================================
    # Tier Operations
    # ============================================
    
    async def get_tier_rewards(self, season_id: str) -> List[BattlePassTier]:
        """
        Get all tier rewards for a season.
        
        Requirements: 4.8 - Support free_reward and premium_reward per tier.
        """
        tiers_data = await self.battlepass_repo.get_tier_rewards(season_id)
        
        tiers = []
        for tier_data in tiers_data:
            free_reward = None
            premium_reward = None
            
            # Parse free reward
            if tier_data.get("free_reward"):
                free_reward = await self._parse_reward(tier_data["free_reward"])
            
            # Parse premium reward
            if tier_data.get("premium_reward"):
                premium_reward = await self._parse_reward(tier_data["premium_reward"])
            
            tiers.append(BattlePassTier(
                tier_number=tier_data["tier_number"],
                free_reward=free_reward,
                premium_reward=premium_reward,
            ))
        
        return tiers
    
    async def _parse_reward(self, reward_data: dict) -> Reward:
        """Parse reward data and populate cosmetic if needed."""
        reward_type = RewardType(reward_data.get("type", "coins"))
        value = reward_data.get("value")
        cosmetic = None
        
        # If cosmetic reward, fetch the cosmetic details
        if reward_type == RewardType.COSMETIC and value and self.cosmetics_service:
            cosmetic = await self.cosmetics_service.get_cosmetic(str(value))
        
        return Reward(
            type=reward_type,
            value=value,
            cosmetic=cosmetic,
        )
    
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
        
        # Add XP
        new_xp = current_xp + amount
        new_tier = previous_tier
        tiers_gained = 0
        
        # Check for tier advancement (Requirements: 4.5)
        while new_xp >= xp_per_tier and new_tier < MAX_TIER:
            new_xp -= xp_per_tier
            new_tier += 1
            tiers_gained += 1
        
        # Cap at max tier
        if new_tier >= MAX_TIER:
            new_tier = MAX_TIER
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
