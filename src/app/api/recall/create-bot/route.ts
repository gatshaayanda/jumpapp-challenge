// src/app/api/recall/create-bot/route.ts
import { NextResponse } from "next/server";
export const runtime = "nodejs";

import { cert, getApps, initializeApp } from "firebase-admin/app";
import { getFirestore, FieldValue } from "firebase-admin/firestore";
import { planJoinTimes } from "@/utils/recall";

function adminDb() {
  const app =
    getApps()[0] ??
    initializeApp({
      credential: cert(JSON.parse(process.env.FIREBASE_ADMIN_KEY!)),
    });
  return getFirestore(app);
}

type Body = {
  joinUrl: string;
  startTime: string;
  userId: string;
  eventId: string;
  summary?: string;
  attendees?: string[];
  sourceEmail?: string;
  accountId?: string;
};

const DEFAULT_LEAD_MIN = Number(
  process.env.RECALL_LEAD_MINUTES_DEFAULT ?? 5
);

async function getLeadMinutes(
  db: FirebaseFirestore.Firestore,
  userId: string
) {
  try {
    const us = await db.collection("user_settings").doc(userId).get();
    if (us.exists) {
      const v = Number(us.data()?.joinMinutes);
      if (Number.isFinite(v) && v >= 0) return v;
    }

    const pref = await db.collection("notetaker_prefs").doc(userId).get();
    if (pref.exists) {
      const data = pref.data() || {};
      const v = Number(data.leadMinutes ?? data.joinMinutes);
      if (Number.isFinite(v) && v >= 0) return v;
    }
  } catch {}

  return DEFAULT_LEAD_MIN;
}

function detectPlatform(u: string) {
  const x = u.toLowerCase();
  if (x.includes("zoom.us")) return "zoom";
  if (x.includes("meet.google.com")) return "meet";
  if (x.includes("teams.microsoft.com")) return "teams";
  return "other";
}

export async function POST(req: Request) {
  const db = adminDb();

  try {
    const body = (await req.json()) as Body;

    const { joinUrl, startTime, userId, eventId, summary, attendees } = body;
    if (!joinUrl || !startTime || !userId || !eventId) {
      return NextResponse.json(
        { error: "Missing joinUrl, startTime, userId, or eventId" },
        { status: 400 }
      );
    }

    // check idempotency
    const metaRef = db.collection("meeting_metadata").doc(eventId);
    const existing = await metaRef.get();
    if (existing.exists && existing.data()?.botId) {
      return NextResponse.json({
        botId: existing.data()!.botId,
        reused: true,
      });
    }

    const leadMin = await getLeadMinutes(db, userId);
    const { desiredIso, actualJoinAtIso, isLate, mode } =
      planJoinTimes(startTime, leadMin);

    const region = process.env.RECALL_REGION || "us-west-2";
    const rec = await fetch(`https://${region}.recall.ai/api/v1/bot`, {
      method: "POST",
      headers: {
        Authorization: `Token ${process.env.RECALL_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        meeting_url: joinUrl,
        join_at: actualJoinAtIso,
        metadata: { eventId, userId },
        bot_name: "Jump Challenge Notetaker",
        recording_config: {
          transcript: { provider: { meeting_captions: {} } },
        },
      }),
    });

    const json = await rec.json();
    if (!rec.ok) {
      return NextResponse.json(
        { error: json?.error ?? "recall_create_failed" },
        { status: 400 }
      );
    }

    const botId = json.id;
    const platform = detectPlatform(joinUrl);

    const baseData = {
      botId,
      userId,
      eventId,
      platform,
      joinUrl,
      startTime,
      plannedJoinAt: desiredIso,
      joinAt: actualJoinAtIso,
      createdAt: FieldValue.serverTimestamp(),
      attendees: attendees ?? [],
      title: summary ?? null,
      processed: false,
      transcriptReady: false,
      status: "scheduled",
      mode,
      leadMinutes: leadMin,
      raw: json,
    };

    // Write to BOTH:
    await db.collection("recall_bots").doc(botId).set(baseData);
    await db.collection("meeting_metadata").doc(eventId).set(baseData, { merge: true });
    await db.collection("meetings_v2").doc(eventId).set(baseData, { merge: true });

    return NextResponse.json({
      botId,
      joinAt: actualJoinAtIso,
      plannedJoinAt: desiredIso,
      isLate,
    });
  } catch (e: any) {
    return NextResponse.json(
      { error: e?.message || "internal_error" },
      { status: 500 }
    );
  }
}
