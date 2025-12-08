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
 * Check if a pixel is a white or light background
 */
function isWhiteBackgroundPixel(r: number, g: number, b: number): boolean {
  // Pure white
  if (r > 245 && g > 245 && b > 245) return true
  
  // Light gray (common in image backgrounds)
  const isGray = Math.abs(r - g) < 15 && Math.abs(g - b) < 15 && Math.abs(r - b) < 15
  if (isGray && r > 220) return true
  
  // Off-white/cream
  if (r > 235 && g > 230 && b > 220) return true
  
  return false
}

/**
 * Remove checkered gray and white backgrounds from sprite sheet
 * The checkered pattern uses two gray colors that we'll make transparent
 * Also removes white/light backgrounds for JPG images
 */
function removeBackgrounds(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  removeWhite: boolean = true
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
    } else if (removeWhite && isWhiteBackgroundPixel(r, g, b)) {
      // Make white backgrounds transparent
      data[i + 3] = 0
    }
  }

  ctx.putImageData(imageData, 0, 0)
}

/**
 * Load and process a sprite sheet, returning individual frame canvases
 * @param imageSrc - URL of the sprite sheet image
 * @param config - Sprite sheet configuration (columns, rows, frame dimensions)
 * @param removeWhiteBackground - Whether to remove white backgrounds (default: true for JPG/JPEG)
 */
export async function processSpriteSheet(
  imageSrc: string,
  config: SpriteSheetConfig,
  removeWhiteBackground?: boolean
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
      
      // Determine if we should remove white background
      // Default to true for JPG/JPEG, false for PNG
      const shouldRemoveWhite = removeWhiteBackground ?? 
        (imageSrc.toLowerCase().includes('.jpg') || imageSrc.toLowerCase().includes('.jpeg'))
      
      // Remove backgrounds (checkered always, white based on image type)
      removeBackgrounds(fullCtx, img.width, img.height, shouldRemoveWhite)

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
