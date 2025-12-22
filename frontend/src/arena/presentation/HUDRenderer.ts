/**
 * HUDRenderer - Heads-Up Display rendering system for Arena
 * 
 * Displays health, ammo, score, kill feed, crosshair, damage indicators,
 * hit markers, and network status.
 * 
 * @module presentation/HUDRenderer
 */

import type { IEventBus } from '../core/EventBus';
import type { PlayerDamagedEvent, HitConfirmedEvent, PlayerDeathEvent } from '../core/GameEvents';
import { Vector3 } from '../math/Vector3';

// ============================================================================
// Configuration
// ============================================================================

export interface HUDConfig {
  readonly damageIndicatorDurationMs: number;
  readonly hitMarkerDurationMs: number;
  readonly killFeedDurationMs: number;
  readonly lowHealthThreshold: number;
}

export const DEFAULT_HUD_CONFIG: HUDConfig = {
  damageIndicatorDurationMs: 1000,
  hitMarkerDurationMs: 200,
  killFeedDurationMs: 5000,
  lowHealthThreshold: 25
};

// ============================================================================
// State Types
// ============================================================================

export interface HUDState {
  health: number;
  maxHealth: number;
  ammo: number;
  maxAmmo: number;
  score: number;
  opponentScore: number;
  rtt: number;
  showNetworkWarning: boolean;
  damageIndicators: DamageIndicator[];
  hitMarkerActive: boolean;
  hitMarkerEndTime: number;
  killFeed: KillFeedEntry[];
  lowHealthVignetteIntensity: number;
}

export interface DamageIndicator {
  direction: number;  // Angle in radians relative to player facing
  endTime: number;
}

export interface KillFeedEntry {
  killerName: string;
  victimName: string;
  endTime: number;
}

// ============================================================================
// Interface
// ============================================================================

export interface IHUDRenderer {
  initialize(container: HTMLElement): void;
  dispose(): void;
  update(state: HUDState, currentTime: number): void;
  showDamageIndicator(attackerPosition: Vector3, playerPosition: Vector3, playerYaw: number): void;
  showHitMarker(): void;
  addKillFeedEntry(killerName: string, victimName: string): void;
  getState(): HUDState;
}


// ============================================================================
// Implementation
// ============================================================================

export class HUDRenderer implements IHUDRenderer {
  private container: HTMLElement | null = null;
  private state: HUDState;
  private unsubscribers: (() => void)[] = [];
  private localPlayerId: number = 0;

  // DOM element references
  private healthBar: HTMLElement | null = null;
  private healthText: HTMLElement | null = null;
  private ammoText: HTMLElement | null = null;
  private scoreText: HTMLElement | null = null;
  private opponentScoreText: HTMLElement | null = null;
  private crosshair: HTMLElement | null = null;
  private hitMarker: HTMLElement | null = null;
  private killFeedContainer: HTMLElement | null = null;
  private damageIndicatorContainer: HTMLElement | null = null;
  private networkWarning: HTMLElement | null = null;
  private vignette: HTMLElement | null = null;
  private rttDisplay: HTMLElement | null = null;
  private readonly config: HUDConfig;
  private readonly eventBus: IEventBus;

  constructor(config: HUDConfig, eventBus: IEventBus) {
    this.config = config;
    this.eventBus = eventBus;
    this.state = this.createInitialState();
  }

  initialize(container: HTMLElement): void {
    // Prevent double initialization - remove existing HUD if present
    const existingHud = container.querySelector('.arena-hud');
    if (existingHud) {
      console.warn('[HUDRenderer] Removing existing HUD before re-initialization');
      existingHud.remove();
    }
    
    this.container = container;
    this.createHUDElements();
    this.subscribeToEvents();
  }

  dispose(): void {
    this.unsubscribers.forEach(unsub => unsub());
    this.unsubscribers = [];
    
    // Remove all created elements
    if (this.container) {
      const hudRoot = this.container.querySelector('.arena-hud');
      if (hudRoot) {
        hudRoot.remove();
      }
    }
    
    this.container = null;
    this.healthBar = null;
    this.healthText = null;
    this.ammoText = null;
    this.scoreText = null;
    this.opponentScoreText = null;
    this.crosshair = null;
    this.hitMarker = null;
    this.killFeedContainer = null;
    this.damageIndicatorContainer = null;
    this.networkWarning = null;
    this.vignette = null;
    this.rttDisplay = null;
  }

