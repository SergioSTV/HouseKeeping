'use client';
import { useState } from 'react';
import { useAuth } from '@/providers/AuthProvider';
import { useHotel } from '@/providers/HotelProvider';
import { useCambios } from '@/hooks/useCambios';
import { addCambioHabitacion } from '@/lib/actions';
import { CHECKOUT_PERMISSIONS } from '@/lib/roles';

/* eslint-disable @typescript-eslint/no-explicit-any */
function ts(v: any): string { return v?.toDate ? v.toDate().toLocaleString('es-ES') : '—'; }

export function CambiosModal({ onClose }: { onClose: () => void }) {
  const { role, user, displayName } = useAuth();
  const { hotelId } = useHotel();
  const { cambios } = useCambios(hotelId);
  const [de, setDe] = useState('');
  const [a, setA] = useState('');
  const [motivo, setMotivo] = useState('');

  // Solo recepción y admin pueden registrar cambios.
  const puedeCrear = role === 'recepcion' || role === 'admin';

  async function crear() {
    if (!de.trim() || !a.trim() || !hotelId || !user) return;
    await addCambioHabitacion(hotelId, de.trim(), a.trim(), motivo.trim(), { uid: user.uid, name: displayName });
    setDe(''); setA(''); setMotivo('');
  }

  function exportar() {
    const head = 'De,A,Motivo,Quien,Hora\n';
    const body = cambios.map((c) => `${c.de},${c.a},"${c.motivo || ''}",${c.creadoPor?.name || ''},${ts((c as any).createdAt)}`).join('\n');
    const blob = new Blob([head + body], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url; link.download = `cambios_${new Date().toISOString().slice(0, 10)}.csv`; link.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-0 sm:items-center sm:p-4" onClick={onClose}>
      <div className="max-h-[88vh] w-full max-w-md overflow-auto rounded-t-2xl bg-white shadow-xl sm:rounded-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between border-b border-gray-100 px-5 py-3">
          <h3 className="font-semibold">Cambios de habitación</h3>
          <div className="flex items-center gap-3">
            <button onClick={exportar} className="text-sm text-hotel-primary hover:underline">Exportar</button>
            <button onClick={onClose} aria-label="Cerrar" className="text-xl leading-none text-gray-400">✕</button>
          </div>
        </div>

        {puedeCrear && (
          <div className="border-b border-gray-100 px-5 py-3">
            <div className="flex items-end gap-2">
              <div>
                <label className="mb-1 block text-xs text-gray-500">De</label>
                <input value={de} onChange={(e) => setDe(e.target.value)} placeholder="415"
                  className="w-16 rounded-lg border border-gray-300 px-2 py-1.5 text-sm outline-none focus:border-hotel-primary" />
              </div>
              <span className="pb-2 text-gray-400">→</span>
              <div>
                <label className="mb-1 block text-xs text-gray-500">A</label>
                <input value={a} onChange={(e) => setA(e.target.value)} placeholder="110"
                  className="w-16 rounded-lg border border-gray-300 px-2 py-1.5 text-sm outline-none focus:border-hotel-primary" />
              </div>
              <input value={motivo} onChange={(e) => setMotivo(e.target.value)} placeholder="Motivo (opcional)"
                className="flex-1 rounded-lg border border-gray-300 px-2 py-1.5 text-sm outline-none focus:border-hotel-primary" />
              <button onClick={crear} className="rounded-lg bg-hotel-primary px-3 py-1.5 text-sm font-medium text-white">Añadir</button>
            </div>
          </div>
        )}

        <div className="px-5 py-3">
          {cambios.length === 0 && <p className="py-6 text-center text-sm text-gray-400">Sin cambios hoy.</p>}
          <ul className="space-y-2">
            {cambios.map((c) => (
              <li key={c.id} className="flex items-center justify-between rounded-lg border border-gray-100 bg-gray-50 px-3 py-2">
                <div>
                  <div className="text-base font-semibold">
                    {c.de} <span className="text-gray-400">→</span> {c.a}
                  </div>
                  {c.motivo && <div className="text-xs text-gray-500">{c.motivo}</div>}
                </div>
                <div className="text-right text-xs text-gray-400">
                  <div>{c.creadoPor?.name}</div>
                  <div>{ts((c as any).createdAt)}</div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
