'use client';
import {
  createContext, useContext, useEffect, useState, type ReactNode,
} from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from './AuthProvider';
import type { Hotel } from '@/lib/types';

interface HotelState {
  hotels: Hotel[];       // los visibles para este usuario
  hotelId: string | null;
  hotel: Hotel | null;
  setHotel: (id: string) => void;
  loading: boolean;
}

const Ctx = createContext<HotelState | null>(null);

export function HotelProvider({ children }: { children: ReactNode }) {
  const { role, assignedHotels } = useAuth();
  const [hotels, setHotels] = useState<Hotel[]>([]);
  const [hotelId, setHotelId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const snap = await getDocs(collection(db, 'hotels'));
      const all = snap.docs.map((d) => ({ id: d.id, ...d.data() } as Hotel));
      // El admin ve todos; el resto solo sus hoteles asignados.
      const visibles = role === 'admin'
        ? all
        : all.filter((h) => assignedHotels.includes(h.id));
      setHotels(visibles);
      setHotelId((prev) => prev ?? visibles[0]?.id ?? null);
      setLoading(false);
    })();
  }, [role, assignedHotels]);

  // Vuelca el tema del hotel activo a variables CSS -> la pagina cambia de color.
  useEffect(() => {
    const t = hotels.find((h) => h.id === hotelId)?.theme;
    if (!t) return;
    const r = document.documentElement.style;
    r.setProperty('--hotel-primary', t.primary);
    r.setProperty('--hotel-secondary', t.secondary);
    r.setProperty('--hotel-accent', t.accent);
  }, [hotelId, hotels]);

  const hotel = hotels.find((h) => h.id === hotelId) ?? null;

  return (
    <Ctx.Provider value={{ hotels, hotelId, hotel, setHotel: setHotelId, loading }}>
      {children}
    </Ctx.Provider>
  );
}

export function useHotel() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useHotel debe usarse dentro de HotelProvider');
  return ctx;
}
