'use client';
import { useState } from 'react';
import { useAuth } from '@/providers/AuthProvider';
import { activarAvisos, type PushResult } from '@/lib/push';

const MSG: Record<PushResult, string> = {
  ok: 'Avisos activados en este dispositivo.',
  denegado: 'Has denegado el permiso. Actívalo en los ajustes de notificaciones del navegador.',
  'no-soportado': 'Este navegador no admite avisos push. En iPhone, añade la app a la pantalla de inicio y ábrela desde ahí.',
  'sin-clave': 'Falta configurar la clave de notificaciones (VAPID) en el proyecto.',
  error: 'No se pudieron activar los avisos. Inténtalo de nuevo.',
};

export function PushButton() {
  const { user } = useAuth();
  const [estado, setEstado] = useState<'idle' | 'cargando' | PushResult>('idle');

  async function onClick() {
    if (!user) return;
    setEstado('cargando');
    const r = await activarAvisos(user.uid);
    setEstado(r);
    if (r === 'ok') setTimeout(() => setEstado('idle'), 3000);
    else window.alert(MSG[r]);
  }

  const ok = estado === 'ok';
  return (
    <button
      onClick={onClick}
      title="Activar avisos en este dispositivo"
      className="flex items-center gap-1 rounded-full bg-white/15 px-2.5 py-1.5 text-sm transition hover:bg-white/25"
    >
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" /><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" /></svg>
      <span className="hidden sm:inline">{estado === 'cargando' ? '…' : ok ? 'Avisos ✓' : 'Activar avisos'}</span>
    </button>
  );
}
