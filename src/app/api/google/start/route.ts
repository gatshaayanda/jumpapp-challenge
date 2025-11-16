import { NextResponse } from "next/server";

export async function GET(req: Request) {
  const redirect = process.env.GOOGLE_REDIRECT_URI!;
  const clientId = process.env.GOOGLE_CLIENT_ID!;

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
    }).toString();

  return NextResponse.redirect(url);
}
