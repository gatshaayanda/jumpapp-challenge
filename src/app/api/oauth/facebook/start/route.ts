import { NextResponse } from "next/server";
import { encodeState } from "@/utils/stateToken";
import { requireUser } from "@/utils/serverAuth";

export const runtime = "nodejs";

export async function GET(req: Request) {
  const { uid } = await requireUser(req);

  const clientId = process.env.FB_CLIENT_ID!;
  const redirectBase =
    process.env.NEXT_PUBLIC_BASE_URL ||
    process.env.APP_BASE_URL ||
    "http://localhost:3000";
  const redirect = encodeURIComponent(
    `${redirectBase}/api/oauth/facebook/callback`
  );

  const state = encodeState({
    uid,
    provider: "facebook",
  });

  const scope = [
    "pages_show_list",
    "pages_manage_posts",
    "pages_read_engagement",
    "pages_manage_metadata",
  ].join(",");

  const url =
    `https://www.facebook.com/v19.0/dialog/oauth?` +
    `client_id=${clientId}&` +
    `redirect_uri=${redirect}&` +
    `state=${state}&` +
    `scope=${scope}`;

  return NextResponse.redirect(url);
}
