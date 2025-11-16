import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { joinUrl, startTime, userId, eventId } = await req.json();

    if (!joinUrl || !startTime || !userId || !eventId) {
      return NextResponse.json(
        { error: "Missing joinUrl, startTime, userId, or eventId" },
        { status: 400 }
      );
    }

    if (!process.env.RECALL_API_KEY || !process.env.RECALL_REGION) {
      throw new Error("Missing Recall environment variables");
    }

    // Convert your timestamp → ISO timestamp
    const joinAtIso = new Date(startTime).toISOString();

    const res = await fetch(
      `https://${process.env.RECALL_REGION}.recall.ai/api/v1/bot`,
      {
        method: "POST",
        headers: {
          Authorization: `Token ${process.env.RECALL_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          meeting_url: joinUrl,
          join_at: joinAtIso,
          bot_name: "Jump Challenge Notetaker",
          metadata: { userId, eventId },
          recording_config: {
            transcript: {
              provider: { meeting_captions: {} },
            },
          },
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
