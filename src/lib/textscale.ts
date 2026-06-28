'use client';
export type TextScale = 'normal' | 'grande' | 'xl';

const MAP: Record<TextScale, string> = { normal: '100%', grande: '112.5%', xl: '125%' };
const KEY = 'textScale';

export function getScale(): TextScale {
  if (typeof window === 'undefined') return 'normal';
  const v = localStorage.getItem(KEY);
  return v === 'grande' || v === 'xl' ? v : 'normal';
}

export function applyScale(s: TextScale) {
  if (typeof document !== 'undefined') document.documentElement.style.fontSize = MAP[s];
}

export function setScale(s: TextScale) {
  try { localStorage.setItem(KEY, s); } catch { /* nada */ }
  applyScale(s);
}
