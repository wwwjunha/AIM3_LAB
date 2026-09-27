'use client';

import { ArrowLeft, Check, FileText, FlaskConical, Glasses, Home, MousePointer2, RotateCcw, Sparkles, Star } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { completeExperiment, getProgress, startExperiment } from '@/lib/progress';
import { playVrSound } from '@/lib/vrAudio';
import VrSoundButton from './VrSoundButton';

type TrialId = 'cork' | 'coin' | 'cap' | 'stone';
type Phase = 'predict' | 'experiment' | 'discover' | 'complete';

const trials: Array<{ id: TrialId; name: string; shortName: string; floats: boolean; result: string }> = [
  { id: 'cork', name: '코르크 마개', shortName: '코르크', floats: true, result: '물 위에 둥둥 떴어요.' },
  { id: 'coin', name: '동전', shortName: '동전', floats: false, result: '물속 바닥으로 가라앉았어요.' },
  { id: 'cap', name: '빈 플라스틱 뚜껑', shortName: '병뚜껑', floats: true, result: '물 위에 둥둥 떴어요.' },
  { id: 'stone', name: '돌멩이', shortName: '돌멩이', floats: false, result: '물속 바닥으로 가라앉았어요.' },
];

const predictions = ['코르크와 병뚜껑', '동전과 돌멩이', '네 물체 모두'] as const;

