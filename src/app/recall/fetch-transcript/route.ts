import { NextResponse } from 'next/server';
import { adminDb } from '@/utils/firebaseAdmin';

// OpenAI API (use your key)
const OPENAI_API = "https://api.openai.com/v1/chat/completions";

export async function POST(req: Request) {
  try {
    const { uid, eventId, botId, media } = await req.json();

    if (!uid || !eventId || !botId || !media) {
      return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
    }

    // ───────────────────────────────────────────────
    // 1. Pull the transcript file from Recall.ai media link
    // media is an array → pick the transcript one
    // ───────────────────────────────────────────────
    const transcriptUrl = media.find((m: any) =>
      m.type === "transcript" || m.url?.includes("transcript")
    )?.url;

    if (!transcriptUrl) {
      console.error("NO TRANSCRIPT AVAILABLE");
      return NextResponse.json({ ok: true, message: 'Transcript not ready' });
    }

    const transcriptResp = await fetch(transcriptUrl, {
      headers: {
        Authorization: `Token ${process.env.RECALL_API_KEY}`,
      },
    });

    const transcript = await transcriptResp.text();

    // ───────────────────────────────────────────────
    // 2. Generate AI Follow-up Email using OpenAI
    // ───────────────────────────────────────────────
    const emailDraft = await generateAI(
      `Write a friendly, professional follow-up email summarizing the meeting below. Respond ONLY with the email body.\n\n${transcript}`
    );

    // ───────────────────────────────────────────────
    // 3. Generate Social Media Post Draft
    // ───────────────────────────────────────────────
    const socialDraft = await generateAI(
      `Write a short, engaging LinkedIn-style post summarizing this meeting. It should highlight value, insights, and be professional.\n\n${transcript}`
    );

    // ───────────────────────────────────────────────
    // 4. Store full meeting metadata in Firestore
    // ───────────────────────────────────────────────
    await adminDb
      .collection("meeting_metadata")
      .doc(eventId)
      .set(
        {
          uid,
          botId,
          transcript,
          followUpEmailDraft: emailDraft,
          socialPostDraft: socialDraft,
          updatedAt: Date.now(),
        },
        { merge: true }
      );

    return NextResponse.json({ success: true });

  } catch (err) {
    console.error("FETCH TRANSCRIPT ERROR:", err);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}

// ───────────────────────────────────────────────
// Small helper to call OpenAI
// ───────────────────────────────────────────────
async function generateAI(prompt: string): Promise<string> {
  try {
    const res = await fetch(OPENAI_API, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [{ role: "user", content: prompt }],
        max_tokens: 500,
      }),
    });

    const json = await res.json();
    return json.choices?.[0]?.message?.content || "";
  } catch (err) {
    console.error("AI error", err);
    return "";
  }
}
