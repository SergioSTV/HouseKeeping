'use client';
import { useState } from 'react';
import { useAuth } from '@/providers/AuthProvider';
import { useHotel } from '@/providers/HotelProvider';
import { usePedidos } from '@/hooks/usePedidos';
import { addPedido, setPedidoHecho, removePedido } from '@/lib/actions';

/* eslint-disable @typescript-eslint/no-explicit-any */
function ts(v: any): string { return v?.toDate ? v.toDate().toLocaleString('es-ES') : '—'; }

export function PedidosModal({ onClose }: { onClose: () => void }) {
  const { role, user, displayName } = useAuth();
  const { hotelId } = useHotel();
  const { pedidos } = usePedidos(hotelId);
  const [habitacion, setHabitacion] = useState('');
  const [descripcion, setDescripcion] = useState('');

  const isStaff = ['admin', 'governanta', 'subgovernanta', 'recepcion'].includes(role || '');
  const puedeCrear = isStaff;
  const puedeTildar = isStaff || role === 'camarera_guardia';

  async function crear() {
    if (!habitacion.trim() || !descripcion.trim() || !hotelId || !user) return;
    await addPedido(hotelId, habitacion.trim(), descripcion.trim(), { uid: user.uid, name: displayName });
    setHabitacion(''); setDescripcion('');
  }

  function exportar() {
    const head = 'Habitacion,Pedido,Estado,Quien,Hora\n';
    const body = pedidos.map((p) => `${p.habitacion},"${p.descripcion}",${p.estado},${p.creadoPor?.name || ''},${ts((p as any).createdAt)}`).join('\n');
    const blob = new Blob([head + body], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url; link.download = `pedidos_${new Date().toISOString().slice(0, 10)}.csv`; link.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-0 sm:items-center sm:p-4" onClick={onClose}>
      <div className="max-h-[88vh] w-full max-w-md overflow-auto rounded-t-2xl bg-white shadow-xl sm:rounded-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between border-b border-gray-100 px-5 py-3">
          <h3 className="font-semibold">Pedidos de habitación · {pedidos.filter((p) => p.estado === 'pendiente').length}</h3>
          <div className="flex items-center gap-3">
            <button onClick={exportar} className="text-sm text-hotel-primary hover:underline">Exportar</button>
            <button onClick={onClose} aria-label="Cerrar" className="text-xl leading-none text-gray-400">✕</button>
          </div>
        </div>

        {puedeCrear && (
          <div className="border-b border-gray-100 px-5 py-3">
            <div className="flex flex-wrap items-end gap-2">
              <div>
                <label className="mb-1 block text-xs text-gray-500">Hab.</label>
                <input value={habitacion} onChange={(e) => setHabitacion(e.target.value)} placeholder="305"
                  className="w-16 rounded-lg border border-gray-300 px-2 py-1.5 text-sm outline-none focus:border-hotel-primary" />
              </div>
              <input value={descripcion} onChange={(e) => setDescripcion(e.target.value)} placeholder="Pedido (ej. 2 toallas, cambio de sábanas)"
                className="min-w-[10rem] flex-1 rounded-lg border border-gray-300 px-2 py-1.5 text-sm outline-none focus:border-hotel-primary" />
              <button onClick={crear} className="rounded-lg bg-hotel-primary px-3 py-1.5 text-sm font-medium text-white">Añadir</button>
            </div>
          </div>
        )}

        <div className="px-5 py-3">
          {pedidos.length === 0 && <p className="py-6 text-center text-sm text-gray-400">Sin pedidos.</p>}
          <ul className="space-y-2">
            {pedidos.map((p) => (
              <li key={p.id} className={`flex items-center gap-3 rounded-lg border px-3 py-2 ${p.estado === 'hecho' ? 'border-green-100 bg-green-50' : 'border-gray-100 bg-gray-50'}`}>
                {puedeTildar && (
                  <button
                    onClick={() => setPedidoHecho(hotelId!, p.id, p.estado !== 'hecho')}
                    aria-label="Marcar hecho"
                    className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-md border ${p.estado === 'hecho' ? 'border-green-500 bg-green-500 text-white' : 'border-gray-300 text-transparent'}`}
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M20 6 9 17l-5-5"/></svg>
                  </button>
                )}
                <div className="min-w-0 flex-1">
                  <div className={`font-medium ${p.estado === 'hecho' ? 'text-gray-400 line-through' : ''}`}>Hab. {p.habitacion} · {p.descripcion}</div>
                  <div className="text-xs text-gray-400">{p.creadoPor?.name} · {ts((p as any).createdAt)}</div>
                </div>
                {isStaff && (
                  <button onClick={() => removePedido(hotelId!, p.id)} className="shrink-0 text-xs text-red-600 hover:underline">Quitar</button>
                )}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
