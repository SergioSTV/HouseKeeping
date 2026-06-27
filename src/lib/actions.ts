'use client';
import {
  doc, updateDoc, addDoc, collection, serverTimestamp, getDoc,
} from 'firebase/firestore';
import { db } from './firebase';
import type { Room, RoomStatus, CheckoutStatus, ActorRef } from './types';

function dayKey(d = new Date()): string {
  return d.toISOString().slice(0, 10); // YYYY-MM-DD
}

// Registra una entrada en el historial de la habitacion (icono 3 puntitos).
async function logHistory(
  hotelId: string,
  room: Room,
  action: string,
  fromStatus: string,
  toStatus: string,
  actor: ActorRef,
) {
  await addDoc(collection(db, 'hotels', hotelId, 'rooms', room.id, 'history'), {
    action,
    fromStatus,
    toStatus,
    userId: actor.uid,
    userName: actor.name,
    timestamp: serverTimestamp(),
  });
}

export async function changeStatus(
  hotelId: string,
  room: Room,
  status: RoomStatus,
  actor: ActorRef,
) {
  const ref = doc(db, 'hotels', hotelId, 'rooms', room.id);
  await updateDoc(ref, { status, updatedBy: actor, updatedAt: serverTimestamp() });
  await logHistory(hotelId, room, 'estado', room.status, status, actor);
}

export async function setCheckout(
  hotelId: string,
  room: Room,
  checkout: CheckoutStatus,
  actor: ActorRef,
  lateCheckoutDate?: string,
) {
  const ref = doc(db, 'hotels', hotelId, 'rooms', room.id);
  await updateDoc(ref, {
    checkout,
    lateCheckoutDate: lateCheckoutDate ?? null,
    updatedBy: actor,
    updatedAt: serverTimestamp(),
  });
  await logHistory(hotelId, room, 'checkout', room.checkout, checkout, actor);
}

export async function setVip(hotelId: string, room: Room, vip: boolean, actor: ActorRef) {
  const ref = doc(db, 'hotels', hotelId, 'rooms', room.id);
  await updateDoc(ref, { vip, updatedBy: actor, updatedAt: serverTimestamp() });
}

export async function reportAveria(
  hotelId: string,
  room: Room,
  tipo: string,
  descripcion: string,
  grave: boolean,
  actor: ActorRef,
) {
  await addDoc(collection(db, 'hotels', hotelId, 'averias'), {
    roomId: room.id,
    roomNumber: room.number,
    tipo,
    descripcion,
    grave,
    reportadoPor: actor,
    createdAt: serverTimestamp(),
    dayKey: dayKey(),
  });
  if (grave) {
    await updateDoc(doc(db, 'hotels', hotelId, 'rooms', room.id), {
      status: 'averia_grave', updatedBy: actor, updatedAt: serverTimestamp(),
    });
    await logHistory(hotelId, room, 'averia', room.status, 'averia_grave', actor);
  }
}

export async function addComentario(
  hotelId: string,
  room: Room,
  texto: string,
  tipo: 'vip' | 'importante' | 'urgente',
  notificarGovernanta: boolean,
  actor: ActorRef,
) {
  await addDoc(collection(db, 'hotels', hotelId, 'comentarios'), {
    roomId: room.id,
    roomNumber: room.number,
    texto,
    tipo,
    notificarGovernanta,
    creadoPor: actor,
    createdAt: serverTimestamp(),
  });
}

export async function addLlegadaExtra(
  hotelId: string,
  personas: number,
  fechaEntrada: string,
  fechaSalida: string,
  actor: ActorRef,
) {
  await addDoc(collection(db, 'hotels', hotelId, 'llegadas_extras'), {
    personas, fechaEntrada, fechaSalida,
    creadoPor: actor, createdAt: serverTimestamp(),
  });
}

export async function roomHistoryRefExists(hotelId: string, roomId: string) {
  const snap = await getDoc(doc(db, 'hotels', hotelId, 'rooms', roomId));
  return snap.exists();
}

export async function addCambioHabitacion(
  hotelId: string,
  de: string,
  a: string,
  motivo: string,
  actor: ActorRef,
) {
  await addDoc(collection(db, 'hotels', hotelId, 'cambios_habitacion'), {
    de, a, motivo: motivo || '',
    creadoPor: actor, createdAt: serverTimestamp(), dayKey: dayKey(),
  });
}
