import { NextResponse } from 'next/server';
import { firestore } from '@/utils/firebaseConfig';
import { doc, getDoc } from 'firebase/firestore';

export async function POST(req: Request) {
  try {
    const { uid, content } = await req.json();

    if (!uid || !content) {
      return NextResponse.json({ error: 'Missing uid or content' }, { status: 400 });
    }

    // Load saved OAuth token
    const ref = doc(firestore, 'user_oauth', uid);
    const snap = await getDoc(ref);

    if (!snap.exists()) {
      return NextResponse.json({ error: 'No Facebook OAuth found' }, { status: 400 });
    }

    const data = snap.data();
    const pageAccessToken = data.facebookAccessToken;
    const pageId = data.facebookPageId;

    if (!pageAccessToken || !pageId) {
      return NextResponse.json({ error: 'Missing Facebook page token or id' }, { status: 400 });
    }

    // POST to Facebook page feed
    const url = `https://graph.facebook.com/${pageId}/feed`;

    const fbRes = await fetch(url, {
      method: 'POST',
      body: new URLSearchParams({
        message: content,
        access_token: pageAccessToken,
      }),
    });

    const fbData = await fbRes.json();

    if (!fbRes.ok) {
      return NextResponse.json(
        { error: 'Facebook post failed', details: fbData },
        { status: 400 }
      );
    }

    return NextResponse.json({ success: true, id: fbData.id });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
