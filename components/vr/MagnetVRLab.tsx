'use client';

import { ArrowLeft, Check, FileText, Glasses, Home, Magnet, MousePointer2, RotateCcw, Sparkles, Star } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { completeExperiment, getProgress, startExperiment } from '@/lib/progress';
import { playVrSound } from '@/lib/vrAudio';
import { createMagnetObject } from './magnetObjects';
import VrSoundButton from './VrSoundButton';

type TrialId = 'clip' | 'screw' | 'wood' | 'spoon';
type Phase = 'predict' | 'experiment' | 'discover' | 'complete';

const trials: Array<{ id: TrialId; name: string; shortName: string; sticks: boolean; result: string }> = [
  { id: 'clip', name: '철 클립', shortName: '철 클립', sticks: true, result: '찰칵! 자석으로 빠르게 끌려왔어요.' },
  { id: 'screw', name: '철 못', shortName: '철 못', sticks: true, result: '철 못도 자석에 딱 붙었어요.' },
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
  const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: texture, transparent: true, toneMapped: false }));
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
  const [sceneError, setSceneError] = useState('');
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
        '철 클립과 철 못은 자석 가까이에서 빠르게 끌려와 붙었어요.',
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
    const detail = phase === 'experiment' ? '물체를 잡아 자석 가까이에 놓아 봐' : '철 클립 · 철 못 · 나무 · 플라스틱';
    board.material.map = createBoardTexture(title, detail, allTested);
    board.material.needsUpdate = true;
    oldTexture?.dispose();
  }, [phase, tested.length]);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;
    const host = mount;
    let disposed = false;
    let modelLoaded = false;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color('#dceee9');
    scene.fog = new THREE.Fog('#dceee9', 14, 29);

    const camera = new THREE.PerspectiveCamera(44, 1, 0.05, 40);
    camera.position.set(0, 4.1, 7.4);

    const renderer = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true });
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.15;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.xr.enabled = true;
    renderer.xr.setReferenceSpaceType('local-floor');
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.7));
    renderer.domElement.dataset.sceneReady = 'false';
    renderer.domElement.setAttribute('aria-label', '자석으로 네 가지 물체를 조사하는 3D 가상 실험 장면');
    mount.appendChild(renderer.domElement);

    const environment = new RoomEnvironment();
    const pmrem = new THREE.PMREMGenerator(renderer);
    const environmentMap = pmrem.fromScene(environment, 0.04);
    scene.environment = environmentMap.texture;
    scene.environmentIntensity = 0.85;
    environment.dispose();
    pmrem.dispose();

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.target.set(0, 1.8, -2);
    controls.enablePan = false;
    controls.minDistance = 5.2;
    controls.maxDistance = 19;
    controls.minPolarAngle = 0.62;
    controls.maxPolarAngle = 1.42;
    controls.update();

    scene.add(new THREE.HemisphereLight('#ffffff', '#71837d', 1.15));
    const keyLight = new THREE.DirectionalLight('#fff6e9', 2.6);
    keyLight.position.set(4, 8, 5);
    keyLight.castShadow = true;
    keyLight.shadow.mapSize.set(1024, 1024);
    keyLight.shadow.camera.left = -5; keyLight.shadow.camera.right = 5;
    keyLight.shadow.camera.top = 6; keyLight.shadow.camera.bottom = -4;
    keyLight.shadow.normalBias = 0.025;
    keyLight.target.position.set(0, 1, -2);
    scene.add(keyLight.target);
    scene.add(keyLight);
    const accentLight = new THREE.PointLight('#d5eeff', 12, 10);
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

    const board = new THREE.Mesh(new THREE.PlaneGeometry(4.8, 1.08), new THREE.MeshBasicMaterial({ map: createBoardTexture('자석은 무엇을 끌어당길까?', '철 클립 · 철 못 · 나무 · 플라스틱', false), toneMapped: false }));
    board.position.set(0, 4.55, -5.26);
    scene.add(board);
    boardRef.current = board;
    const frame = new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.BoxGeometry(4.94, 1.2, 0.08)), new THREE.LineBasicMaterial({ color: '#243c48' }));
    frame.position.set(0, 4.55, -5.22);
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

    const tableTop = new THREE.Mesh(new THREE.BoxGeometry(8, 0.3, 4), material('#cba974', 0.68));
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
    magnetGroup.position.set(0, 1.5, -3.16);
    scene.add(magnetGroup);

    function disposeObject(root: THREE.Object3D) {
      root.traverse((object) => {
        if (object instanceof THREE.Mesh || object instanceof THREE.Line || object instanceof THREE.Sprite) {
          object.geometry?.dispose();
          for (const item of Array.isArray(object.material) ? object.material : [object.material]) {
            if ('map' in item && item.map instanceof THREE.Texture) item.map.dispose();
            item.dispose();
          }
        }
      });
    }
    new GLTFLoader().load('/models/horseshoe-magnet.glb', (gltf) => {
      if (disposed) { disposeObject(gltf.scene); return; }
      gltf.scene.traverse((child) => { if (child instanceof THREE.Mesh) { child.castShadow = true; child.receiveShadow = true; } });
      magnetGroup.add(gltf.scene);
      modelLoaded = true;
      renderer.domElement.dataset.magnetModel = 'horseshoe-glb';
    }, undefined, () => {
      if (!disposed) setSceneError('자석 모형을 불러오지 못했어요. 다시 시도해 주세요.');
    });
    const standMaterial = material('#77848b', 0.32, 0.8);
    const standBase = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.48, 0.09, 40), standMaterial);
    standBase.position.set(0, 1.055, -3.57); standBase.castShadow = true; scene.add(standBase);
    const stand = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.045, 2.67, 20), standMaterial);
    stand.position.set(0, 2.41, -3.57); stand.castShadow = true; scene.add(stand);
    const clamp = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.09, 0.5), material('#384650', 0.58));
    clamp.position.set(0, 3.7, -3.38); scene.add(clamp);

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
      clip: new THREE.Vector3(-2.25, 1.055, -1.18),
      screw: new THREE.Vector3(-0.75, 1.16, -1.18),
      wood: new THREE.Vector3(0.75, 1.28, -1.18),
      spoon: new THREE.Vector3(2.25, 1.045, -1.18),
    };
    const targetPositions: Partial<Record<TrialId, THREE.Vector3>> = {
      clip: new THREE.Vector3(-0.64, 1.48, -3.02),
      screw: new THREE.Vector3(0.64, 1.43, -3.02),
    };

    function addTrialObject(id: TrialId) {
      const group = new THREE.Group();
      group.add(createMagnetObject(id));
      // Thin wire and nail shafts still need a usable touch/controller pick area.
      const hitBox = new THREE.Mesh(new THREE.BoxGeometry(id === 'spoon' ? 1.52 : 1.3, 0.62, 0.76), new THREE.MeshBasicMaterial({ visible: false }));
      hitBox.userData.trialId = id; group.add(hitBox); interactive.push(hitBox);
      const label = createLabel(trials.find((trial) => trial.id === id)?.shortName || '', trials.find((trial) => trial.id === id)?.sticks ? '#5c7178' : '#5a8a79');
      label.position.set(initialPositions[id].x, 0.65, 0.02);
      group.userData.label = label;
      scene.add(label);
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
    const heldObjects = new Set<TrialId>();
    const dropZone = new THREE.Mesh(new THREE.BoxGeometry(2.5, 2.7, 0.9), new THREE.MeshBasicMaterial({ visible: false }));
    dropZone.position.set(0, 2.3, -3.05); scene.add(dropZone);
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
      playVrSound(trial.sticks ? 'magnet' : 'place');
      (group.userData.label as THREE.Sprite).visible = !trial.sticks;
      returns.delete(id);
      if (trial.sticks) motions.set(id, { startedAt: performance.now(), from: group.position.clone() });
      else rejections.set(id, { startedAt: performance.now(), from: group.position.clone() });
      recordTrial(id);
    }

    function triggerTrial(id: TrialId) {
      const group = objectGroups.get(id);
      if (!group || heldObjects.has(id) || phaseRef.current !== 'experiment') return;
      motions.delete(id);
      rejections.delete(id);
      reactToMagnet(id);
    }
    triggerSceneRef.current = triggerTrial;

    function findTrialWithRay(ray: THREE.Ray) {
      raycaster.ray.copy(ray);
      const hit = raycaster.intersectObjects(interactive, false).find((item) => !heldObjects.has(item.object.userData.trialId));
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
      group.quaternion.identity();
      const closeToMagnet = Math.hypot(group.position.x, group.position.z + 3.08) < 1.62 && group.position.y > 0.7 && group.position.y < 4;
      if (closeToMagnet) reactToMagnet(id);
      else returns.set(id, { startedAt: performance.now(), from: group.position.clone() });
    }

    function onPointerDown(event: PointerEvent) {
      if (phaseRef.current !== 'experiment' || pointerDrag || event.button !== 0) return;
      setPointerFromEvent(event);
      const id = findTrialWithRay(raycaster.ray);
      const group = id ? objectGroups.get(id) : undefined;
      if (!id || !group) return;
      const planePoint = new THREE.Vector3();
      if (!raycaster.ray.intersectPlane(dragPlane, planePoint)) return;
      motions.delete(id);
      rejections.delete(id);
      returns.delete(id);
      heldObjects.add(id);
      (group.userData.label as THREE.Sprite).visible = true;
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
          if (raycaster.intersectObject(dropZone, false).length) group.position.set(group.position.x * 0.3, 1.5, -2.9);
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
      heldObjects.delete(id);
      controls.enabled = true;
      renderer.domElement.style.cursor = 'grab';
      if (renderer.domElement.hasPointerCapture(event.pointerId)) renderer.domElement.releasePointerCapture(event.pointerId);
      if (event.type === 'pointercancel' || event.type === 'lostpointercapture') {
        const group = objectGroups.get(id)!;
        returns.set(id, { startedAt: performance.now(), from: group.position.clone() });
      } else {
        setPointerFromEvent(event);
        if (raycaster.intersectObject(dropZone, false).length) reactToMagnet(id); else finishDrop(id);
      }
      event.preventDefault();
      event.stopImmediatePropagation();
    }
    renderer.domElement.addEventListener('pointerdown', onPointerDown, true);
    renderer.domElement.addEventListener('pointermove', onPointerMove, true);
    renderer.domElement.addEventListener('pointerup', onPointerUp, true);
    renderer.domElement.addEventListener('pointercancel', onPointerUp, true);
    renderer.domElement.addEventListener('lostpointercapture', onPointerUp, true);

    const controllers: THREE.Group[] = [];
    const controllerDrags = new Map<THREE.Group, TrialId>();
    for (let index = 0; index < 2; index += 1) {
      const controller = renderer.xr.getController(index);
      controller.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(), new THREE.Vector3(0, 0, -3)]), new THREE.LineBasicMaterial({ color: index === 0 ? '#ffca3a' : '#68dfbd' })));
      controller.addEventListener('selectstart', () => {
        if (phaseRef.current !== 'experiment' || controllerDrags.has(controller)) return;
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
        heldObjects.add(id);
        controller.attach(group);
        controllerDrags.set(controller, id);
      });
      controller.addEventListener('selectend', () => {
        const id = controllerDrags.get(controller);
        const group = id ? objectGroups.get(id) : undefined;
        if (!id || !group) return;
        scene.attach(group);
        controllerDrags.delete(controller);
        heldObjects.delete(id);
        finishDrop(id);
      });
      controller.addEventListener('disconnected', () => {
        const id = controllerDrags.get(controller);
        if (!id) return;
        const group = objectGroups.get(id)!;
        scene.attach(group); group.quaternion.identity(); group.position.copy(initialPositions[id]);
        heldObjects.delete(id); controllerDrags.delete(controller);
      });
      scene.add(controller);
      controllers.push(controller);
    }

    enterVrRef.current = async () => {
      if (!navigator.xr) return;
      const session = await navigator.xr.requestSession('immersive-vr', { optionalFeatures: ['local-floor', 'bounded-floor'] });
      session.addEventListener('end', () => {
        if (!disposed) {
          controllerDrags.forEach((id) => {
            const group = objectGroups.get(id)!;
            scene.attach(group); group.quaternion.identity(); group.position.copy(initialPositions[id]);
            heldObjects.delete(id);
          });
          setVrActive(false);
        }
        controllerDrags.clear();
      }, { once: true });
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
        camera.position.set(0, nextNarrow ? 4.7 : 4.1, nextNarrow ? 14.2 : 7.4);
        controls.target.set(0, 1.8, -2);
        controls.update();
      }
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height, false);
    }
    let resizeFrame = 0;
    const resizeObserver = new ResizeObserver(() => {
      cancelAnimationFrame(resizeFrame);
      resizeFrame = requestAnimationFrame(() => { if (!disposed) resize(); });
    });
    resizeObserver.observe(mount);
    resize();

    const clock = new THREE.Clock();
    renderer.setAnimationLoop(() => {
      const elapsed = clock.getElapsedTime();
      board.visible = frame.visible = !narrowView || renderer.xr.isPresenting;
      fieldRings.forEach((ring, index) => {
        ring.visible = heldObjects.size > 0;
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
        group.rotation.z = Math.sin(progress * Math.PI) * 0.18;
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
      if (modelLoaded && renderer.domElement.dataset.sceneReady !== 'true') {
        renderer.domElement.dataset.sceneReady = 'true';
        setSceneReady(true);
      }
    });

    return () => {
      disposed = true;
      renderer.setAnimationLoop(null);
      void renderer.xr.getSession()?.end();
      resizeObserver.disconnect();
      cancelAnimationFrame(resizeFrame);
      controls.dispose();
      renderer.domElement.removeEventListener('pointerdown', onPointerDown, true);
      renderer.domElement.removeEventListener('pointermove', onPointerMove, true);
      renderer.domElement.removeEventListener('pointerup', onPointerUp, true);
      renderer.domElement.removeEventListener('pointercancel', onPointerUp, true);
      renderer.domElement.removeEventListener('lostpointercapture', onPointerUp, true);
      disposeObject(scene);
      controllers.forEach((controller) => controller.clear());
      environmentMap.dispose();
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
        {!sceneReady && !sceneError && <div className="vr-loading"><Magnet size={36} /><strong>자석 탐사 기지 준비 중</strong></div>}
        {sceneError && <div className="wet-error" role="alert">{sceneError}<button onClick={() => location.reload()}>다시 시도</button></div>}

        <div className="vr-top-tools">
          <VrSoundButton />
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
            <button className="vr-primary" disabled={!prediction || !sceneReady} onClick={() => { if (prediction && sceneReady) { playVrSound('start'); setPhase('experiment'); } }}>탐사 시작 <MousePointer2 size={19} /></button>
          </div>
        )}

        {phase === 'experiment' && (
          <>
            <div className="vr-panel vr-observation-panel" aria-live="polite">
              <span>{tested.length} / 4 조사</span>
              <strong>{activeTrial ? activeTrial.name : '물체를 직접 집어 봐'}</strong>
              <p>{activeTrial ? activeTrial.result : '물체를 누른 채 자석 가까이로 끌고 와서 놓아 봐.'}</p>
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
            <div className="vr-result-pairs"><span>철 클립 · 철 못 <strong>자석에 붙어요</strong></span><span>나무 · 플라스틱 <strong>붙지 않아요</strong></span></div>
            <p>자석은 모든 물체가 아니라 철로 된 물체를 끌어당길 수 있어요.</p>
            <button className="vr-primary" onClick={() => { playVrSound('success'); setPhase('complete'); }}><Star size={19} fill="currentColor" /> 탐사 별 받기</button>
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
