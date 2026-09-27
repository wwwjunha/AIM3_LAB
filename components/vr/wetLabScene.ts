import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { wetLabs, type WetLabKind } from './wetLabConfig';
import { createMaterialActivity, type MaterialActivity } from './materialActivities';
import { createNatureActivity } from './natureActivities';
import { createFoundationActivity } from './foundationActivities';
import { playVrSound, type VrSoundCue } from '@/lib/vrAudio';

const wetCues: Record<WetLabKind, { placed: VrSoundCue; observed: VrSoundCue }> = {
  air: { placed: 'water', observed: 'bubble' },
  heat: { placed: 'place', observed: 'water' },
  dissolve: { placed: 'pour', observed: 'stir' },
  absorb: { placed: 'water', observed: 'water' },
  surface: { placed: 'place', observed: 'bubble' },
  reaction: { placed: 'place', observed: 'fizz' },
  seed: { placed: 'place', observed: 'grow' },
  plant: { placed: 'water', observed: 'grow' },
  color: { placed: 'pour', observed: 'stir' },
  force: { placed: 'place', observed: 'slide' },
  matter: { placed: 'pour', observed: 'water' },
  earth: { placed: 'place', observed: 'rain' },
};

type Callbacks = {
  message: (value: string) => void; placed: (value: number[]) => void;
  observed: (value: number[]) => void; ready: () => void; vr: (value: boolean) => void;
  complete: () => void; error: (value: string) => void; busy: (value: boolean) => void;
};
export type WetScene = {
  start: () => void; place: (id: number) => void; runHeat: () => void;
  finish: () => void; enterVr: () => Promise<void>; dispose: () => void;
};
type Sample = {
  group: THREE.Group; start: THREE.Vector3; target: THREE.Vector3;
  phase: 'ready' | 'held' | 'placed' | 'running' | 'done'; elapsed: number;
  particles: THREE.Mesh[]; liquid: THREE.Mesh; stirrer: THREE.Mesh; tissue?: THREE.Mesh; oil?: THREE.Mesh; sourceLabel: THREE.Mesh;
  activity?: MaterialActivity;
};

function label(text: string, width = 1.4, color = '#23444c', height = 0.33) {
  const canvas = document.createElement('canvas');
  canvas.width = 1024; canvas.height = Math.round(1024 * height / width);
  const ctx = canvas.getContext('2d')!;
  ctx.fillStyle = '#ffffff'; ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.strokeStyle = color; ctx.lineWidth = 12; ctx.strokeRect(6, 6, canvas.width - 12, canvas.height - 12);
  ctx.fillStyle = color; ctx.font = `bold ${Math.min(72, canvas.height * 0.48)}px "Malgun Gothic", sans-serif`;
  while (ctx.measureText(text).width > 950) {
    const size = Number(ctx.font.match(/[\d.]+/)?.[0] || 30);
    ctx.font = `bold ${size - 2}px "Malgun Gothic", sans-serif`;
  }
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(text, 512, canvas.height / 2);
  const texture = new THREE.CanvasTexture(canvas); texture.colorSpace = THREE.SRGBColorSpace;
  return new THREE.Mesh(new THREE.PlaneGeometry(width, height), new THREE.MeshBasicMaterial({ map: texture, side: THREE.DoubleSide }));
}

