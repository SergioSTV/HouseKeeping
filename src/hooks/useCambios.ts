'use client';
import { useEffect, useState } from 'react';
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { CambioHabitacion } from '@/lib/types';

export function useCambios(hotelId: string | null) {
  const [cambios, setCambios] = useState<CambioHabitacion[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!hotelId) { setCambios([]); setLoading(false); return; }
    setLoading(true);
    const q = query(collection(db, 'hotels', hotelId, 'cambios_habitacion'), orderBy('createdAt', 'desc'));
    const unsub = onSnapshot(q, (snap) => {
      setCambios(snap.docs.map((d) => ({ id: d.id, ...d.data() } as CambioHabitacion)));
      setLoading(false);
    });
    return () => unsub();
  }, [hotelId]);

  return { cambios, loading };
}
