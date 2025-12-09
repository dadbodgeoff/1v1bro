/**
 * EnvironmentalPropSystem - Places and renders decorative props throughout the arena
 * @module visual/EnvironmentalPropSystem
 */

import type {
  PropDefinition,
  PropInstance,
  PropAnchor,
  PropLayer,
  Vector2,
} from './types'

export class EnvironmentalPropSystem {
  private definitions: Map<string, PropDefinition> = new Map()
  private instances: PropInstance[] = []
  private sprites: Map<string, HTMLImageElement> = new Map()

  async loadDefinitions(themeId: string): Promise<void> {
    try {
      const response = await fetch(`/themes/${themeId}/props.json`)
      if (!response.ok) {
        console.warn(`Props definition not found for theme: ${themeId}`)
        return
      }
      const data = await response.json()

      for (const prop of data.props || []) {
        this.definitions.set(prop.id, prop)
        // Preload sprite
        const img = new Image()
        img.src = `/themes/${themeId}/props/${prop.sprite}`
        try {
          await img.decode()
          this.sprites.set(prop.id, img)
        } catch {
          console.warn(`Failed to load sprite: ${prop.sprite}`)
        }
      }
    } catch (error) {
      console.warn(`Failed to load prop definitions for theme: ${themeId}`, error)
    }
  }

  placeProp(
    definitionId: string,
    position: Vector2,
    layer: PropLayer,
    options?: { rotation?: number; scale?: number }
  ): PropInstance {
    const instance: PropInstance = {
      id: crypto.randomUUID(),
      definitionId,
      position,
      layer,
      rotation: options?.rotation ?? 0,
      scale: options?.scale ?? 1,
      currentFrame: 0,
      animationTime: 0,
      phaseOffset: Math.random() * Math.PI * 2, // Random phase for staggering
    }
    this.instances.push(instance)
    return instance
  }

  /**
   * Place props from map config anchors
   */
  placePropsFromAnchors(anchors: PropAnchor[]): void {
    for (const anchor of anchors) {
      this.placeProp(anchor.definitionId, anchor.position, anchor.layer, {
        rotation: anchor.rotation,
        scale: anchor.scale,
      })
    }
  }

  update(deltaTime: number): void {
    for (const instance of this.instances) {
      const def = this.definitions.get(instance.definitionId)
      if (!def?.animation) continue

      instance.animationTime += deltaTime
      const frameTime = 1 / def.animation.frameRate
      instance.currentFrame =
        Math.floor((instance.animationTime + instance.phaseOffset) / frameTime) %
        def.animation.frames
    }
  }

  render(ctx: CanvasRenderingContext2D, layer: PropLayer): void {
    const layerProps = this.instances.filter((p) => p.layer === layer)

    for (const prop of layerProps) {
      const def = this.definitions.get(prop.definitionId)
      const sprite = this.sprites.get(prop.definitionId)
      if (!def) continue

      ctx.save()
      ctx.translate(prop.position.x, prop.position.y)
      ctx.rotate(prop.rotation)
      ctx.scale(prop.scale, prop.scale)

      if (sprite) {
        // Draw current animation frame
        const frameWidth = def.size.width
        const frameX = prop.currentFrame * frameWidth
        ctx.drawImage(
          sprite,
          frameX,
          0,
          frameWidth,
          def.size.height,
          -def.anchor.x * frameWidth,
          -def.anchor.y * def.size.height,
          frameWidth,
          def.size.height
        )
      } else {
        // Fallback: draw placeholder rectangle
        ctx.fillStyle = 'rgba(255, 0, 255, 0.5)'
        ctx.fillRect(
          -def.anchor.x * def.size.width,
          -def.anchor.y * def.size.height,
          def.size.width,
          def.size.height
        )
      }

      ctx.restore()
    }
  }

  getPropsInLayer(layer: PropLayer): PropInstance[] {
    return this.instances.filter((p) => p.layer === layer)
  }

  /**
   * Get all prop instances
   */
  getAllProps(): PropInstance[] {
    return this.instances
  }

  /**
   * Get prop definition by ID
   */
  getDefinition(id: string): PropDefinition | undefined {
    return this.definitions.get(id)
  }

  /**
   * Clear all prop instances
   */
  clearInstances(): void {
    this.instances = []
  }

  /**
   * Remove a specific prop instance
   */
  removeProp(instanceId: string): void {
    this.instances = this.instances.filter((p) => p.id !== instanceId)
  }
}
