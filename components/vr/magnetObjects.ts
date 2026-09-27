import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';

export type MagnetObjectId = 'clip' | 'screw' | 'wood' | 'spoon';

function steel() {
  return new THREE.MeshStandardMaterial({ color: '#b9c2ca', metalness: 0.96, roughness: 0.27 });
}

function woodTexture(endGrain: boolean) {
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = 256;
  const context = canvas.getContext('2d')!;
  context.fillStyle = '#bd8b52'; context.fillRect(0, 0, 256, 256);
  for (let i = 0; i < 100; i++) {
    context.strokeStyle = `rgba(92,53,24,${0.13 + (i % 5) * 0.022})`;
    context.lineWidth = i % 7 === 0 ? 1.9 : 0.6;
    context.beginPath();
    if (endGrain) {
      context.ellipse(82, 140, 7 + i * 2.4, 10 + i * 2.8, 0.12, 0, Math.PI * 2);
    } else {
      for (let y = 0; y <= 256; y += 4) {
        const x = i * 2.7 + Math.sin(y * 0.019 + i * 0.14) * 5 + Math.sin(y * 0.06 + i) * 0.7;
        if (y === 0) context.moveTo(x, y); else context.lineTo(x, y);
      }
    }
    context.stroke();
  }
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 4;
  return texture;
}

export function createMagnetObject(id: MagnetObjectId) {
  const group = new THREE.Group();
  if (id === 'clip') {
    // One continuous wire makes the nested bends of a real open paper clip.
    const points: THREE.Vector3[] = [];
    const point = (x: number, z: number) => points.push(new THREE.Vector3(x, 0, z));
    point(0.28, -0.18); point(-0.32, -0.18);
    for (let i = 1; i <= 24; i++) {
      const a = -Math.PI / 2 - i / 24 * Math.PI;
      point(-0.32 + Math.cos(a) * 0.18, Math.sin(a) * 0.18);
    }
    point(0.31, 0.18);
    for (let i = 1; i <= 24; i++) {
      const a = Math.PI / 2 - i / 24 * Math.PI;
      point(0.31 + Math.cos(a) * 0.13, 0.05 + Math.sin(a) * 0.13);
    }
    point(-0.26, -0.08);
    for (let i = 1; i <= 20; i++) {
      const a = -Math.PI / 2 - i / 20 * Math.PI;
      point(-0.26 + Math.cos(a) * 0.065, -0.015 + Math.sin(a) * 0.065);
    }
    point(0.2, 0.05);
    const path = new THREE.CurvePath<THREE.Vector3>();
    for (let i = 1; i < points.length; i++) path.add(new THREE.LineCurve3(points[i - 1], points[i]));
    const mat = steel();
    group.add(new THREE.Mesh(new THREE.TubeGeometry(path, 220, 0.027, 8, false), mat));
    for (const p of [points[0], points[points.length - 1]]) {
      const cap = new THREE.Mesh(new THREE.SphereGeometry(0.027, 8, 6), mat); cap.position.copy(p); group.add(cap);
    }
    group.rotation.y = -0.18;
  } else if (id === 'screw') {
    const mat = steel();
    const profile = [[0, -0.54], [0.125, -0.54], [0.144, -0.53], [0.147, -0.505], [0.137, -0.48], [0.052, -0.472], [0.047, -0.4], [0.043, 0.36], [0.032, 0.46], [0, 0.64]];
    const nail = new THREE.Mesh(new THREE.LatheGeometry(profile.map(([r, y]) => new THREE.Vector2(r, y)), 40), mat);
    nail.rotation.z = -Math.PI / 2;
    group.add(nail);
    const scoreMat = new THREE.MeshStandardMaterial({ color: '#747f88', metalness: 0.85, roughness: 0.4 });
    for (let i = 0; i < 6; i++) {
      const line = new THREE.Mesh(new THREE.CylinderGeometry(0.0018, 0.0018, 0.15, 4), scoreMat);
      line.rotation.x = Math.PI / 2; line.position.set(-0.541, (i - 2.5) * 0.029, 0); group.add(line);
    }
    group.rotation.y = 0.13;
  } else if (id === 'wood') {
    const grain = woodTexture(false), end = woodTexture(true);
    const side = new THREE.MeshStandardMaterial({ map: grain, roughness: 0.84 });
    const cut = new THREE.MeshStandardMaterial({ map: end, roughness: 0.88 });
    group.add(new THREE.Mesh(new RoundedBoxGeometry(0.76, 0.54, 0.65, 3, 0.045), [side, side, cut, cut, side, side]));
    group.rotation.y = -0.16;
  } else {
    const mat = new THREE.MeshPhysicalMaterial({ color: '#2998b7', roughness: 0.26, metalness: 0, clearcoat: 0.8, clearcoatRoughness: 0.2 });
    // Double-walled elliptical bowl, including a closed rim and a visible hollow interior.
    const vertices: number[] = [], indices: number[] = [];
    const rings = 14, segments = 48;
    for (let shell = 0; shell < 2; shell++) for (let r = 0; r <= rings; r++) for (let s = 0; s <= segments; s++) {
      const t = r / rings, a = s / segments * Math.PI * 2;
      vertices.push(0.36 + Math.cos(a) * 0.32 * t, 0.12 * t * t - (shell === 1 ? 0.023 : 0), Math.sin(a) * 0.235 * t);
    }
    const stride = segments + 1, layer = (rings + 1) * stride;
    for (let shell = 0; shell < 2; shell++) for (let r = 0; r < rings; r++) for (let s = 0; s < segments; s++) {
      const a = shell * layer + r * stride + s, b = a + stride;
      if (shell === 0) indices.push(a, a + 1, b, a + 1, b + 1, b);
      else indices.push(a, b, a + 1, a + 1, b, b + 1);
    }
    for (let s = 0; s < segments; s++) {
      const a = rings * stride + s, b = a + layer;
      indices.push(a, b, a + 1, a + 1, b, b + 1);
    }
    const bowl = new THREE.BufferGeometry(); bowl.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3)); bowl.setIndex(indices); bowl.computeVertexNormals();
    group.add(new THREE.Mesh(bowl, mat));
    const handleShape = new THREE.Shape();
    handleShape.moveTo(-0.68, -0.065); handleShape.bezierCurveTo(-0.81, -0.08, -0.81, 0.08, -0.68, 0.065);
    handleShape.bezierCurveTo(-0.36, 0.038, -0.04, 0.039, 0.1, 0.065);
    handleShape.lineTo(0.1, -0.065); handleShape.bezierCurveTo(-0.04, -0.039, -0.36, -0.038, -0.68, -0.065);
    const handle = new THREE.Mesh(new THREE.ExtrudeGeometry(handleShape, { depth: 0.018, bevelEnabled: true, bevelThickness: 0.007, bevelSize: 0.007, bevelSegments: 2, steps: 1, curveSegments: 20 }), mat);
    handle.rotation.x = -Math.PI / 2; handle.position.y = 0.104; group.add(handle);
    group.rotation.y = -0.12;
  }
  group.traverse((object) => { if (object instanceof THREE.Mesh) { object.castShadow = true; object.receiveShadow = true; } });
  return group;
}
