# MantenimientoHUB

Operativa de Pisos y Recepcion en tiempo real para el resort (Salou Park I y Salou Park 2).
Next.js 15 (PWA) + Firebase (Firestore, Auth, Functions, FCM). Despliegue en Vercel.

## Que incluye
- Tiempo real con `onSnapshot` (cambios sin recargar).
- Roles con custom claims + reglas de Firestore (la seguridad real).
- Multi-hotel aislado: cada hotel tiene su rack/averias/comentarios y su color.
- Camarera restringida al rack de su hotel asignado.
- Historial por habitacion, purga de averias a las 00:00, aviso urgente por push.

## Estructura
- `src/` aplicacion Next.js (App Router).
- `firestore.rules` reglas de seguridad por rol y hotel.
- `functions/` Cloud Functions (alta/baja usuarios, purga 00:00, FCM).
- `scripts/seed.mjs` carga los dos hoteles, habitaciones y un admin inicial.

## Puesta en marcha (resumen)
1. Crear proyecto en Firebase: Firestore, Authentication (Email/Password), Cloud Messaging.
2. `cp .env.local.example .env.local` y rellenar con la config web de Firebase.
3. Descargar la clave de cuenta de servicio como `serviceAccountKey.json` (raiz del repo).
4. `npm install` y `npm run seed` (crea hoteles + admin).
5. `firebase deploy --only firestore:rules,functions`.
6. `npm run dev` para local; o desplegar en Vercel (ver guia).

Admin inicial creado por el seed: `admin@saloupark.local` / `SalouPark2026!` (cambiala).
