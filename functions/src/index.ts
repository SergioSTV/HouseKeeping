import * as admin from 'firebase-admin';
import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { onSchedule } from 'firebase-functions/v2/scheduler';
import { onDocumentCreated } from 'firebase-functions/v2/firestore';
import { setGlobalOptions } from 'firebase-functions/v2';

admin.initializeApp();
setGlobalOptions({ region: 'europe-west1' });

const DEFAULT_PASSWORD = 'SalouPark2026!';

/* eslint-disable @typescript-eslint/no-explicit-any */
// Traduce errores de Firebase a mensajes claros para la pantalla.
function traducir(e: any): HttpsError {
  const code = e?.errorInfo?.code || e?.code || '';
  if (code === 'auth/email-already-exists') return new HttpsError('already-exists', 'Ese correo ya está registrado.');
  if (code === 'auth/invalid-email') return new HttpsError('invalid-argument', 'El correo no es válido.');
  if (code === 'auth/invalid-password') return new HttpsError('invalid-argument', 'La contraseña por defecto no es válida.');
  return new HttpsError('internal', `No se pudo completar: ${e?.message || code || 'error desconocido'}`);
}

// ---- Alta de usuario (solo admin). Asigna contrasena por defecto + claims. ----
export const crearUsuario = onCall(async (req) => {
  if (req.auth?.token.role !== 'admin') {
    throw new HttpsError('permission-denied', 'Solo el administrador puede crear usuarios.');
  }
  const { email, displayName, role, assignedHotels } = req.data as {
    email: string; displayName: string; role: string; assignedHotels: string[];
  };
  if (!email || !role) {
    throw new HttpsError('invalid-argument', 'Faltan el correo o el rol.');
  }
  const nombre = displayName || email;
  const hoteles = Array.isArray(assignedHotels) ? assignedHotels : [];
  try {
    const u = await admin.auth().createUser({ email, password: DEFAULT_PASSWORD, displayName: nombre });
    await admin.auth().setCustomUserClaims(u.uid, { role, hotels: hoteles });
    await admin.firestore().doc(`users/${u.uid}`).set({
      email, displayName: nombre, role, assignedHotels: hoteles,
      mustChangePassword: true, active: true,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });
    return { uid: u.uid };
  } catch (e) {
    throw traducir(e);
  }
});

// ---- Reasignar hoteles de un usuario (refresca el claim). ----
export const actualizarHotelesUsuario = onCall(async (req) => {
  if (req.auth?.token.role !== 'admin') {
    throw new HttpsError('permission-denied', 'Solo el administrador.');
  }
  const { uid, role, assignedHotels } = req.data as { uid: string; role: string; assignedHotels: string[] };
  const hoteles = Array.isArray(assignedHotels) ? assignedHotels : [];
  try {
    await admin.auth().setCustomUserClaims(uid, { role, hotels: hoteles });
    await admin.firestore().doc(`users/${uid}`).update({ role, assignedHotels: hoteles });
    return { ok: true };
  } catch (e) {
    throw traducir(e);
  }
});

// ---- Baja de usuario (solo admin). ----
export const darDeBajaUsuario = onCall(async (req) => {
  if (req.auth?.token.role !== 'admin') {
    throw new HttpsError('permission-denied', 'Solo el administrador.');
  }
  const { uid } = req.data as { uid: string };
  try {
    await admin.auth().updateUser(uid, { disabled: true });
    await admin.firestore().doc(`users/${uid}`).update({ active: false });
    return { ok: true };
  } catch (e) {
    throw traducir(e);
  }
});

// ---- Reactivar usuario (solo admin). ----
export const reactivarUsuario = onCall(async (req) => {
  if (req.auth?.token.role !== 'admin') {
    throw new HttpsError('permission-denied', 'Solo el administrador.');
  }
  const { uid } = req.data as { uid: string };
  try {
    await admin.auth().updateUser(uid, { disabled: false });
    await admin.firestore().doc(`users/${uid}`).update({ active: true });
    return { ok: true };
  } catch (e) {
    throw traducir(e);
  }
});

// ---- Resetear contrasena a la de por defecto (solo admin). ----
// Vuelve a poner la contrasena por defecto y obliga a cambiarla al entrar.
export const resetearContrasena = onCall(async (req) => {
  if (req.auth?.token.role !== 'admin') {
    throw new HttpsError('permission-denied', 'Solo el administrador.');
  }
  const { uid } = req.data as { uid: string };
  try {
    await admin.auth().updateUser(uid, { password: DEFAULT_PASSWORD });
    await admin.firestore().doc(`users/${uid}`).update({ mustChangePassword: true });
    return { password: DEFAULT_PASSWORD };
  } catch (e) {
    throw traducir(e);
  }
});

// ---- Purga diaria de averias a las 00:00 (Europe/Madrid). Archiva y limpia. ----
export const purgarAverias = onSchedule(
  { schedule: '0 0 * * *', timeZone: 'Europe/Madrid' },
  async () => {
    const db = admin.firestore();
    const hoteles = await db.collection('hotels').get();
    for (const hotel of hoteles.docs) {
      const averias = await db.collection(`hotels/${hotel.id}/averias`).get();
      let batch = db.batch();
      let n = 0;
      for (const doc of averias.docs) {
        batch.set(db.doc(`hotels/${hotel.id}/averias_archive/${doc.id}`), doc.data());
        batch.delete(doc.ref);
        if (++n >= 200) { await batch.commit(); batch = db.batch(); n = 0; }
      }
      if (n > 0) await batch.commit();
    }
  },
);

// ---- Aviso urgente de Recepcion -> push a Governanta del mismo hotel. ----
export const avisoUrgente = onDocumentCreated('hotels/{hid}/comentarios/{id}', async (event) => {
  const data = event.data?.data();
  if (!data?.notificarGovernanta) return;
  const hid = event.params.hid;

  const db = admin.firestore();
  const gov = await db.collection('users')
    .where('role', 'in', ['governanta', 'subgovernanta'])
    .where('assignedHotels', 'array-contains', hid)
    .get();

  const tokens: string[] = [];
  gov.forEach((d) => { (d.data().fcmTokens || []).forEach((t: string) => tokens.push(t)); });
  if (tokens.length === 0) return;

  await admin.messaging().sendEachForMulticast({
    tokens,
    notification: {
      title: `Habitacion ${data.roomNumber} · ${data.tipo}`,
      body: data.texto,
    },
  });
});
export * from './passkey';
