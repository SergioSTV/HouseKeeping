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

// ---- Eliminar usuario por completo (solo admin). ----
export const eliminarUsuario = onCall(async (req) => {
  if (req.auth?.token.role !== 'admin') {
    throw new HttpsError('permission-denied', 'Solo el administrador.');
  }
  const { uid } = req.data as { uid: string };
  if (uid === req.auth?.uid) {
    throw new HttpsError('failed-precondition', 'No puedes eliminar tu propia cuenta.');
  }
  try {
    await admin.auth().deleteUser(uid);
    await admin.firestore().doc(`users/${uid}`).delete();
    return { ok: true };
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

      // Cambios de habitacion: mismo barrido (archivar + limpiar).
      const cambios = await db.collection(`hotels/${hotel.id}/cambios_habitacion`).get();
      let cb = db.batch();
      let cn = 0;
      for (const doc of cambios.docs) {
        cb.set(db.doc(`hotels/${hotel.id}/cambios_archive/${doc.id}`), doc.data());
        cb.delete(doc.ref);
        if (++cn >= 200) { await cb.commit(); cb = db.batch(); cn = 0; }
      }
      if (cn > 0) await cb.commit();

      // Comentarios y pedidos: tambien se purgan a diario (la notificacion del dia queda limpia).
      for (const col of ['comentarios', 'pedidos']) {
        const snap = await db.collection(`hotels/${hotel.id}/${col}`).get();
        let b = db.batch();
        let k = 0;
        for (const doc of snap.docs) {
          b.set(db.doc(`hotels/${hotel.id}/${col}_archive/${doc.id}`), doc.data());
          b.delete(doc.ref);
          if (++k >= 200) { await b.commit(); b = db.batch(); k = 0; }
        }
        if (k > 0) await b.commit();
      }

      // Late check out caducado: si la fecha ya paso, se quita de la habitacion.
      const hoy = new Date().toLocaleDateString('en-CA', { timeZone: 'Europe/Madrid' }); // YYYY-MM-DD
      const roomsSnap = await db.collection(`hotels/${hotel.id}/rooms`).get();
      let rb = db.batch();
      let rn = 0;
      for (const doc of roomsSnap.docs) {
        const d = doc.data();
        if ((d.checkout === 'late_14' || d.checkout === 'late_18') && d.lateCheckoutDate && d.lateCheckoutDate < hoy) {
          rb.update(doc.ref, { checkout: 'ninguno', lateCheckoutDate: null });
          if (++rn >= 200) { await rb.commit(); rb = db.batch(); rn = 0; }
        }
      }
      if (rn > 0) await rb.commit();
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
