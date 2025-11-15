import { NextResponse } from 'next/server';
import { firestore } from '@/utils/firebaseConfig';
import { doc, setDoc } from 'firebase/firestore';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const code = searchParams.get('code');
    const uid = searchParams.get('state');

    if (!code || !uid) {
      return NextResponse.json({ error: 'Missing code or uid' }, { status: 400 });
    }

    const redirectUri = `${process.env.NEXT_PUBLIC_BASE_URL}/api/oauth/linkedin/callback`;

    // 1. Exchange code for token
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

    // 2. Fetch profile → get LinkedIn URN
    const profileRes = await fetch(
      "https://api.linkedin.com/v2/me?projection=(id)",
      { headers: { Authorization: `Bearer ${accessToken}` } }
    );

    const profileJson = await profileRes.json();
    if (!profileJson.id) {
      return NextResponse.json({ error: "Profile fetch failed", details: profileJson });
    }

    const urn = `urn:li:person:${profileJson.id}`;

    // 3. Save to Firestore
    await setDoc(doc(firestore, "user_oauth", uid), {
      linkedinAccessToken: accessToken,
      linkedinUrn: urn,
    }, { merge: true });

    return NextResponse.redirect("/settings?linkedin=connected");
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
