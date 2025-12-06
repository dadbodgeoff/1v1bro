/**
 * Sprite Sheet Processor
 * Handles loading sprite sheets, removing checkered backgrounds, and extracting frames
 */

export interface SpriteSheetConfig {
  columns: number
  rows: number
  frameWidth?: number  // Auto-calculated if not provided
  frameHeight?: number
}

/**
 * Check if a pixel is part of a checkered background pattern
 * Uses a wide range to catch all gray checker variations (50-210)
 */
function isCheckeredBackgroundPixel(r: number, g: number, b: number): boolean {
  // Check if it's a gray pixel (R ≈ G ≈ B)
  const tolerance = 15
  const isGray =
    Math.abs(r - g) < tolerance && Math.abs(g - b) < tolerance && Math.abs(r - b) < tolerance

  if (!isGray) return false

  // Checkered patterns use gray values roughly between 50-210
  // This covers both light (~128/191) and dark (~64/96) checker patterns
  return r >= 50 && r <= 210
}

/**
 * Remove checkered gray background from sprite sheet
 * The checkered pattern uses two gray colors that we'll make transparent
 */
function removeCheckeredBackground(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number
): void {
  const imageData = ctx.getImageData(0, 0, width, height)
  const data = imageData.data

  for (let i = 0; i < data.length; i += 4) {
    const r = data[i]
    const g = data[i + 1]
    const b = data[i + 2]

    if (isCheckeredBackgroundPixel(r, g, b)) {
      // Make transparent
      data[i + 3] = 0
    }
  }

  ctx.putImageData(imageData, 0, 0)
}

/**
 * Load and process a sprite sheet, returning individual frame canvases
 */
export async function processSpriteSheet(
  imageSrc: string,
  config: SpriteSheetConfig
): Promise<HTMLCanvasElement[]> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    
    img.onload = () => {
      const { columns, rows } = config
      const frameWidth = config.frameWidth ?? Math.floor(img.width / columns)
      const frameHeight = config.frameHeight ?? Math.floor(img.height / rows)

      // Create a canvas for the full sprite sheet
      const fullCanvas = document.createElement('canvas')
      fullCanvas.width = img.width
      fullCanvas.height = img.height
      const fullCtx = fullCanvas.getContext('2d')!
      
      // Draw the image
      fullCtx.drawImage(img, 0, 0)
      
      // Remove checkered background
      removeCheckeredBackground(fullCtx, img.width, img.height)

      // Extract individual frames
      const frames: HTMLCanvasElement[] = []
      
      for (let row = 0; row < rows; row++) {
        for (let col = 0; col < columns; col++) {
          const frameCanvas = document.createElement('canvas')
          frameCanvas.width = frameWidth
          frameCanvas.height = frameHeight
          const frameCtx = frameCanvas.getContext('2d')!

          // Copy frame from processed sprite sheet
          frameCtx.drawImage(
            fullCanvas,
            col * frameWidth,
            row * frameHeight,
            frameWidth,
            frameHeight,
            0,
            0,
            frameWidth,
            frameHeight
          )

          frames.push(frameCanvas)
        }
      }

      resolve(frames)
    }

    img.onerror = () => reject(new Error(`Failed to load sprite sheet: ${imageSrc}`))
    img.src = imageSrc
  })
}

/**
 * Convert canvas frames to drawable images for the game engine
 */
export function canvasToImages(canvases: HTMLCanvasElement[]): HTMLImageElement[] {
  return canvases.map(canvas => {
    const img = new Image()
    img.src = canvas.toDataURL('image/png')
    return img
  })
}
