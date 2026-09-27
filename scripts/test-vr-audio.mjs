import assert from 'node:assert/strict';
import test from 'node:test';
import { isVrSoundEnabled, playVrSound, setVrSoundEnabled } from '../lib/vrAudio.ts';

const started = [];
const parameter = () => ({ setValueAtTime() {}, exponentialRampToValueAtTime() {}, linearRampToValueAtTime() {} });
const node = () => ({ connect() { return this; }, start() { started.push('start'); }, stop() {}, frequency: parameter(), gain: parameter() });

globalThis.window = {};
globalThis.localStorage = { getItem: () => null, setItem() {} };
globalThis.AudioContext = class {
  state = 'running';
  currentTime = 1;
  sampleRate = 8000;
  destination = {};
  createOscillator() { return node(); }
  createGain() { return node(); }
  createBiquadFilter() { return { ...node(), frequency: parameter() }; }
  createBuffer() { return { sampleRate: this.sampleRate, getChannelData: () => new Float32Array(this.sampleRate) }; }
  createBufferSource() { return node(); }
  suspend() { return Promise.resolve(); }
};

test('each VR cue creates an audible source and mute blocks new sources', () => {
  const cues = ['select', 'start', 'place', 'water', 'bubble', 'pour', 'stir', 'fizz', 'rain', 'grow', 'slide', 'magnet', 'circuit', 'light', 'success', 'string'];
  assert.equal(isVrSoundEnabled(), true);
  for (const cue of cues) {
    const before = started.length;
    playVrSound(cue, 540);
    assert.ok(started.length > before, `${cue} schedules a sound`);
  }
  setVrSoundEnabled(false);
  const before = started.length;
  playVrSound('string', 260);
  assert.equal(started.length, before);
  setVrSoundEnabled(true);
  playVrSound('string', 260);
  assert.ok(started.length > before);
});
