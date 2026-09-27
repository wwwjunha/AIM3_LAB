import * as THREE from 'three';

export type MaterialKind = 'absorb' | 'surface' | 'reaction';
export type MaterialActivity = { update: (seconds: number) => boolean };

// These are qualitative comparison models, not measurements of real material rates.
export function createMaterialActivity(
  kind: MaterialKind, id: number, group: THREE.Group, scene: THREE.Scene,
  target: THREE.Vector3, color: string,
): MaterialActivity {
  function mesh(geometry: THREE.BufferGeometry, tint: string, parent: THREE.Object3D = scene, opacity = 1) {
    const object = new THREE.Mesh(geometry, new THREE.MeshStandardMaterial({
      color: tint, roughness: 0.45, transparent: opacity < 1, opacity,
      depthWrite: opacity === 1, side: THREE.DoubleSide,
    }));
    parent.add(object);
    return object;
  }
  const x = target.x, z = target.z;

  if (kind === 'absorb') {
    const tray = mesh(new THREE.CylinderGeometry(0.58, 0.58, 0.045, 40), '#f5fcff');
    tray.position.set(x, 0.97, z);
    const edge = mesh(new THREE.TorusGeometry(0.56, 0.035, 10, 40), color);
    edge.rotation.x = Math.PI / 2; edge.position.set(x, 1.01, z);
    const water = mesh(new THREE.CylinderGeometry(0.51, 0.51, 0.025, 40), '#419bc8', scene, 0.7);
    water.position.set(x, 1.015, z);
    const thickness = id === 0 ? 0.22 : 0.035;
    const material = mesh(new THREE.BoxGeometry(0.64, thickness, 0.6),
      ['#f1ce52', '#f5d5df', '#67c6d4', '#b9c5ce'][id], group);
    if (id === 3) { material.material.metalness = 0.85; material.material.roughness = 0.24; material.rotation.z = 0.04; }
    const wetColor = new THREE.Color(id === 0 ? '#529b84' : '#638fb9');
    const dryColor = material.material.color.clone();
    const top = thickness / 2 + 0.01;
    if (id === 0) {
      for (let n = 0; n < 24; n++) {
        const pore = mesh(new THREE.SphereGeometry(0.018, 8, 6), '#a77b29', group);
        pore.scale.y = 0.18;
        pore.position.set((n % 6 - 2.5) * 0.09, top, (Math.floor(n / 6) - 1.5) * 0.12);
      }
    } else if (id === 1) {
      for (let n = 0; n < 7; n++) {
        const thread = mesh(new THREE.BoxGeometry(0.008, 0.003, 0.58), '#bc859b', group);
        thread.position.set((n - 3) * 0.08, top, 0);
        const cross = mesh(new THREE.BoxGeometry(0.62, 0.003, 0.008), '#bc859b', group);
        cross.position.set(0, top, (n - 3) * 0.08);
      }
    }
    const drops = Array.from({ length: 9 }, (_, n) => {
      const drop = mesh(new THREE.SphereGeometry(0.035, 12, 8), '#277dac', group, 0.85);
      drop.position.set((n % 3 - 1) * 0.18, top + 0.025, (Math.floor(n / 3) - 1) * 0.17);
      drop.visible = false;
      return drop;
    });
    target.y = 1.03 + thickness / 2;
    return { update(seconds) {
      const t = Math.min(seconds / 4, 1);
      if (id < 2) {
        material.material.color.lerpColors(dryColor, wetColor, t);
        water.scale.set(1 - t * 0.18, 1 - t * 0.7, 1 - t * 0.18);
      }
      drops.forEach(drop => { drop.visible = id >= 2 && t > 0.15; });
      return t === 1;
    } };
  }

  if (kind === 'surface') {
    const bowl = mesh(new THREE.CylinderGeometry(0.88, 0.8, 0.09, 48), '#f7fcff');
    bowl.position.set(x, 0.97, z);
    const rim = mesh(new THREE.TorusGeometry(0.86, 0.045, 10, 48), color);
    rim.rotation.x = Math.PI / 2; rim.position.set(x, 1.03, z);
    const water = mesh(new THREE.CylinderGeometry(0.8, 0.8, 0.018, 48), '#91d1e1', scene, 0.8);
    water.position.set(x, 1.028, z);
    const grains = Array.from({ length: 65 }, (_, n) => {
      const grain = mesh(new THREE.SphereGeometry(0.018, 6, 4), '#394546');
      const angle = n * 2.39996, radius = 0.04 + Math.sqrt(n / 65) * 0.61;
      grain.position.set(x + Math.cos(angle) * radius, 1.046, z + Math.sin(angle) * radius);
      grain.scale.y = 0.35;
      return { grain, angle, radius };
    });
    mesh(new THREE.CylinderGeometry(0.027, 0.027, 0.78, 12), color, group).position.y = 0.15;
    const tip = mesh(new THREE.SphereGeometry(0.095, 16, 12), id === 1 ? '#a7dfb8' : '#ffffff', group);
    tip.position.y = -0.28; tip.scale.y = 1.6;
    const handleTip = mesh(new THREE.SphereGeometry(0.07, 12, 8), '#ffffff', group);
    handleTip.position.y = 0.56; handleTip.scale.y = 1.45;
    const ripple = mesh(new THREE.TorusGeometry(1, 0.012, 6, 60), '#ffffff', scene, 0.65);
    ripple.rotation.x = Math.PI / 2; ripple.position.set(x, 1.053, z); ripple.visible = false;
    target.y = 1.37;
    return { update(seconds) {
      const contact = Math.min(seconds / 0.6, 1);
      group.position.y = target.y - Math.sin(contact * Math.PI / 2) * 0.04 + Math.min(Math.max(seconds - 1.6, 0), 1) * 0.55;
      const spread = 1 - Math.exp(-Math.max(seconds - 0.6, 0) * 3);
      grains.forEach(({ grain, angle, radius }) => {
        const r = id === 1 ? THREE.MathUtils.lerp(radius, 0.71 + 0.025 * Math.sin(angle * 3), spread) : radius;
        grain.position.set(x + Math.cos(angle) * r, 1.046, z + Math.sin(angle) * r);
      });
      ripple.visible = seconds > 0.6 && seconds < 1.8;
      ripple.scale.setScalar(Math.max(0.01, Math.min((seconds - 0.6) * 0.65, 0.77)));
      return seconds >= 3.5;
    } };
  }

  const bottle = mesh(new THREE.CylinderGeometry(0.4, 0.4, 0.7, 40, 1, true), '#b7deeb', scene, 0.2);
  bottle.position.set(x, 1.3, z);
  const shoulder = mesh(new THREE.CylinderGeometry(0.13, 0.4, 0.22, 40, 1, true), '#b7deeb', scene, 0.25);
  shoulder.position.set(x, 1.76, z);
  const neck = mesh(new THREE.CylinderGeometry(0.13, 0.13, 0.18, 32, 1, true), color, scene, 0.5);
  neck.position.set(x, 1.96, z);
  const liquid = mesh(new THREE.CylinderGeometry(0.37, 0.37, 0.32, 40), id === 1 ? '#c9dd7e' : '#68c2e2', scene, 0.65);
  liquid.position.set(x, 1.13, z);
  const balloon = mesh(new THREE.SphereGeometry(0.48, 32, 24), color, group, 0.93);
  balloon.scale.set(0.28, 0.65, 0.28); balloon.position.y = 0.38;
  mesh(new THREE.CylinderGeometry(0.085, 0.13, 0.17, 20), color, group).position.y = 0.05;
  // The balloon is fitted first, then its powder falls through the open bottle neck.
  const powder = Array.from({ length: 25 }, (_, n) => {
    const grain = mesh(new THREE.SphereGeometry(0.022, 6, 4), '#ffffff');
    grain.visible = false;
    return { grain, n };
  });
  const bubbles = Array.from({ length: 35 }, (_, n) => {
    const bubble = mesh(new THREE.SphereGeometry(0.045, 10, 8), '#f2fff4', scene, 0.72);
    bubble.visible = false;
    return { bubble, n };
  });
  target.y = 2.02;
  return { update(seconds) {
    powder.forEach(({ grain, n }) => {
      const falling = (seconds - 0.3 - n * 0.025) / 1.1;
      grain.visible = falling >= 0 && falling <= 1;
      grain.position.set(x + Math.sin(n * 2.4) * 0.07, 2.2 - Math.max(0, falling) * 1.04, z + Math.cos(n * 2.4) * 0.07);
    });
    const growth = id === 1 ? THREE.MathUtils.smoothstep(seconds, 1.4, 5.5) : 0;
    balloon.scale.set(0.28 + growth * 0.9, 0.65 + growth * 0.75, 0.28 + growth * 0.9);
    balloon.position.y = 0.08 + 0.48 * balloon.scale.y;
    bubbles.forEach(({ bubble, n }) => {
      const rise = ((seconds * 0.6 + n / 35) % 1);
      bubble.visible = id === 1 && seconds > 1.2 && seconds < 5.6;
      bubble.position.set(x + Math.sin(n * 2.4) * 0.27, 1.08 + rise * 0.52, z + Math.cos(n * 2.4) * 0.27);
      bubble.scale.setScalar(0.35 + Math.sin(rise * Math.PI) * 0.85);
    });
    return seconds >= 6;
  } };
}
