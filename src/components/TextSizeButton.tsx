'use client';
import { useEffect, useState } from 'react';

const MAP = { normal: '100%', grande: '112.5%', xl: '125%' } as const;
type Scale = keyof typeof MAP;
const ORDER: Scale[] = ['normal', 'grande', 'xl'];
const LABEL: Record<Scale, string> = { normal: 'A', grande: 'A+', xl: 'A++' };

export function TextSizeButton({ className = '' }: { className?: string }) {
  const [scale, setScale] = useState<Scale>('normal');

  useEffect(() => {
    try {
      const s = localStorage.getItem('textScale') as Scale | null;
      if (s && MAP[s]) setScale(s);
    } catch { /* nada */ }
  }, []);

  function cycle() {
    const next = ORDER[(ORDER.indexOf(scale) + 1) % ORDER.length];
    setScale(next);
    try { localStorage.setItem('textScale', next); } catch { /* nada */ }
    document.documentElement.style.fontSize = MAP[next];
  }

  return (
    <button
      onClick={cycle}
      title="Tamaño del texto"
      aria-label={`Tamaño del texto: ${scale}. Pulsa para cambiar.`}
      className={className}
    >
      {LABEL[scale]}
    </button>
  );
}
