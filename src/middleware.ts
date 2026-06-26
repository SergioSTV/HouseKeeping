import { NextResponse, type NextRequest } from 'next/server';
import { canAccess } from '@/lib/roles';
import type { Role } from '@/lib/types';

// Primera barrera de routing (servidor). La proteccion real son las reglas de Firestore.
export function middleware(req: NextRequest) {
  const role = req.cookies.get('role')?.value as Role | undefined;
  const path = req.nextUrl.pathname;

  if (!role) return NextResponse.redirect(new URL('/login', req.url));
  if (!canAccess(path, role)) return NextResponse.redirect(new URL('/rack', req.url));
  return NextResponse.next();
}

export const config = {
  matcher: ['/dashboard/:path*', '/rack/:path*', '/averias/:path*', '/comentarios/:path*', '/usuarios/:path*'],
};
