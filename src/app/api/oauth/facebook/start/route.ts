import { NextResponse } from 'next/server';

export async function GET() {
  const clientId = process.env.FB_CLIENT_ID!;
  const redirect = encodeURIComponent(
    `${process.env.NEXT_PUBLIC_BASE_URL}/api/oauth/facebook/callback`
  );

  const url =
    `https://www.facebook.com/v19.0/dialog/oauth?` +
    `client_id=${clientId}&redirect_uri=${redirect}&scope=pages_show_list,pages_manage_posts,pages_read_engagement`;

  return NextResponse.redirect(url);
}
