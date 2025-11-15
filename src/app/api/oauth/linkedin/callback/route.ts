import { NextResponse } from 'next/server';
import { adminDb } from '@/utils/firebaseAdmin';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const code = searchParams.get('code');
    const uid = searchParams.get('state'); // received from ?state=

    if (!code) {
      return NextResponse.json({ error: 'Missing code' }, { status: 400 });
    }

    if (!uid) {
      return NextResponse.json({ error: 'Missing uid/state' }, { status: 400 });
    }

    const redirectUri = `${process.env.NEXT_PUBLIC_BASE_URL}/api/oauth/linkedin/callback`;

    // 1. Exchange code → access token
    const tokenRes = await fetch(
      "https://www.linkedin.com/oauth/v2/accessToken",
      {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          grant_type: "authorization_code",
          code,
          redirect_uri: redirectUri,
          client_id: process.env.LINKEDIN_CLIENT_ID!,
          client_secret: process.env.LINKEDIN_CLIENT_SECRET!,
        }),
      }
    );

    const tokenJson = await tokenRes.json();

    if (!tokenJson.access_token) {
      return NextResponse.json({ error: 'Token exchange failed', details: tokenJson }, { status: 500 });
    }

    const accessToken = tokenJson.access_token;

    // 2. Fetch LinkedIn profile ID (used to post as user)
    const profileRes = await fetch(
      "https://api.linkedin.com/v2/me?projection=(id)",
      {
        headers: { Authorization: `Bearer ${accessToken}` },
      }
    );

    const profileJson = await profileRes.json();

    if (!profileJson.id) {
      return NextResponse.json({ error: 'Missing profile id', details: profileJson });
    }

    const personId = profileJson.id;

    // 3. Save tokens in Firestore
    await adminDb.collection("users").doc(uid).set(
      {
        linkedin: {
          accessToken,
          personId,
        },
      },
      { merge: true }
    );

    return NextResponse.redirect("/settings?linkedin=connected");
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "OAuth error", err }, { status: 500 });
  }
}
