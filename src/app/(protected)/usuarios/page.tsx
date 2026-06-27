'use client';
import { useEffect, useState } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { httpsCallable, getFunctions } from 'firebase/functions';
import { db, app } from '@/lib/firebase';
import { useHotel } from '@/providers/HotelProvider';
import { ROLE_LABELS } from '@/lib/roles';
import { toEmail, toUsername } from '@/lib/config';
import type { AppUser, Role } from '@/lib/types';

/* eslint-disable @typescript-eslint/no-explicit-any */
const ROLES: Role[] = ['admin', 'governanta', 'subgovernanta', 'recepcion', 'camarera'];
const fns = () => getFunctions(app, 'europe-west1');

export default function UsuariosPage() {
  const { hotels } = useHotel();
  const [users, setUsers] = useState<AppUser[]>([]);
  const [usuario, setUsuario] = useState('');
  const [nombre, setNombre] = useState('');
  const [role, setRole] = useState<Role>('camarera');
  const [asignados, setAsignados] = useState<string[]>([]);
  const [msg, setMsg] = useState('');
  const [editing, setEditing] = useState<AppUser | null>(null);

  async function cargar() {
    const snap = await getDocs(collection(db, 'users'));
    setUsers(snap.docs.map((d) => ({ uid: d.id, ...d.data() } as AppUser)));
  }
  useEffect(() => { cargar(); }, []);

  async function crear() {
    setMsg('Creando…');
    try {
      const fn = httpsCallable(fns(), 'crearUsuario');
      const res: any = await fn({ email: toEmail(usuario), displayName: nombre, role, assignedHotels: asignados });
      setMsg(`Usuario creado. Contraseña por defecto: SalouPark2026! (UID ${res.data.uid})`);
      setUsuario(''); setNombre(''); setAsignados([]);
      cargar();
    } catch (e: any) {
      setMsg('Error: ' + (e?.message || 'no se pudo crear'));
    }
  }

  async function resetear(u: AppUser) {
    if (!confirm(`¿Restablecer la contraseña de ${u.displayName} a la de por defecto?`)) return;
    try {
      const fn = httpsCallable(fns(), 'resetearContrasena');
      const res: any = await fn({ uid: u.uid });
      setMsg(`Contraseña de ${u.displayName} restablecida a: ${res.data.password}. Tendrá que cambiarla al entrar.`);
      cargar();
    } catch (e: any) {
      setMsg('Error: ' + (e?.message || 'no se pudo restablecer'));
    }
  }

  async function toggleBaja(u: AppUser) {
    const accion = u.active ? 'darDeBajaUsuario' : 'reactivarUsuario';
    if (!confirm(`¿${u.active ? 'Dar de baja' : 'Reactivar'} a ${u.displayName}?`)) return;
    try {
      await httpsCallable(fns(), accion)({ uid: u.uid });
      setMsg(`${u.displayName} ${u.active ? 'dado de baja' : 'reactivado'}.`);
      cargar();
    } catch (e: any) {
      setMsg('Error: ' + (e?.message || 'no se pudo'));
    }
  }

  function toggleHotel(id: string) {
    setAsignados((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]);
  }

  return (
    <div>
      <h1 className="mb-4 text-xl font-semibold">Usuarios</h1>

      <div className="mb-6 rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
        <h2 className="mb-3 font-medium">Dar de alta</h2>
        <div className="grid gap-2 sm:grid-cols-2">
          <input value={nombre} onChange={(e) => setNombre(e.target.value)} placeholder="Nombre"
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-hotel-primary" />
          <input value={usuario} onChange={(e) => setUsuario(e.target.value)} placeholder="Usuario (ej. maria)"
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-hotel-primary" />
          <select value={role} onChange={(e) => setRole(e.target.value as Role)}
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm">
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
        <button onClick={crear} className="mt-3 rounded-lg bg-hotel-primary px-3 py-2 text-sm font-medium text-white">
          Crear con contraseña por defecto
        </button>
        {msg && <p className="mt-2 text-sm text-gray-600">{msg}</p>}
      </div>

      <div className="overflow-auto rounded-xl border border-gray-200 bg-white shadow-sm">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-left">
            <tr>
              <th className="px-3 py-2">Nombre</th>
              <th className="px-3 py-2">Rol</th>
              <th className="px-3 py-2">Hoteles</th>
              <th className="px-3 py-2">Estado</th>
              <th className="px-3 py-2 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.uid} className="border-t border-gray-100">
                <td className="px-3 py-2">{u.displayName}<div className="text-xs text-gray-400">{toUsername(u.email)}</div></td>
                <td className="px-3 py-2">{ROLE_LABELS[u.role]}</td>
                <td className="px-3 py-2">{(u.assignedHotels ?? []).join(', ') || '—'}</td>
                <td className="px-3 py-2">
                  <span className={`rounded px-2 py-0.5 text-xs font-medium ${u.active ? 'bg-green-100 text-green-800' : 'bg-gray-200 text-gray-600'}`}>
                    {u.active ? 'Alta' : 'Baja'}
                  </span>
                </td>
                <td className="px-3 py-2">
                  <div className="flex flex-wrap justify-end gap-1.5">
                    <button onClick={() => setEditing(u)} className="rounded-md border border-gray-300 px-2 py-1 text-xs hover:bg-gray-50">Editar</button>
                    <button onClick={() => resetear(u)} className="rounded-md border border-gray-300 px-2 py-1 text-xs hover:bg-gray-50">Resetear contraseña</button>
                    <button onClick={() => toggleBaja(u)} className={`rounded-md border px-2 py-1 text-xs ${u.active ? 'border-red-200 text-red-700 hover:bg-red-50' : 'border-green-200 text-green-700 hover:bg-green-50'}`}>
                      {u.active ? 'Dar de baja' : 'Reactivar'}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {editing && (
        <EditarUsuario
          user={editing}
          hotels={hotels}
          onClose={() => setEditing(null)}
          onSaved={(m) => { setMsg(m); setEditing(null); cargar(); }}
        />
      )}
    </div>
  );
}

