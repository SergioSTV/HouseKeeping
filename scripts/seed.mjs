// Carga inicial: crea los dos hoteles (con sus temas de color), las habitaciones
// y un usuario administrador para poder entrar la primera vez.
//
// Requiere una clave de cuenta de servicio en ./serviceAccountKey.json
// (Firebase Console > Project settings > Service accounts > Generate new private key).
//
// Uso:  npm run seed

import { readFileSync } from 'fs';
import admin from 'firebase-admin';

const serviceAccount = JSON.parse(readFileSync('./serviceAccountKey.json', 'utf8'));
admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });

const db = admin.firestore();
const auth = admin.auth();

// ---- Definicion de los dos hoteles del resort ----
const HOTELES = [
  {
    id: 'sp1',
    name: 'Salou Park I',
    floors: 6,
    roomsPerFloor: 10,
    theme: { primary: '#1D5FA5', secondary: '#E6F1FB', accent: '#378ADD' }, // azul
  },
  {
    id: 'sp2',
    name: 'Salou Park 2',
    floors: 6,
    roomsPerFloor: 10,
    theme: { primary: '#3B6D11', secondary: '#EAF3DE', accent: '#639922' }, // verde
  },
];

async function seedHotel(h) {
  await db.doc(`hotels/${h.id}`).set({
    name: h.name, floors: h.floors, theme: h.theme, active: true,
  });

  let batch = db.batch();
  let count = 0;
  for (let floor = 1; floor <= h.floors; floor++) {
    for (let i = 1; i <= h.roomsPerFloor; i++) {
      const number = `${floor}${String(i).padStart(2, '0')}`;
      batch.set(db.doc(`hotels/${h.id}/rooms/${number}`), {
        number, floor,
        status: 'limpia',
        checkout: 'ninguno',
        lateCheckoutDate: null,
        vip: false,
        blocked: false,
      });
      if (++count >= 400) { await batch.commit(); batch = db.batch(); count = 0; }
    }
  }
  if (count > 0) await batch.commit();
  console.log(`  ${h.name}: ${h.floors * h.roomsPerFloor} habitaciones`);
}

async function seedAdmin() {
  const email = 'admin@saloupark.local';
  const password = 'saloupark';
  let user;
  try {
    user = await auth.getUserByEmail(email);
  } catch {
    user = await auth.createUser({ email, password, displayName: 'Administrador' });
  }
  await auth.setCustomUserClaims(user.uid, { role: 'admin', hotels: ['sp1', 'sp2'] });
  await db.doc(`users/${user.uid}`).set({
    email, displayName: 'Administrador', role: 'admin',
    assignedHotels: ['sp1', 'sp2'], mustChangePassword: true, active: true,
  });
  console.log(`  Admin: ${email}  /  ${password}`);
}

async function main() {
  console.log('Cargando hoteles…');
  for (const h of HOTELES) await seedHotel(h);
  console.log('Creando administrador…');
  await seedAdmin();
  console.log('Listo.');
  process.exit(0);
}

main().catch((e) => { console.error(e); process.exit(1); });
