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

    const redirectUri = `${process.env.NEXT_PUBLIC_BASE_URL}/api/oauth/facebook/callback`;

    // Exchange code -> short-lived token
    const tokenRes = await fetch(
      `https://graph.facebook.com/v19.0/oauth/access_token?` +
        `client_id=${process.env.FB_CLIENT_ID}&` +
        `redirect_uri=${redirectUri}&` +
        `client_secret=${process.env.FB_CLIENT_SECRET}&` +
        `code=${code}`
    );

    const tokenJson = await tokenRes.json();
    const userAccessToken = tokenJson.access_token;

    // Get list of pages + tokens
    const pagesRes = await fetch(
      `https://graph.facebook.com/me/accounts?access_token=${userAccessToken}`
    );

    const pagesJson = await pagesRes.json();
    const firstPage = pagesJson.data?.[0];

    if (!firstPage) {
      return NextResponse.json({ error: "No Facebook pages found" });
    }

    const pageId = firstPage.id;
    const pageAccessToken = firstPage.access_token;

    // Save to Firestore
    await setDoc(doc(firestore, "user_oauth", uid), {
      facebookPageId: pageId,
      facebookAccessToken: pageAccessToken,
    }, { merge: true });

    return NextResponse.redirect("/settings?facebook=connected");
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