  setLocalPlayerId(playerId: number): void {
    this.localPlayerId = playerId;
  }

  update(state: HUDState, currentTime: number): void {
    this.state = { ...state };
    this.pruneExpiredIndicators(currentTime);
    this.updateLowHealthVignette();
    this.render();
  }

  showDamageIndicator(attackerPosition: Vector3, playerPosition: Vector3, playerYaw: number): void {
    const dx = attackerPosition.x - playerPosition.x;
    const dz = attackerPosition.z - playerPosition.z;
    const worldAngle = Math.atan2(dx, dz);
    const relativeAngle = worldAngle - playerYaw;
    
    this.state.damageIndicators.push({
      direction: relativeAngle,
      endTime: Date.now() + this.config.damageIndicatorDurationMs
    });
  }

  showHitMarker(): void {
    this.state.hitMarkerActive = true;
    this.state.hitMarkerEndTime = Date.now() + this.config.hitMarkerDurationMs;
  }

  addKillFeedEntry(killerName: string, victimName: string): void {
    this.state.killFeed.push({
      killerName,
      victimName,
      endTime: Date.now() + this.config.killFeedDurationMs
    });
    
    // Limit kill feed size to 5 entries
    if (this.state.killFeed.length > 5) {
      this.state.killFeed.shift();
    }
  }

  getState(): HUDState {
    return { ...this.state };
  }

  // ===========================================================================
  // Private Methods
  // ===========================================================================

  private createInitialState(): HUDState {
    return {
      health: 100,
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
      lowHealthVignetteIntensity: 0
    };
  }

  private createHUDElements(): void {
    if (!this.container) return;

    const hudRoot = document.createElement('div');
    hudRoot.className = 'arena-hud';
    hudRoot.style.cssText = `
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      pointer-events: none;
      font-family: 'Rajdhani', 'Segoe UI', sans-serif;
      color: white;
      z-index: 100;
    `;

    // Health bar (bottom left)
    this.healthBar = this.createHealthBar();
    hudRoot.appendChild(this.healthBar);

    // Ammo display (bottom right)
    this.ammoText = this.createAmmoDisplay();
    hudRoot.appendChild(this.ammoText);

    // Score display (top center)
    const scoreContainer = this.createScoreDisplay();
    hudRoot.appendChild(scoreContainer);

    // Crosshair (center)
    this.crosshair = this.createCrosshair();
    hudRoot.appendChild(this.crosshair);

    // Hit marker (center, hidden by default)
    this.hitMarker = this.createHitMarker();
    hudRoot.appendChild(this.hitMarker);

    // Kill feed (top right)
    this.killFeedContainer = this.createKillFeed();
    hudRoot.appendChild(this.killFeedContainer);

    // Damage indicators (center, radial)
    this.damageIndicatorContainer = this.createDamageIndicatorContainer();
    hudRoot.appendChild(this.damageIndicatorContainer);

    // Network warning (top left)
    this.networkWarning = this.createNetworkWarning();
    hudRoot.appendChild(this.networkWarning);

    // Low health vignette (full screen overlay)
    this.vignette = this.createVignette();
    hudRoot.appendChild(this.vignette);

    // RTT display (top left, below network warning)
    this.rttDisplay = this.createRTTDisplay();
    hudRoot.appendChild(this.rttDisplay);

    this.container.appendChild(hudRoot);
  }


