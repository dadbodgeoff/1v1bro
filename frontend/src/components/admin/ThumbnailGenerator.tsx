/**
 * ThumbnailGenerator - Renders 3D GLB models to static PNG thumbnails
 * 
 * This admin tool allows you to:
 * 1. Load any GLB model
 * 2. Position the camera for the perfect shot
 * 3. Export as PNG with transparent background
 * 4. Upload directly to Supabase storage
 * 
 * Usage: Navigate to /admin/thumbnail-generator
 */

import { useState, useRef, useCallback, useEffect } from 'react'
import * as THREE from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { Button } from '@/components/ui/Button'

interface SkinToRender {
  name: string
  modelUrl: string
  thumbnailPath: string
}

// Build URLs from environment
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || ''
const buildStorageUrl = (path: string) =>
  `${SUPABASE_URL}/storage/v1/object/public/cosmetics/${path}`

// Skins that need thumbnails
// Local files are in repo root, served via Vite at /assets/
// Remote files are in Supabase storage
const SKINS_TO_RENDER: SkinToRender[] = [
  {
    name: 'Nova Blaze',
    // Solar Flare skin - use optimized version
    modelUrl: '/solarflarerunner-optimized.glb',
    thumbnailPath: 'thumbnails/nova-blaze.png',
  },
  {
    name: 'Helios Prime',
    // Solar Flare Guy skin - use optimized version
    modelUrl: '/solarflareGuyrun-optimized.glb',
    thumbnailPath: 'thumbnails/helios-prime.png',
  },
  {
    name: 'Phantom Striker',
    // Animie skin - use optimized version
    modelUrl: '/animierunner-optimized.glb',
    thumbnailPath: 'thumbnails/phantom-striker.png',
  },
]

// Also provide Supabase URLs as fallback/alternative
const REMOTE_SKINS: SkinToRender[] = [
  {
    name: 'Nova Blaze (Remote)',
    modelUrl: buildStorageUrl('3d/solarflare-run.glb'),
    thumbnailPath: 'thumbnails/nova-blaze.png',
  },
  {
    name: 'Helios Prime (Remote)',
    modelUrl: buildStorageUrl('3d/solarflareguy-run.glb'),
    thumbnailPath: 'thumbnails/helios-prime.png',
  },
  {
    name: 'Phantom Striker (Remote)',
    modelUrl: buildStorageUrl('3d/animie-run.glb'),
    thumbnailPath: 'thumbnails/phantom-striker.png',
  },
]

