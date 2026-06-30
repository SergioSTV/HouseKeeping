'use client';
import { useEffect, useState } from 'react';
import { collection, doc, onSnapshot, query, where, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/providers/AuthProvider';
import { useHotel } from '@/providers/HotelProvider';
import {
  STATUS_PERMISSIONS, CHECKOUT_PERMISSIONS, STATUS_HEX, STATUS_LABELS, CHECKOUT_LABELS,
} from '@/lib/roles';
import { changeStatus, setCheckout, setVip, setRush, reportAveria, addComentario } from '@/lib/actions';
import type { Room, RoomStatus, CheckoutStatus } from '@/lib/types';
import { normalizeRoom } from '@/lib/roomUtils';
import { effectiveCheckout, todayKey } from '@/lib/checkout';

/* eslint-disable @typescript-eslint/no-explicit-any */
const CHECKOUTS: CheckoutStatus[] = ['ya_checkout', 'checkout_anticipado', 'late_14', 'late_18'];

function ts(v: any): string {
  return v?.toDate ? v.toDate().toLocaleString('es-ES') : '—';
}

// Ficha ampliada de una habitacion. Se abre al tocar la tarjeta (todos los roles).
export function RoomDetailModal({ room, onClose }: { room: Room; onClose: () => void }) {
  const { role, user, displayName } = useAuth();
  const { hotelId } = useHotel();
  const [live, setLive] = useState<Room>(() => normalizeRoom(room));
  const [history, setHistory] = useState<any[]>([]);
  const [averias, setAverias] = useState<any[]>([]);
  const [comentarios, setComentarios] = useState<any[]>([]);
  const [nuevo, setNuevo] = useState('');
  const [tipoComentario, setTipoComentario] = useState<'vip' | 'importante' | 'urgente'>('importante');
  const [showAveria, setShowAveria] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [pendCo, setPendCo] = useState<null | 'late_14' | 'late_18' | 'checkout_anticipado'>(null);
  const [fLate, setFLate] = useState('');
  const [fSalida, setFSalida] = useState('');
  const [fOriginal, setFOriginal] = useState('');

  const isStaff = role ? ['admin', 'governanta', 'subgovernanta', 'recepcion'].includes(role) : false;

  useEffect(() => {
    if (!hotelId) return;
    const unsubs: (() => void)[] = [];
    // La habitacion en vivo (para reflejar cambios sin cerrar la ficha)
    unsubs.push(onSnapshot(doc(db, 'hotels', hotelId, 'rooms', room.id), (d) => {
      if (d.exists()) setLive(normalizeRoom({ id: d.id, ...d.data() } as Room));
    }));
    // Historial: visible para todos los que ven el rack
    unsubs.push(onSnapshot(
      query(collection(db, 'hotels', hotelId, 'rooms', room.id, 'history'), orderBy('timestamp', 'desc')),
      (s) => setHistory(s.docs.map((d) => ({ id: d.id, ...d.data() }))),
    ));
    // Averias y comentarios de la habitacion: solo staff (las reglas lo imponen)
    if (isStaff) {
      unsubs.push(onSnapshot(
        query(collection(db, 'hotels', hotelId, 'averias'), where('roomId', '==', room.id)),
        (s) => setAverias(s.docs.map((d) => ({ id: d.id, ...d.data() }))),
      ));
      unsubs.push(onSnapshot(
        query(collection(db, 'hotels', hotelId, 'comentarios'), where('roomId', '==', room.id)),
        (s) => setComentarios(s.docs.map((d) => ({ id: d.id, ...d.data() }))),
      ));
    }
    return () => unsubs.forEach((u) => u());
  }, [hotelId, room.id, isStaff]);

  if (!role || !user || !hotelId) return null;
  const actor = { uid: user.uid, name: displayName };
  const c = STATUS_HEX[live.status];
  const statesForRole = STATUS_PERMISSIONS[role];

  async function onCheckout(co: CheckoutStatus) {
    if (co === 'late_14' || co === 'late_18') {
      setFLate(live.lateCheckoutDate ?? todayKey());
      setPendCo(co);
      return;
    }
    if (co === 'checkout_anticipado') {
      setFSalida(todayKey());
      setFOriginal('');
      setPendCo('checkout_anticipado');
      return;
    }
    await setCheckout(hotelId!, live, co, actor);
  }

  async function confirmarPend() {
    if (!pendCo) return;
    if (pendCo === 'checkout_anticipado') {
      await setCheckout(hotelId!, live, 'checkout_anticipado', actor, {
        salidaReal: fSalida || todayKey(),
        salidaOriginal: fOriginal || null,
      });
    } else {
      if (!fLate) return;
      await setCheckout(hotelId!, live, pendCo, actor, { lateCheckoutDate: fLate });
    }
    setPendCo(null);
  }

  const averiasSorted = [...averias].sort((a, b) => (b.createdAt?.seconds ?? 0) - (a.createdAt?.seconds ?? 0));
  const comentariosSorted = [...comentarios].sort((a, b) => (b.createdAt?.seconds ?? 0) - (a.createdAt?.seconds ?? 0));

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-0 sm:items-center sm:p-4" onClick={onClose}>
      <div
        className="max-h-[88vh] w-full max-w-md overflow-auto rounded-t-2xl bg-white shadow-xl sm:rounded-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Cabecera con el color del estado */}
        <div className="flex items-start justify-between gap-3 rounded-t-2xl px-5 py-4" style={{ backgroundColor: c.bg }}>
          <div>
            <div className="text-2xl font-semibold" style={{ color: c.fg }}>Habitación {live.number}</div>
            <div className="text-sm" style={{ color: c.fg, opacity: 0.8 }}>Planta {live.floor} · {STATUS_LABELS[live.status]}</div>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {live.vip && <span className="rounded-md bg-[#1f2430] px-2 py-0.5 text-xs font-medium text-white">VIP</span>}
              {effectiveCheckout(live) !== 'ninguno' && (
                <span className="rounded-md bg-white/70 px-2 py-0.5 text-xs" style={{ color: c.fg }}>
                  {CHECKOUT_LABELS[effectiveCheckout(live)]}
                  {live.lateCheckoutDate ? ` · ${live.lateCheckoutDate}` : ''}
                  {live.checkout === 'checkout_anticipado' && live.salidaReal ? ` · salió ${live.salidaReal}` : ''}
                  {live.checkout === 'checkout_anticipado' && live.salidaOriginal ? ` · original ${live.salidaOriginal}` : ''}
                </span>
              )}
            </div>
          </div>
          <button onClick={onClose} aria-label="Cerrar" className="rounded-full p-1 text-xl leading-none" style={{ color: c.fg }}>✕</button>
        </div>

        <div className="divide-y divide-gray-100 px-5">
          {/* Acciones de estado segun rol */}
          {statesForRole.length > 0 && (
            <section className="py-4">
              <h4 className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-400">Cambiar estado</h4>
              <div className="flex flex-wrap gap-1.5">
                {statesForRole.map((s: RoomStatus) => (
                  <button
                    key={s}
                    onClick={() => changeStatus(hotelId, live, s, actor)}
                    className="rounded-lg border border-gray-300 px-2.5 py-1 text-sm transition hover:border-hotel-primary hover:text-hotel-primary"
                    style={s === live.status ? { backgroundColor: STATUS_HEX[s].bg, color: STATUS_HEX[s].fg, borderColor: STATUS_HEX[s].stripe } : undefined}
                  >
                    {STATUS_LABELS[s]}
                  </button>
                ))}
              </div>
            </section>
          )}

          {/* Checkout y VIP: recepcion / admin */}
          {CHECKOUT_PERMISSIONS[role] && (
            <section className="py-4">
              <h4 className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-400">Check out</h4>
              <div className="flex flex-wrap gap-1.5">
                {CHECKOUTS.map((co) => (
                  <button
                    key={co}
                    onClick={() => onCheckout(co)}
                    className="rounded-lg border border-gray-300 px-2.5 py-1 text-sm transition hover:border-hotel-primary hover:text-hotel-primary"
                  >
                    {CHECKOUT_LABELS[co]}
                  </button>
                ))}
                {live.checkout !== 'ninguno' && (
                  <button
                    onClick={() => setCheckout(hotelId, live, 'ninguno', actor)}
                    className="rounded-lg border border-gray-300 px-2.5 py-1 text-sm transition hover:border-hotel-primary hover:text-hotel-primary"
                  >
                    Quitar check out
                  </button>
                )}
                <button
                  onClick={() => setVip(hotelId, live, !live.vip, actor)}
                  className="rounded-lg border border-gray-300 px-2.5 py-1 text-sm transition hover:border-hotel-primary hover:text-hotel-primary"
                >
                  {live.vip ? 'Quitar VIP' : 'Marcar VIP'}
                </button>
                <button
                  onClick={() => setRush(hotelId, live, !live.rush, actor)}
                  className="rounded-lg border border-gray-300 px-2.5 py-1 text-sm transition hover:border-hotel-primary hover:text-hotel-primary"
                >
                  {live.rush ? 'Quitar lobby' : 'Cliente en lobby'}
                </button>
              </div>
              {pendCo && (
                <div className="mt-3 rounded-lg border border-gray-200 bg-gray-50 p-3">
                  {pendCo === 'checkout_anticipado' ? (
                    <>
                      <label className="mb-1 block text-xs font-medium text-gray-500">Fecha en la que salió</label>
                      <input type="date" value={fSalida} onChange={(e) => setFSalida(e.target.value)} className="mb-2 w-full rounded border border-gray-300 px-2 py-1.5 text-sm" />
                      <label className="mb-1 block text-xs font-medium text-gray-500">Fecha de salida original</label>
                      <input type="date" value={fOriginal} onChange={(e) => setFOriginal(e.target.value)} className="mb-3 w-full rounded border border-gray-300 px-2 py-1.5 text-sm" />
                    </>
                  ) : (
                    <>
                      <label className="mb-1 block text-xs font-medium text-gray-500">Fecha del late check out</label>
                      <input type="date" value={fLate} onChange={(e) => setFLate(e.target.value)} className="mb-3 w-full rounded border border-gray-300 px-2 py-1.5 text-sm" />
                    </>
                  )}
                  <div className="flex gap-2">
                    <button onClick={confirmarPend} className="rounded-lg bg-hotel-primary px-3 py-1.5 text-sm font-medium text-white transition hover:opacity-90">Guardar</button>
                    <button onClick={() => setPendCo(null)} className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm">Cancelar</button>
                  </div>
                </div>
              )}
            </section>
          )}

          {/* Averias */}
          <section className="py-4">
            <div className="mb-2 flex items-center justify-between">
              <h4 className="text-xs font-semibold uppercase tracking-wide text-gray-400">Averías</h4>
              <button onClick={() => setShowAveria(true)} className="text-sm font-medium text-red-600 hover:underline">+ Reportar</button>
            </div>
            {isStaff ? (
              averiasSorted.length === 0
                ? <p className="text-sm text-gray-400">Sin averías reportadas.</p>
                : (
                  <ul className="space-y-1.5">
                    {averiasSorted.map((a) => (
                      <li key={a.id} className="rounded-lg border border-gray-100 bg-gray-50 p-2 text-sm">
                        <span className="font-medium">{a.tipo}</span>{a.grave && <span className="ml-1 text-xs text-red-600">· grave</span>}
                        <div className="text-gray-600">{a.descripcion}</div>
                        <div className="text-xs text-gray-400">{ts(a.createdAt)}</div>
                      </li>
                    ))}
                  </ul>
                )
            ) : (
              <p className="text-sm text-gray-400">Puedes reportar una avería con el botón de arriba.</p>
            )}
          </section>

          {/* Comentarios / informacion adicional: solo staff */}
          {isStaff && (
            <section className="py-4">
              <h4 className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-400">Comentarios e información</h4>
              {comentariosSorted.length === 0 && <p className="mb-2 text-sm text-gray-400">Sin comentarios.</p>}
              <ul className="mb-2 space-y-1.5">
                {comentariosSorted.map((c2) => (
                  <li key={c2.id} className="rounded-lg border border-gray-100 bg-gray-50 p-2 text-sm">
                    <span className="rounded bg-white px-1.5 py-0.5 text-xs font-medium text-gray-600">{c2.tipo}</span>
                    <span className="ml-1">{c2.texto}</span>
                    <div className="text-xs text-gray-400">{c2.creadoPor?.name}</div>
                  </li>
                ))}
              </ul>
              <div className="flex gap-1.5">
                <select value={tipoComentario} onChange={(e) => setTipoComentario(e.target.value as any)}
                  className="rounded-lg border border-gray-300 px-2 py-1.5 text-sm">
                  <option value="importante">Importante</option>
                  <option value="urgente">Urgente</option>
                  <option value="vip">VIP</option>
                </select>
                <input value={nuevo} onChange={(e) => setNuevo(e.target.value)} placeholder="Añadir comentario…"
                  className="flex-1 rounded-lg border border-gray-300 px-2 py-1.5 text-sm outline-none focus:border-hotel-primary" />
                <button
                  onClick={async () => {
                    if (!nuevo.trim()) return;
                    await addComentario(hotelId, live, nuevo.trim(), tipoComentario, tipoComentario === 'urgente', actor);
                    setNuevo('');
                  }}
                  className="rounded-lg bg-hotel-primary px-3 py-1.5 text-sm font-medium text-white"
                >
                  Añadir
                </button>
              </div>
              <p className="mt-1 text-xs text-gray-400">Los comentarios urgentes avisan a Governanta por notificación.</p>
            </section>
          )}

          {/* Historial (plegable) */}
          <section className="py-4">
            <button
              onClick={() => setShowHistory((v) => !v)}
              className="flex w-full items-center justify-between text-xs font-semibold uppercase tracking-wide text-gray-400"
            >
              <span>Historial de acciones{history.length ? ` · ${history.length}` : ''}</span>
              <span className="rounded-md border border-gray-200 px-2 py-0.5 text-[11px] normal-case text-gray-500">
                {showHistory ? 'Ocultar' : 'Ver'}
              </span>
            </button>
            {showHistory && (
              history.length === 0
                ? <p className="mt-2 text-sm text-gray-400">Sin cambios registrados.</p>
                : (
                  <ul className="mt-2 space-y-1.5">
                    {history.map((h) => (
                      <li key={h.id} className="text-sm">
                        <span className="font-medium">{h.userName}</span>
                        <span className="text-gray-400"> · {ts(h.timestamp)}</span>
                        <div className="text-gray-600">{h.action}: {h.fromStatus} → {h.toStatus}</div>
                      </li>
                    ))}
                  </ul>
                )
            )}
          </section>
        </div>
      </div>

      {showAveria && (
        <AveriaDialog
          onClose={() => setShowAveria(false)}
          onSubmit={async (tipo, desc, grave) => {
            await reportAveria(hotelId, live, tipo, desc, grave, actor);
            setShowAveria(false);
          }}
        />
      )}
    </div>
  );
}

