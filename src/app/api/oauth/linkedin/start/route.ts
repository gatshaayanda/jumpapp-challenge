import { NextResponse } from 'next/server';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const uid = searchParams.get('uid'); // pass this from Settings page

  const clientId = process.env.LINKEDIN_CLIENT_ID!;
  const redirect = encodeURIComponent(
    `${process.env.NEXT_PUBLIC_BASE_URL}/api/oauth/linkedin/callback`
  );

  const scope = encodeURIComponent(
    "openid profile email w_member_social r_liteprofile r_emailaddress"
  );

  const state = uid || "missing_uid";

  const url =
    `https://www.linkedin.com/oauth/v2/authorization` +
    `?response_type=code` +
    `&client_id=${clientId}` +
    `&redirect_uri=${redirect}` +
    `&scope=${scope}` +
    `&state=${state}`;

  return NextResponse.redirect(url);
}
