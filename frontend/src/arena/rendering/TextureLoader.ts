/**
 * TextureLoader - Enterprise texture loading with caching and optimization
 * 
 * Features:
 * - Texture caching
 * - Automatic mipmap generation
 * - Anisotropic filtering
 * - Procedural texture generation for prototyping
 */

import * as THREE from 'three'

// Texture cache to avoid duplicate loads
const textureCache = new Map<string, THREE.Texture>()

export interface TextureConfig {
  repeat?: [number, number]
  anisotropy?: number
  encoding?: THREE.ColorSpace
}

/**
 * Load a texture with caching and optimization
 */
export async function loadTexture(
  url: string,
  config: TextureConfig = {}
): Promise<THREE.Texture> {
  const cacheKey = `${url}-${JSON.stringify(config)}`
  
  if (textureCache.has(cacheKey)) {
    return textureCache.get(cacheKey)!
  }
  
  const loader = new THREE.TextureLoader()
  const texture = await loader.loadAsync(url)
  
  // Apply settings
  texture.wrapS = THREE.RepeatWrapping
  texture.wrapT = THREE.RepeatWrapping
  
  if (config.repeat) {
    texture.repeat.set(config.repeat[0], config.repeat[1])
  }
  
  texture.anisotropy = config.anisotropy ?? 16
  texture.colorSpace = config.encoding ?? THREE.SRGBColorSpace
  texture.generateMipmaps = true
  texture.minFilter = THREE.LinearMipmapLinearFilter
  texture.magFilter = THREE.LinearFilter
  
  textureCache.set(cacheKey, texture)
  return texture
}

/**
 * Generate a procedural terrazzo texture
 * Used when no external texture is available
 */
export function generateTerrazzoTexture(size: number = 512): THREE.CanvasTexture {
  const canvas = document.createElement('canvas')
  canvas.width = size
  canvas.height = size
  const ctx = canvas.getContext('2d')!
  
  // Base color - warm cream
  ctx.fillStyle = '#d4cfc4'
  ctx.fillRect(0, 0, size, size)
  
  // Add noise for concrete base
  const imageData = ctx.getImageData(0, 0, size, size)
  for (let i = 0; i < imageData.data.length; i += 4) {
    const noise = (Math.random() - 0.5) * 15
    imageData.data[i] += noise
    imageData.data[i + 1] += noise
    imageData.data[i + 2] += noise
  }
  ctx.putImageData(imageData, 0, 0)
  
  // Add stone chips
  const chipColors = [
    '#8a8580', // Gray
    '#a09890', // Light gray
    '#706560', // Dark gray
    '#c4b8a8', // Beige
    '#5a5550', // Charcoal
    '#b8a898', // Tan
  ]
  
  for (let i = 0; i < 800; i++) {
    const x = Math.random() * size
    const y = Math.random() * size
    const chipSize = 2 + Math.random() * 8
    const color = chipColors[Math.floor(Math.random() * chipColors.length)]
    
    ctx.fillStyle = color
    ctx.beginPath()
    
    // Irregular polygon for chip shape
    const sides = 4 + Math.floor(Math.random() * 4)
    for (let j = 0; j < sides; j++) {
      const angle = (j / sides) * Math.PI * 2 + Math.random() * 0.5
      const radius = chipSize * (0.5 + Math.random() * 0.5)
      const px = x + Math.cos(angle) * radius
      const py = y + Math.sin(angle) * radius
      if (j === 0) ctx.moveTo(px, py)
      else ctx.lineTo(px, py)
    }
    ctx.closePath()
    ctx.fill()
  }
  
  // Add subtle polish/reflection spots
  ctx.globalAlpha = 0.1
  for (let i = 0; i < 50; i++) {
    const x = Math.random() * size
    const y = Math.random() * size
    const radius = 10 + Math.random() * 30
    
    const gradient = ctx.createRadialGradient(x, y, 0, x, y, radius)
    gradient.addColorStop(0, '#ffffff')
    gradient.addColorStop(1, 'transparent')
    
    ctx.fillStyle = gradient
    ctx.fillRect(x - radius, y - radius, radius * 2, radius * 2)
  }
  ctx.globalAlpha = 1
  
  const texture = new THREE.CanvasTexture(canvas)
  texture.wrapS = THREE.RepeatWrapping
  texture.wrapT = THREE.RepeatWrapping
  texture.anisotropy = 16
  texture.generateMipmaps = true
  
  return texture
}

