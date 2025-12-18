/**
 * ClientOrchestrator - Client-side game initialization and game loop
 * 
 * Manages the initialization sequence and main game loop for the client.
 * Initialization order: Config → EventBus → AssetLoader → Scene → Renderer → 
 * AudioSystem → InputManager → NetworkClient → PredictionSystem → InterpolationBuffer
 * 
 * @module orchestrator/ClientOrchestrator
 */

import type { Result } from '../core/Result';
import { Ok, Err, isOk } from '../core/Result';
import type { IEventBus } from '../core/EventBus';
import { EventBus } from '../core/EventBus';
import type { 
  SystemReadyEvent
} from '../core/GameEvents';
import type { InitializationError } from '../core/Errors';
import { createInitializationError } from '../core/Errors';
import type { GameConfig } from '../config/GameConfig';
import { DEFAULT_GAME_CONFIG } from '../config/GameConfig';
import { CollisionWorld } from '../physics/CollisionWorld';
import { Physics3D } from '../physics/Physics3D';
import { InputManager } from '../client/InputManager';
import { CameraController } from '../client/CameraController';
import { PredictionSystem } from '../client/PredictionSystem';
import { InterpolationBuffer } from '../client/InterpolationBuffer';
import { HUDRenderer } from '../presentation/HUDRenderer';
import { AudioSystem } from '../presentation/AudioSystem';
import { DebugOverlay } from '../debug/DebugOverlay';
import { DiagnosticsRecorder } from '../debug/DiagnosticsRecorder';
import { SpawnSystem } from '../game/SpawnSystem';
import type { LoadedMap } from '../maps/MapLoader';
import { Vector3 } from '../math/Vector3';

// ============================================================================
// Types
// ============================================================================

export type ClientState = 
  | 'uninitialized'
  | 'initializing'
  | 'ready'
  | 'connecting'
  | 'playing'
  | 'paused'
  | 'error';

export interface ClientSystems {
  eventBus: IEventBus;
  collisionWorld: CollisionWorld;
  spawnSystem: SpawnSystem;
  physics: Physics3D;
  inputManager: InputManager;
  cameraController: CameraController;
  predictionSystem: PredictionSystem;
  interpolationBuffer: InterpolationBuffer;
  hudRenderer: HUDRenderer;
  audioSystem: AudioSystem;
  debugOverlay: DebugOverlay;
  diagnosticsRecorder: DiagnosticsRecorder;
}

// ============================================================================
// Interface
// ============================================================================

export interface IClientOrchestrator {
  initialize(container: HTMLElement, loadedMap: LoadedMap): Promise<Result<void, InitializationError>>;
  dispose(): void;
  getState(): ClientState;
  getSystems(): ClientSystems | null;
  startGameLoop(): void;
  stopGameLoop(): void;
  pause(): void;
  resume(): void;
}

// ============================================================================
// Implementation
// ============================================================================

export class ClientOrchestrator implements IClientOrchestrator {
  private state: ClientState = 'uninitialized';
  private systems: ClientSystems | null = null;
  private config: GameConfig;
  private animationFrameId: number | null = null;
  private lastFrameTime: number = 0;
  private localPlayerId: number = 0;

  constructor(config: GameConfig = DEFAULT_GAME_CONFIG) {
    this.config = config;
  }

