#!/usr/bin/env python3
"""
Season Seed Script

Creates an active battle pass season with tier rewards.

Run with: python scripts/seed_season.py
"""

import os
import sys
from datetime import datetime, timedelta, timezone

sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'backend'))

from dotenv import load_dotenv
from supabase import create_client, Client

load_dotenv()
load_dotenv(os.path.join(os.path.dirname(__file__), '..', 'backend', '.env'))

SUPABASE_URL = os.getenv('SUPABASE_URL')
SUPABASE_KEY = os.getenv('SUPABASE_SERVICE_KEY') or os.getenv('SUPABASE_KEY')

if not SUPABASE_URL or not SUPABASE_KEY:
    print("Error: SUPABASE_URL and SUPABASE_SERVICE_KEY must be set")
    sys.exit(1)

supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)


def create_season():
    """Create Season 1 if it doesn't exist."""
    print("🎮 Creating Battle Pass Season...")
    
    # Check if season exists
    existing = supabase.table("seasons").select("id").eq("season_number", 1).execute()
    
    if existing.data:
        print("  ✓ Season 1 already exists")
        return existing.data[0]["id"]
    
    # Create Season 1
    now = datetime.now(timezone.utc)
    season = {
        "season_number": 1,
        "name": "Season 1: Launch",
        "theme": "Fortnite Trivia Masters",
        "start_date": now.isoformat(),
        "end_date": (now + timedelta(days=90)).isoformat(),
        "is_active": True,
        "xp_per_tier": 1000,
    }
    
    result = supabase.table("seasons").insert(season).execute()
    season_id = result.data[0]["id"]
    print(f"  + Created Season 1: {season_id}")
    
    return season_id


def create_tier_rewards(season_id: str):
    """Create tier rewards for the season."""
    print("\n🏆 Creating Tier Rewards...")
    
    # Check if tiers exist
    existing = supabase.table("battlepass_tiers").select("id").eq("season_id", season_id).execute()
    
    if existing.data:
        print(f"  ✓ {len(existing.data)} tiers already exist")
        return
    
    # Get cosmetic IDs for rewards
    cosmetics = supabase.table("cosmetics_catalog").select("id, name, type, rarity").execute()
    cosmetic_map = {c["name"]: c for c in cosmetics.data}
    
    # Define tier rewards (every 5 tiers gets something good)
    tiers = []
    for tier in range(1, 101):
        free_reward = None
        premium_reward = None
        
        # Free track rewards
        if tier % 10 == 0:
            # Every 10 tiers: coins
            free_reward = {"type": "coins", "value": tier * 10}
        elif tier % 5 == 0:
            # Every 5 tiers: small coins
            free_reward = {"type": "coins", "value": tier * 5}
        
        # Premium track rewards
        if tier == 1:
            # Tier 1 premium: Armored Soldier skin
            if "Armored Soldier" in cosmetic_map:
                premium_reward = {"type": "cosmetic", "value": cosmetic_map["Armored Soldier"]["id"]}
        elif tier == 25:
            # Tier 25 premium: Armored Knight skin
            if "Armored Knight" in cosmetic_map:
                premium_reward = {"type": "cosmetic", "value": cosmetic_map["Armored Knight"]["id"]}
        elif tier == 50:
            # Tier 50 premium: Matrix Wraith skin
            if "Matrix Wraith" in cosmetic_map:
                premium_reward = {"type": "cosmetic", "value": cosmetic_map["Matrix Wraith"]["id"]}
        elif tier == 75:
            # Tier 75 premium: Tactical Banana skin
            if "Tactical Banana" in cosmetic_map:
                premium_reward = {"type": "cosmetic", "value": cosmetic_map["Tactical Banana"]["id"]}
        elif tier == 100:
            # Tier 100 premium: Cyber Ninja skin (legendary)
            if "Cyber Ninja" in cosmetic_map:
                premium_reward = {"type": "cosmetic", "value": cosmetic_map["Cyber Ninja"]["id"]}
        elif tier % 10 == 0:
            # Every 10 tiers premium: coins
            premium_reward = {"type": "coins", "value": tier * 20}
        elif tier % 5 == 0:
            # Every 5 tiers premium: coins
            premium_reward = {"type": "coins", "value": tier * 10}
        
        # Add banners at certain tiers
        if tier == 10 and "Knight's Crest" in cosmetic_map:
            free_reward = {"type": "cosmetic", "value": cosmetic_map["Knight's Crest"]["id"]}
        elif tier == 20 and "Soldier's Mark" in cosmetic_map:
            free_reward = {"type": "cosmetic", "value": cosmetic_map["Soldier's Mark"]["id"]}
        elif tier == 40 and "Digital Void" in cosmetic_map:
            premium_reward = {"type": "cosmetic", "value": cosmetic_map["Digital Void"]["id"]}
        elif tier == 60 and "Banana Republic" in cosmetic_map:
            premium_reward = {"type": "cosmetic", "value": cosmetic_map["Banana Republic"]["id"]}
        elif tier == 80 and "Shadow Clan" in cosmetic_map:
            premium_reward = {"type": "cosmetic", "value": cosmetic_map["Shadow Clan"]["id"]}
        
        tiers.append({
            "season_id": season_id,
            "tier_number": tier,
            "free_reward": free_reward,
            "premium_reward": premium_reward,
        })
    
    # Insert in batches
    batch_size = 25
    for i in range(0, len(tiers), batch_size):
        batch = tiers[i:i + batch_size]
        supabase.table("battlepass_tiers").insert(batch).execute()
        print(f"  + Created tiers {i + 1}-{min(i + batch_size, len(tiers))}")
    
    print(f"  ✓ Created {len(tiers)} tier rewards")


def main():
    print("=" * 50)
    print("Battle Pass Season Seed Script")
    print("=" * 50)
    
    season_id = create_season()
    create_tier_rewards(season_id)
    
    print("\n" + "=" * 50)
    print("🎉 Season setup complete!")
    print("\nXP Formula per match:")
    print("  - Win: 100 XP base")
    print("  - Loss: 50 XP base")
    print("  - +5 XP per kill")
    print("  - +10 XP per kill streak")
    print("  - +0.1 XP per second played")
    print("  - Clamped to 50-300 XP per match")
    print("\nXP per tier: 1000")
    print("Total tiers: 100")
    print("=" * 50)


if __name__ == "__main__":
    main()
