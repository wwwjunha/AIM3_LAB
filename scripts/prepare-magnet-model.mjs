import { readFile, mkdir, writeFile } from 'node:fs/promises';
import * as THREE from 'three';
import { FBXLoader } from 'three/addons/loaders/FBXLoader.js';
import { GLTFExporter } from 'three/addons/exporters/GLTFExporter.js';
import { mergeVertices } from 'three/addons/utils/BufferGeometryUtils.js';

const sourcePath = process.argv[2];
if (!sourcePath) throw new Error('Pass the source magnet.fbx path.');
// GLTFExporter uses FileReader for binary buffers even when no textures are present.
globalThis.FileReader = class {
  readAsArrayBuffer(blob) {
    blob.arrayBuffer().then((result) => { this.result = result; this.onloadend?.(); });
  }
};
const source = await readFile(sourcePath);
const model = new FBXLoader().parse(source.buffer.slice(source.byteOffset, source.byteOffset + source.byteLength), '');
model.updateMatrixWorld(true);
let horseshoe;
model.traverse((object) => {
  if (object.isMesh && Array.isArray(object.material) && object.material.some((mat) => mat.name === 'mag')) horseshoe = object;
});
if (!horseshoe) throw new Error('Horseshoe mesh was not found in the FBX.');
let geometry = horseshoe.geometry.clone().applyMatrix4(horseshoe.matrixWorld);
geometry.rotateX(Math.PI / 2);
geometry.computeBoundingBox();
const box = geometry.boundingBox;
const center = box.getCenter(new THREE.Vector3());
geometry.translate(-center.x, -box.min.y, -center.z);
const scale = 2.4 / (box.max.y - box.min.y);
geometry.scale(scale, scale, scale);
geometry = mergeVertices(geometry, 0.00001);
const materials = horseshoe.material.map((mat) => mat.name === 'mag'
  ? new THREE.MeshPhysicalMaterial({ name: 'Red enamel', color: '#b9232c', metalness: 0.32, roughness: 0.28, clearcoat: 0.7, clearcoatRoughness: 0.23, side: THREE.DoubleSide })
  : new THREE.MeshStandardMaterial({ name: 'Brushed steel poles', color: '#bfc6cb', metalness: 0.94, roughness: 0.3 }));
const mesh = new THREE.Mesh(geometry, materials);
mesh.name = 'User supplied horseshoe magnet';
const glb = await new GLTFExporter().parseAsync(mesh, { binary: true });
await mkdir('public/models', { recursive: true });
await writeFile('public/models/horseshoe-magnet.glb', Buffer.from(glb));
console.log(JSON.stringify({ output: 'public/models/horseshoe-magnet.glb', bytes: glb.byteLength, triangles: geometry.index.count / 3, bounds: new THREE.Box3().setFromObject(mesh) }));
