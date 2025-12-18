/**
 * ArenaPlayTest - Full-featured first-person arena test
 * 
 * Integrates all arena systems for testing:
 * - ArenaScene (3D map with collision geometry)
 * - Physics3D (movement, gravity, jumping)
 * - InputManager (WASD + mouse look + fire)
 * - CameraController (first-person camera)
 * - ArenaCharacterLoader (Meshy AI character model)
 * - HUDRenderer (health, ammo, crosshair, damage indicators)
 * - AudioSystem (3D spatial audio, footsteps)
 * - CombatSystem (shooting, damage, health)
 * - SpawnSystem (spawn point selection)
 * - DebugOverlay (collision visualization)
 * 
 * Click to lock pointer, WASD to move, Space to jump, LMB to shoot, ESC to release
 */

import { useEffect, useRef, useState, useCallback } from 'react'
import * as THREE from 'three'
import { ArenaScene } from '@/arena'
import { ArenaRenderer } from '@/arena/rendering/ArenaRenderer'
import { EventBus } from '@/arena/core/EventBus'
import { CollisionWorld } from '@/arena/physics/CollisionWorld'
import { Physics3D, DEFAULT_PHYSICS_CONFIG, createInitialPhysicsState } from '@/arena/physics/Physics3D'
import { CameraController, DEFAULT_CAMERA_CONFIG } from '@/arena/client/CameraController'
import { InputManager, DEFAULT_INPUT_CONFIG } from '@/arena/client/InputManager'
import { HUDRenderer, DEFAULT_HUD_CONFIG } from '@/arena/presentation/HUDRenderer'
import { AudioSystem, DEFAULT_AUDIO_CONFIG } from '@/arena/presentation/AudioSystem'
import { CombatSystem, DEFAULT_COMBAT_CONFIG } from '@/arena/game/CombatSystem'
import { SpawnSystem } from '@/arena/game/SpawnSystem'
import { DebugOverlay, DEFAULT_DEBUG_CONFIG } from '@/arena/debug/DebugOverlay'
import { MapLoader } from '@/arena/maps/MapLoader'
import { MapRegistry } from '@/arena/maps/MapRegistry'
import '@/arena/maps/definitions' // Register maps
import { Vector3 } from '@/arena/math/Vector3'
import { Capsule } from '@/arena/physics/Capsule'
import { arenaCharacterLoader } from '@/arena/player/ArenaCharacterLoader'
import type { LoadedCharacter } from '@/arena/player/ArenaCharacterLoader'
import type { PlayerPhysicsState } from '@/arena/physics/Physics3D'
import type { LoadedMap } from '@/arena/maps/MapLoader'

interface DebugInfo {
  fps: number
  position: { x: number; y: number; z: number }
  velocity: { x: number; y: number; z: number }
  isGrounded: boolean
  pointerLocked: boolean
  collisionCount: number
  health: number
  ammo: number
}

const LOCAL_PLAYER_ID = 1

