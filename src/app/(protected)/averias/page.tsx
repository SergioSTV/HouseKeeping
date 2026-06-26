'use client';
import { useHotel } from '@/providers/HotelProvider';
import { useAverias } from '@/hooks/useAverias';

function exportarCSV(rows: { roomNumber: string; tipo: string; descripcion: string; hora: string }[]) {
  const head = 'Habitacion,Tipo,Descripcion,Hora\n';
  const body = rows.map((r) => `${r.roomNumber},"${r.tipo}","${r.descripcion}",${r.hora}`).join('\n');
  const blob = new Blob([head + body], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = `averias_${new Date().toISOString().slice(0, 10)}.csv`; a.click();
  URL.revokeObjectURL(url);
}

export default function AveriasPage() {
  const { hotelId } = useHotel();
  const { averias, loading } = useAverias(hotelId);

  const rows = averias.map((a) => ({
    roomNumber: a.roomNumber,
    tipo: a.tipo,
    descripcion: a.descripcion,
    // @ts-expect-error timestamp de Firestore
    hora: a.createdAt?.toDate ? a.createdAt.toDate().toLocaleString('es-ES') : '—',
  }));

  if (loading) return <p className="text-sm text-gray-500">Cargando…</p>;

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-xl font-semibold">Averias de hoy</h1>
        <button onClick={() => exportarCSV(rows)} className="rounded bg-hotel-primary px-3 py-1.5 text-sm font-medium text-white">
          Exportar CSV
        </button>
      </div>
      <p className="mb-3 text-xs text-gray-400">La lista se vacia automaticamente a las 00:00 (se archiva para el historico).</p>
      <div className="overflow-auto rounded-lg border border-gray-200 bg-white">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-left">
            <tr>
              <th className="px-3 py-2">Habitacion</th>
              <th className="px-3 py-2">Hora</th>
              <th className="px-3 py-2">Tipo</th>
              <th className="px-3 py-2">Descripcion</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 && (
              <tr><td colSpan={4} className="px-3 py-6 text-center text-gray-400">Sin averias por ahora.</td></tr>
            )}
            {rows.map((r, i) => (
              <tr key={i} className="border-t border-gray-100">
                <td className="px-3 py-2 font-medium">{r.roomNumber}</td>
                <td className="px-3 py-2">{r.hora}</td>
                <td className="px-3 py-2">{r.tipo}</td>
                <td className="px-3 py-2 text-gray-600">{r.descripcion}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
