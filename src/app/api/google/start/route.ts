import { NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { adminAuth } from "@/utils/firebaseAdmin";
import { encodeState } from "@/utils/stateToken";

export const runtime = "nodejs";

function parseCookies(cookieHeader: string) {
  const cookies: Record<string, string> = {};
  if (!cookieHeader) return cookies;
  for (const part of cookieHeader.split(";")) {
    const [k, ...rest] = part.trim().split("=");
    if (!k) continue;
    cookies[k] = decodeURIComponent(rest.join("="));
  }
  return cookies;
}

export async function GET(req: Request) {
  const redirect = process.env.GOOGLE_REDIRECT_URI!;
  const clientId = process.env.GOOGLE_CLIENT_ID!;

  const cookieHeader = req.headers.get("cookie") ?? "";
  const cookies = parseCookies(cookieHeader);
  const session = cookies["firebase_session"];

  if (!session) {
    return NextResponse.json(
      { error: "Not authenticated" },
      { status: 401 }
    );
  }

  const decoded = await adminAuth.verifyIdToken(session);

  const state = encodeState({
    uid: decoded.uid,
    nonce: randomUUID(),
  });

  const scope = [
    "openid",
    "email",
    "profile",
    "https://www.googleapis.com/auth/calendar.readonly",
  ].join(" ");

  const url =
    "https://accounts.google.com/o/oauth2/v2/auth?" +
    new URLSearchParams({
      client_id: clientId,
      redirect_uri: redirect,
      response_type: "code",
      access_type: "offline",
      prompt: "consent",
      scope,
      state,
      include_granted_scopes: "true",
    }).toString();

  return NextResponse.redirect(url);
}
