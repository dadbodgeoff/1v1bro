#!/usr/bin/env python3
"""
Dynamic Cosmetics Seed Script

Seeds the cosmetics_catalog with items from Supabase Storage.
Uses the Dynamic Shop CMS system to load assets dynamically.

Run with: python scripts/seed_dynamic_cosmetics.py

Requires SUPABASE_URL and SUPABASE_SERVICE_KEY environment variables.
"""

import os
import sys
from datetime import datetime, timedelta

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

# Build storage URL helper
def storage_url(bucket: str, path: str) -> str:
    """Build public URL for Supabase Storage asset."""
    base_url = SUPABASE_URL.rstrip('/')  # Remove trailing slash if present
    return f"{base_url}/storage/v1/object/public/{bucket}/{path}"


# ============================================
# Cosmetics to Seed (from your Supabase bucket)
# ============================================
# Sprite sheets are in cosmetics/skins/ folder
# Shop previews will go in cosmetics/previews/ folder (custom designed images)
# Banners are in cosmetics/banners/ folder

COSMETICS = [
    # ============================================
    # BUNDLED SKINS - Use skin_id (loaded from frontend assets)
    # These have sprite sheets bundled in the frontend build
    # ============================================
    {
        "name": "Armored Knight",
        "type": "skin",
        "rarity": "epic",
        "description": "A noble warrior clad in golden armor, ready for battle.",
        "image_url": storage_url("cosmetics", "banners/armoredknight.jpg"),
        "skin_id": "knightGold",  # Use bundled sprite sheet
        "price_coins": 1200,
        "is_featured": False,
        "sort_order": 1,
    },
    {
        "name": "Armored Soldier",
        "type": "skin",
        "rarity": "rare",
        "description": "Tactical combat gear with advanced protection systems.",
        "image_url": storage_url("cosmetics", "banners/armoredsolider.jpg"),
        "skin_id": "soldierPurple",  # Use bundled sprite sheet
        "price_coins": 800,
        "is_featured": False,
        "sort_order": 2,
    },
    {
        "name": "Tactical Banana",
        "type": "skin",
        "rarity": "legendary",
        "description": "When fruit goes tactical. The most a-peeling skin in the game!",
        "image_url": storage_url("cosmetics", "banners/banana.jpg"),
        "skin_id": "bananaTactical",  # Use bundled sprite sheet
        "price_coins": 1500,
        "is_featured": False,
        "sort_order": 3,
    },
    {
        "name": "Matrix Wraith",
        "type": "skin",
        "rarity": "epic",
        "description": "A digital phantom from the void. Glitch through reality.",
        "image_url": storage_url("cosmetics", "banners/martix.jpg"),
        "skin_id": "wraithMatrix",  # Use bundled sprite sheet
        "price_coins": 1200,
        "is_featured": False,
        "sort_order": 4,
    },
    {
        "name": "Cyber Ninja",
        "type": "skin",
        "rarity": "legendary",
        "description": "Stealth meets technology. Strike from the shadows.",
        "image_url": storage_url("cosmetics", "banners/ninja.jpg"),
        "skin_id": "ninjaCyber",  # Use bundled sprite sheet
        "price_coins": 1500,
        "is_featured": False,
        "sort_order": 5,
    },
    
    # ============================================
    # 3D MODEL SKINS - Use model_url (loaded from Supabase Storage 3D bucket)
    # These have 3D GLB models for interactive preview in the shop
    # ============================================
    {
        "name": "Cape Runner",
        "type": "skin",
        "rarity": "epic",
        "description": "A heroic runner with a flowing cape. Feel the wind as you dash through obstacles!",
        "image_url": "https://ikbshpdvvkydbpirbahl.supabase.co/storage/v1/object/public/cosmetics/3d/cape-optimized.glb",  # Use model as preview (will show 3D)
        "model_url": "https://ikbshpdvvkydbpirbahl.supabase.co/storage/v1/object/public/cosmetics/3d/cape-optimized.glb",  # 3D model for interactive preview
        "price_coins": 300,
        "is_featured": True,
        "sort_order": 6,
    },
    
    # ============================================
    # DYNAMIC CMS SKINS - Use sprite_sheet_url (loaded from Supabase Storage)
    # These are single images loaded dynamically with background removal
    # ============================================
    {
        "name": "Frostborne Valkyrie",
        "type": "skin",
        "rarity": "legendary",
        "description": "An ice warrior from the frozen realms. Command the frost.",
        "image_url": storage_url("cosmetics", "skins/Frostborne Valkyrie.jpg"),
        "sprite_sheet_url": storage_url("cosmetics", "skins/Frostborne Valkyrie.jpg"),
        "price_coins": 1800,
        "is_featured": True,
        "sort_order": 10,
    },
    {
        "name": "Abyssal Leviathan",
        "type": "skin",
        "rarity": "legendary",
        "description": "Rise from the depths. The ocean's fury incarnate.",
        "image_url": storage_url("cosmetics", "skins/Abyssal Leviathan.jpg"),
        "sprite_sheet_url": storage_url("cosmetics", "skins/Abyssal Leviathan.jpg"),
        "price_coins": 1800,
        "is_featured": True,
        "sort_order": 11,
    },
    {
        "name": "Molten Warlord",
        "type": "skin",
        "rarity": "legendary",
        "description": "Forged in volcanic fire. Unstoppable destruction.",
        "image_url": storage_url("cosmetics", "skins/Molten Warlord.jpg"),
        "sprite_sheet_url": storage_url("cosmetics", "skins/Molten Warlord.jpg"),
        "price_coins": 1800,
        "is_featured": True,
        "sort_order": 12,
    },
    {
        "name": "Plasma Ranger",
        "type": "skin",
        "rarity": "epic",
        "description": "High-tech plasma armor. The future of combat.",
        "image_url": storage_url("cosmetics", "skins/Plasma Ranger.jpg"),
        "sprite_sheet_url": storage_url("cosmetics", "skins/Plasma Ranger.jpg"),
        "price_coins": 1400,
        "is_featured": False,
        "sort_order": 13,
    },
    {
        "name": "Solar Champion",
        "type": "skin",
        "rarity": "epic",
        "description": "Harness the power of the sun. Radiant and unstoppable.",
        "image_url": storage_url("cosmetics", "skins/Solar Champion.jpg"),
        "sprite_sheet_url": storage_url("cosmetics", "skins/Solar Champion.jpg"),
        "price_coins": 1400,
        "is_featured": False,
        "sort_order": 14,
    },
    {
        "name": "Void Sovereign",
        "type": "skin",
        "rarity": "legendary",
        "description": "Master of the void. Reality bends to your will.",
        "image_url": storage_url("cosmetics", "skins/Void Sovereign.jpg"),
        "sprite_sheet_url": storage_url("cosmetics", "skins/Void Sovereign.jpg"),
        "price_coins": 2000,
        "is_featured": True,
        "sort_order": 15,
    },
    
    # ============================================
    # BANNERS - using your uploaded banner images
    # ============================================
    {
        "name": "Knight's Crest",
        "type": "banner",
        "rarity": "rare",
        "description": "Display your knightly honor with this royal banner.",
        "image_url": storage_url("cosmetics", "banners/armoredknight.jpg"),
        "price_coins": 300,
        "is_featured": False,
        "sort_order": 10,
    },
    {
        "name": "Soldier's Mark",
        "type": "banner",
        "rarity": "uncommon",
        "description": "Show your tactical prowess.",
        "image_url": storage_url("cosmetics", "banners/armoredsolider.jpg"),
        "price_coins": 200,
        "is_featured": False,
        "sort_order": 11,
    },
    {
        "name": "Banana Republic",
        "type": "banner",
        "rarity": "epic",
        "description": "Join the fruit revolution!",
        "image_url": storage_url("cosmetics", "banners/banana.jpg"),
        "price_coins": 400,
        "is_featured": False,
        "sort_order": 12,
    },
    {
        "name": "Digital Void",
        "type": "banner",
        "rarity": "rare",
        "description": "Embrace the glitch aesthetic.",
        "image_url": storage_url("cosmetics", "banners/martix.jpg"),
        "price_coins": 300,
        "is_featured": False,
        "sort_order": 13,
    },
    {
        "name": "Shadow Clan",
        "type": "banner",
        "rarity": "epic",
        "description": "Mark of the cyber ninja clan.",
        "image_url": storage_url("cosmetics", "banners/ninja.jpg"),
        "price_coins": 400,
        "is_featured": False,
        "sort_order": 14,
    },
]


