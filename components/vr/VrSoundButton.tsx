'use client';

import { useSyncExternalStore } from 'react';
import { Volume2, VolumeX } from 'lucide-react';
import { isVrSoundEnabled, playVrSound, setVrSoundEnabled, subscribeVrSound } from '@/lib/vrAudio';

export default function VrSoundButton() {
  const enabled = useSyncExternalStore(subscribeVrSound, isVrSoundEnabled, () => true);

  function toggle() {
    const next = !enabled;
    setVrSoundEnabled(next);
    if (next) playVrSound('start');
  }

  return <button type="button" className="vr-sound-toggle" aria-label={enabled ? '소리 끄기' : '소리 켜기'} aria-pressed={enabled} title={enabled ? '소리 끄기' : '소리 켜기'} onClick={toggle}>
    {enabled ? <Volume2 size={19} /> : <VolumeX size={19} />}
  </button>;
}
