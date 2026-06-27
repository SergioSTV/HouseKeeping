'use client';
import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useHotel } from '@/providers/HotelProvider';
import { useRooms } from '@/hooks/useRooms';
import { useAverias } from '@/hooks/useAverias';
import { useCambios } from '@/hooks/useCambios';
import { useLlegadas } from '@/hooks/useLlegadas';
import { useObjetos } from '@/hooks/useObjetos';
import { useNotifications } from '@/providers/NotificationsProvider';
import { CambiosModal } from '@/components/CambiosModal';
import { LlegadasModal } from '@/components/LlegadasModal';
import { ObjetosModal } from '@/components/ObjetosModal';
import { RoomsListModal } from '@/components/RoomsListModal';

function Stat({ label, value, hint, onClick }: { label: string; value: string | number; hint?: string; onClick: () => void }) {
  return (
    <button onClick={onClick} className="rounded-xl border border-gray-100 bg-white p-4 text-left shadow-sm transition hover:shadow-md hover:-translate-y-0.5">
      <div className="text-sm text-gray-500">{label}</div>
      <div className="mt-1 text-3xl font-semibold text-hotel-primary">{value}</div>
      {hint && <div className="mt-0.5 text-xs text-gray-400">{hint}</div>}
    </button>
  );
}

function todayKey(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export default function DashboardPage() {
  const router = useRouter();
  const { hotelId } = useHotel();
  const { rooms } = useRooms(hotelId);
  const { averias } = useAverias(hotelId);
  const { cambios } = useCambios(hotelId);
  const { llegadas } = useLlegadas(hotelId);
  const { objetos } = useObjetos(hotelId);
  const { markSeen } = useNotifications();
  const [modal, setModal] = useState<string | null>(null);

  useEffect(() => { markSeen('cambios'); }, [markSeen]);

  const hoy = todayKey();
  const late14 = useMemo(() => rooms.filter((r) => r.checkout === 'late_14' && r.lateCheckoutDate === hoy), [rooms, hoy]);
  const late18 = useMemo(() => rooms.filter((r) => r.checkout === 'late_18' && r.lateCheckoutDate === hoy), [rooms, hoy]);
  const libres = useMemo(() => rooms.filter((r) => r.status === 'limpia' || r.status === 'sucia'), [rooms]);
  const vip = useMemo(() => rooms.filter((r) => r.vip), [rooms]);
  const lobby = useMemo(() => rooms.filter((r) => r.rush), [rooms]);

  const porPlanta: Record<number, number> = {};
  libres.forEach((r) => { porPlanta[r.floor] = (porPlanta[r.floor] ?? 0) + 1; });

  const objGuardados = objetos.filter((o) => o.estado === 'guardado').length;
  const fechaHoy = new Date().toLocaleDateString('es-ES', { day: '2-digit', month: 'long', year: 'numeric' });

  return (
    <div>
      <h1 className="mb-1 text-xl font-semibold">Resumen de hoy</h1>
      <p className="mb-4 text-sm text-gray-400">{fechaHoy}</p>
      <div className="mb-6 grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4">
        <Stat label="Late check out 14 h" value={late14.length} hint="solo de hoy" onClick={() => setModal('late14')} />
        <Stat label="Late check out 18 h" value={late18.length} hint="solo de hoy" onClick={() => setModal('late18')} />
        <Stat label="Habitaciones libres" value={libres.length} onClick={() => setModal('libres')} />
        <Stat label="VIP" value={vip.length} onClick={() => setModal('vip')} />
        <Stat label="Esperando en lobby" value={lobby.length} hint="rush" onClick={() => setModal('lobby')} />
        <Stat label="Llegadas extras" value={llegadas.length} onClick={() => setModal('llegadas')} />
        <Stat label="Cambios de habitación" value={cambios.length} onClick={() => setModal('cambios')} />
        <Stat label="Averías" value={averias.length} hint="se purga a las 00:00" onClick={() => router.push('/averias')} />
        <Stat label="Objetos perdidos" value={objGuardados} hint="guardados" onClick={() => setModal('objetos')} />
      </div>

      <h2 className="mb-2 font-medium">Libres por planta</h2>
      <div className="flex flex-wrap gap-2">
        {Object.entries(porPlanta).sort().map(([planta, n]) => (
          <span key={planta} className="rounded-lg bg-hotel-secondary px-3 py-1.5 text-sm font-medium text-hotel-primary">
            Planta {planta}: {n}
          </span>
        ))}
      </div>

      {modal === 'late14' && <RoomsListModal title="Late check out 14 h" rooms={late14} onClose={() => setModal(null)} />}
      {modal === 'late18' && <RoomsListModal title="Late check out 18 h" rooms={late18} onClose={() => setModal(null)} />}
      {modal === 'libres' && <RoomsListModal title="Habitaciones libres" rooms={libres} onClose={() => setModal(null)} />}
      {modal === 'vip' && <RoomsListModal title="Habitaciones VIP" rooms={vip} onClose={() => setModal(null)} />}
      {modal === 'lobby' && <RoomsListModal title="Esperando en lobby" rooms={lobby} onClose={() => setModal(null)} />}
      {modal === 'llegadas' && <LlegadasModal onClose={() => setModal(null)} />}
      {modal === 'cambios' && <CambiosModal onClose={() => setModal(null)} />}
      {modal === 'objetos' && <ObjetosModal onClose={() => setModal(null)} />}
    </div>
  );
}