  private createHealthBar(): HTMLElement {
    const container = document.createElement('div');
    container.style.cssText = `
      position: absolute;
      bottom: 30px;
      left: 30px;
      display: flex;
      flex-direction: column;
      gap: 5px;
    `;

    const barBg = document.createElement('div');
    barBg.style.cssText = `
      width: 200px;
      height: 20px;
      background: rgba(0, 0, 0, 0.6);
      border: 2px solid rgba(255, 255, 255, 0.3);
      border-radius: 4px;
      overflow: hidden;
    `;

    const barFill = document.createElement('div');
    barFill.className = 'health-bar-fill';
    barFill.style.cssText = `
      width: 100%;
      height: 100%;
      background: linear-gradient(90deg, #00ff88, #00cc66);
      transition: width 0.2s ease-out;
    `;
    barBg.appendChild(barFill);

    this.healthText = document.createElement('div');
    this.healthText.style.cssText = `
      font-size: 14px;
      font-weight: bold;
      text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.8);
    `;
    // Don't set initial text - will be set on first update()

    container.appendChild(barBg);
    container.appendChild(this.healthText);

    return container;
  }

  private createAmmoDisplay(): HTMLElement {
    const container = document.createElement('div');
    container.style.cssText = `
      position: absolute;
      bottom: 30px;
      right: 30px;
      font-size: 32px;
      font-weight: bold;
      text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.8);
    `;
    // Don't set initial text - will be set on first update()
    return container;
  }

  private createScoreDisplay(): HTMLElement {
    const container = document.createElement('div');
    container.style.cssText = `
      position: absolute;
      top: 20px;
      left: 50%;
      transform: translateX(-50%);
      display: flex;
      gap: 40px;
      font-size: 28px;
      font-weight: bold;
      text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.8);
    `;

    this.scoreText = document.createElement('span');
    this.scoreText.style.color = '#00ff88';
    this.scoreText.textContent = '0';

    const separator = document.createElement('span');
    separator.textContent = '-';
    separator.style.color = 'rgba(255, 255, 255, 0.6)';

    this.opponentScoreText = document.createElement('span');
    this.opponentScoreText.style.color = '#ff4444';
    this.opponentScoreText.textContent = '0';

    container.appendChild(this.scoreText);
    container.appendChild(separator);
    container.appendChild(this.opponentScoreText);

    return container;
  }

  private createCrosshair(): HTMLElement {
    const crosshair = document.createElement('div');
    crosshair.style.cssText = `
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      width: 20px;
      height: 20px;
    `;

    // Create crosshair lines
    const styles = [
      'top: 50%; left: 0; width: 6px; height: 2px; transform: translateY(-50%);',
      'top: 50%; right: 0; width: 6px; height: 2px; transform: translateY(-50%);',
      'top: 0; left: 50%; width: 2px; height: 6px; transform: translateX(-50%);',
      'bottom: 0; left: 50%; width: 2px; height: 6px; transform: translateX(-50%);'
    ];

    styles.forEach(style => {
      const line = document.createElement('div');
      line.style.cssText = `
        position: absolute;
        background: rgba(255, 255, 255, 0.9);
        ${style}
      `;
      crosshair.appendChild(line);
    });

    // Center dot
    const dot = document.createElement('div');
    dot.style.cssText = `
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      width: 2px;
      height: 2px;
      background: rgba(255, 255, 255, 0.9);
      border-radius: 50%;
    `;
    crosshair.appendChild(dot);

    return crosshair;
  }

  private createHitMarker(): HTMLElement {
    const hitMarker = document.createElement('div');
    hitMarker.style.cssText = `
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      width: 30px;
      height: 30px;
      opacity: 0;
      transition: opacity 0.05s ease-out;
    `;

    // Create X-shaped hit marker
    const line1 = document.createElement('div');
    line1.style.cssText = `
      position: absolute;
      top: 50%;
      left: 50%;
      width: 20px;
      height: 3px;
      background: #ff4444;
      transform: translate(-50%, -50%) rotate(45deg);
    `;

    const line2 = document.createElement('div');
    line2.style.cssText = `
      position: absolute;
      top: 50%;
      left: 50%;
      width: 20px;
      height: 3px;
      background: #ff4444;
      transform: translate(-50%, -50%) rotate(-45deg);
    `;

    hitMarker.appendChild(line1);
    hitMarker.appendChild(line2);

    return hitMarker;
  }