  async initialize(container: HTMLElement, loadedMap: LoadedMap): Promise<Result<void, InitializationError>> {
    if (this.state !== 'uninitialized') {
      return Err(createInitializationError(
        'SYSTEM_INIT_FAILED',
        'Client already initialized or initializing'
      ));
    }

    this.state = 'initializing';

    try {
      // 1. Create EventBus
      const eventBus = new EventBus();
      this.emitSystemReady(eventBus, 'EventBus');

      // 2. Create CollisionWorld and load manifest from LoadedMap
      const collisionWorld = new CollisionWorld(4);
      const loadResult = collisionWorld.loadManifest(loadedMap.definition.collisionManifest);
      if (!isOk(loadResult)) {
        return Err(createInitializationError(
          'ASSET_LOAD_FAILED',
          `Failed to load collision manifest: ${loadResult.error}`,
          'CollisionWorld'
        ));
      }
      this.emitSystemReady(eventBus, 'CollisionWorld');

      // 3. Create SpawnSystem and load manifest from LoadedMap
      const spawnSystem = new SpawnSystem(eventBus);
      spawnSystem.loadManifest(loadedMap.definition.spawnManifest);
      this.emitSystemReady(eventBus, 'SpawnSystem');

      // 4. Create Physics3D
      const physics = new Physics3D(this.config.physics, collisionWorld, eventBus);
      this.emitSystemReady(eventBus, 'Physics3D');

      // 5. Create InputManager
      const inputManager = new InputManager({ mouseSensitivity: this.config.camera.sensitivity, maxLookDelta: 32767 }, eventBus);
      inputManager.initialize(container as HTMLCanvasElement);
      this.emitSystemReady(eventBus, 'InputManager');

      // 6. Create CameraController
      const cameraController = new CameraController({
        sensitivity: this.config.camera.sensitivity,
        pitchLimit: this.config.camera.maxPitch,
        viewBobAmplitude: this.config.camera.viewBobAmplitude,
        viewBobFrequency: this.config.camera.viewBobFrequency
      });
      this.emitSystemReady(eventBus, 'CameraController');

      // 7. Create PredictionSystem
      const predictionSystem = new PredictionSystem(
        {
          reconciliationThreshold: this.config.prediction.reconciliationThreshold,
          maxPendingInputs: this.config.prediction.maxPendingInputs,
          smoothingFactor: 0.1
        },
        physics,
        eventBus,
        new Vector3(0, 0, 0) // Initial position
      );
      this.emitSystemReady(eventBus, 'PredictionSystem');

      // 8. Create InterpolationBuffer
      const interpolationBuffer = new InterpolationBuffer(
        {
          bufferSize: this.config.interpolation.bufferSize,
          interpolationDelayMs: this.config.interpolation.baseDelayMs,
          maxExtrapolationMs: this.config.interpolation.maxExtrapolationMs,
          blendDurationMs: this.config.interpolation.blendDurationMs
        },
        eventBus
      );
      this.emitSystemReady(eventBus, 'InterpolationBuffer');

      // 9. Create HUDRenderer
      const hudRenderer = new HUDRenderer(this.config.hud, eventBus);
      hudRenderer.initialize(container);
      this.emitSystemReady(eventBus, 'HUDRenderer');

      // 10. Create AudioSystem
      const audioSystem = new AudioSystem(this.config.audio, eventBus);
      await audioSystem.initialize();
      this.emitSystemReady(eventBus, 'AudioSystem');

      // 11. Create DebugOverlay
      const debugOverlay = new DebugOverlay(this.config.debug);
      this.emitSystemReady(eventBus, 'DebugOverlay');

      // 12. Create DiagnosticsRecorder
      const diagnosticsRecorder = new DiagnosticsRecorder(this.config.diagnostics);
      this.emitSystemReady(eventBus, 'DiagnosticsRecorder');

      // Store all systems
      this.systems = {
        eventBus,
        collisionWorld,
        spawnSystem,
        physics,
        inputManager,
        cameraController,
        predictionSystem,
        interpolationBuffer,
        hudRenderer,
        audioSystem,
        debugOverlay,
        diagnosticsRecorder
      };

      this.state = 'ready';
      return Ok(undefined);

    } catch (error) {
      this.state = 'error';
      return Err(createInitializationError(
        'SYSTEM_INIT_FAILED',
        `Initialization failed: ${error}`,
        undefined,
        { error: String(error) }
      ));
    }
  }

  dispose(): void {
    this.stopGameLoop();

    if (this.systems) {
      this.systems.inputManager.dispose();
      this.systems.hudRenderer.dispose();
      this.systems.audioSystem.dispose();
      this.systems.eventBus.clear();
      this.systems = null;
    }

    this.state = 'uninitialized';
  }

  getState(): ClientState {
    return this.state;
  }

  getSystems(): ClientSystems | null {
    return this.systems;
  }

  setLocalPlayerId(playerId: number): void {
    this.localPlayerId = playerId;
    if (this.systems) {
      this.systems.hudRenderer.setLocalPlayerId(playerId);
      this.systems.audioSystem.setLocalPlayerId(playerId);
    }
  }

  startGameLoop(): void {
    if (this.state !== 'ready' && this.state !== 'playing') return;
    
    this.state = 'playing';
    this.lastFrameTime = performance.now();
    this.gameLoop();
  }

  stopGameLoop(): void {
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
    
    if (this.state === 'playing') {
      this.state = 'ready';
    }
  }

  pause(): void {
    if (this.state === 'playing') {
      this.stopGameLoop();
      this.state = 'paused';
    }
  }

