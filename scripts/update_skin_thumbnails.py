#!/usr/bin/env python3
"""
Update cosmetics catalog with static thumbnail URLs for 3D skins.

After generating thumbnails using the /admin/thumbnail-generator page,
run this script to update the database with the new shop_preview_url values.

This separates:
- shop_preview_url: Static PNG thumbnail for shop cards
- model_url: GLB file for interactive 3D preview on hover

Usage:
  python scripts/update_skin_thumbnails.py
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

def storage_url(path: str) -> str:
    """Build public URL for Supabase Storage asset."""
    base_url = SUPABASE_URL.rstrip('/')
    return f"{base_url}/storage/v1/object/public/cosmetics/{path}"

# Mapping of skin names to their assets
# shop_preview_url = static PNG thumbnail
# model_url = GLB file for 3D preview
SKIN_UPDATES = [
    {
        "name": "Nova Blaze",
        "shop_preview_url": storage_url("thumbnails/nova-blaze.png"),
        "model_url": storage_url("3d/solarflare-run.glb"),
    },
    {
        "name": "Helios Prime",
        "shop_preview_url": storage_url("thumbnails/helios-prime.png"),
        "model_url": storage_url("3d/solarflareguy-run.glb"),
    },
    {
        "name": "Phantom Striker",
        "shop_preview_url": storage_url("thumbnails/phantom-striker.png"),
        "model_url": storage_url("3d/animie-run.glb"),
    },
]

def check_thumbnails_exist():
    """Check if thumbnail files exist in storage."""
    print("🔍 Checking thumbnail files in storage...")
    
    all_exist = True
    for skin in SKIN_UPDATES:
        thumbnail_path = skin['shop_preview_url'].split('/cosmetics/')[-1]
        try:
            # List files in thumbnails folder
            result = supabase.storage.from_('cosmetics').list(
                path='thumbnails',
            )
            filename = thumbnail_path.split('/')[-1]
            exists = any(f['name'] == filename for f in result)
            
            if exists:
                print(f"  ✓ {skin['name']}: {filename}")
            else:
                print(f"  ✗ {skin['name']}: {filename} NOT FOUND")
                all_exist = False
        except Exception as e:
            print(f"  ✗ {skin['name']}: Error checking ({e})")
            all_exist = False
    
    return all_exist

def update_cosmetics():
    """Update cosmetics catalog with thumbnail URLs."""
    print("\n📝 Updating cosmetics catalog...")
    
    for skin in SKIN_UPDATES:
        try:
            # Update the cosmetic record
            result = supabase.table("cosmetics_catalog").update({
                "shop_preview_url": skin["shop_preview_url"],
                "model_url": skin["model_url"],
            }).eq("name", skin["name"]).execute()
            
            if result.data:
                print(f"  ✓ Updated: {skin['name']}")
            else:
                print(f"  ⚠ No record found for: {skin['name']}")
        except Exception as e:
            print(f"  ✗ Failed to update {skin['name']}: {e}")

def show_current_state():
    """Show current state of 3D skins in catalog."""
    print("\n📊 Current 3D skin configuration:")
    
    for skin in SKIN_UPDATES:
        try:
            result = supabase.table("cosmetics_catalog").select(
                "name, shop_preview_url, model_url"
            ).eq("name", skin["name"]).execute()
            
            if result.data:
                data = result.data[0]
                print(f"\n  {data['name']}:")
                print(f"    shop_preview_url: {data.get('shop_preview_url', 'NOT SET')}")
                print(f"    model_url: {data.get('model_url', 'NOT SET')}")
            else:
                print(f"\n  {skin['name']}: NOT FOUND IN CATALOG")
        except Exception as e:
            print(f"\n  {skin['name']}: Error ({e})")

def main():
    print("=" * 60)
    print("3D Skin Thumbnail URL Updater")
    print("=" * 60)
    print()
    
    # Show current state
    show_current_state()
    
    # Check if thumbnails exist
    print()
    thumbnails_ready = check_thumbnails_exist()
    
    if not thumbnails_ready:
        print("\n" + "=" * 60)
        print("⚠ Some thumbnails are missing!")
        print("=" * 60)
        print()
        print("Please generate thumbnails first:")
        print("1. Start frontend: npm run dev")
        print("2. Go to: http://localhost:5173/admin/thumbnail-generator")
        print("3. Generate and upload thumbnails for each skin")
        print("4. Run this script again")
        print()
        
        response = input("Continue anyway? (y/N): ")
        if response.lower() != 'y':
            print("Aborted.")
            return
    
    # Update cosmetics
    update_cosmetics()
    
    # Show final state
    print("\n" + "=" * 60)
    print("✅ Update complete!")
    print("=" * 60)
    show_current_state()

if __name__ == "__main__":
    main()
