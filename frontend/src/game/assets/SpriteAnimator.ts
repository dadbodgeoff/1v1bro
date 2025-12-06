/**
 * Sprite Animator - Handles frame-based sprite animation
 * Works with canvas frames extracted from sprite sheets
 * Supports directional animations (4 rows: down, right, up, left)
 */

export type Direction = 'down' | 'right' | 'up' | 'left'

export class SpriteAnimator {
  private frames: HTMLCanvasElement[]
  private currentFrame = 0
  private frameTime = 0
  private frameDuration: number
  private framesPerRow: number
  private currentDirection: Direction = 'down'

  constructor(frames: HTMLCanvasElement[], fps = 12, framesPerRow = 8) {
    this.frames = frames
    this.frameDuration = 1 / fps
    this.framesPerRow = framesPerRow
  }

  /**
   * Get the starting frame index for a direction
   */
  private getDirectionOffset(direction: Direction): number {
    const offsets: Record<Direction, number> = {
      down: 0,
      right: 1,
      up: 2,
      left: 3,
    }
    return offsets[direction] * this.framesPerRow
  }

  /**
   * Determine direction from velocity
   */
  private getDirectionFromVelocity(dx: number, dy: number): Direction {
    // Use the dominant axis for direction
    if (Math.abs(dx) > Math.abs(dy)) {
      return dx > 0 ? 'right' : 'left'
    } else {
      return dy > 0 ? 'down' : 'up'
    }
  }

  /**
   * Update animation based on delta time and movement
   */
  update(deltaTime: number, isMoving: boolean, velocityX = 0, velocityY = 0): void {
    if (!isMoving) {
      // Keep current direction but reset to first frame of that direction
      this.currentFrame = 0
      this.frameTime = 0
      return
    }

    // Update direction based on velocity
    if (velocityX !== 0 || velocityY !== 0) {
      this.currentDirection = this.getDirectionFromVelocity(velocityX, velocityY)
    }

    // Advance animation frame
    this.frameTime += deltaTime
    if (this.frameTime >= this.frameDuration) {
      this.frameTime -= this.frameDuration
      this.currentFrame = (this.currentFrame + 1) % this.framesPerRow
    }
  }

  /**
   * Get current frame to render (as canvas element)
   */
  getCurrentFrame(): HTMLCanvasElement {
    const offset = this.getDirectionOffset(this.currentDirection)
    const frameIndex = offset + this.currentFrame
    return this.frames[frameIndex] ?? this.frames[0]
  }

  /**
   * Reset animation to first frame
   */
  reset(): void {
    this.currentFrame = 0
    this.frameTime = 0
    this.currentDirection = 'down'
  }

  /**
   * Get total number of frames
   */
  getFrameCount(): number {
    return this.frames.length
  }

  /**
   * Get current direction
   */
  getDirection(): Direction {
    return this.currentDirection
  }
}
