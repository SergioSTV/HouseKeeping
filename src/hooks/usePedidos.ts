'use client';
import { useEffect, useState } from 'react';
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { Pedido } from '@/lib/types';

export function usePedidos(hotelId: string | null) {
  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  useEffect(() => {
    if (!hotelId) { setPedidos([]); return; }
    const q = query(collection(db, 'hotels', hotelId, 'pedidos'), orderBy('createdAt', 'desc'));
    return onSnapshot(
      q,
      (snap) => setPedidos(snap.docs.map((d) => ({ id: d.id, ...d.data() } as Pedido))),
      (e) => console.warn('pedidos listener', e),
    );
  }, [hotelId]);
  return { pedidos };
}
