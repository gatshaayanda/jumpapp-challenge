import { NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { adminDb } from "@/utils/firebaseAdmin";
import { decodeState } from "@/utils/stateToken";

export const runtime = "nodejs";

type LinkedInTokenResponse = {
  access_token?: string;
  refresh_token?: string;
  expires_in?: number;
  error?: string;
};

type LinkedInProfile = {
  id: string;
  localizedFirstName?: string;
  localizedLastName?: string;
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
    const redirectUri = `${redirectBase}/api/oauth/linkedin/callback`;

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

    const tokenJson = (await tokenRes.json()) as LinkedInTokenResponse;

    if (!tokenRes.ok || !tokenJson.access_token) {
      return NextResponse.json(
        { error: "Token exchange failed", details: tokenJson },
        { status: 500 }
      );
    }

    const accessToken = tokenJson.access_token;
    const refreshToken = tokenJson.refresh_token ?? null;
    const expiresAt =
      Date.now() + (Number(tokenJson.expires_in ?? 3600) * 1000);

    const profileRes = await fetch(
      "https://api.linkedin.com/v2/me?projection=(id,localizedFirstName,localizedLastName)",
      { headers: { Authorization: `Bearer ${accessToken}` } }
    );

    const profileJson = (await profileRes.json()) as LinkedInProfile;
    if (!profileJson.id) {
      return NextResponse.json({
        error: "Profile fetch failed",
        details: profileJson,
      });
    }

    const personId = profileJson.id;
    const urn = `urn:li:person:${personId}`;
    const displayName = `${profileJson.localizedFirstName ?? ""} ${
      profileJson.localizedLastName ?? ""
    }`.trim();

    await adminDb
      .collection("users")
      .doc(uid)
      .set(
        {
          linkedin: {
            accessToken,
            refreshToken,
            expiresAt,
            personId,
            urn,
            name: displayName || null,
            updatedAt: FieldValue.serverTimestamp(),
            connectedAt: FieldValue.serverTimestamp(),
          },
        },
        { merge: true }
      );

    return NextResponse.redirect(`${redirectBase}/settings?linkedin=connected`);
  } catch (error) {
    console.error("LinkedIn callback error", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
