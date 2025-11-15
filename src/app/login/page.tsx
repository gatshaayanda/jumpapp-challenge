import { NextResponse } from 'next/server';
import { getAuth } from 'firebase-admin/auth';



export async function POST(req: Request) {
  try {
    const { token } = await req.json();

    const decoded = await getAuth().verifyIdToken(token);

    const res = NextResponse.json({ ok: true });

    res.cookies.set({
      name: "firebase_session",
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24, // 1 day
    });

    return res;
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
  }
}
