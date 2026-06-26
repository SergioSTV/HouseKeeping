'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/providers/AuthProvider';
import { NAV_ITEMS, canAccess, ROLE_LABELS } from '@/lib/roles';
import { HotelSwitcher } from './HotelSwitcher';

export function Nav() {
  const { role, displayName, logout } = useAuth();
  const pathname = usePathname();
  if (!role) return null;

  const items = NAV_ITEMS.filter((i) => canAccess(i.path, role));
  const initial = (displayName || '?').charAt(0).toUpperCase();

  return (
    <header className="sticky top-0 z-40 bg-hotel-primary text-white shadow-sm">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-4 gap-y-2 px-4 py-2.5">
        <span className="flex items-center gap-2 font-semibold tracking-tight">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M3 21h18M5 21V7l8-4v18M19 21V11l-6-4" />
          </svg>
          MantenimientoHUB
        </span>

        <HotelSwitcher />

        <nav className="flex flex-1 flex-wrap gap-1">
          {items.map((i) => {
            const active = pathname.startsWith(i.path);
            return (
              <Link
                key={i.path}
                href={i.path}
                className={`rounded-full px-3.5 py-1.5 text-sm transition ${
                  active ? 'bg-white font-medium text-hotel-primary' : 'text-white/85 hover:bg-white/15'
                }`}
              >
                {i.label}
              </Link>
            );
          })}
        </nav>

        <Link href="/cambiar-password" className="text-sm text-white/85 hover:text-white" title="Cambiar contraseña">
          Contraseña
        </Link>
        <span className="flex items-center gap-2 text-sm">
          <span className="flex h-7 w-7 items-center justify-center rounded-full bg-white/20 text-xs font-medium">
            {initial}
          </span>
          <span className="hidden sm:inline">{displayName} · {ROLE_LABELS[role]}</span>
        </span>
        <button
          onClick={logout}
          className="rounded-full bg-white/15 px-3 py-1.5 text-sm transition hover:bg-white/25"
          aria-label="Salir"
        >
          Salir
        </button>
      </div>
    </header>
  );
}
