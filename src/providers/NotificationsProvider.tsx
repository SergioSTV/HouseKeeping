'use client';
import {
  createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode,
} from 'react';
import { collection, onSnapshot, query, orderBy, limit } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from './AuthProvider';
import { useHotel } from './HotelProvider';
import { playBeep } from '@/lib/sound';

/* eslint-disable @typescript-eslint/no-explicit-any */
export type NotifSection = 'averias' | 'comentarios' | 'cambios';
export interface NotifItem { id: string; section: NotifSection; text: string; sub: string; ms: number; }

interface NotifState {
  items: NotifItem[];
  unread: Record<NotifSection, number> & { total: number };
  muted: boolean;
  isStaff: boolean;
  toggleMute: () => void;
  markSeen: (s: NotifSection) => void;
  markAllSeen: () => void;
}
const Ctx = createContext<NotifState | null>(null);

const SECTIONS: { key: NotifSection; coll: string }[] = [
  { key: 'averias', coll: 'averias' },
  { key: 'comentarios', coll: 'comentarios' },
  { key: 'cambios', coll: 'cambios_habitacion' },
];
const ms = (v: any): number => (v?.toMillis ? v.toMillis() : Date.now());

export function NotificationsProvider({ children }: { children: ReactNode }) {
  const { user, role } = useAuth();
  const { hotelId } = useHotel();
  const isStaff = role ? ['admin', 'governanta', 'subgovernanta', 'recepcion'].includes(role) : false;

  const [bySection, setBySection] = useState<Record<NotifSection, NotifItem[]>>({ averias: [], comentarios: [], cambios: [] });
  const [seen, setSeen] = useState<Record<NotifSection, number>>({ averias: 0, comentarios: 0, cambios: 0 });
  const [muted, setMuted] = useState(false);

  const seenRef = useRef(seen);
  const mutedRef = useRef(muted);
  const inited = useRef<Record<NotifSection, boolean>>({ averias: false, comentarios: false, cambios: false });
  useEffect(() => { seenRef.current = seen; }, [seen]);
  useEffect(() => { mutedRef.current = muted; }, [muted]);

  const seenKey = user ? `notif_seen_${user.uid}` : '';
  const muteKey = user ? `notif_muted_${user.uid}` : '';

  useEffect(() => {
    if (!user) return;
    try {
      const s = JSON.parse(localStorage.getItem(seenKey) || '{}');
      setSeen({ averias: s.averias || 0, comentarios: s.comentarios || 0, cambios: s.cambios || 0 });
      setMuted(localStorage.getItem(muteKey) === '1');
    } catch { /* nada */ }
  }, [user, seenKey, muteKey]);

  useEffect(() => {
    if (!hotelId || !isStaff) { setBySection({ averias: [], comentarios: [], cambios: [] }); return; }
    inited.current = { averias: false, comentarios: false, cambios: false };
    const unsubs = SECTIONS.map(({ key, coll }) =>
      onSnapshot(
        query(collection(db, 'hotels', hotelId, coll), orderBy('createdAt', 'desc'), limit(30)),
        (snap) => {
          const items: NotifItem[] = snap.docs.map((d) => {
            const x: any = d.data();
            if (key === 'averias') return { id: d.id, section: key, text: `Avería · hab. ${x.roomNumber}`, sub: x.tipo || '', ms: ms(x.createdAt) };
            if (key === 'comentarios') return { id: d.id, section: key, text: `${x.tipo === 'urgente' ? 'URGENTE · ' : ''}Comentario · hab. ${x.roomNumber}`, sub: x.texto || '', ms: ms(x.createdAt) };
            return { id: d.id, section: key, text: `Cambio · ${x.de} → ${x.a}`, sub: x.motivo || '', ms: ms(x.createdAt) };
          });
          setBySection((prev) => ({ ...prev, [key]: items }));

          if (inited.current[key]) {
            const added = snap.docChanges().filter((c) => c.type === 'added');
            if (added.length > 0) {
              const newest = Math.max(...added.map((c) => ms(c.doc.data().createdAt)));
              if (!mutedRef.current && newest > (seenRef.current[key] || 0)) playBeep();
            }
          } else {
            inited.current[key] = true;
          }
        },
      ),
    );
    return () => unsubs.forEach((u) => u());
  }, [hotelId, isStaff]);

  // Identidades ESTABLES: evita el bucle de renders.
  const markSeen = useCallback((s: NotifSection) => {
    setSeen((prev) => {
      if (prev[s] && Date.now() - prev[s] < 500) return prev; // ya recién marcado
      const next = { ...prev, [s]: Date.now() };
      try { localStorage.setItem(seenKey, JSON.stringify(next)); } catch { /* nada */ }
      return next;
    });
  }, [seenKey]);

  const markAllSeen = useCallback(() => {
    setSeen(() => {
      const next = { averias: Date.now(), comentarios: Date.now(), cambios: Date.now() };
      try { localStorage.setItem(seenKey, JSON.stringify(next)); } catch { /* nada */ }
      return next;
    });
  }, [seenKey]);

  const toggleMute = useCallback(() => {
    setMuted((prev) => {
      const v = !prev;
      try { localStorage.setItem(muteKey, v ? '1' : '0'); } catch { /* nada */ }
      return v;
    });
  }, [muteKey]);

  const { items, unread } = useMemo(() => {
    const all = [...bySection.averias, ...bySection.comentarios, ...bySection.cambios].sort((a, b) => b.ms - a.ms);
    const u = {
      averias: bySection.averias.filter((i) => i.ms > seen.averias).length,
      comentarios: bySection.comentarios.filter((i) => i.ms > seen.comentarios).length,
      cambios: bySection.cambios.filter((i) => i.ms > seen.cambios).length,
      total: 0,
    };
    u.total = u.averias + u.comentarios + u.cambios;
    return { items: all.slice(0, 30), unread: u };
  }, [bySection, seen]);

  return (
    <Ctx.Provider value={{ items, unread, muted, isStaff, toggleMute, markSeen, markAllSeen }}>
      {children}
    </Ctx.Provider>
  );
}

export function useNotifications() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useNotifications debe usarse dentro de NotificationsProvider');
  return ctx;
}
