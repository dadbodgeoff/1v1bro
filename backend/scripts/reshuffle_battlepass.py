#!/usr/bin/env python3
"""
Reshuffle Battle Pass Tiers Script

This script reshuffles the battle pass tiers with a systematic distribution:
- Keeps Tier 1 and Tier 35 rewards in place
- Free track: Tier 1 skin + 2 player cards + 500 coins total
- Premium track: All other rewards + 1500 coins total

Run with: python -m scripts.reshuffle_battlepass
"""

import asyncio
import os
import sys
from typing import Optional, List, Dict, Any
import random

# Add parent directory to path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from supabase import create_client, Client


def get_supabase_client() -> Client:
    """Create Supabase client from environment variables."""
    url = os.getenv("SUPABASE_URL")
    key = os.getenv("SUPABASE_SERVICE_KEY") or os.getenv("SUPABASE_KEY")
    
    if not url or not key:
        raise ValueError("SUPABASE_URL and SUPABASE_SERVICE_KEY must be set")
    
    return create_client(url, key)


async def get_current_season(client: Client) -> Optional[Dict]:
    """Get the currently active season."""
    result = client.table("seasons").select("*").eq("is_active", True).single().execute()
    return result.data if result.data else None


async def get_cosmetics_by_type(client: Client, cosmetic_type: str) -> List[Dict]:
    """Get all cosmetics of a specific type."""
    result = client.table("cosmetics_catalog").select("*").eq("type", cosmetic_type).execute()
    return result.data or []


async def get_existing_tiers(client: Client, season_id: str) -> List[Dict]:
    """Get existing battle pass tiers."""
    result = client.table("battlepass_tiers").select("*").eq("season_id", season_id).order("tier_number").execute()
    return result.data or []


async def update_tier(client: Client, tier_id: str, free_reward: Optional[Dict], premium_reward: Optional[Dict]):
    """Update a battle pass tier."""
    update_data = {}
    if free_reward is not None:
        update_data["free_reward"] = free_reward
    if premium_reward is not None:
        update_data["premium_reward"] = premium_reward
    
    if update_data:
        client.table("battlepass_tiers").update(update_data).eq("id", tier_id).execute()


async def create_tier(client: Client, season_id: str, tier_number: int, free_reward: Optional[Dict], premium_reward: Optional[Dict]):
    """Create a new battle pass tier."""
    client.table("battlepass_tiers").insert({
        "season_id": season_id,
        "tier_number": tier_number,
        "free_reward": free_reward,
        "premium_reward": premium_reward,
    }).execute()


def make_coin_reward(amount: int) -> Dict:
    """Create a coin reward object."""
    return {"type": "coins", "value": amount}


def make_cosmetic_reward(cosmetic_id: str) -> Dict:
    """Create a cosmetic reward object."""
    return {"type": "cosmetic", "value": cosmetic_id}


