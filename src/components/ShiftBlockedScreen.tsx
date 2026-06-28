'use client';
import { HORARIO_CAMARERA_TXT } from '@/lib/shift';

export function ShiftBlockedScreen({ onLogout }: { onLogout: () => void }) {
  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <div className="w-full max-w-sm rounded-2xl border border-gray-200 bg-white p-7 text-center shadow-sm">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-hotel-secondary text-hotel-primary">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>
        </div>
        <h1 className="mb-1 text-lg font-semibold">Acceso limitado a su horario laboral</h1>
        <p className="mb-1 text-sm text-gray-600">El acceso para camareras de piso está disponible de <span className="font-medium">{HORARIO_CAMARERA_TXT}</span>.</p>
        <p className="mb-5 text-sm text-gray-400">Vuelve a entrar dentro de tu turno.</p>
        <button onClick={onLogout} className="w-full rounded-lg bg-hotel-primary px-3 py-2.5 text-sm font-medium text-white transition hover:opacity-90">
          Salir
        </button>
      </div>
    </div>
  );
}
