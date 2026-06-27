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
    // Dos notas suaves tipo "ding-dong" (un aviso amable, no un pitido).
    const notas = [
      { f: 988, t: 0,    d: 0.18 }, // Si5
      { f: 740, t: 0.14, d: 0.32 }, // Fa#5
    ];
    for (const n of notas) {
      const o = c.createOscillator();
      const g = c.createGain();
      o.connect(g); g.connect(c.destination);
      o.type = 'triangle';
      o.frequency.value = n.f;
      const t0 = c.currentTime + n.t;
      g.gain.setValueAtTime(0.0001, t0);
      g.gain.exponentialRampToValueAtTime(0.22, t0 + 0.03);
      g.gain.exponentialRampToValueAtTime(0.0001, t0 + n.d);
      o.start(t0);
      o.stop(t0 + n.d + 0.02);
    }
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
