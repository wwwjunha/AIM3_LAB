'use client';

import { ArrowLeft, Car, Check, FileText, Glasses, Home, Lightbulb, MousePointer2, Music2, RotateCcw, Sparkles, Star } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { playStringTone } from '@/lib/audio';
import { completeExperiment, getProgress, startExperiment } from '@/lib/progress';

export type ExplorerKind = 'light' | 'sound' | 'friction';
type Phase = 'predict' | 'experiment' | 'discover' | 'complete';
type Trial = { id: string; name: string; shortName: string; result: string };

type LabConfig = {
  title: string;
  themeClass: string;
  question: string;
  prompt: string;
  predictions: string[];
  trials: Trial[];
  discoveryTitle: string;
  discovery: string;
  pairs: Array<{ label: string; result: string }>;
  skills: string[];
};

const labs: Record<ExplorerKind, LabConfig> = {
  light: {
    title: '빛과 그림자 탐사대',
    themeClass: 'light-vr',
    question: '손전등이 물체에 가까워지면 그림자는 어떻게 될까?',
    prompt: '빛의 위치를 골라 그림자 크기를 비교해 봐.',
    predictions: ['그림자가 커져요', '그림자가 작아져요', '크기가 같아요'],
    trials: [
      { id: 'near', name: '가까운 빛', shortName: '가까이', result: '손전등이 가까우니 그림자가 가장 커졌어요.' },
      { id: 'middle', name: '중간 거리 빛', shortName: '중간', result: '그림자가 중간 크기로 보였어요.' },
      { id: 'far', name: '먼 빛', shortName: '멀리', result: '손전등이 멀어지니 그림자가 작아졌어요.' },
    ],
    discoveryTitle: '빛이 가까울수록 그림자가 커져!',
    discovery: '빛과 물체 사이의 거리가 달라지면 스크린에 생기는 그림자의 크기도 달라져요.',
    pairs: [
      { label: '가까운 손전등', result: '큰 그림자' },
      { label: '먼 손전등', result: '작은 그림자' },
    ],
    skills: ['빛의 거리 조절하기', '그림자 크기 비교하기', '원인과 결과 찾기'],
  },
  sound: {
    title: '소리 진동 연주실',
    themeClass: 'sound-vr',
    question: '길이가 다른 줄을 튕기면 소리는 어떻게 달라질까?',
    prompt: '3D 악기의 줄을 직접 눌러 모두 튕겨 봐.',
    predictions: ['짧은 줄이 높은 소리', '긴 줄이 높은 소리', '모두 같은 소리'],
    trials: [
      { id: 'short', name: '짧은 줄', shortName: '짧은 줄', result: '빠르게 떨리며 높은 소리가 났어요.' },
      { id: 'medium', name: '중간 줄', shortName: '중간 줄', result: '중간 높이의 소리가 났어요.' },
      { id: 'long', name: '긴 줄', shortName: '긴 줄', result: '천천히 떨리며 낮은 소리가 났어요.' },
    ],
    discoveryTitle: '줄의 길이에 따라 음높이가 달라져!',
    discovery: '소리는 물체의 떨림으로 생기고, 줄이 짧을수록 더 빠르게 떨려 높은 소리가 나요.',
    pairs: [
      { label: '짧은 줄', result: '높은 소리' },
      { label: '긴 줄', result: '낮은 소리' },
    ],
    skills: ['줄 직접 연주하기', '떨림 관찰하기', '소리 높낮이 비교하기'],
  },
  friction: {
    title: '마찰 자동차 경주장',
    themeClass: 'friction-vr',
    question: '어떤 바닥에서 자동차가 가장 멀리 갈까?',
    prompt: '세 자동차를 출발시켜 이동 거리를 비교해 봐.',
    predictions: ['매끈한 타일', '나무판', '거친 사포'],
    trials: [
      { id: 'tile', name: '타일 위 자동차', shortName: '타일', result: '마찰이 작아 자동차가 가장 멀리 갔어요.' },
      { id: 'wood', name: '나무판 위 자동차', shortName: '나무판', result: '자동차가 중간 거리에서 멈췄어요.' },
      { id: 'sandpaper', name: '사포 위 자동차', shortName: '사포', result: '마찰이 커서 자동차가 가장 빨리 멈췄어요.' },
    ],
    discoveryTitle: '거친 바닥일수록 더 빨리 멈춰!',
    discovery: '바닥이 거칠수록 움직임을 방해하는 마찰이 커져 자동차가 더 짧은 거리를 가요.',
    pairs: [
      { label: '매끈한 타일', result: '멀리 이동' },
      { label: '거친 사포', result: '빨리 멈춤' },
    ],
    skills: ['같은 힘으로 출발시키기', '이동 거리 비교하기', '마찰 이해하기'],
  },
};