/**
 * Generate a procedural concrete/plaster texture for walls
 */
export function generateWallTexture(size: number = 512): THREE.CanvasTexture {
  const canvas = document.createElement('canvas')
  canvas.width = size
  canvas.height = size
  const ctx = canvas.getContext('2d')!
  
  // Base color - aged plaster
  ctx.fillStyle = '#8a8580'
  ctx.fillRect(0, 0, size, size)
  
  // Add noise
  const imageData = ctx.getImageData(0, 0, size, size)
  for (let i = 0; i < imageData.data.length; i += 4) {
    const noise = (Math.random() - 0.5) * 25
    imageData.data[i] += noise
    imageData.data[i + 1] += noise
    imageData.data[i + 2] += noise
  }
  ctx.putImageData(imageData, 0, 0)
  
  // Add subtle cracks
  ctx.strokeStyle = 'rgba(60, 55, 50, 0.3)'
  ctx.lineWidth = 1
  for (let i = 0; i < 10; i++) {
    ctx.beginPath()
    let x = Math.random() * size
    let y = Math.random() * size
    ctx.moveTo(x, y)
    
    for (let j = 0; j < 5; j++) {
      x += (Math.random() - 0.5) * 40
      y += (Math.random() - 0.5) * 40
      ctx.lineTo(x, y)
    }
    ctx.stroke()
  }
  
  // Add stains
  ctx.globalAlpha = 0.1
  for (let i = 0; i < 5; i++) {
    const x = Math.random() * size
    const y = Math.random() * size
    const radius = 30 + Math.random() * 60
    
    const gradient = ctx.createRadialGradient(x, y, 0, x, y, radius)
    gradient.addColorStop(0, '#4a4540')
    gradient.addColorStop(1, 'transparent')
    
    ctx.fillStyle = gradient
    ctx.fillRect(x - radius, y - radius, radius * 2, radius * 2)
  }
  ctx.globalAlpha = 1
  
  const texture = new THREE.CanvasTexture(canvas)
  texture.wrapS = THREE.RepeatWrapping
  texture.wrapT = THREE.RepeatWrapping
  texture.anisotropy = 16
  texture.generateMipmaps = true
  
  return texture
}

/**
 * Generate a normal map from a height/bump texture
 */
export function generateNormalMap(
  sourceTexture: THREE.CanvasTexture,
  strength: number = 1
): THREE.CanvasTexture {
  const canvas = sourceTexture.image as HTMLCanvasElement
  const size = canvas.width
  
  const normalCanvas = document.createElement('canvas')
  normalCanvas.width = size
  normalCanvas.height = size
  const ctx = normalCanvas.getContext('2d')!
  
  const sourceCtx = canvas.getContext('2d')!
  const sourceData = sourceCtx.getImageData(0, 0, size, size)
  const normalData = ctx.createImageData(size, size)
  
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const idx = (y * size + x) * 4
      
      // Sample neighboring pixels
      const left = ((y * size + Math.max(0, x - 1)) * 4)
      const right = ((y * size + Math.min(size - 1, x + 1)) * 4)
      const up = ((Math.max(0, y - 1) * size + x) * 4)
      const down = ((Math.min(size - 1, y + 1) * size + x) * 4)
      
      // Calculate height differences
      const dX = (sourceData.data[right] - sourceData.data[left]) / 255 * strength
      const dY = (sourceData.data[down] - sourceData.data[up]) / 255 * strength
      
      // Convert to normal
      const normal = new THREE.Vector3(-dX, -dY, 1).normalize()
      
      // Encode to RGB
      normalData.data[idx] = (normal.x * 0.5 + 0.5) * 255
      normalData.data[idx + 1] = (normal.y * 0.5 + 0.5) * 255
      normalData.data[idx + 2] = (normal.z * 0.5 + 0.5) * 255
      normalData.data[idx + 3] = 255
    }
  }
  
  ctx.putImageData(normalData, 0, 0)
  
  const texture = new THREE.CanvasTexture(normalCanvas)
  texture.wrapS = THREE.RepeatWrapping
  texture.wrapT = THREE.RepeatWrapping
  texture.anisotropy = 16
  
  return texture
}

/**
 * Clear texture cache
 */
export function clearTextureCache(): void {
  textureCache.forEach(texture => texture.dispose())
  textureCache.clear()
}
