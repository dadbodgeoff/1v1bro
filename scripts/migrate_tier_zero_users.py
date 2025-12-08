#!/usr/bin/env python3
"""
Migration script for tier 0 users to tier 1.

UNIFIED PROGRESSION: This script migrates existing users who are at tier 0
to tier 1 with the tier 1 reward auto-claimed.

Requirements: 8.1, 8.4

Usage:
    python scripts/migrate_tier_zero_users.py [--dry-run]
    
Options:
    --dry-run    Show what would be migrated without making changes
"""

import asyncio
import argparse
import logging
import os
import sys
from datetime import datetime

# Add backend to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'backend'))

from dotenv import load_dotenv
from supabase import create_client, Client

load_dotenv()

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


async def get_tier_zero_users(client: Client, season_id: str) -> list:
    """Get all users at tier 0 for the given season."""
    result = (
        client.table("player_battlepass")
        .select("*")
        .eq("season_id", season_id)
        .eq("current_tier", 0)
        .execute()
    )
    return result.data or []


async def get_current_season(client: Client) -> dict | None:
    """Get the currently active season."""
    result = (
        client.table("seasons")
        .select("*")
        .eq("is_active", True)
        .limit(1)
        .execute()
    )
    return result.data[0] if result.data else None


async def get_tier_1_cosmetic(client: Client, season_id: str) -> str | None:
    """Get the tier 1 cosmetic ID for the season."""
    result = (
        client.table("battlepass_tiers")
        .select("free_reward")
        .eq("season_id", season_id)
        .eq("tier_number", 1)
        .limit(1)
        .execute()
    )
    
    if result.data and result.data[0].get("free_reward"):
        reward = result.data[0]["free_reward"]
        if reward.get("type") == "cosmetic":
            return reward.get("value")
    return None


async def migrate_user(
    client: Client,
    user_id: str,
    season_id: str,
    current_xp: int,
    claimed_rewards: list,
    cosmetic_id: str | None,
    dry_run: bool = False
) -> bool:
    """Migrate a single user from tier 0 to tier 1."""
    try:
        if dry_run:
            logger.info(f"[DRY RUN] Would migrate user {user_id}")
            return True
        
        # Update to tier 1
        client.table("player_battlepass").update({
            "current_tier": 1,
            "current_xp": current_xp,  # Preserve XP
            "last_updated": datetime.utcnow().isoformat(),
        }).eq("user_id", user_id).eq("season_id", season_id).execute()
        
        # Add tier 1 to claimed_rewards if not present
        if 1 not in claimed_rewards:
            claimed_rewards.append(1)
            client.table("player_battlepass").update({
                "claimed_rewards": claimed_rewards,
                "last_updated": datetime.utcnow().isoformat(),
            }).eq("user_id", user_id).eq("season_id", season_id).execute()
            
            # Add tier 1 cosmetic to inventory if available
            if cosmetic_id:
                # Check if already owned
                existing = (
                    client.table("user_inventory")
                    .select("id")
                    .eq("user_id", user_id)
                    .eq("cosmetic_id", cosmetic_id)
                    .limit(1)
                    .execute()
                )
                
                if not existing.data:
                    client.table("user_inventory").insert({
                        "user_id": user_id,
                        "cosmetic_id": cosmetic_id,
                    }).execute()
                    logger.info(f"Added tier 1 cosmetic to inventory for user {user_id}")
        
        logger.info(f"Migrated user {user_id} from tier 0 to tier 1")
        return True
        
    except Exception as e:
        logger.error(f"Failed to migrate user {user_id}: {e}")
        return False


async def main(dry_run: bool = False):
    """Main migration function."""
    # Initialize Supabase client
    supabase_url = os.getenv("SUPABASE_URL")
    supabase_key = os.getenv("SUPABASE_SERVICE_ROLE_KEY") or os.getenv("SUPABASE_SERVICE_KEY") or os.getenv("SUPABASE_KEY")
    
    if not supabase_url or not supabase_key:
        logger.error("Missing SUPABASE_URL or SUPABASE_KEY environment variables")
        sys.exit(1)
    
    client = create_client(supabase_url, supabase_key)
    
    # Get current season
    season = await get_current_season(client)
    if not season:
        logger.error("No active season found")
        sys.exit(1)
    
    logger.info(f"Found active season: {season['name']} (ID: {season['id']})")
    
    # Get tier 1 cosmetic
    cosmetic_id = await get_tier_1_cosmetic(client, season["id"])
    if cosmetic_id:
        logger.info(f"Tier 1 cosmetic ID: {cosmetic_id}")
    else:
        logger.warning("No tier 1 cosmetic found - users will not receive cosmetic")
    
    # Get tier 0 users
    tier_zero_users = await get_tier_zero_users(client, season["id"])
    
    if not tier_zero_users:
        logger.info("No tier 0 users found - nothing to migrate")
        return
    
    logger.info(f"Found {len(tier_zero_users)} tier 0 users to migrate")
    
    if dry_run:
        logger.info("=== DRY RUN MODE - No changes will be made ===")
    
    # Migrate each user
    success_count = 0
    fail_count = 0
    
    for user in tier_zero_users:
        user_id = user["user_id"]
        current_xp = user.get("current_xp", 0)
        claimed_rewards = user.get("claimed_rewards", []) or []
        
        success = await migrate_user(
            client,
            user_id,
            season["id"],
            current_xp,
            claimed_rewards,
            cosmetic_id,
            dry_run
        )
        
        if success:
            success_count += 1
        else:
            fail_count += 1
    
    # Summary
    logger.info("=" * 50)
    logger.info("Migration Summary:")
    logger.info(f"  Total users: {len(tier_zero_users)}")
    logger.info(f"  Successful: {success_count}")
    logger.info(f"  Failed: {fail_count}")
    
    if dry_run:
        logger.info("  (DRY RUN - no actual changes made)")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Migrate tier 0 users to tier 1")
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="Show what would be migrated without making changes"
    )
    args = parser.parse_args()
    
    asyncio.run(main(dry_run=args.dry_run))
