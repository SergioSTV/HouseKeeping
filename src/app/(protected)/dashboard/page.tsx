'use client';
import { useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { useHotel } from '@/providers/HotelProvider';
import { useAuth } from '@/providers/AuthProvider';
import { useRooms } from '@/hooks/useRooms';
import { useAverias } from '@/hooks/useAverias';
import { useCambios } from '@/hooks/useCambios';
import { useLlegadas } from '@/hooks/useLlegadas';
import { useObjetos } from '@/hooks/useObjetos';
import { usePedidos } from '@/hooks/usePedidos';
import { useNotifications } from '@/providers/NotificationsProvider';
import { CambiosModal } from '@/components/CambiosModal';
import { LlegadasModal } from '@/components/LlegadasModal';
import { ObjetosModal } from '@/components/ObjetosModal';
import { PedidosModal } from '@/components/PedidosModal';
import { RoomsListModal } from '@/components/RoomsListModal';

function Stat({ label, value, hint, accent, icon, onClick }: { label: string; value: string | number; hint?: string; accent: string; icon: ReactNode; onClick: () => void }) {
  return (
    <button onClick={onClick} className="group relative overflow-hidden rounded-2xl p-4 text-left shadow-sm ring-1 ring-black/5 transition duration-200 hover:-translate-y-0.5 hover:shadow-md" style={{ backgroundColor: `${accent}1F` }}>
      <span className="absolute inset-x-0 top-0 h-1" style={{ backgroundColor: accent }} aria-hidden="true" />
      <div className="mb-2.5 flex items-center gap-2.5">
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white shadow-sm ring-1 ring-black/5" style={{ color: accent }}>{icon}</span>
        <span className="text-sm font-bold leading-tight text-gray-900">{label}</span>
      </div>
      <div className="flex items-end justify-between gap-2">
        <span className="text-3xl font-bold tracking-tight text-gray-900">{value}</span>
        {hint && <span className="pb-1 text-[11px] text-gray-500">{hint}</span>}
      </div>
    </button>
  );
}

const SV = (p: ReactNode) => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{p}</svg>
);
const IC = {
  clock: SV(<><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></>),
  hourglass: SV(<><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></>),
  swap: SV(<><path d="m16 3 4 4-4 4" /><path d="M20 7H4" /><path d="m8 21-4-4 4-4" /><path d="M4 17h16" /></>),
  box: SV(<><path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z" /><path d="m3.3 7 8.7 5 8.7-5" /><path d="M12 22V12" /></>),
  check: SV(<><circle cx="12" cy="12" r="9" /><path d="m8.5 12 2.5 2.5 4.5-4.5" /></>),
  euro: SV(<><path d="M15 5.5A6.5 6.5 0 1 0 15 18.5" /><path d="M4 10.5h9" /><path d="M4 14h8" /></>),
  star: (<svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" /></svg>),
  people: SV(<><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M22 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></>),
  arrival: SV(<><path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" /><polyline points="10 17 15 12 10 7" /><line x1="15" y1="12" x2="3" y2="12" /></>),
  alert: SV(<><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" /><line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" /></>),
  archive: SV(<><rect width="20" height="5" x="2" y="3" rx="1" /><path d="M4 8v11a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8" /><path d="M10 12h4" /></>),
};

function todayKey(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export default function DashboardPage() {
  const router = useRouter();
  const { role } = useAuth();
  const { hotelId } = useHotel();
  const { rooms } = useRooms(hotelId);
  const { averias } = useAverias(hotelId);
  const { cambios } = useCambios(hotelId);
  const { llegadas } = useLlegadas(hotelId);
  const { objetos } = useObjetos(hotelId);
  const { pedidos } = usePedidos(hotelId);
  const { markSeen } = useNotifications();
  const [modal, setModal] = useState<string | null>(null);

  useEffect(() => { markSeen('cambios'); }, [markSeen]);

  const isStaff = ['admin', 'governanta', 'subgovernanta', 'recepcion'].includes(role || '');

  const hoy = todayKey();
  const late14 = useMemo(() => rooms.filter((r) => r.checkout === 'late_14' && r.lateCheckoutDate === hoy), [rooms, hoy]);
  const late18 = useMemo(() => rooms.filter((r) => r.checkout === 'late_18' && r.lateCheckoutDate === hoy), [rooms, hoy]);
  const vip = useMemo(() => rooms.filter((r) => r.vip), [rooms]);
  const lobby = useMemo(() => rooms.filter((r) => r.rush), [rooms]);
  const limpias = useMemo(() => rooms.filter((r) => r.status === 'limpia'), [rooms]);
  const conDeuda = useMemo(() => rooms.filter((r) => r.deuda), [rooms]);

  const pctLimpias = rooms.length ? Math.round((limpias.length / rooms.length) * 100) : 0;
  const pedidosPend = pedidos.filter((p) => p.estado === 'pendiente').length;

  // Limpias por planta: limpias / total
  const porPlanta: Record<number, { limpias: number; total: number }> = {};
  rooms.forEach((r) => {
    porPlanta[r.floor] = porPlanta[r.floor] || { limpias: 0, total: 0 };
    porPlanta[r.floor].total++;
    if (r.status === 'limpia') porPlanta[r.floor].limpias++;
  });

  const fechaHoy = new Date().toLocaleDateString('es-ES', { day: '2-digit', month: 'long', year: 'numeric' });

  return (
    <div>
      <h1 className="mb-1 text-xl font-semibold">Resumen de hoy</h1>
      <p className="mb-4 text-sm text-gray-400">{fechaHoy}</p>

      <div className="mb-6 grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4">
        <Stat label="Late check out 14 h" value={late14.length} hint="solo de hoy" accent="#2563EB" icon={IC.clock} onClick={() => setModal('late14')} />
        <Stat label="Late check out 18 h" value={late18.length} hint="solo de hoy" accent="#4F46E5" icon={IC.clock} onClick={() => setModal('late18')} />
        <Stat label="Cambios de habitación" value={cambios.length} accent="#7C3AED" icon={IC.swap} onClick={() => setModal('cambios')} />
        <Stat label="Pedidos pendientes" value={pedidosPend} hint="toallas, sábanas…" accent="#0D9488" icon={IC.box} onClick={() => setModal('pedidos')} />

        {isStaff && <>
          <Stat label="% Limpias" value={`${pctLimpias}%`} hint={`${limpias.length}/${rooms.length}`} accent="#5A9018" icon={IC.check} onClick={() => setModal('limpias')} />
          <Stat label="Con deuda" value={conDeuda.length} hint="check out con deuda" accent="#C2410C" icon={IC.euro} onClick={() => setModal('deuda')} />
          <Stat label="VIP" value={vip.length} accent="#CA8A04" icon={IC.star} onClick={() => setModal('vip')} />
          <Stat label="Esperando en lobby" value={lobby.length} hint="rush" accent="#D97706" icon={IC.people} onClick={() => setModal('lobby')} />
          <Stat label="Llegadas extras" value={llegadas.length} accent="#0EA5E9" icon={IC.arrival} onClick={() => setModal('llegadas')} />
          <Stat label="Averías" value={averias.length} hint="se purga a las 00:00" accent="#DC2626" icon={IC.alert} onClick={() => router.push('/averias')} />
          <Stat label="Objetos perdidos" value={objetos.filter((o) => o.estado === 'guardado').length} hint="guardados" accent="#64748B" icon={IC.archive} onClick={() => setModal('objetos')} />
        </>}
      </div>

      {isStaff && (
        <>
          <h2 className="mb-2 font-medium">Limpias por planta</h2>
          <div className="flex flex-wrap gap-2">
            {Object.entries(porPlanta).sort().map(([planta, n]) => (
              <span key={planta} className="rounded-lg bg-hotel-secondary px-3 py-1.5 text-sm font-medium text-hotel-primary">
                Planta {planta}: {n.limpias}/{n.total}
              </span>
            ))}
          </div>
        </>
      )}

      {modal === 'late14' && <RoomsListModal title="Late check out 14 h" rooms={late14} onClose={() => setModal(null)} />}
      {modal === 'late18' && <RoomsListModal title="Late check out 18 h" rooms={late18} onClose={() => setModal(null)} />}
      {modal === 'limpias' && <RoomsListModal title="Habitaciones limpias" rooms={limpias} onClose={() => setModal(null)} />}
      {modal === 'deuda' && <RoomsListModal title="Habitaciones con deuda" rooms={conDeuda} onClose={() => setModal(null)} />}
      {modal === 'vip' && <RoomsListModal title="Habitaciones VIP" rooms={vip} onClose={() => setModal(null)} />}
      {modal === 'lobby' && <RoomsListModal title="Esperando en lobby" rooms={lobby} onClose={() => setModal(null)} />}
      {modal === 'llegadas' && <LlegadasModal onClose={() => setModal(null)} />}
      {modal === 'cambios' && <CambiosModal onClose={() => setModal(null)} />}
      {modal === 'objetos' && <ObjetosModal onClose={() => setModal(null)} />}
      {modal === 'pedidos' && <PedidosModal onClose={() => setModal(null)} />}
    </div>
  );
}