export default function ArenaPlayTest() {
  const containerRef = useRef<HTMLDivElement>(null)
  const [debugInfo, setDebugInfo] = useState<DebugInfo>({
    fps: 0,
    position: { x: 0, y: 0, z: 0 },
    velocity: { x: 0, y: 0, z: 0 },
    isGrounded: false,
    pointerLocked: false,
    collisionCount: 0,
    health: 100,
    ammo: 30,
  })
  const [showInstructions, setShowInstructions] = useState(true)
  const [characterLoaded, setCharacterLoaded] = useState(false)
  const [showDebugOverlay, setShowDebugOverlay] = useState(false)

  const requestPointerLock = useCallback(() => {
    // Request pointer lock on the canvas element (not the container div)
    // InputManager checks against the canvas it was initialized with
    const canvas = containerRef.current?.querySelector('canvas')
    canvas?.requestPointerLock()
  }, [])

  useEffect(() => {
    if (!containerRef.current) return

    // === CORE SYSTEMS ===
    const eventBus = new EventBus()
    
    // Collision world
    const collisionWorld = new CollisionWorld(4)
    const loadResult = collisionWorld.loadManifest(ABANDONED_TERMINAL_COLLISION_MANIFEST)
    if (!loadResult.ok) {
      console.error('Failed to load collision manifest:', loadResult.error)
    }

    // Physics
    const physics = new Physics3D(DEFAULT_PHYSICS_CONFIG, collisionWorld, eventBus)

    // Camera controller
    const cameraController = new CameraController({
      ...DEFAULT_CAMERA_CONFIG,
      sensitivity: 0.002,
    })

    // Spawn system
    const spawnSystem = new SpawnSystem(eventBus)
    spawnSystem.loadManifest(ABANDONED_TERMINAL_SPAWN_MANIFEST)
    spawnSystem.setCurrentTime(performance.now())

    // Get initial spawn point
    const initialSpawn = spawnSystem.selectSpawnPoint(LOCAL_PLAYER_ID, [])
    let playerState: PlayerPhysicsState = createInitialPhysicsState(initialSpawn.position)

    // Combat system
    const combatSystem = new CombatSystem(DEFAULT_COMBAT_CONFIG, collisionWorld, eventBus)
    combatSystem.initializePlayer(LOCAL_PLAYER_ID)

    // Debug overlay
    const debugOverlay = new DebugOverlay({
      ...DEFAULT_DEBUG_CONFIG,
      enabled: false,
    })

    // === SCENE SETUP ===
    const arenaScene = new ArenaScene()
    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 100)

    // Renderer
    const arenaRenderer = new ArenaRenderer(null, {
      antialias: true,
      shadows: true,
      shadowMapSize: 1024,
      toneMapping: THREE.ACESFilmicToneMapping,
      toneMappingExposure: 1.0,
      postProcessing: {
        bloom: { enabled: true, strength: 0.3, radius: 0.4, threshold: 0.9 },
        colorGrading: { enabled: true, contrast: 1.05, saturation: 1.0, brightness: 0.0, vignette: 0.15 },
        antialiasing: true,
      },
    })

    containerRef.current.appendChild(arenaRenderer.renderer.domElement)
    arenaRenderer.setSize(window.innerWidth, window.innerHeight)
    arenaRenderer.initialize(arenaScene.scene, camera)
    arenaScene.generateEnvMap(arenaRenderer.renderer)

    // === INPUT MANAGER ===
    const inputManager = new InputManager(DEFAULT_INPUT_CONFIG, eventBus)
    inputManager.initialize(arenaRenderer.renderer.domElement as HTMLCanvasElement)

    // === HUD RENDERER ===
    const hudRenderer = new HUDRenderer(DEFAULT_HUD_CONFIG, eventBus)
    hudRenderer.initialize(containerRef.current)
    hudRenderer.setLocalPlayerId(LOCAL_PLAYER_ID)

    // === AUDIO SYSTEM ===
    const audioSystem = new AudioSystem(DEFAULT_AUDIO_CONFIG, eventBus)
    audioSystem.initialize().catch(err => console.warn('Audio init failed:', err))
    audioSystem.setLocalPlayerId(LOCAL_PLAYER_ID)

    // === CHARACTER LOADING ===
    let character: LoadedCharacter | null = null
    let characterMesh: THREE.Group | null = null

    arenaCharacterLoader.loadEssentials().then((loadedChar) => {
      character = loadedChar
      characterMesh = loadedChar.model
      characterMesh.scale.set(0.01, 0.01, 0.01)
      characterMesh.position.set(0, 0, 0)
      
      const playerGroup = new THREE.Group()
      playerGroup.name = 'player'
      playerGroup.add(characterMesh)
      arenaScene.scene.add(playerGroup)
      
      if (loadedChar.animations.has('idle')) {
        const idleClip = loadedChar.animations.get('idle')!
        const action = loadedChar.mixer.clipAction(idleClip)
        action.play()
      }
      
      setCharacterLoaded(true)
    }).catch((err) => {
      console.warn('[ArenaPlayTest] Failed to load character:', err)
    })

    // === DEBUG VISUALIZATION ===
    const debugLines: THREE.LineSegments[] = []
    
    function createDebugVisualization() {
      // Clear existing
      debugLines.forEach(line => arenaScene.scene.remove(line))
      debugLines.length = 0
      
      if (!debugOverlay.isEnabled()) return
      
      // Draw collision AABBs
      ABANDONED_TERMINAL_COLLISION_MANIFEST.colliders.forEach(collider => {
        const geometry = new THREE.BoxGeometry(...collider.size)
        const edges = new THREE.EdgesGeometry(geometry)
        const material = new THREE.LineBasicMaterial({ color: 0x00ff00, transparent: true, opacity: 0.5 })
        const line = new THREE.LineSegments(edges, material)
        line.position.set(...collider.center)
        arenaScene.scene.add(line)
        debugLines.push(line)
      })
      
      // Draw spawn points
      ABANDONED_TERMINAL_SPAWN_MANIFEST.spawnPoints.forEach(spawn => {
        const geometry = new THREE.SphereGeometry(0.3, 8, 8)
        const edges = new THREE.EdgesGeometry(geometry)
        const material = new THREE.LineBasicMaterial({ color: 0xffff00 })
        const line = new THREE.LineSegments(edges, material)
        line.position.set(...spawn.position)
        arenaScene.scene.add(line)
        debugLines.push(line)
      })
    }

    // === POINTER LOCK HANDLING ===
    const handlePointerLockChange = () => {
      // Check if pointer is locked to the canvas (InputManager checks this)
      const isLocked = document.pointerLockElement === arenaRenderer.renderer.domElement
      if (isLocked) {
        setShowInstructions(false)
      }
    }
    document.addEventListener('pointerlockchange', handlePointerLockChange)

    // === GAME LOOP ===
    let animationId: number
    let lastTime = performance.now()
    let frameCount = 0
    let lastFpsUpdate = 0
    let currentFps = 0
    let sequenceNumber = 0
    let tickNumber = 0

    const gameLoop = () => {
      animationId = requestAnimationFrame(gameLoop)
      
      const now = performance.now()
      const deltaTime = Math.min((now - lastTime) / 1000, 0.1)
      lastTime = now
      tickNumber++

      // FPS counter
      frameCount++
      if (now - lastFpsUpdate > 500) {
        currentFps = Math.round(frameCount / ((now - lastFpsUpdate) / 1000))
        frameCount = 0
        lastFpsUpdate = now
      }

      // Capture input
      const inputPacket = inputManager.captureFrame(sequenceNumber++, tickNumber, now)
      
      // Apply mouse look
      if (inputManager.isPointerLocked()) {
        cameraController.applyLookDelta(inputPacket.lookDeltaX, inputPacket.lookDeltaY)
      }

      const cameraState = cameraController.getState()

      // Physics step
      playerState = physics.step(
        playerState,
        {
          forward: inputPacket.movementY,
          right: inputPacket.movementX,
          jump: (inputPacket.buttons & 0x01) !== 0,
          yaw: cameraState.yaw,
        },
        deltaTime,
        now
      )

      // Handle shooting
      const isFiring = (inputPacket.buttons & 0x02) !== 0
      if (isFiring && inputManager.isPointerLocked()) {
        const combatState = combatSystem.getPlayerState(LOCAL_PLAYER_ID)
        if (combatState && !combatState.isDead) {
          const eyePos = new Vector3(
            playerState.position.x,
            playerState.position.y + 1.6,
            playerState.position.z
          )
          const forward = cameraController.getForwardVector()
          const direction = new Vector3(forward.x, forward.y, forward.z)
          
          // Create player capsules map (empty for single player test)
          const playerCapsules = new Map<number, Capsule>()
          
          combatSystem.processFire(
            {
              playerId: LOCAL_PLAYER_ID,
              origin: eyePos,
              direction,
              clientTimestamp: now,
            },
            playerCapsules,
            now
          )
          
          // Play gunshot sound
          audioSystem.playSound('gunshot', eyePos)
        }
      }

      // Update combat system
      combatSystem.update(now)

      // Update view bob
      const horizontalSpeed = Math.sqrt(
        playerState.velocity.x ** 2 + playerState.velocity.z ** 2
      )
      cameraController.updateViewBob(horizontalSpeed > 0.1, horizontalSpeed, deltaTime)

      // Update audio footsteps
      audioSystem.updateFootsteps(
        horizontalSpeed > 0.1,
        playerState.isGrounded,
        horizontalSpeed,
        deltaTime
      )

      // Update audio listener position
      const forward = cameraController.getForwardVector()
      audioSystem.setListenerPosition(
        new Vector3(playerState.position.x, playerState.position.y + 1.6, playerState.position.z),
        new Vector3(forward.x, forward.y, forward.z),
        Vector3.UP
      )

      // Update camera
      const viewBobOffset = cameraController.getState().viewBobOffset
      camera.position.set(
        playerState.position.x,
        playerState.position.y + 1.6 + viewBobOffset,
        playerState.position.z
      )
      camera.rotation.order = 'YXZ'
      camera.rotation.y = cameraState.yaw
      camera.rotation.x = cameraState.pitch

      // Update character
      if (character) {
        character.mixer.update(deltaTime)
        if (characterMesh) {
          characterMesh.parent!.position.set(
            playerState.position.x,
            playerState.position.y,
            playerState.position.z
          )
          characterMesh.parent!.rotation.y = cameraState.yaw + Math.PI
        }
      }

      // Update HUD
      const combatState = combatSystem.getPlayerState(LOCAL_PLAYER_ID)
      hudRenderer.update({
        health: combatState?.health ?? 100,
        maxHealth: 100,
        ammo: 30,
        maxAmmo: 30,
        score: 0,
        opponentScore: 0,
        rtt: 0,
        showNetworkWarning: false,
        damageIndicators: [],
        hitMarkerActive: false,
        hitMarkerEndTime: 0,
        killFeed: [],
        lowHealthVignetteIntensity: 0,
      }, now)

      // Test collisions for debug
      const testCapsule = new Capsule(
        new Vector3(playerState.position.x, playerState.position.y, playerState.position.z)
      )
      const collisions = collisionWorld.testCapsule(testCapsule)

      // Render
      arenaRenderer.render()

      // Update debug info
      setDebugInfo({
        fps: currentFps,
        position: {
          x: Math.round(playerState.position.x * 100) / 100,
          y: Math.round(playerState.position.y * 100) / 100,
          z: Math.round(playerState.position.z * 100) / 100,
        },
        velocity: {
          x: Math.round(playerState.velocity.x * 100) / 100,
          y: Math.round(playerState.velocity.y * 100) / 100,
          z: Math.round(playerState.velocity.z * 100) / 100,
        },
        isGrounded: playerState.isGrounded,
        pointerLocked: inputManager.isPointerLocked(),
        collisionCount: collisions.length,
        health: combatState?.health ?? 100,
        ammo: 30,
      })
    }

    gameLoop()

    // === KEYBOARD SHORTCUTS ===
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'F3') {
        e.preventDefault()
        debugOverlay.setEnabled(!debugOverlay.isEnabled())
        setShowDebugOverlay(debugOverlay.isEnabled())
        createDebugVisualization()
      }
      if (e.key === 'r' || e.key === 'R') {
        // Respawn at random spawn point
        const spawn = spawnSystem.selectSpawnPoint(LOCAL_PLAYER_ID, [])
        playerState = createInitialPhysicsState(spawn.position)
        combatSystem.respawnPlayer(LOCAL_PLAYER_ID, performance.now())
        audioSystem.playUISound('spawn')
      }
    }
    document.addEventListener('keydown', handleKeyDown)

    // === RESIZE HANDLER ===
    const handleResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight
      camera.updateProjectionMatrix()
      arenaRenderer.setSize(window.innerWidth, window.innerHeight)
    }
    window.addEventListener('resize', handleResize)

    // === CLEANUP ===
    return () => {
      cancelAnimationFrame(animationId)
      document.removeEventListener('pointerlockchange', handlePointerLockChange)
      document.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('resize', handleResize)
      
      if (document.pointerLockElement) {
        document.exitPointerLock()
      }
      
      inputManager.dispose()
      hudRenderer.dispose()
      audioSystem.dispose()
      arenaRenderer.dispose()
      arenaScene.dispose()
      arenaCharacterLoader.clearCache()
      
      debugLines.forEach(line => {
        line.geometry.dispose()
        ;(line.material as THREE.Material).dispose()
      })
      
      if (containerRef.current?.contains(arenaRenderer.renderer.domElement)) {
        containerRef.current.removeChild(arenaRenderer.renderer.domElement)
      }
    }
  }, [])

  return (
    <div className="relative w-full h-screen bg-black">
      <div 
        ref={containerRef} 
        className="w-full h-full cursor-crosshair"
        onClick={requestPointerLock}
      />

      {/* Instructions overlay */}
      {showInstructions && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/70 backdrop-blur-sm">
          <div className="bg-gray-900/90 p-8 rounded-2xl border border-amber-500/30 text-center max-w-md">
            <h1 className="text-2xl font-bold text-amber-400 mb-4">Arena Play Test</h1>
            <p className="text-gray-300 mb-6">Full arena test with physics, combat, and audio</p>
            
            <div className="text-left text-sm text-gray-400 space-y-2 mb-6">
              <p><span className="text-amber-400 font-mono">WASD</span> - Move</p>
              <p><span className="text-amber-400 font-mono">Mouse</span> - Look around</p>
              <p><span className="text-amber-400 font-mono">Space</span> - Jump</p>
              <p><span className="text-amber-400 font-mono">LMB</span> - Shoot</p>
              <p><span className="text-amber-400 font-mono">R</span> - Respawn</p>
              <p><span className="text-amber-400 font-mono">F3</span> - Toggle debug overlay</p>
              <p><span className="text-amber-400 font-mono">ESC</span> - Release cursor</p>
            </div>

            <button
              onClick={requestPointerLock}
              className="px-6 py-3 bg-amber-500 hover:bg-amber-400 text-black font-bold rounded-lg transition-colors"
            >
              Click to Play
            </button>
            
            {characterLoaded && (
              <p className="text-green-400 text-xs mt-4">✓ Character model loaded</p>
            )}
          </div>
        </div>
      )}

      {/* Debug HUD */}
      <div className="absolute top-4 left-4 bg-black/90 backdrop-blur-sm p-4 rounded-xl border border-white/10 text-xs font-mono text-gray-400 min-w-[280px]">
        <p className="text-amber-400 font-bold mb-2">Debug Info</p>
        <p>FPS: <span className={debugInfo.fps >= 55 ? 'text-green-400' : 'text-yellow-400'}>{debugInfo.fps}</span></p>
        <p>Pos: <span className="text-cyan-400">{debugInfo.position.x}, {debugInfo.position.y}, {debugInfo.position.z}</span></p>
        <p>Vel: <span className="text-purple-400">{debugInfo.velocity.x}, {debugInfo.velocity.y}, {debugInfo.velocity.z}</span></p>
        <p>Grounded: <span className={debugInfo.isGrounded ? 'text-green-400' : 'text-red-400'}>{debugInfo.isGrounded ? 'Yes' : 'No'}</span></p>
        <p>Pointer: <span className={debugInfo.pointerLocked ? 'text-green-400' : 'text-gray-500'}>{debugInfo.pointerLocked ? 'Locked' : 'Free'}</span></p>
        <p>Collisions: <span className={debugInfo.collisionCount > 0 ? 'text-orange-400' : 'text-gray-500'}>{debugInfo.collisionCount}</span></p>
        <p>Debug Overlay: <span className={showDebugOverlay ? 'text-green-400' : 'text-gray-500'}>{showDebugOverlay ? 'ON' : 'OFF'}</span></p>
        
        <div className="border-t border-white/10 mt-2 pt-2">
          <p className="text-amber-400 font-bold mb-1">Combat</p>
          <p>Health: <span className={debugInfo.health > 50 ? 'text-green-400' : debugInfo.health > 25 ? 'text-yellow-400' : 'text-red-400'}>{debugInfo.health}</span></p>
          <p>Ammo: <span className="text-cyan-400">{debugInfo.ammo}</span></p>
        </div>
      </div>

      {/* ESC hint */}
      {debugInfo.pointerLocked && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-gray-500 text-xs">
          Press ESC to release cursor | F3 for debug overlay | R to respawn
        </div>
      )}
    </div>
  )
}
