import { NextResponse } from "next/server";
import { adminDb } from "@/utils/firebaseAdmin";

async function safeFetch(url: string, options: any) {
  try {
    const res = await fetch(url, options);
    const data = await res.json().catch(() => ({}));
    return { ok: res.ok, data };
  } catch (err) {
    return { ok: false, data: { error: "Network error", detail: String(err) } };
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { meetingId, content, platform } = body;

    if (!meetingId || !content || !platform) {
      return NextResponse.json(
        { error: "Missing meetingId/content/platform" },
        { status: 400 }
      );
    }

    // 1. Get meeting → userId (you used `meeting_metadata` collection)
    const meetingSnap = await adminDb
      .collection("meeting_metadata")
      .doc(meetingId)
      .get();

    if (!meetingSnap.exists) {
      return NextResponse.json(
        { error: "Meeting not found" },
        { status: 404 }
      );
    }

    const meeting = meetingSnap.data() as any;
    if (!meeting || !meeting.userId) {
      return NextResponse.json(
        { error: "Meeting missing userId" },
        { status: 400 }
      );
    }

    const uid = meeting.userId;

    // 2. Get user credential storage
    const userSnap = await adminDb.collection("users").doc(uid).get();
    const user = userSnap.data() as any;
    if (!user) {
      return NextResponse.json(
        { error: "User auth not found" },
        { status: 404 }
      );
    }

    // ─────────────────────────────
    // LINKEDIN
    // ─────────────────────────────
    if (platform === "linkedin") {
      if (!user.linkedin?.accessToken || !user.linkedin?.personId) {
        return NextResponse.json(
          { error: "LinkedIn not connected" },
          { status: 400 }
        );
      }

      const postUrl = "https://api.linkedin.com/v2/ugcPosts";

      const payload = {
        author: `urn:li:person:${user.linkedin.personId}`,
        lifecycleState: "PUBLISHED",
        specificContent: {
          "com.linkedin.ugc.ShareContent": {
            shareCommentary: { text: content },
            shareMediaCategory: "NONE",
          },
        },
        visibility: {
          "com.linkedin.ugc.MemberNetworkVisibility": "PUBLIC",
        },
      };

      const result = await safeFetch(postUrl, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${user.linkedin.accessToken}`,
          "Content-Type": "application/json",
          "X-Restli-Protocol-Version": "2.0.0",
        },
        body: JSON.stringify(payload),
      });

      if (!result.ok) {
        console.error("LinkedIn post error", result.data);
        return NextResponse.json(
          { error: "LinkedIn post failed", detail: result.data },
          { status: 500 }
        );
      }
    }

    // ─────────────────────────────
    // FACEBOOK
    // ─────────────────────────────
    if (platform === "facebook") {
      if (!user.facebook?.accessToken || !user.facebook?.pageId) {
        return NextResponse.json(
          { error: "Facebook not connected" },
          { status: 400 }
        );
      }

      const url = `https://graph.facebook.com/${user.facebook.pageId}/feed`;

      const result = await safeFetch(
        `${url}?message=${encodeURIComponent(content)}&access_token=${
          user.facebook.accessToken
        }`,
        { method: "POST" }
      );

      if (!result.ok) {
        console.error("Facebook post error", result.data);
        return NextResponse.json(
          { error: "Facebook post failed", detail: result.data },
          { status: 500 }
        );
      }
    }

    // 3. Save last posted info on meeting
    await adminDb
      .collection("meeting_metadata")
      .doc(meetingId)
      .set(
        {
          lastPostedAt: Date.now(),
          lastPlatform: platform,
        },
        { merge: true }
      );

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("POST SOCIAL ERROR:", err);
    return NextResponse.json(
      { error: "Server error", detail: String(err) },
      { status: 500 }
    );
  }
}
