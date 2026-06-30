'use client';
import {
  doc, updateDoc, addDoc, deleteDoc, collection, serverTimestamp, getDoc, writeBatch,
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
  // Al cambiar el estado de una habitación que ya hizo check out, se limpia ese aviso.
  const limpiarCheckout = room.checkout === 'ya_checkout' || room.checkout === 'checkout_anticipado';
  await updateDoc(ref, {
    status,
    updatedBy: actor,
    updatedAt: serverTimestamp(),
    ...(limpiarCheckout ? { checkout: 'ninguno', checkoutAt: null } : {}),
  });
  await logHistory(hotelId, room, 'estado', room.status, status, actor);
}

export async function setCheckout(
  hotelId: string,
  room: Room,
  checkout: CheckoutStatus,
  actor: ActorRef,
  opts?: { lateCheckoutDate?: string | null; salidaReal?: string | null; salidaOriginal?: string | null },
) {
  const ref = doc(db, 'hotels', hotelId, 'rooms', room.id);
  const salida = checkout === 'ya_checkout' || checkout === 'checkout_anticipado';
  const esAnticipado = checkout === 'checkout_anticipado';
  await updateDoc(ref, {
    checkout,
    lateCheckoutDate: opts?.lateCheckoutDate ?? null,
    salidaReal: esAnticipado ? (opts?.salidaReal ?? null) : null,
    salidaOriginal: esAnticipado ? (opts?.salidaOriginal ?? null) : null,
    checkoutAt: salida ? serverTimestamp() : null,
    updatedBy: actor,
    updatedAt: serverTimestamp(),
  });
  await logHistory(hotelId, room, 'checkout', room.checkout, checkout, actor);
}

// Recepción marca el check out: la habitación pasa a SUCIA automáticamente
// (para que Pisos la vea) y se registra el check out. Luego camareras/governanta
// cambian el estado según sus competencias.
export async function checkoutSucia(hotelId: string, room: Room, actor: ActorRef) {
  const ref = doc(db, 'hotels', hotelId, 'rooms', room.id);
  await updateDoc(ref, {
    checkout: 'ya_checkout',
    checkoutAt: serverTimestamp(),
    status: 'sucia',
    updatedBy: actor,
    updatedAt: serverTimestamp(),
  });
  await logHistory(hotelId, room, 'checkout', room.checkout, 'ya_checkout', actor);
  await logHistory(hotelId, room, 'estado', room.status, 'sucia', actor);
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
  habitacion: string,
  fechaEntrada: string,
  fechaSalida: string,
  actor: ActorRef,
) {
  await addDoc(collection(db, 'hotels', hotelId, 'llegadas_extras'), {
    personas, habitacion, fechaEntrada, fechaSalida,
    creadoPor: actor, createdAt: serverTimestamp(),
  });
}

export async function removeLlegada(hotelId: string, id: string) {
  await deleteDoc(doc(db, 'hotels', hotelId, 'llegadas_extras', id));
}

// Rush: cliente esperando en el lobby por esa habitacion.
export async function setRush(hotelId: string, room: Room, rush: boolean, actor: ActorRef) {
  await updateDoc(doc(db, 'hotels', hotelId, 'rooms', room.id), {
    rush, rushAt: rush ? serverTimestamp() : null, updatedBy: actor, updatedAt: serverTimestamp(),
  });
}

// Objetos perdidos (lost & found).
export async function addObjeto(hotelId: string, descripcion: string, lugar: string, actor: ActorRef) {
  await addDoc(collection(db, 'hotels', hotelId, 'objetos_perdidos'), {
    descripcion, lugar, estado: 'guardado',
    creadoPor: actor, createdAt: serverTimestamp(),
  });
}

export async function setObjetoEstado(hotelId: string, id: string, estado: 'guardado' | 'entregado') {
  await updateDoc(doc(db, 'hotels', hotelId, 'objetos_perdidos', id), { estado });
}

export async function removeObjeto(hotelId: string, id: string) {
  await deleteDoc(doc(db, 'hotels', hotelId, 'objetos_perdidos', id));
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

// Crear comentario indicando el numero de habitacion (sin abrir la ficha).
export async function addComentarioDirecto(
  hotelId: string,
  roomNumber: string,
  texto: string,
  tipo: 'vip' | 'importante' | 'urgente',
  actor: ActorRef,
) {
  await addDoc(collection(db, 'hotels', hotelId, 'comentarios'), {
    roomId: roomNumber,        // en el seed, el id de la habitacion es su numero
    roomNumber,
    texto,
    tipo,
    notificarGovernanta: tipo === 'urgente',
    creadoPor: actor,
    createdAt: serverTimestamp(),
  });
}

// Eliminar un comentario especial.
export async function eliminarComentario(hotelId: string, id: string) {
  await deleteDoc(doc(db, 'hotels', hotelId, 'comentarios', id));
}

// ---- Pedidos de habitacion (toallas, sabanas, etc.) ----
export async function addPedido(hotelId: string, habitacion: string, descripcion: string, actor: ActorRef) {
  await addDoc(collection(db, 'hotels', hotelId, 'pedidos'), {
    habitacion, descripcion, estado: 'pendiente',
    creadoPor: actor, createdAt: serverTimestamp(), dayKey: dayKey(),
  });
}

export async function setPedidoHecho(hotelId: string, id: string, hecho: boolean) {
  await updateDoc(doc(db, 'hotels', hotelId, 'pedidos', id), { estado: hecho ? 'hecho' : 'pendiente' });
}

export async function removePedido(hotelId: string, id: string) {
  await deleteDoc(doc(db, 'hotels', hotelId, 'pedidos', id));
}

// ---- Marcar limpias en lote (por planta o por hotel) ----
// Solo cambia las que estan pendientes de limpieza; respeta estados especiales.
export async function markRoomsClean(hotelId: string, rooms: Room[], actor: ActorRef) {
  const limpiables = rooms.filter((r) => ['sucia', 'sucia_guardia', 'lista_revision'].includes(r.status));
  let batch = writeBatch(db);
  let n = 0;
  let cambiadas = 0;
  for (const r of limpiables) {
    batch.update(doc(db, 'hotels', hotelId, 'rooms', r.id), {
      status: 'limpia', updatedBy: actor, updatedAt: serverTimestamp(),
    });
    cambiadas++;
    if (++n >= 400) { await batch.commit(); batch = writeBatch(db); n = 0; }
  }
  if (n > 0) await batch.commit();
  return cambiadas;
}
