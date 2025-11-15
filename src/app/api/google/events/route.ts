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
  const cookie = req.headers.get("cookie") || "";
  const cookies = Object.fromEntries(
    cookie
      .split(";")
      .map((c) => c.trim().split("="))
      .map(([k, ...v]) => [k, decodeURIComponent(v.join("="))])
  );

  if (!cookies.google_tokens) {
    return NextResponse.json({ events: [] });
  }

  let tokens = JSON.parse(cookies.google_tokens);

  // Refresh expired tokens
  if (Date.now() > tokens.expires_in - 5000) {
    const refreshed = await refreshToken(tokens.refresh_token);
    tokens.access_token = refreshed.access_token;
    tokens.expires_in = Date.now() + refreshed.expires_in * 1000;
  }

  // Fetch events
  const now = new Date().toISOString();
  const maxTime = new Date(Date.now() + 1000 * 60 * 60 * 24 * 14).toISOString(); // 2 weeks

  const google = await fetch(
    `https://www.googleapis.com/calendar/v3/calendars/primary/events?${new URLSearchParams(
      {
        timeMin: now,
        timeMax: maxTime,
        singleEvents: "true",
        orderBy: "startTime",
      }
    )}`,
    {
      headers: {
        Authorization: `Bearer ${tokens.access_token}`,
      },
    }
  );

  const data = await google.json();

  return NextResponse.json({ events: data.items || [] });
}
