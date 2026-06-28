'use client';
import { useEffect, useState } from 'react';
import { getScale, setScale, type TextScale } from '@/lib/textscale';

const OPTS: { key: TextScale; cls: string }[] = [
  { key: 'normal', cls: 'text-[11px]' },
  { key: 'grande', cls: 'text-[13px]' },
  { key: 'xl', cls: 'text-[15px]' },
];

export function TextSizeControl() {
  const [scale, setScaleState] = useState<TextScale>('normal');
  useEffect(() => { setScaleState(getScale()); }, []);
  function pick(s: TextScale) { setScale(s); setScaleState(s); }

  return (
    <div className="flex items-center rounded-full bg-white/15 p-0.5" role="group" aria-label="Tamaño de letra">
      {OPTS.map((o) => (
        <button
          key={o.key}
          onClick={() => pick(o.key)}
          aria-label={`Tamaño de letra ${o.key === 'xl' ? 'muy grande' : o.key}`}
          aria-pressed={scale === o.key}
          className={`flex h-6 w-6 items-center justify-center rounded-full font-bold leading-none ${o.cls} ${scale === o.key ? 'bg-white text-hotel-primary' : 'text-white/85'}`}
        >
          A
        </button>
      ))}
    </div>
  );
}
