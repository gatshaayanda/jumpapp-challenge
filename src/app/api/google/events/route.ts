import { NextResponse } from "next/server";

async function refreshToken(refresh_token: string) {
  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: process.env.GOOGLE_CLIENT_ID!,
      client_secret: process.env.GOOGLE_CLIENT_SECRET!,
      refresh_token,
      grant_type: "refresh_token",
    }),
  });

  return res.json();
}

export async function GET(req: Request) {
  try {
    const cookieHeader = req.headers.get("cookie") || "";
    const cookies = Object.fromEntries(
      cookieHeader
        .split(";")
        .map((c) => c.trim().split("="))
        .map(([k, ...v]) => [k, decodeURIComponent(v.join("="))])
    );

    if (!cookies.google_tokens) {
      return NextResponse.json({ events: [] });
    }

    let tokens = JSON.parse(cookies.google_tokens);

    // If expired — refresh
    if (Date.now() > tokens.expires_in - 5000) {
      const refreshed = await refreshToken(tokens.refresh_token);
      tokens.access_token = refreshed.access_token;
      tokens.expires_in = Date.now() + refreshed.expires_in * 1000;
    }

    // Fetch ALL future events (no 2-week limit)
    const now = new Date().toISOString();
    const maxTime = new Date("2100-01-01T00:00:00Z").toISOString();

    const params = new URLSearchParams({
      timeMin: now,
      timeMax: maxTime,
      singleEvents: "true",
      orderBy: "startTime",
      maxResults: "2500",
    });

    const googleRes = await fetch(
      `https://www.googleapis.com/calendar/v3/calendars/primary/events?${params.toString()}`,
      {
        headers: {
          Authorization: `Bearer ${tokens.access_token}`,
        },
      }
    );

    const data = await googleRes.json();

    if (!data.items) {
      console.log("Google returned:", data);
      return NextResponse.json({ events: [] });
    }

    // Convert ALL-DAY events to a safe format
    const events = data.items.map((e: any) => ({
      id: e.id,
      summary: e.summary || "Untitled Event",
      start: {
        dateTime: e.start?.dateTime || e.start?.date || null,
      },
      hangoutLink: e.hangoutLink,
      conferenceData: e.conferenceData,
    }));

    return NextResponse.json({ events });
  } catch (error: any) {
    console.error("Google Events Error:", error);
    return NextResponse.json({ events: [], error: error.message });
  }
}
