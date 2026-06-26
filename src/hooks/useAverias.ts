'use client';
import { useEffect, useState } from 'react';
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { Averia } from '@/lib/types';

// Tiempo real sobre la lista de averias del dia (se purga a las 00:00 por Function).
export function useAverias(hotelId: string | null) {
  const [averias, setAverias] = useState<Averia[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!hotelId) {
      setAverias([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const q = query(collection(db, 'hotels', hotelId, 'averias'), orderBy('createdAt', 'desc'));
    const unsub = onSnapshot(q, (snap) => {
      setAverias(snap.docs.map((d) => ({ id: d.id, ...d.data() } as Averia)));
      setLoading(false);
    });
    return () => unsub();
  }, [hotelId]);

  return { averias, loading };
}
