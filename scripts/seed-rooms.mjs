// Script INDEPENDIENTE: carga el rack real de los dos hoteles.
// Borra las habitaciones existentes y crea las reales. NO toca usuarios ni admin.
//
// Colócalo en la carpeta del proyecto (idealmente en .\scripts\) y ejecútalo
// DESDE LA RAÍZ del proyecto (donde está serviceAccountKey.json):
//
//    node scripts\seed-rooms.mjs
//
import { readFileSync } from 'fs';
import admin from 'firebase-admin';

// ---- Definición del rack real ----
const pad2 = (n) => String(n).padStart(2, '0');
const rng = (a, b) => { const r = []; for (let i = a; i <= b; i++) r.push(i); return r; };
function addFloor(arr, floor, indices) {
  for (const i of indices) arr.push({ number: `${floor}${pad2(i)}`, floor });
}

const SP1 = [];
addFloor(SP1, 0, [1, 2, 3, 4, ...rng(22, 32)]);   // 001-004, 022-032
addFloor(SP1, 1, [1, 2, 3, 4, ...rng(22, 32)]);   // 101-104, 122-132
addFloor(SP1, 2, rng(22, 32));                     // 222-232
for (const f of [3, 4, 5, 6, 7, 8]) addFloor(SP1, f, rng(1, 32)); // X01-X32
addFloor(SP1, 9, rng(0, 5));                       // 900-905

const SP2 = [];
for (const f of [1, 2, 3, 4, 5]) addFloor(SP2, f, rng(1, 38)); // X01-X38
addFloor(SP2, 6, rng(1, 9));                       // 601-609

const ROOMS = { sp1: SP1, sp2: SP2 };
const FLOORS = { sp1: 10, sp2: 6 };

// ---- Carga ----
const serviceAccount = JSON.parse(readFileSync('./serviceAccountKey.json', 'utf8'));
admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
const db = admin.firestore();

async function deleteRooms(hid) {
  const snap = await db.collection(`hotels/${hid}/rooms`).get();
  let batch = db.batch(); let n = 0; let total = 0;
  for (const doc of snap.docs) {
    batch.delete(doc.ref); total++;
    if (++n >= 400) { await batch.commit(); batch = db.batch(); n = 0; }
  }
  if (n > 0) await batch.commit();
  return total;
}

async function createRooms(hid, rooms) {
  let batch = db.batch(); let n = 0;
  for (const r of rooms) {
    batch.set(db.doc(`hotels/${hid}/rooms/${r.number}`), {
      number: r.number, floor: r.floor,
      status: 'limpia', checkout: 'ninguno', lateCheckoutDate: null,
      vip: false, blocked: false,
    });
    if (++n >= 400) { await batch.commit(); batch = db.batch(); n = 0; }
  }
  if (n > 0) await batch.commit();
}

async function main() {
  for (const hid of ['sp1', 'sp2']) {
    const borradas = await deleteRooms(hid);
    await createRooms(hid, ROOMS[hid]);
    await db.doc(`hotels/${hid}`).set({ floors: FLOORS[hid] }, { merge: true });
    console.log(`  ${hid}: borradas ${borradas}, creadas ${ROOMS[hid].length}`);
  }
  console.log('Rack real cargado.');
  process.exit(0);
}
main().catch((e) => { console.error(e); process.exit(1); });
