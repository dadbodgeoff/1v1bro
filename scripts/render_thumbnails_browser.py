#!/usr/bin/env python3
"""
Render 3D GLB models to PNG thumbnails using Playwright + Three.js.

This script uses a headless browser to render GLB models with proper 3D lighting
and materials, then uploads the thumbnails to Supabase.

Usage:
  python scripts/render_thumbnails_browser.py
"""

import os
import sys
import base64
import asyncio
from pathlib import Path

sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'backend'))

from dotenv import load_dotenv

load_dotenv()
load_dotenv(os.path.join(os.path.dirname(__file__), '..', 'backend', '.env'))
load_dotenv(os.path.join(os.path.dirname(__file__), '..', '.env'))

SUPABASE_URL = os.getenv('SUPABASE_URL', '').rstrip('/')
SUPABASE_KEY = os.getenv('SUPABASE_SERVICE_KEY') or os.getenv('SUPABASE_KEY')

PROJECT_ROOT = Path(__file__).parent.parent

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

# HTML template with Three.js for rendering GLB models
HTML_TEMPLATE = """
<!DOCTYPE html>
<html>
<head>
    <style>
        body { margin: 0; background: transparent; }
        canvas { display: block; }
    </style>
</head>
<body>
    <script type="importmap">
    {
        "imports": {
            "three": "https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js",
            "three/addons/": "https://cdn.jsdelivr.net/npm/three@0.160.0/examples/jsm/"
        }
    }
    </script>
    <script type="module">
        import * as THREE from 'three';
        import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
        import { DRACOLoader } from 'three/addons/loaders/DRACOLoader.js';

        const WIDTH = 512;
        const HEIGHT = 512;

        // Create renderer with alpha
        const renderer = new THREE.WebGLRenderer({ 
            antialias: true, 
            alpha: true,
            preserveDrawingBuffer: true 
        });
        renderer.setSize(WIDTH, HEIGHT);
        renderer.setPixelRatio(2);
        renderer.setClearColor(0x000000, 0);
        renderer.outputColorSpace = THREE.SRGBColorSpace;
        renderer.toneMapping = THREE.ACESFilmicToneMapping;
        renderer.toneMappingExposure = 1.3;
        document.body.appendChild(renderer.domElement);

        // Create scene
        const scene = new THREE.Scene();

        // Create camera
        const camera = new THREE.PerspectiveCamera(40, 1, 0.1, 100);
        camera.position.set(1.5, 1.5, 3);
        camera.lookAt(0, 1, 0);

        // Add lighting
        const ambient = new THREE.AmbientLight(0xffffff, 0.7);
        scene.add(ambient);

        const keyLight = new THREE.DirectionalLight(0xffffff, 1.2);
        keyLight.position.set(3, 5, 3);
        scene.add(keyLight);

        const fillLight = new THREE.DirectionalLight(0x8888ff, 0.5);
        fillLight.position.set(-3, 2, 2);
        scene.add(fillLight);

        const rimLight = new THREE.DirectionalLight(0xffffff, 0.6);
        rimLight.position.set(0, 3, -3);
        scene.add(rimLight);

        const bottomFill = new THREE.DirectionalLight(0x4444ff, 0.3);
        bottomFill.position.set(0, -2, 2);
        scene.add(bottomFill);

        // Setup loaders
        const dracoLoader = new DRACOLoader();
        dracoLoader.setDecoderPath('https://www.gstatic.com/draco/versioned/decoders/1.5.6/');
        
        const loader = new GLTFLoader();
        loader.setDRACOLoader(dracoLoader);

        // Load model from base64 data
        window.loadModelFromBase64 = async function(base64Data) {
            return new Promise((resolve, reject) => {
                // Convert base64 to blob
                const binary = atob(base64Data);
                const bytes = new Uint8Array(binary.length);
                for (let i = 0; i < binary.length; i++) {
                    bytes[i] = binary.charCodeAt(i);
                }
                const blob = new Blob([bytes], { type: 'model/gltf-binary' });
                const url = URL.createObjectURL(blob);

                loader.load(url, (gltf) => {
                    // Clear previous model
                    scene.children.forEach(child => {
                        if (child.type === 'Group' || child.type === 'Mesh') {
                            scene.remove(child);
                        }
                    });

                    const model = gltf.scene;

                    // Center and scale model
                    const box = new THREE.Box3().setFromObject(model);
                    const size = box.getSize(new THREE.Vector3());
                    const center = box.getCenter(new THREE.Vector3());

                    const targetHeight = 2;
                    const scale = targetHeight / size.y;
                    model.scale.setScalar(scale);

                    model.position.x = -center.x * scale;
                    model.position.y = -box.min.y * scale;
                    model.position.z = -center.z * scale;
                    // Rotate to face camera (flip 180 degrees + slight angle for hero shot)
                    model.rotation.y = Math.PI + Math.PI / 6;

                    scene.add(model);

                    // Render
                    renderer.render(scene, camera);

                    // Get image data
                    const dataUrl = renderer.domElement.toDataURL('image/png');
                    
                    URL.revokeObjectURL(url);
                    resolve(dataUrl);
                }, undefined, reject);
            });
        };

        // Signal that we're ready
        window.rendererReady = true;
    </script>
</body>
</html>
"""


async def render_glb_to_png(page, glb_path: Path, output_path: Path):
    """Render a GLB model to PNG using the browser."""
    print(f"  Loading: {glb_path.name}")
    
    # Read GLB file and convert to base64
    with open(glb_path, 'rb') as f:
        glb_data = base64.b64encode(f.read()).decode('utf-8')
    
    print(f"  Rendering...")
    
    try:
        # Call the render function
        data_url = await page.evaluate(f'window.loadModelFromBase64("{glb_data}")')
        
        if not data_url:
            print(f"  ✗ Render returned empty")
            return False
        
        # Extract base64 PNG data
        png_base64 = data_url.split(',')[1]
        png_data = base64.b64decode(png_base64)
        
        # Save to file
        with open(output_path, 'wb') as f:
            f.write(png_data)
        
        print(f"  ✓ Saved: {output_path.name} ({len(png_data)} bytes)")
        return True
        
    except Exception as e:
        print(f"  ✗ Render failed: {e}")
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


async def main():
    from playwright.async_api import async_playwright
    
    print("=" * 60)
    print("3D Thumbnail Renderer (Browser)")
    print("=" * 60)
    print()
    
    # Create output directory
    output_dir = PROJECT_ROOT / "thumbnails"
    output_dir.mkdir(exist_ok=True)
    
    print(f"Output directory: {output_dir}")
    print(f"Supabase URL: {SUPABASE_URL}")
    print()
    
    success_count = 0
    
    async with async_playwright() as p:
        # Launch headless browser
        print("Launching headless browser...")
        browser = await p.chromium.launch(headless=True)
        page = await browser.new_page()
        
        # Set up the Three.js renderer
        await page.set_content(HTML_TEMPLATE)
        
        # Wait for renderer to be ready
        await page.wait_for_function('window.rendererReady === true', timeout=10000)
        print("Three.js renderer ready")
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
            success = await render_glb_to_png(page, glb_path, output_path)
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
        
        await browser.close()
    
    print("=" * 60)
    print(f"Done! {success_count}/{len(SKINS)} skins updated.")
    print("=" * 60)
    return 0 if success_count == len(SKINS) else 1


if __name__ == "__main__":
    sys.exit(asyncio.run(main()))
