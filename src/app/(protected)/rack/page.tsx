'use client';
import { useMemo, useState } from 'react';
import { useHotel } from '@/providers/HotelProvider';
import { useAuth } from '@/providers/AuthProvider';
import { markRoomsClean } from '@/lib/actions';
import { effectiveCheckout } from '@/lib/checkout';
import { useRooms } from '@/hooks/useRooms';
import { RoomCard } from '@/components/RoomCard';
import { STATUS_LABELS } from '@/lib/roles';
import type { RoomStatus } from '@/lib/types';

type Filtro = 'todas' | 'salidas' | 'averias' | 'no_salen' | 'late' | 'limpias' | 'sucias' | 'bloqueadas' | 'lobby';

export default function RackPage() {
  const { hotelId, loading: loadingHotel } = useHotel();
  const { rooms, loading } = useRooms(hotelId);
  const [planta, setPlanta] = useState<number | 'todas'>('todas');
  const [filtro, setFiltro] = useState<Filtro>('todas');
  const { role, user, displayName } = useAuth();
  const puedeMarcar = ['admin', 'recepcion', 'governanta', 'subgovernanta'].includes(role || '');

  async function marcarLimpias() {
    if (!hotelId || !user) return;
    const objetivo = planta === 'todas' ? rooms : rooms.filter((r) => r.floor === planta);
    const ambito = planta === 'todas' ? 'todo el hotel' : `la planta ${planta}`;
    if (!confirm(`¿Marcar limpias las habitaciones pendientes de ${ambito}? (no toca No molestar, Cliente no sale ni Avería grave)`)) return;
    const n = await markRoomsClean(hotelId, objetivo, { uid: user.uid, name: displayName });
    alert(n === 0 ? 'No había habitaciones pendientes de limpiar.' : `${n} habitaciones marcadas como limpias.`);
  }

  const plantas = useMemo(
    () => Array.from(new Set(rooms.map((r) => r.floor))).sort((a, b) => a - b),
    [rooms],
  );

  const visibles = rooms.filter((r) => {
    if (planta !== 'todas' && r.floor !== planta) return false;
    switch (filtro) {
      case 'salidas': return effectiveCheckout(r) === 'ya_checkout' || effectiveCheckout(r) === 'checkout_anticipado';
      case 'averias': return r.status === 'averia_grave';
      case 'no_salen': return r.status === 'cliente_no_sale';
      case 'late': return effectiveCheckout(r) === 'late_14' || effectiveCheckout(r) === 'late_18';
      case 'limpias': return r.status === 'limpia';
      case 'sucias': return r.status === 'sucia' || r.status === 'sucia_guardia';
      case 'bloqueadas': return r.blocked || r.status === 'averia_grave';
      case 'lobby': return !!r.rush;
      default: return true;
    }
  });

  if (loadingHotel || loading) return <p className="text-sm text-gray-500">Cargando rack…</p>;

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <select value={planta} onChange={(e) => setPlanta(e.target.value === 'todas' ? 'todas' : Number(e.target.value))}
          className="rounded border border-gray-300 px-2 py-1.5 text-sm">
          <option value="todas">Todas las plantas</option>
          {plantas.map((p) => <option key={p} value={p}>Planta {p}</option>)}
        </select>
        <select value={filtro} onChange={(e) => setFiltro(e.target.value as Filtro)}
          className="rounded border border-gray-300 px-2 py-1.5 text-sm">
          <option value="todas">Todas</option>
          <option value="salidas">Han salido</option>
          <option value="averias">Con averias</option>
          <option value="no_salen">No han salido</option>
          <option value="late">Late check out</option>
          <option value="limpias">Limpias</option>
          <option value="sucias">Sucias</option>
          <option value="bloqueadas">Bloqueadas</option>
          <option value="lobby">Esperando en lobby</option>
        </select>
        <span className="text-sm text-gray-500">{visibles.length} habitaciones</span>
        {puedeMarcar && (
          <button
            onClick={marcarLimpias}
            className="ml-auto rounded-lg bg-hotel-primary px-3 py-1.5 text-sm font-medium text-white transition hover:opacity-90"
          >
            Marcar limpias {planta === 'todas' ? '(todo el hotel)' : `(planta ${planta})`}
          </button>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
        {visibles.map((r) => <RoomCard key={r.id} room={r} />)}
      </div>
    </div>
  );
}
