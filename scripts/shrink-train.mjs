/**
 * Shrink train3.glb by scaling all vertex positions
 * This bakes the scale into the geometry itself
 */

import * as THREE from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { GLTFExporter } from 'three/examples/jsm/exporters/GLTFExporter.js'
import fs from 'fs'
import path from 'path'

const SCALE = 0.22 // Scale down to ~22% (11.9m -> 2.6m height)

async function shrinkTrain() {
  // Load the GLB
  const data = fs.readFileSync('train3.glb')
  const arrayBuffer = data.buffer.slice(data.byteOffset, data.byteOffset + data.byteLength)
  
  const loader = new GLTFLoader()
  
  return new Promise((resolve, reject) => {
    loader.parse(arrayBuffer, '', async (gltf) => {
      const scene = gltf.scene
      
      // Scale the entire scene
      scene.scale.setScalar(SCALE)
      
      // Update matrices
      scene.updateMatrixWorld(true)
      
      // Bake the transforms into geometry
      scene.traverse((child) => {
        if (child.isMesh && child.geometry) {
          child.geometry.applyMatrix4(child.matrixWorld)
          child.position.set(0, 0, 0)
          child.rotation.set(0, 0, 0)
          child.scale.set(1, 1, 1)
          child.updateMatrix()
        }
      })
      
      // Reset scene transform
      scene.scale.set(1, 1, 1)
      scene.updateMatrixWorld(true)
      
      // Export
      const exporter = new GLTFExporter()
      exporter.parse(scene, (result) => {
        const output = Buffer.from(result)
        fs.writeFileSync('train3-shrunk.glb', output)
        console.log('Saved train3-shrunk.glb')
        resolve()
      }, (error) => reject(error), { binary: true })
    }, reject)
  })
}

shrinkTrain().catch(console.error)
