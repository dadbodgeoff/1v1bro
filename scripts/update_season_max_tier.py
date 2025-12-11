#!/usr/bin/env python3
"""
Quick script to add max_tier column and update the existing season.
Run with: python scripts/update_season_max_tier.py

This script:
1. Adds the max_tier column to the seasons table (if not exists)
2. Updates Season 1 to have max_tier = 35
"""

import os
from dotenv import load_dotenv
from supabase import create_client, Client

# Load environment variables
load_dotenv()

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_KEY") or os.getenv("SUPABASE_KEY")

if not SUPABASE_URL or not SUPABASE_KEY:
    print("Error: SUPABASE_URL and SUPABASE_SERVICE_KEY must be set")
    exit(1)

supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

def main():
    print("=" * 50)
    print("Season Max Tier Migration")
    print("=" * 50)
    
    # Step 1: Add the column via raw SQL
    print("\n1. Adding max_tier column to seasons table...")
    try:
        # Use RPC to run raw SQL (requires a function or direct DB access)
        # Since we can't run raw SQL via Supabase client, we'll check if column exists
        result = supabase.table("seasons").select("*").eq("season_number", 1).execute()
        
        if not result.data:
            print("  Error: Season 1 not found")
            return
        
        current = result.data[0]
        
        # Check if max_tier already exists
        if "max_tier" in current:
            print(f"  ✓ Column already exists. Current value: {current.get('max_tier')}")
        else:
            print("  ⚠ Column 'max_tier' does not exist in the database.")
            print()
            print("  Please run this SQL in your Supabase SQL Editor:")
            print("  " + "-" * 46)
            print("  ALTER TABLE seasons ADD COLUMN IF NOT EXISTS max_tier INTEGER DEFAULT 35;")
            print("  UPDATE seasons SET max_tier = 35 WHERE season_number = 1;")
            print("  " + "-" * 46)
            print()
            print("  Or run the migration file:")
            print("  backend/app/database/migrations/033_add_season_max_tier.sql")
            return
        
        # Step 2: Update the value if column exists
        print("\n2. Updating Season 1 max_tier to 35...")
        supabase.table("seasons").update({
            "max_tier": 35
        }).eq("season_number", 1).execute()
        
        print("  ✓ Updated max_tier to: 35")
        
        # Verify
        print("\n3. Verifying update...")
        verify = supabase.table("seasons").select("*").eq("season_number", 1).execute()
        if verify.data:
            print(f"  ✓ Season 1 max_tier is now: {verify.data[0].get('max_tier')}")
        
        print()
        print("=" * 50)
        print("✅ Migration complete! Season 1 now has 35 tiers.")
        print("=" * 50)
        
    except Exception as e:
        print(f"  Error: {e}")
        print()
        print("  Please run this SQL manually in Supabase SQL Editor:")
        print("  ALTER TABLE seasons ADD COLUMN IF NOT EXISTS max_tier INTEGER DEFAULT 35;")
        print("  UPDATE seasons SET max_tier = 35 WHERE season_number = 1;")

if __name__ == "__main__":
    main()
