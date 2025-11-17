// src/app/api/user/settings/route.ts
import { NextResponse } from "next/server";
export const runtime = "nodejs";

import { cert, getApps, initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

function adminDb() {
  const app =
    getApps()[0] ??
    initializeApp({
      credential: cert(JSON.parse(process.env.FIREBASE_ADMIN_KEY!)),
    });
  return getFirestore(app);
}

// GET /api/user/settings?uid=123
export async function GET(req: Request) {
  const db = adminDb();

  try {
    const { searchParams } = new URL(req.url);
    const uid = searchParams.get("uid");
    if (!uid) {
      return NextResponse.json({ error: "Missing uid" }, { status: 400 });
    }

    const snap = await db.collection("user_settings").doc(uid).get();
    const data = snap.data() || { joinMinutes: 5 };

    return NextResponse.json(data);
  } catch (err: any) {
    console.error("user/settings GET error", err);
    return NextResponse.json({ error: "Failed to load" }, { status: 500 });
  }
}

// POST /api/user/settings
export async function POST(req: Request) {
  const db = adminDb();

  try {
    const body = await req.json();
    const { uid, joinMinutes } = body;

    if (!uid) {
      return NextResponse.json({ error: "Missing uid" }, { status: 400 });
    }

    await db
      .collection("user_settings")
      .doc(uid)
      .set({ joinMinutes: Number(joinMinutes) || 5 }, { merge: true });

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("user/settings POST error", err);
    return NextResponse.json({ error: "Save failed" }, { status: 500 });
  }
}
