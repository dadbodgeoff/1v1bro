#!/usr/bin/env python3
"""
Quick script to update the existing season's xp_per_tier value.
Run with: python scripts/update_season_xp.py
"""

import os
import sys

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

NEW_XP_PER_TIER = 400

def main():
    print(f"Updating Season 1 xp_per_tier to {NEW_XP_PER_TIER}...")
    
    # Get current season
    result = supabase.table("seasons").select("*").eq("season_number", 1).execute()
    
    if not result.data:
        print("No Season 1 found!")
        return
    
    current = result.data[0]
    print(f"  Current xp_per_tier: {current.get('xp_per_tier', 'N/A')}")
    
    # Update
    supabase.table("seasons").update({
        "xp_per_tier": NEW_XP_PER_TIER
    }).eq("season_number", 1).execute()
    
    print(f"  ✓ Updated to: {NEW_XP_PER_TIER}")
    print()
    print("New progression math:")
    print(f"  • XP per tier: {NEW_XP_PER_TIER}")
    print(f"  • Avg XP per game: ~115 (100 win base + bonuses)")
    print(f"  • Games per tier: ~{NEW_XP_PER_TIER // 115}-{NEW_XP_PER_TIER // 100 + 1}")
    print(f"  • Total games for 35 tiers: ~{35 * NEW_XP_PER_TIER // 115}-{35 * NEW_XP_PER_TIER // 100}")

if __name__ == "__main__":
    main()
