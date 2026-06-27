'use client';
import { useState } from 'react';
import { STATUS_HEX, STATUS_LABELS, CHECKOUT_LABELS } from '@/lib/roles';
import { changeStatus, setCheckout } from '@/lib/actions';
import { useAuth } from '@/providers/AuthProvider';
import { useHotel } from '@/providers/HotelProvider';
import type { Room } from '@/lib/types';
import { RoomDetailModal } from './RoomDetailModal';

export function RoomCard({ room }: { room: Room }) {
  const [open, setOpen] = useState(false);
  const { role, user, displayName } = useAuth();
  const { hotelId } = useHotel();
  const c = STATUS_HEX[room.status];
  const actor = user ? { uid: user.uid, name: displayName } : null;

  // Acciones rapidas segun rol: un toque, sin abrir la ficha.
  const quick: { label: string; run: () => void }[] = [];
  if (actor && hotelId) {
    if (role === 'camarera') {
      quick.push({ label: 'Lista', run: () => changeStatus(hotelId, room, 'lista_revision', actor) });
    } else if (role === 'governanta' || role === 'subgovernanta' || role === 'admin' || role === 'camarera_guardia') {
      quick.push({ label: 'Limpia', run: () => changeStatus(hotelId, room, 'limpia', actor) });
      quick.push({ label: 'Sucia', run: () => changeStatus(hotelId, room, 'sucia', actor) });
    } else if (role === 'recepcion') {
      quick.push({ label: 'Check out', run: () => setCheckout(hotelId, room, 'ya_checkout', actor) });
    }
  }

  return (
    <>
      <div
        role="button"
        tabIndex={0}
        onClick={() => setOpen(true)}
        onKeyDown={(e) => { if (e.key === 'Enter') setOpen(true); }}
        className="cursor-pointer rounded-xl border border-black/5 p-3 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-black/10"
        style={{ backgroundColor: c.bg }}
      >
        <div className="flex items-start gap-2.5">
          <span className="mt-0.5 h-7 w-1 shrink-0 rounded-full" style={{ backgroundColor: c.stripe }} />
          <div className="min-w-0 flex-1">
            <div className="flex items-baseline justify-between gap-2">
              <span className="text-lg font-semibold leading-none" style={{ color: c.fg }}>{room.number}</span>
              <span className="text-[11px]" style={{ color: c.fg, opacity: 0.7 }}>Planta {room.floor}</span>
            </div>
            <div className="mt-1.5 text-xs font-medium" style={{ color: c.fg }}>{STATUS_LABELS[room.status]}</div>
            {(room.vip || room.rush || room.checkout !== 'ninguno') && (
              <div className="mt-1.5 flex flex-wrap gap-1">
                {room.rush && (
                  <span className="inline-flex items-center gap-1 rounded-md bg-[#FBE2C0] px-1.5 py-0.5 text-[11px] font-medium text-[#7A4A06]">
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>
                    Lobby
                  </span>
                )}
                {room.vip && (
                  <span className="inline-flex items-center gap-1 rounded-md bg-[#1f2430] px-1.5 py-0.5 text-[11px] font-medium text-white">
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="#FAC775" aria-hidden="true"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
                    VIP
                  </span>
                )}
                {room.checkout !== 'ninguno' && (
                  <span className="inline-flex items-center gap-1 rounded-md bg-white/70 px-1.5 py-0.5 text-[11px]" style={{ color: c.fg }}>
                    {CHECKOUT_LABELS[room.checkout]}
                  </span>
                )}
              </div>
            )}
            {quick.length > 0 && (
              <div className="mt-2 flex gap-1.5">
                {quick.map((q) => (
                  <button
                    key={q.label}
                    onClick={(e) => { e.stopPropagation(); q.run(); }}
                    className="rounded-md bg-white/70 px-2 py-1 text-[11px] font-medium transition hover:bg-white"
                    style={{ color: c.fg }}
                  >
                    {q.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
      {open && <RoomDetailModal room={room} onClose={() => setOpen(false)} />}
    </>
  );
}
