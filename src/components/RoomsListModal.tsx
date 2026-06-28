'use client';
import { STATUS_HEX, STATUS_LABELS, CHECKOUT_LABELS } from '@/lib/roles';
import type { Room } from '@/lib/types';
import { effectiveCheckout } from '@/lib/checkout';

export function RoomsListModal({ title, rooms, onClose }: { title: string; rooms: Room[]; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-0 sm:items-center sm:p-4" onClick={onClose}>
      <div className="max-h-[88vh] w-full max-w-md overflow-auto rounded-t-2xl bg-white shadow-xl sm:rounded-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between border-b border-gray-100 px-5 py-3">
          <h3 className="font-semibold">{title} · {rooms.length}</h3>
          <button onClick={onClose} aria-label="Cerrar" className="text-xl leading-none text-gray-400">✕</button>
        </div>
        <div className="px-5 py-3">
          {rooms.length === 0 && <p className="py-6 text-center text-sm text-gray-400">Ninguna.</p>}
          <ul className="space-y-1.5">
            {rooms.map((r) => {
              const c = STATUS_HEX[r.status];
              return (
                <li key={r.id} className="flex items-center justify-between rounded-lg border border-gray-100 px-3 py-2">
                  <div className="flex items-center gap-2">
                    <span className="h-5 w-1 rounded-full" style={{ backgroundColor: c.stripe }} />
                    <span className="font-medium">{r.number}</span>
                    <span className="text-xs text-gray-400">Planta {r.floor}</span>
                  </div>
                  <div className="flex flex-wrap items-center justify-end gap-1 text-xs">
                    <span className="rounded px-2 py-0.5" style={{ backgroundColor: c.bg, color: c.fg }}>{STATUS_LABELS[r.status]}</span>
                    {r.vip && <span className="rounded bg-[#1f2430] px-1.5 py-0.5 font-medium text-white">VIP</span>}
                    {r.rush && <span className="rounded bg-[#FBE2C0] px-1.5 py-0.5 font-medium text-[#7A4A06]">Lobby</span>}
                    {effectiveCheckout(r) !== 'ninguno' && <span className="rounded bg-gray-100 px-1.5 py-0.5 text-gray-700">{CHECKOUT_LABELS[effectiveCheckout(r)]}</span>}
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      </div>
    </div>
  );
}