  resume(): void {
    if (this.state === 'paused') {
      this.state = 'ready'; // Set to ready so startGameLoop accepts it
      this.startGameLoop();
    }
  }


  // ===========================================================================
  // Private Methods
  // ===========================================================================

  private gameLoop = (): void => {
    if (this.state !== 'playing' || !this.systems) return;

    const currentTime = performance.now();
    const deltaTime = (currentTime - this.lastFrameTime) / 1000;
    this.lastFrameTime = currentTime;

    // 1. Capture input
    const inputSnapshot = this.systems.inputManager.captureFrame(0, 0, currentTime);

    // 2. Apply look input to camera
    if (inputSnapshot) {
      this.systems.cameraController.applyLookDelta(
        inputSnapshot.lookDeltaX,
        inputSnapshot.lookDeltaY
      );
    }

    // 3. Get camera state for movement direction
    const cameraState = this.systems.cameraController.getState();

    // 4. Apply input to prediction system
    if (inputSnapshot) {
      const inputPacket = {
        sequenceNumber: 0, // Would be tracked properly
        tickNumber: 0,
        movementX: inputSnapshot.movementX,
        movementY: inputSnapshot.movementY,
        lookDeltaX: inputSnapshot.lookDeltaX,
        lookDeltaY: inputSnapshot.lookDeltaY,
        buttons: inputSnapshot.buttons,
        clientTimestamp: currentTime
      };

      this.systems.predictionSystem.applyInput(
        inputPacket,
        cameraState.yaw,
        currentTime
      );

      // Record input for diagnostics
      if (this.systems.diagnosticsRecorder.isRecording()) {
        this.systems.diagnosticsRecorder.recordInput({
          sequenceNumber: 0, // Would come from actual sequence
          tickNumber: 0,
          movementX: inputSnapshot.movementX,
          movementY: inputSnapshot.movementY,
          lookDeltaX: inputSnapshot.lookDeltaX,
          lookDeltaY: inputSnapshot.lookDeltaY,
          buttons: inputSnapshot.buttons,
          clientTimestamp: currentTime
        });
      }
    }

    // 5. Update view bob based on movement
    const predictedState = this.systems.predictionSystem.getCurrentState();
    const horizontalSpeed = Math.sqrt(
      predictedState.velocity.x ** 2 + predictedState.velocity.z ** 2
    );
    this.systems.cameraController.updateViewBob(
      horizontalSpeed > 0.1,
      horizontalSpeed,
      deltaTime
    );

    // 6. Update footsteps
    this.systems.audioSystem.updateFootsteps(
      horizontalSpeed > 0.1,
      predictedState.isGrounded,
      horizontalSpeed,
      deltaTime
    );

    // 7. Update audio listener position
    const forward = this.systems.cameraController.getForwardVector();
    this.systems.audioSystem.setListenerPosition(
      predictedState.position,
      forward,
      Vector3.UP
    );

    // 8. Get interpolated remote entities
    this.systems.interpolationBuffer.getInterpolatedEntities(currentTime, this.localPlayerId);

    // 9. Update HUD
    const hudState = this.systems.hudRenderer.getState();
    this.systems.hudRenderer.update({
      ...hudState,
      // Would be updated from actual game state
    }, currentTime);

    // 10. Update debug overlay
    if (this.systems.debugOverlay.isEnabled()) {
      this.systems.debugOverlay.clear();
      
      // Draw local player capsule
      // this.systems.debugOverlay.drawCapsule(localCapsule, '#00ff00');
      
      // Draw remote player capsules
      // remoteEntities.forEach(entity => {
      //   this.systems.debugOverlay.drawCapsule(entity.capsule, '#ff0000');
      // });
    }

    // Schedule next frame
    this.animationFrameId = requestAnimationFrame(this.gameLoop);
  };

  private emitSystemReady(eventBus: IEventBus, systemName: string): void {
    eventBus.emit<SystemReadyEvent>({
      type: 'system_ready',
      timestamp: Date.now(),
      systemName
    });
  }

}

// ============================================================================
// Factory Function
// ============================================================================

/**
 * Create a client orchestrator with default config
 */
export function createClientOrchestrator(config?: Partial<GameConfig>): ClientOrchestrator {
  const fullConfig = config ? { ...DEFAULT_GAME_CONFIG, ...config } : DEFAULT_GAME_CONFIG;
  return new ClientOrchestrator(fullConfig);
}
