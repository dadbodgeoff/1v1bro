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
import '@/arena/maps/definitions' // Register maps
import { Vector3 } from '@/arena/math/Vector3'
import { Capsule } from '@/arena/physics/Capsule'
import { PLAYER_HITBOX, BOT_HITBOX, getEyePosition } from '@/arena/game/CharacterHitbox'
import { arenaCharacterLoader } from '@/arena/player/ArenaCharacterLoader'
import { FORBIDDEN_ARENA_SKIN } from '@/arena/player/ArenaCharacterConfig'
import { WeaponBuilder, setupWeaponCamera } from '@/arena/player/WeaponBuilder'
import { ProjectileParticles } from '@/arena/effects/ProjectileParticles'
import type { LoadedCharacter } from '@/arena/player/ArenaCharacterLoader'
import type { PlayerPhysicsState } from '@/arena/physics/Physics3D'
import type { LoadedMap } from '@/arena/maps/MapLoader'
import { BotPlayer, getPersonalityDisplayInfo, getDifficultyDisplayInfo } from '@/arena/bot'
import type { BotPersonalityType, DifficultyLevel } from '@/arena/bot'
import {
  AnimationLOD,
  DrawCallMonitor,
  optimizeRenderOrder,
} from '@/arena/rendering/PerformanceOptimizer'

// Import types from extracted UI components
import { DEFAULT_DEBUG_INFO } from '@/arena/ui'
import type { ArenaDebugInfo } from '@/arena/ui'

// Use ArenaDebugInfo type from extracted component
type DebugInfo = ArenaDebugInfo

const LOCAL_PLAYER_ID = 1
const BOT_PLAYER_ID = 999
const DEFAULT_MAP_ID = 'abandoned_terminal'

