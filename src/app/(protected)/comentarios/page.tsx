'use client';
import { useEffect, useState } from 'react';
import { useComentarios } from '@/hooks/useComentarios';
import { useNotifications } from '@/providers/NotificationsProvider';
import { useHotel } from '@/providers/HotelProvider';
import { useAuth } from '@/providers/AuthProvider';
import { addComentarioDirecto, eliminarComentario } from '@/lib/actions';

const TIPO_COLOR: Record<string, string> = {
  vip: 'bg-purple-100 text-purple-800',
  importante: 'bg-amber-100 text-amber-800',
  urgente: 'bg-red-100 text-red-800',
};

export default function ComentariosPage() {
  const { hotelId } = useHotel();
  const { user, displayName } = useAuth();
  const { comentarios, loading } = useComentarios(hotelId);
  const { markSeen } = useNotifications();
  useEffect(() => { markSeen('comentarios'); }, [markSeen]);

  const [habitacion, setHabitacion] = useState('');
  const [texto, setTexto] = useState('');
  const [tipo, setTipo] = useState<'vip' | 'importante' | 'urgente'>('importante');
  const [msg, setMsg] = useState('');

  async function crear() {
    if (!habitacion.trim() || !texto.trim() || !hotelId || !user) return;
    await addComentarioDirecto(hotelId, habitacion.trim(), texto.trim(), tipo, { uid: user.uid, name: displayName });
    setMsg(tipo === 'urgente' ? 'Comentario urgente añadido. Se ha avisado a Governanta.' : 'Comentario añadido.');
    setHabitacion(''); setTexto('');
  }

  async function borrar(id: string) {
    if (!hotelId) return;
    if (!confirm('¿Eliminar este comentario? No se puede deshacer.')) return;
    await eliminarComentario(hotelId, id);
  }

  if (loading) return <p className="text-sm text-gray-500">Cargando…</p>;

  return (
    <div>
      <h1 className="mb-4 text-xl font-semibold">Comentarios especiales</h1>
      <p className="mb-4 text-sm text-gray-500">Peticiones VIP y notas urgentes de Recepción para Pisos.</p>

      <div className="mb-6 rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
        <h2 className="mb-3 font-medium">Añadir comentario</h2>
        <div className="flex flex-wrap items-end gap-2">
          <div>
            <label className="mb-1 block text-xs text-gray-500">Habitación</label>
            <input value={habitacion} onChange={(e) => setHabitacion(e.target.value)} placeholder="110"
              className="w-20 rounded-lg border border-gray-300 px-2 py-2 text-sm outline-none focus:border-hotel-primary" />
          </div>
          <select value={tipo} onChange={(e) => setTipo(e.target.value as any)}
            className="rounded-lg border border-gray-300 px-2 py-2 text-sm">
            <option value="importante">Importante</option>
            <option value="urgente">Urgente</option>
            <option value="vip">VIP</option>
          </select>
          <input value={texto} onChange={(e) => setTexto(e.target.value)} placeholder="Ej. dejar agua y tarjeta de bienvenida"
            className="min-w-[12rem] flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-hotel-primary" />
          <button onClick={crear} className="rounded-lg bg-hotel-primary px-3 py-2 text-sm font-medium text-white">Añadir</button>
        </div>
        {msg && <p className="mt-2 text-sm text-gray-600">{msg}</p>}
        <p className="mt-1 text-xs text-gray-400">Los comentarios urgentes envían una notificación directa a Governanta.</p>
      </div>

      <div className="space-y-2">
        {comentarios.length === 0 && <p className="text-sm text-gray-400">Sin comentarios todavía.</p>}
        {comentarios.map((c) => (
          <div key={c.id} className="rounded-lg border border-gray-200 bg-white p-3">
            <div className="mb-1 flex items-center gap-2">
              <span className="font-medium">Habitación {c.roomNumber}</span>
              <span className={`rounded px-2 py-0.5 text-xs font-medium ${TIPO_COLOR[c.tipo]}`}>{c.tipo}</span>
              {c.notificarGovernanta && <span className="text-xs text-red-600">· avisada Governanta</span>}
              <button onClick={() => borrar(c.id)} aria-label="Eliminar comentario" title="Eliminar"
                className="ml-auto rounded p-1 text-gray-400 transition hover:bg-red-50 hover:text-red-600">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M3 6h18"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg>
              </button>
            </div>
            <p className="text-sm text-gray-700">{c.texto}</p>
            <p className="mt-1 text-xs text-gray-400">{c.creadoPor?.name}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
