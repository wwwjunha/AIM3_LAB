'use client';

import { ArrowLeft, Check, FileText, FlaskConical, Glasses, Home, MousePointer2, RotateCcw, Sparkles, Star, Zap } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { completeExperiment, getProgress, startExperiment } from '@/lib/progress';

type StepId = 'positive' | 'negative' | 'switch';
type Phase = 'predict' | 'experiment' | 'discover' | 'complete';

const steps: Array<{ id: StepId; name: string; shortName: string; result: string }> = [
  { id: 'positive', name: '빨간 전선', shortName: '+ 전선', result: '전지의 +극과 전구를 연결했어요.' },
  { id: 'negative', name: '파란 전선', shortName: '- 전선', result: '전지의 -극과 스위치를 연결했어요.' },
  { id: 'switch', name: '스위치', shortName: '스위치', result: '스위치를 닫자 전구가 환하게 켜졌어요!' },
];

const predictions = ['모두 이어진 회로', '전선이 끊긴 회로', '전지가 없는 회로'] as const;

function createLabel(text: string, border = '#cc9a18') {
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
  context.fillStyle = '#2f3a3f';
  context.font = '800 43px "Malgun Gothic", sans-serif';
  context.textAlign = 'center';
  context.textBaseline = 'middle';
  context.fillText(text, 256, 65);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: texture, transparent: true }));
  sprite.scale.set(1.3, 0.32, 1);
  return sprite;
}

function createBoardTexture(title: string, detail: string, lit: boolean) {
  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 420;
  const context = canvas.getContext('2d');
  if (!context) return new THREE.CanvasTexture(canvas);
  context.fillStyle = lit ? '#fff8c9' : '#f8fbf5';
  context.fillRect(0, 0, canvas.width, canvas.height);
  context.fillStyle = lit ? '#e5a800' : '#4c7a61';
  context.fillRect(0, 0, 1024, 56);
  context.fillStyle = '#26383f';
  context.font = '900 68px "Malgun Gothic", sans-serif';
  context.textAlign = 'center';
  context.fillText(title, 512, 185);
  context.fillStyle = '#536b70';
  context.font = '700 40px "Malgun Gothic", sans-serif';
  context.fillText(detail, 512, 285);
  context.fillStyle = lit ? '#ffca2d' : '#7aa791';
  context.beginPath();
  context.arc(512, 352, lit ? 25 : 17, 0, Math.PI * 2);
  context.fill();
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

function tubeBetween(start: THREE.Vector3, end: THREE.Vector3, color: string, radius = 0.055) {
  const direction = end.clone().sub(start);
  const mesh = new THREE.Mesh(
    new THREE.CylinderGeometry(radius, radius, direction.length(), 16),
    new THREE.MeshStandardMaterial({ color, roughness: 0.48 }),
  );
  mesh.position.copy(start).add(end).multiplyScalar(0.5);
  mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), direction.normalize());
  return mesh;
}

