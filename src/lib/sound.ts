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
    // Cadena: notas -> maestra (empuja fuerte) -> limitador (aplana los picos)
    // -> ganancia de recuperación (sube TODO el nivel sin distorsionar) -> salida.
    const master = c.createGain();
    master.gain.value = 1.8; // empuja la señal contra el limitador

    const lim = c.createDynamicsCompressor();
    lim.threshold.value = -8;
    lim.knee.value = 0;
    lim.ratio.value = 20;
    lim.attack.value = 0.002;
    lim.release.value = 0.1;

    const makeup = c.createGain();
    makeup.gain.value = 2.4; // recupera volumen tras limitar -> suena más fuerte

    master.connect(lim);
    lim.connect(makeup);
    makeup.connect(c.destination);

    // Tonos en la zona donde el oído y los altavoces de móvil rinden más (~2-3 kHz).
    // Patrón "bip-bip" repetido 3 veces para que se note de verdad.
    const V = 0.95;
    const A = 2640;
    const B = 1980;
    let t = 0;
    for (let i = 0; i < 3; i++) {
      nota(c, master, A, t, 0.15, V);
      nota(c, master, B, t + 0.13, 0.20, V);
      t += 0.40;
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
