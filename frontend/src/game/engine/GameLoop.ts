/**
 * GameLoop - Manages game timing and animation frame loop
 * Single responsibility: Start/stop loop, track timing
 */

export type UpdateCallback = (deltaTime: number) => void
export type RenderCallback = () => void

export class GameLoop {
  private isRunning = false
  private animationFrameId: number | null = null
  private lastFrameTime = 0
  private animationTime = 0

  private updateCallback: UpdateCallback | null = null
  private renderCallback: RenderCallback | null = null

  setCallbacks(update: UpdateCallback, render: RenderCallback): void {
    this.updateCallback = update
    this.renderCallback = render
  }

  start(): void {
    if (this.isRunning) return
    this.isRunning = true
    this.lastFrameTime = performance.now()
    this.loop()
  }

  stop(): void {
    this.isRunning = false
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId)
      this.animationFrameId = null
    }
  }

  getAnimationTime(): number {
    return this.animationTime
  }

  private loop = (): void => {
    if (!this.isRunning) return

    const now = performance.now()
    const deltaTime = (now - this.lastFrameTime) / 1000
    this.lastFrameTime = now
    this.animationTime += deltaTime

    this.updateCallback?.(deltaTime)
    this.renderCallback?.()

    this.animationFrameId = requestAnimationFrame(this.loop)
  }
}