export default function CircuitVRLab() {
  const mountRef = useRef<HTMLDivElement>(null);
  const runStepRef = useRef<(id: StepId) => void>(() => undefined);
  const triggerSceneRef = useRef<(id: StepId) => void>(() => undefined);
  const enterVrRef = useRef<() => Promise<void>>(async () => undefined);
  const boardRef = useRef<THREE.Mesh<THREE.PlaneGeometry, THREE.MeshBasicMaterial> | null>(null);
  const phaseRef = useRef<Phase>('predict');
  const connectedRef = useRef<StepId[]>([]);
  const [phase, setPhase] = useState<Phase>('predict');
  const [prediction, setPrediction] = useState('');
  const [connected, setConnected] = useState<StepId[]>([]);
  const [active, setActive] = useState<StepId | null>(null);
  const [sceneReady, setSceneReady] = useState(false);
  const [vrSupport, setVrSupport] = useState<'checking' | 'supported' | 'unsupported'>('checking');
  const [vrActive, setVrActive] = useState(false);
  const [stars, setStars] = useState(0);

  const runStep = useCallback((id: StepId) => {
    if (phaseRef.current !== 'experiment') return;
    if (id === 'switch' && !connectedRef.current.includes('positive')) return;
    if (id === 'switch' && !connectedRef.current.includes('negative')) return;
    setActive(id);
    setConnected((current) => current.includes(id) ? current : [...current, id]);
  }, []);

  useEffect(() => { runStepRef.current = runStep; }, [runStep]);
  useEffect(() => { phaseRef.current = phase; }, [phase]);
  useEffect(() => { connectedRef.current = connected; }, [connected]);

  useEffect(() => {
    startExperiment('circuit');
    queueMicrotask(() => setStars(getProgress().totalStars));
  }, []);

  useEffect(() => {
    if (phase !== 'complete') return;
    completeExperiment('circuit', {
      title: '전기 회로 연결하기 VR',
      question: '전구에 불이 켜지려면 무엇이 필요할까?',
      prediction,
      observations: [
        '빨간 전선으로 전지의 +극과 전구를 연결했어요.',
        '파란 전선으로 전지의 -극과 스위치를 연결했어요.',
        '전지, 전선, 전구가 모두 이어진 뒤 스위치를 닫으니 불이 켜졌어요.',
      ],
      discovery: '전구에 불이 켜지려면 전지와 전선, 전구가 끊김없이 이어진 닫힌 회로가 필요해요.',
      skills: ['3D 공간에서 회로 구성하기', '전기 흐름의 조건 확인', '원인과 결과 찾기'],
    });
    queueMicrotask(() => setStars(getProgress().totalStars));
  }, [phase, prediction]);

  useEffect(() => {
    const board = boardRef.current;
    if (!board) return;
    const oldTexture = board.material.map;
    const lit = connected.includes('switch');
    const title = phase === 'predict' ? '어떻게 해야 불이 켜질까?' : lit ? '전구가 켜졌어요!' : `${connected.length} / 3 연결 완료`;
    const detail = phase === 'experiment' ? (lit ? '전기가 한 바퀴 흐르는 닫힌 회로' : '전선 두 개를 잇고 스위치를 닫아 봐') : '+ 전선 · - 전선 · 스위치';
    board.material.map = createBoardTexture(title, detail, lit);
    board.material.needsUpdate = true;
    oldTexture?.dispose();
  }, [phase, connected]);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;
    const host = mount;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color('#e5f2e8');
    scene.fog = new THREE.Fog('#e5f2e8', 15, 30);

    const camera = new THREE.PerspectiveCamera(43, 1, 0.05, 40);
    camera.position.set(0, 3.5, 6.2);

    const renderer = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true });
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.xr.enabled = true;
    renderer.xr.setReferenceSpaceType('local-floor');
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.7));
    renderer.domElement.dataset.sceneReady = 'false';
    renderer.domElement.setAttribute('aria-label', '전지와 전선, 전구를 연결하는 3D 가상 실험 장면');
    mount.appendChild(renderer.domElement);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.target.set(0, 1.25, -2.1);
    controls.enablePan = false;
    controls.minDistance = 5.5;
    controls.maxDistance = 15;
    controls.minPolarAngle = 0.62;
    controls.maxPolarAngle = 1.4;
    controls.update();

    scene.add(new THREE.HemisphereLight('#fffdf0', '#5f8878', 2.2));
    const keyLight = new THREE.DirectionalLight('#fff6d2', 3.5);
    keyLight.position.set(4, 8, 5);
    keyLight.castShadow = true;
    keyLight.shadow.mapSize.set(1024, 1024);
    scene.add(keyLight);
    const coolLight = new THREE.PointLight('#78d9d0', 28, 10);
    coolLight.position.set(-4, 3, 1);
    scene.add(coolLight);

    const floor = new THREE.Mesh(new THREE.PlaneGeometry(22, 22), new THREE.MeshStandardMaterial({ color: '#d4e5dc', roughness: 0.92 }));
    floor.rotation.x = -Math.PI / 2;
    floor.receiveShadow = true;
    scene.add(floor);
    const grid = new THREE.GridHelper(22, 22, '#7da895', '#bad0c5');
    grid.position.y = 0.006;
    scene.add(grid);

    const wall = new THREE.Mesh(new THREE.PlaneGeometry(16, 7), new THREE.MeshStandardMaterial({ color: '#f8faf0', roughness: 1 }));
    wall.position.set(0, 3.4, -5.4);
    wall.receiveShadow = true;
    scene.add(wall);

    const board = new THREE.Mesh(new THREE.PlaneGeometry(4.8, 1.9), new THREE.MeshBasicMaterial({ map: createBoardTexture('어떻게 해야 불이 켜질까?', '+ 전선 · - 전선 · 스위치', false) }));
    board.position.set(0, 3.5, -5.31);
    scene.add(board);
    boardRef.current = board;
    const frame = new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.BoxGeometry(5.05, 2.15, 0.08)), new THREE.LineBasicMaterial({ color: '#26383f' }));
    frame.position.set(0, 3.5, -5.27);
    scene.add(frame);

    const tableTop = new THREE.Mesh(new THREE.BoxGeometry(8, 0.3, 4.2), new THREE.MeshStandardMaterial({ color: '#e7b658', roughness: 0.66 }));
    tableTop.position.set(0, 0.64, -2.15);
    tableTop.castShadow = true;
    tableTop.receiveShadow = true;
    scene.add(tableTop);
    for (const x of [-3.55, 3.55]) for (const z of [-3.7, -0.6]) {
      const leg = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.76, 0.3), new THREE.MeshStandardMaterial({ color: '#3f7664', roughness: 0.7 }));
      leg.position.set(x, 0.26, z);
      leg.castShadow = true;
      scene.add(leg);
    }

    const circuitBase = new THREE.Mesh(new THREE.BoxGeometry(6.4, 0.18, 2.8), new THREE.MeshStandardMaterial({ color: '#f5f0d9', roughness: 0.82 }));
    circuitBase.position.set(0, 0.92, -2.25);
    circuitBase.castShadow = true;
    circuitBase.receiveShadow = true;
    scene.add(circuitBase);
    const circuitEdge = new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.BoxGeometry(6.42, 0.2, 2.82)), new THREE.LineBasicMaterial({ color: '#4f675e' }));
    circuitEdge.position.copy(circuitBase.position);
    scene.add(circuitEdge);

    const metal = new THREE.MeshStandardMaterial({ color: '#a9b1b0', roughness: 0.26, metalness: 0.72 });
    const darkMetal = new THREE.MeshStandardMaterial({ color: '#4b5557', roughness: 0.34, metalness: 0.55 });

    const battery = new THREE.Group();
    const batteryBody = new THREE.Mesh(new THREE.CylinderGeometry(0.47, 0.47, 1.38, 28), new THREE.MeshStandardMaterial({ color: '#4b965d', roughness: 0.55 }));
    batteryBody.rotation.z = Math.PI / 2;
    batteryBody.castShadow = true;
    const batteryBand = new THREE.Mesh(new THREE.CylinderGeometry(0.49, 0.49, 0.34, 28), new THREE.MeshStandardMaterial({ color: '#f0c43d', roughness: 0.45 }));
    batteryBand.rotation.z = Math.PI / 2;
    batteryBand.position.x = 0.47;
    const batteryTip = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.16, 0.16, 18), metal);
    batteryTip.rotation.z = Math.PI / 2;
    batteryTip.position.x = 0.76;
    battery.add(batteryBody, batteryBand, batteryTip);
    battery.position.set(-2.15, 1.32, -2.25);
    scene.add(battery);
    const batteryLabel = createLabel('전지  +   -', '#4c8a5f');
    batteryLabel.position.set(-2.15, 2.05, -2.25);
    scene.add(batteryLabel);

    const bulbGroup = new THREE.Group();
    const socket = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.48, 0.48, 24), darkMetal);
    const bulbGlass = new THREE.Mesh(new THREE.SphereGeometry(0.55, 32, 24), new THREE.MeshPhysicalMaterial({ color: '#fff1a6', transparent: true, opacity: 0.78, roughness: 0.1, transmission: 0.18, emissive: '#ffc928', emissiveIntensity: 0 }));
    bulbGlass.position.y = 0.58;
    bulbGlass.castShadow = true;
    const filament = tubeBetween(new THREE.Vector3(-0.13, 0.28, 0), new THREE.Vector3(0.13, 0.28, 0), '#d67a13', 0.028);
    bulbGroup.add(socket, bulbGlass, filament);
    bulbGroup.position.set(2.15, 1.25, -2.25);
    scene.add(bulbGroup);
    const bulbLabel = createLabel('전구', '#d9a20f');
    bulbLabel.position.set(2.15, 2.36, -2.25);
    scene.add(bulbLabel);

    const bulbLight = new THREE.PointLight('#ffd54a', 0, 7, 1.45);
    bulbLight.position.set(2.15, 2.03, -2.1);
    scene.add(bulbLight);
    const bulbGlow = new THREE.Mesh(new THREE.SphereGeometry(0.86, 28, 20), new THREE.MeshBasicMaterial({ color: '#ffd84f', transparent: true, opacity: 0, depthWrite: false }));
    bulbGlow.position.copy(bulbLight.position);
    scene.add(bulbGlow);

    const redWire = new THREE.Line(
      new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(-1.37, 1.12, -2.55), new THREE.Vector3(-1.35, 1.12, -3.2), new THREE.Vector3(1.18, 1.12, -3.2)]),
      new THREE.LineBasicMaterial({ color: '#d9473f', linewidth: 4 }),
    );
    const blueWire = new THREE.Line(
      new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(-2.83, 1.12, -2.12), new THREE.Vector3(-2.83, 1.12, -1.15), new THREE.Vector3(-0.65, 1.12, -1.15)]),
      new THREE.LineBasicMaterial({ color: '#287fbd', linewidth: 4 }),
    );
    scene.add(redWire, blueWire);

    const interactive: THREE.Object3D[] = [];
    const stepGroups = new Map<StepId, THREE.Group>();
    const initialPositions: Record<StepId, THREE.Vector3> = {
      positive: new THREE.Vector3(-1.45, 1.17, -0.34),
      negative: new THREE.Vector3(0, 1.17, -0.34),
      switch: new THREE.Vector3(1.45, 1.17, -0.34),
    };
    const targetPositions: Record<StepId, THREE.Vector3> = {
      positive: new THREE.Vector3(1.54, 1.18, -3.2),
      negative: new THREE.Vector3(-0.3, 1.18, -1.15),
      switch: new THREE.Vector3(0.62, 1.19, -1.15),
    };

    function addStepObject(id: StepId) {
      const group = new THREE.Group();
      if (id === 'positive' || id === 'negative') {
        const color = id === 'positive' ? '#d9473f' : '#287fbd';
        const clip = new THREE.Mesh(new THREE.BoxGeometry(0.72, 0.22, 0.34), new THREE.MeshStandardMaterial({ color, roughness: 0.42 }));
        const jaw = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.27, 0.4), metal);
        jaw.position.x = 0.42;
        group.add(clip, jaw);
      } else {
        const switchBase = new THREE.Mesh(new THREE.BoxGeometry(1.15, 0.2, 0.58), new THREE.MeshStandardMaterial({ color: '#f0e2ba', roughness: 0.68 }));
        const terminalA = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 0.18, 16), metal);
        terminalA.position.x = -0.38;
        const terminalB = terminalA.clone();
        terminalB.position.x = 0.38;
        const lever = new THREE.Mesh(new THREE.BoxGeometry(0.72, 0.12, 0.16), new THREE.MeshStandardMaterial({ color: '#d88424', roughness: 0.42, metalness: 0.18 }));
        lever.position.set(-0.02, 0.18, 0);
        lever.rotation.z = -0.45;
        lever.userData.lever = true;
        group.add(switchBase, terminalA, terminalB, lever);
      }
      group.traverse((child) => {
        if (child instanceof THREE.Mesh) {
          child.castShadow = true;
          child.userData.stepId = id;
          interactive.push(child);
        }
      });
      const label = createLabel(steps.find((step) => step.id === id)?.shortName || '', id === 'positive' ? '#d9473f' : id === 'negative' ? '#287fbd' : '#d89d13');
      label.position.y = 0.63;
      group.add(label);
      group.position.copy(initialPositions[id]);
      scene.add(group);
      stepGroups.set(id, group);
    }
    steps.forEach((step) => addStepObject(step.id));

    const currentDots = Array.from({ length: 18 }, (_, index) => {
      const dot = new THREE.Mesh(new THREE.SphereGeometry(0.055, 10, 10), new THREE.MeshBasicMaterial({ color: index % 2 ? '#fff071' : '#ffb720', transparent: true, opacity: 0 }));
      scene.add(dot);
      return dot;
    });

    const raycaster = new THREE.Raycaster();
    const pointer = new THREE.Vector2();
    const motions = new Map<StepId, { startedAt: number; from: THREE.Vector3 }>();
    const completedInScene = new Set<StepId>();
    let circuitClosedAt = 0;

    function triggerStep(id: StepId) {
      if (phaseRef.current !== 'experiment') return;
      if (id === 'switch' && (!completedInScene.has('positive') || !completedInScene.has('negative'))) return;
      if (!completedInScene.has(id)) {
        const group = stepGroups.get(id);
        if (group) motions.set(id, { startedAt: performance.now(), from: group.position.clone() });
        completedInScene.add(id);
        if (id === 'switch') circuitClosedAt = performance.now();
      }
      runStepRef.current(id);
    }
    triggerSceneRef.current = triggerStep;

    function pickWithRay(ray: THREE.Ray) {
      raycaster.ray.copy(ray);
      const hit = raycaster.intersectObjects(interactive, false)[0];
      const id = hit?.object.userData.stepId as StepId | undefined;
      if (id) triggerStep(id);
    }

    function onPointerDown(event: PointerEvent) {
      const rect = renderer.domElement.getBoundingClientRect();
      pointer.set(((event.clientX - rect.left) / rect.width) * 2 - 1, -((event.clientY - rect.top) / rect.height) * 2 + 1);
      raycaster.setFromCamera(pointer, camera);
      pickWithRay(raycaster.ray);
    }

    function onPointerMove(event: PointerEvent) {
      const rect = renderer.domElement.getBoundingClientRect();
      pointer.set(((event.clientX - rect.left) / rect.width) * 2 - 1, -((event.clientY - rect.top) / rect.height) * 2 + 1);
      raycaster.setFromCamera(pointer, camera);
      renderer.domElement.style.cursor = raycaster.intersectObjects(interactive, false).length ? 'pointer' : 'grab';
    }
    renderer.domElement.addEventListener('pointerdown', onPointerDown);
    renderer.domElement.addEventListener('pointermove', onPointerMove);

    const controllers: THREE.Group[] = [];
    for (let index = 0; index < 2; index += 1) {
      const controller = renderer.xr.getController(index);
      controller.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(), new THREE.Vector3(0, 0, -3)]), new THREE.LineBasicMaterial({ color: index === 0 ? '#ffc83d' : '#63dcc3' })));
      controller.addEventListener('select', () => {
        const matrix = new THREE.Matrix4().identity().extractRotation(controller.matrixWorld);
        const ray = new THREE.Ray();
        ray.origin.setFromMatrixPosition(controller.matrixWorld);
        ray.direction.set(0, 0, -1).applyMatrix4(matrix);
        pickWithRay(ray);
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
        camera.position.set(0, nextNarrow ? 4.1 : 3.5, nextNarrow ? 11.5 : 6.2);
        controls.target.set(0, 1.25, -2.1);
        controls.update();
      }
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height, false);
    }
    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(host);
    resize();

    const clock = new THREE.Clock();
    renderer.setAnimationLoop(() => {
      const elapsed = clock.getElapsedTime();
      motions.forEach((motion, id) => {
        const group = stepGroups.get(id);
        if (!group) return;
        const progress = Math.min((performance.now() - motion.startedAt) / 1050, 1);
        const eased = 1 - Math.pow(1 - progress, 3);
        group.position.lerpVectors(motion.from, targetPositions[id], eased);
        group.position.y += Math.sin(progress * Math.PI) * 0.035;
        if (id === 'switch') {
          const lever = group.children.find((child) => child.userData.lever);
          if (lever) lever.rotation.z = THREE.MathUtils.lerp(-0.45, 0, eased);
        }
        if (progress >= 1) motions.delete(id);
      });

      const isClosed = completedInScene.has('switch');
      if (isClosed) {
        const glowProgress = Math.min((performance.now() - circuitClosedAt) / 700, 1);
        bulbLight.intensity = 34 * glowProgress;
        bulbGlow.material.opacity = 0.14 + Math.sin(elapsed * 4) * 0.025;
        (bulbGlass.material as THREE.MeshPhysicalMaterial).emissiveIntensity = 2.6 * glowProgress;
      }
      currentDots.forEach((dot, index) => {
        const progress = (elapsed * 0.19 + index / currentDots.length) % 1;
        const side = progress * 4;
        if (side < 1) dot.position.set(THREE.MathUtils.lerp(-2.75, 2.7, side), 1.24, -3.18);
        else if (side < 2) dot.position.set(2.7, 1.24, THREE.MathUtils.lerp(-3.18, -1.16, side - 1));
        else if (side < 3) dot.position.set(THREE.MathUtils.lerp(2.7, -2.75, side - 2), 1.24, -1.16);
        else dot.position.set(-2.75, 1.24, THREE.MathUtils.lerp(-1.16, -3.18, side - 3));
        dot.material.opacity = isClosed ? 0.9 : 0;
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
      renderer.domElement.removeEventListener('pointerdown', onPointerDown);
      renderer.domElement.removeEventListener('pointermove', onPointerMove);
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

  function beginExperiment() {
    if (prediction) setPhase('experiment');
  }

  const activeStep = steps.find((step) => step.id === active);
  const allConnected = connected.length === steps.length;
  const wiresReady = connected.includes('positive') && connected.includes('negative');

  return (
    <main className="vr-lab-page circuit-vr">
      <header className="vr-lab-header">
        <a href="/" aria-label="실험실 홈"><ArrowLeft size={22} /><span>실험실 홈</span></a>
        <div><Zap size={23} /><strong>전기 회로 연결하기</strong><span>3D·VR 시제품</span></div>
        <div className="vr-stars"><Star size={20} fill="currentColor" /> {stars} / 18</div>
      </header>

      <section className="vr-viewport" aria-label="전기 회로 연결하기 VR 실험실">
        <div className="vr-canvas-mount" ref={mountRef} />
        {!sceneReady && <div className="vr-loading"><FlaskConical size={34} /><strong>3D 회로 준비 중</strong></div>}

        <div className="vr-top-tools">
          <div className="vr-mode-status"><span className={vrActive ? 'live' : ''} />{vrActive ? 'VR 실험 중' : '화면 3D 모드'}</div>
          {vrSupport === 'supported' && phase === 'experiment'
            ? <button className="vr-enter-button" onClick={() => void enterVrRef.current()}><Glasses size={22} /> VR 입장</button>
            : <span className="vr-device-note">{vrSupport === 'checking' ? 'VR 기기 확인 중' : vrSupport === 'supported' ? (phase === 'predict' ? '예상한 뒤 VR로 입장해요' : 'VR 연결 완료') : 'VR 기기에서는 입장 버튼이 열려요'}</span>}
        </div>

        {phase === 'predict' && (
          <div className="vr-panel vr-prediction-panel">
            <span className="vr-kicker"><Sparkles size={16} /> 먼저 예상해 봐</span>
            <h1>어떤 회로의 전구가 켜질까?</h1>
            <div className="vr-prediction-options">
              {predictions.map((choice) => <button className={prediction === choice ? 'selected' : ''} key={choice} onClick={() => setPrediction(choice)}>{prediction === choice && <Check size={18} />}{choice}</button>)}
            </div>
            <button className="vr-primary" disabled={!prediction} onClick={beginExperiment}>회로 만들기 <MousePointer2 size={19} /></button>
          </div>
        )}

        {phase === 'experiment' && (
          <>
            <div className="vr-panel vr-observation-panel" aria-live="polite">
              <span>{connected.length} / 3 연결</span>
              <strong>{activeStep ? activeStep.name : '전선부터 연결해 봐'}</strong>
              <p>{activeStep ? activeStep.result : '3D 부품이나 아래 버튼을 눌러 회로판에 놓아 봐.'}</p>
              {allConnected && <button className="vr-primary compact" onClick={() => setPhase('discover')}>발견 확인</button>}
            </div>
            <div className="vr-object-dock circuit-dock" aria-label="회로 부품 선택">
              {steps.map((step) => {
                const disabled = step.id === 'switch' && !wiresReady;
                return <button key={step.id} disabled={disabled} className={connected.includes(step.id) ? 'tested' : ''} onClick={() => triggerSceneRef.current(step.id)}><span>{connected.includes(step.id) ? <Check size={18} /> : step.id === 'switch' ? <Zap size={18} /> : <MousePointer2 size={18} />}</span>{disabled ? '전선 먼저' : step.shortName}</button>;
              })}
            </div>
          </>
        )}

        {phase === 'discover' && (
          <div className="vr-panel vr-discovery-panel">
            <span className="vr-kicker"><Sparkles size={16} /> 우리가 발견한 것</span>
            <h1>전기가 다니는 길은 이어져야 해!</h1>
            <div className="vr-result-pairs"><span>전선이 끊겨 있으면 <strong>불이 안 켜져요</strong></span><span>스위치를 닫으면 <strong>불이 켜져요</strong></span></div>
            <p>전지에서 나온 전기가 전선과 전구를 지나 다시 전지로 돌아오는 닫힌 길이 필요해요.</p>
            <button className="vr-primary" onClick={() => setPhase('complete')}><Star size={19} fill="currentColor" /> 별 받기</button>
          </div>
        )}

        {phase === 'complete' && (
          <div className="vr-panel vr-complete-panel" aria-live="polite">
            <Star className="vr-earned-star" size={74} fill="currentColor" />
            <span>VR 회로 탐구 완료</span>
            <h1>전구를 켰어요!</h1>
            <p>전기가 흐르는 닫힌 회로를 직접 만들었어요.</p>
            <div className="vr-complete-actions">
              <a href="/reports?id=circuit"><FileText size={20} /> 학부모 리포트</a>
              <a href="/"><Home size={20} /> 다른 실험</a>
              <button onClick={() => location.reload()} aria-label="VR 실험 다시 하기" title="다시 하기"><RotateCcw size={21} /></button>
            </div>
          </div>
        )}
      </section>
    </main>
  );
}
