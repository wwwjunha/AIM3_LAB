'use client';

import { ArrowLeft, Check, FileText, Glasses, Home, Magnet, MousePointer2, RotateCcw, Sparkles, Star } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { completeExperiment, getProgress, startExperiment } from '@/lib/progress';

type TrialId = 'clip' | 'screw' | 'wood' | 'spoon';
type Phase = 'predict' | 'experiment' | 'discover' | 'complete';

const trials: Array<{ id: TrialId; name: string; shortName: string; sticks: boolean; result: string }> = [
  { id: 'clip', name: '철 클립', shortName: '철 클립', sticks: true, result: '찰칵! 자석으로 빠르게 끌려왔어요.' },
  { id: 'screw', name: '철 나사', shortName: '철 나사', sticks: true, result: '철 나사도 자석에 딱 붙었어요.' },
  { id: 'wood', name: '나무 블록', shortName: '나무', sticks: false, result: '나무 블록은 자석에 붙지 않았어요.' },
  { id: 'spoon', name: '플라스틱 숟가락', shortName: '플라스틱', sticks: false, result: '플라스틱 숟가락도 그대로 있었어요.' },
];

const predictions = ['철로 된 물체', '나무로 된 물체', '모든 물체'] as const;

function createLabel(text: string, border = '#d84b45') {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 128;
  const context = canvas.getContext('2d');
  if (!context) return new THREE.Sprite();
  context.fillStyle = 'rgba(255,255,255,.94)';
  context.beginPath();
  context.roundRect(8, 8, 496, 112, 22);
  context.fill();
  context.strokeStyle = border;
  context.lineWidth = 7;
  context.stroke();
  context.fillStyle = '#243c48';
  context.font = '800 43px "Malgun Gothic", sans-serif';
  context.textAlign = 'center';
  context.textBaseline = 'middle';
  context.fillText(text, 256, 65);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: texture, transparent: true }));
  sprite.scale.set(1.25, 0.31, 1);
  return sprite;
}