export function ThumbnailGenerator() {
  const containerRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const sceneRef = useRef<{
    renderer: THREE.WebGLRenderer
    scene: THREE.Scene
    camera: THREE.PerspectiveCamera
    controls: OrbitControls
    model: THREE.Group | null
  } | null>(null)

  const [currentSkin, setCurrentSkin] = useState<SkinToRender | null>(null)
  const [currentFileName, setCurrentFileName] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [customUrl, setCustomUrl] = useState('')
  const [isDragging, setIsDragging] = useState(false)

  // Camera presets for different angles
  const [cameraPreset, setCameraPreset] = useState<'front' | 'hero' | 'action' | 'custom'>('hero')

  const CAMERA_PRESETS = {
    front: { x: 0, y: 1.2, z: 3.5, targetY: 1 },
    hero: { x: 1.5, y: 1.5, z: 3, targetY: 1 },
    action: { x: -1, y: 0.8, z: 3.5, targetY: 0.8 },
    custom: { x: 0, y: 1.2, z: 3.5, targetY: 1 },
  }

  // Initialize Three.js scene
  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    // Create renderer with alpha for transparent background
    const renderer = new THREE.WebGLRenderer({ 
      antialias: true, 
      alpha: true,
      preserveDrawingBuffer: true, // Required for toDataURL
    })
    renderer.setSize(512, 512)
    renderer.setPixelRatio(2) // High DPI for crisp thumbnails
    renderer.setClearColor(0x000000, 0) // Transparent background
    renderer.outputColorSpace = THREE.SRGBColorSpace
    renderer.toneMapping = THREE.ACESFilmicToneMapping
    renderer.toneMappingExposure = 1.3
    container.appendChild(renderer.domElement)

    // Create scene
    const scene = new THREE.Scene()

    // Create camera
    const camera = new THREE.PerspectiveCamera(40, 1, 0.1, 100)
    camera.position.set(1.5, 1.5, 3)

    // Create orbit controls
    const controls = new OrbitControls(camera, renderer.domElement)
    controls.enableDamping = true
    controls.dampingFactor = 0.05
    controls.target.set(0, 1, 0)
    controls.update()

    // Add lighting optimized for thumbnails
    setupLighting(scene)

    // Store refs
    sceneRef.current = {
      renderer,
      scene,
      camera,
      controls,
      model: null,
    }

    // Animation loop
    let animationId: number
    const animate = () => {
      animationId = requestAnimationFrame(animate)
      controls.update()
      renderer.render(scene, camera)
    }
    animate()

    return () => {
      cancelAnimationFrame(animationId)
      controls.dispose()
      renderer.dispose()
      container.removeChild(renderer.domElement)
    }
  }, [])

  // Apply camera preset
  useEffect(() => {
    if (!sceneRef.current) return
    const { camera, controls } = sceneRef.current
    const preset = CAMERA_PRESETS[cameraPreset]
    
    camera.position.set(preset.x, preset.y, preset.z)
    controls.target.set(0, preset.targetY, 0)
    controls.update()
  }, [cameraPreset])

  // Load model from File object (drag & drop or file picker)
  const loadModelFromFile = useCallback(async (file: File) => {
    if (!sceneRef.current) return
    const { scene } = sceneRef.current

    setIsLoading(true)
    setError(null)
    setCurrentSkin(null)
    setCurrentFileName(file.name)

    // Remove existing model
    if (sceneRef.current.model) {
      scene.remove(sceneRef.current.model)
      sceneRef.current.model.traverse((child) => {
        if (child instanceof THREE.Mesh) {
          child.geometry?.dispose()
          if (Array.isArray(child.material)) {
            child.material.forEach(m => m.dispose())
          } else {
            child.material?.dispose()
          }
        }
      })
      sceneRef.current.model = null
    }

    try {
      const dracoLoader = new DRACOLoader()
      dracoLoader.setDecoderPath('https://www.gstatic.com/draco/versioned/decoders/1.5.6/')
      
      const loader = new GLTFLoader()
      loader.setDRACOLoader(dracoLoader)

      // Create object URL from file
      const objectUrl = URL.createObjectURL(file)

      const gltf = await new Promise<THREE.Group>((resolve, reject) => {
        loader.load(objectUrl, (gltf) => resolve(gltf.scene), undefined, reject)
      })

      // Clean up object URL
      URL.revokeObjectURL(objectUrl)

      const model = gltf

      // Center and scale model
      const box = new THREE.Box3().setFromObject(model)
      const size = box.getSize(new THREE.Vector3())
      const center = box.getCenter(new THREE.Vector3())

      const targetHeight = 2
      const scale = targetHeight / size.y
      model.scale.setScalar(scale)

      model.position.x = -center.x * scale
      model.position.y = -box.min.y * scale
      model.position.z = -center.z * scale
      model.rotation.y = Math.PI / 6

      scene.add(model)
      sceneRef.current.model = model

      setIsLoading(false)
    } catch (err) {
      console.error('Failed to load model:', err)
      setError(err instanceof Error ? err.message : 'Failed to load model')
      setIsLoading(false)
    }
  }, [])

  // Handle file drop
  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    
    const file = e.dataTransfer.files[0]
    if (file && (file.name.endsWith('.glb') || file.name.endsWith('.gltf'))) {
      loadModelFromFile(file)
    } else {
      setError('Please drop a .glb or .gltf file')
    }
  }, [loadModelFromFile])

  // Handle file input change
  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      loadModelFromFile(file)
    }
  }, [loadModelFromFile])

  // Load a model from URL
  const loadModel = useCallback(async (url: string) => {
    if (!sceneRef.current) return
    const { scene } = sceneRef.current

    setIsLoading(true)
    setError(null)

    // Remove existing model
    if (sceneRef.current.model) {
      scene.remove(sceneRef.current.model)
      sceneRef.current.model.traverse((child) => {
        if (child instanceof THREE.Mesh) {
          child.geometry?.dispose()
          if (Array.isArray(child.material)) {
            child.material.forEach(m => m.dispose())
          } else {
            child.material?.dispose()
          }
        }
      })
      sceneRef.current.model = null
    }

    try {
      const dracoLoader = new DRACOLoader()
      dracoLoader.setDecoderPath('https://www.gstatic.com/draco/versioned/decoders/1.5.6/')
      
      const loader = new GLTFLoader()
      loader.setDRACOLoader(dracoLoader)

      const gltf = await new Promise<THREE.Group>((resolve, reject) => {
        loader.load(url, (gltf) => resolve(gltf.scene), undefined, reject)
      })

      const model = gltf

      // Center and scale model
      const box = new THREE.Box3().setFromObject(model)
      const size = box.getSize(new THREE.Vector3())
      const center = box.getCenter(new THREE.Vector3())

      // Scale to fit nicely (target ~2 units tall)
      const targetHeight = 2
      const scale = targetHeight / size.y
      model.scale.setScalar(scale)

      // Center horizontally, place feet on ground
      model.position.x = -center.x * scale
      model.position.y = -box.min.y * scale
      model.position.z = -center.z * scale

      // Face camera slightly
      model.rotation.y = Math.PI / 6

      scene.add(model)
      sceneRef.current.model = model

      setIsLoading(false)
    } catch (err) {
      console.error('Failed to load model:', err)
      setError(err instanceof Error ? err.message : 'Failed to load model')
      setIsLoading(false)
    }
  }, [])

  // Export current view as PNG
  const exportPNG = useCallback(() => {
    if (!sceneRef.current) return null
    
    const { renderer, scene, camera } = sceneRef.current
    
    // Render one frame
    renderer.render(scene, camera)
    
    // Get data URL
    return renderer.domElement.toDataURL('image/png')
  }, [])

  // Download PNG
  const downloadPNG = useCallback(() => {
    const dataUrl = exportPNG()
    if (!dataUrl) return

    const link = document.createElement('a')
    // Use skin name, filename, or default
    const baseName = currentSkin 
      ? currentSkin.name.toLowerCase().replace(/\s+/g, '-')
      : currentFileName
        ? currentFileName.replace(/\.(glb|gltf)$/i, '')
        : 'thumbnail'
    link.download = `${baseName}-thumbnail.png`
    link.href = dataUrl
    link.click()
  }, [exportPNG, currentSkin, currentFileName])

  // Copy data URL to clipboard
  const copyDataUrl = useCallback(async () => {
    const dataUrl = exportPNG()
    if (!dataUrl) return

    try {
      await navigator.clipboard.writeText(dataUrl)
      alert('Data URL copied to clipboard!')
    } catch {
      // Fallback: show in console
      console.log('Thumbnail data URL:', dataUrl)
      alert('Check console for data URL')
    }
  }, [exportPNG])

  return (
    <div className="min-h-screen bg-[var(--color-bg-base)] p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold text-white mb-2">3D Thumbnail Generator</h1>
        <p className="text-[var(--color-text-muted)] mb-8">
          Generate static PNG thumbnails from 3D GLB models for shop display
        </p>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Preview Panel */}
          <div className="bg-[var(--color-bg-card)] rounded-xl p-6 border border-white/10">
            <h2 className="text-lg font-semibold text-white mb-4">Preview</h2>
            
            {/* Canvas container with checkerboard background to show transparency */}
            <div 
              ref={containerRef}
              className="relative w-[512px] h-[512px] mx-auto rounded-lg overflow-hidden"
              style={{
                backgroundImage: `
                  linear-gradient(45deg, #333 25%, transparent 25%),
                  linear-gradient(-45deg, #333 25%, transparent 25%),
                  linear-gradient(45deg, transparent 75%, #333 75%),
                  linear-gradient(-45deg, transparent 75%, #333 75%)
                `,
                backgroundSize: '20px 20px',
                backgroundPosition: '0 0, 0 10px, 10px -10px, -10px 0px',
                backgroundColor: '#222',
              }}
            />

            {isLoading && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                <div className="w-8 h-8 border-2 border-[#6366f1] border-t-transparent rounded-full animate-spin" />
              </div>
            )}

            {error && (
              <div className="mt-4 p-3 bg-red-500/20 border border-red-500/30 rounded-lg text-red-400 text-sm">
                {error}
              </div>
            )}

            {/* Camera Presets */}
            <div className="mt-4">
              <label className="text-sm text-[var(--color-text-muted)] mb-2 block">Camera Angle</label>
              <div className="flex gap-2">
                {(['front', 'hero', 'action'] as const).map((preset) => (
                  <button
                    key={preset}
                    onClick={() => setCameraPreset(preset)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      cameraPreset === preset
                        ? 'bg-[#6366f1] text-white'
                        : 'bg-white/5 text-[var(--color-text-secondary)] hover:bg-white/10'
                    }`}
                  >
                    {preset.charAt(0).toUpperCase() + preset.slice(1)}
                  </button>
                ))}
              </div>
              <p className="text-xs text-[var(--color-text-muted)] mt-2">
                Drag to rotate • Scroll to zoom • Right-click to pan
              </p>
            </div>

            {/* Export Buttons */}
            <div className="mt-6 flex gap-3">
              <Button onClick={downloadPNG} disabled={!sceneRef.current?.model}>
                Download PNG
              </Button>
              <Button variant="secondary" onClick={copyDataUrl} disabled={!sceneRef.current?.model}>
                Copy Data URL
              </Button>
            </div>
          </div>

          {/* Controls Panel */}
          <div className="space-y-6">
            {/* File Upload / Drag & Drop */}
            <div 
              className={`bg-[var(--color-bg-card)] rounded-xl p-6 border-2 border-dashed transition-colors ${
                isDragging 
                  ? 'border-[#6366f1] bg-[#6366f1]/10' 
                  : 'border-white/20 hover:border-white/40'
              }`}
              onDragOver={(e) => { e.preventDefault(); setIsDragging(true) }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={handleDrop}
            >
              <div className="text-center">
                <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-[#6366f1]/20 flex items-center justify-center">
                  <svg className="w-6 h-6 text-[#6366f1]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                </div>
                <h2 className="text-lg font-semibold text-white mb-1">Drop GLB File Here</h2>
                <p className="text-sm text-[var(--color-text-muted)] mb-4">
                  or click to browse
                </p>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".glb,.gltf"
                  onChange={handleFileSelect}
                  className="hidden"
                />
                <Button 
                  variant="secondary" 
                  onClick={() => fileInputRef.current?.click()}
                >
                  Choose File
                </Button>
                {currentFileName && (
                  <p className="mt-3 text-sm text-green-400">
                    ✓ Loaded: {currentFileName}
                  </p>
                )}
              </div>
            </div>

            {/* Local Skins (from repo) */}
            <div className="bg-[var(--color-bg-card)] rounded-xl p-6 border border-white/10">
              <h2 className="text-lg font-semibold text-white mb-2">Local Files (Repo)</h2>
              <p className="text-xs text-[var(--color-text-muted)] mb-4">GLB files from your project root</p>
              <div className="space-y-3">
                {SKINS_TO_RENDER.map((skin) => (
                  <button
                    key={skin.name}
                    onClick={() => {
                      setCurrentSkin(skin)
                      loadModel(skin.modelUrl)
                    }}
                    className={`w-full p-4 rounded-lg text-left transition-colors ${
                      currentSkin?.name === skin.name
                        ? 'bg-[#6366f1]/20 border-2 border-[#6366f1]'
                        : 'bg-white/5 border-2 border-transparent hover:bg-white/10'
                    }`}
                  >
                    <div className="font-medium text-white">{skin.name}</div>
                    <div className="text-xs text-green-400 mt-1 truncate">
                      📁 {skin.modelUrl}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Remote Skins (from Supabase) */}
            <div className="bg-[var(--color-bg-card)] rounded-xl p-6 border border-white/10">
              <h2 className="text-lg font-semibold text-white mb-2">Remote Files (Supabase)</h2>
              <p className="text-xs text-[var(--color-text-muted)] mb-4">GLB files from Supabase storage</p>
              <div className="space-y-3">
                {REMOTE_SKINS.map((skin) => (
                  <button
                    key={skin.name}
                    onClick={() => {
                      setCurrentSkin(skin)
                      loadModel(skin.modelUrl)
                    }}
                    className={`w-full p-4 rounded-lg text-left transition-colors ${
                      currentSkin?.name === skin.name
                        ? 'bg-[#6366f1]/20 border-2 border-[#6366f1]'
                        : 'bg-white/5 border-2 border-transparent hover:bg-white/10'
                    }`}
                  >
                    <div className="font-medium text-white">{skin.name}</div>
                    <div className="text-xs text-blue-400 mt-1 truncate">
                      ☁️ Supabase Storage
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Custom URL */}
            <div className="bg-[var(--color-bg-card)] rounded-xl p-6 border border-white/10">
              <h2 className="text-lg font-semibold text-white mb-4">Custom Model URL</h2>
              <div className="flex gap-3">
                <input
                  type="text"
                  value={customUrl}
                  onChange={(e) => setCustomUrl(e.target.value)}
                  placeholder="https://... .glb"
                  className="flex-1 px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder:text-[var(--color-text-muted)]"
                />
                <Button 
                  onClick={() => {
                    setCurrentSkin(null)
                    loadModel(customUrl)
                  }}
                  disabled={!customUrl}
                >
                  Load
                </Button>
              </div>
            </div>

            {/* Instructions */}
            <div className="bg-[var(--color-bg-card)] rounded-xl p-6 border border-white/10">
              <h2 className="text-lg font-semibold text-white mb-4">Instructions</h2>
              <ol className="space-y-3 text-sm text-[var(--color-text-secondary)]">
                <li className="flex gap-3">
                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-[#6366f1]/20 text-[#6366f1] flex items-center justify-center text-xs font-bold">1</span>
                  <span>Select a skin from the list or enter a custom GLB URL</span>
                </li>
                <li className="flex gap-3">
                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-[#6366f1]/20 text-[#6366f1] flex items-center justify-center text-xs font-bold">2</span>
                  <span>Adjust the camera angle using presets or manual controls</span>
                </li>
                <li className="flex gap-3">
                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-[#6366f1]/20 text-[#6366f1] flex items-center justify-center text-xs font-bold">3</span>
                  <span>Click "Download PNG" to save the thumbnail</span>
                </li>
                <li className="flex gap-3">
                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-[#6366f1]/20 text-[#6366f1] flex items-center justify-center text-xs font-bold">4</span>
                  <span>Upload to Supabase storage under <code className="px-1 py-0.5 bg-white/10 rounded">cosmetics/thumbnails/</code></span>
                </li>
                <li className="flex gap-3">
                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-[#6366f1]/20 text-[#6366f1] flex items-center justify-center text-xs font-bold">5</span>
                  <span>Update the cosmetic's <code className="px-1 py-0.5 bg-white/10 rounded">shop_preview_url</code> to point to the PNG</span>
                </li>
              </ol>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

/**
 * Setup scene lighting optimized for thumbnail rendering
 */
function setupLighting(scene: THREE.Scene) {
  // Ambient for base illumination
  const ambient = new THREE.AmbientLight(0xffffff, 0.7)
  scene.add(ambient)

  // Key light (main light from front-right-top)
  const keyLight = new THREE.DirectionalLight(0xffffff, 1.2)
  keyLight.position.set(3, 5, 3)
  scene.add(keyLight)

  // Fill light (softer from left)
  const fillLight = new THREE.DirectionalLight(0x8888ff, 0.5)
  fillLight.position.set(-3, 2, 2)
  scene.add(fillLight)

  // Rim light (back light for edge definition)
  const rimLight = new THREE.DirectionalLight(0xffffff, 0.6)
  rimLight.position.set(0, 3, -3)
  scene.add(rimLight)

  // Bottom fill to reduce harsh shadows
  const bottomFill = new THREE.DirectionalLight(0x4444ff, 0.3)
  bottomFill.position.set(0, -2, 2)
  scene.add(bottomFill)
}

export default ThumbnailGenerator
