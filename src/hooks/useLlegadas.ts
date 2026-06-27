'use client';
import { useEffect, useState } from 'react';
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { LlegadaExtra } from '@/lib/types';

export function useLlegadas(hotelId: string | null) {
  const [llegadas, setLlegadas] = useState<LlegadaExtra[]>([]);
  useEffect(() => {
    if (!hotelId) { setLlegadas([]); return; }
    const q = query(collection(db, 'hotels', hotelId, 'llegadas_extras'), orderBy('createdAt', 'desc'));
    return onSnapshot(q, (snap) => setLlegadas(snap.docs.map((d) => ({ id: d.id, ...d.data() } as LlegadaExtra))));
  }, [hotelId]);
  return { llegadas };
}