function EditarUsuario({
  user, hotels, onClose, onSaved,
}: {
  user: AppUser;
  hotels: { id: string; name: string }[];
  onClose: () => void;
  onSaved: (msg: string) => void;
}) {
  const [role, setRole] = useState<Role>(user.role);
  const [asignados, setAsignados] = useState<string[]>(user.assignedHotels ?? []);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  function toggle(id: string) {
    setAsignados((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]);
  }

  async function guardar() {
    setSaving(true); setError('');
    try {
      await httpsCallable(getFunctions(app, 'europe-west1'), 'actualizarHotelesUsuario')({
        uid: user.uid, role, assignedHotels: asignados,
      });
      onSaved(`${user.displayName} actualizado. El cambio se aplica en su próximo acceso.`);
    } catch (e: any) {
      setError(e?.message || 'No se pudo guardar.');
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <div className="w-full max-w-sm rounded-xl bg-white p-5 shadow-lg" onClick={(e) => e.stopPropagation()}>
        <h3 className="mb-3 font-semibold">Editar {user.displayName}</h3>
        <label className="mb-1 block text-sm text-gray-600">Rol</label>
        <select value={role} onChange={(e) => setRole(e.target.value as Role)}
          className="mb-3 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm">
          {(['admin', 'governanta', 'subgovernanta', 'recepcion', 'camarera'] as Role[]).map((r) => (
            <option key={r} value={r}>{ROLE_LABELS[r]}</option>
          ))}
        </select>
        <div className="mb-1 text-sm text-gray-600">Hoteles donde puede modificar:</div>
        <div className="mb-3 flex flex-wrap gap-3">
          {hotels.map((h) => (
            <label key={h.id} className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={asignados.includes(h.id)} onChange={() => toggle(h.id)} />
              {h.name}
            </label>
          ))}
        </div>
        {error && <p className="mb-2 text-sm text-red-600">{error}</p>}
        <div className="flex justify-end gap-2">
          <button onClick={onClose} className="rounded-lg px-3 py-1.5 text-sm hover:bg-gray-100">Cancelar</button>
          <button onClick={guardar} disabled={saving} className="rounded-lg bg-hotel-primary px-3 py-1.5 text-sm font-medium text-white disabled:opacity-60">
            {saving ? 'Guardando…' : 'Guardar'}
          </button>
        </div>
      </div>
    </div>
  );
}
