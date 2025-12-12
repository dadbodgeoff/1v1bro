/**
 * PropRenderer - Renders props on the arena floor
 *
 * Handles loading prop images with background removal,
 * Y-sorting for proper depth, and shadow rendering.
 *
 * @module props/PropRenderer
 */

import { removeBackground, type BackgroundType } from '../assets/ImageProcessor'
import type { PropDefinition, PropPlacement } from './PropRegistry'
import { getPropDefinition } from './PropRegistry'

// Default crop percentage if not specified in prop definition
const DEFAULT_CROP_PERCENT = 0.5
const DEFAULT_BACKGROUND_TYPE: BackgroundType = 'checkered'

/**
 * Loaded prop with its processed canvas
 */
interface LoadedProp {
  definition: PropDefinition
  canvas: HTMLCanvasElement
}

/**
 * Runtime prop instance for rendering
 */
interface PropInstance {
  placement: PropPlacement
  definition: PropDefinition
  canvas: HTMLCanvasElement
  sortY: number // Y value used for depth sorting
}

export class PropRenderer {
  private loadedProps: Map<string, LoadedProp> = new Map()
  private propInstances: PropInstance[] = []
  private ctx: CanvasRenderingContext2D | null = null
  private isLoaded = false
  private loadingPromise: Promise<void> | null = null

  /**
   * Set the rendering context
   */
  setContext(ctx: CanvasRenderingContext2D): void {
    this.ctx = ctx
  }

  /**
   * Load all props needed for a set of placements
   */
  async loadProps(placements: PropPlacement[]): Promise<void> {
    if (this.loadingPromise) return this.loadingPromise

    this.loadingPromise = this.doLoadProps(placements)
    return this.loadingPromise
  }

  private async doLoadProps(placements: PropPlacement[]): Promise<void> {
    // Get unique prop IDs needed
    const propIds = [...new Set(placements.map((p) => p.propId))]

    console.log(`[PropRenderer] Loading ${propIds.length} prop types...`)

    // Load each prop type
    const loadPromises = propIds.map(async (id) => {
      const definition = getPropDefinition(id)
      if (!definition) {
        console.warn(`[PropRenderer] Unknown prop ID: ${id}`)
        return
      }

      try {
        // Load image, extract center, remove background, and scale to target size
        const canvas = await this.loadAndProcessProp(definition)
        this.loadedProps.set(id, { definition, canvas })
        console.log(`[PropRenderer] Loaded prop: ${definition.name} (${canvas.width}x${canvas.height})`)
      } catch (error) {
        console.error(`[PropRenderer] Failed to load prop ${id}:`, error)
      }
    })

    await Promise.all(loadPromises)

    // Create prop instances from placements
    this.propInstances = placements
      .map((placement) => {
        const loaded = this.loadedProps.get(placement.propId)
        if (!loaded) return null

        const { definition, canvas } = loaded
        // Note: scale is available via placement.scale if needed for future use

        // Calculate sort Y (bottom of prop for proper depth sorting)
        const sortY = placement.y + (definition.zOffset ?? 0)

        return {
          placement,
          definition,
          canvas,
          sortY,
        }
      })
      .filter((p): p is PropInstance => p !== null)

    // Sort by Y for painter's algorithm (back to front)
    this.sortProps()

    this.isLoaded = true
    console.log(`[PropRenderer] ${this.propInstances.length} props ready`)
  }

