import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { botId } = await req.json();

    const res = await fetch(
      `https://${process.env.RECALL_REGION}.recall.ai/api/v1/bot/${botId}`,
      {
        headers: {
          Authorization: `Token ${process.env.RECALL_API_KEY}`,
        },
      }
    );

    const json = await res.json();
    const status = json.status;

    if (status !== "done") {
      return NextResponse.json({ ready: false });
    }

    // Extract transcript URL
    const recording = json.recordings?.[0];
    const transcriptUrl =
      recording?.media_shortcuts?.transcript?.data?.download_url ?? null;

    return NextResponse.json({
      ready: true,
      transcriptUrl,
      recall: json,
    });
  } catch (err: any) {
    console.error("poll error:", err);
    return NextResponse.json({ error: err.message });
  }
}
