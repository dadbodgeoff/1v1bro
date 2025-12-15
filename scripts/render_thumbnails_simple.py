#!/usr/bin/env python3
"""
Render 3D GLB models to PNG thumbnails using trimesh's built-in renderer.

This script renders GLB models to PNG thumbnails and uploads them to Supabase.

Usage:
  python scripts/render_thumbnails_simple.py
"""

import os
import sys
import io
from pathlib import Path

# Add backend to path for imports
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'backend'))

from dotenv import load_dotenv

# Load environment variables
load_dotenv()
load_dotenv(os.path.join(os.path.dirname(__file__), '..', 'backend', '.env'))
load_dotenv(os.path.join(os.path.dirname(__file__), '..', '.env'))

SUPABASE_URL = os.getenv('SUPABASE_URL', '').rstrip('/')
SUPABASE_KEY = os.getenv('SUPABASE_SERVICE_KEY') or os.getenv('SUPABASE_KEY')

# Project root directory
PROJECT_ROOT = Path(__file__).parent.parent

# Skin configurations
SKINS = [
    {
        "name": "Nova Blaze",
        "glb_file": "solarflarerunner-optimized.glb",
        "thumbnail_name": "nova-blaze.png",
        "model_url_path": "3d/solarflare-run.glb",
    },
    {
        "name": "Helios Prime",
        "glb_file": "solarflareGuyrun-optimized.glb",
        "thumbnail_name": "helios-prime.png",
        "model_url_path": "3d/solarflareguy-run.glb",
    },
    {
        "name": "Phantom Striker",
        "glb_file": "animierunner-optimized.glb",
        "thumbnail_name": "phantom-striker.png",
        "model_url_path": "3d/animie-run.glb",
    },
]


def render_glb_to_png(glb_path: Path, output_path: Path, width: int = 512, height: int = 512):
    """Render a GLB model to a PNG image using trimesh."""
    import trimesh
    import numpy as np
    from PIL import Image
    
    print(f"  Loading: {glb_path.name}")
    
    try:
        # Load the GLB file
        scene = trimesh.load(str(glb_path), force='scene')
        
        # Get the scene as a single mesh if possible
        if isinstance(scene, trimesh.Scene):
            # Dump all geometry into a single mesh for rendering
            meshes = []
            for name, geom in scene.geometry.items():
                if isinstance(geom, trimesh.Trimesh):
                    meshes.append(geom)
            
            if not meshes:
                print(f"  ⚠ No meshes found in scene")
                return False
            
            # Combine all meshes
            combined = trimesh.util.concatenate(meshes)
        else:
            combined = scene
        
        # Center the mesh
        combined.vertices -= combined.centroid
        
        # Scale to fit in view
        scale = 1.0 / combined.extents.max()
        combined.vertices *= scale
        
        # Rotate for a nice hero angle (slight rotation on Y axis)
        rotation = trimesh.transformations.rotation_matrix(
            np.radians(30), [0, 1, 0]
        )
        combined.apply_transform(rotation)
        
        # Try to render using trimesh's scene rendering
        print(f"  Rendering: {width}x{height}")
        
        # Create a scene for rendering
        render_scene = trimesh.Scene(combined)
        
        # Set camera for a nice view
        render_scene.set_camera(
            angles=[np.radians(15), np.radians(30), 0],
            distance=2.5,
            center=combined.centroid
        )
        
        # Try to get a PNG
        try:
            # Use trimesh's built-in PNG export
            png_data = render_scene.save_image(resolution=[width, height], visible=False)
            
            if png_data is not None:
                # Save the image
                with open(output_path, 'wb') as f:
                    f.write(png_data)
                print(f"  ✓ Saved: {output_path.name}")
                return True
            else:
                print(f"  ⚠ Render returned None - trying alternative method")
        except Exception as e:
            print(f"  ⚠ Trimesh render failed: {e}")
        
        # Alternative: Create a simple orthographic projection image
        print(f"  Trying alternative 2D projection...")
        return render_2d_projection(combined, output_path, width, height)
        
    except Exception as e:
        print(f"  ✗ Failed to load/render: {e}")
        return False