  /**
   * Load an image, extract the prop from center, remove checkered background, and scale
   */
  private async loadAndProcessProp(definition: PropDefinition): Promise<HTMLCanvasElement> {
    // Load the raw image
    const img = await this.loadImage(definition.url)
    
    // Step 1: Extract center portion (prop is in center, checkered bg around edges)
    const cropPercent = definition.cropPercent ?? DEFAULT_CROP_PERCENT
    const imgSize = Math.min(img.width, img.height)
    const cropSize = imgSize * cropPercent
    const cropX = (img.width - cropSize) / 2
    const cropY = (img.height - cropSize) / 2
    
    // Create intermediate canvas with cropped image at high resolution for quality
    // Use 512x512 for better detail preservation, especially for detailed props
    const workingSize = 512 // Increased from 256 for better quality
    const cropCanvas = document.createElement('canvas')
    cropCanvas.width = workingSize
    cropCanvas.height = workingSize
    const cropCtx = cropCanvas.getContext('2d')!
    
    // Enable high-quality image scaling
    cropCtx.imageSmoothingEnabled = true
    cropCtx.imageSmoothingQuality = 'high'
    
    cropCtx.drawImage(img, cropX, cropY, cropSize, cropSize, 0, 0, workingSize, workingSize)
    
    // Step 2: Create an image from the cropped canvas for background removal
    const croppedImg = await this.canvasToImage(cropCanvas)
    
    // Step 3: Remove background using prop-specific background type
    const bgType = definition.backgroundType ?? DEFAULT_BACKGROUND_TYPE
    const transparentCanvas = removeBackground(croppedImg, bgType)
    
    // Step 4: Scale to target size with high quality
    const finalCanvas = document.createElement('canvas')
    finalCanvas.width = definition.width
    finalCanvas.height = definition.height
    const finalCtx = finalCanvas.getContext('2d')!
    
    // Enable image smoothing for better quality scaling
    finalCtx.imageSmoothingEnabled = true
    finalCtx.imageSmoothingQuality = 'high'
    
    // Draw scaled version
    finalCtx.drawImage(transparentCanvas, 0, 0, definition.width, definition.height)
    
    return finalCanvas
  }