export function createWetScene(host: HTMLDivElement, kind: WetLabKind, callbacks: Callbacks): WetScene {
  const config = wetLabs[kind];
  const nature = kind === 'seed' || kind === 'plant' || kind === 'color';
  const foundation = kind === 'force' || kind === 'matter' || kind === 'earth';
  const simultaneous = kind === 'heat' || kind === 'seed' || kind === 'force' || kind === 'earth';
  const scene = new THREE.Scene(); scene.background = new THREE.Color('#d9edf0');
  const camera = new THREE.PerspectiveCamera(44, 1, 0.05, 40);
  const renderer = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 1.6));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.shadowMap.enabled = foundation; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.xr.enabled = true; renderer.xr.setReferenceSpaceType('local-floor');
  renderer.domElement.setAttribute('aria-label', `${config.title} 3D 실험 장면`);
  host.appendChild(renderer.domElement);
  const controls = new OrbitControls(camera, renderer.domElement);
  controls.target.set(0, 1.1, -1.9); controls.enablePan = false;
  controls.minPolarAngle = 0.6; controls.maxPolarAngle = 1.4;
  controls.minDistance = 6; controls.maxDistance = 18;
  scene.add(new THREE.HemisphereLight('#ffffff', '#6c9e92', 2.8));
  const sun = new THREE.DirectionalLight('#fff7e5', 3); sun.position.set(3, 7, 4); scene.add(sun);
  if (foundation) {
    sun.castShadow = true; sun.shadow.mapSize.set(1024, 1024);
    Object.assign(sun.shadow.camera, { left: -6, right: 6, top: 6, bottom: -6, near: 0.5, far: 25 });
    sun.shadow.normalBias = 0.025;
  }

  function mesh(geometry: THREE.BufferGeometry, color: string, parent: THREE.Object3D = scene, transparent = 1) {
    const obj = new THREE.Mesh(geometry, new THREE.MeshStandardMaterial({ color, roughness: 0.4, transparent: transparent < 1, opacity: transparent, depthWrite: transparent === 1, side: THREE.DoubleSide }));
    obj.castShadow = foundation && transparent === 1; obj.receiveShadow = foundation;
    parent.add(obj); return obj;
  }
  const floor = mesh(new THREE.PlaneGeometry(24, 24), '#e4eeeb'); floor.rotation.x = -Math.PI / 2;
  const grid = new THREE.GridHelper(24, 24, '#7ebcb8', '#c3d9d1'); grid.position.y = 0.01; scene.add(grid);
  mesh(new THREE.BoxGeometry(7.5, 0.24, 4), '#e9bd5b').position.set(0, 0.68, -1.9);
  for (const x of [-3.25, 3.25]) for (const z of [-3.4, -0.4]) mesh(new THREE.BoxGeometry(0.22, 0.7, 0.22), '#3d7979').position.set(x, 0.3, z);
  mesh(new THREE.BoxGeometry(10, 5, 0.15), '#f3f8f5').position.set(0, 2.45, -4.45);
  const boardWidth = kind === 'reaction' ? 4 : 4.8;
  const title = label(config.title, boardWidth - 0.1, config.accent, 0.55); title.position.set(0, 3.3, -4.3); scene.add(title);
  const subtitle = label('시간과 변화는 이해를 돕기 위한 모형이에요', boardWidth - 0.2, '#536c73', 0.29); subtitle.position.set(0, 2.8, -4.28); scene.add(subtitle);
  let board = label(config.instruction, boardWidth, config.accent, 0.42); board.position.set(0, 2.28, -4.25); scene.add(board);
  let lastMessage = '';
  function message(text: string) {
    if (lastMessage === text) return;
    lastMessage = text; callbacks.message(text);
    const next = label(text, boardWidth, config.accent, 0.42); next.position.copy(board.position);
    scene.remove(board); board.geometry.dispose(); board.material.map?.dispose(); board.material.dispose();
    scene.add(next); board = next;
  }
  const command = label(simultaneous ? '모두 놓은 뒤 관찰 시작' : '모두 관찰한 뒤 발견 기록', 2.8, config.accent, 0.4);
  command.position.set(0, 3.95, -4.18); command.userData.command = 'finish'; scene.add(command);
  const exit = label('VR 나가기', 1.15, '#374c59'); exit.position.set(3.2, kind === 'reaction' ? 3.95 : 2.7, -3.8); exit.userData.command = 'exit'; scene.add(exit);
  if (kind === 'plant' || kind === 'earth') {
    board.position.y = 3.05; subtitle.position.y = 3.46;
    title.position.y = 3.9; command.position.y = 4.48;
  }
  let enabled = false, completed = false, disposed = false, heatRunning = false, heatTime = 0;
  const samples: Sample[] = [];
  const interactives: THREE.Object3D[] = [command, exit];
  const destinations: THREE.Object3D[] = [];
  function commandText(text: string) {
    const replacement = label(text, 2.8, config.accent, 0.4);
    command.material.map?.dispose(); command.material.map = replacement.material.map;
    command.material.needsUpdate = true; replacement.geometry.dispose(); replacement.material.dispose();
  }
  const count = config.trials.length;
  const step = count === 4 ? 1.68 : count === 3 ? 2.35 : kind === 'reaction' ? 4.8 : 3;

  config.trials.forEach((trial, id) => {
    const x = (id - (count - 1) / 2) * step;
    const target = new THREE.Vector3(x, 1.23, -2.8);
    const pad = mesh(new THREE.CylinderGeometry(0.67, 0.67, 0.12, 40), trial.color);
    pad.position.set(x, 0.87, -2.8);
    const rim = mesh(new THREE.TorusGeometry(0.6, 0.045, 10, 40), '#ffffff'); rim.rotation.x = Math.PI / 2; rim.position.set(x, 0.95, -2.8);
    if (kind === 'force' || kind === 'earth') pad.visible = rim.visible = false;
    const name = label(trial.name, count === 4 ? 1.4 : 1.9, trial.color);
    name.position.set(x, 0.65, 0.18); scene.add(name);
    const group = new THREE.Group(); group.position.set(x, 1.18, -0.6); scene.add(group);
    const start = group.position.clone();
    const particles: THREE.Mesh[] = [];
    let tissue: THREE.Mesh | undefined;
    let oil: THREE.Mesh | undefined;
    let activity: MaterialActivity | undefined;
    const liquid = mesh(new THREE.CylinderGeometry(0.5, 0.5, 0.6, 36), '#5ab9db', scene, 0.25);
    liquid.position.set(x, 1.25, -2.8);
    const stirrer = mesh(new THREE.CylinderGeometry(0.025, 0.025, 1.1, 10), '#f3ead3');
    stirrer.position.set(x + 0.25, 1.55, -2.8); stirrer.visible = kind === 'dissolve';
    if (kind === 'force' || kind === 'matter' || kind === 'earth') {
      liquid.visible = false;
      activity = createFoundationActivity(kind, id, group, scene, target, trial.color);
      const destination = label(trial.name, count === 4 ? 1.35 : 1.9, trial.color, 0.25);
      destination.position.set(x, 0.95, kind === 'force' ? -3.7 : -1.65); destination.rotation.x = -0.3; scene.add(destination);
    } else if (kind === 'seed' || kind === 'plant' || kind === 'color') {
      liquid.visible = false;
      activity = createNatureActivity(kind, id, group, scene, target, trial.color);
      const destination = label(trial.name, 1.95, trial.color, 0.28);
      destination.position.set(x, 0.98, -1.85); destination.rotation.x = -0.35; scene.add(destination);
    } else if (kind === 'absorb' || kind === 'surface' || kind === 'reaction') {
      liquid.visible = false;
      activity = createMaterialActivity(kind, id, group, scene, target, trial.color);
      const destination = label(trial.name, count === 4 ? 1.35 : 2.2, trial.color, 0.25);
      destination.position.set(x, 0.98, -1.85); destination.rotation.x = -0.35; scene.add(destination);
    } else if (kind === 'heat') {
      mesh(new THREE.BoxGeometry(0.58, 0.58, 0.58), '#9edeea', group, 0.87);
      const stripe = mesh(new THREE.BoxGeometry(0.59, 0.035, 0.59), '#ffffff', group, 0.9); stripe.position.y = 0.1;
      liquid.scale.set(0.01, 0.05, 0.01); liquid.position.y = 0.96;
    } else {
      const vessel = mesh(new THREE.CylinderGeometry(0.61, 0.61, kind === 'air' ? 1.25 : 0.95, 40, 1, true), '#9dccd9', scene, 0.13);
      vessel.position.set(x, kind === 'air' ? 1.53 : 1.38, -2.8);
      const waterRim = mesh(new THREE.TorusGeometry(0.61, 0.026, 8, 40), '#72a8ba'); waterRim.rotation.x = Math.PI / 2; waterRim.position.set(x, kind === 'air' ? 2.15 : 1.86, -2.8);
      if (kind === 'air') {
        liquid.scale.y = 1.65; liquid.position.y = 1.5;
        mesh(new THREE.CylinderGeometry(0.31, 0.37, 0.72, 28, 1, true), trial.color, group, 0.33);
        mesh(new THREE.CylinderGeometry(0.31, 0.31, 0.045, 28), trial.color, group, 0.4).position.y = 0.36;
        tissue = mesh(new THREE.BoxGeometry(0.29, 0.12, 0.29), '#ffffff', group); tissue.position.y = 0.23;
        for (let i = 0; i < 14; i++) {
          const bubble = mesh(new THREE.SphereGeometry(0.045 + (i % 3) * 0.018, 12, 8), '#eefcff', scene, 0.72);
          bubble.visible = false; particles.push(bubble);
        }
      } else {
        const bowl = mesh(new THREE.CylinderGeometry(0.36, 0.27, 0.15, 28), trial.color, group);
        bowl.position.y = -0.12;
        if (id === 3) oil = mesh(new THREE.CylinderGeometry(0.27, 0.27, 0.045, 36), '#e0c444', group, 0.8);
        for (let i = 0; i < 28; i++) {
          const grain = mesh(new THREE.SphereGeometry(0.035, 8, 6), id === 2 ? '#b48a4d' : id === 3 ? '#dfc755' : '#ffffff', group);
          grain.position.set(Math.cos(i * 2.4) * 0.24 * (i % 5 + 1) / 5, i % 3 * 0.03, Math.sin(i * 2.4) * 0.24 * (i % 5 + 1) / 5);
          if (id === 3) grain.visible = false;
          particles.push(grain);
        }
      }
    }
    // A generous invisible pick volume makes small samples usable with touch and VR rays.
    const bounds = new THREE.Box3().setFromObject(group);
    const pickSize = bounds.getSize(new THREE.Vector3()).addScalar(0.18).max(new THREE.Vector3(0.85, 0.82, 0.85));
    const hit = new THREE.Mesh(new THREE.BoxGeometry(pickSize.x, pickSize.y, pickSize.z), new THREE.MeshBasicMaterial({ visible: false }));
    hit.position.copy(bounds.getCenter(new THREE.Vector3()).sub(group.position));
    hit.userData.id = id; group.add(hit); interactives.push(hit);
    const destinationHit = new THREE.Mesh(new THREE.BoxGeometry(1.1, 0.4, 1.1), new THREE.MeshBasicMaterial({ visible: false }));
    destinationHit.position.copy(target); destinationHit.userData.id = id;
    if (kind === 'earth' || kind === 'matter') {
      destinationHit.scale.y = kind === 'earth' ? 5.5 : 4.5;
      destinationHit.position.y = kind === 'earth' ? 1.95 : 1.65;
    }
    scene.add(destinationHit); destinations.push(destinationHit);
    const sourceLabel = label(kind === 'earth' ? '물뿌리개' : kind === 'seed' ? '씨앗' : kind === 'plant' ? '흰 꽃' : kind === 'heat' ? '얼음' : kind === 'air' ? '컵 + 휴지' : kind === 'reaction' ? '베이킹소다 풍선' : trial.name, foundation ? 1.35 : nature || kind === 'reaction' ? 1.5 : 0.95, trial.color, 0.25);
    sourceLabel.position.set(x, 1.9, -0.6); scene.add(sourceLabel);
    if (nature || foundation) sourceLabel.position.set(x, 0.92, -0.12);
    samples.push({ group, start, target, phase: 'ready', elapsed: 0, liquid, particles, stirrer, tissue, oil, sourceLabel, activity });
  });

  function emitPlaced() { callbacks.placed(samples.flatMap((s, i) => s.phase === 'placed' || s.phase === 'running' || s.phase === 'done' ? [i] : [])); }
  let observedSoundCount = 0;
  function emitObserved() {
    const done = samples.flatMap((s, i) => s.phase === 'done' ? [i] : []);
    if (done.length > observedSoundCount) { playVrSound(wetCues[kind].observed); observedSoundCount = done.length; }
    callbacks.observed(done);
    if (samples.every(s => s.phase === 'done')) commandText('발견 기록하기');
  }
  function place(id: number) {
    const sample = samples[id];
    if (!enabled || completed || !sample || (sample.phase !== 'ready' && sample.phase !== 'held')) return;
    scene.attach(sample.group); sample.group.quaternion.identity(); sample.group.position.copy(sample.target);
    if (kind === 'air') sample.group.position.y = 2.65;
    sample.phase = simultaneous ? 'placed' : 'running'; sample.elapsed = 0;
    sample.sourceLabel.visible = false;
    playVrSound(wetCues[kind].placed);
    emitPlaced();
    message(simultaneous ? (samples.every(s => s.phase === 'placed') ? '준비 완료! 관찰 시작을 눌러요.' : '남은 재료도 받침에 놓아요.') : `${config.trials[id].name} 관찰 중…`);
  }
  function runHeat() {
    if (!simultaneous || !enabled || heatRunning || !samples.every(s => s.phase === 'placed')) return;
    heatRunning = true; heatTime = 0; callbacks.busy(true); commandText('같은 시간 관찰 중');
    playVrSound(kind === 'earth' ? 'rain' : kind === 'force' ? 'slide' : kind === 'seed' ? 'grow' : 'water');
    samples.forEach(s => { s.phase = 'running'; });
    message(kind === 'force' ? '두 상자를 같은 힘으로 같은 시간 동안 밀어요.' : kind === 'earth' ? '두 비탈에 같은 양의 비가 내려요.' : kind === 'seed' ? '같은 기간 동안 씨앗의 변화를 비교해요.' : '같은 시간 동안 얼음과 녹은 물을 비교해요.');
  }
  function finish() {
    if (completed || !enabled || !samples.every(s => s.phase === 'done')) return;
    completed = true; message(config.discovery); commandText('기록 완료! VR 나가기'); playVrSound('success'); callbacks.complete();
  }
  function cancel(id: number) {
    const s = samples[id]; if (!s || s.phase !== 'held') return;
    scene.attach(s.group); s.group.position.copy(s.start); s.group.quaternion.identity(); s.phase = 'ready';
  }
  function release(id: number) {
    const s = samples[id]; scene.attach(s.group);
    const p = s.group.position;
    if (Math.hypot(p.x - s.target.x, p.z - s.target.z) < 0.8 && p.y > 0.7 && p.y < 3) place(id);
    else { cancel(id); message('같은 이름의 받침 안에 놓아 보세요.'); }
  }
  function action(name: string) {
    if (name === 'exit' || completed) { void renderer.xr.getSession()?.end(); return; }
    if (simultaneous && !samples.every(s => s.phase === 'done')) runHeat(); else finish();
  }
  const raycaster = new THREE.Raycaster();
  const pointer = new THREE.Vector2();
  const dragPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), -1.23);
  let drag: { id: number; pointerId: number; offset: THREE.Vector3 } | null = null;
  function hit(ray: THREE.Ray) {
    raycaster.ray.copy(ray);
    return raycaster.intersectObjects(interactives, false).find(item => item.object.visible && (item.object.userData.command || samples[item.object.userData.id]?.phase === 'ready'))?.object;
  }
  function pointerRay(event: PointerEvent) {
    const rect = renderer.domElement.getBoundingClientRect();
    pointer.set((event.clientX - rect.left) / rect.width * 2 - 1, 1 - (event.clientY - rect.top) / rect.height * 2);
    raycaster.setFromCamera(pointer, camera);
  }
  function down(event: PointerEvent) {
    if (!enabled || drag || event.button !== 0) return;
    pointerRay(event); const obj = hit(raycaster.ray); if (!obj) return;
    event.preventDefault(); event.stopImmediatePropagation();
    if (obj.userData.command) { action(obj.userData.command); return; }
    const id = obj.userData.id as number; const point = raycaster.ray.intersectPlane(dragPlane, new THREE.Vector3()); if (!point) return;
    samples[id].phase = 'held';
    drag = { id, pointerId: event.pointerId, offset: samples[id].group.position.clone().sub(point) };
    controls.enabled = false; renderer.domElement.setPointerCapture(event.pointerId); renderer.domElement.style.cursor = 'grabbing';
  }
  function move(event: PointerEvent) {
    pointerRay(event);
    if (drag?.pointerId === event.pointerId) {
      const point = raycaster.ray.intersectPlane(dragPlane, new THREE.Vector3());
      if (point) {
        point.add(drag.offset); point.x = THREE.MathUtils.clamp(point.x, -3.3, 3.3); point.z = THREE.MathUtils.clamp(point.z, -3.6, -0.3);
        const destination = raycaster.intersectObjects(destinations, false)[0]?.object;
        // Screen-space drops also reach elevated targets such as bottle openings.
        samples[drag.id].group.position.copy(destination?.userData.id === drag.id ? samples[drag.id].target : point);
      }
      event.preventDefault(); event.stopImmediatePropagation();
    } else renderer.domElement.style.cursor = hit(raycaster.ray) ? 'grab' : 'default';
  }
  function up(event: PointerEvent) {
    if (drag?.pointerId !== event.pointerId) return;
    const { id } = drag; drag = null;
    if (event.type === 'pointercancel' || event.type === 'lostpointercapture') cancel(id);
    else {
      pointerRay(event);
      const destination = raycaster.intersectObjects(destinations, false)[0]?.object;
      if (destination?.userData.id === id) place(id); else release(id);
    }
    controls.enabled = true; renderer.domElement.style.cursor = 'grab';
    if (renderer.domElement.hasPointerCapture(event.pointerId)) renderer.domElement.releasePointerCapture(event.pointerId);
    event.preventDefault(); event.stopImmediatePropagation();
  }
  const handlers = { pointerdown: down, pointermove: move, pointerup: up, pointercancel: up, lostpointercapture: up };
  Object.entries(handlers).forEach(([name, fn]) => renderer.domElement.addEventListener(name, fn as EventListener, true));

  const controllerHolds = new Map<THREE.Group, number>();
  const controllers = [renderer.xr.getController(0), renderer.xr.getController(1)];
  controllers.forEach(controller => {
    const ray = new THREE.Line(new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(), new THREE.Vector3(0, 0, -5)]), new THREE.LineBasicMaterial({ color: '#ddaa15' }));
    controller.add(ray); scene.add(controller);
    controller.addEventListener('selectstart', () => {
      if (!enabled || controllerHolds.has(controller)) return;
      controller.updateWorldMatrix(true, false);
      const rotation = new THREE.Matrix4().extractRotation(controller.matrixWorld);
      const r = new THREE.Ray(new THREE.Vector3().setFromMatrixPosition(controller.matrixWorld), new THREE.Vector3(0, 0, -1).applyMatrix4(rotation));
      const obj = hit(r); if (!obj) return;
      if (obj.userData.command) { action(obj.userData.command); return; }
      const id = obj.userData.id as number;
      samples[id].phase = 'held'; controller.attach(samples[id].group); controllerHolds.set(controller, id);
    });
    controller.addEventListener('selectend', () => {
      const id = controllerHolds.get(controller); if (id === undefined) return;
      controllerHolds.delete(controller); release(id);
    });
    controller.addEventListener('disconnected', () => {
      const id = controllerHolds.get(controller); if (id !== undefined) cancel(id);
      controllerHolds.delete(controller);
    });
  });

  let previousWidth = 0, previousHeight = 0;
  function resize() {
    const w = host.clientWidth || 1, h = host.clientHeight || 1;
    if (w === previousWidth && h === previousHeight) return;
    previousWidth = w; previousHeight = h;
    camera.aspect = w / h; camera.updateProjectionMatrix();
    const distance = Math.max(8.8, 4.15 / (Math.tan(THREE.MathUtils.degToRad(22)) * camera.aspect));
    camera.position.copy(controls.target).add(new THREE.Vector3(0, 0.37, 1).normalize().multiplyScalar(distance));
    controls.maxDistance = Math.max(18, distance + 2); controls.update(); renderer.setSize(w, h, false);
  }
  // Resize after the observer delivery cycle so canvas dimensions cannot feed back into it.
  let resizeFrame = 0;
  const observer = new ResizeObserver(() => {
    cancelAnimationFrame(resizeFrame);
    resizeFrame = requestAnimationFrame(() => { if (!disposed) resize(); });
  });
  observer.observe(host); resize();
  let lastTime: number | undefined; let ready = false;
  renderer.setAnimationLoop((time) => {
    const dt = lastTime === undefined ? 0 : Math.min((time - lastTime) / 1000, 0.05); lastTime = time;
    if (heatRunning) heatTime += dt;
    samples.forEach((s, id) => {
      if (s.phase !== 'running') return;
      s.elapsed += dt;
      if (s.activity) {
        if (s.activity.update(s.elapsed)) {
          s.phase = 'done'; message(config.trials[id].result); emitObserved();
        }
      } else if (kind === 'heat') {
        const t = Math.min(heatTime / 6, 1), scale = 1 - t * (id === 0 ? 0.78 : 0.3);
        s.group.scale.setScalar(scale); s.group.position.y = 0.97 + 0.29 * scale;
        const spread = Math.sqrt(1 - scale ** 3); s.liquid.scale.set(spread, 0.05, spread);
        if (t === 1) { s.phase = 'done'; emitObserved(); }
      } else if (kind === 'air') {
        const t = s.elapsed;
        s.group.position.y = THREE.MathUtils.lerp(2.65, 1.42, Math.min(t / 1.5, 1));
        if (id === 1) {
          const tilt = THREE.MathUtils.clamp((t - 1.5) / 1.5, 0, 1);
          s.group.rotation.z = tilt * 1.05;
          s.particles.forEach((bubble, n) => {
            bubble.visible = t > 1.5 && t < 4.6;
            const rise = ((t - 1.5) * 0.65 + n / 14) % 1;
            bubble.position.set(s.target.x + 0.33 + Math.sin(n * 2.2) * 0.08, 1.1 + rise * 0.86, s.target.z + 0.1);
          });
          if (s.tissue) (s.tissue.material as THREE.MeshStandardMaterial).color.lerpColors(new THREE.Color('#ffffff'), new THREE.Color('#55afd5'), tilt);
        }
        if (t >= 4.8) { s.phase = 'done'; s.particles.forEach(p => { p.visible = false; }); message(config.trials[id].result); emitObserved(); }
      } else {
        const t = Math.min(s.elapsed / 4, 1);
        s.group.position.y = 1.2; s.group.children[0].visible = false;
        if (s.oil) { s.oil.position.y = t * 0.36; s.oil.scale.set(1 + t * 0.75, 1, 1 + t * 0.75); }
        s.stirrer.position.x = s.target.x + Math.cos(t * Math.PI * 8) * 0.27;
        s.stirrer.position.z = s.target.z + Math.sin(t * Math.PI * 8) * 0.27;
        s.particles.forEach((grain, n) => {
          const angle = n * 2.4 + t * Math.PI * 8, radius = 0.15 + (n % 5) * 0.05;
          grain.position.set(Math.cos(angle) * radius, id === 2 ? -t * 0.22 : id === 3 ? t * 0.36 : Math.sin(n + t * 10) * 0.12, Math.sin(angle) * radius);
          grain.scale.setScalar(id < 2 ? Math.max(0.001, 1 - t) : id === 3 ? 1 + t * 1.5 : 1);
          if (id === 3) grain.scale.y = 0.35;
        });
        if (t === 1) { s.phase = 'done'; message(config.trials[id].result); emitObserved(); }
      }
    });
    if (heatRunning && samples.every(s => s.phase === 'done')) {
      heatRunning = false; callbacks.busy(false);
      message(kind === 'force' ? '가벼운 상자가 더 멀리 움직였어요!' : kind === 'earth' ? '가파른 비탈 아래에 흙이 더 많이 모였어요!' : kind === 'seed' ? '따뜻하고 촉촉한 씨앗이 가장 잘 자랐어요!' : '따뜻한 곳의 얼음이 더 많이 녹았어요!');
    }
    if (nature || foundation) {
      const showBoards = camera.aspect > 1.2 || renderer.xr.isPresenting;
      title.visible = subtitle.visible = board.visible = showBoards;
      command.visible = exit.visible = renderer.xr.isPresenting;
    }
    controls.update(); renderer.render(scene, camera);
    if (!ready) { ready = true; renderer.domElement.dataset.sceneReady = 'true'; callbacks.ready(); }
  });
  function contextLost(event: Event) { event.preventDefault(); callbacks.error('3D 연결이 끊겼어요. 페이지를 새로고침해 주세요.'); }
  renderer.domElement.addEventListener('webglcontextlost', contextLost);

  return {
    start: () => { enabled = true; message(config.instruction); },
    place: (id) => { if (samples[id]?.phase === 'ready') place(id); }, runHeat, finish,
    enterVr: async () => {
      if (!navigator.xr || disposed) throw new Error('XR unavailable');
      if (drag) { cancel(drag.id); drag = null; controls.enabled = true; }
      const session = await navigator.xr.requestSession('immersive-vr', { optionalFeatures: ['local-floor', 'bounded-floor'] });
      if (disposed) { await session.end(); return; }
      session.addEventListener('end', () => {
        controllerHolds.forEach(id => cancel(id)); controllerHolds.clear();
        if (!disposed) { controls.enabled = true; callbacks.vr(false); }
      }, { once: true });
      try { await renderer.xr.setSession(session); callbacks.vr(true); }
      catch (error) { await session.end(); throw error; }
    },
    dispose: () => {
      disposed = true; renderer.setAnimationLoop(null); void renderer.xr.getSession()?.end(); observer.disconnect(); cancelAnimationFrame(resizeFrame); controls.dispose();
      Object.entries(handlers).forEach(([name, fn]) => renderer.domElement.removeEventListener(name, fn as EventListener, true));
      renderer.domElement.removeEventListener('webglcontextlost', contextLost);
      scene.traverse(obj => {
        if (obj instanceof THREE.Mesh || obj instanceof THREE.Line) {
          obj.geometry.dispose();
          for (const mat of Array.isArray(obj.material) ? obj.material : [obj.material]) {
            if ('map' in mat && mat.map instanceof THREE.Texture) mat.map.dispose(); mat.dispose();
          }
        }
      });
      renderer.dispose(); renderer.domElement.remove();
    },
  };
}
