'use client';
import { useState } from 'react';
import { STATUS_HEX, STATUS_LABELS, CHECKOUT_LABELS } from '@/lib/roles';
import type { Room } from '@/lib/types';
import { RoomDetailModal } from './RoomDetailModal';

// Tarjeta del rack: pintada del color del estado y tappable para abrir la ficha.
export function RoomCard({ room }: { room: Room }) {
  const [open, setOpen] = useState(false);
  const c = STATUS_HEX[room.status];

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="rounded-xl border border-black/5 p-3 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-black/10"
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
            {(room.vip || room.checkout !== 'ninguno') && (
              <div className="mt-1.5 flex flex-wrap gap-1">
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
          </div>
        </div>
      </button>
      {open && <RoomDetailModal room={room} onClose={() => setOpen(false)} />}
    </>
  );
}
