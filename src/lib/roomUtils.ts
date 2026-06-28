import type { Room } from './types';

export function todayKey(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

// Un late check out con fecha anterior a hoy se considera caducado: no se muestra.
export function normalizeRoom(room: Room): Room {
  if (
    (room.checkout === 'late_14' || room.checkout === 'late_18') &&
    room.lateCheckoutDate &&
    room.lateCheckoutDate < todayKey()
  ) {
    return { ...room, checkout: 'ninguno' };
  }
  return room;
}
