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

    if (!snap.exists() || !snap.data().linkedinAccessToken) {
      return NextResponse.json({ error: 'No LinkedIn connection' }, { status: 400 });
    }

    const accessToken = snap.data().linkedinAccessToken;
    const urn = snap.data().linkedinUrn; // "urn:li:person:123..."

    if (!urn) {
      return NextResponse.json({ error: 'Missing LinkedIn URN' }, { status: 400 });
    }

    // LinkedIn UGC post
    const response = await fetch('https://api.linkedin.com/v2/ugcPosts', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'X-Restli-Protocol-Version': '2.0.0',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        author: urn,
        lifecycleState: 'PUBLISHED',
        specificContent: {
          'com.linkedin.ugc.ShareContent': {
            shareCommentary: { text: content },
            shareMediaCategory: 'NONE',
          },
        },
        visibility: { 'com.linkedin.ugc.MemberNetworkVisibility': 'PUBLIC' },
      }),
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: 'LinkedIn post failed', details: await response.text() },
        { status: 400 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
