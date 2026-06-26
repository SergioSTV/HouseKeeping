'use client';
import {
  createContext, useContext, useEffect, useState, type ReactNode,
} from 'react';
import { onAuthStateChanged, signOut, type User } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import type { Role } from '@/lib/types';

interface AuthState {
  user: User | null;
  role: Role | null;
  assignedHotels: string[];
  displayName: string;
  loading: boolean;
  logout: () => Promise<void>;
}

const Ctx = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [role, setRole] = useState<Role | null>(null);
  const [assignedHotels, setAssignedHotels] = useState<string[]>([]);
  const [displayName, setDisplayName] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    return onAuthStateChanged(auth, async (u) => {
      if (u) {
        // Los claims (rol y hoteles) viajan dentro del ID token.
        const token = await u.getIdTokenResult();
        setUser(u);
        setRole((token.claims.role as Role) ?? null);
        setAssignedHotels((token.claims.hotels as string[]) ?? []);
        setDisplayName(u.displayName ?? u.email ?? '');
      } else {
        setUser(null);
        setRole(null);
        setAssignedHotels([]);
        setDisplayName('');
      }
      setLoading(false);
    });
  }, []);

  async function logout() {
    await signOut(auth);
    await fetch('/api/session', { method: 'DELETE' });
    window.location.href = '/login';
  }

  return (
    <Ctx.Provider value={{ user, role, assignedHotels, displayName, loading, logout }}>
      {children}
    </Ctx.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useAuth debe usarse dentro de AuthProvider');
  return ctx;
}
