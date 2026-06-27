'use client';
import { useState } from 'react';
import { useAuth } from '@/providers/AuthProvider';
import { useHotel } from '@/providers/HotelProvider';
import { useLlegadas } from '@/hooks/useLlegadas';
import { addLlegadaExtra, removeLlegada } from '@/lib/actions';

export function LlegadasModal({ onClose }: { onClose: () => void }) {
  const { role, user, displayName } = useAuth();
  const { hotelId } = useHotel();
  const { llegadas } = useLlegadas(hotelId);
  const [personas, setPersonas] = useState('1');
  const [habitacion, setHabitacion] = useState('');
  const [entrada, setEntrada] = useState('');
  const [salida, setSalida] = useState('');
  const puedeCrear = role === 'recepcion' || role === 'admin';
  const puedePurgar = ['admin', 'recepcion', 'governanta', 'subgovernanta'].includes(role || '');

  async function vaciar() {
    if (!hotelId) return;
    if (!confirm('¿Vaciar todas las llegadas extras?')) return;
    for (const l of llegadas) await removeLlegada(hotelId, l.id);
  }

  async function crear() {
    if (!habitacion.trim() || !hotelId || !user) return;
    await addLlegadaExtra(hotelId, Number(personas) || 1, habitacion.trim(), entrada, salida, { uid: user.uid, name: displayName });
    setHabitacion(''); setEntrada(''); setSalida(''); setPersonas('1');
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-0 sm:items-center sm:p-4" onClick={onClose}>
      <div className="max-h-[88vh] w-full max-w-md overflow-auto rounded-t-2xl bg-white shadow-xl sm:rounded-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between border-b border-gray-100 px-5 py-3">
          <h3 className="font-semibold">Llegadas extras · {llegadas.length}</h3>
          <div className="flex items-center gap-3">
            {puedePurgar && llegadas.length > 0 && <button onClick={vaciar} className="text-sm text-red-600 hover:underline">Vaciar todas</button>}
            <button onClick={onClose} aria-label="Cerrar" className="text-xl leading-none text-gray-400">✕</button>
          </div>
        </div>

        {puedeCrear && (
          <div className="border-b border-gray-100 px-5 py-3">
            <div className="flex flex-wrap items-end gap-2">
              <div>
                <label className="mb-1 block text-xs text-gray-500">Hab.</label>
                <input value={habitacion} onChange={(e) => setHabitacion(e.target.value)} placeholder="110"
                  className="w-16 rounded-lg border border-gray-300 px-2 py-1.5 text-sm outline-none focus:border-hotel-primary" />
              </div>
              <div>
                <label className="mb-1 block text-xs text-gray-500">Pers.</label>
                <input value={personas} onChange={(e) => setPersonas(e.target.value)} type="number" min="1"
                  className="w-14 rounded-lg border border-gray-300 px-2 py-1.5 text-sm outline-none focus:border-hotel-primary" />
              </div>
              <div>
                <label className="mb-1 block text-xs text-gray-500">Entrada</label>
                <input value={entrada} onChange={(e) => setEntrada(e.target.value)} type="date"
                  className="rounded-lg border border-gray-300 px-2 py-1.5 text-sm outline-none focus:border-hotel-primary" />
              </div>
              <div>
                <label className="mb-1 block text-xs text-gray-500">Salida</label>
                <input value={salida} onChange={(e) => setSalida(e.target.value)} type="date"
                  className="rounded-lg border border-gray-300 px-2 py-1.5 text-sm outline-none focus:border-hotel-primary" />
              </div>
              <button onClick={crear} className="rounded-lg bg-hotel-primary px-3 py-1.5 text-sm font-medium text-white">Añadir</button>
            </div>
          </div>
        )}

        <div className="px-5 py-3">
          {llegadas.length === 0 && <p className="py-6 text-center text-sm text-gray-400">Sin llegadas extras.</p>}
          <ul className="space-y-2">
            {llegadas.map((l) => (
              <li key={l.id} className="flex items-center justify-between rounded-lg border border-gray-100 bg-gray-50 px-3 py-2">
                <div>
                  <div className="font-semibold">Hab. {l.habitacion} · {l.personas} pers.</div>
                  <div className="text-xs text-gray-500">{l.fechaEntrada || '—'} → {l.fechaSalida || '—'}</div>
                </div>
                {puedePurgar && (
                  <button onClick={() => removeLlegada(hotelId!, l.id)} className="text-xs text-red-600 hover:underline">Quitar</button>
                )}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
