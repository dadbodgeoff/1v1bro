/**
 * SkinPreview3D Component
 * 
 * A mini Three.js scene for previewing 3D character skins in the shop.
 * Features:
 * - 360° rotation via drag (OrbitControls)
 * - Auto-rotate when idle
 * - Nice lighting to showcase the skin
 * - Isolated from the main game engine
 */

import { useEffect, useRef, useCallback } from 'react'
import * as THREE from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { cn } from '@/utils/helpers'

interface SkinPreview3DProps {
  /** URL to the GLB model file */
  modelUrl: string
  /** Width of the preview canvas */
  width?: number
  /** Height of the preview canvas */
  height?: number
  /** Auto-rotate when not interacting */
  autoRotate?: boolean
  /** Auto-rotate speed (degrees per second) */
  autoRotateSpeed?: number
  /** Background color (hex) */
  backgroundColor?: number
  /** Additional CSS classes */
  className?: string
  /** Callback when model finishes loading */
  onLoad?: () => void
  /** Callback on load error */
  onError?: (error: Error) => void
}

export function SkinPreview3D({
  modelUrl,
  width = 300,
  height = 400,
  autoRotate = true,
  autoRotateSpeed = 30,
  backgroundColor = 0x1a1a2e,
  className,
  onLoad,
  onError,
}: SkinPreview3DProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const sceneRef = useRef<{
    renderer: THREE.WebGLRenderer
    scene: THREE.Scene
    camera: THREE.PerspectiveCamera
    controls: OrbitControls
    model: THREE.Group | null
    animationId: number | null
  } | null>(null)

  // Cleanup function
  const cleanup = useCallback(() => {
    const refs = sceneRef.current
    if (!refs) return

    if (refs.animationId !== null) {
      cancelAnimationFrame(refs.animationId)
    }
    refs.controls.dispose()
    refs.renderer.dispose()
    
    // Dispose of model geometries and materials
    if (refs.model) {
      refs.model.traverse((child) => {
        if (child instanceof THREE.Mesh) {
          child.geometry?.dispose()
          if (Array.isArray(child.material)) {
            child.material.forEach(m => m.dispose())
          } else {
            child.material?.dispose()
          }
        }
      })
    }
    
    sceneRef.current = null
  }, [])

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    // Cleanup previous instance
    cleanup()

    // Create renderer
    const renderer = new THREE.WebGLRenderer({ 
      antialias: true, 
      alpha: true,
      powerPreference: 'low-power' // Optimize for preview, not gaming
    })
    renderer.setSize(width, height)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.setClearColor(backgroundColor)
    renderer.outputColorSpace = THREE.SRGBColorSpace
    renderer.toneMapping = THREE.ACESFilmicToneMapping
    renderer.toneMappingExposure = 1.2
    container.appendChild(renderer.domElement)

    // Create scene
    const scene = new THREE.Scene()

    // Create camera
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100)
    camera.position.set(0, 1.5, 4)

    // Create orbit controls
    const controls = new OrbitControls(camera, renderer.domElement)
    controls.enableDamping = true
    controls.dampingFactor = 0.05
    controls.enableZoom = true
    controls.minDistance = 2
    controls.maxDistance = 8
    controls.enablePan = false
    controls.autoRotate = autoRotate
    controls.autoRotateSpeed = autoRotateSpeed / 30 // Convert to Three.js speed
    controls.target.set(0, 1, 0) // Look at character center
    controls.update()

    // Add lighting
    setupLighting(scene)

    // Add subtle ground plane
    const groundGeometry = new THREE.CircleGeometry(2, 32)
    const groundMaterial = new THREE.MeshStandardMaterial({
      color: 0x2a2a3e,
      roughness: 0.8,
      metalness: 0.2,
    })
    const ground = new THREE.Mesh(groundGeometry, groundMaterial)
    ground.rotation.x = -Math.PI / 2
    ground.position.y = 0
    ground.receiveShadow = true
    scene.add(ground)

    // Store refs
    sceneRef.current = {
      renderer,
      scene,
      camera,
      controls,
      model: null,
      animationId: null,
    }

    // Load model
    loadModel(modelUrl, scene, sceneRef, onLoad, onError)

    // Animation loop
    const animate = () => {
      if (!sceneRef.current) return
      
      sceneRef.current.animationId = requestAnimationFrame(animate)
      sceneRef.current.controls.update()
      sceneRef.current.renderer.render(
        sceneRef.current.scene,
        sceneRef.current.camera
      )
    }
    animate()

    return cleanup
  }, [modelUrl, width, height, autoRotate, autoRotateSpeed, backgroundColor, cleanup, onLoad, onError])

  return (
    <div 
      ref={containerRef} 
      className={cn('relative overflow-hidden rounded-lg', className)}
      style={{ width, height }}
    />
  )
}

