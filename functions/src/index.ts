import * as admin from 'firebase-admin';
import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { onSchedule } from 'firebase-functions/v2/scheduler';
import { onDocumentCreated } from 'firebase-functions/v2/firestore';
import { setGlobalOptions } from 'firebase-functions/v2';

admin.initializeApp();
setGlobalOptions({ region: 'europe-west1' });

const DEFAULT_PASSWORD = 'SalouPark2026!';

// ---- Alta de usuario (solo admin). Asigna contrasena por defecto + claims. ----
export const crearUsuario = onCall(async (req) => {
  if (req.auth?.token.role !== 'admin') {
    throw new HttpsError('permission-denied', 'Solo el administrador puede crear usuarios.');
  }
  const { email, displayName, role, assignedHotels } = req.data as {
    email: string; displayName: string; role: string; assignedHotels: string[];
  };

  const u = await admin.auth().createUser({ email, password: DEFAULT_PASSWORD, displayName });
  await admin.auth().setCustomUserClaims(u.uid, { role, hotels: assignedHotels });
  await admin.firestore().doc(`users/${u.uid}`).set({
    email, displayName, role, assignedHotels,
    mustChangePassword: true, active: true,
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
  });
  return { uid: u.uid };
});

// ---- Reasignar hoteles de un usuario (refresca el claim). ----
export const actualizarHotelesUsuario = onCall(async (req) => {
  if (req.auth?.token.role !== 'admin') {
    throw new HttpsError('permission-denied', 'Solo el administrador.');
  }
  const { uid, role, assignedHotels } = req.data as { uid: string; role: string; assignedHotels: string[] };
  await admin.auth().setCustomUserClaims(uid, { role, hotels: assignedHotels });
  await admin.firestore().doc(`users/${uid}`).update({ role, assignedHotels });
  return { ok: true };
});

// ---- Baja de usuario (solo admin). ----
export const darDeBajaUsuario = onCall(async (req) => {
  if (req.auth?.token.role !== 'admin') {
    throw new HttpsError('permission-denied', 'Solo el administrador.');
  }
  const { uid } = req.data as { uid: string };
  await admin.auth().updateUser(uid, { disabled: true });
  await admin.firestore().doc(`users/${uid}`).update({ active: false });
  return { ok: true };
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
