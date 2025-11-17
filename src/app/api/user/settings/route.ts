// src/app/api/user/settings/route.ts
import { NextResponse } from "next/server";
export const runtime = "nodejs";

import { cert, getApps, initializeApp } from "firebase-admin/app";
import { getFirestore, FieldValue } from "firebase-admin/firestore";

function db() {
  const app =
    getApps()[0] ??
    initializeApp({
      credential: cert(JSON.parse(process.env.FIREBASE_ADMIN_KEY!)),
    });
  return getFirestore(app);
}

// GET /api/user/settings?uid=123
export async function GET(req: Request) {
  try {
    const d = db();
    const { searchParams } = new URL(req.url);
    const uid = searchParams.get("uid");
    if (!uid) {
      return NextResponse.json({ error: "Missing uid" }, { status: 400 });
    }

    // Default lead if nothing saved
    let joinMinutes = Number(process.env.RECALL_LEAD_MINUTES_DEFAULT ?? 10);

    const snap = await d.collection("user_settings").doc(uid).get();
    if (snap.exists) {
      const v = Number(snap.data()?.joinMinutes);
      if (Number.isFinite(v) && v >= 0) joinMinutes = v;
    }

    const userDoc = await d.collection("users").doc(uid).get();
    const userData = userDoc.exists ? userDoc.data() || {} : {};

    const normalizeTimestamp = (value: unknown) => {
      if (!value) return null;
      if (typeof value === "number") {
        return new Date(value).toISOString();
      }
      if (typeof value?.toDate === "function") {
        return value.toDate().toISOString();
      }
      return null;
    };

    const connections = {
      linkedin: userData.linkedin?.accessToken
        ? {
            name: userData.linkedin?.name ?? null,
            connectedAt: normalizeTimestamp(userData.linkedin?.connectedAt),
          }
        : null,
      facebook: userData.facebook?.accessToken
        ? {
          pageName: userData.facebook?.pageName ?? null,
          connectedAt: normalizeTimestamp(userData.facebook?.connectedAt),
        }
        : null,
    };

    return NextResponse.json({ joinMinutes, connections });
  } catch (err) {
    console.error("GET /api/user/settings error", err);
    return NextResponse.json({ error: "Failed to load" }, { status: 500 });
  }
}

// POST /api/user/settings
export async function POST(req: Request) {
  try {
    const d = db();
    const body = await req.json();
    const uid = body?.uid as string;
    const jm = Number(body?.joinMinutes);

    if (!uid || !Number.isFinite(jm) || jm < 0 || jm > 60) {
      return NextResponse.json(
        { error: "Invalid uid/joinMinutes" },
        { status: 400 }
      );
    }

    await d.collection("user_settings").doc(uid).set(
      {
        joinMinutes: jm,
        updatedAt: FieldValue.serverTimestamp(),
      },
      { merge: true }
    );

    return NextResponse.json({ success: true, joinMinutes: jm });
  } catch (err) {
    console.error("POST /api/user/settings error", err);
    return NextResponse.json({ error: "Save failed" }, { status: 500 });
  }
}

