'use client';
import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/providers/AuthProvider';
import { HotelProvider } from '@/providers/HotelProvider';
import { Nav } from '@/components/Nav';
import { canAccess } from '@/lib/roles';

export default function ProtectedLayout({ children }: { children: React.ReactNode }) {
  const { user, role, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (loading) return;
    if (!user) { router.replace('/login'); return; }
    if (role && !canAccess(pathname, role)) router.replace('/rack'); // camarera fuera de su rack
  }, [user, role, loading, pathname, router]);

  if (loading) return <div className="p-8 text-sm text-gray-500">Cargando…</div>;
  if (!user) return null;

  return (
    <HotelProvider>
      <Nav />
      <main className="mx-auto max-w-6xl px-4 py-6">{children}</main>
    </HotelProvider>
  );
}
