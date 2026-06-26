'use client';
import { useEffect, useState } from 'react';
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase';

interface Entry {
  id: string; action: string; fromStatus: string; toStatus: string;
  userName: string; timestamp?: { toDate: () => Date };
}

// Historial accesible desde el icono de 3 puntitos de cada habitacion.
export function RoomHistory({ hotelId, roomId, onClose }: { hotelId: string; roomId: string; onClose: () => void }) {
  const [entries, setEntries] = useState<Entry[]>([]);

  useEffect(() => {
    const q = query(
      collection(db, 'hotels', hotelId, 'rooms', roomId, 'history'),
      orderBy('timestamp', 'desc'),
    );
    return onSnapshot(q, (snap) => {
      setEntries(snap.docs.map((d) => ({ id: d.id, ...d.data() } as Entry)));
    });
  }, [hotelId, roomId]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <div className="max-h-[80vh] w-full max-w-md overflow-auto rounded-lg bg-white p-4" onClick={(e) => e.stopPropagation()}>
        <div className="mb-3 flex items-center justify-between">
          <h3 className="font-semibold">Historial · habitacion {roomId}</h3>
          <button onClick={onClose} aria-label="Cerrar">✕</button>
        </div>
        {entries.length === 0 && <p className="text-sm text-gray-500">Sin cambios registrados todavia.</p>}
        <ul className="space-y-2">
          {entries.map((e) => (
            <li key={e.id} className="rounded border border-gray-200 p-2 text-sm">
              <span className="font-medium">{e.userName}</span>
              {' · '}
              {e.timestamp ? e.timestamp.toDate().toLocaleString('es-ES') : '—'}
              <div className="text-gray-600">
                {e.action}: {e.fromStatus} → {e.toStatus}
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
