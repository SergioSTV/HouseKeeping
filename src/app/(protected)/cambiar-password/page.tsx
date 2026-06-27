'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { EmailAuthProvider, reauthenticateWithCredential, updatePassword } from 'firebase/auth';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/providers/AuthProvider';
import { registrarHuella, huellaDisponible, mensajeHuella } from '@/lib/passkey';

/* eslint-disable @typescript-eslint/no-explicit-any */
export default function CambiarPasswordPage() {
  const { user, mustChangePassword } = useAuth();
  const router = useRouter();
  const [actual, setActual] = useState('');
  const [nueva, setNueva] = useState('');
  const [repetir, setRepetir] = useState('');
  const [error, setError] = useState('');
  const [ok, setOk] = useState(false);
  const [loading, setLoading] = useState(false);

  const [huellaMsg, setHuellaMsg] = useState('');
  const [huellaLoading, setHuellaLoading] = useState(false);

  async function onSubmit() {
    setError('');
    if (nueva.length < 6) { setError('La nueva contraseña debe tener al menos 6 caracteres.'); return; }
    if (nueva !== repetir) { setError('Las contraseñas no coinciden.'); return; }
    if (!user?.email) return;
    setLoading(true);
    try {
      const cred = EmailAuthProvider.credential(user.email, actual);
      await reauthenticateWithCredential(user, cred);
      await updatePassword(user, nueva);
      await updateDoc(doc(db, 'users', user.uid), { mustChangePassword: false });
      setOk(true);
      setTimeout(() => router.replace('/rack'), 900);
    } catch (e: any) {
      if (e?.code === 'auth/wrong-password' || e?.code === 'auth/invalid-credential') {
        setError('La contraseña actual no es correcta.');
      } else {
        setError('No se pudo cambiar la contraseña. Inténtalo de nuevo.');
      }
    } finally {
      setLoading(false);
    }
  }

  async function activarHuella() {
    setHuellaMsg(''); setHuellaLoading(true);
    try {
      await registrarHuella();
      setHuellaMsg('Huella activada en este dispositivo. Ya puedes entrar con ella.');
    } catch (e: any) {
      setHuellaMsg(mensajeHuella(e));
    } finally {
      setHuellaLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-sm space-y-5">
      <div>
        <h1 className="mb-1 text-xl font-semibold">Cambiar contraseña</h1>
        {mustChangePassword
          ? <p className="mb-4 text-sm text-amber-700">Por seguridad, cambia la contraseña por defecto antes de continuar.</p>
          : <p className="mb-4 text-sm text-gray-500">Introduce tu contraseña actual y la nueva.</p>}
        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <input type="password" autoComplete="current-password" value={actual} onChange={(e) => setActual(e.target.value)}
            placeholder="Contraseña actual"
            className="mb-2 w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none focus:border-hotel-primary" />
          <input type="password" autoComplete="new-password" value={nueva} onChange={(e) => setNueva(e.target.value)}
            placeholder="Nueva contraseña"
            className="mb-2 w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none focus:border-hotel-primary" />
          <input type="password" autoComplete="new-password" value={repetir} onChange={(e) => setRepetir(e.target.value)}
            placeholder="Repite la nueva contraseña" onKeyDown={(e) => e.key === 'Enter' && onSubmit()}
            className="mb-3 w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none focus:border-hotel-primary" />
          {error && <p className="mb-2 text-sm text-red-600">{error}</p>}
          {ok && <p className="mb-2 text-sm text-green-700">Contraseña cambiada. Entrando…</p>}
          <button onClick={onSubmit} disabled={loading || ok}
            className="w-full rounded-lg bg-hotel-primary px-3 py-2.5 text-sm font-medium text-white transition hover:opacity-90 disabled:opacity-60">
            {loading ? 'Guardando…' : 'Guardar contraseña'}
          </button>
        </div>
      </div>

      {huellaDisponible() && (
        <div>
          <h2 className="mb-1 font-medium">Acceso con huella</h2>
          <p className="mb-3 text-sm text-gray-500">Activa la huella en este dispositivo para entrar sin escribir la contraseña.</p>
          <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
            <button onClick={activarHuella} disabled={huellaLoading}
              className="flex w-full items-center justify-center gap-2 rounded-lg border border-hotel-primary px-3 py-2.5 text-sm font-medium text-hotel-primary transition hover:bg-hotel-secondary disabled:opacity-60">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M12 11c0 3 0 5-1 7M7 18c1-2 1-4 1-6a4 4 0 0 1 6-3M5 12a7 7 0 0 1 11-5.7M12 11v1c0 4 .5 6-1 9M17 11c0 4-.3 6-1 8" />
              </svg>
              {huellaLoading ? 'Activando…' : 'Activar huella en este dispositivo'}
            </button>
            {huellaMsg && <p className="mt-2 text-sm text-gray-600">{huellaMsg}</p>}
          </div>
        </div>
      )}
    </div>
  );
}
