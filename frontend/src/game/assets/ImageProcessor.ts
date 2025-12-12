/**
 * Image Processor
 * Removes various background types from images at runtime
 */

export type BackgroundType = 'checkered' | 'checkered-light' | 'checkered-dark' | 'yellow' | 'dark' | 'white' | 'auto' | 'checkered-white' | 'dark-white' | 'none'

/**
 * Check if a pixel is part of a checkered background pattern
 * Uses a wide range to catch all gray checker variations (30-210)
 */
function isCheckeredBackgroundPixel(r: number, g: number, b: number): boolean {
  // Check if it's a gray pixel (R ≈ G ≈ B)
  const tolerance = 20
  const isGray =
    Math.abs(r - g) < tolerance && Math.abs(g - b) < tolerance && Math.abs(r - b) < tolerance

  if (!isGray) return false

  // Checkered patterns use gray values roughly between 30-210
  // This covers light (~128/191), medium (~64/96), and dark (~30-50) checker patterns
  return r >= 30 && r <= 210
}

/**
 * Check if a pixel is part of a LIGHT checkered background pattern only
 * More conservative - only catches the lighter gray squares (128-210)
 * Use this when the prop itself has gray/dark colors that shouldn't be removed
 */
function isLightCheckeredBackgroundPixel(r: number, g: number, b: number): boolean {
  const tolerance = 15
  const isGray =
    Math.abs(r - g) < tolerance && Math.abs(g - b) < tolerance && Math.abs(r - b) < tolerance

  if (!isGray) return false

  // Only catch the lighter checker squares (avoid removing gray prop content)
  return r >= 115 && r <= 210
}

/**
 * Check if a pixel is part of a DARK checkered background pattern only
 * Catches the darker gray squares (30-100)
 * Use this when the prop has light colors but dark checkered background
 */
function isDarkCheckeredBackgroundPixel(r: number, g: number, b: number): boolean {
  const tolerance = 15
  const isGray =
    Math.abs(r - g) < tolerance && Math.abs(g - b) < tolerance && Math.abs(r - b) < tolerance

  if (!isGray) return false

  // Only catch the darker checker squares
  return r >= 30 && r <= 100
}

/**
 * Check if a pixel is a yellow background (like the mine trap image)
 */
function isYellowBackgroundPixel(r: number, g: number, b: number): boolean {
  // Yellow is high R, high G, low B
  return r > 200 && g > 180 && b < 100
}

/**
 * Check if a pixel is a dark/black background
 */
function isDarkBackgroundPixel(r: number, g: number, b: number): boolean {
  // Very dark pixels (near black)
  return r < 35 && g < 35 && b < 45
}

/**
 * Check if a pixel is a white or light gray background
 */
function isWhiteBackgroundPixel(r: number, g: number, b: number): boolean {
  // Pure white
  if (r > 240 && g > 240 && b > 240) return true
  
  // Light gray (common in image backgrounds)
  const isGray = Math.abs(r - g) < 15 && Math.abs(g - b) < 15 && Math.abs(r - b) < 15
  if (isGray && r > 200) return true
  
  // Cream/off-white (like inside the EMP icon) - high brightness, slightly warm
  // These are pixels where R, G, B are all high (>220) but may have slight color tint
  if (r > 220 && g > 215 && b > 200) return true
  
  return false
}

/**
 * Determine if a pixel should be made transparent based on background type
 */
function shouldMakeTransparent(r: number, g: number, b: number, bgType: BackgroundType): boolean {
  switch (bgType) {
    case 'checkered':
      return isCheckeredBackgroundPixel(r, g, b)
    case 'checkered-light':
      // Only remove light gray checkers (for props with gray content like rocks)
      return isLightCheckeredBackgroundPixel(r, g, b)
    case 'checkered-dark':
      // Only remove dark gray checkers (for props with light content like trees)
      return isDarkCheckeredBackgroundPixel(r, g, b)
    case 'yellow':
      return isYellowBackgroundPixel(r, g, b)
    case 'dark':
      return isDarkBackgroundPixel(r, g, b)
    case 'white':
      return isWhiteBackgroundPixel(r, g, b)
    case 'auto':
      // Try all background types
      return isCheckeredBackgroundPixel(r, g, b) || 
             isYellowBackgroundPixel(r, g, b) || 
             isDarkBackgroundPixel(r, g, b) ||
             isWhiteBackgroundPixel(r, g, b)
    case 'checkered-white':
      // Remove both checkered background AND white/cream interior (for EMP icon)
      return isCheckeredBackgroundPixel(r, g, b) || isWhiteBackgroundPixel(r, g, b)
    case 'dark-white':
      // Remove dark/black background AND white/light artifacts (for 2xp token)
      return isDarkBackgroundPixel(r, g, b) || isWhiteBackgroundPixel(r, g, b)
    case 'none':
      // No background removal
      return false
    default:
      return false
  }
}

/**
 * Remove background from an image based on background type
 * Returns a canvas with transparent background
 */
export function removeBackground(img: HTMLImageElement, bgType: BackgroundType = 'checkered'): HTMLCanvasElement {
  const canvas = document.createElement('canvas')
  canvas.width = img.width
  canvas.height = img.height
  const ctx = canvas.getContext('2d')!

  // Draw the image
  ctx.drawImage(img, 0, 0)

  // Process pixels
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
  const data = imageData.data

  for (let i = 0; i < data.length; i += 4) {
    const r = data[i]
    const g = data[i + 1]
    const b = data[i + 2]

    if (shouldMakeTransparent(r, g, b, bgType)) {
      // Make transparent
      data[i + 3] = 0
    }
  }

  ctx.putImageData(imageData, 0, 0)
  return canvas
}

/**
 * Remove checkered gray background from an image (legacy function)
 * Returns a canvas with transparent background
 */
export function removeCheckeredBackground(img: HTMLImageElement): HTMLCanvasElement {
  return removeBackground(img, 'checkered')
}

/**
 * Load an image and remove its background
 */
export function loadImageWithTransparency(src: string, bgType: BackgroundType = 'checkered'): Promise<HTMLCanvasElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.crossOrigin = 'anonymous'

    img.onload = () => {
      const canvas = removeBackground(img, bgType)
      resolve(canvas)
    }

    img.onerror = () => reject(new Error(`Failed to load image: ${src}`))
    img.src = src
  })
}

/**
 * Load an image without processing (for tiles/backgrounds that don't need transparency)
 */
export function loadImageRaw(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = () => reject(new Error(`Failed to load image: ${src}`))
    img.src = src
  })
}
