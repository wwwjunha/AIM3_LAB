export type VrSoundCue = 'select' | 'start' | 'place' | 'water' | 'bubble' | 'pour' | 'stir' | 'fizz' | 'rain' | 'grow' | 'slide' | 'magnet' | 'circuit' | 'light' | 'success' | 'string';

const STORAGE_KEY = 'kongkongVrSoundEnabled';
let context: AudioContext | null = null;
let noiseBuffer: AudioBuffer | null = null;
let enabled: boolean | null = null;
const listeners = new Set<() => void>();

export function subscribeVrSound(listener: () => void) {
  listeners.add(listener);
  return () => { listeners.delete(listener); };
}

export function isVrSoundEnabled() {
  if (enabled !== null) return enabled;
  try { enabled = localStorage.getItem(STORAGE_KEY) !== 'false'; }
  catch { enabled = true; }
  return enabled;
}

export function setVrSoundEnabled(value: boolean) {
  enabled = value;
  try { localStorage.setItem(STORAGE_KEY, String(value)); } catch { /* Private browsing can block storage. */ }
  if (!value && context?.state === 'running') void context.suspend().catch(() => {});
  listeners.forEach((listener) => listener());
}

function tone(audio: AudioContext, at: number, frequency: number, duration: number, volume: number, endFrequency = frequency, type: OscillatorType = 'sine') {
  const oscillator = audio.createOscillator();
  const gain = audio.createGain();
  oscillator.type = type;
  oscillator.frequency.setValueAtTime(frequency, at);
  oscillator.frequency.exponentialRampToValueAtTime(Math.max(20, endFrequency), at + duration);
  gain.gain.setValueAtTime(0.0001, at);
  gain.gain.exponentialRampToValueAtTime(volume, at + Math.min(0.018, duration / 4));
  gain.gain.exponentialRampToValueAtTime(0.0001, at + duration);
  oscillator.connect(gain).connect(audio.destination);
  oscillator.start(at);
  oscillator.stop(at + duration + 0.01);
}

function noise(audio: AudioContext, at: number, duration: number, volume: number, lowpass: number) {
  if (!noiseBuffer || noiseBuffer.sampleRate !== audio.sampleRate) {
    noiseBuffer = audio.createBuffer(1, audio.sampleRate, audio.sampleRate);
    const data = noiseBuffer.getChannelData(0);
    for (let i = 0; i < data.length; i += 1) data[i] = Math.random() * 2 - 1;
  }
  const source = audio.createBufferSource();
  const filter = audio.createBiquadFilter();
  const gain = audio.createGain();
  source.buffer = noiseBuffer;
  filter.type = 'lowpass';
  filter.frequency.setValueAtTime(lowpass, at);
  filter.frequency.exponentialRampToValueAtTime(Math.max(200, lowpass * 0.45), at + duration);
  gain.gain.setValueAtTime(0.0001, at);
  gain.gain.linearRampToValueAtTime(volume, at + Math.min(0.04, duration / 3));
  gain.gain.exponentialRampToValueAtTime(0.0001, at + duration);
  source.connect(filter).connect(gain).connect(audio.destination);
  source.start(at, 0, duration);
  source.stop(at + duration);
}

function schedule(audio: AudioContext, cue: VrSoundCue, frequency: number) {
  const at = audio.currentTime + 0.015;
  switch (cue) {
    case 'select': tone(audio, at, 520, 0.11, 0.055, 620); break;
    case 'start': tone(audio, at, 380, 0.16, 0.07, 460); tone(audio, at + 0.11, 560, 0.2, 0.07, 660); break;
    case 'place': tone(audio, at, 185, 0.12, 0.1, 90, 'triangle'); noise(audio, at, 0.09, 0.025, 1500); break;
    case 'water': noise(audio, at, 0.28, 0.075, 1000); tone(audio, at + 0.07, 270, 0.16, 0.045, 150); break;
    case 'bubble': for (let i = 0; i < 3; i += 1) tone(audio, at + i * 0.085, 260 + i * 85, 0.1, 0.055, 390 + i * 85); break;
    case 'pour': noise(audio, at, 0.62, 0.06, 1400); tone(audio, at + 0.18, 310, 0.17, 0.045, 215); tone(audio, at + 0.4, 360, 0.15, 0.04, 245); break;
    case 'stir': noise(audio, at, 0.42, 0.045, 1100); tone(audio, at + 0.16, 230, 0.13, 0.03, 160); break;
    case 'fizz': noise(audio, at, 0.65, 0.075, 3200); for (let i = 0; i < 4; i += 1) tone(audio, at + 0.08 + i * 0.13, 390 + i * 55, 0.08, 0.022, 500 + i * 55); break;
    case 'rain': noise(audio, at, 0.82, 0.07, 2400); for (let i = 0; i < 4; i += 1) tone(audio, at + i * 0.17, 450 - i * 35, 0.08, 0.025, 210); break;
    case 'grow': tone(audio, at, 330, 0.3, 0.04, 520, 'triangle'); tone(audio, at + 0.17, 550, 0.34, 0.045, 760); break;
    case 'slide': noise(audio, at, 0.42, 0.065, 850); tone(audio, at, 160, 0.35, 0.06, 95, 'triangle'); break;
    case 'magnet': tone(audio, at, 620, 0.17, 0.09, 460, 'triangle'); tone(audio, at + 0.06, 980, 0.29, 0.04, 760); break;
    case 'circuit': tone(audio, at, 480, 0.1, 0.08, 560, 'square'); tone(audio, at + 0.11, 740, 0.38, 0.065, 860); break;
    case 'light': tone(audio, at, 690, 0.11, 0.04, 820); tone(audio, at + 0.08, 1040, 0.23, 0.035, 1220); break;
    case 'success': [523, 659, 784].forEach((note, index) => tone(audio, at + index * 0.12, note, 0.42, 0.07)); break;
    case 'string': tone(audio, at, frequency, 0.8, 0.14, frequency * 0.985, 'triangle'); break;
  }
}

export function playVrSound(cue: VrSoundCue, frequency = 390) {
  if (typeof window === 'undefined' || !isVrSoundEnabled()) return;
  try {
    context ??= new AudioContext();
    const audio = context;
    if (audio.state === 'running') schedule(audio, cue, frequency);
    else {
      const requestedAt = performance.now();
      void audio.resume().then(() => {
        if (isVrSoundEnabled() && performance.now() - requestedAt < 1200) schedule(audio, cue, frequency);
      }).catch(() => {});
    }
  } catch { /* Keep the experiment playable without an audio device. */ }
}
