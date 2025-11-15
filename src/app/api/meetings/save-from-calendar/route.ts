import { NextResponse } from "next/server";
import { adminDb } from "@/utils/firebaseAdmin";

export async function POST(req: Request) {
  try {
    const { uid, events } = await req.json();

    if (!uid || !events) {
      return NextResponse.json(
        { error: "Missing uid or events" },
        { status: 400 }
      );
    }

    const batch = adminDb.batch();

    events.forEach((ev: any) => {
      const ref = adminDb.collection("meetings").doc(ev.id);

      batch.set(
        ref,
        {
          uid,
          startTime: ev.start?.dateTime || ev.start?.date,
          endTime: ev.end?.dateTime || ev.end?.date,
          attendees: ev.attendees || [],
          joinUrl:
            ev.hangoutLink ||
            ev.conferenceData?.entryPoints?.[0]?.uri ||
            "",
          platform: detectPlatform(ev),
          createdAt: Date.now(),
        },
        { merge: true }
      );
    });

    await batch.commit();

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("save-from-calendar error", err);
    return NextResponse.json({ error: "Server err" }, { status: 500 });
  }
}

function detectPlatform(ev: any) {
  const url =
    ev.hangoutLink ||
    ev.conferenceData?.entryPoints?.[0]?.uri ||
    "";

  if (url.includes("zoom.us")) return "zoom";
  if (url.includes("meet.google.com")) return "google_meet";
  if (url.includes("teams.microsoft.com")) return "teams";

  return "other";
}
