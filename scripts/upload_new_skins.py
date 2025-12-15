#!/usr/bin/env python3
"""
Upload new 3D skin models to Supabase Storage and seed to cosmetics catalog.
"""

import os
import sys
from datetime import datetime, timedelta

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

# Files to upload - mapping local file to storage path
FILES_TO_UPLOAD = [
    # Solar Flare skin (original)
    ("solarflarerunner-optimized.glb", "3d/solarflare-run.glb"),
    ("solarflarejump-optimized.glb", "3d/solarflare-jump.glb"),
    ("solarflaredown-optimized.glb", "3d/solarflare-down.glb"),
    # Solar Flare Guy skin (variant)
    ("solarflareGuyrun-optimized.glb", "3d/solarflareguy-run.glb"),
    ("solarflareGuyjump-optimized.glb", "3d/solarflareguy-jump.glb"),
    ("solarflareGuydown-optimized.glb", "3d/solarflareguy-down.glb"),
    # Animie skin
    ("animierunner-optimized.glb", "3d/animie-run.glb"),
    ("animiejump-optimized.glb", "3d/animie-jump.glb"),
    ("animiejumpdown-optimized.glb", "3d/animie-down.glb"),
]

def storage_url(path: str) -> str:
    """Build public URL for Supabase Storage asset."""
    base_url = SUPABASE_URL.rstrip('/')
    return f"{base_url}/storage/v1/object/public/cosmetics/{path}"

def upload_files():
    """Upload all GLB files to Supabase Storage."""
    print("📤 Uploading 3D models to Supabase Storage...")
    
    for local_file, storage_path in FILES_TO_UPLOAD:
        local_path = os.path.join(os.path.dirname(__file__), '..', local_file)
        
        if not os.path.exists(local_path):
            print(f"  ⚠ File not found: {local_file}")
            continue
        
        with open(local_path, 'rb') as f:
            file_data = f.read()
        
        try:
            # Try to remove existing file first (ignore errors)
            try:
                supabase.storage.from_('cosmetics').remove([storage_path])
            except:
                pass
            
            # Upload new file
            result = supabase.storage.from_('cosmetics').upload(
                storage_path,
                file_data,
                file_options={"content-type": "model/gltf-binary", "upsert": "true"}
            )
            print(f"  ✓ Uploaded: {local_file} → {storage_path}")
        except Exception as e:
            print(f"  ✗ Failed to upload {local_file}: {e}")

# Three cool skin names with their animations
# model_url: 3D GLB file for hover preview
# shop_preview_url: Static PNG thumbnail for card display (set after generating thumbnails)
# image_url: Fallback image (can be same as shop_preview_url)
# Note: type is "skin" - the model_url field triggers 3D preview behavior
SKINS = [
    {
        "name": "Nova Blaze",
        "type": "skin",  # Still "skin" type - model_url triggers 3D preview
        "rarity": "legendary",
        "description": "Born from a dying star, this cosmic warrior channels pure solar energy. Leave trails of stardust in your wake!",
        "model_url": storage_url("3d/solarflare-run.glb"),
        "image_url": None,  # Will be set after thumbnail generation
        "shop_preview_url": None,  # Will be set after thumbnail generation
        "price_coins": 2500,
        "is_featured": True,
        "sort_order": 20,
    },
    {
        "name": "Helios Prime",
        "type": "skin",  # Still "skin" type - model_url triggers 3D preview
        "rarity": "epic",
        "description": "The ultimate solar guardian. Harness the power of a thousand suns and dominate the battlefield!",
        "model_url": storage_url("3d/solarflareguy-run.glb"),
        "image_url": None,  # Will be set after thumbnail generation
        "shop_preview_url": None,  # Will be set after thumbnail generation
        "price_coins": 1800,
        "is_featured": True,
        "sort_order": 21,
    },
    {
        "name": "Phantom Striker",
        "type": "skin",  # Still "skin" type - model_url triggers 3D preview
        "rarity": "legendary",
        "description": "A spectral warrior from another dimension. Phase through obstacles with supernatural grace!",
        "model_url": storage_url("3d/animie-run.glb"),
        "image_url": None,  # Will be set after thumbnail generation
        "shop_preview_url": None,  # Will be set after thumbnail generation
        "price_coins": 2200,
        "is_featured": True,
        "sort_order": 22,
    },
]

def seed_skins():
    """Insert new skins into the cosmetics catalog."""
    print("\n🎨 Seeding new skins to cosmetics catalog...")
    
    for skin in SKINS:
        # Filter out None values to avoid overwriting existing thumbnails
        skin_data = {k: v for k, v in skin.items() if v is not None}
        
        existing = supabase.table("cosmetics_catalog").select("id").eq("name", skin["name"]).execute()
        
        if existing.data:
            result = supabase.table("cosmetics_catalog").update(skin_data).eq("name", skin["name"]).execute()
            print(f"  ✓ Updated: {skin['name']}")
        else:
            result = supabase.table("cosmetics_catalog").insert(skin_data).execute()
            print(f"  + Inserted: {skin['name']}")

def main():
    print("=" * 50)
    print("New 3D Skins Upload Script")
    print("=" * 50)
    print(f"Supabase URL: {SUPABASE_URL}")
    print()
    
    upload_files()
    seed_skins()
    
    print("\n" + "=" * 50)
    print("🎉 Upload complete!")
    print("New skins are now available in the shop:")
    print("  • Nova Blaze (Legendary) - 2500 coins")
    print("  • Helios Prime (Epic) - 1800 coins")
    print("  • Phantom Striker (Legendary) - 2200 coins")
    print("=" * 50)

if __name__ == "__main__":
    main()
