import * as admin from 'firebase-admin';
import { onCall, HttpsError } from 'firebase-functions/v2/https';
import {
  generateRegistrationOptions,
  verifyRegistrationResponse,
  generateAuthenticationOptions,
  verifyAuthenticationResponse,
} from '@simplewebauthn/server';

/* eslint-disable @typescript-eslint/no-explicit-any */
const REGION = 'europe-west1';
const RP_NAME = '4RHousekeeping';

interface StoredPasskey {
  id: string;          // base64url
  publicKey: string;   // base64
  counter: number;
  transports?: string[];
}

const db = () => admin.firestore();
const b64ToBytes = (b64: string) => new Uint8Array(Buffer.from(b64, 'base64'));
const bytesToB64 = (u: Uint8Array) => Buffer.from(u).toString('base64');

// Deriva el rpID y el origin de la peticion del cliente, con allowlist.
function rp(origin: string): { rpID: string; origin: string } {
  let host: string;
  try { host = new URL(origin).hostname; } catch { throw new HttpsError('invalid-argument', 'Origen no valido.'); }
  const extra = (process.env.WEBAUTHN_EXTRA_HOSTS || '').split(',').map((s) => s.trim()).filter(Boolean);
  const permitido = host === 'localhost' || host.endsWith('.vercel.app') || extra.includes(host);
  if (!permitido) throw new HttpsError('permission-denied', `Origen no permitido: ${host}`);
  return { rpID: host, origin };
}

// 1) Opciones de registro de huella (usuario ya autenticado).
export const passkeyRegisterOptions = onCall({ region: REGION }, async (req) => {
  const uid = req.auth?.uid;
  if (!uid) throw new HttpsError('unauthenticated', 'Inicia sesion primero.');
  const { origin } = req.data as { origin: string };
  const { rpID } = rp(origin);

  const snap = await db().doc(`users/${uid}`).get();
  const existing: StoredPasskey[] = snap.get('passkeys') || [];

  const options = await generateRegistrationOptions({
    rpName: RP_NAME,
    rpID,
    userName: (req.auth?.token.email as string) || uid,
    userID: new TextEncoder().encode(uid),
    attestationType: 'none',
    excludeCredentials: existing.map((c) => ({ id: c.id, transports: c.transports as any })),
    authenticatorSelection: { residentKey: 'preferred', userVerification: 'required' },
  });

  await db().doc(`users/${uid}`).set({ webauthnChallenge: options.challenge }, { merge: true });
  return options;
});

// 2) Verificar el registro y guardar la credencial.
export const passkeyRegisterVerify = onCall({ region: REGION }, async (req) => {
  const uid = req.auth?.uid;
  if (!uid) throw new HttpsError('unauthenticated', 'Inicia sesion primero.');
  const { origin, response } = req.data as { origin: string; response: any };
  const { rpID, origin: expectedOrigin } = rp(origin);

  const ref = db().doc(`users/${uid}`);
  const snap = await ref.get();
  const expectedChallenge = snap.get('webauthnChallenge');
  if (!expectedChallenge) throw new HttpsError('failed-precondition', 'No hay reto de registro.');

  let verification;
  try {
    verification = await verifyRegistrationResponse({ response, expectedChallenge, expectedOrigin, expectedRPID: rpID });
  } catch (e: any) {
    throw new HttpsError('invalid-argument', e?.message || 'Verificacion fallida.');
  }
  if (!verification.verified || !verification.registrationInfo) {
    throw new HttpsError('invalid-argument', 'No se pudo verificar la huella.');
  }

  const cred = verification.registrationInfo.credential;
  const nuevo: StoredPasskey = {
    id: cred.id,
    publicKey: bytesToB64(cred.publicKey),
    counter: cred.counter,
    transports: (cred.transports as string[]) || [],
  };
  const existing: StoredPasskey[] = snap.get('passkeys') || [];
  const passkeys = [...existing.filter((c) => c.id !== nuevo.id), nuevo];
  await ref.set({
    passkeys, biometricEnabled: true,
    webauthnChallenge: admin.firestore.FieldValue.delete(),
  }, { merge: true });
  return { ok: true };
});

// 3) Opciones de login con huella (SIN autenticar): por usuario.
export const passkeyLoginOptions = onCall({ region: REGION }, async (req) => {
  const { origin, email } = req.data as { origin: string; email: string };
  const { rpID } = rp(origin);

  let userRecord;
  try { userRecord = await admin.auth().getUserByEmail(email); }
  catch { throw new HttpsError('not-found', 'No hay huella registrada para ese usuario.'); }

  const ref = db().doc(`users/${userRecord.uid}`);
  const snap = await ref.get();
  const passkeys: StoredPasskey[] = snap.get('passkeys') || [];
  if (passkeys.length === 0) throw new HttpsError('not-found', 'Ese usuario no tiene huella registrada.');

  const options = await generateAuthenticationOptions({
    rpID,
    allowCredentials: passkeys.map((c) => ({ id: c.id, transports: c.transports as any })),
    userVerification: 'required',
  });
  await ref.set({ webauthnChallenge: options.challenge }, { merge: true });
  return { options, uid: userRecord.uid };
});

// 4) Verificar login con huella -> devuelve un token para iniciar sesion.
export const passkeyLoginVerify = onCall({ region: REGION }, async (req) => {
  const { origin, uid, response } = req.data as { origin: string; uid: string; response: any };
  const { rpID, origin: expectedOrigin } = rp(origin);

  const ref = db().doc(`users/${uid}`);
  const snap = await ref.get();
  const expectedChallenge = snap.get('webauthnChallenge');
  const passkeys: StoredPasskey[] = snap.get('passkeys') || [];
  const cred = passkeys.find((c) => c.id === response.id);
  if (!expectedChallenge || !cred) throw new HttpsError('failed-precondition', 'Reto o credencial no encontrados.');

  let verification;
  try {
    verification = await verifyAuthenticationResponse({
      response, expectedChallenge, expectedOrigin, expectedRPID: rpID,
      credential: {
        id: cred.id,
        publicKey: b64ToBytes(cred.publicKey),
        counter: cred.counter,
        transports: cred.transports as any,
      },
    });
  } catch (e: any) {
    throw new HttpsError('invalid-argument', e?.message || 'Verificacion fallida.');
  }
  if (!verification.verified) throw new HttpsError('permission-denied', 'Huella no valida.');

  const updated = passkeys.map((c) =>
    c.id === cred.id ? { ...c, counter: verification.authenticationInfo.newCounter } : c);
  await ref.set({ passkeys: updated, webauthnChallenge: admin.firestore.FieldValue.delete() }, { merge: true });

  const token = await admin.auth().createCustomToken(uid);
  return { token };
});