  private createKillFeed(): HTMLElement {
    const container = document.createElement('div');
    container.style.cssText = `
      position: absolute;
      top: 60px;
      right: 20px;
      display: flex;
      flex-direction: column;
      gap: 5px;
      max-width: 300px;
    `;
    return container;
  }

  private createDamageIndicatorContainer(): HTMLElement {
    const container = document.createElement('div');
    container.style.cssText = `
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      width: 200px;
      height: 200px;
      pointer-events: none;
    `;
    return container;
  }

  private createNetworkWarning(): HTMLElement {
    const warning = document.createElement('div');
    warning.style.cssText = `
      position: absolute;
      top: 20px;
      left: 20px;
      padding: 8px 16px;
      background: rgba(255, 100, 0, 0.8);
      border-radius: 4px;
      font-size: 14px;
      font-weight: bold;
      display: none;
    `;
    warning.textContent = '⚠ High Latency';
    return warning;
  }

  private createVignette(): HTMLElement {
    const vignette = document.createElement('div');
    vignette.style.cssText = `
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      pointer-events: none;
      background: radial-gradient(ellipse at center, transparent 50%, rgba(255, 0, 0, 0) 100%);
      opacity: 0;
      transition: opacity 0.3s ease-out;
    `;
    return vignette;
  }

  private createRTTDisplay(): HTMLElement {
    const display = document.createElement('div');
    display.style.cssText = `
      position: absolute;
      top: 50px;
      left: 20px;
      font-size: 12px;
      color: rgba(255, 255, 255, 0.6);
      text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.8);
    `;
    display.textContent = 'RTT: 0ms';
    return display;
  }


  private subscribeToEvents(): void {
    this.unsubscribers.push(
      this.eventBus.on<PlayerDamagedEvent>('player_damaged', (e) => {
        if (e.victimId === this.localPlayerId) {
          // Show damage indicator pointing toward attacker
          // Note: This requires knowing player position and yaw, which should be passed in update()
        }
      }),
      this.eventBus.on<HitConfirmedEvent>('hit_confirmed', (e) => {
        if (e.shooterId === this.localPlayerId) {
          this.showHitMarker();
        }
      }),
      this.eventBus.on<PlayerDeathEvent>('player_death', (e) => {
        // Add to kill feed - names would come from a player registry
        this.addKillFeedEntry(`Player ${e.killerId}`, `Player ${e.victimId}`);
      })
    );
  }

  private pruneExpiredIndicators(currentTime: number): void {
    this.state.damageIndicators = this.state.damageIndicators.filter(
      ind => ind.endTime > currentTime
    );
    this.state.killFeed = this.state.killFeed.filter(
      entry => entry.endTime > currentTime
    );
    if (currentTime > this.state.hitMarkerEndTime) {
      this.state.hitMarkerActive = false;
    }
  }

  private updateLowHealthVignette(): void {
    if (this.state.health <= this.config.lowHealthThreshold) {
      const healthRatio = this.state.health / this.config.lowHealthThreshold;
      this.state.lowHealthVignetteIntensity = 1 - healthRatio;
    } else {
      this.state.lowHealthVignetteIntensity = 0;
    }
  }

  private render(): void {
    this.renderHealthBar();
    this.renderAmmo();
    this.renderScore();
    this.renderHitMarker();
    this.renderKillFeed();
    this.renderDamageIndicators();
    this.renderNetworkWarning();
    this.renderVignette();
    this.renderRTT();
  }

  private renderHealthBar(): void {
    if (!this.healthBar || !this.healthText) return;

    const healthPercent = (this.state.health / this.state.maxHealth) * 100;
    const fill = this.healthBar.querySelector('.health-bar-fill') as HTMLElement;
    if (fill) {
      fill.style.width = `${healthPercent}%`;
      
      // Change color based on health
      if (healthPercent <= 25) {
        fill.style.background = 'linear-gradient(90deg, #ff4444, #cc0000)';
      } else if (healthPercent <= 50) {
        fill.style.background = 'linear-gradient(90deg, #ffaa00, #ff8800)';
      } else {
        fill.style.background = 'linear-gradient(90deg, #00ff88, #00cc66)';
      }
    }

    this.healthText.textContent = `${Math.ceil(this.state.health)} / ${this.state.maxHealth}`;
  }

