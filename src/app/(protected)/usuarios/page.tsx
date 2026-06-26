'use client';
import { useEffect, useState } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { httpsCallable, getFunctions } from 'firebase/functions';
import { db, app } from '@/lib/firebase';
import { useHotel } from '@/providers/HotelProvider';
import { ROLE_LABELS } from '@/lib/roles';
import type { AppUser, Role } from '@/lib/types';

const ROLES: Role[] = ['admin', 'governanta', 'subgovernanta', 'recepcion', 'camarera'];

export default function UsuariosPage() {
  const { hotels } = useHotel();
  const [users, setUsers] = useState<AppUser[]>([]);
  const [email, setEmail] = useState('');
  const [nombre, setNombre] = useState('');
  const [role, setRole] = useState<Role>('camarera');
  const [asignados, setAsignados] = useState<string[]>([]);
  const [msg, setMsg] = useState('');

  async function cargar() {
    const snap = await getDocs(collection(db, 'users'));
    setUsers(snap.docs.map((d) => ({ uid: d.id, ...d.data() } as AppUser)));
  }
  useEffect(() => { cargar(); }, []);

  async function crear() {
    setMsg('Creando…');
    try {
      const fn = httpsCallable(getFunctions(app, 'europe-west1'), 'crearUsuario');
      const res = await fn({ email, displayName: nombre, role, assignedHotels: asignados });
      // @ts-expect-error data dinamica
      setMsg(`Usuario creado. Contrasena por defecto enviada. UID: ${res.data.uid}`);
      setEmail(''); setNombre(''); setAsignados([]);
      cargar();
    } catch (e) {
      setMsg('Error: ' + (e as Error).message);
    }
  }

  function toggleHotel(id: string) {
    setAsignados((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]);
  }

  return (
    <div>
      <h1 className="mb-4 text-xl font-semibold">Usuarios</h1>

      <div className="mb-6 rounded-lg border border-gray-200 bg-white p-4">
        <h2 className="mb-3 font-medium">Dar de alta</h2>
        <div className="grid gap-2 sm:grid-cols-2">
          <input value={nombre} onChange={(e) => setNombre(e.target.value)} placeholder="Nombre"
            className="rounded border border-gray-300 px-2 py-1.5 text-sm" />
          <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Correo" type="email"
            className="rounded border border-gray-300 px-2 py-1.5 text-sm" />
          <select value={role} onChange={(e) => setRole(e.target.value as Role)}
            className="rounded border border-gray-300 px-2 py-1.5 text-sm">
            {ROLES.map((r) => <option key={r} value={r}>{ROLE_LABELS[r]}</option>)}
          </select>
        </div>

        <div className="mt-3">
          <div className="mb-1 text-sm text-gray-600">Hoteles donde puede modificar:</div>
          <div className="flex flex-wrap gap-3">
            {hotels.map((h) => (
              <label key={h.id} className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={asignados.includes(h.id)} onChange={() => toggleHotel(h.id)} />
                {h.name}
              </label>
            ))}
          </div>
        </div>

        <button onClick={crear} className="mt-3 rounded bg-hotel-primary px-3 py-1.5 text-sm font-medium text-white">
          Crear con contrasena por defecto
        </button>
        {msg && <p className="mt-2 text-sm text-gray-600">{msg}</p>}
      </div>

      <div className="overflow-auto rounded-lg border border-gray-200 bg-white">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-left">
            <tr><th className="px-3 py-2">Nombre</th><th className="px-3 py-2">Rol</th><th className="px-3 py-2">Hoteles</th><th className="px-3 py-2">Estado</th></tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.uid} className="border-t border-gray-100">
                <td className="px-3 py-2">{u.displayName}<div className="text-xs text-gray-400">{u.email}</div></td>
                <td className="px-3 py-2">{ROLE_LABELS[u.role]}</td>
                <td className="px-3 py-2">{(u.assignedHotels ?? []).join(', ')}</td>
                <td className="px-3 py-2">{u.active ? 'Alta' : 'Baja'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
