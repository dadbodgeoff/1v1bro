/**
 * Scale train GLB to 26m length and rotate to align with Z axis
 */
import { Document, NodeIO } from '@gltf-transform/core';
import { dedup, prune } from '@gltf-transform/functions';
import { EXTTextureWebP } from '@gltf-transform/extensions';

const INPUT = process.argv[2] || 'train2.glb';
const OUTPUT = process.argv[3] || 'train2-scaled.glb';
const TARGET_LENGTH = 26; // meters

async function scaleTrain() {
  const io = new NodeIO().registerExtensions([EXTTextureWebP]);
  
  console.log(`Loading ${INPUT}...`);
  const document = await io.read(INPUT);
  
  const root = document.getRoot();
  const scenes = root.listScenes();
  
  console.log(`Found ${scenes.length} scene(s)`);
  
  // First pass - find the bounding box to calculate scale
  let minX = Infinity, maxX = -Infinity;
  let minY = Infinity, maxY = -Infinity;
  let minZ = Infinity, maxZ = -Infinity;
  
  for (const mesh of document.getRoot().listMeshes()) {
    for (const prim of mesh.listPrimitives()) {
      const position = prim.getAttribute('POSITION');
      if (position) {
        const arr = position.getArray();
        for (let i = 0; i < arr.length; i += 3) {
          minX = Math.min(minX, arr[i]);
          maxX = Math.max(maxX, arr[i]);
          minY = Math.min(minY, arr[i + 1]);
          maxY = Math.max(maxY, arr[i + 1]);
          minZ = Math.min(minZ, arr[i + 2]);
          maxZ = Math.max(maxZ, arr[i + 2]);
        }
      }
    }
  }
  
  const sizeX = maxX - minX;
  const sizeY = maxY - minY;
  const sizeZ = maxZ - minZ;
  const maxDim = Math.max(sizeX, sizeY, sizeZ);
  const scaleFactor = TARGET_LENGTH / maxDim;
  
  console.log(`Original size: ${sizeX.toFixed(2)} x ${sizeY.toFixed(2)} x ${sizeZ.toFixed(2)}`);
  console.log(`Longest axis: ${maxDim.toFixed(2)}m, scale factor: ${scaleFactor.toFixed(2)}x`);
  
  for (const scene of scenes) {
    const children = scene.listChildren();
    console.log(`Scene has ${children.length} root node(s)`);
    
    for (const node of children) {
      const currentScale = node.getScale();
      node.setScale([
        currentScale[0] * scaleFactor,
        currentScale[1] * scaleFactor,
        currentScale[2] * scaleFactor
      ]);
      
      // Rotate 90° around Y axis so train runs along Z axis instead of X
      node.setRotation([0, 0.7071067811865476, 0, 0.7071067811865476]);
      
      console.log(`Scaled node "${node.getName()}" by ${scaleFactor.toFixed(2)}x and rotated 90° on Y`);
    }
  }
  
  await document.transform(dedup(), prune());
  
  console.log(`Writing ${OUTPUT}...`);
  await io.write(OUTPUT, document);
  
  console.log('Done!');
}

scaleTrain().catch(console.error);