def render_2d_projection(mesh, output_path: Path, width: int, height: int):
    """Create a simple 2D projection of the mesh as a fallback."""
    import numpy as np
    from PIL import Image, ImageDraw
    
    try:
        # Get vertices
        vertices = mesh.vertices
        
        # Simple orthographic projection (looking from front-right-top)
        # Project onto XY plane with some rotation
        angle = np.radians(30)
        cos_a, sin_a = np.cos(angle), np.sin(angle)
        
        # Rotate around Y axis
        x = vertices[:, 0] * cos_a + vertices[:, 2] * sin_a
        y = vertices[:, 1]
        
        # Normalize to image coordinates
        x_min, x_max = x.min(), x.max()
        y_min, y_max = y.min(), y.max()
        
        margin = 0.1
        x_range = (x_max - x_min) * (1 + 2 * margin)
        y_range = (y_max - y_min) * (1 + 2 * margin)
        
        scale = min(width / x_range, height / y_range) * 0.8
        
        x_img = ((x - x_min) / x_range * width * 0.8 + width * 0.1).astype(int)
        y_img = (height - ((y - y_min) / y_range * height * 0.8 + height * 0.1)).astype(int)
        
        # Create image with transparent background
        img = Image.new('RGBA', (width, height), (0, 0, 0, 0))
        draw = ImageDraw.Draw(img)
        
        # Draw faces if available
        if hasattr(mesh, 'faces') and mesh.faces is not None:
            for face in mesh.faces:
                points = [(x_img[i], y_img[i]) for i in face]
                # Use a gradient color based on face normal
                draw.polygon(points, fill=(100, 100, 200, 200), outline=(150, 150, 255, 255))
        else:
            # Just draw points
            for i in range(len(x_img)):
                draw.ellipse([x_img[i]-2, y_img[i]-2, x_img[i]+2, y_img[i]+2], 
                           fill=(100, 100, 200, 255))
        
        img.save(output_path, 'PNG')
        print(f"  ✓ Saved (2D projection): {output_path.name}")
        return True
        
    except Exception as e:
        print(f"  ✗ 2D projection failed: {e}")
        return False


def upload_to_supabase(file_path: Path, storage_path: str):
    """Upload a file to Supabase storage."""
    from supabase import create_client
    
    if not SUPABASE_URL or not SUPABASE_KEY:
        print("  ⚠ Supabase credentials not configured")
        return None
    
    supabase = create_client(SUPABASE_URL, SUPABASE_KEY)
    
    with open(file_path, 'rb') as f:
        file_data = f.read()
    
    try:
        # Remove existing file if present
        try:
            supabase.storage.from_('cosmetics').remove([storage_path])
        except:
            pass
        
        # Upload new file
        result = supabase.storage.from_('cosmetics').upload(
            storage_path,
            file_data,
            file_options={"content-type": "image/png", "upsert": "true"}
        )
        
        # Build public URL
        public_url = f"{SUPABASE_URL}/storage/v1/object/public/cosmetics/{storage_path}"
        print(f"  ✓ Uploaded: {storage_path}")
        return public_url
    except Exception as e:
        print(f"  ✗ Upload failed: {e}")
        return None


def update_cosmetic_catalog(skin_name: str, shop_preview_url: str, model_url: str):
    """Update the cosmetics catalog with new URLs."""
    from supabase import create_client
    
    if not SUPABASE_URL or not SUPABASE_KEY:
        return False
    
    supabase = create_client(SUPABASE_URL, SUPABASE_KEY)
    
    try:
        result = supabase.table("cosmetics_catalog").update({
            "shop_preview_url": shop_preview_url,
            "model_url": model_url,
        }).eq("name", skin_name).execute()
        
        if result.data:
            print(f"  ✓ Updated catalog: {skin_name}")
            return True
        else:
            print(f"  ⚠ No catalog entry found for: {skin_name}")
            return False
    except Exception as e:
        print(f"  ✗ Catalog update failed: {e}")
        return False


def main():
    print("=" * 60)
    print("3D Thumbnail Renderer (Simple)")
    print("=" * 60)
    print()
    
    # Create output directory
    output_dir = PROJECT_ROOT / "thumbnails"
    output_dir.mkdir(exist_ok=True)
    
    print(f"Output directory: {output_dir}")
    print(f"Supabase URL: {SUPABASE_URL}")
    print()
    
    success_count = 0
    
    # Process each skin
    for skin in SKINS:
        print(f"Processing: {skin['name']}")
        
        glb_path = PROJECT_ROOT / skin['glb_file']
        if not glb_path.exists():
            print(f"  ✗ GLB file not found: {glb_path}")
            continue
        
        output_path = output_dir / skin['thumbnail_name']
        
        # Render thumbnail
        success = render_glb_to_png(glb_path, output_path)
        if not success:
            print()
            continue
        
        # Upload to Supabase
        storage_path = f"thumbnails/{skin['thumbnail_name']}"
        thumbnail_url = upload_to_supabase(output_path, storage_path)
        
        if thumbnail_url:
            # Build model URL
            model_url = f"{SUPABASE_URL}/storage/v1/object/public/cosmetics/{skin['model_url_path']}"
            
            # Update catalog
            if update_cosmetic_catalog(skin['name'], thumbnail_url, model_url):
                success_count += 1
        
        print()
    
    print("=" * 60)
    print(f"Done! {success_count}/{len(SKINS)} skins updated.")
    print("=" * 60)
    return 0 if success_count == len(SKINS) else 1


if __name__ == "__main__":
    sys.exit(main())
