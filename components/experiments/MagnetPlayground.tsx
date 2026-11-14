'use client';

import { Magnet, RotateCcw } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { recordTrial } from '@/lib/inquiry';
import { playVrSound } from '@/lib/vrAudio';
import { euro, josa } from '@/lib/parentInsights';

export type MagnetObject = { id: string; name: string; icon: string; sticks: boolean; material: string };
export type ObjectGuess = 'yes' | 'no';

const PULL_RANGE = 150; // px: iron objects start leaning toward the magnet inside this distance
const TOUCH_RANGE = 62; // px: closer than this counts as touching the object with the magnet

type Point = { x: number; y: number };

/**
 * Hands-on magnet board: predict each object, drag the magnet, watch iron lean in and snap on,
 * then pull everything off and try again. Every contact is logged to the inquiry notebook.
 */
export function MagnetPlayground({ objects, guesses, onGuess, tested, onTested }: {
  objects: readonly MagnetObject[];
  guesses: Record<string, ObjectGuess>;
  onGuess: (id: string, guess: ObjectGuess) => void;
  tested: string[];
  onTested: (id: string) => void;
}) {
  const board = useRef<HTMLDivElement>(null);
  const dragging = useRef(false);
  const touching = useRef(new Set<string>());
  const [magnet, setMagnet] = useState<Point>({ x: 90, y: 70 });
  const [attached, setAttached] = useState<string[]>([]);
  const [note, setNote] = useState('먼저 각 물체가 붙을지 예상한 다음, 자석을 끌어서 가까이 가져가 봐.');
  const [size, setSize] = useState({ width: 760, height: 360 });
  const [isDragging, setIsDragging] = useState(false);

  // Object positions depend on the board size, so keep the measured size in state.
  useEffect(() => {
    const element = board.current;
    if (!element) return;
    const measure = () => setSize({ width: element.clientWidth, height: element.clientHeight });
    measure();
    if (typeof ResizeObserver === 'undefined') return;
    const observer = new ResizeObserver(measure);
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  function homeOf(index: number): Point {
    return { x: (size.width / objects.length) * (index + 0.5), y: size.height - 78 };
  }

  function touch(item: MagnetObject) {
    if (!guesses[item.id]) {
      setNote(`${item.name}${josa(item.name, '은', '는')} 아직 예상하지 않았어. 아래에서 붙을지 먼저 골라 줘!`);
      return;
    }
    if (touching.current.has(item.id)) return;
    touching.current.add(item.id);
    recordTrial('magnet', item.name, item.sticks ? '자석에 끌려와서 붙었어요.' : '자석을 대도 움직이지 않았어요.');
    onTested(item.id);
    if (item.sticks) {
      setAttached((old) => (old.includes(item.id) ? old : [...old, item.id]));
      playVrSound('magnet');
      setNote(`찰칵! ${item.name}${josa(item.name, '이', '가')} 자석 쪽으로 끌려와 붙었어. ${item.material}${euro(item.material)} 만들었거든.`);
    } else {
      playVrSound('place');
      setNote(`${item.name}${josa(item.name, '은', '는')} 그대로야. ${item.material}${item.id === 'aluminum' ? '도 금속이지만' : josa(item.material, '은', '는')} 자석에 붙지 않아.`);
    }
  }

  function moveTo(point: Point) {
    const x = Math.max(40, Math.min(size.width - 40, point.x));
    const y = Math.max(36, Math.min(size.height - 36, point.y));
    setMagnet({ x, y });
    objects.forEach((item, index) => {
      const home = homeOf(index);
      const distance = Math.hypot(home.x - x, home.y - y);
      if (distance < TOUCH_RANGE) touch(item);
      else if (distance > TOUCH_RANGE + 30) touching.current.delete(item.id);
    });
  }

  function fromEvent(event: React.PointerEvent): Point {
    const rect = board.current!.getBoundingClientRect();
    return { x: event.clientX - rect.left, y: event.clientY - rect.top };
  }

  function bringTo(index: number) {
    const home = homeOf(index);
    moveTo({ x: home.x, y: home.y - 20 });
  }

  function detach() {
    if (!attached.length) return;
    playVrSound('select');
    setAttached([]);
    touching.current.clear();
    setMagnet({ x: 90, y: 70 });
    setNote('물체를 떼어 냈어. 다시 가까이 가져가서 같은 결과가 나오는지 확인해 봐!');
  }

  function objectStyle(item: MagnetObject, index: number): React.CSSProperties {
    const home = homeOf(index);
    const slot = attached.indexOf(item.id);
    if (slot >= 0) {
      // Stack attached objects under the magnet so several can hang on at once.
      return { left: magnet.x + (slot - (attached.length - 1) / 2) * 34, top: magnet.y + 52 + (slot % 2) * 8, transition: isDragging ? 'none' : undefined };
    }
    const dx = magnet.x - home.x;
    const dy = magnet.y - home.y;
    const distance = Math.hypot(dx, dy);
    const lean = item.sticks && guesses[item.id] && distance < PULL_RANGE ? (1 - distance / PULL_RANGE) * 28 : 0;
    return { left: home.x + (dx / (distance || 1)) * lean, top: home.y + (dy / (distance || 1)) * lean };
  }

  return <div className="magnet-play">
    <div
      className="magnet-field"
      ref={board}
      onPointerMove={(event) => { if (dragging.current) moveTo(fromEvent(event)); }}
      onPointerUp={() => { dragging.current = false; setIsDragging(false); }}
      onPointerCancel={() => { dragging.current = false; setIsDragging(false); }}
    >
      <div
        className="drag-magnet"
        style={{ left: magnet.x, top: magnet.y }}
        role="img"
        aria-label="끌어서 움직이는 자석"
        onPointerDown={(event) => { dragging.current = true; setIsDragging(true); event.currentTarget.parentElement?.setPointerCapture(event.pointerId); playVrSound('select'); }}
      ><Magnet size={44} /><span>끌어 봐</span></div>
      {objects.map((item, index) => {
        const isAttached = attached.includes(item.id);
        const near = !isAttached && item.sticks && Math.hypot(magnet.x - homeOf(index).x, magnet.y - homeOf(index).y) < PULL_RANGE;
        return <div key={item.id} className={`field-object ${isAttached ? 'attached' : ''} ${near && guesses[item.id] ? 'leaning' : ''} ${tested.includes(item.id) && !item.sticks ? 'stays' : ''}`} style={objectStyle(item, index)} aria-hidden="true">
          <span>{item.icon}</span>
        </div>;
      })}
    </div>
    <p className="magnet-note" role="status">{note}</p>
    <div className="magnet-toolbar"><button type="button" onClick={detach} disabled={!attached.length}><RotateCcw size={18} /> 자석에서 떼어내기</button><span>자석을 끌 수 없으면 아래 “자석 대 보기”를 눌러도 돼.</span></div>
    <table className="magnet-table">
      <caption>예상하고 시험한 결과 분류표</caption>
      <thead><tr><th scope="col">물체 (재료)</th><th scope="col">내 예상</th><th scope="col">결과</th><th scope="col">시험</th></tr></thead>
      <tbody>{objects.map((item, index) => {
        const guess = guesses[item.id];
        const done = tested.includes(item.id);
        const matched = done && guess === (item.sticks ? 'yes' : 'no');
        return <tr key={item.id} className={done ? (matched ? 'matched' : 'different') : ''}>
          <th scope="row"><span aria-hidden="true">{item.icon}</span> {item.name}<small>{item.material}</small></th>
          <td><div className="guess-toggle" role="group" aria-label={`${item.name} 예상`}>
            <button type="button" aria-pressed={guess === 'yes'} onClick={() => onGuess(item.id, 'yes')}>붙을 것 같아</button>
            <button type="button" aria-pressed={guess === 'no'} onClick={() => onGuess(item.id, 'no')}>안 붙을 것 같아</button>
          </div></td>
          <td>{done ? <strong>{item.sticks ? '🧲 붙었어' : '✋ 안 붙었어'}{matched ? ' · 예상과 같아' : ' · 예상과 달라'}</strong> : <span className="muted">아직</span>}</td>
          <td><button type="button" className="bring-button" disabled={!guess} onClick={() => bringTo(index)}>자석 대 보기</button></td>
        </tr>;
      })}</tbody>
    </table>
  </div>;
}
