/**
 * ImageBackground - Static image backdrop for non-space themes
 * 
 * Uses a large plane positioned behind the scene rather than a sphere,
 * which avoids distortion issues with non-panoramic images.
 * 
 * IMPORTANT: Uses MeshBasicMaterial which is NOT affected by tone mapping,
 * preserving the original image colors (warm pinks, oranges, etc.)
 */

import * as THREE from 'three'

export interface ImageBackgroundConfig {
  /** URL to the background image */
  imageUrl: string
  /** Distance from camera (default: 500) */
  distance?: number
  /** Rotation speed (0 for static, default: 0) */
  rotationSpeed?: number
}

export class ImageBackground {
  private mesh: THREE.Mesh
  private material: THREE.MeshBasicMaterial
  private texture: THREE.Texture | null = null
  private loader: THREE.TextureLoader
  private distance: number

  constructor(config: ImageBackgroundConfig) {
    this.distance = config.distance ?? 200
    this.loader = new THREE.TextureLoader()

    // Create material with a fallback color
    // MeshBasicMaterial is NOT affected by scene lighting or tone mapping
    // This preserves the original image colors (warm pinks, oranges, etc.)
    this.material = new THREE.MeshBasicMaterial({
      side: THREE.FrontSide,
      fog: false,
      depthWrite: false,
      color: 0x87CEEB, // Light blue fallback until texture loads
      transparent: false,
      toneMapped: false, // CRITICAL: Disable tone mapping to preserve colors
    })

    // Create initial placeholder geometry (will be resized when texture loads)
    // Use a large plane that fills the view
    const planeHeight = this.distance * 2.5
    const planeWidth = planeHeight * 2 // Will be adjusted to match image aspect ratio
    
    const geometry = new THREE.PlaneGeometry(planeWidth, planeHeight)
    this.mesh = new THREE.Mesh(geometry, this.material)
    this.mesh.renderOrder = -1000 // Render first (behind everything)
    this.mesh.frustumCulled = false // Always visible
    
    // Position the plane behind the scene, facing the camera
    this.mesh.position.z = -this.distance
    this.mesh.position.y = planeHeight * 0.15 // Slightly above center for better composition
    
    console.log('[ImageBackground] Created initial backdrop plane:', planeWidth, 'x', planeHeight, 'at distance', this.distance)

    // Load the texture
    this.loadTexture(config.imageUrl)
  }

  /**
   * Load background texture with fixed 16:9 aspect ratio
   */
  private loadTexture(url: string): void {
    this.loader.load(
      url,
      (texture) => {
        // Configure texture for best quality
        texture.colorSpace = THREE.SRGBColorSpace
        texture.minFilter = THREE.LinearFilter
        texture.magFilter = THREE.LinearFilter
        texture.wrapS = THREE.ClampToEdgeWrapping
        texture.wrapT = THREE.ClampToEdgeWrapping
        
        // Force 16:9 aspect ratio as specified
        const imageAspect = 16 / 9
        
        console.log('[ImageBackground] Texture loaded:', url)
        console.log('[ImageBackground] Using 16:9 aspect ratio')
        
        // Calculate plane dimensions to fill the view with 16:9 aspect
        // Make the plane tall enough to fill vertical FOV, then width follows from aspect
        const planeHeight = this.distance * 2.5
        const planeWidth = planeHeight * imageAspect
        
        // Dispose old geometry and create new one with 16:9 aspect ratio
        this.mesh.geometry.dispose()
        this.mesh.geometry = new THREE.PlaneGeometry(planeWidth, planeHeight)
        
        // Center the image - position slightly above center for better composition
        // This keeps Mt. Fuji visible in the scene
        this.mesh.position.y = planeHeight * 0.1
        
        console.log('[ImageBackground] Plane size:', planeWidth.toFixed(1), 'x', planeHeight.toFixed(1))
        
        // Apply to material
        this.material.map = texture
        this.material.color.setHex(0xffffff) // Remove fallback color tint
        this.material.needsUpdate = true
        this.texture = texture
      },
      (progress) => {
        if (progress.total > 0) {
          console.log('[ImageBackground] Loading:', Math.round(progress.loaded / progress.total * 100) + '%')
        }
      },
      (error) => {
        console.error('[ImageBackground] Failed to load texture:', url, error)
      }
    )
  }

  /**
   * Get the mesh to add to scene
   */
  getObject(): THREE.Mesh {
    return this.mesh
  }

  /**
   * Update background (call each frame)
   */
  update(_delta: number, playerZ: number): void {
    // Move with player (keep at fixed distance behind)
    this.mesh.position.z = playerZ - this.distance
  }

  /**
   * Change the background image
   */
  setImage(url: string): void {
    // Dispose old texture
    if (this.texture) {
      this.texture.dispose()
      this.texture = null
    }
    
    this.loadTexture(url)
  }

  /**
   * Dispose resources
   */
  dispose(): void {
    this.mesh.geometry.dispose()
    this.material.dispose()
    
    if (this.texture) {
      this.texture.dispose()
      this.texture = null
    }
  }
}
