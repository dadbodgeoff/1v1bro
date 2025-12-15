#!/usr/bin/env python3
"""
Render 3D GLB models to PNG thumbnails using headless rendering.

This script uses trimesh + pyrender to render GLB models without a browser.
It then uploads the thumbnails to Supabase storage and updates the cosmetics catalog.

Requirements:
  pip install trimesh pyrender pillow numpy supabase python-dotenv

For headless rendering (no display), you may also need:
  pip install pyglet PyOpenGL osmesa

On macOS, osmesa may not work - use the browser-based generator instead.
On Linux servers, install: apt-get install libosmesa6-dev

Usage:
  python scripts/render_3d_thumbnails.py
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

SUPABASE_URL = os.getenv('SUPABASE_URL')
SUPABASE_KEY = os.getenv('SUPABASE_SERVICE_KEY') or os.getenv('SUPABASE_KEY')

# Project root directory
PROJECT_ROOT = Path(__file__).parent.parent

# Skin configurations
# Maps skin name -> local GLB file -> thumbnail output name
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

def check_dependencies():
    """Check if required packages are installed."""
    missing = []
    
    try:
        import trimesh
    except ImportError:
        missing.append("trimesh")
    
    try:
        import pyrender
    except ImportError:
        missing.append("pyrender")
    
    try:
        from PIL import Image
    except ImportError:
        missing.append("pillow")
    
    try:
        import numpy
    except ImportError:
        missing.append("numpy")
    
    if missing:
        print("❌ Missing required packages:")
        print(f"   pip install {' '.join(missing)}")
        print()
        print("For headless rendering on Linux, also run:")
        print("   apt-get install libosmesa6-dev")
        print("   pip install PyOpenGL osmesa")
        return False
    
    return True

def render_glb_to_png(glb_path: Path, output_path: Path, width: int = 512, height: int = 512):
    """
    Render a GLB model to a PNG image.
    
    Args:
        glb_path: Path to the GLB file
        output_path: Path to save the PNG
        width: Image width
        height: Image height
    """
    import trimesh
    import pyrender
    import numpy as np
    from PIL import Image
    
    print(f"  Loading: {glb_path.name}")
    
    # Load the GLB file
    scene = trimesh.load(str(glb_path))
    
    # Convert to pyrender scene
    if isinstance(scene, trimesh.Scene):
        # Multi-mesh scene
        pyrender_scene = pyrender.Scene.from_trimesh_scene(scene)
    else:
        # Single mesh
        mesh = pyrender.Mesh.from_trimesh(scene)
        pyrender_scene = pyrender.Scene()
        pyrender_scene.add(mesh)
    
    # Get scene bounds for camera positioning
    bounds = pyrender_scene.bounds
    if bounds is None:
        print(f"  ⚠ Could not determine scene bounds")
        return False
    
    center = (bounds[0] + bounds[1]) / 2
    size = bounds[1] - bounds[0]
    max_dim = max(size)
    
    # Position camera for a nice hero shot
    camera_distance = max_dim * 2.5
    camera_height = center[1] + max_dim * 0.3
    
    # Create camera
    camera = pyrender.PerspectiveCamera(yfov=np.pi / 4.0)
    
    # Camera position: slightly to the right and above, looking at center
    camera_pose = np.array([
        [0.866, 0.0, 0.5, center[0] + camera_distance * 0.5],
        [0.0, 1.0, 0.0, camera_height],
        [-0.5, 0.0, 0.866, center[2] + camera_distance * 0.866],
        [0.0, 0.0, 0.0, 1.0],
    ])
    
    pyrender_scene.add(camera, pose=camera_pose)
    
    # Add lighting
    # Key light
    key_light = pyrender.DirectionalLight(color=[1.0, 1.0, 1.0], intensity=3.0)
    key_light_pose = np.eye(4)
    key_light_pose[:3, :3] = trimesh.transformations.rotation_matrix(
        np.radians(-45), [0, 1, 0]
    )[:3, :3]
    pyrender_scene.add(key_light, pose=key_light_pose)
    
    # Fill light
    fill_light = pyrender.DirectionalLight(color=[0.5, 0.5, 0.7], intensity=1.5)
    fill_light_pose = np.eye(4)
    fill_light_pose[:3, :3] = trimesh.transformations.rotation_matrix(
        np.radians(135), [0, 1, 0]
    )[:3, :3]
    pyrender_scene.add(fill_light, pose=fill_light_pose)
    
    # Ambient light
    ambient_light = pyrender.DirectionalLight(color=[1.0, 1.0, 1.0], intensity=1.0)
    pyrender_scene.add(ambient_light)
    
    # Render
    print(f"  Rendering: {width}x{height}")
    
    try:
        # Try offscreen rendering
        renderer = pyrender.OffscreenRenderer(width, height)
        color, depth = renderer.render(pyrender_scene, flags=pyrender.RenderFlags.RGBA)
        renderer.delete()
    except Exception as e:
        print(f"  ⚠ Offscreen rendering failed: {e}")
        print("  Try installing osmesa for headless rendering")
        return False
    
    # Save as PNG with transparency
    image = Image.fromarray(color)
    image.save(str(output_path), 'PNG')
    
    print(f"  ✓ Saved: {output_path.name}")
    return True

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
    print("3D Thumbnail Renderer")
    print("=" * 60)
    print()
    
    # Check dependencies
    if not check_dependencies():
        print()
        print("Alternative: Use the browser-based generator at:")
        print("  http://localhost:5173/admin/thumbnail-generator")
        return 1
    
    # Create output directory
    output_dir = PROJECT_ROOT / "thumbnails"
    output_dir.mkdir(exist_ok=True)
    
    print(f"Output directory: {output_dir}")
    print()
    
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
            continue
        
        # Upload to Supabase
        storage_path = f"thumbnails/{skin['thumbnail_name']}"
        thumbnail_url = upload_to_supabase(output_path, storage_path)
        
        if thumbnail_url:
            # Build model URL
            model_url = f"{SUPABASE_URL}/storage/v1/object/public/cosmetics/{skin['model_url_path']}"
            
            # Update catalog
            update_cosmetic_catalog(skin['name'], thumbnail_url, model_url)
        
        print()
    
    print("=" * 60)
    print("Done!")
    print("=" * 60)
    return 0

if __name__ == "__main__":
    sys.exit(main())
