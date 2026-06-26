'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '@/lib/firebase';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function onSubmit() {
    setError('');
    setLoading(true);
    try {
      const cred = await signInWithEmailAndPassword(auth, email, password);
      const idToken = await cred.user.getIdToken();
      await fetch('/api/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idToken }),
      });
      router.replace('/rack');
    } catch {
      setError('Credenciales incorrectas.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <div className="w-full max-w-sm overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
        <div className="bg-hotel-primary px-6 py-5 text-white">
          <div className="flex items-center gap-2 text-lg font-semibold">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M3 21h18M5 21V7l8-4v18M19 21V11l-6-4" />
            </svg>
            MantenimientoHUB
          </div>
          <p className="mt-1 text-sm text-white/80">Operativa de Pisos y Recepción</p>
        </div>
        <div className="p-6">
          <input
            value={email} onChange={(e) => setEmail(e.target.value)}
            placeholder="Correo" type="email" autoComplete="username"
            className="mb-2 w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none focus:border-hotel-primary"
          />
          <input
            value={password} onChange={(e) => setPassword(e.target.value)}
            placeholder="Contraseña" type="password" autoComplete="current-password"
            onKeyDown={(e) => e.key === 'Enter' && onSubmit()}
            className="mb-3 w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none focus:border-hotel-primary"
          />
          {error && <p className="mb-2 text-sm text-red-600">{error}</p>}
          <button
            onClick={onSubmit} disabled={loading}
            className="w-full rounded-lg bg-hotel-primary px-3 py-2.5 text-sm font-medium text-white transition hover:opacity-90 disabled:opacity-60"
          >
            {loading ? 'Entrando…' : 'Entrar'}
          </button>
        </div>
      </div>
    </div>
  );
}
