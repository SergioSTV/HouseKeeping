'use client';
import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/providers/AuthProvider';
import { HotelProvider } from '@/providers/HotelProvider';
import { NotificationsProvider } from '@/providers/NotificationsProvider';
import { Nav } from '@/components/Nav';
import { canAccess } from '@/lib/roles';
import { dentroHorarioCamarera } from '@/lib/shift';
import { ShiftBlockedScreen } from '@/components/ShiftBlockedScreen';

export default function ProtectedLayout({ children }: { children: React.ReactNode }) {
  const { user, role, mustChangePassword, loading, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  // Reevalúa el horario cada minuto: si el turno se cierra con la sesión abierta,
  // pasa a la pantalla de bloqueo (y se cierran las escuchas en tiempo real).
  const [, setTick] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), 60000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    if (loading) return;
    if (!user) { router.replace('/login'); return; }
    if (mustChangePassword === true && pathname !== '/cambiar-password') {
      router.replace('/cambiar-password');
      return;
    }
    if (role && !canAccess(pathname, role)) router.replace('/rack');
  }, [user, role, mustChangePassword, loading, pathname, router]);

  if (loading) return <div className="p-8 text-sm text-gray-500">Cargando…</div>;
  if (!user) return null;

  // Camarera de piso fuera de su horario: acceso limitado (no se monta el rack ni sus escuchas).
  if (role === 'camarera' && !dentroHorarioCamarera()) {
    return <ShiftBlockedScreen onLogout={logout} />;
  }

  return (
    <HotelProvider>
      <NotificationsProvider>
        <Nav />
        <main className="mx-auto max-w-6xl px-4 py-6">{children}</main>
      </NotificationsProvider>
    </HotelProvider>
  );
}
