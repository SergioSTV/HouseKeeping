'use client';
import { useAuth } from '@/providers/AuthProvider';
import type { Role } from '@/lib/types';

// Oculta UI segun rol. OJO: es solo experiencia de usuario.
// La proteccion real esta en firestore.rules (servidor).
export function RoleGate({ allow, children }: { allow: Role[]; children: React.ReactNode }) {
  const { role } = useAuth();
  if (!role || !allow.includes(role)) return null;
  return <>{children}</>;
}
