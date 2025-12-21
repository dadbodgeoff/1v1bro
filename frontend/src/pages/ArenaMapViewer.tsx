/**
 * ArenaMapViewer - Enterprise-grade 3D viewer for the Abandoned Terminal arena
 * 
 * Features:
 * - Post-processing (bloom, color grading, SMAA)
 * - Performance monitoring
 * - Procedural textures
 * - Environment mapping
 * - Keyboard controls for zoom and camera presets
 */

import { useEffect, useRef, useState, useCallback } from 'react'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { ArenaScene } from '@/arena'
import { ArenaRenderer } from '@/arena/rendering/ArenaRenderer'
import { MapLoader } from '@/arena/maps/MapLoader'
import type { LoadedMap } from '@/arena/maps/MapLoader'
import '@/arena/maps/definitions' // Register maps
import { BOT_HITBOX } from '@/arena/game/CharacterHitbox'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'

// Color map for different collider types
const COLLIDER_COLORS: Record<string, number> = {
  floor: 0x00ff00,      // Green
  wall: 0xff0000,       // Red
  boundary: 0xff00ff,   // Magenta
  track: 0x0000ff,      // Blue
  subway: 0xffff00,     // Yellow
  train: 0xff8800,      // Orange
  pillar: 0x00ffff,     // Cyan
  bench: 0x8800ff,      // Purple
}

function getColliderColor(id: string): number {
  for (const [key, color] of Object.entries(COLLIDER_COLORS)) {
    if (id.toLowerCase().includes(key)) return color
  }
  return 0xffffff
}

interface PerformanceStats {
  fps: number
  drawCalls: number
  triangles: number
  memory: number // MB
  geometries: number
  textures: number
}

interface SceneObject {
  name: string
  type: string
  position: { x: number; y: number; z: number }
  size: { x: number; y: number; z: number }
  visible: boolean
}

// Collect all objects from scene for debug panel
function collectSceneObjects(scene: THREE.Scene): SceneObject[] {
  const objects: SceneObject[] = []
  
  scene.traverse((obj) => {
    if (obj instanceof THREE.Mesh || obj instanceof THREE.Group) {
      if (!obj.name || obj.name === '' || obj.name.startsWith('debug-')) return
      
      const box = new THREE.Box3().setFromObject(obj)
      const size = box.getSize(new THREE.Vector3())
      const worldPos = new THREE.Vector3()
      obj.getWorldPosition(worldPos)
      
      objects.push({
        name: obj.name,
        type: obj instanceof THREE.Mesh ? 'Mesh' : 'Group',
        position: { 
          x: Math.round(worldPos.x * 100) / 100, 
          y: Math.round(worldPos.y * 100) / 100, 
          z: Math.round(worldPos.z * 100) / 100 
        },
        size: {
          x: Math.round(size.x * 100) / 100,
          y: Math.round(size.y * 100) / 100,
          z: Math.round(size.z * 100) / 100,
        },
        visible: obj.visible,
      })
    }
  })
  
  return objects.sort((a, b) => a.name.localeCompare(b.name))
}

// Camera preset positions
const CAMERA_PRESETS = {
  overview: { pos: [0, 25, 35], target: [0, 0, 0] },
  trainSide: { pos: [15, 3, 0], target: [0, 1, 0] },
  trainFront: { pos: [0, 3, 20], target: [0, 1, 0] },
  platform: { pos: [-12, 2, 5], target: [0, 1, 0] },
  topDown: { pos: [0, 40, 0.1], target: [0, 0, 0] },
} as const

