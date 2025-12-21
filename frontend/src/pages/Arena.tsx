/**
 * Arena - Dashboard-integrated arena page
 *
 * Clean implementation using enterprise orchestrators:
 * - ClientOrchestrator for game loop and systems
 * - BotMatchManager for bot lifecycle
 * - BotVisualController for smooth bot rendering
 * - arenaStore for state management
 *
 * Target: ~300 lines (vs ArenaPlayTest's ~1,480 lines)
 *
 * @module pages/Arena
 */

import { useEffect, useRef, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import * as THREE from 'three';

// Arena systems
import { ArenaScene } from '@/arena';
import { ArenaRenderer } from '@/arena/rendering/ArenaRenderer';
import { MapLoader } from '@/arena/maps/MapLoader';
import { MapRegistry } from '@/arena/maps/MapRegistry';
import '@/arena/maps/definitions'; // Register maps
import { createClientOrchestrator } from '@/arena/orchestrator/ClientOrchestrator';
import { BotMatchManager } from '@/arena/bot/BotMatchManager';
import { BotVisualController } from '@/arena/bot/BotVisualController';
import { createInitialPhysicsState } from '@/arena/physics/Physics3D';
import { Vector3 } from '@/arena/math/Vector3';
import { Capsule } from '@/arena/physics/Capsule';
import { PLAYER_HITBOX, BOT_HITBOX, getEyePosition } from '@/arena/game/CharacterHitbox';
import { WeaponBuilder, setupWeaponCamera } from '@/arena/player/WeaponBuilder';
import { ProjectileParticles } from '@/arena/effects/ProjectileParticles';
import { DrawCallMonitor, optimizeRenderOrder } from '@/arena/rendering/PerformanceOptimizer';
import { DEFAULT_GAME_CONFIG } from '@/arena/config/GameConfig';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

// UI components
import { ArenaDebugHUD, ArenaOverlays, DEFAULT_DEBUG_INFO } from '@/arena/ui';
import type { ArenaDebugInfo } from '@/arena/ui';

// Store
import { useArenaStore } from '@/stores/arenaStore';

// Types
import type { LoadedMap } from '@/arena/maps/MapLoader';
import type { ClientOrchestrator, ClientSystems } from '@/arena/orchestrator/ClientOrchestrator';
import type { PlayerPhysicsState } from '@/arena/physics/Physics3D';

const LOCAL_PLAYER_ID = 1;
const BOT_PLAYER_ID = 999;

export default function Arena() {
  const navigate = useNavigate();
  const containerRef = useRef<HTMLDivElement>(null);

  // Store state
  const {
    mode,
    mapId,
    matchState,
    botPersonality,
    botDifficulty,
    isLoading,
    loadProgress,
    loadError,
    setLoading,
    setMatchState,
    setScores,
    setMatchResult,
    reset,
  } = useArenaStore();

  // Local UI state
  const [showInstructions, setShowInstructions] = useState(true);
  const [showDebug, setShowDebug] = useState(true);
  const [debugInfo, setDebugInfo] = useState<ArenaDebugInfo>(DEFAULT_DEBUG_INFO);
  const [characterLoaded, setCharacterLoaded] = useState(false);

  // Ref to track if game has started (avoids closure issues in game loop)
  const gameStartedRef = useRef(false);

  // Game refs (not React state - these are game objects)
  const orchestratorRef = useRef<ClientOrchestrator | null>(null);
  const botManagerRef = useRef<BotMatchManager | null>(null);
  const botVisualRef = useRef<BotVisualController | null>(null);
  const sceneRef = useRef<ArenaScene | null>(null);
  const rendererRef = useRef<ArenaRenderer | null>(null);
  const playerStateRef = useRef<PlayerPhysicsState | null>(null);

  // Start game - hide instructions and request pointer lock
  const startGame = useCallback(() => {
    // Prevent multiple calls if game already started
    if (gameStartedRef.current) return;
    
    console.log('[Arena] Starting game...');
    // Hide instructions immediately
    setShowInstructions(false);
    setMatchState('playing');
    gameStartedRef.current = true;
    
    // Request pointer lock after a brief delay to let React update
    setTimeout(() => {
      const canvas = containerRef.current?.querySelector('canvas');
      if (canvas && !document.pointerLockElement) {
        console.log('[Arena] Requesting pointer lock on canvas');
        canvas.requestPointerLock();
      }
    }, 50);
  }, [setMatchState]);

  // Handle play again
  const handlePlayAgain = useCallback(() => {
    setMatchResult(null);
    setMatchState('waiting');
    setScores(0, 0);
    // Re-initialize match
    if (botManagerRef.current && playerStateRef.current) {
      botManagerRef.current.dispose();
      botManagerRef.current.startMatch(LOCAL_PLAYER_ID);
    }
  }, [setMatchResult, setMatchState, setScores]);

  // Handle return to dashboard
  const handleReturnToDashboard = useCallback(() => {
    reset();
    navigate('/dashboard');
  }, [reset, navigate]);

  // Initialize arena
  useEffect(() => {
    if (!containerRef.current) return;

    let cleanup: (() => void) | null = null;
    let animationId: number | null = null;

    const initArena = async () => {
      if (!containerRef.current) return;

      setLoading(true, 0);

      // Get map ID (default to first registered map)
      const registry = MapRegistry.getInstance();
      const selectedMapId = mapId || registry.getIds()[0] || 'abandoned_terminal';

      // Load map
      const mapLoader = new MapLoader();
      const mapResult = await mapLoader.load(selectedMapId, (progress) => {
        setLoading(true, Math.round((progress.loaded / progress.total) * 100));
      });

      if (!mapResult.ok) {
        setLoading(false, 0, mapResult.error.message);
        return;
      }

      const loadedMap: LoadedMap = mapResult.value;
      setLoading(false, 100);

      // Create scene
      sceneRef.current = new ArenaScene(loadedMap);
      const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 100);

      // Create renderer
      rendererRef.current = new ArenaRenderer(null, {
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
      });

      containerRef.current.appendChild(rendererRef.current.renderer.domElement);
      rendererRef.current.setSize(window.innerWidth, window.innerHeight);
      rendererRef.current.initialize(sceneRef.current.scene, camera);
      sceneRef.current.generateEnvMap(rendererRef.current.renderer);
      rendererRef.current.renderer.compile(sceneRef.current.scene, camera);
      optimizeRenderOrder(sceneRef.current.scene);

      // Initialize orchestrator
      orchestratorRef.current = createClientOrchestrator(DEFAULT_GAME_CONFIG);
      const initResult = await orchestratorRef.current.initialize(
        containerRef.current,
        loadedMap
      );

      if (!initResult.ok) {
        setLoading(false, 0, `Orchestrator init failed: ${initResult.error.message}`);
        return;
      }

      const systems: ClientSystems = orchestratorRef.current.getSystems()!;

      // IMPORTANT: Re-initialize InputManager with the actual canvas element
      // The orchestrator initializes it with the container div, but it needs the canvas
      const canvas = rendererRef.current.renderer.domElement as HTMLCanvasElement;
      systems.inputManager.dispose();
      systems.inputManager.initialize(canvas);
      console.log('[Arena] InputManager re-initialized with canvas element');

      // Get initial spawn
      const initialSpawn = systems.spawnSystem.selectSpawnPoint(LOCAL_PLAYER_ID, []);
      playerStateRef.current = createInitialPhysicsState(initialSpawn.position);

      // Initialize player in combat system with initial spawn protection
      systems.combatSystem.initializePlayer(LOCAL_PLAYER_ID);
      // Give initial spawn protection (will be refreshed when game actually starts)
      systems.combatSystem.respawnPlayer(LOCAL_PLAYER_ID, performance.now());

      // Create bot manager (practice mode)
      if (mode === 'practice') {
        botManagerRef.current = new BotMatchManager(
          systems.spawnSystem,
          systems.combatSystem,
          systems.eventBus,
          {
            botPersonality,
            botDifficulty,
            mapBounds: {
              min: new THREE.Vector3(-20, 0, -30),
              max: new THREE.Vector3(20, 10, 30),
            },
          }
        );
        // Set player position before starting match so bot spawns away from player
        botManagerRef.current.setPlayerPosition(playerStateRef.current.position);
        botManagerRef.current.startMatch(LOCAL_PLAYER_ID);

        // Create bot visual - start with placeholder, then load character model
        botVisualRef.current = new BotVisualController();
        const botMesh = createBotMesh();
        sceneRef.current.scene.add(botMesh);
        const botPos = botManagerRef.current.getBot()?.getPosition() || Vector3.ZERO;
        botVisualRef.current.initialize(botMesh, botPos);

        // Load bot character model asynchronously
        const botModelUrl = 'https://ikbshpdvvkydbpirbahl.supabase.co/storage/v1/object/public/arena-assets/animations/Run_and_Shoot_withSkin.glb';
        const gltfLoader = new GLTFLoader();
        gltfLoader.load(botModelUrl, (gltf) => {
          const botCharModel = gltf.scene;
          botCharModel.scale.set(0.01, 0.01, 0.01);
          botCharModel.traverse((child) => {
            if ((child as THREE.Mesh).isMesh) {
              child.castShadow = true;
              child.receiveShadow = true;
            }
          });
          botMesh.add(botCharModel);
          botMesh.userData.characterModel = botCharModel;

          // Setup animation mixer
          const mixer = new THREE.AnimationMixer(botCharModel);
          const runClip = gltf.animations.find(a => a.name.toLowerCase().includes('run'));
          if (runClip) {
            const action = mixer.clipAction(runClip);
            action.play();
          }
          botMesh.userData.mixer = mixer;

          // Hide placeholder geometry
          (botMesh.material as THREE.Material).visible = false;
          setCharacterLoaded(true);
        }, undefined, (err) => {
          console.warn('[Arena] Failed to load bot model:', err);
        });
      }

      // Weapon system
      const weaponBuilder = new WeaponBuilder();
      const weaponSystem = setupWeaponCamera(
        rendererRef.current.renderer,
        sceneRef.current.scene,
        camera,
        weaponBuilder
      );

      // Projectile particles
      const projectileParticles = new ProjectileParticles(sceneRef.current.scene);
      const drawCallMonitor = new DrawCallMonitor();

      // Initialize HUD
      systems.hudRenderer.initialize(containerRef.current!);
      systems.hudRenderer.setLocalPlayerId(LOCAL_PLAYER_ID);

      // Ammo & reload tracking - MUST be declared before weaponBuilder.equipWeapon callback
      let currentAmmo = 30;
      let maxAmmo = 30;
      let lastFireTime = 0;
      let isReloading = false;
      let reloadStartTime = 0;
      let reloadDuration = 2.5;
      let currentWeaponType: 'bullet' | 'plasma' = 'bullet';
      let weaponSwitchPending = false; // Guard against race conditions during weapon switch
      let wasFireButtonDown = false; // Track previous frame's fire button state for single-shot
      let playerScore = 0;
      let lastSyncedPlayerScore = 0;
      let lastSyncedBotScore = 0;
      let lastBotFireTime = 0;
      const BOT_FIRE_INTERVAL = 500; // 2 shots per second (was 333ms/3 shots)

      // Equip initial weapon and sync ammo values (after variable declarations)
      weaponBuilder.equipWeapon('ak-47').then(() => {
        const weapon = weaponBuilder.getCurrentWeapon();
        if (weapon) {
          maxAmmo = weapon.magazineSize;
          currentAmmo = maxAmmo;
          reloadDuration = weapon.reloadTime;
        }
      });

      // Game loop
      let lastTime = performance.now();
      let frameCount = 0;
      let lastFpsUpdate = 0;
      let currentFps = 0;
      let lastDebugUpdate = 0;
      const DEBUG_UPDATE_INTERVAL = 100; // Update debug info every 100ms, not every frame

      const gameLoop = () => {
        animationId = requestAnimationFrame(gameLoop);

        const now = performance.now();
        const deltaTime = Math.min((now - lastTime) / 1000, 0.1);
        lastTime = now;

        // FPS counter
        frameCount++;
        if (now - lastFpsUpdate > 500) {
          currentFps = Math.round(frameCount / ((now - lastFpsUpdate) / 1000));
          frameCount = 0;
          lastFpsUpdate = now;
        }

        if (!playerStateRef.current || !systems) return;

        // Capture input
        const inputPacket = systems.inputManager.captureFrame(0, 0, now);

        // Apply mouse look when pointer is locked
        if (systems.inputManager.isPointerLocked()) {
          systems.cameraController.applyLookDelta(inputPacket.lookDeltaX, inputPacket.lookDeltaY);
        }

        const cameraState = systems.cameraController.getState();

        // Physics step
        playerStateRef.current = systems.physics.step(
          playerStateRef.current,
          {
            forward: inputPacket.movementY,
            right: inputPacket.movementX,
            jump: (inputPacket.buttons & 0x01) !== 0,
            yaw: cameraState.yaw,
          },
          deltaTime,
          now
        );

        // Handle reload progress
        if (isReloading) {
          const reloadProgress = (now - reloadStartTime) / 1000;
          if (reloadProgress >= reloadDuration) {
            isReloading = false;
            currentAmmo = maxAmmo;
            systems.audioSystem.playUISound('spawn');
          }
        }

        // Check for player respawn (automatic after respawn delay)
        const playersReadyToRespawn = systems.combatSystem.update(now);
        if (playersReadyToRespawn.includes(LOCAL_PLAYER_ID)) {
          console.log('[Arena] Player respawning automatically');
          const spawn = systems.spawnSystem.selectSpawnPoint(LOCAL_PLAYER_ID, []);
          playerStateRef.current = createInitialPhysicsState(spawn.position);
          systems.combatSystem.respawnPlayer(LOCAL_PLAYER_ID, now);
          systems.audioSystem.playUISound('spawn');
          currentAmmo = maxAmmo;
          isReloading = false;
        }
        
        // Also check bot respawn
        if (botManagerRef.current) {
          const bot = botManagerRef.current.getBot();
          if (bot?.checkRespawn(Date.now())) {
            console.log('[Arena] Bot respawning');
            const botSpawn = systems.spawnSystem.selectSpawnPoint(BOT_PLAYER_ID, [playerStateRef.current.position]);
            bot.respawn(botSpawn.position);
            systems.combatSystem.respawnPlayer(BOT_PLAYER_ID, now);
          }
        }

        // Handle shooting - single click = single shot, hold = auto-fire
        const isFireButtonDown = (inputPacket.buttons & 0x02) !== 0;
        const currentWeapon = weaponBuilder.getCurrentWeapon();
        const fireInterval = currentWeapon ? 1000 / currentWeapon.fireRate : 100;
        const canFire = !isReloading && currentAmmo > 0 && (now - lastFireTime) >= fireInterval;
        
        // Fire on: new click (button just pressed) OR holding button down after fire interval
        const isNewClick = isFireButtonDown && !wasFireButtonDown;
        const isHoldingAndReady = isFireButtonDown && wasFireButtonDown && (now - lastFireTime) >= fireInterval;
        const shouldFire = canFire && (isNewClick || isHoldingAndReady);
        wasFireButtonDown = isFireButtonDown;

        if (shouldFire && systems.inputManager.isPointerLocked()) {
          const combatState = systems.combatSystem.getPlayerState(LOCAL_PLAYER_ID);
          if (combatState && !combatState.isDead) {
            currentAmmo = Math.max(0, currentAmmo - 1);
            lastFireTime = now;

            const eyePos = getEyePosition(playerStateRef.current.position, PLAYER_HITBOX);
            const forward = systems.cameraController.getForwardVector();
            const direction = new Vector3(forward.x, forward.y, forward.z);

            // Check hit on bot
            const playerCapsules = new Map<number, Capsule>();
            if (botManagerRef.current?.getBot() && !botManagerRef.current.getBotState()?.isDead) {
              const botPos = botManagerRef.current.getBot()!.getPosition();
              playerCapsules.set(BOT_PLAYER_ID, new Capsule(botPos, BOT_HITBOX.radius, BOT_HITBOX.height));
            }

            const fireResult = systems.combatSystem.processFire(
              { playerId: LOCAL_PLAYER_ID, origin: eyePos, direction, clientTimestamp: now },
              playerCapsules,
              now
            );

            if (fireResult.ok && fireResult.value?.targetId === BOT_PLAYER_ID) {
              const wasAlive = !botManagerRef.current?.getBotState()?.isDead;
              botManagerRef.current?.onPlayerHitBot(fireResult.value.damage);
              // Only increment score if bot just died (was alive before, dead now)
              if (wasAlive && botManagerRef.current?.getBotState()?.isDead) {
                playerScore++;
              }
            }

            systems.audioSystem.playSound('gunshot', eyePos);
            weaponBuilder.triggerRecoil();
            projectileParticles.spawnProjectile({
              type: currentWeaponType,
              origin: new THREE.Vector3(eyePos.x, eyePos.y, eyePos.z),
              direction: new THREE.Vector3(direction.x, direction.y, direction.z),
              speed: 50,
            });

            // Auto-reload when empty
            if (currentAmmo === 0 && !isReloading) {
              isReloading = true;
              reloadStartTime = now;
              reloadDuration = currentWeapon?.reloadTime ?? 2.5;
              weaponBuilder.startReload();
            }
          }
        }

        // Update bot
        if (botManagerRef.current && botVisualRef.current) {
          const bot = botManagerRef.current.getBot();
          const botState = botManagerRef.current.getBotState();
          
          // Store bot position before update for collision detection
          const botPosBefore = bot?.getPosition() ?? Vector3.ZERO;
          
          botManagerRef.current.update(
            deltaTime * 1000,
            playerStateRef.current.position,
            playerStateRef.current.velocity,
            systems.combatSystem.getPlayerState(LOCAL_PLAYER_ID)?.health ?? 100
          );

          if (bot && botState && !botState.isDead) {
            // Get bot's intended new position
            const botPosAfter = bot.getPosition();
            const moveX = botPosAfter.x - botPosBefore.x;
            const moveZ = botPosAfter.z - botPosBefore.z;
            
            // Apply collision detection for bot movement
            let finalX = botPosBefore.x;
            let finalZ = botPosBefore.z;
            
            // Only do collision if there's actual movement
            if (Math.abs(moveX) > 0.0001 || Math.abs(moveZ) > 0.0001) {
              // Check if current position is stuck
              const currentCapsule = new Capsule(
                new Vector3(botPosBefore.x, botPosBefore.y, botPosBefore.z),
                BOT_HITBOX.radius,
                BOT_HITBOX.height
              );
              const currentCollisions = systems.collisionWorld.testCapsule(currentCapsule);
              const isStuck = currentCollisions.length > 0;
              
              if (isStuck) {
                // Bot is stuck - allow movement to escape
                finalX = botPosBefore.x + moveX;
                finalZ = botPosBefore.z + moveZ;
              } else {
                // Normal collision detection - try full movement first
                const testFull = new Capsule(
                  new Vector3(botPosBefore.x + moveX, botPosBefore.y, botPosBefore.z + moveZ),
                  BOT_HITBOX.radius,
                  BOT_HITBOX.height
                );
                const collisionsFull = systems.collisionWorld.testCapsule(testFull);
                
                if (collisionsFull.length === 0) {
                  // No collision - apply full movement
                  finalX = botPosBefore.x + moveX;
                  finalZ = botPosBefore.z + moveZ;
                } else {
                  // Collision - try sliding along walls
                  // Try X only
                  const testX = new Capsule(
                    new Vector3(botPosBefore.x + moveX, botPosBefore.y, botPosBefore.z),
                    BOT_HITBOX.radius,
                    BOT_HITBOX.height
                  );
                  if (systems.collisionWorld.testCapsule(testX).length === 0) {
                    finalX = botPosBefore.x + moveX;
                  }
                  
                  // Try Z only
                  const testZ = new Capsule(
                    new Vector3(botPosBefore.x, botPosBefore.y, botPosBefore.z + moveZ),
                    BOT_HITBOX.radius,
                    BOT_HITBOX.height
                  );
                  if (systems.collisionWorld.testCapsule(testZ).length === 0) {
                    finalZ = botPosBefore.z + moveZ;
                  }
                }
              }
              
              // Update bot position with collision-corrected values
              bot.setPosition(new Vector3(finalX, botPosBefore.y, finalZ));
            }
            
            const botPos = bot.getPosition();
            // Get bot AI output for movement direction and aim
            const botAIOutput = bot.getLastOutput();
            const moveDir = botAIOutput?.moveDirection ?? { x: 0, z: 0 };
            
            botVisualRef.current.update(
              new Vector3(botPos.x, botPos.y + 0.9, botPos.z),
              null,
              deltaTime,
              { x: moveDir.x, z: moveDir.z }
            );

            // Calculate distance to player
            const distance = Math.sqrt(
              (playerStateRef.current.position.x - botPos.x) ** 2 +
              (playerStateRef.current.position.z - botPos.z) ** 2
            );

            // Check line of sight with raycast (not just distance)
            const botEyeHeight = botPos.y + BOT_HITBOX.eyeHeight;
            const playerEyeHeight = playerStateRef.current.position.y + PLAYER_HITBOX.eyeHeight;
            const toPlayerDir = new Vector3(
              playerStateRef.current.position.x - botPos.x,
              playerEyeHeight - botEyeHeight,
              playerStateRef.current.position.z - botPos.z
            ).normalize();

            const losRaycast = systems.collisionWorld.raycast(
              new Vector3(botPos.x, botEyeHeight, botPos.z),
              toPlayerDir,
              distance + 1
            );

            // Player is visible only if no wall blocks line of sight
            const playerVisible = distance < 30 && (!losRaycast || losRaycast.distance > distance);

            // Check spawn protection (don't shoot player who just spawned)
            const playerCombatState = systems.combatSystem.getPlayerState(LOCAL_PLAYER_ID);
            const hasSpawnProtection = playerCombatState?.invulnerableUntil ? now < playerCombatState.invulnerableUntil : false;

            // Get bot AI output - use shouldShoot from CombatConductor AI
            const botOutput = bot.getLastOutput();
            const botWantsToShoot = botOutput?.shouldShoot ?? false;

            // Bot shooting - only if game started, AI wants to shoot, player visible (LOS), and no spawn protection
            const canBotFire = (now - lastBotFireTime) >= BOT_FIRE_INTERVAL;
            if (gameStartedRef.current && botWantsToShoot && canBotFire && playerVisible && distance > 2 && !hasSpawnProtection) {
              lastBotFireTime = now;
              const botEyePos = getEyePosition(botPos, BOT_HITBOX);
              const toPlayer = new Vector3(
                playerStateRef.current.position.x - botPos.x,
                playerStateRef.current.position.y + 1.0 - botPos.y - 1.6,
                playerStateRef.current.position.z - botPos.z
              ).normalize();

              // Raycast to check if bullet would hit a wall first
              const bulletRaycast = systems.collisionWorld.raycast(botEyePos, toPlayer, distance + 1);
              const bulletHitsWall = bulletRaycast && bulletRaycast.distance < distance;

              if (!bulletHitsWall) {
                // Bot accuracy based on difficulty and distance
                // Base accuracy is much lower to make bot feel fair
                const difficultyAccuracy = bot.getDifficulty().accuracyMultiplier;
                const distancePenalty = Math.max(0.2, 1 - distance / 30); // Min 20% at range
                // Reduced base accuracy from 0.25 to 0.12 - bot hits ~12% of shots at close range
                const accuracy = 0.12 * difficultyAccuracy * distancePenalty;

                if (Math.random() < accuracy) {
                  const botDamage = 8;
                  const wasAlive = !systems.combatSystem.getPlayerState(LOCAL_PLAYER_ID)?.isDead;
                  systems.combatSystem.applyDamage(
                    LOCAL_PLAYER_ID,
                    BOT_PLAYER_ID,
                    botDamage,
                    playerStateRef.current.position,
                    now
                  );
                  bot.recordHit(botDamage);

                  const newCombatState = systems.combatSystem.getPlayerState(LOCAL_PLAYER_ID);
                  // Only count kill if player just died (was alive before)
                  if (wasAlive && newCombatState?.isDead) {
                    bot.addKill();
                    console.log('[Arena] Bot killed player! Bot score:', bot.getScore());
                  }
                } else {
                  bot.recordMiss();
                }
              } else {
                bot.recordMiss();
              }

              // Play gunshot sound and spawn projectile (even if missed)
              systems.audioSystem.playSound('gunshot', botEyePos);
              projectileParticles.spawnProjectile({
                type: 'bullet',
                origin: new THREE.Vector3(botEyePos.x, botEyePos.y, botEyePos.z),
                direction: new THREE.Vector3(toPlayer.x, toPlayer.y, toPlayer.z),
                speed: 50,
              });
            }

            // Update bot animation mixer
            const mesh = botVisualRef.current.getMesh?.();
            if (mesh?.userData.mixer) {
              mesh.userData.mixer.update(deltaTime);
            }
          }
          botVisualRef.current.setVisible(!botState?.isDead);
        }

        // Update camera
        const viewBobOffset = cameraState.viewBobOffset;
        camera.position.set(
          playerStateRef.current.position.x,
          playerStateRef.current.position.y + PLAYER_HITBOX.eyeHeight + viewBobOffset,
          playerStateRef.current.position.z
        );
        camera.rotation.order = 'YXZ';
        camera.rotation.y = cameraState.yaw;
        camera.rotation.x = cameraState.pitch;

        // Update systems
        const horizontalSpeed = Math.sqrt(
          playerStateRef.current.velocity.x ** 2 + playerStateRef.current.velocity.z ** 2
        );
        systems.cameraController.updateViewBob(horizontalSpeed > 0.1, horizontalSpeed, deltaTime);
        systems.audioSystem.updateFootsteps(horizontalSpeed > 0.1, playerStateRef.current.isGrounded, horizontalSpeed, deltaTime);
        weaponBuilder.update(deltaTime, horizontalSpeed > 0.1, horizontalSpeed);
        projectileParticles.update(deltaTime);

        // Update audio listener position
        const forward = systems.cameraController.getForwardVector();
        systems.audioSystem.setListenerPosition(
          getEyePosition(playerStateRef.current.position, PLAYER_HITBOX),
          new Vector3(forward.x, forward.y, forward.z),
          Vector3.UP
        );

        // Update HUD - clamp values to prevent display bugs
        const combatStateForHud = systems.combatSystem.getPlayerState(LOCAL_PLAYER_ID);
        const botScore = botManagerRef.current?.getBotScore() ?? 0;
        const displayHealth = Math.max(0, Math.min(100, combatStateForHud?.health ?? 100));
        const displayAmmo = Math.max(0, Math.min(currentAmmo, maxAmmo));
        systems.hudRenderer.update({
          health: displayHealth,
          maxHealth: 100,
          ammo: displayAmmo,
          maxAmmo: maxAmmo,
          score: playerScore,
          opponentScore: botScore,
          rtt: 0,
          showNetworkWarning: false,
          damageIndicators: [],
          hitMarkerActive: false,
          hitMarkerEndTime: 0,
          killFeed: [],
          lowHealthVignetteIntensity: displayHealth < 30 ? 0.5 : 0,
        }, now);
        
        // Sync scores to store only when they change (for UI overlays)
        if (playerScore !== lastSyncedPlayerScore || botScore !== lastSyncedBotScore) {
          lastSyncedPlayerScore = playerScore;
          lastSyncedBotScore = botScore;
          setScores(playerScore, botScore);
        }

        // Render
        rendererRef.current?.render();
        weaponSystem.renderWeapon();

        // Update debug info (throttled to reduce React re-renders)
        if (now - lastDebugUpdate > DEBUG_UPDATE_INTERVAL) {
          lastDebugUpdate = now;
          drawCallMonitor.update(rendererRef.current!.renderer);
          const combatStateDebug = systems.combatSystem.getPlayerState(LOCAL_PLAYER_ID);
          const botStateDebug = botManagerRef.current?.getBotState();

          setDebugInfo({
            fps: currentFps,
            position: {
              x: Math.round(playerStateRef.current.position.x * 100) / 100,
              y: Math.round(playerStateRef.current.position.y * 100) / 100,
              z: Math.round(playerStateRef.current.position.z * 100) / 100,
            },
            velocity: {
              x: Math.round(playerStateRef.current.velocity.x * 100) / 100,
              y: Math.round(playerStateRef.current.velocity.y * 100) / 100,
              z: Math.round(playerStateRef.current.velocity.z * 100) / 100,
            },
            isGrounded: playerStateRef.current.isGrounded,
            pointerLocked: systems.inputManager.isPointerLocked(),
            collisionCount: 0,
            health: combatStateDebug?.health ?? 100,
            ammo: currentAmmo,
            drawCalls: drawCallMonitor.getCurrent(),
            triangles: rendererRef.current?.getTriangles() ?? 0,
            botHealth: botStateDebug?.health,
            botState: botStateDebug?.currentState,
            botScore: botManagerRef.current?.getBotScore(),
            playerScore,
          });
        }
      };

      // Start game loop
      gameLoop();

      // Keyboard shortcuts
      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'F3') {
          e.preventDefault();
          setShowDebug((prev) => !prev);
        }
        // Manual reload
        if (e.key === 'r' || e.key === 'R') {
          if (currentAmmo < maxAmmo && !isReloading) {
            const weapon = weaponBuilder.getCurrentWeapon();
            isReloading = true;
            reloadStartTime = performance.now();
            reloadDuration = weapon?.reloadTime ?? 2.5;
            weaponBuilder.startReload();
          }
        }
        // Respawn when dead
        if (e.key === 'Escape') {
          const combatState = systems.combatSystem.getPlayerState(LOCAL_PLAYER_ID);
          if (combatState?.isDead) {
            const spawn = systems.spawnSystem.selectSpawnPoint(LOCAL_PLAYER_ID, []);
            playerStateRef.current = createInitialPhysicsState(spawn.position);
            systems.combatSystem.respawnPlayer(LOCAL_PLAYER_ID, performance.now());
            systems.audioSystem.playUISound('spawn');
            currentAmmo = maxAmmo;
            isReloading = false;
          }
        }
        // Weapon switching - guard against race conditions
        if (e.key === '1' && !weaponSwitchPending) {
          weaponSwitchPending = true;
          currentWeaponType = 'bullet';
          weaponBuilder.equipWeapon('ak-47').then(() => {
            const weapon = weaponBuilder.getCurrentWeapon();
            if (weapon) {
              maxAmmo = weapon.magazineSize;
              currentAmmo = maxAmmo; // Full magazine on weapon switch
              reloadDuration = weapon.reloadTime;
              isReloading = false;
            }
            weaponSwitchPending = false;
          }).catch(() => { weaponSwitchPending = false; });
        }
        if (e.key === '2' && !weaponSwitchPending) {
          weaponSwitchPending = true;
          currentWeaponType = 'plasma';
          weaponBuilder.equipWeapon('raygun').then(() => {
            const weapon = weaponBuilder.getCurrentWeapon();
            if (weapon) {
              maxAmmo = weapon.magazineSize;
              currentAmmo = maxAmmo; // Full magazine on weapon switch
              reloadDuration = weapon.reloadTime;
              isReloading = false;
            }
            weaponSwitchPending = false;
          }).catch(() => { weaponSwitchPending = false; });
        }
      };
      document.addEventListener('keydown', handleKeyDown);

      // Resize handler
      const handleResize = () => {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        rendererRef.current?.setSize(window.innerWidth, window.innerHeight);
      };
      window.addEventListener('resize', handleResize);

      // Cleanup
      cleanup = () => {
        if (animationId) cancelAnimationFrame(animationId);
        document.removeEventListener('keydown', handleKeyDown);
        window.removeEventListener('resize', handleResize);

        if (document.pointerLockElement) {
          document.exitPointerLock();
        }

        botManagerRef.current?.dispose();
        botVisualRef.current?.dispose();
        systems.hudRenderer.dispose();
        orchestratorRef.current?.dispose();
        weaponSystem.dispose();
        projectileParticles.dispose();
        rendererRef.current?.dispose();
        sceneRef.current?.dispose();

        if (containerRef.current?.contains(rendererRef.current?.renderer.domElement!)) {
          containerRef.current.removeChild(rendererRef.current!.renderer.domElement);
        }
      };
    };

    initArena();

    return () => {
      if (cleanup) cleanup();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mapId, mode, botPersonality, botDifficulty, setLoading]);

  return (
    <div className="relative w-full h-screen bg-black">
      <div
        ref={containerRef}
        className="w-full h-full cursor-crosshair"
        onClick={startGame}
      />

      <ArenaOverlays
        isLoading={isLoading}
        loadProgress={loadProgress}
        loadError={loadError}
        showInstructions={showInstructions}
        onStartGame={startGame}
        matchState={matchState}
        matchResult={useArenaStore.getState().matchResult}
        onPlayAgain={handlePlayAgain}
        onReturnToDashboard={handleReturnToDashboard}
        botEnabled={mode === 'practice'}
        botPersonality={botPersonality}
        botDifficulty={botDifficulty}
        characterLoaded={characterLoaded}
      />

      <ArenaDebugHUD
        debugInfo={debugInfo}
        visible={showDebug}
        botEnabled={mode === 'practice'}
        botPersonality={botPersonality}
      />

      {debugInfo.pointerLocked && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-gray-500 text-xs">
          ESC release/respawn | R reload | 1 AK-47 | 2 Raygun | F3 debug
        </div>
      )}
    </div>
  );
}

/**
 * Create a simple bot mesh placeholder
 */
function createBotMesh(): THREE.Mesh {
  const geometry = new THREE.CapsuleGeometry(0.4, 1.0, 4, 8);
  const material = new THREE.MeshStandardMaterial({
    color: 0xff4444,
    emissive: 0x331111,
    roughness: 0.7,
  });
  const mesh = new THREE.Mesh(geometry, material);
  mesh.name = 'bot';
  mesh.castShadow = true;
  return mesh;
}