function createBoardTexture(title: string, detail: string, success: boolean) {
  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 420;
  const context = canvas.getContext('2d');
  if (!context) return new THREE.CanvasTexture(canvas);
  context.fillStyle = success ? '#e7f8ef' : '#f7fbfa';
  context.fillRect(0, 0, 1024, 420);
  context.fillStyle = success ? '#278267' : '#c5423c';
  context.fillRect(0, 0, 1024, 56);
  context.fillStyle = '#243c48';
  context.font = '900 68px "Malgun Gothic", sans-serif';
  context.textAlign = 'center';
  context.fillText(title, 512, 185);
  context.fillStyle = '#58717a';
  context.font = '700 40px "Malgun Gothic", sans-serif';
  context.fillText(detail, 512, 285);
  context.strokeStyle = success ? '#278267' : '#d84b45';
  context.lineWidth = 14;
  context.beginPath();
  context.arc(512, 350, 24, 0, Math.PI * 2);
  context.stroke();
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

function material(color: string, roughness = 0.55, metalness = 0) {
  return new THREE.MeshStandardMaterial({ color, roughness, metalness });
}

export default function MagnetVRLab() {
  const mountRef = useRef<HTMLDivElement>(null);
  const runTrialRef = useRef<(id: TrialId) => void>(() => undefined);
  const triggerSceneRef = useRef<(id: TrialId) => void>(() => undefined);
  const enterVrRef = useRef<() => Promise<void>>(async () => undefined);
  const boardRef = useRef<THREE.Mesh<THREE.PlaneGeometry, THREE.MeshBasicMaterial> | null>(null);
  const phaseRef = useRef<Phase>('predict');
  const [phase, setPhase] = useState<Phase>('predict');
  const [prediction, setPrediction] = useState('');
  const [tested, setTested] = useState<TrialId[]>([]);
  const [active, setActive] = useState<TrialId | null>(null);
  const [sceneReady, setSceneReady] = useState(false);
  const [vrSupport, setVrSupport] = useState<'checking' | 'supported' | 'unsupported'>('checking');
  const [vrActive, setVrActive] = useState(false);
  const [stars, setStars] = useState(0);

  const runTrial = useCallback((id: TrialId) => {
    if (phaseRef.current !== 'experiment') return;
    setActive(id);
    setTested((current) => current.includes(id) ? current : [...current, id]);
  }, []);

  useEffect(() => { runTrialRef.current = runTrial; }, [runTrial]);
  useEffect(() => { phaseRef.current = phase; }, [phase]);

  useEffect(() => {
    startExperiment('magnet');
    queueMicrotask(() => setStars(getProgress().totalStars));
  }, []);

  useEffect(() => {
    if (phase !== 'complete') return;
    completeExperiment('magnet', {
      title: '자석 탐사대 VR',
      question: '어떤 물체가 자석에 붙을까?',
      prediction,
      observations: [
        '철 클립과 철 나사는 자석 가까이에서 빠르게 끌려와 붙었어요.',
        '나무 블록과 플라스틱 숟가락은 자석에 붙지 않았어요.',
        '겉모양보다 물체를 이루는 재료가 중요했어요.',
      ],
      discovery: '자석은 모든 물체가 아니라 철로 된 물체를 끌어당길 수 있어요.',
      skills: ['3D 공간에서 탐색하기', '재료에 따라 분류하기', '예상과 결과 비교하기'],
    });
    queueMicrotask(() => setStars(getProgress().totalStars));
  }, [phase, prediction]);

  useEffect(() => {
    const board = boardRef.current;
    if (!board) return;
    const oldTexture = board.material.map;
    const allTested = tested.length === trials.length;
    const title = phase === 'predict' ? '자석은 무엇을 끌어당길까?' : allTested ? '탐사 완료!' : `${tested.length} / 4 물체 조사`;
    const detail = phase === 'experiment' ? '물체를 잡아 자석 가까이에 놓아 봐' : '철 클립 · 철 나사 · 나무 · 플라스틱';
    board.material.map = createBoardTexture(title, detail, allTested);
    board.material.needsUpdate = true;
    oldTexture?.dispose();
  }, [phase, tested.length]);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;
    const host = mount;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color('#dceee9');
    scene.fog = new THREE.Fog('#dceee9', 14, 29);

    const camera = new THREE.PerspectiveCamera(44, 1, 0.05, 40);
    camera.position.set(0, 3.4, 5.8);

    const renderer = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true });
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.xr.enabled = true;
    renderer.xr.setReferenceSpaceType('local-floor');
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.7));
    renderer.domElement.dataset.sceneReady = 'false';
    renderer.domElement.setAttribute('aria-label', '자석으로 네 가지 물체를 조사하는 3D 가상 실험 장면');
    mount.appendChild(renderer.domElement);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.target.set(0, 1.35, -2);
    controls.enablePan = false;
    controls.minDistance = 5.2;
    controls.maxDistance = 19;
    controls.minPolarAngle = 0.62;
    controls.maxPolarAngle = 1.42;
    controls.update();

    scene.add(new THREE.HemisphereLight('#ffffff', '#52786f', 2.2));
    const keyLight = new THREE.DirectionalLight('#fff4dc', 3.6);
    keyLight.position.set(4, 8, 5);
    keyLight.castShadow = true;
    keyLight.shadow.mapSize.set(1024, 1024);
    scene.add(keyLight);
    const accentLight = new THREE.PointLight('#75d9c1', 30, 10);
    accentLight.position.set(-4, 3, 1);
    scene.add(accentLight);

    const floor = new THREE.Mesh(new THREE.PlaneGeometry(22, 22), material('#d3e5df', 0.94));
    floor.rotation.x = -Math.PI / 2;
    floor.receiveShadow = true;
    scene.add(floor);
    const grid = new THREE.GridHelper(22, 22, '#6f9f91', '#b2cec5');
    grid.position.y = 0.006;
    scene.add(grid);

    const wall = new THREE.Mesh(new THREE.PlaneGeometry(16, 7), material('#f6faf7', 1));
    wall.position.set(0, 3.4, -5.35);
    wall.receiveShadow = true;
    scene.add(wall);

    const board = new THREE.Mesh(new THREE.PlaneGeometry(4.8, 1.9), new THREE.MeshBasicMaterial({ map: createBoardTexture('자석은 무엇을 끌어당길까?', '철 클립 · 철 나사 · 나무 · 플라스틱', false) }));
    board.position.set(0, 3.55, -5.26);
    scene.add(board);
    boardRef.current = board;
    const frame = new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.BoxGeometry(5.06, 2.16, 0.08)), new THREE.LineBasicMaterial({ color: '#243c48' }));
    frame.position.set(0, 3.55, -5.22);
    scene.add(frame);

    for (const x of [-5.25, 5.25]) {
      const locker = new THREE.Mesh(new THREE.BoxGeometry(1.85, 2.7, 0.72), material(x < 0 ? '#efc65e' : '#6fc6ad', 0.72));
      locker.position.set(x, 1.38, -4.82);
      locker.castShadow = true;
      scene.add(locker);
      for (const y of [0.72, 1.38, 2.04]) {
        const shelf = new THREE.Mesh(new THREE.BoxGeometry(1.7, 0.07, 0.77), material('#3b6b62', 0.62));
        shelf.position.set(x, y, -4.42);
        scene.add(shelf);
      }
    }

    const tableTop = new THREE.Mesh(new THREE.BoxGeometry(8, 0.3, 4), material('#e5b45b', 0.68));
    tableTop.position.set(0, 0.65, -2.08);
    tableTop.castShadow = true;
    tableTop.receiveShadow = true;
    scene.add(tableTop);
    for (const x of [-3.55, 3.55]) for (const z of [-3.55, -0.62]) {
      const leg = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.78, 0.3), material('#376b61', 0.72));
      leg.position.set(x, 0.26, z);
      leg.castShadow = true;
      scene.add(leg);
    }

    const scanPlatform = new THREE.Mesh(new THREE.BoxGeometry(6.8, 0.16, 2.8), material('#edf1ec', 0.86));
    scanPlatform.position.set(0, 0.93, -2.12);
    scanPlatform.castShadow = true;
    scanPlatform.receiveShadow = true;
    scene.add(scanPlatform);
    const platformEdge = new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.BoxGeometry(6.82, 0.18, 2.82)), new THREE.LineBasicMaterial({ color: '#48675f' }));
    platformEdge.position.copy(scanPlatform.position);
    scene.add(platformEdge);

    const magnetGroup = new THREE.Group();
    const arch = new THREE.Mesh(new THREE.TorusGeometry(0.78, 0.24, 18, 48, Math.PI), material('#d84b45', 0.42, 0.12));
    arch.position.y = 0.72;
    const leftLeg = new THREE.Mesh(new THREE.BoxGeometry(0.48, 1.12, 0.48), material('#d84b45', 0.42, 0.12));
    leftLeg.position.set(-0.78, 0.12, 0);
    const rightLeg = new THREE.Mesh(new THREE.BoxGeometry(0.48, 1.12, 0.48), material('#2869ae', 0.42, 0.12));
    rightLeg.position.set(0.78, 0.12, 0);
    const leftPole = new THREE.Mesh(new THREE.BoxGeometry(0.54, 0.25, 0.54), material('#c8d1d2', 0.24, 0.7));
    leftPole.position.set(-0.78, -0.54, 0);
    const rightPole = leftPole.clone();
    rightPole.position.x = 0.78;
    magnetGroup.add(arch, leftLeg, rightLeg, leftPole, rightPole);
    magnetGroup.position.set(0, 2.05, -3.26);
    magnetGroup.scale.setScalar(1.16);
    magnetGroup.traverse((child) => { if (child instanceof THREE.Mesh) child.castShadow = true; });
    scene.add(magnetGroup);
    const magnetLabel = createLabel('탐사 자석', '#c5423c');
    magnetLabel.position.set(0, 3.75, -3.26);
    scene.add(magnetLabel);

    const fieldRings = [0, 1, 2].map((index) => {
      const ring = new THREE.Mesh(
        new THREE.TorusGeometry(1.12 + index * 0.23, 0.025, 8, 48),
        new THREE.MeshBasicMaterial({ color: index % 2 ? '#397ec2' : '#e65a53', transparent: true, opacity: 0.26, depthWrite: false }),
      );
      ring.position.set(0, 2.25, -3.22);
      scene.add(ring);
      return ring;
    });

    const interactive: THREE.Object3D[] = [];
    const objectGroups = new Map<TrialId, THREE.Group>();
    const initialPositions: Record<TrialId, THREE.Vector3> = {
      clip: new THREE.Vector3(-2.25, 1.22, -0.78),
      screw: new THREE.Vector3(-0.75, 1.22, -0.78),
      wood: new THREE.Vector3(0.75, 1.22, -0.78),
      spoon: new THREE.Vector3(2.25, 1.22, -0.78),
    };
    const targetPositions: Partial<Record<TrialId, THREE.Vector3>> = {
      clip: new THREE.Vector3(-0.56, 1.67, -3.05),
      screw: new THREE.Vector3(0.56, 1.67, -3.05),
    };

    function addTrialObject(id: TrialId) {
      const group = new THREE.Group();
      if (id === 'clip') {
        const outer = new THREE.Mesh(new THREE.TorusGeometry(0.32, 0.055, 10, 32), material('#9ca9ad', 0.22, 0.82));
        outer.scale.y = 1.55;
        outer.rotation.x = Math.PI / 2;
        const inner = new THREE.Mesh(new THREE.TorusGeometry(0.18, 0.045, 10, 28), material('#c4ced0', 0.18, 0.86));
        inner.scale.y = 1.55;
        inner.rotation.x = Math.PI / 2;
        inner.position.x = 0.13;
        group.add(outer, inner);
      } else if (id === 'screw') {
        const shaft = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.08, 0.82, 18), material('#8f9da0', 0.25, 0.78));
        shaft.rotation.z = Math.PI / 2;
        const head = new THREE.Mesh(new THREE.CylinderGeometry(0.25, 0.25, 0.18, 24), material('#bbc5c7', 0.22, 0.8));
        head.rotation.z = Math.PI / 2;
        head.position.x = -0.46;
        const tip = new THREE.Mesh(new THREE.ConeGeometry(0.09, 0.24, 18), material('#8f9da0', 0.25, 0.78));
        tip.rotation.z = -Math.PI / 2;
        tip.position.x = 0.5;
        group.add(shaft, head, tip);
      } else if (id === 'wood') {
        const block = new THREE.Mesh(new THREE.BoxGeometry(0.82, 0.58, 0.7), material('#b9793f', 0.88));
        const grain = new THREE.Mesh(new THREE.TorusGeometry(0.18, 0.026, 8, 24), material('#7f4c29', 0.86));
        grain.position.set(0, 0, 0.36);
        group.add(block, grain);
      } else {
        const bowl = new THREE.Mesh(new THREE.SphereGeometry(0.3, 24, 18), material('#53a9d4', 0.48));
        bowl.scale.set(1, 0.42, 0.72);
        bowl.position.x = 0.36;
        const handle = new THREE.Mesh(new THREE.CapsuleGeometry(0.09, 0.72, 6, 14), material('#53a9d4', 0.48));
        handle.rotation.z = Math.PI / 2;
        handle.position.x = -0.22;
        group.add(bowl, handle);
      }
      group.traverse((child) => {
        if (child instanceof THREE.Mesh) {
          child.castShadow = true;
          child.userData.trialId = id;
          interactive.push(child);
        }
      });
      const label = createLabel(trials.find((trial) => trial.id === id)?.shortName || '', trials.find((trial) => trial.id === id)?.sticks ? '#5c7178' : '#5a8a79');
      label.position.y = 0.8;
      group.add(label);
      group.position.copy(initialPositions[id]);
      scene.add(group);
      objectGroups.set(id, group);
    }
    trials.forEach((trial) => addTrialObject(trial.id));

    const raycaster = new THREE.Raycaster();
    const pointer = new THREE.Vector2();
    const motions = new Map<TrialId, { startedAt: number; from: THREE.Vector3 }>();
    const rejections = new Map<TrialId, { startedAt: number; from: THREE.Vector3 }>();
    const returns = new Map<TrialId, { startedAt: number; from: THREE.Vector3 }>();
    const testedInScene = new Set<TrialId>();
    const dragPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), -1.22);
    let pointerDrag: { id: TrialId; pointerId: number; offset: THREE.Vector3 } | null = null;

    function recordTrial(id: TrialId) {
      testedInScene.add(id);
      runTrialRef.current(id);
    }

    function reactToMagnet(id: TrialId) {
      if (phaseRef.current !== 'experiment') return;
      const group = objectGroups.get(id);
      const trial = trials.find((item) => item.id === id);
      if (!group || !trial) return;
      returns.delete(id);
      if (trial.sticks) motions.set(id, { startedAt: performance.now(), from: group.position.clone() });
      else rejections.set(id, { startedAt: performance.now(), from: group.position.clone() });
      recordTrial(id);
    }

    function triggerTrial(id: TrialId) {
      const group = objectGroups.get(id);
      if (!group || phaseRef.current !== 'experiment') return;
      motions.delete(id);
      rejections.delete(id);
      reactToMagnet(id);
    }
    triggerSceneRef.current = triggerTrial;

    function findTrialWithRay(ray: THREE.Ray) {
      raycaster.ray.copy(ray);
      const hit = raycaster.intersectObjects(interactive, false)[0];
      return hit?.object.userData.trialId as TrialId | undefined;
    }

    function setPointerFromEvent(event: PointerEvent) {
      const rect = renderer.domElement.getBoundingClientRect();
      pointer.set(((event.clientX - rect.left) / rect.width) * 2 - 1, -((event.clientY - rect.top) / rect.height) * 2 + 1);
      raycaster.setFromCamera(pointer, camera);
    }

    function finishDrop(id: TrialId) {
      const group = objectGroups.get(id);
      if (!group) return;
      const closeToMagnet = Math.hypot(group.position.x, group.position.z + 3.08) < 1.62;
      if (closeToMagnet) reactToMagnet(id);
      else returns.set(id, { startedAt: performance.now(), from: group.position.clone() });
    }

    function onPointerDown(event: PointerEvent) {
      if (phaseRef.current !== 'experiment') return;
      setPointerFromEvent(event);
      const id = findTrialWithRay(raycaster.ray);
      const group = id ? objectGroups.get(id) : undefined;
      if (!id || !group) return;
      const planePoint = new THREE.Vector3();
      if (!raycaster.ray.intersectPlane(dragPlane, planePoint)) return;
      motions.delete(id);
      rejections.delete(id);
      returns.delete(id);
      pointerDrag = { id, pointerId: event.pointerId, offset: group.position.clone().sub(planePoint) };
      controls.enabled = false;
      renderer.domElement.setPointerCapture(event.pointerId);
      renderer.domElement.style.cursor = 'grabbing';
      event.preventDefault();
      event.stopImmediatePropagation();
    }

    function onPointerMove(event: PointerEvent) {
      setPointerFromEvent(event);
      if (pointerDrag && pointerDrag.pointerId === event.pointerId) {
        const group = objectGroups.get(pointerDrag.id);
        const planePoint = new THREE.Vector3();
        if (group && raycaster.ray.intersectPlane(dragPlane, planePoint)) {
          group.position.copy(planePoint.add(pointerDrag.offset));
          group.position.x = THREE.MathUtils.clamp(group.position.x, -3, 3);
          group.position.z = THREE.MathUtils.clamp(group.position.z, -3.65, -0.55);
        }
        event.preventDefault();
        event.stopImmediatePropagation();
        return;
      }
      renderer.domElement.style.cursor = findTrialWithRay(raycaster.ray) ? 'grab' : 'default';
    }

    function onPointerUp(event: PointerEvent) {
      if (!pointerDrag || pointerDrag.pointerId !== event.pointerId) return;
      const id = pointerDrag.id;
      pointerDrag = null;
      controls.enabled = true;
      renderer.domElement.style.cursor = 'grab';
      if (renderer.domElement.hasPointerCapture(event.pointerId)) renderer.domElement.releasePointerCapture(event.pointerId);
      finishDrop(id);
      event.preventDefault();
      event.stopImmediatePropagation();
    }
    renderer.domElement.addEventListener('pointerdown', onPointerDown, true);
    renderer.domElement.addEventListener('pointermove', onPointerMove, true);
    renderer.domElement.addEventListener('pointerup', onPointerUp, true);
    renderer.domElement.addEventListener('pointercancel', onPointerUp, true);

    const controllers: THREE.Group[] = [];
    const controllerDrags = new Map<THREE.Group, TrialId>();
    for (let index = 0; index < 2; index += 1) {
      const controller = renderer.xr.getController(index);
      controller.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(), new THREE.Vector3(0, 0, -3)]), new THREE.LineBasicMaterial({ color: index === 0 ? '#ffca3a' : '#68dfbd' })));
      controller.addEventListener('selectstart', () => {
        if (phaseRef.current !== 'experiment') return;
        const matrix = new THREE.Matrix4().identity().extractRotation(controller.matrixWorld);
        const ray = new THREE.Ray();
        ray.origin.setFromMatrixPosition(controller.matrixWorld);
        ray.direction.set(0, 0, -1).applyMatrix4(matrix);
        const id = findTrialWithRay(ray);
        const group = id ? objectGroups.get(id) : undefined;
        if (!id || !group) return;
        motions.delete(id);
        rejections.delete(id);
        returns.delete(id);
        controller.attach(group);
        controllerDrags.set(controller, id);
      });
      controller.addEventListener('selectend', () => {
        const id = controllerDrags.get(controller);
        const group = id ? objectGroups.get(id) : undefined;
        if (!id || !group) return;
        scene.attach(group);
        controllerDrags.delete(controller);
        finishDrop(id);
      });
      scene.add(controller);
      controllers.push(controller);
    }

    enterVrRef.current = async () => {
      if (!navigator.xr) return;
      const session = await navigator.xr.requestSession('immersive-vr', { optionalFeatures: ['local-floor', 'bounded-floor'] });
      session.addEventListener('end', () => setVrActive(false), { once: true });
      await renderer.xr.setSession(session);
      setVrActive(true);
    };
    if (navigator.xr) {
      navigator.xr.isSessionSupported('immersive-vr').then((supported) => setVrSupport(supported ? 'supported' : 'unsupported')).catch(() => setVrSupport('unsupported'));
    } else queueMicrotask(() => setVrSupport('unsupported'));

    let narrowView = false;
    function resize() {
      const width = Math.max(1, host.clientWidth);
      const height = Math.max(1, host.clientHeight);
      const nextNarrow = width < 620;
      if (nextNarrow !== narrowView) {
        narrowView = nextNarrow;
        camera.position.set(0, nextNarrow ? 4.25 : 3.4, nextNarrow ? 14.2 : 5.8);
        controls.target.set(0, 1.35, -2);
        controls.update();
      }
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height, false);
    }
    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(mount);
    resize();

    const clock = new THREE.Clock();
    renderer.setAnimationLoop(() => {
      const elapsed = clock.getElapsedTime();
      magnetGroup.position.y = 2.05 + Math.sin(elapsed * 1.7) * 0.035;
      fieldRings.forEach((ring, index) => {
        const pulse = 1 + ((elapsed * 0.18 + index * 0.22) % 0.45);
        ring.scale.setScalar(pulse);
        (ring.material as THREE.MeshBasicMaterial).opacity = 0.32 - (pulse - 1) * 0.55;
      });
      motions.forEach((motion, id) => {
        const group = objectGroups.get(id);
        const target = targetPositions[id];
        if (!group || !target) return;
        const progress = Math.min((performance.now() - motion.startedAt) / 1200, 1);
        const eased = 1 - Math.pow(1 - progress, 3);
        group.position.lerpVectors(motion.from, target, eased);
        group.position.y += Math.sin(progress * Math.PI) * 0.22;
        group.rotation.z += 0.045;
        if (progress >= 1) motions.delete(id);
      });
      rejections.forEach((motion, id) => {
        const group = objectGroups.get(id);
        if (!group) return;
        const progress = Math.min((performance.now() - motion.startedAt) / 900, 1);
        const eased = 1 - Math.pow(1 - progress, 3);
        group.position.lerpVectors(motion.from, initialPositions[id], eased);
        group.position.x += Math.sin(progress * Math.PI * 8) * (1 - progress) * 0.1;
        group.rotation.z = Math.sin(progress * Math.PI * 8) * (1 - progress) * 0.08;
        if (progress >= 1) {
          group.position.copy(initialPositions[id]);
          group.rotation.z = 0;
          rejections.delete(id);
        }
      });
      returns.forEach((motion, id) => {
        const group = objectGroups.get(id);
        if (!group) return;
        const progress = Math.min((performance.now() - motion.startedAt) / 520, 1);
        const eased = 1 - Math.pow(1 - progress, 3);
        group.position.lerpVectors(motion.from, initialPositions[id], eased);
        if (progress >= 1) {
          group.position.copy(initialPositions[id]);
          returns.delete(id);
        }
      });
      controls.update();
      renderer.render(scene, camera);
      if (renderer.domElement.dataset.sceneReady !== 'true') {
        renderer.domElement.dataset.sceneReady = 'true';
        setSceneReady(true);
      }
    });

    return () => {
      renderer.setAnimationLoop(null);
      resizeObserver.disconnect();
      controls.dispose();
      renderer.domElement.removeEventListener('pointerdown', onPointerDown, true);
      renderer.domElement.removeEventListener('pointermove', onPointerMove, true);
      renderer.domElement.removeEventListener('pointerup', onPointerUp, true);
      renderer.domElement.removeEventListener('pointercancel', onPointerUp, true);
      controllers.forEach((controller) => controller.clear());
      scene.traverse((object) => {
        if (object instanceof THREE.Mesh || object instanceof THREE.Line || object instanceof THREE.Sprite) {
          object.geometry?.dispose();
          const materials = Array.isArray(object.material) ? object.material : [object.material];
          materials.forEach((item) => {
            if ('map' in item && item.map) item.map.dispose();
            item.dispose();
          });
        }
      });
      renderer.dispose();
      renderer.domElement.remove();
      boardRef.current = null;
      triggerSceneRef.current = () => undefined;
    };
  }, []);

  const activeTrial = trials.find((trial) => trial.id === active);
  const allTested = tested.length === trials.length;

  return (
    <main className="vr-lab-page magnet-vr">
      <header className="vr-lab-header">
        <a href="/" aria-label="실험실 홈"><ArrowLeft size={22} /><span>실험실 홈</span></a>
        <div><Magnet size={23} /><strong>자석 탐사대</strong><span>3D·VR 시제품</span></div>
        <div className="vr-stars"><Star size={20} fill="currentColor" /> {stars} / 18</div>
      </header>

      <section className="vr-viewport" aria-label="자석 탐사대 VR 실험실">
        <div className="vr-canvas-mount" ref={mountRef} />
        {!sceneReady && <div className="vr-loading"><Magnet size={36} /><strong>자석 탐사 기지 준비 중</strong></div>}

        <div className="vr-top-tools">
          <div className="vr-mode-status"><span className={vrActive ? 'live' : ''} />{vrActive ? 'VR 탐사 중' : '화면 3D 모드'}</div>
          {vrSupport === 'supported' && phase === 'experiment'
            ? <button className="vr-enter-button" onClick={() => void enterVrRef.current()}><Glasses size={22} /> VR 입장</button>
            : <span className="vr-device-note">{vrSupport === 'checking' ? 'VR 기기 확인 중' : vrSupport === 'supported' ? (phase === 'predict' ? '예상한 뒤 VR로 입장해요' : 'VR 탐사 완료') : 'VR 기기에서는 입장 버튼이 열려요'}</span>}
        </div>

        {phase === 'predict' && (
          <div className="vr-panel vr-prediction-panel">
            <span className="vr-kicker"><Sparkles size={16} /> 탐사 전 예상</span>
            <h1>자석에 붙을 물체는?</h1>
            <div className="vr-prediction-options">
              {predictions.map((choice) => <button className={prediction === choice ? 'selected' : ''} key={choice} onClick={() => setPrediction(choice)}>{prediction === choice && <Check size={18} />}{choice}</button>)}
            </div>
            <button className="vr-primary" disabled={!prediction} onClick={() => prediction && setPhase('experiment')}>탐사 시작 <MousePointer2 size={19} /></button>
          </div>
        )}

        {phase === 'experiment' && (
          <>
            <div className="vr-panel vr-observation-panel" aria-live="polite">
              <span>{tested.length} / 4 조사</span>
              <strong>{activeTrial ? activeTrial.name : '물체를 직접 집어 봐'}</strong>
              <p>{activeTrial ? activeTrial.result : '물체를 누른 채 자석의 빛나는 원 안으로 끌고 와서 놓아 봐.'}</p>
              {allTested && <button className="vr-primary compact" onClick={() => setPhase('discover')}>분류 결과 확인</button>}
            </div>
            <div className="vr-object-dock magnet-dock" aria-label="버튼으로 바로 탐사할 물체 선택">
              {trials.map((trial) => <button key={trial.id} className={tested.includes(trial.id) ? 'tested' : ''} onClick={() => triggerSceneRef.current(trial.id)}><span>{tested.includes(trial.id) ? <Check size={18} /> : <MousePointer2 size={18} />}</span>{trial.shortName}</button>)}
            </div>
          </>
        )}

        {phase === 'discover' && (
          <div className="vr-panel vr-discovery-panel">
            <span className="vr-kicker"><Sparkles size={16} /> 탐사대의 발견</span>
            <h1>모양보다 재료가 중요해!</h1>
            <div className="vr-result-pairs"><span>철 클립 · 철 나사 <strong>자석에 붙어요</strong></span><span>나무 · 플라스틱 <strong>붙지 않아요</strong></span></div>
            <p>자석은 모든 물체가 아니라 철로 된 물체를 끌어당길 수 있어요.</p>
            <button className="vr-primary" onClick={() => setPhase('complete')}><Star size={19} fill="currentColor" /> 탐사 별 받기</button>
          </div>
        )}

        {phase === 'complete' && (
          <div className="vr-panel vr-complete-panel" aria-live="polite">
            <Star className="vr-earned-star" size={74} fill="currentColor" />
            <span>VR 자석 탐사 완료</span>
            <h1>분류 임무 성공!</h1>
            <p>네 물체를 재료에 따라 정확히 조사했어요.</p>
            <div className="vr-complete-actions">
              <a href="/reports?id=magnet"><FileText size={20} /> 학부모 리포트</a>
              <a href="/"><Home size={20} /> 다른 실험</a>
              <button onClick={() => location.reload()} aria-label="VR 탐사 다시 하기" title="다시 하기"><RotateCcw size={21} /></button>
            </div>
          </div>
        )}
      </section>
    </main>
  );
}
