'use client';
import { useMemo } from 'react';
import { useHotel } from '@/providers/HotelProvider';
import { useRooms } from '@/hooks/useRooms';
import { useAverias } from '@/hooks/useAverias';

function Stat({ label, value, hint }: { label: string; value: string | number; hint?: string }) {
  return (
    <div className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
      <div className="text-sm text-gray-500">{label}</div>
      <div className="mt-1 text-3xl font-semibold text-hotel-primary">{value}</div>
      {hint && <div className="mt-0.5 text-xs text-gray-400">{hint}</div>}
    </div>
  );
}

// Fecha local de hoy en formato YYYY-MM-DD (sin desfase de zona horaria)
function todayKey(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export default function DashboardPage() {
  const { hotelId } = useHotel();
  const { rooms } = useRooms(hotelId);
  const { averias } = useAverias(hotelId);

  const stats = useMemo(() => {
    const hoy = todayKey();
    // Solo late check outs cuya fecha es HOY
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
      <div className="mb-6 grid grid-cols-2 gap-3 md:grid-cols-5">
        <Stat label="Late check out 14 h" value={stats.late14} hint="solo de hoy" />
        <Stat label="Late check out 18 h" value={stats.late18} hint="solo de hoy" />
        <Stat label="Habitaciones libres" value={stats.libres} />
        <Stat label="VIP / comentarios" value={stats.vip} />
        <Stat label="Averías" value={averias.length} hint="se purga a las 00:00" />
      </div>

      <h2 className="mb-2 font-medium">Libres por planta</h2>
      <div className="flex flex-wrap gap-2">
        {Object.entries(stats.porPlanta).sort().map(([planta, n]) => (
          <span key={planta} className="rounded-lg bg-hotel-secondary px-3 py-1.5 text-sm font-medium text-hotel-primary">
            Planta {planta}: {n}
          </span>
        ))}
      </div>
    </div>
  );
}