async def reshuffle_battlepass():
    """Main function to reshuffle battle pass tiers."""
    print("🎮 Starting Battle Pass Reshuffle...")
    
    client = get_supabase_client()
    
    # Get current season
    season = await get_current_season(client)
    if not season:
        print("❌ No active season found!")
        return
    
    print(f"📅 Active Season: {season['name']} (ID: {season['id']})")
    
    # Get existing tiers
    existing_tiers = await get_existing_tiers(client, season["id"])
    print(f"📊 Found {len(existing_tiers)} existing tiers")
    
    # Get cosmetics by type
    skins = await get_cosmetics_by_type(client, "skin")
    banners = await get_cosmetics_by_type(client, "banner")
    emotes = await get_cosmetics_by_type(client, "emote")
    playercards = await get_cosmetics_by_type(client, "playercard")
    
    print(f"🎨 Available cosmetics: {len(skins)} skins, {len(banners)} banners, {len(emotes)} emotes, {len(playercards)} player cards")
    
    # Shuffle cosmetics for random distribution
    random.shuffle(skins)
    random.shuffle(banners)
    random.shuffle(emotes)
    random.shuffle(playercards)
    
    # Track used cosmetics
    used_cosmetics = set()
    
    # Get tier 1 and tier 35 rewards to preserve
    tier_1_data = next((t for t in existing_tiers if t["tier_number"] == 1), None)
    tier_35_data = next((t for t in existing_tiers if t["tier_number"] == 35), None)
    
    tier_1_free = tier_1_data["free_reward"] if tier_1_data else None
    tier_35_premium = tier_35_data["premium_reward"] if tier_35_data else None
    
    if tier_1_free and tier_1_free.get("value"):
        used_cosmetics.add(tier_1_free["value"])
    if tier_35_premium and tier_35_premium.get("value"):
        used_cosmetics.add(tier_35_premium["value"])
    
    print(f"🔒 Preserving Tier 1 free reward: {tier_1_free}")
    print(f"🔒 Preserving Tier 35 premium reward: {tier_35_premium}")
    
    # Helper to get next available cosmetic
    def get_next_cosmetic(cosmetic_list: List[Dict]) -> Optional[str]:
        for c in cosmetic_list:
            if c["id"] not in used_cosmetics:
                used_cosmetics.add(c["id"])
                return c["id"]
        return None
    
    # Define tier structure
    # FREE TRACK (500 coins total):
    # - Tier 1: Skin (preserved)
    # - Tier 5: 100 coins
    # - Tier 10: Player Card
    # - Tier 15: 150 coins
    # - Tier 20: Player Card
    # - Tier 25: 100 coins
    # - Tier 30: 150 coins
    
    # PREMIUM TRACK (1500 coins total distributed across tiers):
    # Coins at: 2, 6, 9, 12, 16, 18, 21, 23, 26, 29, 32, 34 (100 each = 1200) + 3x100 = 1500
    
    tier_rewards = {}
    
    # Tier 1 - Keep existing free skin
    tier_rewards[1] = {
        "free": tier_1_free,
        "premium": make_cosmetic_reward(get_next_cosmetic(banners)) if banners else None
    }
    
    # Tier 2 - Premium coins
    tier_rewards[2] = {"free": None, "premium": make_coin_reward(100)}
    
    # Tier 3 - Premium banner
    tier_rewards[3] = {"free": None, "premium": make_cosmetic_reward(get_next_cosmetic(banners)) if banners else None}
    
    # Tier 4 - Premium emote
    tier_rewards[4] = {"free": None, "premium": make_cosmetic_reward(get_next_cosmetic(emotes)) if emotes else None}
    
    # Tier 5 - Free coins
    tier_rewards[5] = {"free": make_coin_reward(100), "premium": make_cosmetic_reward(get_next_cosmetic(playercards)) if playercards else None}
    
    # Tier 6 - Premium coins
    tier_rewards[6] = {"free": None, "premium": make_coin_reward(100)}
    
    # Tier 7 - Premium player card
    tier_rewards[7] = {"free": None, "premium": make_cosmetic_reward(get_next_cosmetic(playercards)) if playercards else None}
    
    # Tier 8 - Premium banner
    tier_rewards[8] = {"free": None, "premium": make_cosmetic_reward(get_next_cosmetic(banners)) if banners else None}
    
    # Tier 9 - Premium coins
    tier_rewards[9] = {"free": None, "premium": make_coin_reward(100)}
    
    # Tier 10 - Free player card
    pc_id = get_next_cosmetic(playercards)
    tier_rewards[10] = {"free": make_cosmetic_reward(pc_id) if pc_id else None, "premium": make_cosmetic_reward(get_next_cosmetic(emotes)) if emotes else None}
    
    # Tier 11 - Premium emote
    tier_rewards[11] = {"free": None, "premium": make_cosmetic_reward(get_next_cosmetic(emotes)) if emotes else None}
    
    # Tier 12 - Premium coins
    tier_rewards[12] = {"free": None, "premium": make_coin_reward(100)}
    
    # Tier 13 - Premium banner
    tier_rewards[13] = {"free": None, "premium": make_cosmetic_reward(get_next_cosmetic(banners)) if banners else None}
    
    # Tier 14 - Premium player card
    tier_rewards[14] = {"free": None, "premium": make_cosmetic_reward(get_next_cosmetic(playercards)) if playercards else None}
    
    # Tier 15 - Free coins
    tier_rewards[15] = {"free": make_coin_reward(150), "premium": make_cosmetic_reward(get_next_cosmetic(emotes)) if emotes else None}
    
    # Tier 16 - Premium coins
    tier_rewards[16] = {"free": None, "premium": make_coin_reward(100)}
    
    # Tier 17 - Premium emote
    tier_rewards[17] = {"free": None, "premium": make_cosmetic_reward(get_next_cosmetic(emotes)) if emotes else None}
    
    # Tier 18 - Premium coins
    tier_rewards[18] = {"free": None, "premium": make_coin_reward(100)}
    
    # Tier 19 - Premium banner
    tier_rewards[19] = {"free": None, "premium": make_cosmetic_reward(get_next_cosmetic(banners)) if banners else None}
    
    # Tier 20 - Free player card
    pc_id = get_next_cosmetic(playercards)
    tier_rewards[20] = {"free": make_cosmetic_reward(pc_id) if pc_id else None, "premium": make_cosmetic_reward(get_next_cosmetic(skins)) if skins else None}
    
    # Tier 21 - Premium coins
    tier_rewards[21] = {"free": None, "premium": make_coin_reward(100)}
    
    # Tier 22 - Premium skin
    tier_rewards[22] = {"free": None, "premium": make_cosmetic_reward(get_next_cosmetic(skins)) if skins else None}
    
    # Tier 23 - Premium coins
    tier_rewards[23] = {"free": None, "premium": make_coin_reward(100)}
    
    # Tier 24 - Premium emote
    tier_rewards[24] = {"free": None, "premium": make_cosmetic_reward(get_next_cosmetic(emotes)) if emotes else None}
    
    # Tier 25 - Free coins
    tier_rewards[25] = {"free": make_coin_reward(100), "premium": make_cosmetic_reward(get_next_cosmetic(banners)) if banners else None}
    
    # Tier 26 - Premium coins
    tier_rewards[26] = {"free": None, "premium": make_coin_reward(100)}
    
    # Tier 27 - Premium banner
    tier_rewards[27] = {"free": None, "premium": make_cosmetic_reward(get_next_cosmetic(banners)) if banners else None}
    
    # Tier 28 - Premium player card
    tier_rewards[28] = {"free": None, "premium": make_cosmetic_reward(get_next_cosmetic(playercards)) if playercards else None}
    
    # Tier 29 - Premium coins
    tier_rewards[29] = {"free": None, "premium": make_coin_reward(100)}
    
    # Tier 30 - Free coins
    tier_rewards[30] = {"free": make_coin_reward(150), "premium": make_cosmetic_reward(get_next_cosmetic(skins)) if skins else None}
    
    # Tier 31 - Premium emote
    tier_rewards[31] = {"free": None, "premium": make_cosmetic_reward(get_next_cosmetic(emotes)) if emotes else None}
    
    # Tier 32 - Premium coins
    tier_rewards[32] = {"free": None, "premium": make_coin_reward(100)}
    
    # Tier 33 - Premium banner
    tier_rewards[33] = {"free": None, "premium": make_cosmetic_reward(get_next_cosmetic(banners)) if banners else None}
    
    # Tier 34 - Premium coins
    tier_rewards[34] = {"free": None, "premium": make_coin_reward(200)}
    
    # Tier 35 - Keep existing premium legendary
    tier_rewards[35] = {"free": None, "premium": tier_35_premium}
    
    # Calculate totals
    free_coins = sum(
        r["free"]["value"] for r in tier_rewards.values() 
        if r["free"] and r["free"].get("type") == "coins"
    )
    premium_coins = sum(
        r["premium"]["value"] for r in tier_rewards.values() 
        if r["premium"] and r["premium"].get("type") == "coins"
    )
    
    print(f"💰 Free track coins: {free_coins} (target: 500)")
    print(f"💰 Premium track coins: {premium_coins} (target: 1500)")
    
    # Update or create tiers
    existing_tier_map = {t["tier_number"]: t for t in existing_tiers}
    
    for tier_num, rewards in tier_rewards.items():
        if tier_num in existing_tier_map:
            # Update existing tier
            await update_tier(
                client,
                existing_tier_map[tier_num]["id"],
                rewards["free"],
                rewards["premium"]
            )
            print(f"✅ Updated Tier {tier_num}")
        else:
            # Create new tier
            await create_tier(
                client,
                season["id"],
                tier_num,
                rewards["free"],
                rewards["premium"]
            )
            print(f"➕ Created Tier {tier_num}")
    
    print("\n🎉 Battle Pass reshuffle complete!")
    print(f"📊 Summary:")
    print(f"   - Free track: 1 skin, 2 player cards, {free_coins} coins")
    print(f"   - Premium track: Multiple cosmetics + {premium_coins} coins")


if __name__ == "__main__":
    asyncio.run(reshuffle_battlepass())