function createLabel(text: string, color = '#17324d') {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 128;
  const context = canvas.getContext('2d');
  if (!context) return new THREE.Sprite();
  context.fillStyle = 'rgba(255,255,255,.92)';
  context.beginPath();
  context.roundRect(8, 8, 496, 112, 22);
  context.fill();
  context.strokeStyle = '#72b8cc';
  context.lineWidth = 7;
  context.stroke();
  context.fillStyle = color;
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

function createBoardTexture(message: string, detail: string) {
  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 420;
  const context = canvas.getContext('2d');
  if (!context) return new THREE.CanvasTexture(canvas);
  context.fillStyle = '#effcff';
  context.fillRect(0, 0, canvas.width, canvas.height);
  context.fillStyle = '#0b87a6';
  context.fillRect(0, 0, 1024, 56);
  context.fillStyle = '#17324d';
  context.font = '900 68px "Malgun Gothic", sans-serif';
  context.textAlign = 'center';
  context.fillText(message, 512, 185);
  context.fillStyle = '#397086';
  context.font = '700 42px "Malgun Gothic", sans-serif';
  context.fillText(detail, 512, 285);
  context.fillStyle = '#ffc83d';
  context.beginPath();
  context.arc(512, 352, 17, 0, Math.PI * 2);
  context.fill();
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

export default function FloatVRLab() {
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
    if (phase !== 'experiment') return;
    setActive(id);
    setTested((current) => current.includes(id) ? current : [...current, id]);
  }, [phase]);

  useEffect(() => { runTrialRef.current = runTrial; }, [runTrial]);
  useEffect(() => { phaseRef.current = phase; }, [phase]);

  useEffect(() => {
    startExperiment('float');
    setStars(getProgress().totalStars);
  }, []);

  useEffect(() => {
    if (phase !== 'complete') return;
    completeExperiment('float', {
      title: '뜨고 가라앉기 연구소 VR',
      question: '어떤 물체가 물에 뜰까?',
      prediction,
      observations: trials.map((trial) => `${trial.name}: ${trial.result}`),
      discovery: '물체가 물에 뜨거나 가라앉는 것은 재료와 무게, 모양에 따라 달라질 수 있어요.',
      skills: ['3D 공간에서 관찰하기', '뜨고 가라앉기 분류', '결과 비교하기'],
    });
    setStars(getProgress().totalStars);
  }, [phase, prediction]);

  useEffect(() => {
    const board = boardRef.current;
    if (!board) return;
    const oldTexture = board.material.map;
    const message = phase === 'predict' ? '어떤 물체가 뜰까?' : phase === 'experiment' ? `${tested.length} / 4 관찰 완료` : '멋진 발견이야!';
    const detail = phase === 'experiment' ? '물체를 가리키고 선택해 봐' : '코르크 · 동전 · 병뚜껑 · 돌멩이';
    board.material.map = createBoardTexture(message, detail);
    board.material.needsUpdate = true;
    oldTexture?.dispose();
  }, [phase, tested.length]);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color('#cceef6');
    scene.fog = new THREE.Fog('#cceef6', 14, 28);

    const camera = new THREE.PerspectiveCamera(44, 1, 0.05, 40);
    camera.position.set(0, 3.25, 5.4);

    const renderer = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true });
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.xr.enabled = true;
    renderer.xr.setReferenceSpaceType('local-floor');
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.7));
    renderer.domElement.dataset.sceneReady = 'false';
    renderer.domElement.setAttribute('aria-label', '뜨고 가라앉기 3D 가상 실험 장면');
    mount.appendChild(renderer.domElement);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.target.set(0, 1.15, -1.8);
    controls.enablePan = false;
    controls.minDistance = 5;
    controls.maxDistance = 15;
    controls.minPolarAngle = 0.65;
    controls.maxPolarAngle = 1.42;
    controls.update();

    scene.add(new THREE.HemisphereLight('#f7ffff', '#6f9b96', 2.1));
    const keyLight = new THREE.DirectionalLight('#fff7db', 3.4);
    keyLight.position.set(4, 8, 4);
    keyLight.castShadow = true;
    keyLight.shadow.mapSize.set(1024, 1024);
    scene.add(keyLight);
    const fillLight = new THREE.PointLight('#6ad9ff', 35, 10);
    fillLight.position.set(-4, 3, 1);
    scene.add(fillLight);

    const floor = new THREE.Mesh(new THREE.PlaneGeometry(22, 22), new THREE.MeshStandardMaterial({ color: '#d9eee8', roughness: 0.9 }));
    floor.rotation.x = -Math.PI / 2;
    floor.receiveShadow = true;
    scene.add(floor);
    const grid = new THREE.GridHelper(22, 22, '#70aead', '#b2d7d1');
    grid.position.y = 0.006;
    scene.add(grid);

    const wall = new THREE.Mesh(new THREE.PlaneGeometry(16, 7), new THREE.MeshStandardMaterial({ color: '#f5fbf8', roughness: 1 }));
    wall.position.set(0, 3.4, -5.2);
    wall.receiveShadow = true;
    scene.add(wall);

    const trimMaterial = new THREE.MeshStandardMaterial({ color: '#1677a8', roughness: 0.65 });
    for (const x of [-5.5, 5.5]) {
      const cabinet = new THREE.Mesh(new THREE.BoxGeometry(2.1, 2.8, 0.7), new THREE.MeshStandardMaterial({ color: x < 0 ? '#f8d56a' : '#73cfb2', roughness: 0.7 }));
      cabinet.position.set(x, 1.45, -4.72);
      cabinet.castShadow = true;
      scene.add(cabinet);
      for (const y of [0.75, 1.45, 2.15]) {
        const shelf = new THREE.Mesh(new THREE.BoxGeometry(1.9, 0.08, 0.8), trimMaterial);
        shelf.position.set(x, y, -4.3);
        scene.add(shelf);
      }
    }

    const board = new THREE.Mesh(new THREE.PlaneGeometry(4.6, 1.9), new THREE.MeshBasicMaterial({ map: createBoardTexture('어떤 물체가 뜰까?', '코르크 · 동전 · 병뚜껑 · 돌멩이') }));
    board.position.set(0, 3.45, -5.12);
    scene.add(board);
    boardRef.current = board;
    const boardFrame = new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.BoxGeometry(4.86, 2.14, 0.08)), new THREE.LineBasicMaterial({ color: '#17324d' }));
    boardFrame.position.set(0, 3.45, -5.08);
    scene.add(boardFrame);

    const tableTop = new THREE.Mesh(new THREE.BoxGeometry(7.4, 0.28, 3.5), new THREE.MeshStandardMaterial({ color: '#f2b85b', roughness: 0.64 }));
    tableTop.position.set(0, 0.62, -2.15);
    tableTop.castShadow = true;
    tableTop.receiveShadow = true;
    scene.add(tableTop);
    for (const x of [-3.3, 3.3]) for (const z of [-3.45, -0.85]) {
      const leg = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.72, 0.28), trimMaterial);
      leg.position.set(x, 0.25, z);
      leg.castShadow = true;
      scene.add(leg);
    }

    const glassMaterial = new THREE.MeshPhysicalMaterial({ color: '#9ee9ff', transparent: true, opacity: 0.2, transmission: 0.25, roughness: 0.08, metalness: 0, depthWrite: false, side: THREE.DoubleSide });
    const waterMaterial = new THREE.MeshPhysicalMaterial({ color: '#36bde5', transparent: true, opacity: 0.48, roughness: 0.16, transmission: 0.18, depthWrite: false });
    const tankCenter = new THREE.Vector3(0, 1.35, -2.35);
    const water = new THREE.Mesh(new THREE.BoxGeometry(3.3, 1.08, 1.62), waterMaterial);
    water.position.set(0, 1.24, -2.35);
    scene.add(water);
    const waterSurface = new THREE.Mesh(new THREE.PlaneGeometry(3.28, 1.6, 18, 8), new THREE.MeshPhysicalMaterial({ color: '#64d9f2', transparent: true, opacity: 0.72, roughness: 0.22, side: THREE.DoubleSide }));
    waterSurface.rotation.x = -Math.PI / 2;
    waterSurface.position.set(0, 1.79, -2.35);
    scene.add(waterSurface);
    const frontGlass = new THREE.Mesh(new THREE.PlaneGeometry(3.55, 1.75), glassMaterial);
    frontGlass.position.set(0, 1.45, -1.51);
    scene.add(frontGlass);
    for (const x of [-1.77, 1.77]) {
      const side = new THREE.Mesh(new THREE.PlaneGeometry(1.7, 1.75), glassMaterial);
      side.rotation.y = Math.PI / 2;
      side.position.set(x, 1.45, -2.35);
      scene.add(side);
    }
    const tankEdges = new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.BoxGeometry(3.6, 1.8, 1.75)), new THREE.LineBasicMaterial({ color: '#1677a8', transparent: true, opacity: 0.9 }));
    tankEdges.position.copy(tankCenter);
    scene.add(tankEdges);

    const interactive: THREE.Object3D[] = [];
    const objectGroups = new Map<TrialId, THREE.Group>();
    const initialPositions: Record<TrialId, THREE.Vector3> = {
      cork: new THREE.Vector3(-1.9, 1.02, -0.82), coin: new THREE.Vector3(-0.65, 0.91, -0.78),
      cap: new THREE.Vector3(0.65, 0.99, -0.8), stone: new THREE.Vector3(1.9, 1.02, -0.82),
    };
    const targetPositions: Record<TrialId, THREE.Vector3> = {
      cork: new THREE.Vector3(-1.05, 1.82, -2.35), coin: new THREE.Vector3(-0.38, 0.78, -2.35),
      cap: new THREE.Vector3(0.42, 1.84, -2.35), stone: new THREE.Vector3(1.08, 0.82, -2.35),
    };

    function material(color: string, roughness = 0.55, metalness = 0) {
      return new THREE.MeshStandardMaterial({ color, roughness, metalness });
    }

    function addTrialObject(id: TrialId) {
      const group = new THREE.Group();
      let object: THREE.Object3D;
      if (id === 'cork') {
        object = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.34, 0.7, 20), material('#bd7742', 0.85));
        object.rotation.z = Math.PI / 2;
      } else if (id === 'coin') {
        object = new THREE.Mesh(new THREE.CylinderGeometry(0.34, 0.34, 0.1, 32), material('#e5ae31', 0.25, 0.62));
      } else if (id === 'cap') {
        const cap = new THREE.Group();
        const base = new THREE.Mesh(new THREE.CylinderGeometry(0.38, 0.38, 0.18, 28), material('#1c91d0', 0.4));
        const rim = new THREE.Mesh(new THREE.TorusGeometry(0.35, 0.055, 10, 28), material('#83daf6', 0.35));
        rim.rotation.x = Math.PI / 2;
        rim.position.y = 0.11;
        cap.add(base, rim);
        object = cap;
      } else {
        object = new THREE.Mesh(new THREE.DodecahedronGeometry(0.4, 1), material('#72808b', 0.96));
        object.rotation.set(0.25, 0.4, 0.1);
      }
      object.traverse((child) => {
        if (child instanceof THREE.Mesh) {
          child.castShadow = true;
          child.userData.trialId = id;
          interactive.push(child);
        }
      });
      group.add(object);
      const label = createLabel(trials.find((trial) => trial.id === id)?.shortName || '');
      label.position.y = 0.8;
      group.add(label);
      group.position.copy(initialPositions[id]);
      scene.add(group);
      objectGroups.set(id, group);
    }
    trials.forEach((trial) => addTrialObject(trial.id));

    const bubbleMaterial = new THREE.MeshBasicMaterial({ color: '#d9f8ff', transparent: true, opacity: 0.78 });
    const bubbles = Array.from({ length: 16 }, (_, index) => {
      const bubble = new THREE.Mesh(new THREE.SphereGeometry(0.025 + (index % 3) * 0.012, 8, 8), bubbleMaterial);
      bubble.position.set(-1.45 + (index % 6) * 0.55, 0.75 + (index % 5) * 0.2, -2.5 + (index % 4) * 0.13);
      scene.add(bubble);
      return bubble;
    });

    const raycaster = new THREE.Raycaster();
    const pointer = new THREE.Vector2();
    const motions = new Map<TrialId, { startedAt: number; from: THREE.Vector3 }>();
    const testedInScene = new Set<TrialId>();

    function triggerTrial(id: TrialId) {
      if (phaseRef.current !== 'experiment') return;
      if (!testedInScene.has(id)) {
        playVrSound('water');
        const group = objectGroups.get(id);
        if (group) motions.set(id, { startedAt: performance.now(), from: group.position.clone() });
        testedInScene.add(id);
      }
      runTrialRef.current(id);
    }
    triggerSceneRef.current = triggerTrial;

    function pickWithRay(ray: THREE.Ray) {
      raycaster.ray.copy(ray);
      const hit = raycaster.intersectObjects(interactive, false)[0];
      const id = hit?.object.userData.trialId as TrialId | undefined;
      if (id) triggerTrial(id);
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
      const hovered = raycaster.intersectObjects(interactive, false).length > 0;
      renderer.domElement.style.cursor = hovered ? 'pointer' : 'grab';
    }
    renderer.domElement.addEventListener('pointerdown', onPointerDown);
    renderer.domElement.addEventListener('pointermove', onPointerMove);

    const controllers: THREE.Group[] = [];
    for (let index = 0; index < 2; index += 1) {
      const controller = renderer.xr.getController(index);
      const line = new THREE.Line(new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(0, 0, 0), new THREE.Vector3(0, 0, -3)]), new THREE.LineBasicMaterial({ color: index === 0 ? '#ffc83d' : '#63dcc3' }));
      controller.add(line);
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
    } else setVrSupport('unsupported');

    let narrowView = false;
    function resize() {
      const width = Math.max(1, mountRef.current?.clientWidth ?? 1);
      const height = Math.max(1, mountRef.current?.clientHeight ?? 1);
      const nextNarrowView = width < 620;
      if (nextNarrowView !== narrowView) {
        narrowView = nextNarrowView;
        camera.position.set(0, nextNarrowView ? 3.65 : 3.25, nextNarrowView ? 11 : 5.4);
        controls.target.set(0, 1.15, -1.8);
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
      const positions = waterSurface.geometry.attributes.position as THREE.BufferAttribute;
      for (let index = 0; index < positions.count; index += 1) {
        const x = positions.getX(index);
        const y = positions.getY(index);
        positions.setZ(index, Math.sin(x * 3 + elapsed * 1.7) * 0.018 + Math.cos(y * 4 + elapsed) * 0.012);
      }
      positions.needsUpdate = true;
      bubbles.forEach((bubble, index) => {
        bubble.position.y += 0.002 + (index % 3) * 0.0008;
        if (bubble.position.y > 1.72) bubble.position.y = 0.74;
      });
      motions.forEach((motion, id) => {
        const group = objectGroups.get(id);
        if (!group) return;
        const progress = Math.min((performance.now() - motion.startedAt) / 1350, 1);
        const eased = 1 - Math.pow(1 - progress, 3);
        group.position.lerpVectors(motion.from, targetPositions[id], eased);
        group.position.y += Math.sin(progress * Math.PI) * 0.018;
        group.rotation.y += 0.035;
        if (progress >= 1) motions.delete(id);
      });
      for (const id of ['cork', 'cap'] as TrialId[]) {
        if (testedInScene.has(id) && !motions.has(id)) {
          const group = objectGroups.get(id);
          if (group) group.position.y = targetPositions[id].y + Math.sin(elapsed * 2.2 + (id === 'cap' ? 1 : 0)) * 0.035;
        }
      }
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
          materials.forEach((item) => { if ('map' in item && item.map) item.map.dispose(); item.dispose(); });
        }
      });
      renderer.dispose();
      renderer.domElement.remove();
      boardRef.current = null;
      triggerSceneRef.current = () => undefined;
    };
  }, []);

  function beginExperiment() {
    if (!prediction) return;
    setPhase('experiment');
  }

  function resetPrototype() {
    location.reload();
  }

  const activeTrial = trials.find((trial) => trial.id === active);
  const allTested = tested.length === trials.length;

  return (
    <main className="vr-lab-page">
      <header className="vr-lab-header">
        <a href="/" aria-label="실험실 홈"><ArrowLeft size={22} /><span>실험실 홈</span></a>
        <div><FlaskConical size={23} /><strong>뜨고 가라앉기</strong><span>3D·VR 시제품</span></div>
        <div className="vr-stars"><Star size={20} fill="currentColor" /> {stars} / 18</div>
      </header>

      <section className="vr-viewport" aria-label="뜨고 가라앉기 VR 실험실">
        <div className="vr-canvas-mount" ref={mountRef} />
        {!sceneReady && <div className="vr-loading"><FlaskConical size={34} /><strong>3D 실험실 준비 중</strong></div>}

        <div className="vr-top-tools">
          <VrSoundButton />
          <div className="vr-mode-status"><span className={vrActive ? 'live' : ''} />{vrActive ? 'VR 실험 중' : '화면 3D 모드'}</div>
          {vrSupport === 'supported' && phase === 'experiment'
            ? <button className="vr-enter-button" onClick={() => void enterVrRef.current()}><Glasses size={22} /> VR 입장</button>
            : <span className="vr-device-note">{vrSupport === 'checking' ? 'VR 기기 확인 중' : vrSupport === 'supported' ? (phase === 'predict' ? '예상한 뒤 VR로 입장해요' : 'VR 관찰 완료') : 'VR 기기에서는 입장 버튼이 열려요'}</span>}
        </div>

        {phase === 'predict' && (
          <div className="vr-panel vr-prediction-panel">
            <span className="vr-kicker"><Sparkles size={16} /> 먼저 예상해 봐</span>
            <h1>물에 뜰 것 같은 물체는?</h1>
            <div className="vr-prediction-options">
              {predictions.map((choice) => <button className={prediction === choice ? 'selected' : ''} key={choice} onClick={() => setPrediction(choice)}>{prediction === choice && <Check size={18} />}{choice}</button>)}
            </div>
            <button className="vr-primary" disabled={!prediction} onClick={() => { playVrSound('start'); beginExperiment(); }}>실험 시작 <MousePointer2 size={19} /></button>
          </div>
        )}

        {phase === 'experiment' && (
          <>
            <div className="vr-panel vr-observation-panel" aria-live="polite">
              <span>{tested.length} / 4 관찰</span>
              <strong>{activeTrial ? activeTrial.name : '물체를 골라 봐'}</strong>
              <p>{activeTrial ? activeTrial.result : '3D 물체나 아래 이름을 누르면 수조로 이동해요.'}</p>
              {allTested && <button className="vr-primary compact" onClick={() => setPhase('discover')}>발견 확인</button>}
            </div>
            <div className="vr-object-dock" aria-label="실험할 물체 선택">
              {trials.map((trial) => <button key={trial.id} className={tested.includes(trial.id) ? 'tested' : ''} onClick={() => triggerSceneRef.current(trial.id)}><span>{tested.includes(trial.id) ? <Check size={18} /> : <MousePointer2 size={18} />}</span>{trial.shortName}</button>)}
            </div>
          </>
        )}

        {phase === 'discover' && (
          <div className="vr-panel vr-discovery-panel">
            <span className="vr-kicker"><Sparkles size={16} /> 우리가 발견한 것</span>
            <h1>크기만으로 정해지지 않아!</h1>
            <div className="vr-result-pairs"><span>코르크·병뚜껑 <strong>떠요 ↑</strong></span><span>동전·돌멩이 <strong>가라앉아요 ↓</strong></span></div>
            <p>물체가 물에 뜨거나 가라앉는 것은 재료와 무게, 모양에 따라 달라질 수 있어요.</p>
            <button className="vr-primary" onClick={() => { playVrSound('success'); setPhase('complete'); }}><Star size={19} fill="currentColor" /> 별 받기</button>
          </div>
        )}

        {phase === 'complete' && (
          <div className="vr-panel vr-complete-panel" aria-live="polite">
            <Star className="vr-earned-star" size={74} fill="currentColor" />
            <span>VR 탐구 완료</span>
            <h1>멋진 발견이야!</h1>
            <p>네 가지 물체를 직접 비교했어요.</p>
            <div className="vr-complete-actions">
              <a href="/reports?id=float"><FileText size={20} /> 학부모 리포트</a>
              <a href="/"><Home size={20} /> 다른 실험</a>
              <button onClick={resetPrototype} aria-label="VR 실험 다시 하기" title="다시 하기"><RotateCcw size={21} /></button>
            </div>
          </div>
        )}
      </section>
    </main>
  );
}
