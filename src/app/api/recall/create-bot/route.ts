import { NextResponse } from 'next/server';
import { adminDb } from '@/utils/firebaseAdmin';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { uid, eventId, joinUrl, startTime } = body;

    if (!uid || !eventId || !joinUrl || !startTime) {
      return NextResponse.json({
        error: 'Missing required fields'
      }, { status: 400 });
    }

    const API_KEY = process.env.RECALL_API_KEY;
    if (!API_KEY) {
      return NextResponse.json({
        error: 'Missing Recall API key'
      }, { status: 500 });
    }

    // Convert startTime (ISO or ms) → UNIX seconds
    const unixStart = Math.floor(startTime / 1000);

    // Join minutes offset
    const userDoc = await adminDb.collection('users').doc(uid).get();
    const joinMinutes = userDoc.data()?.joinMinutes || 5;
    const joinAt = unixStart - joinMinutes * 60;

    // Send to Recall.ai
    const r = await fetch('https://api.recall.ai/api/v1/bot', {
      method: 'POST',
      headers: {
        'Authorization': `Token ${API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        join_url: joinUrl,
        start_time: joinAt,
        end_behavior: 'end_of_meeting',
        recording: {
          audio: true,
          video: false
        }
      })
    });

    const data = await r.json();
    if (!r.ok) {
      console.error('Recall error:', data);
      return NextResponse.json({ error: 'Recall bot creation failed', detail: data }, { status: 500 });
    }

    const botId = data.id;

    // Save meeting metadata in Firestore
    await adminDb
      .collection('meeting_metadata')
      .doc(eventId)
      .set({
        userId: uid,
        botId,
        joinUrl,
        startTime,
        status: 'waiting',
        createdAt: Date.now()
      }, { merge: true });

    return NextResponse.json({ success: true, botId });
  } catch (err) {
    console.error(err);
    return NextResponse.json({
      error: 'Internal error creating bot'
    }, { status: 500 });
  }
}
