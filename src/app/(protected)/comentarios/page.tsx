'use client';
import { useComentarios } from '@/hooks/useComentarios';
import { useHotel } from '@/providers/HotelProvider';

const TIPO_COLOR: Record<string, string> = {
  vip: 'bg-purple-100 text-purple-800',
  importante: 'bg-amber-100 text-amber-800',
  urgente: 'bg-red-100 text-red-800',
};

export default function ComentariosPage() {
  const { hotelId } = useHotel();
  const { comentarios, loading } = useComentarios(hotelId);

  if (loading) return <p className="text-sm text-gray-500">Cargando…</p>;

  return (
    <div>
      <h1 className="mb-4 text-xl font-semibold">Comentarios especiales</h1>
      <p className="mb-4 text-sm text-gray-500">Peticiones VIP y notas urgentes de Recepcion para Pisos.</p>
      <div className="space-y-2">
        {comentarios.length === 0 && <p className="text-sm text-gray-400">Sin comentarios todavia.</p>}
        {comentarios.map((c) => (
          <div key={c.id} className="rounded-lg border border-gray-200 bg-white p-3">
            <div className="mb-1 flex items-center gap-2">
              <span className="font-medium">Habitacion {c.roomNumber}</span>
              <span className={`rounded px-2 py-0.5 text-xs font-medium ${TIPO_COLOR[c.tipo]}`}>{c.tipo}</span>
              {c.notificarGovernanta && <span className="text-xs text-red-600">· avisada Governanta</span>}
            </div>
            <p className="text-sm text-gray-700">{c.texto}</p>
            <p className="mt-1 text-xs text-gray-400">{c.creadoPor?.name}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
