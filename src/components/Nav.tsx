'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/providers/AuthProvider';
import { NAV_ITEMS, canAccess } from '@/lib/roles';
import { HotelSwitcher } from './HotelSwitcher';
import { NotificationBell } from './NotificationBell';
import { useNotifications, type NotifSection } from '@/providers/NotificationsProvider';

const SECTION_FOR_PATH: Record<string, NotifSection> = {
  '/dashboard': 'cambios',
  '/averias': 'averias',
  '/comentarios': 'comentarios',
};

export function Nav() {
  const { role, logout } = useAuth();
  const { unread, isStaff } = useNotifications();
  const pathname = usePathname();
  if (!role) return null;

  const items = NAV_ITEMS.filter((i) => canAccess(i.path, role));

  return (
    <header className="sticky top-0 z-40 bg-hotel-primary text-white shadow-sm">
      <div className="mx-auto max-w-6xl px-3 py-2">
        <div className="flex items-center justify-between gap-2">
          <span className="flex items-center gap-2 font-semibold tracking-tight">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M3 21h18M5 21V7l8-4v18M19 21V11l-6-4" />
            </svg>
            <span className="hidden sm:inline">4RHousekeeping</span>
            <span className="sm:hidden">4RHK</span>
          </span>
          <div className="flex items-center gap-2">
            {isStaff && <NotificationBell />}
            <HotelSwitcher />
            <button onClick={logout} className="rounded-full bg-white/15 px-3 py-1.5 text-sm transition hover:bg-white/25">
              Salir
            </button>
          </div>
        </div>

        <nav className="no-scrollbar -mx-1 mt-2 flex gap-1 overflow-x-auto px-1">
          {items.map((i) => {
            const active = pathname.startsWith(i.path);
            const sec = SECTION_FOR_PATH[i.path];
            const badge = sec ? unread[sec] : 0;
            return (
              <Link
                key={i.path}
                href={i.path}
                className={`relative shrink-0 rounded-full px-3.5 py-1.5 text-sm transition ${
                  active ? 'bg-white font-medium text-hotel-primary' : 'text-white/85 hover:bg-white/15'
                }`}
              >
                {i.label}
                {badge > 0 && (
                  <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
                    {badge > 9 ? '9+' : badge}
                  </span>
                )}
              </Link>
            );
          })}
          <Link
            href="/cambiar-password"
            className={`shrink-0 rounded-full px-3.5 py-1.5 text-sm transition ${
              pathname.startsWith('/cambiar-password') ? 'bg-white font-medium text-hotel-primary' : 'text-white/85 hover:bg-white/15'
            }`}
          >
            Contraseña
          </Link>
        </nav>
      </div>
    </header>
  );
}
