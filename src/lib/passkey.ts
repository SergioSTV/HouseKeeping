'use client';
import { startRegistration, startAuthentication } from '@simplewebauthn/browser';
import { httpsCallable, getFunctions } from 'firebase/functions';
import { signInWithCustomToken } from 'firebase/auth';
import { app, auth } from '@/lib/firebase';

/* eslint-disable @typescript-eslint/no-explicit-any */
const fns = () => getFunctions(app, 'europe-west1');

export function huellaDisponible(): boolean {
  return typeof window !== 'undefined' && !!window.PublicKeyCredential;
}

// Registrar huella en este dispositivo (usuario ya dentro).
export async function registrarHuella(): Promise<void> {
  const origin = window.location.origin;
  const opts: any = await httpsCallable(fns(), 'passkeyRegisterOptions')({ origin });
  const att = await startRegistration({ optionsJSON: opts.data });
  await httpsCallable(fns(), 'passkeyRegisterVerify')({ origin, response: att });
}

// Entrar con huella: devuelve true si inició sesión.
export async function entrarConHuella(email: string): Promise<void> {
  const origin = window.location.origin;
  const optsRes: any = await httpsCallable(fns(), 'passkeyLoginOptions')({ origin, email });
  const { options, uid } = optsRes.data;
  const asse = await startAuthentication({ optionsJSON: options });
  const ver: any = await httpsCallable(fns(), 'passkeyLoginVerify')({ origin, uid, response: asse });
  await signInWithCustomToken(auth, ver.data.token);
}

export function mensajeHuella(e: any): string {
  const m = (e?.message || '') + ' ' + (e?.code || '');
  if (e?.name === 'NotAllowedError') return 'Operación cancelada o sin huella en el dispositivo.';
  if (m.includes('not-found')) return 'Ese usuario no tiene huella registrada. Entra con contraseña y actívala.';
  return 'No se pudo usar la huella. Inténtalo de nuevo.';
}