const palette: Record<ExplorerKind, { sky: string; floor: string; accent: string; glow: string }> = {
  light: { sky: '#d8edf3', floor: '#d7e4df', accent: '#f0a51b', glow: '#fff2a6' },
  sound: { sky: '#e4edf2', floor: '#d8e3e0', accent: '#d55273', glow: '#f9bfd2' },
  friction: { sky: '#d9ece7', floor: '#d6e3dc', accent: '#24836c', glow: '#aeead8' },
};

function createLabel(text: string, color: string) {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 128;
  const context = canvas.getContext('2d');
  if (!context) return new THREE.Sprite();
  context.fillStyle = 'rgba(255,255,255,.94)';
  context.beginPath();
  context.roundRect(8, 8, 496, 112, 22);
  context.fill();
  context.strokeStyle = color;
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

function createBoardTexture(title: string, detail: string, color: string, complete = false) {
  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 420;
  const context = canvas.getContext('2d');
  if (!context) return new THREE.CanvasTexture(canvas);
  context.fillStyle = complete ? '#e9f8ef' : '#f8fbfa';
  context.fillRect(0, 0, 1024, 420);
  context.fillStyle = color;
  context.fillRect(0, 0, 1024, 56);
  context.fillStyle = '#243c48';
  context.font = '900 66px "Malgun Gothic", sans-serif';
  context.textAlign = 'center';
  context.fillText(title, 512, 185);
  context.fillStyle = '#58717a';
  context.font = '700 38px "Malgun Gothic", sans-serif';
  context.fillText(detail, 512, 285);
  context.strokeStyle = color;
  context.lineWidth = 13;
  context.beginPath();
  context.arc(512, 350, 23, 0, Math.PI * 2);
  context.stroke();
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

function standardMaterial(color: string, roughness = 0.58, metalness = 0) {
  return new THREE.MeshStandardMaterial({ color, roughness, metalness });
}

function titleIcon(kind: ExplorerKind) {
  if (kind === 'light') return <Lightbulb size={23} />;
  if (kind === 'sound') return <Music2 size={23} />;
  return <Car size={23} />;
}

export default function ExplorerVRLab({ kind }: { kind: ExplorerKind }) {
  const config = labs[kind];
  const colors = palette[kind];
  const mountRef = useRef<HTMLDivElement>(null);
  const runTrialRef = useRef<(id: string) => void>(() => undefined);
  const triggerSceneRef = useRef<(id: string) => void>(() => undefined);
  const enterVrRef = useRef<() => Promise<void>>(async () => undefined);
  const boardRef = useRef<THREE.Mesh<THREE.PlaneGeometry, THREE.MeshBasicMaterial> | null>(null);
  const phaseRef = useRef<Phase>('predict');
  const [phase, setPhase] = useState<Phase>('predict');
  const [prediction, setPrediction] = useState('');
  const [tested, setTested] = useState<string[]>([]);
  const [active, setActive] = useState<string | null>(null);
  const [sceneReady, setSceneReady] = useState(false);
  const [vrSupport, setVrSupport] = useState<'checking' | 'supported' | 'unsupported'>('checking');
  const [vrActive, setVrActive] = useState(false);
  const [stars, setStars] = useState(0);

  const runTrial = useCallback((id: string) => {
    if (phaseRef.current !== 'experiment') return;
    setActive(id);
    setTested((current) => current.includes(id) ? current : [...current, id]);
  }, []);

  useEffect(() => { runTrialRef.current = runTrial; }, [runTrial]);
  useEffect(() => { phaseRef.current = phase; }, [phase]);

  useEffect(() => {
    startExperiment(kind);
    queueMicrotask(() => setStars(getProgress().totalStars));
  }, [kind]);

  useEffect(() => {
    if (phase !== 'complete') return;
    completeExperiment(kind, {
      title: `${config.title} VR`,
      question: config.question,
      prediction,
      observations: config.trials.map((trial) => `${trial.name}: ${trial.result}`),
      discovery: config.discovery,
      skills: config.skills,
    });
    queueMicrotask(() => setStars(getProgress().totalStars));
  }, [config, kind, phase, prediction]);

  useEffect(() => {
    const board = boardRef.current;
    if (!board) return;
    const oldTexture = board.material.map;
    const allTested = tested.length === config.trials.length;
    const title = phase === 'predict' ? config.question : allTested ? '관찰 완료!' : `${tested.length} / ${config.trials.length} 관찰`;
    board.material.map = createBoardTexture(title, phase === 'experiment' ? config.prompt : config.trials.map((trial) => trial.shortName).join(' · '), colors.accent, allTested);
    board.material.needsUpdate = true;
    oldTexture?.dispose();
  }, [colors.accent, config, phase, tested.length]);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;
    const host = mount;
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(colors.sky);
    scene.fog = new THREE.Fog(colors.sky, 15, 30);

    const camera = new THREE.PerspectiveCamera(43, 1, 0.05, 42);
    camera.position.set(0, 3.5, 6.4);
    const renderer = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true });
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.xr.enabled = true;
    renderer.xr.setReferenceSpaceType('local-floor');
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.7));
    renderer.domElement.dataset.sceneReady = 'false';
    renderer.domElement.setAttribute('aria-label', `${config.title} 3D 가상 실험 장면`);
    host.appendChild(renderer.domElement);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.target.set(0, 1.35, -2.15);
    controls.enablePan = false;
    controls.minDistance = 5.3;
    controls.maxDistance = 14;
    controls.minPolarAngle = 0.62;
    controls.maxPolarAngle = 1.42;
    controls.update();

    scene.add(new THREE.HemisphereLight('#ffffff', '#66877c', 2.2));
    const keyLight = new THREE.DirectionalLight('#fff8dc', 3.6);
    keyLight.position.set(4, 8, 5);
    keyLight.castShadow = true;
    keyLight.shadow.mapSize.set(1024, 1024);
    scene.add(keyLight);
    const accentLight = new THREE.PointLight(colors.glow, 30, 10);
    accentLight.position.set(-4, 3.4, 1);
    scene.add(accentLight);

    const floor = new THREE.Mesh(new THREE.PlaneGeometry(22, 22), standardMaterial(colors.floor, 0.92));
    floor.rotation.x = -Math.PI / 2;
    floor.receiveShadow = true;
    scene.add(floor);
    const grid = new THREE.GridHelper(22, 22, colors.accent, '#b8cec6');
    grid.position.y = 0.006;
    scene.add(grid);
    const wall = new THREE.Mesh(new THREE.PlaneGeometry(16, 7), standardMaterial('#f8fbf8', 1));
    wall.position.set(0, 3.45, -5.45);
    wall.receiveShadow = true;
    scene.add(wall);

    const board = new THREE.Mesh(new THREE.PlaneGeometry(5.1, 1.9), new THREE.MeshBasicMaterial({ map: createBoardTexture(config.question, config.trials.map((trial) => trial.shortName).join(' · '), colors.accent) }));
    board.position.set(0, 3.55, -5.36);
    scene.add(board);
    boardRef.current = board;
    const frame = new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.BoxGeometry(5.34, 2.14, 0.08)), new THREE.LineBasicMaterial({ color: '#294651' }));
    frame.position.set(0, 3.55, -5.31);
    scene.add(frame);

    const table = new THREE.Mesh(new THREE.BoxGeometry(7.6, 0.28, 3.6), standardMaterial('#e8b45e', 0.68));
    table.position.set(0, 0.64, -2.35);
    table.castShadow = true;
    table.receiveShadow = true;
    scene.add(table);
    for (const x of [-3.35, 3.35]) for (const z of [-3.6, -1.1]) {
      const leg = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.76, 0.28), standardMaterial('#315b65', 0.7));
      leg.position.set(x, 0.27, z);
      leg.castShadow = true;
      scene.add(leg);
    }

    const hitObjects: THREE.Object3D[] = [];
    const actionGroups = new Map<string, THREE.Group>();
    const actionStarts = new Map<string, number>();
    let lamp: THREE.Group | null = null;
    let lampTargetX = -2.55;
    let shadow: THREE.Mesh | null = null;
    let shadowTarget = 1.65;

    function tagGroup(group: THREE.Group, id: string) {
      group.traverse((child) => {
        if (child instanceof THREE.Mesh) {
          child.userData.trialId = id;
          hitObjects.push(child);
          child.castShadow = true;
        }
      });
      actionGroups.set(id, group);
    }

    if (kind === 'light') {
      const screen = new THREE.Mesh(new THREE.BoxGeometry(2.1, 2.5, 0.12), standardMaterial('#f3f6ef', 0.92));
      screen.position.set(1.85, 1.95, -3.75);
      scene.add(screen);
      shadow = new THREE.Mesh(new THREE.CircleGeometry(0.52, 36), new THREE.MeshBasicMaterial({ color: '#40525c', transparent: true, opacity: 0.76 }));
      shadow.position.set(1.84, 1.95, -3.67);
      scene.add(shadow);
      const toy = new THREE.Group();
      const toyBody = new THREE.Mesh(new THREE.CapsuleGeometry(0.27, 0.54, 7, 18), standardMaterial('#55a986', 0.72));
      const toyHead = new THREE.Mesh(new THREE.SphereGeometry(0.28, 24, 18), standardMaterial('#70c09d', 0.72));
      toyHead.position.y = 0.62;
      toy.add(toyBody, toyHead);
      toy.position.set(0.55, 1.2, -2.65);
      scene.add(toy);

      lamp = new THREE.Group();
      const lampBody = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.18, 0.8, 24), standardMaterial('#344e5a', 0.38, 0.45));
      lampBody.rotation.z = Math.PI / 2;
      const lampHead = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.22, 0.34, 24), standardMaterial(colors.accent, 0.42));
      lampHead.rotation.z = Math.PI / 2;
      lampHead.position.x = 0.52;
      const bulb = new THREE.Mesh(new THREE.CircleGeometry(0.18, 24), new THREE.MeshBasicMaterial({ color: '#fff5a8' }));
      bulb.rotation.y = Math.PI / 2;
      bulb.position.x = 0.705;
      lamp.add(lampBody, lampHead, bulb);
      lamp.position.set(lampTargetX, 1.15, -2.65);
      scene.add(lamp);
      const beam = new THREE.Mesh(new THREE.ConeGeometry(0.68, 2.8, 32, 1, true), new THREE.MeshBasicMaterial({ color: '#ffe56d', transparent: true, opacity: 0.19, side: THREE.DoubleSide }));
      beam.rotation.z = -Math.PI / 2;
      beam.position.set(-0.75, 1.15, -2.65);
      scene.add(beam);

      const lightPositions: Record<string, number> = { near: -0.9, middle: -1.75, far: -2.6 };
      config.trials.forEach((trial) => {
        const marker = new THREE.Group();
        const pad = new THREE.Mesh(new THREE.CylinderGeometry(0.38, 0.38, 0.12, 30), standardMaterial(tested.includes(trial.id) ? '#2e8a6d' : colors.accent, 0.7));
        marker.add(pad);
        const label = createLabel(trial.shortName, colors.accent);
        label.position.y = 0.48;
        marker.add(label);
        marker.position.set(lightPositions[trial.id], 0.88, -1.25);
        scene.add(marker);
        tagGroup(marker, trial.id);
      });
    }

    if (kind === 'sound') {
      const body = new THREE.Mesh(new THREE.BoxGeometry(5.8, 2.05, 0.34), standardMaterial('#b86c45', 0.68));
      body.position.set(0, 1.72, -2.9);
      scene.add(body);
      const soundHole = new THREE.Mesh(new THREE.TorusGeometry(0.46, 0.09, 12, 36), standardMaterial('#4d332a', 0.82));
      soundHole.position.set(0, 1.72, -2.69);
      scene.add(soundHole);
      const lengths: Record<string, number> = { short: 2.45, medium: 3.5, long: 4.7 };
      const ys: Record<string, number> = { short: 2.28, medium: 1.72, long: 1.16 };
      config.trials.forEach((trial) => {
        const group = new THREE.Group();
        const string = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.045, lengths[trial.id], 12), standardMaterial(trial.id === 'short' ? '#ffe889' : trial.id === 'medium' ? '#9de7df' : '#ffb0c3', 0.3, 0.32));
        string.rotation.z = Math.PI / 2;
        group.add(string);
        const label = createLabel(trial.shortName, colors.accent);
        label.position.set(0, 0.28, 0.12);
        group.add(label);
        group.position.set(0, ys[trial.id], -2.62);
        scene.add(group);
        tagGroup(group, trial.id);
      });
    }

    if (kind === 'friction') {
      const laneXs: Record<string, number> = { tile: -2.2, wood: 0, sandpaper: 2.2 };
      const laneColors: Record<string, string> = { tile: '#a9dceb', wood: '#b97842', sandpaper: '#59636a' };
      config.trials.forEach((trial) => {
        const x = laneXs[trial.id];
        const lane = new THREE.Mesh(new THREE.BoxGeometry(1.7, 0.1, 3.15), standardMaterial(laneColors[trial.id], trial.id === 'tile' ? 0.18 : trial.id === 'wood' ? 0.62 : 1));
        lane.position.set(x, 0.85, -2.45);
        lane.receiveShadow = true;
        scene.add(lane);
        const car = new THREE.Group();
        const body = new THREE.Mesh(new THREE.BoxGeometry(0.85, 0.34, 0.55), standardMaterial(trial.id === 'tile' ? '#ef5852' : trial.id === 'wood' ? '#f0b62e' : '#3f8fc7', 0.45));
        body.position.y = 0.2;
        car.add(body);
        for (const wheelX of [-0.32, 0.32]) for (const wheelZ of [-0.3, 0.3]) {
          const wheel = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.14, 0.1, 18), standardMaterial('#26333a', 0.78));
          wheel.rotation.z = Math.PI / 2;
          wheel.position.set(wheelX, 0, wheelZ);
          car.add(wheel);
        }
        const label = createLabel(trial.shortName, colors.accent);
        label.position.y = 0.85;
        car.add(label);
        car.position.set(x, 1.05, -1.2);
        scene.add(car);
        tagGroup(car, trial.id);
      });
    }

    function triggerTrial(id: string) {
      if (phaseRef.current !== 'experiment' || !config.trials.some((trial) => trial.id === id)) return;
      if (kind === 'light') {
        const positions: Record<string, number> = { near: -0.9, middle: -1.75, far: -2.6 };
        const scales: Record<string, number> = { near: 1.72, middle: 1.22, far: 0.78 };
        lampTargetX = positions[id];
        shadowTarget = scales[id];
      }
      if (kind === 'sound') {
        actionStarts.set(id, performance.now());
        const frequency: Record<string, number> = { short: 540, medium: 390, long: 260 };
        void playStringTone(frequency[id]);
      }
      if (kind === 'friction') {
        const group = actionGroups.get(id);
        if (group) group.position.z = -1.2;
        actionStarts.set(id, performance.now());
      }
      runTrialRef.current(id);
    }
    triggerSceneRef.current = triggerTrial;

    const raycaster = new THREE.Raycaster();
    const pointer = new THREE.Vector2();
    let pointerPick: { id: string; pointerId: number; x: number; y: number } | null = null;

    function setRay(event: PointerEvent) {
      const rect = renderer.domElement.getBoundingClientRect();
      pointer.set(((event.clientX - rect.left) / rect.width) * 2 - 1, -((event.clientY - rect.top) / rect.height) * 2 + 1);
      raycaster.setFromCamera(pointer, camera);
    }

    function findHit(ray: THREE.Ray) {
      raycaster.ray.copy(ray);
      return raycaster.intersectObjects(hitObjects, false)[0]?.object.userData.trialId as string | undefined;
    }

    function onPointerDown(event: PointerEvent) {
      if (phaseRef.current !== 'experiment') return;
      setRay(event);
      const id = findHit(raycaster.ray);
      if (!id) return;
      pointerPick = { id, pointerId: event.pointerId, x: event.clientX, y: event.clientY };
      controls.enabled = false;
      renderer.domElement.setPointerCapture(event.pointerId);
      renderer.domElement.style.cursor = 'grabbing';
      event.preventDefault();
      event.stopImmediatePropagation();
    }

    function onPointerUp(event: PointerEvent) {
      if (!pointerPick || pointerPick.pointerId !== event.pointerId) return;
      const pick = pointerPick;
      pointerPick = null;
      controls.enabled = true;
      renderer.domElement.style.cursor = 'grab';
      if (renderer.domElement.hasPointerCapture(event.pointerId)) renderer.domElement.releasePointerCapture(event.pointerId);
      if (Math.hypot(event.clientX - pick.x, event.clientY - pick.y) < 18) triggerTrial(pick.id);
      event.preventDefault();
      event.stopImmediatePropagation();
    }

    function onPointerMove(event: PointerEvent) {
      if (pointerPick) return;
      setRay(event);
      renderer.domElement.style.cursor = findHit(raycaster.ray) ? 'grab' : 'default';
    }
    renderer.domElement.addEventListener('pointerdown', onPointerDown, true);
    renderer.domElement.addEventListener('pointerup', onPointerUp, true);
    renderer.domElement.addEventListener('pointercancel', onPointerUp, true);
    renderer.domElement.addEventListener('pointermove', onPointerMove, true);

    const controllers: THREE.Group[] = [];
    for (let index = 0; index < 2; index += 1) {
      const controller = renderer.xr.getController(index);
      controller.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(), new THREE.Vector3(0, 0, -4)]), new THREE.LineBasicMaterial({ color: index === 0 ? '#ffca3a' : '#68dfbd' })));
      controller.addEventListener('select', () => {
        if (phaseRef.current !== 'experiment') return;
        const matrix = new THREE.Matrix4().identity().extractRotation(controller.matrixWorld);
        const ray = new THREE.Ray();
        ray.origin.setFromMatrixPosition(controller.matrixWorld);
        ray.direction.set(0, 0, -1).applyMatrix4(matrix);
        const id = findHit(ray);
        if (id) triggerTrial(id);
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
    if (navigator.xr) navigator.xr.isSessionSupported('immersive-vr').then((supported) => setVrSupport(supported ? 'supported' : 'unsupported')).catch(() => setVrSupport('unsupported'));
    else queueMicrotask(() => setVrSupport('unsupported'));

    let narrowView = false;
    function resize() {
      const width = Math.max(1, host.clientWidth);
      const height = Math.max(1, host.clientHeight);
      const nextNarrow = width < 620;
      if (nextNarrow !== narrowView) {
        narrowView = nextNarrow;
        camera.position.set(0, nextNarrow ? 4.45 : 3.5, nextNarrow ? 14.6 : 6.4);
        controls.target.set(0, 1.35, -2.15);
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
      if (lamp) lamp.position.x += (lampTargetX - lamp.position.x) * 0.1;
      if (shadow) {
        const next = shadow.scale.x + (shadowTarget - shadow.scale.x) * 0.1;
        shadow.scale.setScalar(next);
        (shadow.material as THREE.MeshBasicMaterial).opacity = 0.7 + Math.sin(elapsed * 2) * 0.03;
      }
      if (kind === 'sound') {
        actionStarts.forEach((startedAt, id) => {
          const group = actionGroups.get(id);
          if (!group) return;
          const progress = (performance.now() - startedAt) / 950;
          group.position.z = -2.62 + Math.sin(progress * Math.PI * 16) * (1 - Math.min(progress, 1)) * 0.12;
          if (progress >= 1) {
            group.position.z = -2.62;
            actionStarts.delete(id);
          }
        });
      }
      if (kind === 'friction') {
        const distances: Record<string, number> = { tile: -3.72, wood: -3.08, sandpaper: -2.35 };
        actionStarts.forEach((startedAt, id) => {
          const group = actionGroups.get(id);
          if (!group) return;
          const progress = Math.min((performance.now() - startedAt) / 1350, 1);
          const eased = 1 - Math.pow(1 - progress, id === 'sandpaper' ? 4 : 2);
          group.position.z = THREE.MathUtils.lerp(-1.2, distances[id], eased);
          group.rotation.y = Math.sin(progress * Math.PI) * 0.04;
          if (progress >= 1) actionStarts.delete(id);
        });
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
      renderer.domElement.removeEventListener('pointerdown', onPointerDown, true);
      renderer.domElement.removeEventListener('pointerup', onPointerUp, true);
      renderer.domElement.removeEventListener('pointercancel', onPointerUp, true);
      renderer.domElement.removeEventListener('pointermove', onPointerMove, true);
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
  }, [colors, config, kind]);

  const activeTrial = config.trials.find((trial) => trial.id === active);
  const allTested = tested.length === config.trials.length;

  return (
    <main className={`vr-lab-page explorer-vr ${config.themeClass}`}>
      <header className="vr-lab-header">
        <a href="/" aria-label="실험실 홈"><ArrowLeft size={22} /><span>실험실 홈</span></a>
        <div>{titleIcon(kind)}<strong>{config.title}</strong><span>3D·VR 시제품</span></div>
        <div className="vr-stars"><Star size={20} fill="currentColor" /> {stars} / 18</div>
      </header>

      <section className="vr-viewport" aria-label={`${config.title} VR 실험실`}>
        <div className="vr-canvas-mount" ref={mountRef} />
        {!sceneReady && <div className="vr-loading">{titleIcon(kind)}<strong>실험실 준비 중</strong></div>}
        <div className="vr-top-tools">
          <div className="vr-mode-status"><span className={vrActive ? 'live' : ''} />{vrActive ? 'VR 실험 중' : '화면 3D 모드'}</div>
          {vrSupport === 'supported' && phase === 'experiment'
            ? <button className="vr-enter-button" onClick={() => void enterVrRef.current()}><Glasses size={22} /> VR 입장</button>
            : <span className="vr-device-note">{vrSupport === 'checking' ? 'VR 기기 확인 중' : vrSupport === 'supported' ? (phase === 'predict' ? '예상한 뒤 VR로 입장해요' : 'VR 관찰 완료') : 'VR 기기에서는 입장 버튼이 열려요'}</span>}
        </div>

        {phase === 'predict' && (
          <div className="vr-panel vr-prediction-panel">
            <span className="vr-kicker"><Sparkles size={16} /> 실험 전 예상</span>
            <h1>{config.question}</h1>
            <div className="vr-prediction-options">
              {config.predictions.map((choice) => <button className={prediction === choice ? 'selected' : ''} key={choice} onClick={() => setPrediction(choice)}>{prediction === choice && <Check size={18} />}{choice}</button>)}
            </div>
            <button className="vr-primary" disabled={!prediction} onClick={() => prediction && setPhase('experiment')}>실험 시작 <MousePointer2 size={19} /></button>
          </div>
        )}

        {phase === 'experiment' && (
          <>
            <div className="vr-panel vr-observation-panel" aria-live="polite">
              <span>{tested.length} / {config.trials.length} 관찰</span>
              <strong>{activeTrial ? activeTrial.name : '3D 물체를 직접 눌러 봐'}</strong>
              <p>{activeTrial ? activeTrial.result : config.prompt}</p>
              {allTested && <button className="vr-primary compact" onClick={() => setPhase('discover')}>실험 결과 확인</button>}
            </div>
            <div className="vr-object-dock explorer-dock" aria-label="실험 대상을 선택하는 보조 버튼">
              {config.trials.map((trial) => <button key={trial.id} className={tested.includes(trial.id) ? 'tested' : ''} onClick={() => triggerSceneRef.current(trial.id)}><span>{tested.includes(trial.id) ? <Check size={18} /> : <MousePointer2 size={18} />}</span>{trial.shortName}</button>)}
            </div>
          </>
        )}

        {phase === 'discover' && (
          <div className="vr-panel vr-discovery-panel">
            <span className="vr-kicker"><Sparkles size={16} /> 우리가 발견한 것</span>
            <h1>{config.discoveryTitle}</h1>
            <div className="vr-result-pairs">{config.pairs.map((pair) => <span key={pair.label}>{pair.label}<strong>{pair.result}</strong></span>)}</div>
            <p>{config.discovery}</p>
            <button className="vr-primary" onClick={() => setPhase('complete')}><Star size={19} fill="currentColor" /> 실험 별 받기</button>
          </div>
        )}

        {phase === 'complete' && (
          <div className="vr-panel vr-complete-panel" aria-live="polite">
            <Star className="vr-earned-star" size={74} fill="currentColor" />
            <span>VR 실험 완료</span>
            <h1>{config.title} 성공!</h1>
            <p>{config.discovery}</p>
            <div className="vr-complete-actions">
              <a href={`/reports?id=${kind}`}><FileText size={20} /> 학부모 리포트</a>
              <a href="/"><Home size={20} /> 다른 실험</a>
              <button onClick={() => location.reload()} aria-label="VR 실험 다시 하기" title="다시 하기"><RotateCcw size={21} /></button>
            </div>
          </div>
        )}
      </section>
    </main>
  );
}
