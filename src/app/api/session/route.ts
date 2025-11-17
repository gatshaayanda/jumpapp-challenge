import { NextResponse } from 'next/server';
import { adminAuth } from '@/utils/firebaseAdmin';

export async function POST(req: Request) {
  try {
    const { token } = await req.json();

    if (!token) {
      return NextResponse.json({ error: 'Missing token' }, { status: 400 });
    }

    // Verify Firebase ID token from client
    await adminAuth.verifyIdToken(token);

    const res = NextResponse.json({ ok: true });

    // Set cookie for server-side dashboard checks
    res.cookies.set({
      name: 'firebase_session',
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24,
      path: '/',
    });

    return res;
  } catch (err) {
    console.error('SESSION ERROR', err);
    return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
  }
}
