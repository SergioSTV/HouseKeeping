'use client';
import { useEffect, useState } from 'react';
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { Comentario } from '@/lib/types';

export function useComentarios(hotelId: string | null) {
  const [comentarios, setComentarios] = useState<Comentario[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!hotelId) {
      setComentarios([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const q = query(collection(db, 'hotels', hotelId, 'comentarios'), orderBy('createdAt', 'desc'));
    const unsub = onSnapshot(q, (snap) => {
      setComentarios(snap.docs.map((d) => ({ id: d.id, ...d.data() } as Comentario)));
      setLoading(false);
    });
    return () => unsub();
  }, [hotelId]);

  return { comentarios, loading };
}
