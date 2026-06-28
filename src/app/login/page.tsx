'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { toEmail } from '@/lib/config';
import { entrarConHuella, huellaDisponible, mensajeHuella } from '@/lib/passkey';
import { TextSizeButton } from '@/components/TextSizeButton';

/* eslint-disable @typescript-eslint/no-explicit-any */
export default function LoginPage() {
  const router = useRouter();
  const [usuario, setUsuario] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingH, setLoadingH] = useState(false);

  async function sellarSesion() {
    const idToken = await auth.currentUser!.getIdToken();
    const res = await fetch('/api/session', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ idToken }),
    });
    if (!res.ok) throw new Error('session');
    router.replace('/rack');
  }

  function mensajeError(code: string): string {
    if (code === 'auth/too-many-requests') return 'Demasiados intentos fallidos. Espera unos minutos y prueba de nuevo.';
    if (code === 'auth/user-not-found') return 'Ese usuario no existe.';
    if (code === 'auth/network-request-failed') return 'Sin conexión. Revisa tu red.';
    return 'Usuario o contraseña incorrectos.';
  }

  async function onSubmit() {
    setError(''); setLoading(true);
    // Paso 1: iniciar sesion (aqui se distingue la causa real)
    try {
      await signInWithEmailAndPassword(auth, toEmail(usuario), password);
    } catch (e: any) {
      setLoading(false);
      setError(mensajeError(e?.code || ''));
      return;
    }
    // Paso 2: sellar la sesion (si falla, NO es culpa de la contraseña)
    try {
      await sellarSesion();
    } catch {
      setLoading(false);
      setError('Has entrado, pero falló el inicio de sesión del servidor. Refresca la página o revisa las variables FIREBASE_ADMIN.');
      return;
    }
    setLoading(false);
  }

  async function onHuella() {
    setError('');
    if (!usuario.trim()) { setError('Escribe tu usuario primero.'); return; }
    setLoadingH(true);
    try {
      await entrarConHuella(toEmail(usuario));
      await sellarSesion();
    } catch (e: any) {
      setError(mensajeHuella(e));
    } finally { setLoadingH(false); }
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <div className="w-full max-w-sm overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
        <div className="bg-hotel-primary px-6 py-5 text-white">
          <div className="mb-1 flex justify-end">
            <TextSizeButton className="rounded-full bg-white/15 px-2.5 py-1 text-sm font-semibold text-white transition hover:bg-white/25" />
          </div>
          <div className="flex items-center gap-2 text-lg font-semibold">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M3 21h18M5 21V7l8-4v18M19 21V11l-6-4" />
            </svg>
            4RHousekeeping
          </div>
          <p className="mt-1 text-sm text-white/80">Operativa de Pisos y Recepción</p>
        </div>
        <div className="p-6">
          <input
            value={usuario} onChange={(e) => setUsuario(e.target.value)}
            placeholder="Usuario" autoComplete="username"
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

          {huellaDisponible() && (
            <>
              <div className="my-3 flex items-center gap-2 text-xs text-gray-400">
                <span className="h-px flex-1 bg-gray-200" /> o <span className="h-px flex-1 bg-gray-200" />
              </div>
              <button
                onClick={onHuella} disabled={loadingH}
                className="flex w-full items-center justify-center gap-2 rounded-lg border border-hotel-primary px-3 py-2.5 text-sm font-medium text-hotel-primary transition hover:bg-hotel-secondary disabled:opacity-60"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M12 11c0 3 0 5-1 7M7 18c1-2 1-4 1-6a4 4 0 0 1 6-3M5 12a7 7 0 0 1 11-5.7M12 11v1c0 4 .5 6-1 9M17 11c0 4-.3 6-1 8" />
                </svg>
                {loadingH ? 'Leyendo huella…' : 'Entrar con huella'}
              </button>
            </>
          )}
          <p className="mt-3 text-center text-xs text-gray-400">
            ¿Olvidaste tu contraseña? Pide al administrador que te la restablezca.
          </p>
        </div>
      </div>
    </div>
  );
}
