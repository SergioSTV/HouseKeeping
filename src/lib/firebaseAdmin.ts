import { cert, getApps, initializeApp, type App } from 'firebase-admin/app';
import { getAuth, type Auth } from 'firebase-admin/auth';
import { readFileSync } from 'fs';

// Inicializacion perezosa. Solo servidor; nunca se importa en cliente.
let cached: Auth | null = null;

function buildCredential() {
  // 1) Si hay variables de entorno (lo que usaras en Vercel), usalas.
  if (process.env.FIREBASE_ADMIN_CLIENT_EMAIL && process.env.FIREBASE_ADMIN_PRIVATE_KEY) {
    return cert({
      projectId: process.env.FIREBASE_ADMIN_PROJECT_ID,
      clientEmail: process.env.FIREBASE_ADMIN_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_ADMIN_PRIVATE_KEY.replace(/\\n/g, '\n'),
    });
  }
  // 2) En local: usa el serviceAccountKey.json que ya tienes en la carpeta.
  const sa = JSON.parse(readFileSync('./serviceAccountKey.json', 'utf8'));
  return cert(sa);
}

export function getAdminAuth(): Auth {
  if (cached) return cached;
  const app: App = getApps().length ? getApps()[0] : initializeApp({ credential: buildCredential() });
  cached = getAuth(app);
  return cached;
}
