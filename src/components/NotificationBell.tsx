'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useNotifications, type NotifSection } from '@/providers/NotificationsProvider';

const ROUTE: Record<NotifSection, string> = {
  averias: '/averias',
  comentarios: '/comentarios',
  cambios: '/dashboard',
};

function hace(ms: number): string {
  const s = Math.floor((Date.now() - ms) / 1000);
  if (s < 60) return 'ahora';
  if (s < 3600) return `hace ${Math.floor(s / 60)} min`;
  return `hace ${Math.floor(s / 3600)} h`;
}

export function NotificationBell() {
  const { items, unread, muted, toggleMute, markAllSeen, markSeen } = useNotifications();
  const router = useRouter();
  const [open, setOpen] = useState(false);

  return (
    <div className="relative">
      <div className="flex items-center gap-1">
        <button onClick={toggleMute} aria-label={muted ? 'Activar sonido' : 'Silenciar'} className="rounded-full p-1.5 hover:bg-white/15">
          {muted ? (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M11 5 6 9H2v6h4l5 4V5z"/><line x1="23" y1="9" x2="17" y2="15"/><line x1="17" y1="9" x2="23" y2="15"/></svg>
          ) : (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M11 5 6 9H2v6h4l5 4V5z"/><path d="M15.5 8.5a5 5 0 0 1 0 7M19 5a9 9 0 0 1 0 14"/></svg>
          )}
        </button>
        <button onClick={() => setOpen((v) => !v)} aria-label="Notificaciones" className="relative rounded-full p-1.5 hover:bg-white/15">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M18 8a6 6 0 1 0-12 0c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.7 21a2 2 0 0 1-3.4 0"/></svg>
          {unread.total > 0 && (
            <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
              {unread.total > 9 ? '9+' : unread.total}
            </span>
          )}
        </button>
      </div>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 z-50 mt-2 w-80 max-w-[88vw] overflow-hidden rounded-xl border border-gray-200 bg-white text-gray-800 shadow-lg">
            <div className="flex items-center justify-between border-b border-gray-100 px-3 py-2">
              <span className="text-sm font-medium">Notificaciones</span>
              <button onClick={() => { markAllSeen(); }} className="text-xs text-hotel-primary hover:underline">Marcar todo leído</button>
            </div>
            <div className="max-h-80 overflow-auto">
              {items.length === 0 && <p className="px-3 py-6 text-center text-sm text-gray-400">Nada nuevo.</p>}
              {items.map((i) => (
                <button
                  key={i.section + i.id}
                  onClick={() => { markSeen(i.section); setOpen(false); router.push(ROUTE[i.section]); }}
                  className="flex w-full items-start gap-2 border-b border-gray-50 px-3 py-2 text-left hover:bg-gray-50"
                >
                  <span className="mt-1 h-2 w-2 shrink-0 rounded-full" style={{ background: i.section === 'averias' ? '#E24B4A' : i.section === 'comentarios' ? '#7F77DD' : '#378ADD' }} />
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-medium">{i.text}</span>
                    {i.sub && <span className="block truncate text-xs text-gray-500">{i.sub}</span>}
                    <span className="block text-[11px] text-gray-400">{hace(i.ms)}</span>
                  </span>
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