  /**
   * Load an image from URL
   */
  private loadImage(src: string): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
      const img = new Image()
      img.crossOrigin = 'anonymous'
      img.onload = () => resolve(img)
      img.onerror = () => reject(new Error(`Failed to load: ${src}`))
      img.src = src
    })
  }

  /**
   * Convert a canvas to an image element
   */
  private canvasToImage(canvas: HTMLCanvasElement): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
      const img = new Image()
      img.onload = () => resolve(img)
      img.onerror = () => reject(new Error('Failed to convert canvas to image'))
      img.src = canvas.toDataURL()
    })
  }

  /**
   * Sort props by Y position (painter's algorithm)
   */
  private sortProps(): void {
    this.propInstances.sort((a, b) => a.sortY - b.sortY)
  }

  /**
   * Check if props are loaded
   */
  isReady(): boolean {
    return this.isLoaded
  }

  /**
   * Render all props
   * Call this after rendering the floor but before rendering players
   */
  render(): void {
    if (!this.ctx || !this.isLoaded) return

    const ctx = this.ctx

    // Render shadows first (under all props) - only for background props
    for (const prop of this.propInstances) {
      // Skip foreground props (zOffset >= 50) - they render after players
      if ((prop.definition.zOffset ?? 0) >= 50) continue
      if (prop.definition.castsShadow) {
        this.renderShadow(ctx, prop)
      }
    }

    // Render background props back to front (zOffset < 50)
    for (const prop of this.propInstances) {
      if ((prop.definition.zOffset ?? 0) >= 50) continue
      this.renderProp(ctx, prop)
    }
  }

  /**
   * Render foreground props (grass, etc.) that should appear ABOVE players
   * Props with zOffset >= 50 are considered foreground
   * Call this AFTER rendering players
   */
  renderForeground(): void {
    if (!this.ctx || !this.isLoaded) return

    const ctx = this.ctx

    // Render foreground props (zOffset >= 50) - these go on top of players
    for (const prop of this.propInstances) {
      if ((prop.definition.zOffset ?? 0) < 50) continue
      // No shadows for foreground props (grass doesn't cast shadows on players)
      this.renderProp(ctx, prop)
    }
  }

  /**
   * Render props that should appear behind a given Y position
   * Useful for rendering props behind players
   */
  renderBehind(playerY: number): void {
    if (!this.ctx || !this.isLoaded) return

    const ctx = this.ctx

    for (const prop of this.propInstances) {
      if (prop.sortY <= playerY) {
        if (prop.definition.castsShadow) {
          this.renderShadow(ctx, prop)
        }
        this.renderProp(ctx, prop)
      }
    }
  }

  /**
   * Render props that should appear in front of a given Y position
   */
  renderInFront(playerY: number): void {
    if (!this.ctx || !this.isLoaded) return

    const ctx = this.ctx

    for (const prop of this.propInstances) {
      if (prop.sortY > playerY) {
        if (prop.definition.castsShadow) {
          this.renderShadow(ctx, prop)
        }
        this.renderProp(ctx, prop)
      }
    }
  }

  /**
   * Render a single prop
   */
  private renderProp(ctx: CanvasRenderingContext2D, prop: PropInstance): void {
    const { placement, definition, canvas } = prop
    const scale = placement.scale ?? 1
    const rotation = placement.rotation ?? 0

    // Calculate draw position based on anchor
    const drawWidth = definition.width * scale
    const drawHeight = definition.height * scale
    const drawX = placement.x - drawWidth * definition.anchorX
    const drawY = placement.y - drawHeight * definition.anchorY

    ctx.save()

    // Apply transformations
    if (rotation !== 0 || placement.flipX) {
      ctx.translate(placement.x, placement.y)
      if (rotation !== 0) {
        ctx.rotate((rotation * Math.PI) / 180)
      }
      if (placement.flipX) {
        ctx.scale(-1, 1)
      }
      ctx.translate(-placement.x, -placement.y)
    }

    // Apply opacity for dirt patches (blend with grass underneath)
    if (definition.id === 'dirtPatch') {
      ctx.globalAlpha = 0.7
      ctx.globalCompositeOperation = 'multiply'
    }

    // Draw the prop
    ctx.drawImage(canvas, drawX, drawY, drawWidth, drawHeight)

    // Reset composite operation
    ctx.globalAlpha = 1
    ctx.globalCompositeOperation = 'source-over'

    ctx.restore()
  }

  /**
   * Render shadow for a prop
   */
  private renderShadow(ctx: CanvasRenderingContext2D, prop: PropInstance): void {
    const { placement, definition, canvas } = prop
    const scale = placement.scale ?? 1

    const shadowOffsetX = definition.shadowOffsetX ?? 4
    const shadowOffsetY = definition.shadowOffsetY ?? 4

    // Calculate draw position
    const drawWidth = definition.width * scale
    const drawHeight = definition.height * scale * 0.3 // Flatten shadow
    const drawX = placement.x - drawWidth * definition.anchorX + shadowOffsetX
    const drawY = placement.y - drawHeight * 0.5 + shadowOffsetY

    ctx.save()

    // Shadow style - dark, semi-transparent, slightly blurred
    ctx.globalAlpha = 0.3
    ctx.filter = 'blur(2px)'

    // Draw shadow as a darkened, flattened version
    ctx.drawImage(canvas, drawX, drawY, drawWidth, drawHeight)

    ctx.restore()
  }

  /**
   * Get collision boxes for all props (for physics/gameplay)
   */
  getCollisionBoxes(): Array<{
    propId: string
    x: number
    y: number
    width: number
    height: number
    type: string
  }> {
    return this.propInstances
      .filter((p) => p.definition.collisionType !== 'decorative')
      .map((prop) => {
        const { placement, definition } = prop
        const scale = placement.scale ?? 1
        const box = definition.collisionBox ?? {
          x: (-definition.width * definition.anchorX),
          y: (-definition.height * definition.anchorY),
          width: definition.width,
          height: definition.height,
        }

        return {
          propId: definition.id,
          x: placement.x + box.x * scale,
          y: placement.y + box.y * scale,
          width: box.width * scale,
          height: box.height * scale,
          type: definition.collisionType,
        }
      })
  }

  /**
   * Check if a point collides with any prop
   */
  checkPointCollision(x: number, y: number): boolean {
    const boxes = this.getCollisionBoxes()
    return boxes.some(
      (box) =>
        x >= box.x &&
        x <= box.x + box.width &&
        y >= box.y &&
        y <= box.y + box.height
    )
  }

  /**
   * Check if a rectangle collides with any prop
   */
  checkRectCollision(
    x: number,
    y: number,
    width: number,
    height: number
  ): boolean {
    const boxes = this.getCollisionBoxes()
    return boxes.some(
      (box) =>
        x < box.x + box.width &&
        x + width > box.x &&
        y < box.y + box.height &&
        y + height > box.y
    )
  }
}
