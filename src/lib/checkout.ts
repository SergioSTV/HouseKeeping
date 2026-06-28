'use client';
import type { Room, CheckoutStatus } from './types';

export function todayKey(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

// El late check out cuya fecha ya pasó se considera "sin checkout" al mostrarlo.
export function effectiveCheckout(room: Room): CheckoutStatus {
  if (room.checkout === 'late_14' || room.checkout === 'late_18') {
    if (room.lateCheckoutDate && room.lateCheckoutDate < todayKey()) return 'ninguno';
  }
  return room.checkout;
}
