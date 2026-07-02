'use client';
import { getMessaging, getToken, isSupported } from 'firebase/messaging';
import { doc, updateDoc, arrayUnion } from 'firebase/firestore';
import { app, db } from './firebase';

export type PushResult = 'ok' | 'denegado' | 'no-soportado' | 'sin-clave' | 'error';

// Activa los avisos push en ESTE dispositivo: pide permiso, registra el service
// worker, obtiene el token del dispositivo y lo guarda en el usuario. El backend
// (avisoUrgente) envía a esos tokens; el móvil muestra la notificación con su
// propio sonido aunque la app esté en segundo plano o la pantalla bloqueada.
export async function activarAvisos(uid: string): Promise<PushResult> {
  try {
    if (typeof window === 'undefined' || !('Notification' in window)) return 'no-soportado';
    if (!(await isSupported())) return 'no-soportado';
    const vapidKey = process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY;
    if (!vapidKey) return 'sin-clave';

    const permiso = await Notification.requestPermission();
    if (permiso !== 'granted') return 'denegado';

    const reg = await navigator.serviceWorker.register('/firebase-messaging-sw.js');
    const messaging = getMessaging(app);
    const token = await getToken(messaging, { vapidKey, serviceWorkerRegistration: reg });
    if (!token) return 'error';

    await updateDoc(doc(db, 'users', uid), { fcmTokens: arrayUnion(token) });
    return 'ok';
  } catch {
    return 'error';
  }
}
