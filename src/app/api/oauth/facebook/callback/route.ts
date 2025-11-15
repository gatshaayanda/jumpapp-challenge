import { NextResponse } from 'next/server';
import { adminDb } from '@/utils/firebaseAdmin';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const code = searchParams.get('code');
    const uid = searchParams.get('state');

    const redirectUri = `${process.env.NEXT_PUBLIC_BASE_URL}/api/oauth/facebook/callback`;

    // Exchange code → access token
    const tokenRes = await fetch(
      `https://graph.facebook.com/v19.0/oauth/access_token?` +
        `client_id=${process.env.FB_CLIENT_ID}&` +
        `redirect_uri=${redirectUri}&` +
        `client_secret=${process.env.FB_CLIENT_SECRET}&` +
        `code=${code}`
    );

    const tokenJson = await tokenRes.json();
    const userAccessToken = tokenJson.access_token;

    // Get page access token (needed to post)
    const pagesRes = await fetch(
      `https://graph.facebook.com/me/accounts?access_token=${userAccessToken}`
    );
    const pagesJson = await pagesRes.json();

    const firstPage = pagesJson.data?.[0];

    if (!firstPage) {
      return NextResponse.json({ error: 'No Facebook pages linked' });
    }

    const pageId = firstPage.id;
    const pageToken = firstPage.access_token;

    // Store in Firestore 🧠
    await adminDb.collection('users').doc(uid!).set(
      {
        facebook: {
          accessToken: pageToken,
          pageId,
        },
      },
      { merge: true }
    );

    return NextResponse.redirect('/settings?facebook=connected');
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'OAuth error' }, { status: 500 });
  }
}
