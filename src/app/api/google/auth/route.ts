import { NextResponse } from "next/server";

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID!;
const GOOGLE_REDIRECT = process.env.GOOGLE_REDIRECT_URI!; 
// e.g. https://yourdomain.com/api/google/callback

export async function GET() {
  const scope = [
    "openid",
    "email",
    "profile",
    "https://www.googleapis.com/auth/calendar.readonly",
  ].join(" ");

  const authUrl =
    "https://accounts.google.com/o/oauth2/v2/auth?" +
    new URLSearchParams({
      client_id: GOOGLE_CLIENT_ID,
      redirect_uri: GOOGLE_REDIRECT,
      response_type: "code",
      access_type: "offline",
      prompt: "consent",
      scope,
    }).toString();

  return NextResponse.redirect(authUrl);
}