function AveriaDialog({
  onClose, onSubmit,
}: {
  onClose: () => void;
  onSubmit: (tipo: string, desc: string, grave: boolean) => void;
}) {
  const [tipo, setTipo] = useState('');
  const [desc, setDesc] = useState('');
  const [grave, setGrave] = useState(false);

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 p-4" onClick={(e) => { e.stopPropagation(); onClose(); }}>
      <div className="w-full max-w-sm rounded-xl bg-white p-5 shadow-lg" onClick={(e) => e.stopPropagation()}>
        <h3 className="mb-3 font-semibold">Reportar avería</h3>
        <input value={tipo} onChange={(e) => setTipo(e.target.value)} placeholder="Tipo (ej. fontanería, TV, AA)"
          className="mb-2 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-hotel-primary" />
        <textarea value={desc} onChange={(e) => setDesc(e.target.value)} placeholder="Descripción"
          className="mb-2 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-hotel-primary" />
        <label className="mb-3 flex items-center gap-2 text-sm">
          <input type="checkbox" checked={grave} onChange={(e) => setGrave(e.target.checked)} />
          Avería grave (bloquea la habitación)
        </label>
        <div className="flex justify-end gap-2">
          <button onClick={onClose} className="rounded-lg px-3 py-1.5 text-sm hover:bg-gray-100">Cancelar</button>
          <button onClick={() => onSubmit(tipo || 'Sin tipo', desc, grave)}
            className="rounded-lg bg-hotel-primary px-3 py-1.5 text-sm font-medium text-white">Enviar</button>
        </div>
      </div>
    </div>
  );
}
