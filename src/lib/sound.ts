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

// Una nota con cuerpo: triangle (fundamental) + square al mismo tono (armónicos).
// Eso hace que "corte" mucho mejor en los altavoces pequeños de móvil.
function nota(c: AudioContext, dest: AudioNode, f: number, t: number, d: number, vol: number) {
  const t0 = c.currentTime + t;
  const g = c.createGain();
  g.connect(dest);
  g.gain.setValueAtTime(0.0001, t0);
  g.gain.exponentialRampToValueAtTime(vol, t0 + 0.006);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + d);

  const o1 = c.createOscillator();
  o1.type = 'triangle';
  o1.frequency.value = f;
  o1.connect(g);
  o1.start(t0); o1.stop(t0 + d + 0.05);

  const g2 = c.createGain();
  g2.gain.value = 0.4;
  g2.connect(g);
  const o2 = c.createOscillator();
  o2.type = 'square';
  o2.frequency.value = f;
  o2.connect(g2);
  o2.start(t0); o2.stop(t0 + d + 0.05);
}

export function playBeep() {
  const c = getCtx();
  if (!c) return;
  if (c.state === 'suspended') c.resume().catch(() => {});
  try {
    // Cadena: notas -> ganancia maestra -> limitador (sube el volumen sin
    // distorsionar recortando solo los picos) -> salida.
    const master = c.createGain();
    master.gain.value = 1.0;
    const lim = c.createDynamicsCompressor();
    lim.threshold.value = -2;
    lim.knee.value = 0;
    lim.ratio.value = 20;
    lim.attack.value = 0.002;
    lim.release.value = 0.12;
    master.connect(lim);
    lim.connect(c.destination);

    // "Ding-dong" claro y fuerte, repetido una vez para llamar la atención.
    const V = 0.85;
    nota(c, master, 1175, 0.00, 0.22, V); // ding
    nota(c, master,  880, 0.17, 0.42, V); // dong
    nota(c, master, 1175, 0.64, 0.22, V); // ding (repetición)
    nota(c, master,  880, 0.81, 0.42, V); // dong
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