export default function ArenaPlayTest() {
  const containerRef = useRef<HTMLDivElement>(null)
  const [debugInfo, setDebugInfo] = useState<DebugInfo>(DEFAULT_DEBUG_INFO)
  const [showInstructions, setShowInstructions] = useState(true)
  const [characterLoaded, setCharacterLoaded] = useState(false)
  const [showDebugOverlay, setShowDebugOverlay] = useState(false)
  const [mapLoading, setMapLoading] = useState(true)
  const [mapLoadProgress, setMapLoadProgress] = useState(0)
  const [mapLoadError, setMapLoadError] = useState<string | null>(null)
  const [botEnabled, setBotEnabled] = useState(true)
  const [botPersonality, setBotPersonality] = useState<BotPersonalityType>('duelist')
  const [botDifficulty, setBotDifficulty] = useState<DifficultyLevel>('medium')

  const requestPointerLock = useCallback(() => {
    // Request pointer lock on the canvas element (not the container div)
    // InputManager checks against the canvas it was initialized with
    const canvas = containerRef.current?.querySelector('canvas')
    canvas?.requestPointerLock()
  }, [])

  useEffect(() => {
    if (!containerRef.current) return

    let cleanup: (() => void) | null = null
    let currentLoadedMap: LoadedMap | null = null
    const mapLoader = new MapLoader()

    // Load map and initialize game
    const initGame = async () => {
      if (!containerRef.current) return

      setMapLoading(true)
      setMapLoadError(null)

      // Load map using MapLoader
      const mapResult = await mapLoader.load(DEFAULT_MAP_ID, (progress) => {
        setMapLoadProgress(Math.round((progress.loaded / progress.total) * 100))
      })

      if (!mapResult.ok) {
        setMapLoadError(mapResult.error.message)
        setMapLoading(false)
        return
      }

      const loadedMap = mapResult.value
      currentLoadedMap = loadedMap
      setMapLoading(false)

      // === CORE SYSTEMS ===
      const eventBus = new EventBus()
      
      // Collision world - load from map definition
      const collisionWorld = new CollisionWorld(4)
      const loadResult = collisionWorld.loadManifest(loadedMap.definition.collisionManifest)
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

      // Spawn system - load from map definition
      const spawnSystem = new SpawnSystem(eventBus)
      spawnSystem.loadManifest(loadedMap.definition.spawnManifest)
      spawnSystem.setCurrentTime(performance.now())

      // Get initial spawn point
      const initialSpawn = spawnSystem.selectSpawnPoint(LOCAL_PLAYER_ID, [])
      let playerState: PlayerPhysicsState = createInitialPhysicsState(initialSpawn.position)

      // Combat system
      const combatSystem = new CombatSystem(DEFAULT_COMBAT_CONFIG, collisionWorld, eventBus)
      combatSystem.initializePlayer(LOCAL_PLAYER_ID)

      // === BOT SETUP ===
      let bot: BotPlayer | null = null
      let botMesh: THREE.Mesh | null = null
      let playerScore = 0
      let lastBotFireTime = 0
      const BOT_FIRE_RATE = 3 // shots per second (much slower than player)
      const BOT_FIRE_INTERVAL = 1000 / BOT_FIRE_RATE // ms between shots
      const botAnimLOD = new AnimationLOD() // Animation LOD for performance
      
      // Smooth movement interpolation for bot - human-like motion
      // Visual position lerps toward logical position for smooth movement
      const botVisualPos = new THREE.Vector3(0, 0, 0)
      const botVisualVel = new THREE.Vector3(0, 0, 0) // Velocity for momentum
      let botVisualRotY = 0
      
      // Movement feel tuning - lower = smoother/more human, higher = snappier/robotic
      const BOT_POSITION_LERP = 6    // Position smoothing (was 12, now more human)
      const BOT_ROTATION_LERP = 5    // Rotation smoothing (was 10, smoother turns)
      const BOT_ACCELERATION = 8    // How fast bot accelerates (units/sec²)
      const BOT_DECELERATION = 12   // How fast bot decelerates (higher = stops faster)
      const BOT_MAX_SPEED = 5.0     // Max visual speed cap
      
      // Performance tracking for debug HUD
      let frameTimeHistory: number[] = []
      let lastFrameStart = performance.now()
      let gcPauseEstimate = 0
      let worstFrameTime = 0
      let physicsTime = 0
      let renderTime = 0
      let botUpdateTime = 0
      
      const initBot = () => {
        if (!botEnabled) return
        
        // Create bot
        bot = new BotPlayer({
          playerId: BOT_PLAYER_ID,
          personality: botPersonality,
          difficulty: botDifficulty,
        })
        
        // Initialize bot in combat system
        combatSystem.initializePlayer(BOT_PLAYER_ID)
        
        // Spawn bot at a spawn point away from player
        const botSpawn = spawnSystem.selectSpawnPoint(BOT_PLAYER_ID, [playerState.position])
        let spawnPos = botSpawn.position
        
        // Safe spawn positions to try (on platforms, away from obstacles)
        const safeSpawns = [
          spawnPos, // Try selected spawn first
          new Vector3(-8, 0.5, 0),   // West platform center
          new Vector3(8, 0.5, 0),    // East platform center
          new Vector3(-8, 0.5, 8),   // West platform south
          new Vector3(8, 0.5, -8),   // East platform north
          new Vector3(-8, 0.5, -8),  // West platform north
          new Vector3(8, 0.5, 8),    // East platform south
        ]
        
        // Find first non-colliding spawn
        let foundSafe = false
        for (const testPos of safeSpawns) {
          const testCapsule = new Capsule(
            new Vector3(testPos.x, testPos.y, testPos.z),
            BOT_HITBOX.radius,
            BOT_HITBOX.height
          )
          const spawnCollisions = collisionWorld.testCapsule(testCapsule)
          if (spawnCollisions.length === 0) {
            spawnPos = testPos
            foundSafe = true
            break
          }
        }
        
        if (!foundSafe) {
          console.warn(`[ArenaPlayTest] All spawn positions collide! Using center of arena`)
          spawnPos = new Vector3(0, 0.5, 0)
        }
        
        bot.setPosition(spawnPos)
        
        // Initialize visual position to spawn position (no lerp on first frame)
        botVisualPos.set(spawnPos.x, spawnPos.y + 0.9, spawnPos.z)
        botVisualRotY = 0
        
        // Create bot visual - use Forbidden skin character model
        // Start with a placeholder capsule while loading
        const botGeometry = new THREE.CapsuleGeometry(0.4, 1.0, 4, 8)
        const botMaterial = new THREE.MeshStandardMaterial({ 
          color: 0xff4444,
          emissive: 0x331111,
          roughness: 0.7,
        })
        botMesh = new THREE.Mesh(botGeometry, botMaterial)
        botMesh.name = 'bot'
        botMesh.castShadow = true
        arenaScene.scene.add(botMesh)
        
        // Load bot character model directly from Supabase (meshopt-compressed Run_and_Shoot animation)
        const botModelUrl = 'https://ikbshpdvvkydbpirbahl.supabase.co/storage/v1/object/public/arena-assets/animations/Run_and_Shoot_withSkin.glb'
        
        import('three/examples/jsm/loaders/GLTFLoader.js').then(({ GLTFLoader }) => {
          import('three/examples/jsm/libs/meshopt_decoder.module.js').then(({ MeshoptDecoder }) => {
            const loader = new GLTFLoader()
            loader.setMeshoptDecoder(MeshoptDecoder)
            
            loader.load(botModelUrl, (gltf) => {
              if (!botMesh) return
              
              const botCharModel = gltf.scene
              console.log(`[Bot] Loaded model with ${gltf.animations.length} animations`)
              
              // Calculate bounding box to determine proper scale
              const bbox = new THREE.Box3().setFromObject(botCharModel)
              const size = new THREE.Vector3()
              bbox.getSize(size)
              console.log(`[Bot] Raw model size: ${size.x.toFixed(2)} x ${size.y.toFixed(2)} x ${size.z.toFixed(2)}`)
              
              // Scale to ~1.8m tall (human height)
              const targetHeight = 1.8
              const scaleFactor = targetHeight / size.y
              botCharModel.scale.set(scaleFactor, scaleFactor, scaleFactor)
              
              // Recalculate after scaling
              const bboxScaled = new THREE.Box3().setFromObject(botCharModel)
              const sizeScaled = new THREE.Vector3()
              bboxScaled.getSize(sizeScaled)
              const modelMinY = bboxScaled.min.y
              console.log(`[Bot] Scaled: ${sizeScaled.y.toFixed(2)}m tall, minY: ${modelMinY.toFixed(2)}`)
              
              // Position model so feet are at ground level
              botCharModel.position.y = -modelMinY - 0.9
              
              // Make bot HIGHLY visible with strong red glow
              // Emissive is free - no extra lighting calculations
              botCharModel.traverse((child) => {
                if (child instanceof THREE.Mesh && child.material) {
                  const mat = child.material as THREE.MeshStandardMaterial
                  // Bright red base color
                  if (mat.color) mat.color.setHex(0xff6666)
                  // Strong emissive glow - visible across the map
                  if (mat.emissive) {
                    mat.emissive.setHex(0xff2222) // Bright red glow
                    mat.emissiveIntensity = 0.8 // Strong glow (was 0.3)
                  } else {
                    // Force emissive if not present
                    mat.emissive = new THREE.Color(0xff2222)
                    mat.emissiveIntensity = 0.8
                  }
                  mat.envMapIntensity = 2.0 // Boost reflections
                  
                  // Performance: disable shadow casting on skinned mesh
                  child.castShadow = false
                  child.receiveShadow = true
                }
              })
              
              // Setup animation
              const mixer = new THREE.AnimationMixer(botCharModel)
              if (gltf.animations.length > 0) {
                const action = mixer.clipAction(gltf.animations[0])
                action.play()
                console.log(`[Bot] Playing animation: ${gltf.animations[0].name}`)
              }
              
              // Store for game loop updates
              botMesh.userData.characterModel = botCharModel
              botMesh.userData.mixer = mixer
              
              // Add to scene and hide capsule
              botMesh.add(botCharModel)
              botMesh.geometry.dispose()
              botMesh.geometry = new THREE.BufferGeometry()
              ;(botMesh.material as THREE.Material).visible = false
              
              console.log('[Bot] Character model loaded and added to scene')
            }, undefined, (err) => {
              console.warn('[Bot] Failed to load model:', err)
            })
          })
        })
        
        const finalPos = bot.getPosition()
        console.log(`[ArenaPlayTest] Bot spawned: ${bot.getPersonality().displayName} (${botDifficulty}) at (${finalPos.x.toFixed(2)}, ${finalPos.y.toFixed(2)}, ${finalPos.z.toFixed(2)})`)
      }

      // Debug overlay
      const debugOverlay = new DebugOverlay({
        ...DEFAULT_DEBUG_CONFIG,
        enabled: false,
      })

      // === SCENE SETUP ===
      const arenaScene = new ArenaScene(loadedMap)
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

    containerRef.current!.appendChild(arenaRenderer.renderer.domElement)
    arenaRenderer.setSize(window.innerWidth, window.innerHeight)
    arenaRenderer.initialize(arenaScene.scene, camera)
    arenaScene.generateEnvMap(arenaRenderer.renderer)
    
    // GPU warm-up: compile all shaders before gameplay starts
    arenaRenderer.renderer.compile(arenaScene.scene, camera)
    
    // Optimize render order to minimize GPU state changes
    optimizeRenderOrder(arenaScene.scene)
    
    // Draw call monitor for performance tracking
    const drawCallMonitor = new DrawCallMonitor()

    // === INPUT MANAGER ===
    const inputManager = new InputManager(DEFAULT_INPUT_CONFIG, eventBus)
    inputManager.initialize(arenaRenderer.renderer.domElement as HTMLCanvasElement)

    // === HUD RENDERER ===
    const hudRenderer = new HUDRenderer(DEFAULT_HUD_CONFIG, eventBus)
    hudRenderer.initialize(containerRef.current!)
    hudRenderer.setLocalPlayerId(LOCAL_PLAYER_ID)

    // === AUDIO SYSTEM ===
    const audioSystem = new AudioSystem(DEFAULT_AUDIO_CONFIG, eventBus)
    audioSystem.initialize().catch(err => console.warn('Audio init failed:', err))
    audioSystem.setLocalPlayerId(LOCAL_PLAYER_ID)

    // === WEAPON SYSTEM ===
    const weaponBuilder = new WeaponBuilder()
    const weaponSystem = setupWeaponCamera(
      arenaRenderer.renderer,
      arenaScene.scene,
      camera,
      weaponBuilder
    )
    
    // Load default weapon (AK-47)
    weaponBuilder.equipWeapon('ak-47').catch(err => {
      console.warn('[ArenaPlayTest] Failed to load weapon:', err)
    })

    // === PROJECTILE PARTICLES ===
    const projectileParticles = new ProjectileParticles(arenaScene.scene)
    let currentWeaponType: 'bullet' | 'plasma' = 'bullet'
    
    // === AMMO & FIRE RATE TRACKING ===
    let currentAmmo = 30
    let maxAmmo = 30
    let lastFireTime = 0
    let isReloading = false
    let reloadStartTime = 0
    let reloadDuration = 2.5 // seconds

    // === CHARACTER LOADING ===
    // Use Forbidden skin for player character
    let character: LoadedCharacter | null = null
    let characterMesh: THREE.Group | null = null

    arenaCharacterLoader.loadEssentials(FORBIDDEN_ARENA_SKIN).then((loadedChar) => {
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
      console.log('[ArenaPlayTest] Loaded Forbidden skin for player')
    }).catch((err) => {
      console.warn('[ArenaPlayTest] Failed to load Forbidden skin, falling back to default:', err)
      // Fallback to default skin
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
      }).catch((fallbackErr) => {
        console.warn('[ArenaPlayTest] Failed to load fallback character:', fallbackErr)
      })
    })

    // Initialize bot after scene is ready
    initBot()

    // === DEBUG VISUALIZATION ===
    const debugLines: THREE.LineSegments[] = []
    
    function createDebugVisualization() {
      // Clear existing
      debugLines.forEach(line => arenaScene.scene.remove(line))
      debugLines.length = 0
      
      if (!debugOverlay.isEnabled() || !currentLoadedMap) return
      
      // Draw collision AABBs from loaded map
      currentLoadedMap.definition.collisionManifest.colliders.forEach(collider => {
        const geometry = new THREE.BoxGeometry(...collider.size)
        const edges = new THREE.EdgesGeometry(geometry)
        const material = new THREE.LineBasicMaterial({ color: 0x00ff00, transparent: true, opacity: 0.5 })
        const line = new THREE.LineSegments(edges, material)
        line.position.set(...collider.center)
        arenaScene.scene.add(line)
        debugLines.push(line)
      })
      
      // Draw spawn points from loaded map
      currentLoadedMap.definition.spawnManifest.spawnPoints.forEach(spawn => {
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
      
      const frameStart = performance.now()
      const now = frameStart
      const deltaTime = Math.min((now - lastTime) / 1000, 0.1)
      lastTime = now
      tickNumber++
      
      // Track frame time for performance analysis
      const lastFrameDuration = frameStart - lastFrameStart
      lastFrameStart = frameStart
      frameTimeHistory.push(lastFrameDuration)
      if (frameTimeHistory.length > 60) frameTimeHistory.shift()
      
      // Detect GC pauses (frame > 50ms is likely GC)
      if (lastFrameDuration > 50) {
        gcPauseEstimate = lastFrameDuration
      }
      
      // Track worst frame in last second
      if (tickNumber % 60 === 0) {
        worstFrameTime = Math.max(...frameTimeHistory)
      }

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

      // Physics step (timed)
      const physicsStart = performance.now()
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
      physicsTime = performance.now() - physicsStart

      // Handle reload progress
      if (isReloading) {
        const reloadProgress = (now - reloadStartTime) / 1000
        if (reloadProgress >= reloadDuration) {
          // Reload complete
          isReloading = false
          currentAmmo = maxAmmo
          audioSystem.playUISound('spawn') // Reload complete sound
        }
      }
      
      // Check for automatic respawn (3 second delay after death)
      const playersReadyToRespawn = combatSystem.update(now)
      if (playersReadyToRespawn.includes(LOCAL_PLAYER_ID)) {
        const spawn = spawnSystem.selectSpawnPoint(LOCAL_PLAYER_ID, [])
        playerState = createInitialPhysicsState(spawn.position)
        combatSystem.respawnPlayer(LOCAL_PLAYER_ID, now)
        audioSystem.playUISound('spawn')
        // Reset ammo on respawn
        currentAmmo = maxAmmo
        isReloading = false
      }

      // Handle shooting with fire rate and ammo
      const isFiring = (inputPacket.buttons & 0x02) !== 0
      const currentWeapon = weaponBuilder.getCurrentWeapon()
      const fireInterval = currentWeapon ? 1000 / currentWeapon.fireRate : 100 // ms between shots
      const canFire = !isReloading && currentAmmo > 0 && (now - lastFireTime) >= fireInterval
      
      if (isFiring && inputManager.isPointerLocked() && canFire) {
        const combatState = combatSystem.getPlayerState(LOCAL_PLAYER_ID)
        if (combatState && !combatState.isDead) {
          // Consume ammo
          currentAmmo--
          lastFireTime = now
          
          const eyePos = getEyePosition(
            new Vector3(playerState.position.x, playerState.position.y, playerState.position.z),
            PLAYER_HITBOX
          )
          const forward = cameraController.getForwardVector()
          const direction = new Vector3(forward.x, forward.y, forward.z)
          
          // Create player capsules map - include bot if alive
          const playerCapsules = new Map<number, Capsule>()
          if (bot && !bot.getState().isDead) {
            const botPos = bot.getPosition()
            playerCapsules.set(BOT_PLAYER_ID, new Capsule(
              new Vector3(botPos.x, botPos.y, botPos.z),
              BOT_HITBOX.radius,
              BOT_HITBOX.height
            ))
          }
          
          const fireResult = combatSystem.processFire(
            {
              playerId: LOCAL_PLAYER_ID,
              origin: eyePos,
              direction,
              clientTimestamp: now,
            },
            playerCapsules,
            now
          )
          
          // Check if we hit the bot
          if (fireResult.ok && fireResult.value && fireResult.value.targetId === BOT_PLAYER_ID && bot) {
            bot.applyDamage(fireResult.value.damage, LOCAL_PLAYER_ID)
            
            // Check if bot died
            if (bot.getState().isDead) {
              playerScore++
              audioSystem.playUISound('spawn') // Use spawn sound for kill notification
            }
          }
          
          // Play gunshot sound and trigger weapon recoil
          audioSystem.playSound('gunshot', eyePos)
          weaponBuilder.triggerRecoil()
          
          // Spawn projectile particles
          projectileParticles.spawnProjectile({
            type: currentWeaponType,
            origin: new THREE.Vector3(eyePos.x, eyePos.y, eyePos.z),
            direction: new THREE.Vector3(direction.x, direction.y, direction.z),
            speed: 50,
          })
          
          // Auto-reload when empty
          if (currentAmmo === 0 && !isReloading) {
            isReloading = true
            reloadStartTime = now
            reloadDuration = currentWeapon?.reloadTime ?? 2.5
            weaponBuilder.startReload()
          }
        }
      }

      // Update combat system
      combatSystem.update(now)

      // === BOT UPDATE ===
      const botUpdateStart = performance.now()
      if (bot && botMesh) {
        const botState = bot.getState()
        const realTime = Date.now() // Bot uses Date.now() for respawn timing
        
        // Check bot respawn
        if (bot.checkRespawn(realTime)) {
          const botSpawn = spawnSystem.selectSpawnPoint(BOT_PLAYER_ID, [playerState.position])
          bot.respawn(botSpawn.position)
          // Reset visual position to respawn point (no lerp teleport)
          botVisualPos.set(botSpawn.position.x, botSpawn.position.y + 0.9, botSpawn.position.z)
          combatSystem.respawnPlayer(BOT_PLAYER_ID, now)
        }
        
        if (!botState.isDead) {
          // Get current bot position before AI update
          const botPosBefore = bot.getPosition()
          const playerPos = playerState.position
          
          // Calculate distance to player
          const distance = Math.sqrt(
            (botPosBefore.x - playerPos.x) ** 2 +
            (botPosBefore.y - playerPos.y) ** 2 +
            (botPosBefore.z - playerPos.z) ** 2
          )
          
          // Check line of sight with raycast (not just distance)
          const botEyeHeight = botPosBefore.y + BOT_HITBOX.eyeHeight
          const playerEyeHeight = playerPos.y + PLAYER_HITBOX.eyeHeight
          const toPlayerDir = new Vector3(
            playerPos.x - botPosBefore.x,
            playerEyeHeight - botEyeHeight,
            playerPos.z - botPosBefore.z
          ).normalize()
          
          const losRaycast = collisionWorld.raycast(
            new Vector3(botPosBefore.x, botEyeHeight, botPosBefore.z),
            toPlayerDir,
            distance + 1
          )
          
          // Player is visible only if no wall blocks line of sight
          const playerVisible = distance < 30 && (!losRaycast || losRaycast.distance > distance)
          
          // Update bot AI - but DON'T let it update position directly
          // We'll handle movement ourselves with collision
          const playerCombatState = combatSystem.getPlayerState(LOCAL_PLAYER_ID)
          const botOutput = bot.update(deltaTime * 1000, {
            playerPosition: playerState.position,
            playerVelocity: playerState.velocity,
            playerHealth: playerCombatState?.health ?? 100,
            playerVisible,
            playerScore,
            timeRemaining: 180,
            matchDuration: 180,
            coverPositions: [],
            mapBounds: {
              min: new THREE.Vector3(-20, 0, -30),
              max: new THREE.Vector3(20, 10, 30),
            },
          })
          
          // === BOT PHYSICS: Apply movement with collision ===
          // Get the movement the AI wants to do
          const moveDir = botOutput.moveDirection
          const moveSpeed = botOutput.moveSpeed * 5.0 // 5.0 is bot max speed
          
          // Calculate desired movement this frame
          const moveX = moveDir.x * moveSpeed * deltaTime
          const moveZ = moveDir.z * moveSpeed * deltaTime
          
          // Start from position before AI update
          let finalX = botPosBefore.x
          let finalZ = botPosBefore.z
          
          // Check if bot is currently stuck in collision
          const currentCapsule = new Capsule(
            new Vector3(botPosBefore.x, botPosBefore.y, botPosBefore.z),
            BOT_HITBOX.radius,
            BOT_HITBOX.height
          )
          const currentCollisions = collisionWorld.testCapsule(currentCapsule)
          const isStuck = currentCollisions.length > 0
          
          // Only do collision if there's actual movement
          if (Math.abs(moveX) > 0.0001 || Math.abs(moveZ) > 0.0001) {
            if (isStuck) {
              // Bot is stuck - allow movement to escape (skip collision check)
              finalX = botPosBefore.x + moveX
              finalZ = botPosBefore.z + moveZ
              console.log(`[Bot] STUCK in ${currentCollisions.length} colliders, allowing escape movement`)
            } else {
              // Normal collision detection
              // Try full movement first
              const testFull = new Capsule(
                new Vector3(botPosBefore.x + moveX, botPosBefore.y, botPosBefore.z + moveZ),
                BOT_HITBOX.radius,
                BOT_HITBOX.height
              )
              const collisionsFull = collisionWorld.testCapsule(testFull)
              
              if (collisionsFull.length === 0) {
                // No collision - apply full movement
                finalX = botPosBefore.x + moveX
                finalZ = botPosBefore.z + moveZ
              } else {
                // Collision - try sliding along walls
                // Try X only
                const testX = new Capsule(
                  new Vector3(botPosBefore.x + moveX, botPosBefore.y, botPosBefore.z),
                  BOT_HITBOX.radius,
                  BOT_HITBOX.height
                )
                if (collisionWorld.testCapsule(testX).length === 0) {
                  finalX = botPosBefore.x + moveX
                }
                
                // Try Z only
                const testZ = new Capsule(
                  new Vector3(botPosBefore.x, botPosBefore.y, botPosBefore.z + moveZ),
                  BOT_HITBOX.radius,
                  BOT_HITBOX.height
                )
                if (collisionWorld.testCapsule(testZ).length === 0) {
                  finalZ = botPosBefore.z + moveZ
                }
              }
            }
          }
          
          // Update bot position with collision-corrected values
          bot.setPosition(new Vector3(finalX, botPosBefore.y, finalZ))
          
          // Get final bot position after collision (this is the TARGET position)
          const newBotPos = bot.getPosition()
          const targetX = newBotPos.x
          const targetY = newBotPos.y + 0.9
          const targetZ = newBotPos.z
          
          // Human-like movement with acceleration/deceleration
          // Calculate direction to target
          const toTargetX = targetX - botVisualPos.x
          const toTargetZ = targetZ - botVisualPos.z
          const distToTarget = Math.sqrt(toTargetX * toTargetX + toTargetZ * toTargetZ)
          
          if (distToTarget > 0.01) {
            // Normalize direction
            const dirX = toTargetX / distToTarget
            const dirZ = toTargetZ / distToTarget
            
            // Accelerate toward target
            const accel = BOT_ACCELERATION * deltaTime
            botVisualVel.x += dirX * accel
            botVisualVel.z += dirZ * accel
            
            // Clamp to max speed
            const currentSpeed = Math.sqrt(botVisualVel.x ** 2 + botVisualVel.z ** 2)
            if (currentSpeed > BOT_MAX_SPEED) {
              const scale = BOT_MAX_SPEED / currentSpeed
              botVisualVel.x *= scale
              botVisualVel.z *= scale
            }
            
            // Apply velocity
            botVisualPos.x += botVisualVel.x * deltaTime
            botVisualPos.z += botVisualVel.z * deltaTime
            
            // Smooth lerp for final approach (prevents overshooting)
            const lerpFactor = 1 - Math.exp(-BOT_POSITION_LERP * deltaTime)
            botVisualPos.x += (targetX - botVisualPos.x) * lerpFactor * 0.3
            botVisualPos.z += (targetZ - botVisualPos.z) * lerpFactor * 0.3
          } else {
            // Close enough - decelerate
            const decel = BOT_DECELERATION * deltaTime
            const speed = Math.sqrt(botVisualVel.x ** 2 + botVisualVel.z ** 2)
            if (speed > decel) {
              const scale = (speed - decel) / speed
              botVisualVel.x *= scale
              botVisualVel.z *= scale
            } else {
              botVisualVel.x = 0
              botVisualVel.z = 0
            }
          }
          
          // Y position just lerps (no physics needed for vertical)
          const yLerp = 1 - Math.exp(-BOT_POSITION_LERP * deltaTime)
          botVisualPos.y += (targetY - botVisualPos.y) * yLerp
          
          // Apply smoothed position to mesh
          botMesh.position.copy(botVisualPos)
          
          // Update bot character animation mixer if loaded (with LOD)
          if (botMesh.userData.mixer) {
            // Animation LOD: reduce update frequency for distant bots
            if (botAnimLOD.shouldUpdate(distance)) {
              const timeMultiplier = botAnimLOD.getTimeMultiplier(distance)
              botMesh.userData.mixer.update(deltaTime * timeMultiplier)
            }
          }
          
          // Debug: Log bot state every 60 frames
          if (tickNumber % 60 === 0) {
            const actualMove = Math.sqrt((finalX - botPosBefore.x) ** 2 + (finalZ - botPosBefore.z) ** 2)
            console.log(`[Bot] State: ${botOutput.currentState}, Visible: ${playerVisible}, Dir: (${moveDir.x.toFixed(2)}, ${moveDir.z.toFixed(2)}) @ ${moveSpeed.toFixed(1)}, Moved: ${actualMove.toFixed(3)}, Pos: (${newBotPos.x.toFixed(1)}, ${newBotPos.z.toFixed(1)})`)
          }
          
          // Calculate target rotation (face aim target or movement direction)
          let targetRotY = botVisualRotY
          if (botOutput.aimTarget) {
            const lookDir = new THREE.Vector3()
              .subVectors(botOutput.aimTarget, botMesh.position)
              .normalize()
            targetRotY = Math.atan2(lookDir.x, lookDir.z)
          } else if (Math.abs(moveDir.x) > 0.01 || Math.abs(moveDir.z) > 0.01) {
            targetRotY = Math.atan2(moveDir.x, moveDir.z)
          }
          
          // Smooth rotation interpolation (handle angle wrapping)
          let rotDiff = targetRotY - botVisualRotY
          // Wrap to [-PI, PI] for shortest rotation path
          while (rotDiff > Math.PI) rotDiff -= Math.PI * 2
          while (rotDiff < -Math.PI) rotDiff += Math.PI * 2
          botVisualRotY += rotDiff * (1 - Math.exp(-BOT_ROTATION_LERP * deltaTime))
          botMesh.rotation.y = botVisualRotY
          
          // Bot shooting - only if player is actually visible (line of sight)
          // Also enforce fire rate limit
          const canBotFire = (now - lastBotFireTime) >= BOT_FIRE_INTERVAL
          
          if (botOutput.shouldShoot && playerVisible && canBotFire) {
            lastBotFireTime = now
            
            const botEyePos = getEyePosition(newBotPos, BOT_HITBOX)
            const toPlayer = new Vector3(
              playerPos.x - newBotPos.x,
              playerPos.y + 1.0 - newBotPos.y - 1.6,
              playerPos.z - newBotPos.z
            ).normalize()
            
            // Raycast to check if bullet would hit a wall first
            const bulletRaycast = collisionWorld.raycast(botEyePos, toPlayer, distance + 1)
            const bulletHitsWall = bulletRaycast && bulletRaycast.distance < distance
            
            if (!bulletHitsWall) {
              // Check if bot hits player (with accuracy based on difficulty and distance)
              // Balanced accuracy: competitive but not oppressive
              const difficultyAccuracy = bot.getDifficulty().accuracyMultiplier
              const distancePenalty = Math.max(0.2, 1 - (distance / 50)) // 20% min at 50m, 100% at 0m
              const baseAccuracy = 0.45 // 45% base hit chance
              const accuracy = baseAccuracy * difficultyAccuracy * distancePenalty
              const hitRoll = Math.random()
              
              if (hitRoll < accuracy && distance < 35) {
                // Hit! Bot damage per shot
                const botDamage = 8
                combatSystem.applyDamage(
                  LOCAL_PLAYER_ID,
                  BOT_PLAYER_ID,
                  botDamage,
                  playerState.position,
                  now
                )
                bot.recordHit(botDamage)
                
                // Check if player died
                const newCombatState = combatSystem.getPlayerState(LOCAL_PLAYER_ID)
                if (newCombatState?.isDead) {
                  bot.addKill()
                }
              } else {
                bot.recordMiss()
              }
            } else {
              // Bullet hit wall
              bot.recordMiss()
            }
            
            // Play bot gunshot sound
            audioSystem.playSound('gunshot', botEyePos)
            
            // Spawn bot projectile
            projectileParticles.spawnProjectile({
              type: 'bullet',
              origin: new THREE.Vector3(botEyePos.x, botEyePos.y, botEyePos.z),
              direction: new THREE.Vector3(toPlayer.x, toPlayer.y, toPlayer.z),
              speed: 50,
            })
          }
        }
        
        // Update bot mesh visibility
        botMesh.visible = !botState.isDead
      }
      botUpdateTime = performance.now() - botUpdateStart

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
        getEyePosition(new Vector3(playerState.position.x, playerState.position.y, playerState.position.z), PLAYER_HITBOX),
        new Vector3(forward.x, forward.y, forward.z),
        Vector3.UP
      )

      // Update camera
      const viewBobOffset = cameraController.getState().viewBobOffset
      camera.position.set(
        playerState.position.x,
        playerState.position.y + PLAYER_HITBOX.eyeHeight + viewBobOffset,
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
      const botCurrentState = bot?.getState()
      hudRenderer.update({
        health: combatState?.health ?? 100,
        maxHealth: 100,
        ammo: currentAmmo,
        maxAmmo: maxAmmo,
        score: playerScore,
        opponentScore: botCurrentState?.score ?? 0,
        rtt: 0,
        showNetworkWarning: false,
        damageIndicators: [],
        hitMarkerActive: false,
        hitMarkerEndTime: 0,
        killFeed: [],
        lowHealthVignetteIntensity: combatState && combatState.health < 30 ? 0.5 : 0,
      }, now)

      // Test collisions for debug
      const testCapsule = new Capsule(
        new Vector3(playerState.position.x, playerState.position.y, playerState.position.z),
        PLAYER_HITBOX.radius,
        PLAYER_HITBOX.height
      )
      const collisions = collisionWorld.testCapsule(testCapsule)

      // Update weapon (bob, recoil recovery) - reuse horizontalSpeed from above
      weaponBuilder.update(deltaTime, horizontalSpeed > 0.1, horizontalSpeed)
      
      // Update projectile particles
      projectileParticles.update(deltaTime)

      // Render world (timed)
      const renderStart = performance.now()
      arenaRenderer.render()
      renderTime = performance.now() - renderStart
      
      // Render weapon on top
      weaponSystem.renderWeapon()

      // Update debug info
      const botState = bot?.getState()
      const botTacticalIntent = bot?.getTacticalDebugSummary()
      
      // Track draw calls for performance monitoring
      drawCallMonitor.update(arenaRenderer.renderer)
      
      // Get memory usage if available
      const memoryMB = (performance as unknown as { memory?: { usedJSHeapSize: number } }).memory
        ? Math.round((performance as unknown as { memory: { usedJSHeapSize: number } }).memory.usedJSHeapSize / 1024 / 1024)
        : undefined
      
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
        ammo: currentAmmo,
        drawCalls: drawCallMonitor.getCurrent(),
        triangles: arenaRenderer.getTriangles(),
        // Performance breakdown
        frameTime: Math.round(frameTimeHistory[frameTimeHistory.length - 1] * 10) / 10,
        worstFrame: Math.round(worstFrameTime * 10) / 10,
        physicsMs: Math.round(physicsTime * 100) / 100,
        renderMs: Math.round(renderTime * 100) / 100,
        botMs: Math.round(botUpdateTime * 100) / 100,
        memoryMB,
        gcWarning: gcPauseEstimate > 30,
        // Bot info
        botHealth: botState?.health,
        botState: botState?.currentState,
        botScore: botState?.score,
        playerScore,
        botTacticalIntent,
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
        // Manual reload (if not full and not already reloading)
        if (currentAmmo < maxAmmo && !isReloading) {
          const weapon = weaponBuilder.getCurrentWeapon()
          isReloading = true
          reloadStartTime = performance.now()
          reloadDuration = weapon?.reloadTime ?? 2.5
          weaponBuilder.startReload()
        }
      }
      if (e.key === 'Escape') {
        // Respawn with Escape when dead
        const combatState = combatSystem.getPlayerState(LOCAL_PLAYER_ID)
        if (combatState?.isDead) {
          const spawn = spawnSystem.selectSpawnPoint(LOCAL_PLAYER_ID, [])
          playerState = createInitialPhysicsState(spawn.position)
          combatSystem.respawnPlayer(LOCAL_PLAYER_ID, performance.now())
          audioSystem.playUISound('spawn')
          // Reset ammo on respawn
          currentAmmo = maxAmmo
          isReloading = false
        }
      }
      // Weapon switching
      if (e.key === '1') {
        weaponBuilder.equipWeapon('ak-47').then(() => {
          const weapon = weaponBuilder.getCurrentWeapon()
          if (weapon) {
            maxAmmo = weapon.magazineSize
            currentAmmo = maxAmmo
            reloadDuration = weapon.reloadTime
            isReloading = false
          }
        })
        currentWeaponType = 'bullet'
      }
      if (e.key === '2') {
        weaponBuilder.equipWeapon('raygun').then(() => {
          const weapon = weaponBuilder.getCurrentWeapon()
          if (weapon) {
            maxAmmo = weapon.magazineSize
            currentAmmo = maxAmmo
            reloadDuration = weapon.reloadTime
            isReloading = false
          }
        })
        currentWeaponType = 'plasma'
      }
      // Bot controls
      if (e.key === 'b' || e.key === 'B') {
        // Toggle bot
        if (bot) {
          // Remove bot
          combatSystem.removePlayer(BOT_PLAYER_ID)
          bot.dispose()
          bot = null
          if (botMesh) {
            arenaScene.scene.remove(botMesh)
            botMesh.geometry.dispose()
            ;(botMesh.material as THREE.Material).dispose()
            botMesh = null
          }
          setBotEnabled(false)
          console.log('[ArenaPlayTest] Bot disabled')
        } else {
          // Re-enable bot
          setBotEnabled(true)
          initBot()
          console.log('[ArenaPlayTest] Bot enabled')
        }
      }
      // Cycle bot personality with P
      if (e.key === 'p' || e.key === 'P') {
        const personalities: BotPersonalityType[] = ['rusher', 'sentinel', 'duelist']
        setBotPersonality(prev => {
          const idx = personalities.indexOf(prev)
          return personalities[(idx + 1) % personalities.length]
        })
      }
      // Cycle bot difficulty with [ and ]
      if (e.key === '[') {
        const difficulties: DifficultyLevel[] = ['easy', 'medium', 'hard', 'adaptive']
        setBotDifficulty(prev => {
          const idx = difficulties.indexOf(prev)
          return difficulties[(idx - 1 + difficulties.length) % difficulties.length]
        })
      }
      if (e.key === ']') {
        const difficulties: DifficultyLevel[] = ['easy', 'medium', 'hard', 'adaptive']
        setBotDifficulty(prev => {
          const idx = difficulties.indexOf(prev)
          return difficulties[(idx + 1) % difficulties.length]
        })
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

      // === CLEANUP FUNCTION ===
      cleanup = () => {
        cancelAnimationFrame(animationId)
        document.removeEventListener('pointerlockchange', handlePointerLockChange)
        document.removeEventListener('keydown', handleKeyDown)
        window.removeEventListener('resize', handleResize)
        
        if (document.pointerLockElement) {
          document.exitPointerLock()
        }
        
        // Cleanup bot
        if (bot) {
          bot.dispose()
          combatSystem.removePlayer(BOT_PLAYER_ID)
        }
        if (botMesh) {
          arenaScene.scene.remove(botMesh)
          botMesh.geometry.dispose()
          ;(botMesh.material as THREE.Material).dispose()
        }
        
        inputManager.dispose()
        hudRenderer.dispose()
        audioSystem.dispose()
        weaponSystem.dispose()
        projectileParticles.dispose()
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
    }

    // Start initialization
    initGame()

    // Return cleanup
    return () => {
      if (cleanup) cleanup()
    }
  }, [])

  return (
    <div className="relative w-full h-screen bg-black">
      <div 
        ref={containerRef} 
        className="w-full h-full cursor-crosshair"
        onClick={requestPointerLock}
      />

      {/* Loading overlay */}
      {mapLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/90">
          <div className="bg-gray-900/90 p-8 rounded-2xl border border-amber-500/30 text-center max-w-md">
            <h1 className="text-2xl font-bold text-amber-400 mb-4">Loading Map...</h1>
            <div className="w-64 h-2 bg-gray-700 rounded-full overflow-hidden mb-4">
              <div 
                className="h-full bg-amber-500 transition-all duration-200"
                style={{ width: `${mapLoadProgress}%` }}
              />
            </div>
            <p className="text-gray-400 text-sm">{mapLoadProgress}%</p>
          </div>
        </div>
      )}

      {/* Error overlay */}
      {mapLoadError && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/90">
          <div className="bg-gray-900/90 p-8 rounded-2xl border border-red-500/30 text-center max-w-md">
            <h1 className="text-2xl font-bold text-red-400 mb-4">Failed to Load Map</h1>
            <p className="text-gray-300 mb-4">{mapLoadError}</p>
            <button
              onClick={() => window.location.reload()}
              className="px-6 py-3 bg-red-500 hover:bg-red-400 text-white font-bold rounded-lg transition-colors"
            >
              Retry
            </button>
          </div>
        </div>
      )}

      {/* Instructions overlay */}
      {showInstructions && !mapLoading && !mapLoadError && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/70 backdrop-blur-sm">
          <div className="bg-gray-900/90 p-8 rounded-2xl border border-amber-500/30 text-center max-w-md">
            <h1 className="text-2xl font-bold text-amber-400 mb-4">Arena Play Test</h1>
            <p className="text-gray-300 mb-6">Full arena test with physics, combat, audio, and AI bot</p>
            
            {botEnabled && (
              <div className="bg-red-900/30 border border-red-500/30 rounded-lg p-3 mb-4">
                <p className="text-red-400 text-sm font-bold">🤖 Bot Active</p>
                <p className="text-gray-400 text-xs">
                  {getPersonalityDisplayInfo(botPersonality).name} ({getDifficultyDisplayInfo(botDifficulty).name})
                </p>
              </div>
            )}
            
            <div className="text-left text-sm text-gray-400 space-y-2 mb-6">
              <p><span className="text-amber-400 font-mono">WASD</span> - Move</p>
              <p><span className="text-amber-400 font-mono">Mouse</span> - Look around</p>
              <p><span className="text-amber-400 font-mono">Space</span> - Jump</p>
              <p><span className="text-amber-400 font-mono">LMB</span> - Shoot</p>
              <p><span className="text-amber-400 font-mono">1</span> - AK-47</p>
              <p><span className="text-amber-400 font-mono">2</span> - Raygun</p>
              <p><span className="text-amber-400 font-mono">R</span> - Respawn</p>
              <p><span className="text-amber-400 font-mono">B</span> - Toggle bot</p>
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
        <p className="text-amber-400 font-bold mb-2">Performance</p>
        <p>FPS: <span className={debugInfo.fps >= 55 ? 'text-green-400' : debugInfo.fps >= 30 ? 'text-yellow-400' : 'text-red-400'}>{debugInfo.fps}</span>
          {debugInfo.gcWarning && <span className="text-red-500 ml-2">⚠ GC</span>}
        </p>
        <p>Frame: <span className={(debugInfo.frameTime ?? 0) < 20 ? 'text-green-400' : 'text-yellow-400'}>{debugInfo.frameTime ?? 0}ms</span>
          <span className="text-gray-500 ml-1">(worst: {debugInfo.worstFrame ?? 0}ms)</span>
        </p>
        <p>Draw Calls: <span className={(debugInfo.drawCalls ?? 0) < 100 ? 'text-green-400' : 'text-yellow-400'}>{debugInfo.drawCalls ?? 0}</span></p>
        <p>Triangles: <span className="text-blue-400">{((debugInfo.triangles ?? 0) / 1000).toFixed(1)}k</span></p>
        {debugInfo.memoryMB && <p>Memory: <span className={debugInfo.memoryMB < 200 ? 'text-green-400' : 'text-yellow-400'}>{debugInfo.memoryMB}MB</span></p>}
        
        <div className="border-t border-white/10 mt-2 pt-2">
          <p className="text-amber-400 font-bold mb-1">Frame Breakdown</p>
          <p>Physics: <span className={(debugInfo.physicsMs ?? 0) < 2 ? 'text-green-400' : 'text-yellow-400'}>{debugInfo.physicsMs ?? 0}ms</span></p>
          <p>Bot AI: <span className={(debugInfo.botMs ?? 0) < 2 ? 'text-green-400' : 'text-yellow-400'}>{debugInfo.botMs ?? 0}ms</span></p>
          <p>Render: <span className={(debugInfo.renderMs ?? 0) < 8 ? 'text-green-400' : 'text-yellow-400'}>{debugInfo.renderMs ?? 0}ms</span></p>
        </div>
        
        <div className="border-t border-white/10 mt-2 pt-2">
          <p className="text-amber-400 font-bold mb-1">Player</p>
          <p>Pos: <span className="text-cyan-400">{debugInfo.position.x}, {debugInfo.position.y}, {debugInfo.position.z}</span></p>
          <p>Vel: <span className="text-purple-400">{debugInfo.velocity.x}, {debugInfo.velocity.y}, {debugInfo.velocity.z}</span></p>
          <p>Grounded: <span className={debugInfo.isGrounded ? 'text-green-400' : 'text-red-400'}>{debugInfo.isGrounded ? 'Yes' : 'No'}</span></p>
          <p>Collisions: <span className={debugInfo.collisionCount > 0 ? 'text-orange-400' : 'text-gray-500'}>{debugInfo.collisionCount}</span></p>
        </div>
        
        <p className="text-gray-500 mt-2">Debug Overlay: <span className={showDebugOverlay ? 'text-green-400' : 'text-gray-500'}>{showDebugOverlay ? 'ON (F3)' : 'OFF (F3)'}</span></p>
        
        <div className="border-t border-white/10 mt-2 pt-2">
          <p className="text-amber-400 font-bold mb-1">Combat</p>
          <p>Health: <span className={debugInfo.health > 50 ? 'text-green-400' : debugInfo.health > 25 ? 'text-yellow-400' : 'text-red-400'}>{debugInfo.health}</span></p>
          <p>Ammo: <span className="text-cyan-400">{debugInfo.ammo}</span></p>
        </div>
        
        {botEnabled && debugInfo.botHealth !== undefined && (
          <div className="border-t border-white/10 mt-2 pt-2">
            <p className="text-red-400 font-bold mb-1">Bot ({botPersonality})</p>
            <p>Health: <span className={debugInfo.botHealth > 50 ? 'text-green-400' : debugInfo.botHealth > 25 ? 'text-yellow-400' : 'text-red-400'}>{debugInfo.botHealth}</span></p>
            <p>State: <span className="text-purple-400">{debugInfo.botState}</span></p>
            <p>Score: <span className="text-red-400">{debugInfo.botScore}</span> vs <span className="text-green-400">{debugInfo.playerScore}</span></p>
          </div>
        )}

        {/* Bot Tactical Intent ("Thought Bubble") */}
        {botEnabled && debugInfo.botTacticalIntent && (
          <div className="border-t border-white/10 mt-2 pt-2">
            <p className="text-cyan-400 font-bold mb-1">🧠 Bot Intent</p>
            {debugInfo.botTacticalIntent.mercyActive && (
              <p className="text-blue-400 font-bold">⚡ MERCY ACTIVE</p>
            )}
            {debugInfo.botTacticalIntent.laneName ? (
              <>
                <p className={debugInfo.botTacticalIntent.laneType === 'push' ? 'text-green-400' : 'text-orange-400'}>
                  {debugInfo.botTacticalIntent.laneType === 'push' ? '>> ' : '<< '}
                  {debugInfo.botTacticalIntent.laneName}
                </p>
                <p className="text-gray-500">
                  WP: {debugInfo.botTacticalIntent.waypointProgress}
                  {debugInfo.botTacticalIntent.isPausing && ' [PAUSE]'}
                </p>
              </>
            ) : debugInfo.botTacticalIntent.angleName ? (
              <p className="text-purple-400">◎ {debugInfo.botTacticalIntent.angleName}</p>
            ) : (
              <p className="text-gray-500">○ Idle</p>
            )}
          </div>
        )}
      </div>

      {/* ESC hint */}
      {debugInfo.pointerLocked && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-gray-500 text-xs">
          ESC release | F3 debug | R respawn | B toggle bot | P personality | [/] difficulty
        </div>
      )}
    </div>
  )
}
