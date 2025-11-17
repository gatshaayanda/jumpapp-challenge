import { NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { adminDb } from "@/utils/firebaseAdmin";
import { decodeState } from "@/utils/stateToken";

type TokenResponse = {
  access_token?: string;
  refresh_token?: string;
  expires_in?: number;
  scope?: string;
  error?: string;
};

type GoogleProfile = {
  id: string;
  email?: string;
  name?: string;
  given_name?: string;
  picture?: string;
};

type StoredAccountPayload = {
  uid: string;
  accountId: string;
  email?: string;
  name?: string;
  picture?: string | null;
  accessToken: string;
  expiresAt: number;
  scopes?: string;
  updatedAt: FirebaseFirestore.FieldValue;
  connectedAt: FirebaseFirestore.FieldValue | FirebaseFirestore.Timestamp | null;
  refreshToken?: string | null;
};

export const runtime = "nodejs";

export async function GET(req: Request) {
  try {
  const url = new URL(req.url);
  const code = url.searchParams.get("code");
    const stateParam = url.searchParams.get("state");

    if (!code || !stateParam) {
      return NextResponse.json(
        { error: "Missing OAuth params" },
        { status: 400 }
      );
    }

    const { uid } = decodeState(stateParam);

  const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: process.env.GOOGLE_CLIENT_ID!,
      client_secret: process.env.GOOGLE_CLIENT_SECRET!,
      redirect_uri: process.env.GOOGLE_REDIRECT_URI!,
      grant_type: "authorization_code",
    }),
  });

    const tokens = (await tokenRes.json()) as TokenResponse;

    if (!tokenRes.ok || !tokens.access_token) {
    return NextResponse.json(
        { error: "OAuth failed", detail: tokens },
      { status: 400 }
    );
  }

    const accessToken: string = tokens.access_token;
    const refreshToken: string | undefined = tokens.refresh_token;
    const expiresAt =
      Date.now() + (Number(tokens.expires_in || 3600) * 1000);

    // Get profile info for account metadata
    const profileRes = await fetch(
      "https://www.googleapis.com/oauth2/v2/userinfo",
      {
        headers: { Authorization: `Bearer ${accessToken}` },
      }
    );
    const profile = (await profileRes.json()) as Partial<GoogleProfile>;

    if (!profile?.id) {
      return NextResponse.json(
        { error: "Failed to fetch Google profile", detail: profile },
        { status: 400 }
      );
    }

    const accountId = profile.id as string;

    const docRef = adminDb
      .collection("users")
      .doc(uid)
      .collection("googleAccounts")
      .doc(accountId);

    const existing = await docRef.get();

    const connectedAtValue =
      existing.exists && existing.data()?.connectedAt
        ? (existing.data()?.connectedAt as
            | FirebaseFirestore.Timestamp
            | null)
        : FieldValue.serverTimestamp();

    const payload: StoredAccountPayload = {
      uid,
      accountId,
      email: profile.email,
      name: profile.name ?? profile.given_name ?? profile.email,
      picture: profile.picture ?? null,
      accessToken,
      expiresAt,
      scopes: tokens.scope,
      updatedAt: FieldValue.serverTimestamp(),
      connectedAt: connectedAtValue,
      refreshToken: existing.data()?.refreshToken ?? null,
    };

    if (refreshToken) {
      payload.refreshToken = refreshToken;
    } else if (!existing.exists) {
      payload.refreshToken = null;
    }

    await docRef.set(payload, { merge: true });

    const base =
      process.env.NEXT_PUBLIC_BASE_URL ||
      process.env.APP_BASE_URL ||
      "http://localhost:3000";
    return NextResponse.redirect(`${base}/settings?google=connected`);
  } catch (error) {
    console.error("Google callback error", error);
    return NextResponse.json(
      {
        error: "OAuth callback failed",
        detail: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
