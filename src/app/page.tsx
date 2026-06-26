'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/providers/AuthProvider';

export default function Home() {
  const { user, loading } = useAuth();
  const router = useRouter();
  useEffect(() => {
    if (loading) return;
    router.replace(user ? '/rack' : '/login');
  }, [user, loading, router]);
  return <div className="p-8 text-sm text-gray-500">Cargando…</div>;
}
