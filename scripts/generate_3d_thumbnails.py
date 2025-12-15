#!/usr/bin/env python3
"""
Generate static thumbnail images from 3D GLB models.

This script uses a headless approach to render GLB models to PNG images
for use as shop preview thumbnails.

For now, this generates a placeholder and instructions.
The actual rendering happens client-side using the ThumbnailGenerator component.

Usage:
  python scripts/generate_3d_thumbnails.py

The workflow is:
1. Run this script to see which thumbnails need generating
2. Use the /admin/thumbnail-generator page to render them
3. Upload the generated PNGs to Supabase storage
4. Update the cosmetics catalog with the new shop_preview_url
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

# 3D skins that need thumbnails
SKINS_NEEDING_THUMBNAILS = [
    {
        "name": "Nova Blaze",
        "model_url": storage_url("3d/solarflare-run.glb"),
        "thumbnail_path": "thumbnails/nova-blaze.png",
    },
    {
        "name": "Helios Prime", 
        "model_url": storage_url("3d/solarflareguy-run.glb"),
        "thumbnail_path": "thumbnails/helios-prime.png",
    },
    {
        "name": "Phantom Striker",
        "model_url": storage_url("3d/animie-run.glb"),
        "thumbnail_path": "thumbnails/phantom-striker.png",
    },
]

def check_existing_thumbnails():
    """Check which thumbnails already exist in storage."""
    print("🔍 Checking existing thumbnails...")
    
    for skin in SKINS_NEEDING_THUMBNAILS:
        try:
            # Try to get file info
            result = supabase.storage.from_('cosmetics').list(
                path='thumbnails',
                options={'search': skin['thumbnail_path'].split('/')[-1]}
            )
            exists = any(f['name'] == skin['thumbnail_path'].split('/')[-1] for f in result)
            status = "✓ exists" if exists else "✗ missing"
            print(f"  {skin['name']}: {status}")
        except Exception as e:
            print(f"  {skin['name']}: ✗ error checking ({e})")

def main():
    print("=" * 60)
    print("3D Thumbnail Generator - Status Check")
    print("=" * 60)
    print()
    
    check_existing_thumbnails()
    
    print()
    print("=" * 60)
    print("📋 To generate thumbnails:")
    print("=" * 60)
    print()
    print("1. Start your frontend dev server: npm run dev")
    print()
    print("2. Navigate to: http://localhost:5173/admin/thumbnail-generator")
    print()
    print("3. The page will render each 3D model and let you:")
    print("   - Adjust camera angle")
    print("   - Download as PNG")
    print("   - Auto-upload to Supabase")
    print()
    print("4. After generating, run: python scripts/update_skin_thumbnails.py")
    print("   to update the cosmetics catalog with the new URLs")
    print()

if __name__ == "__main__":
    main()
