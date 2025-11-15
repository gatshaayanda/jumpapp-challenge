import { NextResponse } from 'next/server';
import { firestore } from '@/utils/firebaseConfig';
import { doc, getDoc, setDoc } from 'firebase/firestore';

// GET /api/user/settings?uid=123
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const uid = searchParams.get('uid');
    if (!uid) return NextResponse.json({ error: "Missing uid" }, { status: 400 });

    const ref = doc(firestore, 'user_settings', uid);
    const snap = await getDoc(ref);

    return NextResponse.json(snap.data() || { joinMinutes: 5 });
  } catch (err) {
    return NextResponse.json({ error: "Failed to load" }, { status: 500 });
  }
}

// POST /api/user/settings
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { uid, joinMinutes } = body;

    if (!uid) return NextResponse.json({ error: "Missing uid" }, { status: 400 });

    const ref = doc(firestore, 'user_settings', uid);
    await setDoc(ref, { joinMinutes }, { merge: true });

    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ error: "Save failed" }, { status: 500 });
  }
}