def seed_cosmetics():
    """Insert cosmetics into the database."""
    print("🎨 Seeding dynamic cosmetics...")
    
    inserted = 0
    updated = 0
    
    for cosmetic in COSMETICS:
        # Check if cosmetic already exists by name
        existing = supabase.table("cosmetics_catalog").select("id").eq("name", cosmetic["name"]).execute()
        
        if existing.data:
            # Update existing
            result = supabase.table("cosmetics_catalog").update(cosmetic).eq("name", cosmetic["name"]).execute()
            updated += 1
            print(f"  ✓ Updated: {cosmetic['name']}")
        else:
            # Insert new
            result = supabase.table("cosmetics_catalog").insert(cosmetic).execute()
            inserted += 1
            print(f"  + Inserted: {cosmetic['name']}")
    
    print(f"\n✅ Done! Inserted: {inserted}, Updated: {updated}")


def create_featured_rotation():
    """Create a featured rotation with the featured items."""
    print("\n🔄 Creating featured rotation...")
    
    # Get featured cosmetic IDs
    featured = supabase.table("cosmetics_catalog").select("id").eq("is_featured", True).execute()
    featured_ids = [item["id"] for item in featured.data]
    
    if not featured_ids:
        print("  ⚠ No featured items found")
        return
    
    rotation = {
        "name": "Launch Featured Items",
        "rotation_type": "manual",
        "starts_at": datetime.utcnow().isoformat(),
        "ends_at": (datetime.utcnow() + timedelta(days=30)).isoformat(),
        "featured_cosmetic_ids": featured_ids,
        "rotation_rules": {"type": "manual", "count": len(featured_ids)},
        "is_active": True,
    }
    
    # Check if rotation exists
    existing = supabase.table("shop_rotations").select("id").eq("name", rotation["name"]).execute()
    
    if existing.data:
        supabase.table("shop_rotations").update(rotation).eq("name", rotation["name"]).execute()
        print(f"  ✓ Updated rotation with {len(featured_ids)} featured items")
    else:
        supabase.table("shop_rotations").insert(rotation).execute()
        print(f"  + Created rotation with {len(featured_ids)} featured items")


def main():
    print("=" * 50)
    print("Dynamic Cosmetics Seed Script")
    print("=" * 50)
    print(f"Supabase URL: {SUPABASE_URL}")
    print()
    
    seed_cosmetics()
    create_featured_rotation()
    
    print("\n" + "=" * 50)
    print("🎉 Seeding complete!")
    print("Your cosmetics are now live in the shop.")
    print("=" * 50)


if __name__ == "__main__":
    main()
