'use client';
import {
  createContext, useContext, useEffect, useState, type ReactNode,
} from 'react';
import { onIdTokenChanged, signOut, type User } from 'firebase/auth';
import { doc, onSnapshot } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import type { Role } from '@/lib/types';

interface AuthState {
  user: User | null;
  role: Role | null;
  assignedHotels: string[];
  displayName: string;
  mustChangePassword: boolean | null;
  loading: boolean;
  logout: () => Promise<void>;
}

const Ctx = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [role, setRole] = useState<Role | null>(null);
  const [assignedHotels, setAssignedHotels] = useState<string[]>([]);
  const [displayName, setDisplayName] = useState('');
  const [mustChangePassword, setMustChangePassword] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // onIdTokenChanged tambien salta cuando el token se refresca (cada hora),
    // momento en que renovamos la cookie de sesion para que el middleware no caduque.
    return onIdTokenChanged(auth, async (u) => {
      if (u) {
        const token = await u.getIdTokenResult();
        setUser(u);
        setRole((token.claims.role as Role) ?? null);
        setAssignedHotels((token.claims.hotels as string[]) ?? []);
        setDisplayName(u.displayName ?? u.email ?? '');
        try {
          await fetch('/api/session', {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ idToken: token.token }),
          });
        } catch { /* sin red: la cookie anterior sigue valida */ }
      } else {
        setUser(null);
        setRole(null);
        setAssignedHotels([]);
        setDisplayName('');
        setMustChangePassword(null);
      }
      setLoading(false);
    });
  }, []);

  // Sigue el flag mustChangePassword del documento del usuario en tiempo real.
  useEffect(() => {
    if (!user) { setMustChangePassword(null); return; }
    const unsub = onSnapshot(doc(db, 'users', user.uid), (d) => {
      setMustChangePassword(d.exists() ? !!d.data().mustChangePassword : false);
    }, () => setMustChangePassword(false));
    return () => unsub();
  }, [user]);

  async function logout() {
    await signOut(auth);
    await fetch('/api/session', { method: 'DELETE' });
    window.location.href = '/login';
  }

  return (
    <Ctx.Provider value={{ user, role, assignedHotels, displayName, mustChangePassword, loading, logout }}>
      {children}
    </Ctx.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useAuth debe usarse dentro de AuthProvider');
  return ctx;
}
