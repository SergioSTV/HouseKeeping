'use client';
/* eslint-disable @typescript-eslint/no-explicit-any */
let ctx: AudioContext | null = null;

function getCtx(): AudioContext | null {
  try {
    const AC = (window.AudioContext || (window as any).webkitAudioContext);
    if (!AC) return null;
    ctx = ctx || new AC();
    return ctx;
  } catch { return null; }
}

export function unlockAudio() {
  const c = getCtx();
  if (c && c.state === 'suspended') c.resume().catch(() => {});
}

export function playBeep() {
  const c = getCtx();
  if (!c) return;
  if (c.state === 'suspended') c.resume().catch(() => {});
  try {
    const o = c.createOscillator();
    const g = c.createGain();
    o.connect(g); g.connect(c.destination);
    o.type = 'sine';
    o.frequency.setValueAtTime(880, c.currentTime);
    o.frequency.setValueAtTime(1180, c.currentTime + 0.12);
    g.gain.setValueAtTime(0.0001, c.currentTime);
    g.gain.exponentialRampToValueAtTime(0.2, c.currentTime + 0.02);
    g.gain.exponentialRampToValueAtTime(0.0001, c.currentTime + 0.28);
    o.start();
    o.stop(c.currentTime + 0.3);
  } catch { /* nada */ }
}

// El navegador no deja sonar hasta la primera interaccion: la "desbloqueamos" aqui.
if (typeof window !== 'undefined') {
  const unlock = () => {
    unlockAudio();
    window.removeEventListener('pointerdown', unlock);
    window.removeEventListener('keydown', unlock);
    window.removeEventListener('touchstart', unlock);
  };
  window.addEventListener('pointerdown', unlock, { once: false });
  window.addEventListener('keydown', unlock, { once: false });
  window.addEventListener('touchstart', unlock, { once: false });
}
