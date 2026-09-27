import * as THREE from 'three';
import * as CANNON from 'cannon-es';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import type { MaterialActivity } from './materialActivities';

export type FoundationKind = 'force' | 'matter' | 'earth';

// Equal force pulses, fixed timesteps and identical drag isolate the effect of mass.
export function createPushModel(mass: number) {
  const world = new CANNON.World({ gravity: new CANNON.Vec3(0, 0, 0) });
  const body = new CANNON.Body({ mass, shape: new CANNON.Box(new CANNON.Vec3(0.38, 0.32, 0.38)), linearDamping: 0.9 });
  body.linearFactor.set(0, 0, 1); body.fixedRotation = true; body.updateMassProperties();
  world.addBody(body);
  let steps = 0;
  return { update(seconds: number) {
    const goal = Math.floor(Math.min(Math.max(seconds, 0), 6) * 120);
    while (steps < goal) {
      if (steps < 42) body.applyForce(new CANNON.Vec3(0, 0, 10));
      world.step(1 / 120); steps++;
    }
    return body.position.z;
  } };
}

export function createFoundationActivity(
  kind: FoundationKind, id: number, group: THREE.Group, scene: THREE.Scene,
  target: THREE.Vector3, accent: string,
): MaterialActivity {
  function mesh(geometry: THREE.BufferGeometry, color: string, parent: THREE.Object3D = scene, opacity = 1) {
    const object = new THREE.Mesh(geometry, new THREE.MeshStandardMaterial({
      color, roughness: 0.42, transparent: opacity < 1, opacity,
      depthWrite: opacity === 1, side: THREE.DoubleSide,
    }));
    object.castShadow = opacity === 1; object.receiveShadow = true;
    parent.add(object); return object;
  }
  function ring(radius: number, color: string, parent: THREE.Object3D, x: number, y: number, z: number) {
    const rim = mesh(new THREE.TorusGeometry(radius, 0.022, 8, 40), color, parent);
    rim.rotation.x = Math.PI / 2; rim.position.set(x, y, z); return rim;
  }

  if (kind === 'force') {
    target.set(target.x, 1.24, -3.15);
    const lane = mesh(new RoundedBoxGeometry(1.65, 0.12, 3.05, 3, 0.04), '#e4edef');
    lane.position.set(target.x, 0.86, -2.02);
    for (const offset of [-0.81, 0.81]) mesh(new THREE.BoxGeometry(0.045, 0.1, 3.05), accent).position.set(target.x + offset, 0.96, -2.02);
    for (let n = 0; n < 9; n++) {
      mesh(new THREE.BoxGeometry(n === 0 ? 1.52 : 0.12, 0.008, 0.022), n === 0 ? accent : '#82999f').position.set(target.x + (n === 0 ? 0 : 0.65), 0.927, -3.15 + n * 0.29);
    }
    const box = mesh(new RoundedBoxGeometry(0.76, 0.64, 0.76, 3, 0.035), id === 0 ? '#e0b574' : '#75a4b9', group);
    box.material.roughness = 0.8;
    mesh(new THREE.BoxGeometry(0.16, 0.648, 0.765), '#f1e5c6', group);
    for (const offset of [-0.26, 0.26]) mesh(new THREE.BoxGeometry(0.014, 0.44, 0.009), '#62706f', group).position.set(offset, 0, 0.384);
    const ballast = mesh(new THREE.BoxGeometry(0.26, 0.13, 0.012), '#f1f5f4', group);
    ballast.position.set(0, -0.11, 0.385);
    for (let n = 0; n < (id === 0 ? 1 : 3); n++) mesh(new THREE.BoxGeometry(0.045, 0.07, 0.014), '#4d616b', group).position.set((n - (id === 0 ? 0 : 1)) * 0.065, -0.11, 0.4);
    const trail = mesh(new THREE.BoxGeometry(0.12, 0.012, 1), accent);
    trail.visible = false;
    const pusher = mesh(new THREE.BoxGeometry(0.5, 0.3, 0.06), '#93aeb8');
    pusher.position.set(target.x, 1.2, -3.58); pusher.visible = false;
    const physics = createPushModel(id === 0 ? 1 : 3);
    group.userData.mass = id === 0 ? 1 : 3;
    return { update(seconds) {
      const distance = physics.update(seconds);
      group.position.set(target.x, target.y, target.z + distance);
      group.userData.distance = distance;
      trail.visible = distance > 0.01; trail.scale.z = Math.max(0.001, distance);
      trail.position.set(target.x, 0.935, target.z + distance / 2);
      pusher.visible = seconds < 0.35; pusher.position.z = group.position.z - 0.42;
      return seconds >= 6;
    } };
  }

  if (kind === 'matter') {
    const wide = id % 2 === 1, isWater = id < 2;
    const radius = wide ? 0.58 : 0.32, height = wide ? 0.39 : 1.06, baseY = 0.98;
    const points = [new THREE.Vector2(radius - 0.025, 0), new THREE.Vector2(radius, 0.025), new THREE.Vector2(radius, height), new THREE.Vector2(radius - 0.022, height), new THREE.Vector2(radius - 0.022, 0.045)];
    const vessel = mesh(new THREE.LatheGeometry(points, 48), '#bad9df', scene, 0.2);
    vessel.position.set(target.x, baseY, target.z);
    ring(radius, accent, scene, target.x, baseY + height, target.z);
    mesh(new THREE.CylinderGeometry(radius - 0.02, radius - 0.02, 0.025, 40), '#d4e8e9', scene, 0.45).position.set(target.x, baseY + 0.02, target.z);
    if (!isWater) {
      const rock = mesh(new THREE.DodecahedronGeometry(0.235, 1), '#8b9497', group);
      const vertices = rock.geometry.attributes.position;
      for (let n = 0; n < vertices.count; n++) {
        const x = vertices.getX(n), y = vertices.getY(n), z = vertices.getZ(n);
        const scale = 1 + 0.08 * Math.sin(x * 18 + y * 9 + z * 13);
        vertices.setXYZ(n, x * scale, y * scale, z * scale);
      }
      rock.geometry.computeVertexNormals(); rock.material.roughness = 0.92;
      target.y = baseY + 0.27;
      return { update(seconds) {
        group.position.y = target.y + (1 - THREE.MathUtils.smoothstep(seconds, 0, 1.3)) * 0.65;
        return seconds >= 2;
      } };
    }
    const volume = Math.PI * 0.298 ** 2 * 0.72;
    const waterRadius = radius - 0.022;
    const waterHeight = volume / (Math.PI * waterRadius ** 2);
    const water = mesh(new THREE.CylinderGeometry(waterRadius, waterRadius, waterHeight, 48), '#399ecc', scene, 0.72);
    water.visible = false; water.userData.volume = volume;
    const jug = mesh(new THREE.CylinderGeometry(0.32, 0.31, 0.85, 32, 1, true), '#b5dce4', group, 0.5);
    jug.position.y = 0.06;
    const fill = mesh(new THREE.CylinderGeometry(0.298, 0.298, 0.72, 32), '#399ecc', group, 0.8);
    fill.position.y = 0.06;
    ring(0.32, accent, group, 0, 0.485, 0);
    const handle = mesh(new THREE.TorusGeometry(0.26, 0.036, 8, 24, Math.PI * 1.5), accent, group);
    handle.position.set(0.38, 0.06, 0); handle.rotation.z = -Math.PI * 0.75;
    const spout = mesh(new THREE.CylinderGeometry(0.075, 0.11, 0.2, 16, 1, true), accent, group);
    spout.rotation.x = Math.PI / 3; spout.position.set(0, 0.4, 0.3);
    target.y = baseY + height + 0.48;
    const stream = mesh(new THREE.CylinderGeometry(0.025, 0.04, 0.55, 12), '#63bedf', scene, 0.8);
    stream.visible = false; stream.position.set(target.x, baseY + height + 0.15, target.z + 0.08);
    return { update(seconds) {
      const poured = THREE.MathUtils.smoothstep(seconds, 0.5, 3);
      group.rotation.x = Math.min(seconds / 0.5, 1) * 0.85;
      fill.scale.y = Math.max(0.001, 1 - poured);
      fill.position.y = -0.3 + 0.36 * (1 - poured);
      water.visible = poured > 0; water.scale.y = Math.max(0.001, poured);
      water.position.set(target.x, baseY + 0.04 + waterHeight * poured / 2, target.z);
      stream.visible = seconds > 0.5 && seconds < 3;
      group.visible = seconds < 3.2;
      return seconds >= 3.5;
    } };
  }

  const slopeHeight = id === 0 ? 0.34 : 0.88;
  const slopeZ = -2.6, halfLength = 0.83, floorY = 1.02;
  // Erosion is a qualitative comparison model, not a prediction of real sediment amounts.
  const soilGeometry = new THREE.BoxGeometry(1.85, 0.2, halfLength * 2, 8, 1, 8);
  const positions = soilGeometry.attributes.position;
  for (let n = 0; n < positions.count; n++) if (positions.getY(n) > 0) {
    positions.setY(n, 0.1 + slopeHeight * (halfLength - positions.getZ(n)) / (2 * halfLength));
  }
  soilGeometry.computeVertexNormals();
  const soil = mesh(soilGeometry, '#ad895a'); soil.position.set(target.x, floorY - 0.1, slopeZ); soil.material.roughness = 1;
  for (const side of [-0.97, 0.97]) {
    const rail = mesh(new THREE.BoxGeometry(0.055, 0.14, Math.hypot(halfLength * 2, slopeHeight)), accent);
    rail.rotation.x = Math.atan2(slopeHeight, halfLength * 2);
    rail.position.set(target.x + side, floorY + slopeHeight / 2, slopeZ);
  }
  const basin = mesh(new THREE.CylinderGeometry(0.61, 0.54, 0.12, 40), '#e9f0ee');
  basin.position.set(target.x, 0.95, -1.03);
  ring(0.6, accent, scene, target.x, 1.02, -1.03);
  const runoff = mesh(new THREE.CylinderGeometry(0.53, 0.53, 0.04, 36), '#80c7db', scene, 0.8);
  runoff.position.set(target.x, 1.012, -1.03); runoff.visible = false;
  const grains = Array.from({ length: 60 }, (_, n) => {
    const grain = mesh(new THREE.IcosahedronGeometry(0.035 + n % 3 * 0.006, 0), n % 2 ? '#89643e' : '#d2b076');
    const gx = target.x + Math.sin(n * 2.4) * 0.78;
    const gz = slopeZ - halfLength + 0.12 + (n % 10) * 0.145;
    const gy = floorY + slopeHeight * (slopeZ + halfLength - gz) / (halfLength * 2) + 0.04;
    const start = new THREE.Vector3(gx, gy, gz);
    grain.position.copy(start);
    const end = new THREE.Vector3(target.x + Math.sin(n * 2.4) * 0.42, 1.05 + n % 3 * 0.015, -1.03 + Math.cos(n * 2.4) * 0.4);
    return { grain, start, end };
  });
  mesh(new THREE.CylinderGeometry(0.29, 0.25, 0.45, 32), accent, group);
  const grip = mesh(new THREE.TorusGeometry(0.25, 0.04, 8, 24, Math.PI * 1.5), accent, group);
  grip.position.x = -0.28; grip.rotation.z = Math.PI * 0.75;
  const neck = mesh(new THREE.CylinderGeometry(0.055, 0.085, 0.48, 16), accent, group);
  neck.rotation.x = -Math.PI / 3; neck.position.set(0, 0.02, -0.37);
  const shower = mesh(new THREE.CylinderGeometry(0.19, 0.09, 0.1, 24), '#dde8e8', group);
  shower.rotation.x = -Math.PI / 3; shower.position.set(0, 0.16, -0.58);
  target.set(target.x, 2.66, -2.4);
  const rain = Array.from({ length: 48 }, (_, n) => {
    const drop = mesh(new THREE.SphereGeometry(0.025, 8, 6), '#439cca', scene, 0.85);
    drop.scale.y = 2.4; drop.visible = false; return { drop, n };
  });
  return { update(seconds) {
    group.rotation.x = -THREE.MathUtils.smoothstep(seconds, 0, 0.5) * 0.35;
    const wet = THREE.MathUtils.smoothstep(seconds, 0.5, 5.5);
    soil.material.color.lerpColors(new THREE.Color('#ad895a'), new THREE.Color('#8c6d49'), wet * 0.6);
    rain.forEach(({ drop, n }) => {
      const gz = slopeZ - 0.7 + (n % 8) * 0.19;
      const landing = floorY + slopeHeight * (slopeZ + halfLength - gz) / (halfLength * 2);
      const fall = (seconds * 1.8 + n / 48) % 1;
      drop.visible = seconds > 0.5 && seconds < 5.5;
      drop.position.set(target.x + Math.sin(n * 2.4) * 0.77, THREE.MathUtils.lerp(2.65, landing, fall), gz);
    });
    runoff.visible = wet > 0; runoff.material.color.lerpColors(new THREE.Color('#80c7db'), new THREE.Color('#9f7950'), wet * (id === 0 ? 0.2 : 0.8));
    const moved = id === 0 ? 12 : 42;
    grains.forEach(({ grain, start, end }, n) => {
      const t = n < moved ? THREE.MathUtils.smoothstep(seconds, 0.8 + n * 0.04, 4.4 + n * 0.025) : 0;
      grain.position.lerpVectors(start, end, t);
    });
    group.userData.movedGrains = seconds >= 6 ? moved : 0;
    return seconds >= 6;
  } };
}
