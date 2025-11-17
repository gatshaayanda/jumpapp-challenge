import { NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { adminDb } from "@/utils/firebaseAdmin";
import { decodeState } from "@/utils/stateToken";

export const runtime = "nodejs";

type FacebookTokenResponse = {
  access_token?: string;
  token_type?: string;
  expires_in?: number;
  error?: unknown;
};

type FacebookPage = {
  id: string;
  name?: string;
  access_token?: string;
};

type FacebookAccountsResponse = {
  data?: FacebookPage[];
};

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const code = searchParams.get("code");
    const stateParam = searchParams.get("state");

    if (!code || !stateParam) {
      return NextResponse.json(
        { error: "Missing code or state" },
        { status: 400 }
      );
    }

    const { uid } = decodeState(stateParam);

    const redirectBase =
      process.env.NEXT_PUBLIC_BASE_URL ||
      process.env.APP_BASE_URL ||
      "http://localhost:3000";
    const redirectUri = `${redirectBase}/api/oauth/facebook/callback`;

    const tokenRes = await fetch(
      `https://graph.facebook.com/v19.0/oauth/access_token?` +
        `client_id=${process.env.FB_CLIENT_ID}&` +
        `redirect_uri=${encodeURIComponent(redirectUri)}&` +
        `client_secret=${process.env.FB_CLIENT_SECRET}&` +
        `code=${encodeURIComponent(code)}`
    );

    const tokenJson = (await tokenRes.json()) as FacebookTokenResponse;
    if (!tokenRes.ok || !tokenJson.access_token) {
      return NextResponse.json(
        { error: "Facebook token exchange failed", details: tokenJson },
        { status: 500 }
      );
    }

    const userAccessToken = tokenJson.access_token;

    const pagesRes = await fetch(
      `https://graph.facebook.com/me/accounts?access_token=${encodeURIComponent(
        userAccessToken
      )}`
    );

    const pagesJson = (await pagesRes.json()) as FacebookAccountsResponse;
    const firstPage: FacebookPage | undefined = pagesJson.data?.[0];

    if (!firstPage || !firstPage.access_token) {
      return NextResponse.json(
        { error: "No Facebook pages with posting permissions were found" },
        { status: 400 }
      );
    }

    await adminDb
      .collection("users")
      .doc(uid)
      .set(
        {
          facebook: {
            pageId: firstPage.id,
            pageName: firstPage.name ?? null,
            accessToken: firstPage.access_token,
            updatedAt: FieldValue.serverTimestamp(),
            connectedAt: FieldValue.serverTimestamp(),
          },
        },
        { merge: true }
      );

    return NextResponse.redirect(`${redirectBase}/settings?facebook=connected`);
  } catch (error) {
    console.error("Facebook callback error", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}

