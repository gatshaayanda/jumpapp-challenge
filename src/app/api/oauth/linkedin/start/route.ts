import { NextResponse } from "next/server";
import { encodeState } from "@/utils/stateToken";
import { requireUser } from "@/utils/serverAuth";

export const runtime = "nodejs";

export async function GET(req: Request) {
  const { uid } = await requireUser(req);

  const clientId = process.env.LINKEDIN_CLIENT_ID!;
  const redirectBase =
    process.env.NEXT_PUBLIC_BASE_URL ||
    process.env.APP_BASE_URL ||
    "http://localhost:3000";
  const redirect = encodeURIComponent(
    `${redirectBase}/api/oauth/linkedin/callback`
  );

  const scope = encodeURIComponent(
    "openid profile email w_member_social r_liteprofile r_emailaddress offline_access"
  );

  const state = encodeState({
    uid,
    provider: "linkedin",
  });

  const url =
    `https://www.linkedin.com/oauth/v2/authorization` +
    `?response_type=code` +
    `&client_id=${clientId}` +
    `&redirect_uri=${redirect}` +
    `&scope=${scope}` +
    `&state=${state}`;

  return NextResponse.redirect(url);
}