  private renderAmmo(): void {
    if (!this.ammoText) return;
    this.ammoText.textContent = `${this.state.ammo} / ${this.state.maxAmmo}`;
  }

  private renderScore(): void {
    if (this.scoreText) {
      this.scoreText.textContent = String(this.state.score);
    }
    if (this.opponentScoreText) {
      this.opponentScoreText.textContent = String(this.state.opponentScore);
    }
  }

  private renderHitMarker(): void {
    if (!this.hitMarker) return;
    this.hitMarker.style.opacity = this.state.hitMarkerActive ? '1' : '0';
  }

  private renderKillFeed(): void {
    if (!this.killFeedContainer) return;

    // Clear existing entries
    this.killFeedContainer.innerHTML = '';

    // Add current entries
    for (const entry of this.state.killFeed) {
      const entryEl = document.createElement('div');
      entryEl.style.cssText = `
        padding: 6px 12px;
        background: rgba(0, 0, 0, 0.6);
        border-radius: 4px;
        font-size: 14px;
        display: flex;
        gap: 8px;
        align-items: center;
      `;

      const killer = document.createElement('span');
      killer.style.color = '#00ff88';
      killer.textContent = entry.killerName;

      const icon = document.createElement('span');
      icon.textContent = '🎯';

      const victim = document.createElement('span');
      victim.style.color = '#ff4444';
      victim.textContent = entry.victimName;

      entryEl.appendChild(killer);
      entryEl.appendChild(icon);
      entryEl.appendChild(victim);
      this.killFeedContainer.appendChild(entryEl);
    }
  }

  private renderDamageIndicators(): void {
    if (!this.damageIndicatorContainer) return;

    // Clear existing indicators
    this.damageIndicatorContainer.innerHTML = '';

    // Add current indicators
    for (const indicator of this.state.damageIndicators) {
      const indicatorEl = document.createElement('div');
      const angle = indicator.direction * (180 / Math.PI);
      
      indicatorEl.style.cssText = `
        position: absolute;
        top: 50%;
        left: 50%;
        width: 40px;
        height: 8px;
        background: linear-gradient(90deg, transparent, rgba(255, 0, 0, 0.8));
        transform-origin: left center;
        transform: translate(30px, -50%) rotate(${angle}deg);
        border-radius: 4px;
      `;

      this.damageIndicatorContainer.appendChild(indicatorEl);
    }
  }

  private renderNetworkWarning(): void {
    if (!this.networkWarning) return;
    this.networkWarning.style.display = this.state.showNetworkWarning ? 'block' : 'none';
  }

  private renderVignette(): void {
    if (!this.vignette) return;
    
    if (this.state.lowHealthVignetteIntensity > 0) {
      const intensity = this.state.lowHealthVignetteIntensity * 0.5;
      this.vignette.style.background = `radial-gradient(ellipse at center, transparent 30%, rgba(255, 0, 0, ${intensity}) 100%)`;
      this.vignette.style.opacity = '1';
    } else {
      this.vignette.style.opacity = '0';
    }
  }

  private renderRTT(): void {
    if (!this.rttDisplay) return;
    this.rttDisplay.textContent = `RTT: ${Math.round(this.state.rtt)}ms`;
    
    // Color code based on latency
    if (this.state.rtt > 150) {
      this.rttDisplay.style.color = '#ff4444';
    } else if (this.state.rtt > 80) {
      this.rttDisplay.style.color = '#ffaa00';
    } else {
      this.rttDisplay.style.color = 'rgba(255, 255, 255, 0.6)';
    }
  }
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Calculate the relative angle from player to attacker for damage indicator
 */
export function calculateDamageDirection(
  attackerPosition: Vector3,
  playerPosition: Vector3,
  playerYaw: number
): number {
  const dx = attackerPosition.x - playerPosition.x;
  const dz = attackerPosition.z - playerPosition.z;
  const worldAngle = Math.atan2(dx, dz);
  return worldAngle - playerYaw;
}
