import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { meetingUrl, joinAt, userId, eventId } = await req.json();

    if (!process.env.RECALL_API_KEY) {
      throw new Error("Missing RECALL_API_KEY");
    }

    const res = await fetch(
      `https://${process.env.RECALL_REGION}.recall.ai/api/v1/bot`,
      {
        method: "POST",
        headers: {
          "Authorization": `Token ${process.env.RECALL_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          meeting_url: meetingUrl,
          join_at: new Date(joinAt).toISOString(),
          bot_name: "Jump Challenge Notetaker",
          metadata: {
            userId,
            eventId
          },
          recording_config: {
            transcript: {
              provider: { meeting_captions: {} },
            }
          }
        }),
      }
    );

    const json = await res.json();
    console.log("BOT CREATED:", json);

    return NextResponse.json({ botId: json.id });
  } catch (err: any) {
    console.error("create-bot error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
