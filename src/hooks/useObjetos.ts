'use client';
import { useEffect, useState } from 'react';
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { ObjetoPerdido } from '@/lib/types';

export function useObjetos(hotelId: string | null) {
  const [objetos, setObjetos] = useState<ObjetoPerdido[]>([]);
  useEffect(() => {
    if (!hotelId) { setObjetos([]); return; }
    const q = query(collection(db, 'hotels', hotelId, 'objetos_perdidos'), orderBy('createdAt', 'desc'));
    return onSnapshot(q, (snap) => setObjetos(snap.docs.map((d) => ({ id: d.id, ...d.data() } as ObjetoPerdido))));
  }, [hotelId]);
  return { objetos };
}