export default function ArenaMapViewer() {
  const containerRef = useRef<HTMLDivElement>(null)
  const controlsRef = useRef<OrbitControls | null>(null)
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null)
  const [stats, setStats] = useState<PerformanceStats>({ fps: 0, drawCalls: 0, triangles: 0, memory: 0, geometries: 0, textures: 0 })
  const [postProcessing, setPostProcessing] = useState(true)
  const [currentView, setCurrentView] = useState('overview')
  const [debugMode, setDebugMode] = useState(false)
  const [sceneObjects, setSceneObjects] = useState<SceneObject[]>([])
  const [showGrid, setShowGrid] = useState(false)
  const [showAxes, setShowAxes] = useState(false)
  const [showColliders, setShowColliders] = useState(false)
  const [showBot, setShowBot] = useState(false)
  const [cameraPos, setCameraPos] = useState({ x: 0, y: 0, z: 0 })
  const sceneRef = useRef<THREE.Scene | null>(null)
  const debugHelpersRef = useRef<THREE.Object3D[]>([])
  const colliderHelpersRef = useRef<THREE.Object3D[]>([])
  const botGroupRef = useRef<THREE.Group | null>(null)
  // Refs to track current state for keyboard handler (avoids stale closures)
  const showGridRef = useRef(false)
  const showAxesRef = useRef(false)
  const showCollidersRef = useRef(false)
  const showBotRef = useRef(false)
  
  // Camera preset handler
  const setCamera = useCallback((preset: keyof typeof CAMERA_PRESETS) => {
    if (!cameraRef.current || !controlsRef.current) return
    const { pos, target } = CAMERA_PRESETS[preset]
    cameraRef.current.position.set(pos[0], pos[1], pos[2])
    controlsRef.current.target.set(target[0], target[1], target[2])
    controlsRef.current.update()
    setCurrentView(preset)
  }, [])
  
  // Toggle debug helpers
  const updateDebugHelpers = useCallback((scene: THREE.Scene, grid: boolean, axes: boolean) => {
    // Remove existing debug helpers
    debugHelpersRef.current.forEach(helper => {
      scene.remove(helper)
      if (helper instanceof THREE.GridHelper || helper instanceof THREE.AxesHelper) {
        helper.dispose()
      }
    })
    debugHelpersRef.current = []
    
    // Add grid helper
    if (grid) {
      const gridHelper = new THREE.GridHelper(50, 50, 0x444444, 0x222222)
      gridHelper.name = 'debug-grid'
      gridHelper.position.y = 0.01 // Slightly above floor
      scene.add(gridHelper)
      debugHelpersRef.current.push(gridHelper)
    }
    
    // Add axes helper (R=X, G=Y, B=Z)
    if (axes) {
      const axesHelper = new THREE.AxesHelper(20)
      axesHelper.name = 'debug-axes'
      scene.add(axesHelper)
      debugHelpersRef.current.push(axesHelper)
    }
  }, [])
  
  // Toggle bot with hitbox visualization
  const updateBotHelper = useCallback((scene: THREE.Scene, show: boolean) => {
    // Remove existing bot
    if (botGroupRef.current) {
      scene.remove(botGroupRef.current)
      botGroupRef.current.traverse((child) => {
        if (child instanceof THREE.Mesh) {
          child.geometry.dispose()
          if (child.material instanceof THREE.Material) {
            child.material.dispose()
          }
        }
      })
      botGroupRef.current = null
    }
    
    if (show) {
      const botGroup = new THREE.Group()
      botGroup.name = 'debug-bot'
      
      // Bot position (center of map, slightly elevated)
      const botPos = new THREE.Vector3(0, 0, 5)
      botGroup.position.copy(botPos)
      
      // Create bot capsule mesh (visual representation)
      const capsuleGeo = new THREE.CapsuleGeometry(BOT_HITBOX.radius, BOT_HITBOX.height - BOT_HITBOX.radius * 2, 8, 16)
      const capsuleMat = new THREE.MeshStandardMaterial({
        color: 0xff4444,
        emissive: 0x331111,
        roughness: 0.7,
      })
      const capsuleMesh = new THREE.Mesh(capsuleGeo, capsuleMat)
      capsuleMesh.position.y = BOT_HITBOX.height / 2
      capsuleMesh.castShadow = true
      botGroup.add(capsuleMesh)
      
      // Create hitbox wireframe (shows actual collision bounds)
      const hitboxGeo = new THREE.CylinderGeometry(BOT_HITBOX.radius, BOT_HITBOX.radius, BOT_HITBOX.height, 16)
      const hitboxMat = new THREE.MeshBasicMaterial({
        color: 0x00ff00,
        wireframe: true,
        transparent: true,
        opacity: 0.8,
      })
      const hitboxMesh = new THREE.Mesh(hitboxGeo, hitboxMat)
      hitboxMesh.position.y = BOT_HITBOX.height / 2
      hitboxMesh.name = 'bot-hitbox'
      botGroup.add(hitboxMesh)
      
      // Create eye level indicator
      const eyeGeo = new THREE.SphereGeometry(0.1, 8, 8)
      const eyeMat = new THREE.MeshBasicMaterial({ color: 0xffff00 })
      const eyeMesh = new THREE.Mesh(eyeGeo, eyeMat)
      eyeMesh.position.y = BOT_HITBOX.eyeHeight
      eyeMesh.name = 'bot-eye-level'
      botGroup.add(eyeMesh)
      
      // Create center point indicator (where raycast hits are calculated)
      const centerGeo = new THREE.SphereGeometry(0.15, 8, 8)
      const centerMat = new THREE.MeshBasicMaterial({ color: 0x00ffff })
      const centerMesh = new THREE.Mesh(centerGeo, centerMat)
      centerMesh.position.y = BOT_HITBOX.height / 2 // Center of capsule
      centerMesh.name = 'bot-center'
      botGroup.add(centerMesh)
      
      // Add label sprite
      const canvas = document.createElement('canvas')
      canvas.width = 256
      canvas.height = 64
      const ctx = canvas.getContext('2d')!
      ctx.fillStyle = 'rgba(0,0,0,0.7)'
      ctx.fillRect(0, 0, 256, 64)
      ctx.fillStyle = '#ff4444'
      ctx.font = 'bold 24px Arial'
      ctx.textAlign = 'center'
      ctx.fillText('BOT HITBOX', 128, 28)
      ctx.fillStyle = '#aaaaaa'
      ctx.font = '14px Arial'
      ctx.fillText(`r=${BOT_HITBOX.radius}m h=${BOT_HITBOX.height}m`, 128, 50)
      
      const labelTexture = new THREE.CanvasTexture(canvas)
      const labelMat = new THREE.SpriteMaterial({ map: labelTexture })
      const labelSprite = new THREE.Sprite(labelMat)
      labelSprite.position.y = BOT_HITBOX.height + 0.5
      labelSprite.scale.set(2, 0.5, 1)
      botGroup.add(labelSprite)
      
      // Load actual bot character model
      const gltfLoader = new GLTFLoader()
      const botModelUrl = 'https://ikbshpdvvkydbpirbahl.supabase.co/storage/v1/object/public/arena-assets/animations/Run_and_Shoot_withSkin.glb'
      gltfLoader.load(botModelUrl, (gltf) => {
        const botCharModel = gltf.scene
        botCharModel.scale.set(0.01, 0.01, 0.01)
        botCharModel.traverse((child) => {
          if ((child as THREE.Mesh).isMesh) {
            child.castShadow = true
            child.receiveShadow = true
          }
        })
        botGroup.add(botCharModel)
        
        // Setup animation
        const mixer = new THREE.AnimationMixer(botCharModel)
        const runClip = gltf.animations.find(a => a.name.toLowerCase().includes('run'))
        if (runClip) {
          const action = mixer.clipAction(runClip)
          action.play()
        }
        botGroup.userData.mixer = mixer
      })
      
      scene.add(botGroup)
      botGroupRef.current = botGroup
    }
  }, [])
  
  // Toggle collision box visualization
  const updateColliderHelpers = useCallback((scene: THREE.Scene, show: boolean, loadedMap: LoadedMap | null) => {
    // Remove existing collider helpers
    colliderHelpersRef.current.forEach(helper => {
      scene.remove(helper)
      if (helper instanceof THREE.Mesh) {
        helper.geometry.dispose()
        if (helper.material instanceof THREE.Material) {
          helper.material.dispose()
        }
      }
    })
    colliderHelpersRef.current = []
    
    if (show && loadedMap) {
      loadedMap.definition.collisionManifest.colliders.forEach((collider) => {
        const color = getColliderColor(collider.id)
        
        // Wireframe box
        const geo = new THREE.BoxGeometry(collider.size[0], collider.size[1], collider.size[2])
        const mat = new THREE.MeshBasicMaterial({ 
          color,
          wireframe: true,
          transparent: true,
          opacity: 0.8
        })
        const mesh = new THREE.Mesh(geo, mat)
        mesh.position.set(collider.center[0], collider.center[1], collider.center[2])
        mesh.name = `debug-collider-${collider.id}`
        scene.add(mesh)
        colliderHelpersRef.current.push(mesh)
        
        // Semi-transparent fill
        const solidGeo = new THREE.BoxGeometry(collider.size[0], collider.size[1], collider.size[2])
        const solidMat = new THREE.MeshBasicMaterial({ 
          color,
          transparent: true,
          opacity: 0.15,
          side: THREE.DoubleSide
        })
        const solidMesh = new THREE.Mesh(solidGeo, solidMat)
        solidMesh.position.set(collider.center[0], collider.center[1], collider.center[2])
        solidMesh.name = `debug-collider-solid-${collider.id}`
        scene.add(solidMesh)
        colliderHelpersRef.current.push(solidMesh)
      })
    }
  }, [])
  
  // Refresh scene objects list
  const refreshSceneObjects = useCallback(() => {
    if (sceneRef.current) {
      setSceneObjects(collectSceneObjects(sceneRef.current))
    }
  }, [])

  // Store loadedMap ref for collider helpers
  const loadedMapRef = useRef<LoadedMap | null>(null)
  const [mapLoading, setMapLoading] = useState(true)
  const [mapLoadError, setMapLoadError] = useState<string | null>(null)
  
  useEffect(() => {
    if (!containerRef.current) return

    let cleanup: (() => void) | null = null
    const mapLoader = new MapLoader()

    const initViewer = async () => {
      setMapLoading(true)
      setMapLoadError(null)

      // Load map using MapLoader
      const mapResult = await mapLoader.load('abandoned_terminal')
      if (!mapResult.ok) {
        setMapLoadError(mapResult.error.message)
        setMapLoading(false)
        return
      }

      const loadedMap = mapResult.value
      loadedMapRef.current = loadedMap
      setMapLoading(false)
    
      // Create arena scene with loaded map
      const arenaScene = new ArenaScene(loadedMap)
      sceneRef.current = arenaScene.scene
    
      // Camera - start with side view of train
      const camera = new THREE.PerspectiveCamera(
        70,
        window.innerWidth / window.innerHeight,
        0.1,
        100
      )
      camera.position.set(15, 3, 0)
      cameraRef.current = camera
    
      // Create enterprise renderer
      const arenaRenderer = new ArenaRenderer(null, {
      antialias: true,
      shadows: true,
      shadowMapSize: 2048,
      toneMapping: THREE.ACESFilmicToneMapping,
      toneMappingExposure: 1.0,
      postProcessing: {
        bloom: {
          enabled: true,
          strength: 0.3,
          radius: 0.3,
          threshold: 0.92,
        },
        colorGrading: {
          enabled: true,
          contrast: 1.1,
          saturation: 1.0,
          brightness: 0.0,
          vignette: 0.2,
        },
        antialiasing: true,
      },
    })
    
    containerRef.current!.appendChild(arenaRenderer.renderer.domElement)
    arenaRenderer.setSize(window.innerWidth, window.innerHeight)
    
    // Initialize renderer with scene
    arenaRenderer.initialize(arenaScene.scene, camera)
    
    // Generate environment map for reflections
    arenaScene.generateEnvMap(arenaRenderer.renderer)
    
    // Orbit controls
    const controls = new OrbitControls(camera, arenaRenderer.renderer.domElement)
    controls.enableDamping = true
    controls.dampingFactor = 0.05
    controls.maxPolarAngle = Math.PI / 2 - 0.05
    controls.minDistance = 2
    controls.maxDistance = 60
    controls.target.set(0, 1, 0)
    controls.zoomSpeed = 1.5
    controlsRef.current = controls
    
    // Keyboard controls
    const handleKeyDown = (e: KeyboardEvent) => {
      const direction = new THREE.Vector3()
      
      switch (e.key.toLowerCase()) {
        case 'w':
        case '=':
        case '+':
          // Zoom in - move camera toward target
          camera.getWorldDirection(direction)
          camera.position.addScaledVector(direction, 2)
          break
        case 's':
        case '-':
        case '_':
          // Zoom out - move camera away from target
          camera.getWorldDirection(direction)
          camera.position.addScaledVector(direction, -2)
          break
        case '1':
          setCamera('overview')
          break
        case '2':
          setCamera('trainSide')
          break
        case '3':
          setCamera('trainFront')
          break
        case '4':
          setCamera('platform')
          break
        case '5':
          setCamera('topDown')
          break
        case 'd':
          // Toggle debug mode
          setDebugMode(prev => !prev)
          break
        case 'g':
          // Toggle grid
          showGridRef.current = !showGridRef.current
          setShowGrid(showGridRef.current)
          updateDebugHelpers(arenaScene.scene, showGridRef.current, showAxesRef.current)
          break
        case 'a':
          // Toggle axes (only when not typing)
          if (!e.ctrlKey && !e.metaKey) {
            showAxesRef.current = !showAxesRef.current
            setShowAxes(showAxesRef.current)
            updateDebugHelpers(arenaScene.scene, showGridRef.current, showAxesRef.current)
          }
          break
        case 'c':
          // Toggle collision boxes
          showCollidersRef.current = !showCollidersRef.current
          setShowColliders(showCollidersRef.current)
          updateColliderHelpers(arenaScene.scene, showCollidersRef.current, loadedMapRef.current)
          break
        case 'b':
          // Toggle bot with hitbox
          showBotRef.current = !showBotRef.current
          setShowBot(showBotRef.current)
          updateBotHelper(arenaScene.scene, showBotRef.current)
          break
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    
    // Animation loop
    let animationId: number
    let lastStatsUpdate = 0
    
    let lastAnimTime = performance.now()
    const animate = () => {
      animationId = requestAnimationFrame(animate)
      const now = performance.now()
      const delta = (now - lastAnimTime) / 1000
      lastAnimTime = now
      
      controls.update()
      
      // Update bot animation if present
      if (botGroupRef.current?.userData.mixer) {
        botGroupRef.current.userData.mixer.update(delta)
      }
      
      arenaRenderer.render()
      
      // Update stats every 500ms
      if (now - lastStatsUpdate > 500) {
        const info = arenaRenderer.getInfo()
        // Get browser memory if available
        const perfMemory = (performance as unknown as { memory?: { usedJSHeapSize: number } }).memory
        const memoryMB = perfMemory ? Math.round(perfMemory.usedJSHeapSize / 1024 / 1024) : 0
        
        setStats({
          fps: arenaRenderer.getFPS(),
          drawCalls: arenaRenderer.getDrawCalls(),
          triangles: arenaRenderer.getTriangles(),
          memory: memoryMB,
          geometries: info.memory.geometries,
          textures: info.memory.textures,
        })
        // Update camera position for debug panel
        setCameraPos({
          x: camera.position.x,
          y: camera.position.y,
          z: camera.position.z,
        })
        lastStatsUpdate = now
      }
    }
    animate()
    
    // Resize handler
    const handleResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight
      camera.updateProjectionMatrix()
      arenaRenderer.setSize(window.innerWidth, window.innerHeight)
    }
    window.addEventListener('resize', handleResize)
    
    // Store renderer ref for post-processing toggle
    const rendererRef = arenaRenderer
    
      // Cleanup function
      cleanup = () => {
        cancelAnimationFrame(animationId)
        window.removeEventListener('resize', handleResize)
        window.removeEventListener('keydown', handleKeyDown)
        rendererRef.dispose()
        arenaScene.dispose()
        if (containerRef.current?.contains(rendererRef.renderer.domElement)) {
          containerRef.current.removeChild(rendererRef.renderer.domElement)
        }
      }
    }

    // Start initialization
    initViewer()

    // Return cleanup
    return () => {
      if (cleanup) cleanup()
    }
  }, [setCamera, updateDebugHelpers, updateColliderHelpers, updateBotHelper])
  
  return (
    <div className="relative w-full h-screen bg-black">
      <div ref={containerRef} className="w-full h-full" />

      {/* Loading overlay */}
      {mapLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/90">
          <div className="text-amber-400 text-xl">Loading map...</div>
        </div>
      )}

      {/* Error overlay */}
      {mapLoadError && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/90">
          <div className="text-red-400 text-xl">Error: {mapLoadError}</div>
        </div>
      )}
      
      {/* Info overlay */}
      <div className="absolute top-4 left-4 bg-black/80 backdrop-blur-sm p-4 rounded-xl border border-white/10 text-white">
        <h1 className="text-xl font-bold text-amber-400">Abandoned Terminal</h1>
        <p className="text-gray-400 text-sm mt-1">Enterprise Arena Viewer</p>
        <div className="mt-3 text-xs text-gray-500 space-y-1">
          <p><span className="text-amber-400">Left Click + Drag</span> = Rotate</p>
          <p><span className="text-amber-400">Right Click + Drag</span> = Pan</p>
          <p><span className="text-amber-400">Scroll</span> = Zoom</p>
        </div>
      </div>
      
      {/* Performance stats */}
      <div className="absolute top-4 right-4 bg-black/80 backdrop-blur-sm p-3 rounded-xl border border-white/10 text-xs font-mono">
        <div className="text-gray-400 space-y-1">
          <p>FPS: <span className={stats.fps >= 55 ? 'text-green-400' : stats.fps >= 30 ? 'text-yellow-400' : 'text-red-400'}>{stats.fps}</span></p>
          <p>Draw Calls: <span className="text-cyan-400">{stats.drawCalls}</span></p>
          <p>Triangles: <span className="text-purple-400">{stats.triangles.toLocaleString()}</span></p>
          <p>Geometries: <span className="text-blue-400">{stats.geometries}</span></p>
          <p>Textures: <span className="text-orange-400">{stats.textures}</span></p>
          {stats.memory > 0 && <p>Memory: <span className="text-pink-400">{stats.memory} MB</span></p>}
        </div>
        <div className="mt-2 pt-2 border-t border-white/10">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={postProcessing}
              onChange={(e) => setPostProcessing(e.target.checked)}
              className="rounded"
            />
            <span className="text-gray-400">Post-Processing</span>
          </label>
        </div>
      </div>
      
      {/* Camera presets */}
      <div className="absolute top-1/2 left-4 -translate-y-1/2 bg-black/80 backdrop-blur-sm p-2 rounded-xl border border-white/10 space-y-2">
        <p className="text-xs text-gray-500 text-center mb-2">Views</p>
        {[
          { key: 'overview', label: '1', title: 'Overview' },
          { key: 'trainSide', label: '2', title: 'Train Side' },
          { key: 'trainFront', label: '3', title: 'Train Front' },
          { key: 'platform', label: '4', title: 'Platform' },
          { key: 'topDown', label: '5', title: 'Top Down' },
        ].map(({ key, label, title }) => (
          <button
            key={key}
            onClick={() => setCamera(key as keyof typeof CAMERA_PRESETS)}
            className={`w-10 h-10 rounded-lg text-sm font-bold transition-colors ${
              currentView === key 
                ? 'bg-amber-500 text-black' 
                : 'bg-white/10 text-white hover:bg-white/20'
            }`}
            title={title}
          >
            {label}
          </button>
        ))}
        <div className="pt-2 border-t border-white/10 text-center">
          <p className="text-[10px] text-gray-500">W/S or +/-</p>
          <p className="text-[10px] text-gray-500">to zoom</p>
        </div>
      </div>
      
      {/* Dimensions info */}
      <div className="absolute bottom-4 left-4 bg-black/80 backdrop-blur-sm p-3 rounded-xl border border-white/10 text-xs text-gray-400">
        <p>Floor: 36m × 40m</p>
        <p>Ceiling: 6m</p>
        <p>Track: 5m wide, 0.6m deep</p>
        <p>Subway Entrances: 2 (diagonal corners)</p>
      </div>
      
      {/* Render pipeline info */}
      <div className="absolute bottom-4 right-4 bg-black/80 backdrop-blur-sm p-3 rounded-xl border border-white/10 text-xs text-gray-500">
        <p className="text-amber-400/80 font-medium mb-1">Render Pipeline</p>
        <p>• Procedural Textures</p>
        <p>• PBR Materials</p>
        <p>• Bloom + Color Grading</p>
        <p>• SMAA Anti-aliasing</p>
        <p>• Geometry Batching</p>
      </div>
      
      {/* Debug mode toggle */}
      <button
        onClick={() => setDebugMode(prev => !prev)}
        className={`absolute top-4 left-1/2 -translate-x-1/2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
          debugMode 
            ? 'bg-green-500 text-black' 
            : 'bg-white/10 text-white hover:bg-white/20'
        }`}
      >
        Debug Mode {debugMode ? 'ON' : 'OFF'} (D)
      </button>
      
      {/* Debug panel */}
      {debugMode && (
        <div className="absolute top-20 left-1/2 -translate-x-1/2 bg-black/90 backdrop-blur-sm p-4 rounded-xl border border-green-500/50 text-xs font-mono max-w-2xl max-h-[60vh] overflow-auto">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-green-400 font-bold text-sm">🔧 Debug Panel</h2>
            <button 
              onClick={refreshSceneObjects}
              className="px-2 py-1 bg-green-500/20 text-green-400 rounded hover:bg-green-500/30"
            >
              Refresh
            </button>
          </div>
          
          {/* Debug toggles */}
          <div className="flex gap-4 mb-3 pb-3 border-b border-white/10">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={showGrid}
                onChange={(e) => {
                  showGridRef.current = e.target.checked
                  setShowGrid(e.target.checked)
                  if (sceneRef.current) {
                    updateDebugHelpers(sceneRef.current, e.target.checked, showAxesRef.current)
                  }
                }}
                className="rounded accent-green-500"
              />
              <span className="text-gray-400">Grid (G)</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={showAxes}
                onChange={(e) => {
                  showAxesRef.current = e.target.checked
                  setShowAxes(e.target.checked)
                  if (sceneRef.current) {
                    updateDebugHelpers(sceneRef.current, showGridRef.current, e.target.checked)
                  }
                }}
                className="rounded accent-green-500"
              />
              <span className="text-gray-400">Axes (A) <span className="text-red-400">X</span>/<span className="text-green-400">Y</span>/<span className="text-blue-400">Z</span></span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={showColliders}
                onChange={(e) => {
                  showCollidersRef.current = e.target.checked
                  setShowColliders(e.target.checked)
                  if (sceneRef.current) {
                    updateColliderHelpers(sceneRef.current, e.target.checked, loadedMapRef.current)
                  }
                }}
                className="rounded accent-yellow-500"
              />
              <span className="text-gray-400">Colliders (C)</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={showBot}
                onChange={(e) => {
                  showBotRef.current = e.target.checked
                  setShowBot(e.target.checked)
                  if (sceneRef.current) {
                    updateBotHelper(sceneRef.current, e.target.checked)
                  }
                }}
                className="rounded accent-red-500"
              />
              <span className="text-gray-400">Bot Hitbox (B)</span>
            </label>
          </div>
          
          {/* Collider legend */}
          {showColliders && (
            <div className="mb-3 pb-3 border-b border-white/10">
              <p className="text-yellow-400/80 mb-1">Collider Legend:</p>
              <div className="grid grid-cols-2 gap-1 text-[10px]">
                <p><span className="text-green-400">■</span> Floor</p>
                <p><span className="text-red-400">■</span> Wall</p>
                <p><span className="text-yellow-400">■</span> Subway</p>
                <p><span className="text-orange-400">■</span> Train</p>
                <p><span className="text-blue-400">■</span> Track</p>
                <p><span className="text-cyan-400">■</span> Pillar</p>
              </div>
            </div>
          )}
          
          {/* Bot hitbox legend */}
          {showBot && (
            <div className="mb-3 pb-3 border-b border-white/10">
              <p className="text-red-400/80 mb-1">Bot Hitbox Legend:</p>
              <div className="grid grid-cols-1 gap-1 text-[10px]">
                <p><span className="text-red-400">■</span> Bot Capsule (visual)</p>
                <p><span className="text-green-400">○</span> Hitbox Wireframe (collision)</p>
                <p><span className="text-yellow-400">●</span> Eye Level ({BOT_HITBOX.eyeHeight}m)</p>
                <p><span className="text-cyan-400">●</span> Center Point (raycast target)</p>
                <p className="mt-1 text-gray-500">Radius: {BOT_HITBOX.radius}m | Height: {BOT_HITBOX.height}m</p>
              </div>
            </div>
          )}
          
          {/* Keyboard shortcuts */}
          <div className="mb-3 pb-3 border-b border-white/10 text-gray-500">
            <p className="text-green-400/80 mb-1">Shortcuts:</p>
            <p>D = Toggle debug | G = Grid | A = Axes | C = Colliders | B = Bot</p>
          </div>
          
          {/* Scene objects table */}
          <div>
            <p className="text-green-400/80 mb-2">Scene Objects ({sceneObjects.length}):</p>
            {sceneObjects.length === 0 ? (
              <p className="text-gray-500">Click "Refresh" to load objects</p>
            ) : (
              <table className="w-full text-left">
                <thead>
                  <tr className="text-gray-500 border-b border-white/10">
                    <th className="pb-1 pr-3">Name</th>
                    <th className="pb-1 pr-3">Type</th>
                    <th className="pb-1 pr-3">Position (X,Y,Z)</th>
                    <th className="pb-1">Size (W,H,D)</th>
                  </tr>
                </thead>
                <tbody>
                  {sceneObjects.map((obj, i) => (
                    <tr key={i} className="text-gray-400 border-b border-white/5 hover:bg-white/5">
                      <td className="py-1 pr-3 text-cyan-400">{obj.name}</td>
                      <td className="py-1 pr-3 text-purple-400">{obj.type}</td>
                      <td className="py-1 pr-3">
                        <span className="text-red-400">{obj.position.x}</span>,
                        <span className="text-green-400">{obj.position.y}</span>,
                        <span className="text-blue-400">{obj.position.z}</span>
                      </td>
                      <td className="py-1">
                        {obj.size.x} × {obj.size.y} × {obj.size.z}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
          
          {/* Camera info (live updates) */}
          <div className="mt-3 pt-3 border-t border-white/10">
            <p className="text-green-400/80 mb-1">Camera Position (live):</p>
            <p className="text-gray-400">
              X: <span className="text-red-400">{cameraPos.x.toFixed(2)}</span> | 
              Y: <span className="text-green-400">{cameraPos.y.toFixed(2)}</span> | 
              Z: <span className="text-blue-400">{cameraPos.z.toFixed(2)}</span>
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
