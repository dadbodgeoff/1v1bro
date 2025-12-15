/**
 * GhostRenderer Tests
 * Tests for the personal best ghost visualization system
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import * as THREE from 'three'
import { GhostRenderer } from './GhostRenderer'
import type { GhostState } from '../types/survival'

// Mock Three.js scene
function createMockScene(): THREE.Scene {
  const scene = new THREE.Scene()
  return scene
}

// Create mock character meshes
function createMockCharacterMeshes() {
  const createMesh = () => {
    const group = new THREE.Group()
    const geometry = new THREE.BoxGeometry(1, 2, 1)
    const material = new THREE.MeshStandardMaterial({ color: 0xff0000 })
    const mesh = new THREE.Mesh(geometry, material)
    group.add(mesh)
    return group
  }
  
  return {
    run: createMesh(),
    jump: createMesh(),
    down: createMesh(),
  }
}

describe('GhostRenderer', () => {
  let scene: THREE.Scene
  let ghostRenderer: GhostRenderer
  let characterMeshes: ReturnType<typeof createMockCharacterMeshes>
  
  beforeEach(() => {
    scene = createMockScene()
    ghostRenderer = new GhostRenderer(scene)
    characterMeshes = createMockCharacterMeshes()
  })
  
  describe('initialization', () => {
    it('should not be ready before initialization', () => {
      expect(ghostRenderer.isReady()).toBe(false)
    })
    
    it('should be ready after initialization', () => {
      ghostRenderer.initialize(characterMeshes)
      expect(ghostRenderer.isReady()).toBe(true)
    })
    
    it('should add ghost meshes to scene', () => {
      const initialChildCount = scene.children.length
      ghostRenderer.initialize(characterMeshes)
      // Should add 3 meshes (run, jump, down)
      expect(scene.children.length).toBe(initialChildCount + 3)
    })
    
    it('should hide all meshes initially', () => {
      ghostRenderer.initialize(characterMeshes)
      scene.children.forEach(child => {
        if (child instanceof THREE.Group) {
          expect(child.visible).toBe(false)
        }
      })
    })
  })
  
  describe('update', () => {
    beforeEach(() => {
      ghostRenderer.initialize(characterMeshes)
    })
    
    it('should hide ghost when not active', () => {
      const inactiveState: GhostState = {
        active: false,
        currentEventIndex: 0,
        position: { x: 0, z: 0 },
        opacity: 0,
        tint: 0x00ffff,
        isJumping: false,
        isSliding: false,
      }
      
      ghostRenderer.update(inactiveState, 0)
      
      // All meshes should be hidden
      scene.children.forEach(child => {
        if (child instanceof THREE.Group) {
          expect(child.visible).toBe(false)
        }
      })
    })
    
    it('should show ghost when active', () => {
      const activeState: GhostState = {
        active: true,
        currentEventIndex: 0,
        position: { x: 0, z: -100 },
        opacity: 0.5,
        tint: 0x00ffff,
        isJumping: false,
        isSliding: false,
      }
      
      ghostRenderer.update(activeState, 0)
      
      // At least one mesh should be visible
      const visibleMeshes = scene.children.filter(
        child => child instanceof THREE.Group && child.visible
      )
      expect(visibleMeshes.length).toBe(1)
    })
    
    it('should switch to jump mesh when jumping', () => {
      const jumpingState: GhostState = {
        active: true,
        currentEventIndex: 0,
        position: { x: 0, z: -100 },
        opacity: 0.5,
        tint: 0x00ffff,
        isJumping: true,
        isSliding: false,
      }
      
      ghostRenderer.update(jumpingState, 0)
      
      // Should have exactly one visible mesh
      const visibleMeshes = scene.children.filter(
        child => child instanceof THREE.Group && child.visible
      )
      expect(visibleMeshes.length).toBe(1)
    })
    
    it('should switch to down mesh when sliding', () => {
      const slidingState: GhostState = {
        active: true,
        currentEventIndex: 0,
        position: { x: 0, z: -100 },
        opacity: 0.5,
        tint: 0x00ffff,
        isJumping: false,
        isSliding: true,
      }
      
      ghostRenderer.update(slidingState, 0)
      
      // Should have exactly one visible mesh
      const visibleMeshes = scene.children.filter(
        child => child instanceof THREE.Group && child.visible
      )
      expect(visibleMeshes.length).toBe(1)
    })
    
    it('should update position based on ghost state', () => {
      const state: GhostState = {
        active: true,
        currentEventIndex: 0,
        position: { x: 1, z: -150 }, // Lane 1 (right)
        opacity: 0.5,
        tint: 0x00ffff,
        isJumping: false,
        isSliding: false,
      }
      
      ghostRenderer.update(state, 0)
      
      // Find the visible mesh
      const visibleMesh = scene.children.find(
        child => child instanceof THREE.Group && child.visible
      ) as THREE.Group
      
      expect(visibleMesh).toBeDefined()
      expect(visibleMesh.position.z).toBe(-150)
    })
  })
  
  describe('reset', () => {
    beforeEach(() => {
      ghostRenderer.initialize(characterMeshes)
    })
    
    it('should hide all meshes on reset', () => {
      // First make ghost visible
      const activeState: GhostState = {
        active: true,
        currentEventIndex: 0,
        position: { x: 0, z: -100 },
        opacity: 0.5,
        tint: 0x00ffff,
        isJumping: false,
        isSliding: false,
      }
      ghostRenderer.update(activeState, 0)
      
      // Then reset
      ghostRenderer.reset()
      
      // All meshes should be hidden
      scene.children.forEach(child => {
        if (child instanceof THREE.Group) {
          expect(child.visible).toBe(false)
        }
      })
    })
  })
  
  describe('dispose', () => {
    it('should remove all meshes from scene', () => {
      ghostRenderer.initialize(characterMeshes)
      const meshCount = scene.children.length
      
      ghostRenderer.dispose()
      
      // Scene should have fewer children
      expect(scene.children.length).toBeLessThan(meshCount)
    })
    
    it('should not be ready after dispose', () => {
      ghostRenderer.initialize(characterMeshes)
      ghostRenderer.dispose()
      
      expect(ghostRenderer.isReady()).toBe(false)
    })
  })
})