/**
 * Setup scene lighting for skin showcase
 */
function setupLighting(scene: THREE.Scene) {
  // Ambient light for base illumination
  const ambient = new THREE.AmbientLight(0xffffff, 0.6)
  scene.add(ambient)

  // Key light (main light from front-right)
  const keyLight = new THREE.DirectionalLight(0xffffff, 1.0)
  keyLight.position.set(3, 4, 3)
  keyLight.castShadow = true
  scene.add(keyLight)

  // Fill light (softer light from left)
  const fillLight = new THREE.DirectionalLight(0x8888ff, 0.4)
  fillLight.position.set(-3, 2, 2)
  scene.add(fillLight)

  // Rim light (back light for edge definition)
  const rimLight = new THREE.DirectionalLight(0xffffff, 0.5)
  rimLight.position.set(0, 3, -3)
  scene.add(rimLight)

  // Ground bounce light
  const bounceLight = new THREE.DirectionalLight(0x4444ff, 0.2)
  bounceLight.position.set(0, -2, 0)
  scene.add(bounceLight)
}

/**
 * Load GLB model into scene
 */
async function loadModel(
  url: string,
  scene: THREE.Scene,
  sceneRef: React.MutableRefObject<{
    renderer: THREE.WebGLRenderer
    scene: THREE.Scene
    camera: THREE.PerspectiveCamera
    controls: OrbitControls
    model: THREE.Group | null
    animationId: number | null
  } | null>,
  onLoad?: () => void,
  onError?: (error: Error) => void
) {
  // Setup loaders
  const dracoLoader = new DRACOLoader()
  dracoLoader.setDecoderPath('https://www.gstatic.com/draco/versioned/decoders/1.5.6/')
  dracoLoader.setDecoderConfig({ type: 'js' })

  const loader = new GLTFLoader()
  loader.setDRACOLoader(dracoLoader)

  try {
    const gltf = await new Promise<THREE.Group>((resolve, reject) => {
      loader.load(
        url,
        (gltf) => resolve(gltf.scene),
        undefined,
        (error) => reject(error)
      )
    })

    if (!sceneRef.current) return // Component unmounted

    const model = gltf

    // Center and scale model
    const box = new THREE.Box3().setFromObject(model)
    const size = box.getSize(new THREE.Vector3())
    const center = box.getCenter(new THREE.Vector3())

    // Scale to fit nicely in view (target ~2 units tall)
    const targetHeight = 2
    const scale = targetHeight / size.y
    model.scale.setScalar(scale)

    // Center horizontally, place feet on ground
    model.position.x = -center.x * scale
    model.position.y = -box.min.y * scale
    model.position.z = -center.z * scale

    // Face camera
    model.rotation.y = Math.PI / 4

    scene.add(model)
    sceneRef.current.model = model

    // Update controls target to model center
    sceneRef.current.controls.target.set(0, targetHeight / 2, 0)
    sceneRef.current.controls.update()

    onLoad?.()
  } catch (error) {
    console.error('[SkinPreview3D] Failed to load model:', error)
    onError?.(error instanceof Error ? error : new Error('Failed to load model'))
  }
}

export default SkinPreview3D
