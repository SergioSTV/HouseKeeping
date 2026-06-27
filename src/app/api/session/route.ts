import { NextResponse, type NextRequest } from 'next/server';
import { getAdminAuth } from '@/lib/firebaseAdmin';

export const runtime = 'nodejs';

// Verifica el ID token de Firebase y sella cookies (rol) que lee el middleware.
export async function POST(req: NextRequest) {
  try {
    const { idToken } = await req.json();
    const decoded = await getAdminAuth().verifyIdToken(idToken);
    const role = (decoded.role as string) ?? '';

    const res = NextResponse.json({ ok: true, role });
    const secure = process.env.NODE_ENV === 'production';
    const common = { httpOnly: true, secure, sameSite: 'lax' as const, path: '/', maxAge: 60 * 60 * 8 };
    res.cookies.set('session', idToken, common);
    res.cookies.set('role', role, { ...common, httpOnly: false }); // el middleware lo lee
    return res;
  } catch {
    return NextResponse.json({ ok: false }, { status: 401 });
  }
}

export async function DELETE() {
  const res = NextResponse.json({ ok: true });
  res.cookies.delete('session');
  res.cookies.delete('role');
  return res;
}
