'use client';
import { useEffect, useMemo, useState } from 'react';
import { useHotel } from '@/providers/HotelProvider';
import { useRooms } from '@/hooks/useRooms';
import { useAverias } from '@/hooks/useAverias';
import { useCambios } from '@/hooks/useCambios';
import { useNotifications } from '@/providers/NotificationsProvider';
import { CambiosModal } from '@/components/CambiosModal';

function Stat({ label, value, hint, onClick }: { label: string; value: string | number; hint?: string; onClick?: () => void }) {
  return (
    <button
      onClick={onClick}
      disabled={!onClick}
      className={`rounded-xl border border-gray-100 bg-white p-4 text-left shadow-sm ${onClick ? 'transition hover:shadow-md' : ''}`}
    >
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
  const { hotelId } = useHotel();
  const { rooms } = useRooms(hotelId);
  const { averias } = useAverias(hotelId);
  const { cambios } = useCambios(hotelId);
  const { markSeen } = useNotifications();
  const [verCambios, setVerCambios] = useState(false);

  // Al abrir el dashboard, los cambios quedan vistos.
  useEffect(() => { markSeen('cambios'); }, [markSeen]);

  const stats = useMemo(() => {
    const hoy = todayKey();
    const late14 = rooms.filter((r) => r.checkout === 'late_14' && r.lateCheckoutDate === hoy).length;
    const late18 = rooms.filter((r) => r.checkout === 'late_18' && r.lateCheckoutDate === hoy).length;
    const libres = rooms.filter((r) => r.status === 'limpia' || r.status === 'sucia');
    const vip = rooms.filter((r) => r.vip).length;
    const porPlanta: Record<number, number> = {};
    libres.forEach((r) => { porPlanta[r.floor] = (porPlanta[r.floor] ?? 0) + 1; });
    return { late14, late18, libres: libres.length, vip, porPlanta };
  }, [rooms]);

  const fechaHoy = new Date().toLocaleDateString('es-ES', { day: '2-digit', month: 'long', year: 'numeric' });

  return (
    <div>
      <h1 className="mb-1 text-xl font-semibold">Resumen de hoy</h1>
      <p className="mb-4 text-sm text-gray-400">{fechaHoy}</p>
      <div className="mb-6 grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-6">
        <Stat label="Late check out 14 h" value={stats.late14} hint="solo de hoy" />
        <Stat label="Late check out 18 h" value={stats.late18} hint="solo de hoy" />
        <Stat label="Habitaciones libres" value={stats.libres} />
        <Stat label="VIP / comentarios" value={stats.vip} />
        <Stat label="Averías" value={averias.length} hint="se purga a las 00:00" />
        <Stat label="Cambios de habitación" value={cambios.length} hint="ver y exportar" onClick={() => setVerCambios(true)} />
      </div>

      <h2 className="mb-2 font-medium">Libres por planta</h2>
      <div className="flex flex-wrap gap-2">
        {Object.entries(stats.porPlanta).sort().map(([planta, n]) => (
          <span key={planta} className="rounded-lg bg-hotel-secondary px-3 py-1.5 text-sm font-medium text-hotel-primary">
            Planta {planta}: {n}
          </span>
        ))}
      </div>

      {verCambios && <CambiosModal onClose={() => setVerCambios(false)} />}
    </div>
  );
}
