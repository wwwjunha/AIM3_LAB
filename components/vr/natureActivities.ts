import * as THREE from 'three';
import type { MaterialActivity } from './materialActivities';

export type NatureKind = 'seed' | 'plant' | 'color';

// Qualitative time-lapse models: growth and pigment colors are not measured predictions.
export function createNatureActivity(
  kind: NatureKind, id: number, group: THREE.Group, scene: THREE.Scene,
  target: THREE.Vector3, accent: string,
): MaterialActivity {
  function mesh(geometry: THREE.BufferGeometry, color: string, parent: THREE.Object3D = scene, opacity = 1) {
    const object = new THREE.Mesh(geometry, new THREE.MeshStandardMaterial({
      color, roughness: 0.38, transparent: opacity < 1, opacity,
      depthWrite: opacity === 1, side: THREE.DoubleSide,
    }));
    object.castShadow = opacity === 1; object.receiveShadow = true;
    parent.add(object); return object;
  }
  function tube(points: THREE.Vector3[], radius: number, color: string, parent: THREE.Object3D) {
    return mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points), 32, radius, 8, false), color, parent);
  }
  function leaf(parent: THREE.Object3D, x: number, y: number, angle: number, color = '#4f944c') {
    const shape = new THREE.Shape();
    shape.moveTo(0, 0); shape.bezierCurveTo(-0.24, 0.12, -0.22, 0.44, 0, 0.62);
    shape.bezierCurveTo(0.22, 0.44, 0.24, 0.12, 0, 0);
    const blade = mesh(new THREE.ExtrudeGeometry(shape, { depth: 0.014, bevelEnabled: true, bevelSegments: 2, steps: 1, bevelSize: 0.008, bevelThickness: 0.008 }), color, parent);
    blade.position.set(x, y, 0); blade.rotation.z = angle;
    const vein = tube([new THREE.Vector3(0, 0, 0.03), new THREE.Vector3(0, 0.28, 0.03), new THREE.Vector3(0, 0.55, 0.03)], 0.008, '#b4cb7e', blade);
    vein.material.roughness = 0.7;
    return blade;
  }
  function dish(radius: number) {
    const base = mesh(new THREE.CylinderGeometry(radius, radius * 0.94, 0.075, 48), '#f4f7f4');
    base.position.set(target.x, 0.99, target.z);
    const edge = mesh(new THREE.TorusGeometry(radius, 0.045, 10, 48), accent);
    edge.rotation.x = Math.PI / 2; edge.position.set(target.x, 1.04, target.z);
  }

  if (kind === 'seed') {
    dish(0.63);
    const cotton = mesh(new THREE.SphereGeometry(0.53, 28, 16), id === 1 ? '#f4ede1' : '#d6e8df');
    cotton.scale.y = 0.12; cotton.position.set(target.x, 1.055, target.z);
    const bean = mesh(new THREE.SphereGeometry(0.23, 32, 20), '#bd8350', group);
    bean.scale.set(1, 0.7, 0.68);
    const seam = tube([new THREE.Vector3(-0.17, 0.07, 0.1), new THREE.Vector3(0, 0.12, 0.14), new THREE.Vector3(0.18, 0.07, 0.1)], 0.013, '#eee0b5', group);
    seam.material.roughness = 0.75;
    const growth = new THREE.Group(); group.add(growth); growth.visible = false;
    const root = tube([new THREE.Vector3(0.12, 0, 0), new THREE.Vector3(0.2, -0.04, 0.16), new THREE.Vector3(0.38, -0.05, 0.34), new THREE.Vector3(0.46, -0.05, 0.28)], 0.028, '#ebe8cd', growth);
    root.material.roughness = 0.8;
    tube([new THREE.Vector3(0.06, 0, 0), new THREE.Vector3(0.08, 0.32, 0), new THREE.Vector3(-0.05, 0.66, 0), new THREE.Vector3(0, 0.87, 0)], 0.036, '#76a64b', growth);
    leaf(growth, 0, 0.58, -0.85); leaf(growth, 0, 0.56, 0.85);
    target.y = 1.18;
    return { update(seconds) {
      const t = THREE.MathUtils.smoothstep(seconds, 1, 7);
      const amount = id === 0 ? t : id === 2 ? t * 0.12 : 0;
      growth.visible = amount > 0.01; growth.scale.setScalar(Math.max(amount, 0.001));
      bean.scale.set(1 + amount * 0.15, 0.7, 0.68);
      bean.rotation.z = -amount * 0.25;
      return seconds >= 7;
    } };
  }

  if (kind === 'plant') {
    const waterColor = ['#dc5074', '#3994cc', '#b8e0e3'][id];
    const jar = mesh(new THREE.CylinderGeometry(0.43, 0.4, 0.8, 40, 1, true), '#c6e4e6', scene, 0.18);
    jar.position.set(target.x, 1.38, target.z);
    const rim = mesh(new THREE.TorusGeometry(0.43, 0.026, 8, 40), '#8ab6b8');
    rim.rotation.x = Math.PI / 2; rim.position.set(target.x, 1.78, target.z);
    const water = mesh(new THREE.CylinderGeometry(0.39, 0.38, 0.47, 40), waterColor, scene, 0.57);
    water.position.set(target.x, 1.245, target.z);
    tube([new THREE.Vector3(0, 0, 0), new THREE.Vector3(0.04, 0.6, 0), new THREE.Vector3(-0.02, 1.2, 0)], 0.044, '#71a366', group);
    leaf(group, 0.02, 0.58, -0.95); leaf(group, 0.02, 0.46, 0.95);
    // Colored pathway is an enlarged cutaway of the stem's water-conducting tissue.
    const pathway = mesh(new THREE.CylinderGeometry(0.014, 0.014, 1.2, 12), waterColor, group);
    pathway.position.z = 0.052; pathway.visible = false;
    const petals: ReturnType<typeof mesh>[] = [];
    for (let n = 0; n < 10; n++) {
      const angle = n * Math.PI / 5;
      const petal = mesh(new THREE.SphereGeometry(0.17, 20, 14), '#fffdf5', group);
      petal.scale.set(0.75, 1.55, 0.32);
      petal.position.set(Math.sin(angle) * 0.22, 1.2 + Math.cos(angle) * 0.22, 0.02);
      petal.rotation.z = -angle; petals.push(petal);
    }
    const center = mesh(new THREE.SphereGeometry(0.125, 20, 14), '#e5bd48', group);
    center.scale.z = 0.55; center.position.set(0, 1.2, 0.08);
    target.y = 1.06;
    return { update(seconds) {
      const rise = THREE.MathUtils.smoothstep(seconds, 0, 3.5);
      pathway.visible = id < 2 && rise > 0; pathway.scale.y = Math.max(0.001, rise); pathway.position.y = rise * 0.6;
      const tint = id < 2 ? THREE.MathUtils.smoothstep(seconds, 3, 7) * 0.72 : 0;
      petals.forEach(petal => petal.material.color.lerpColors(new THREE.Color('#fffdf5'), new THREE.Color(waterColor), tint));
      return seconds >= 7;
    } };
  }

  const pairs = [['#e64b4b', '#f1ce37'], ['#f1ce37', '#378bd4'], ['#e64b4b', '#378bd4']];
  const result = ['#eb892e', '#55a568', '#9868ac'][id];
  dish(0.64);
  const paint = mesh(new THREE.CylinderGeometry(0.56, 0.56, 0.025, 48), pairs[id][0]);
  paint.position.set(target.x, 1.053, target.z); paint.visible = false;
  const secondPaint = mesh(new THREE.CircleGeometry(0.55, 48, 0, Math.PI), pairs[id][1]);
  secondPaint.rotation.x = -Math.PI / 2; secondPaint.position.set(target.x, 1.07, target.z); secondPaint.visible = false;
  const handle = mesh(new THREE.CapsuleGeometry(0.055, 0.72, 4, 12), '#94aeb4', group);
  handle.rotation.z = Math.PI / 2; handle.position.set(0, 0.03, 0.27); handle.material.metalness = 0.6;
  for (let n = 0; n < 2; n++) {
    const cup = mesh(new THREE.CylinderGeometry(0.2, 0.15, 0.25, 32, 1, true), '#f4f2ea', group);
    cup.position.x = (n - 0.5) * 0.48;
    const fill = mesh(new THREE.CylinderGeometry(0.185, 0.17, 0.06, 32), pairs[id][n], group);
    fill.position.set(cup.position.x, 0.085, 0);
    const lip = mesh(new THREE.TorusGeometry(0.2, 0.018, 8, 32), '#b1bfc3', group);
    lip.rotation.x = Math.PI / 2; lip.position.set(cup.position.x, 0.13, 0);
  }
  const streams = pairs[id].map((color, n) => {
    const stream = mesh(new THREE.CylinderGeometry(0.032, 0.042, 0.5, 12), color);
    stream.position.set(target.x + (n - 0.5) * 0.38, 1.34, target.z);
    stream.visible = false; return stream;
  });
  const brush = new THREE.Group(); scene.add(brush); brush.visible = false;
  mesh(new THREE.CylinderGeometry(0.025, 0.025, 0.65, 12), '#b48957', brush).position.y = 0.3;
  mesh(new THREE.CylinderGeometry(0.045, 0.035, 0.13, 12), '#717a7d', brush).position.y = -0.06;
  mesh(new THREE.CylinderGeometry(0.034, 0.043, 0.16, 12), '#f0ddae', brush).position.y = -0.19;
  target.y = 1.68;
  return { update(seconds) {
    const pour = THREE.MathUtils.smoothstep(seconds, 0, 0.6);
    group.rotation.x = pour * 0.7; group.visible = seconds < 1.7;
    streams.forEach(stream => { stream.visible = seconds > 0.4 && seconds < 1.7; });
    paint.visible = seconds > 0.4; secondPaint.visible = seconds > 0.4 && seconds < 5.5;
    const t = THREE.MathUtils.smoothstep(seconds, 1.7, 5.5);
    paint.material.color.lerpColors(new THREE.Color(pairs[id][0]), new THREE.Color(result), t);
    secondPaint.material.color.lerpColors(new THREE.Color(pairs[id][1]), new THREE.Color(result), t);
    secondPaint.rotation.z = t * Math.PI * 6;
    brush.visible = seconds >= 1.7;
    brush.position.set(target.x + Math.cos(t * Math.PI * 6) * 0.3, 1.3, target.z + Math.sin(t * Math.PI * 6) * 0.3);
    return seconds >= 5.5;
  } };
}
