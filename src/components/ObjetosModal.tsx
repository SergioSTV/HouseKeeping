'use client';
import { useState } from 'react';
import { useAuth } from '@/providers/AuthProvider';
import { useHotel } from '@/providers/HotelProvider';
import { useObjetos } from '@/hooks/useObjetos';
import { addObjeto, setObjetoEstado, removeObjeto } from '@/lib/actions';

/* eslint-disable @typescript-eslint/no-explicit-any */
function ts(v: any): string { return v?.toDate ? v.toDate().toLocaleDateString('es-ES') : '—'; }

export function ObjetosModal({ onClose }: { onClose: () => void }) {
  const { user, displayName } = useAuth();
  const { hotelId } = useHotel();
  const { objetos } = useObjetos(hotelId);
  const [descripcion, setDescripcion] = useState('');
  const [lugar, setLugar] = useState('');

  async function crear() {
    if (!descripcion.trim() || !hotelId || !user) return;
    await addObjeto(hotelId, descripcion.trim(), lugar.trim(), { uid: user.uid, name: displayName });
    setDescripcion(''); setLugar('');
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-0 sm:items-center sm:p-4" onClick={onClose}>
      <div className="max-h-[88vh] w-full max-w-md overflow-auto rounded-t-2xl bg-white shadow-xl sm:rounded-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between border-b border-gray-100 px-5 py-3">
          <h3 className="font-semibold">Objetos perdidos · {objetos.length}</h3>
          <button onClick={onClose} aria-label="Cerrar" className="text-xl leading-none text-gray-400">✕</button>
        </div>

        <div className="border-b border-gray-100 px-5 py-3">
          <div className="flex flex-wrap items-end gap-2">
            <input value={descripcion} onChange={(e) => setDescripcion(e.target.value)} placeholder="Objeto (ej. cargador negro)"
              className="min-w-[10rem] flex-1 rounded-lg border border-gray-300 px-2 py-1.5 text-sm outline-none focus:border-hotel-primary" />
            <input value={lugar} onChange={(e) => setLugar(e.target.value)} placeholder="Lugar (ej. hab. 305)"
              className="w-32 rounded-lg border border-gray-300 px-2 py-1.5 text-sm outline-none focus:border-hotel-primary" />
            <button onClick={crear} className="rounded-lg bg-hotel-primary px-3 py-1.5 text-sm font-medium text-white">Añadir</button>
          </div>
        </div>

        <div className="px-5 py-3">
          {objetos.length === 0 && <p className="py-6 text-center text-sm text-gray-400">Sin objetos.</p>}
          <ul className="space-y-2">
            {objetos.map((o) => (
              <li key={o.id} className="flex items-center justify-between rounded-lg border border-gray-100 bg-gray-50 px-3 py-2">
                <div className="min-w-0">
                  <div className="font-medium">{o.descripcion}</div>
                  <div className="text-xs text-gray-500">{o.lugar || '—'} · {ts((o as any).createdAt)}</div>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <button
                    onClick={() => setObjetoEstado(hotelId!, o.id, o.estado === 'guardado' ? 'entregado' : 'guardado')}
                    className={`rounded px-2 py-0.5 text-xs font-medium ${o.estado === 'entregado' ? 'bg-green-100 text-green-800' : 'bg-amber-100 text-amber-800'}`}
                  >
                    {o.estado === 'entregado' ? 'Entregado' : 'Guardado'}
                  </button>
                  <button onClick={() => removeObjeto(hotelId!, o.id)} className="text-xs text-red-600 hover:underline">Quitar</button>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
