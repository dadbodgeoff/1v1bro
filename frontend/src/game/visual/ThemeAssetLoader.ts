/**
 * ThemeAssetLoader - Loads and validates theme assets
 * @module visual/ThemeAssetLoader
 */

import type { ThemeManifest, ValidationResult } from './types'

export class ThemeAssetLoader {
  private loadedThemes: Map<string, ThemeManifest> = new Map()
  private assetCache: Map<string, HTMLImageElement> = new Map()
  private placeholderTexture: HTMLCanvasElement | null = null

  async loadTheme(themeId: string): Promise<ThemeManifest> {
    if (this.loadedThemes.has(themeId)) {
      return this.loadedThemes.get(themeId)!
    }

    const manifestUrl = `/themes/${themeId}/manifest.json`
    const response = await fetch(manifestUrl)

    if (!response.ok) {
      throw new Error(`Failed to load theme manifest: ${themeId}`)
    }

    const manifest = await response.json()
    const validation = this.validateManifest(manifest)

    if (!validation.valid) {
      throw new Error(`Invalid theme manifest: ${validation.errors.join(', ')}`)
    }

    this.loadedThemes.set(themeId, manifest)
    return manifest
  }

  async loadAsset(
    themeId: string,
    assetType: string,
    filename: string
  ): Promise<HTMLImageElement> {
    const path = `/themes/${themeId}/${assetType}/${filename}`

    if (this.assetCache.has(path)) {
      return this.assetCache.get(path)!
    }

    try {
      const img = new Image()
      img.src = path
      await img.decode()

      // Validate dimensions for tiles
      if (assetType === 'tiles') {
        const validSizes = [80, 160, 320]
        if (!validSizes.includes(img.width) || !validSizes.includes(img.height)) {
          console.warn(`Invalid tile dimensions: ${img.width}x${img.height}`)
          return this.getPlaceholderAsImage()
        }
      }

      this.assetCache.set(path, img)
      return img
    } catch (error) {
      console.warn(`Failed to load asset: ${path}`, error)
      return this.getPlaceholderAsImage()
    }
  }

  validateManifest(manifest: unknown): ValidationResult {
    const errors: string[] = []

    if (!manifest || typeof manifest !== 'object') {
      return { valid: false, errors: ['Manifest must be an object'] }
    }

    const m = manifest as Record<string, unknown>

    // Required fields
    if (!m.id || typeof m.id !== 'string') {
      errors.push('Missing or invalid field: id')
    }
    if (!m.name || typeof m.name !== 'string') {
      errors.push('Missing or invalid field: name')
    }
    if (!m.palette || typeof m.palette !== 'object') {
      errors.push('Missing or invalid field: palette')
    } else {
      const palette = m.palette as Record<string, unknown>
      const requiredColors = ['primary', 'secondary', 'background', 'platform', 'hazard']
      for (const color of requiredColors) {
        if (!palette[color] || typeof palette[color] !== 'string') {
          errors.push(`Missing palette color: ${color}`)
        }
      }
    }

    return { valid: errors.length === 0, errors }
  }

  getPlaceholderTexture(): HTMLCanvasElement {
    if (this.placeholderTexture) {
      return this.placeholderTexture
    }

    // Create magenta/black checkerboard
    const canvas = document.createElement('canvas')
    canvas.width = 80
    canvas.height = 80
    const ctx = canvas.getContext('2d')!

    const squareSize = 8
    for (let y = 0; y < 80; y += squareSize) {
      for (let x = 0; x < 80; x += squareSize) {
        const isEven = ((x + y) / squareSize) % 2 === 0
        ctx.fillStyle = isEven ? '#ff00ff' : '#000000'
        ctx.fillRect(x, y, squareSize, squareSize)
      }
    }

    this.placeholderTexture = canvas
    return canvas
  }

  private getPlaceholderAsImage(): HTMLImageElement {
    const canvas = this.getPlaceholderTexture()
    const img = new Image()
    img.src = canvas.toDataURL()
    return img
  }

  /**
   * Check if a theme is loaded
   */
  isThemeLoaded(themeId: string): boolean {
    return this.loadedThemes.has(themeId)
  }

  /**
   * Get a loaded theme
   */
  getTheme(themeId: string): ThemeManifest | undefined {
    return this.loadedThemes.get(themeId)
  }

  /**
   * Clear all caches
   */
  clearCache(): void {
    this.loadedThemes.clear()
    this.assetCache.clear()
    this.placeholderTexture = null
  }

  /**
   * Validate tile dimensions
   */
  isValidTileDimension(width: number, height: number): boolean {
    const validSizes = [80, 160, 320]
    return validSizes.includes(width) && validSizes.includes(height)
  }
}
