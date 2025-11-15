import { NextResponse } from "next/server";
import { adminDb } from "@/utils/firebaseAdmin";

const RECALL_API = "https://api.recall.ai/api/v1/bots";

export async function GET() {
  try {
    // Load all user documents that may contain bots
    const usersSnap = await adminDb.collection("users").get();

    const tasks: Promise<any>[] = [];

    usersSnap.forEach((userDoc) => {
      const data = userDoc.data();
      const botMap = data.botIds || {};

      for (const [eventId, bot] of Object.entries(botMap)) {
        const botId = (bot as any).botId;
        const processed = (bot as any).processed || false;

        if (!botId || processed) continue;

        // Poll each bot separately
        tasks.push(
          checkBotStatus(userDoc.id, eventId, botId as string)
        );
      }
    });

    await Promise.all(tasks);

    return NextResponse.json({ ok: true, polled: tasks.length });
  } catch (err) {
    console.error("POLL ERROR", err);
    return NextResponse.json({ error: "poll failed" }, { status: 500 });
  }
}

// ───────────────────────────────────────────────────────────────
// HELPERS
// ───────────────────────────────────────────────────────────────

async function checkBotStatus(uid: string, eventId: string, botId: string) {
  try {
    const resp = await fetch(`${RECALL_API}/${botId}`, {
      headers: {
        Authorization: `Token ${process.env.RECALL_API_KEY}`,
        "Content-Type": "application/json",
      },
    });

    if (!resp.ok) throw new Error("Recall bot fetch failed");

    const json = await resp.json();

    // If media isn't ready, skip
    if (!json.meeting || !json.meeting?.media?.length) {
      return;
    }

    // Mark as processed so we don't poll this bot again
    await adminDb
      .collection("users")
      .doc(uid)
      .set(
        { botIds: { [eventId]: { botId, processed: true } } },
        { merge: true }
      );

    // Trigger transcript fetch route
    await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/recall/fetch-transcript`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        uid,
        eventId,
        botId,
        media: json.meeting.media,
      }),
    });
  } catch (e) {
    console.error("Poll bot error:", botId, e);
  }
}
