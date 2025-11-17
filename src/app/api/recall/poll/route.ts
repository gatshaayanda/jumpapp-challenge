import { NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { adminDb } from "@/utils/firebaseAdmin";

export const runtime = "nodejs";

const REGION = process.env.RECALL_REGION || "us-west-2";
const API_KEY = process.env.RECALL_API_KEY!;
const OPENAI_API_KEY = process.env.OPENAI_API_KEY!;

/* -------------------------------------------------------
   Fetch bot status
------------------------------------------------------- */
async function fetchBot(botId: string) {
  const res = await fetch(`https://${REGION}.recall.ai/api/v1/bot/${botId}`, {
    headers: {
      Authorization: `Token ${API_KEY}`,
      accept: "application/json",
    },
  });

  if (!res.ok) return null;
  return res.json();
}

/* -------------------------------------------------------
   Extract transcript URL
------------------------------------------------------- */
function getTranscriptUrl(bot: any) {
  const r = bot?.recordings?.[0];
  const m =
    r?.media_shortcuts?.transcript ??
    r?.media_shortcuts?.transcript_async ??
    null;

  return m?.data?.download_url ?? null;
}

/* -------------------------------------------------------
   Download + flatten transcript
------------------------------------------------------- */
function flatten(x: any): string {
  if (!x) return "";
  if (typeof x === "string") return x;
  if (Array.isArray(x)) return x.map(flatten).join("\n");
  if (typeof x === "object") {
    const text = x.text ?? x.caption ?? x.value;
    if (typeof text === "string") return text;
    return Object.values(x).map(flatten).join("\n");
  }
  return "";
}

async function downloadTranscript(bot: any) {
  const url = getTranscriptUrl(bot);
  if (!url) return null;

  const res = await fetch(url, {
    headers: { Authorization: `Token ${API_KEY}` },
  });

  if (!res.ok) return null;

  let raw = await res.text();
  let text = raw;

  try {
    const parsed = JSON.parse(raw);
    text = flatten(parsed).trim();
  } catch {}

  return { raw, text };
}

/* -------------------------------------------------------
   AI Helpers
------------------------------------------------------- */

async function ai(prompt: string, maxTokens = 400) {
  const r = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${OPENAI_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
      max_tokens: maxTokens,
      temperature: 0.4,
    }),
  });

  const j = await r.json();
  if (!r.ok) throw new Error(j?.error?.message);
  return j?.choices?.[0]?.message?.content?.trim() ?? "";
}

async function buildFollowUpEmail(text: string) {
  return ai(
    `
You are an analyst assistant. Write a concise follow-up email (no greeting, no signature).
Summarize key discussion points + next steps.

Transcript:
${text}
`,
    350
  );
}

async function buildLinkedInPost(text: string) {
  return ai(
    `
Write a professional LinkedIn recap (<150 words) from this meeting.
No greeting. No hashtags.

Transcript:
${text}
`,
    250
  );
}

/* -------------------------------------------------------
   MAIN POLL
------------------------------------------------------- */
export async function POST() {
  try {
    // Only poll unprocessed bots
    const pending = await adminDb
      .collection("recall_bots")
      .where("processed", "==", false)
      .limit(5)
      .get();

    if (pending.empty) return NextResponse.json({ processed: 0 });

    let processedCount = 0;

    for (const snap of pending.docs) {
      const meta = snap.data();
      const botId = meta.botId;
      const userId = meta.userId;
      const eventId = meta.eventId;

      const bot = await fetchBot(botId);
      if (!bot) {
        await snap.ref.update({
          status: "not_found",
          lastPolledAt: FieldValue.serverTimestamp(),
        });
        continue;
      }

      const status = bot.status ?? "unknown";

      // Not ready yet
      if (status !== "done") {
        await snap.ref.update({
          status,
          lastPolledAt: FieldValue.serverTimestamp(),
        });
        continue;
      }

      // Download transcript
      const payload = await downloadTranscript(bot);
      if (!payload) {
        await snap.ref.update({
          status: "no_transcript",
          lastPolledAt: FieldValue.serverTimestamp(),
        });
        continue;
      }

      const transcript = payload.text.slice(0, 8000);

      // AI Outputs
      let followUp = "";
      let social = "";

      try {
        followUp = await buildFollowUpEmail(transcript);
      } catch {}

      try {
        social = await buildLinkedInPost(transcript);
      } catch {}

      /* -------------------------------------------------------
         FINAL DATA (includes REQUIRED FIELDS FOR RULES!!!)
      ------------------------------------------------------- */
      const update = {
        userId,                              // REQUIRED FOR RULES
        botId,
        eventId,
        title: meta.title ?? "Untitled Meeting",
        attendees: meta.attendees ?? [],
        platform: meta.platform ?? "unknown",
        startTime: meta.startTime ?? null,

        transcript,
        transcriptRaw: payload.raw,
        transcriptReady: true,

        followUpEmailDraft: followUp,
        socialPostDraft: social,

        status: "completed",
        lastPolledAt: FieldValue.serverTimestamp(),
        lastProcessedAt: FieldValue.serverTimestamp(),
      };

      // Save to BOTH old + new collections
      await adminDb.collection("meeting_metadata").doc(eventId).set(update, { merge: true });
      await adminDb.collection("meetings_v2").doc(eventId).set(update, { merge: true });

      // Mark bot as processed
      await snap.ref.update({
        processed: true,
        transcriptReady: true,
        status: "completed",
        lastProcessedAt: FieldValue.serverTimestamp(),
      });

      processedCount++;
    }

    return NextResponse.json({ processed: processedCount });
  } catch (e: any) {
    console.error("poll error:", e);
    return NextResponse.json(
      { error: e?.message ?? "internal_error" },
      { status: 500 }
    );
  }
}
