'use client';
import { useEffect, useState } from 'react';
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { Room } from '@/lib/types';

// Suscripcion en tiempo real a las habitaciones del hotel activo.
export function useRooms(hotelId: string | null) {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!hotelId) {
      setRooms([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const q = query(collection(db, 'hotels', hotelId, 'rooms'), orderBy('number'));
    const unsub = onSnapshot(q, (snap) => {
      setRooms(snap.docs.map((d) => ({ id: d.id, ...d.data() } as Room)));
      setLoading(false);
    }, (e) => { console.warn('rooms listener', e); setLoading(false); });
    return () => unsub();
  }, [hotelId]);

  return { rooms, loading };
}
