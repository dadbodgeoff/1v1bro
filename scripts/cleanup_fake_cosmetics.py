#!/usr/bin/env python3
"""
Cleanup Fake Cosmetics Script

Removes all cosmetics from the database that aren't in the real assets list.
Keeps only the 5 skins and 5 banners that have actual assets in Supabase.

Run with: python scripts/cleanup_fake_cosmetics.py

Requires SUPABASE_URL and SUPABASE_SERVICE_KEY environment variables.
"""

import os
import sys

# Add backend to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'backend'))

from dotenv import load_dotenv
from supabase import create_client, Client

# Load environment variables
load_dotenv()
load_dotenv(os.path.join(os.path.dirname(__file__), '..', 'backend', '.env'))

SUPABASE_URL = os.getenv('SUPABASE_URL')
SUPABASE_KEY = os.getenv('SUPABASE_SERVICE_KEY') or os.getenv('SUPABASE_KEY')

if not SUPABASE_URL or not SUPABASE_KEY:
    print("Error: SUPABASE_URL and SUPABASE_SERVICE_KEY must be set")
    sys.exit(1)

supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

# These are the REAL cosmetics with actual assets
REAL_COSMETIC_NAMES = [
    # Skins (5)
    "Armored Knight",
    "Armored Soldier",
    "Tactical Banana",
    "Matrix Wraith",
    "Cyber Ninja",
    # Banners (5)
    "Knight's Crest",
    "Soldier's Mark",
    "Banana Republic",
    "Digital Void",
    "Shadow Clan",
]


def get_battlepass_cosmetic_ids():
    """Get IDs of cosmetics that are battle pass rewards (should not be deleted)."""
    try:
        # Check if battlepass_tiers table exists and get reward IDs
        tiers = supabase.table("battlepass_tiers").select("reward_cosmetic_id").execute()
        if tiers.data:
            return set(t["reward_cosmetic_id"] for t in tiers.data if t.get("reward_cosmetic_id"))
    except Exception:
        pass
    return set()


def cleanup_fake_cosmetics():
    """Remove fake shop cosmetics, leaving battle pass items untouched."""
    print("🧹 Cleaning up fake shop cosmetics...")
    
    # Get battle pass cosmetic IDs to protect
    battlepass_ids = get_battlepass_cosmetic_ids()
    if battlepass_ids:
        print(f"  Protecting {len(battlepass_ids)} battle pass reward cosmetics")
    
    # Get all cosmetics
    all_cosmetics = supabase.table("cosmetics_catalog").select("id, name").execute()
    
    if not all_cosmetics.data:
        print("  No cosmetics found in database")
        return
    
    print(f"  Found {len(all_cosmetics.data)} total cosmetics")
    
    # Find fake ones (not in our real list AND not a battle pass reward)
    fake_cosmetics = [
        c for c in all_cosmetics.data 
        if c["name"] not in REAL_COSMETIC_NAMES and c["id"] not in battlepass_ids
    ]
    
    if not fake_cosmetics:
        print("  ✓ No fake shop cosmetics to remove")
        return
    
    print(f"  Found {len(fake_cosmetics)} fake shop cosmetics to remove:")
    for c in fake_cosmetics:
        print(f"    - {c['name']}")
    
    # Confirm before deleting
    print("\n⚠️  This will permanently delete these shop cosmetics (battle pass items are protected).")
    confirm = input("Type 'yes' to confirm deletion: ")
    
    if confirm.lower() != 'yes':
        print("  Cancelled.")
        return
    
    # Delete fake cosmetics
    deleted = 0
    for cosmetic in fake_cosmetics:
        try:
            # First remove from any inventory
            supabase.table("inventory").delete().eq("cosmetic_id", cosmetic["id"]).execute()
            # Then delete the cosmetic
            supabase.table("cosmetics_catalog").delete().eq("id", cosmetic["id"]).execute()
            deleted += 1
            print(f"  ✓ Deleted: {cosmetic['name']}")
        except Exception as e:
            print(f"  ✗ Failed to delete {cosmetic['name']}: {e}")
    
    print(f"\n✅ Deleted {deleted} fake shop cosmetics")


def cleanup_shop_rotations():
    """Clean up shop rotations that reference deleted cosmetics."""
    print("\n🔄 Cleaning up shop rotations...")
    
    # Get real cosmetic IDs
    real_cosmetics = supabase.table("cosmetics_catalog").select("id").execute()
    real_ids = set(c["id"] for c in real_cosmetics.data) if real_cosmetics.data else set()
    
    # Get all rotations
    rotations = supabase.table("shop_rotations").select("*").execute()
    
    if not rotations.data:
        print("  No rotations found")
        return
    
    for rotation in rotations.data:
        featured_ids = rotation.get("featured_cosmetic_ids", []) or []
        # Filter to only include IDs that still exist
        valid_ids = [id for id in featured_ids if id in real_ids]
        
        if len(valid_ids) != len(featured_ids):
            # Update rotation with only valid IDs
            supabase.table("shop_rotations").update({
                "featured_cosmetic_ids": valid_ids
            }).eq("id", rotation["id"]).execute()
            print(f"  ✓ Updated rotation '{rotation['name']}': {len(featured_ids)} -> {len(valid_ids)} items")


def main():
    print("=" * 50)
    print("Cleanup Fake Cosmetics Script")
    print("=" * 50)
    print(f"Supabase URL: {SUPABASE_URL}")
    print(f"\nReal cosmetics to keep: {len(REAL_COSMETIC_NAMES)}")
    for name in REAL_COSMETIC_NAMES:
        print(f"  - {name}")
    print()
    
    cleanup_fake_cosmetics()
    cleanup_shop_rotations()
    
    print("\n" + "=" * 50)
    print("🎉 Cleanup complete!")
    print("=" * 50)


if __name__ == "__main__":
    main()
