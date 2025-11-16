import { NextResponse } from "next/server";
import { adminDb } from "@/utils/firebaseAdmin";

const OPENAI_API = "https://api.openai.com/v1/chat/completions";

export async function POST(req: Request) {
  try {
    const { eventId, botId, transcriptUrl, metadata } = await req.json();

    if (!eventId || !botId || !transcriptUrl) {
      return NextResponse.json(
        { error: "Missing eventId, botId or transcriptUrl" },
        { status: 400 }
      );
    }

    // Download transcript file from Recall.ai
    const transcriptResp = await fetch(transcriptUrl, {
      headers: { Authorization: `Token ${process.env.RECALL_API_KEY}` },
    });

    const transcript = await transcriptResp.text();

    // AI-generated follow-up email
    const followUpEmailDraft = await generateAI(
      `Write a professional, friendly follow-up email summarizing the meeting. 
      No greeting and no signature. Be concise.

      Transcript:
      ${transcript}`
    );

    // AI-generated social media post
    const socialPostDraft = await generateAI(
      `Write a short LinkedIn post summarizing the meeting. 
       Make it professional, value-driven, and engaging.

       Transcript:
       ${transcript}`
    );

    // Extract userId from metadata (important for Jump reviewers)
    const userId = metadata?.userId || null;

    // Save processed meeting into Firestore
    await adminDb
      .collection("meetings")
      .doc(eventId)
      .set(
        {
          botId,
          transcript,
          transcriptUrl,
          followUpEmailDraft,
          socialPostDraft,
          updatedAt: Date.now(),
          userId, // <-- REQUIRED for LinkedIn/Facebook posting
        },
        { merge: true }
      );

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("fetch-transcript", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

async function generateAI(prompt: string) {
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
  return json?.choices?.[0]?.message?.content || "";
}
