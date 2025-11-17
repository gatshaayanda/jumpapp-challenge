import { NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { FieldValue } from "firebase-admin/firestore";
import type { DocumentReference } from "firebase-admin/firestore";
import { adminDb } from "@/utils/firebaseAdmin";
import { requireUser } from "@/utils/serverAuth";

export const runtime = "nodejs";

type AccountDoc = {
  accessToken?: string;
  refreshToken?: string;
  expiresAt?: number;
  email?: string;
  name?: string;
};

type RefreshResponse = {
  access_token?: string;
  refresh_token?: string;
  expires_in?: number;
  error?: string;
};

type EntryPoint = {
  uri?: string;
  entryPointType?: string;
  label?: string;
};

type GoogleApiEvent = {
  id?: string;
  summary?: string;
  description?: string;
  location?: string;
  start?: { dateTime?: string; date?: string };
  end?: { dateTime?: string; date?: string };
  hangoutLink?: string;
  conferenceData?: { entryPoints?: EntryPoint[] } | null;
  attendees?: { email?: string; displayName?: string }[];
};

type SanitizedEvent = {
  id: string;
  summary: string;
  description: string | null;
  location: string | null;
  start: { dateTime: string | null; date: string | null };
  end: { dateTime: string | null; date: string | null };
  hangoutLink: string | null;
  conferenceData: { entryPoints?: EntryPoint[] } | null;
  attendees: { email?: string; displayName?: string }[];
};

async function refreshToken(refresh_token: string): Promise<RefreshResponse> {
  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: process.env.GOOGLE_CLIENT_ID!,
      client_secret: process.env.GOOGLE_CLIENT_SECRET!,
      refresh_token,
      grant_type: "refresh_token",
    }),
  });

  const json = (await res.json()) as RefreshResponse;
  if (!res.ok) {
    throw new Error(json?.error || "token_refresh_failed");
  }
  return json;
}

function sanitizeEvents(items: GoogleApiEvent[]): SanitizedEvent[] {
  return items
    .filter((ev) => {
      const start = ev.start?.dateTime || ev.start?.date;
      if (!start) return false;
      const summary = (ev.summary || "").toLowerCase();
      if (summary.includes("birthday")) return false;
      if (summary.includes("holiday")) return false;
      if (summary.includes("anniversary")) return false;
      return true;
    })
    .map((e) => ({
      id: e.id || randomUUID(),
      summary: e.summary || "Untitled Event",
      description: e.description ?? null,
      location: e.location ?? null,
      start: {
        dateTime: e.start?.dateTime ?? null,
        date: e.start?.date ?? null,
      },
      end: {
        dateTime: e.end?.dateTime ?? null,
        date: e.end?.date ?? null,
      },
      hangoutLink: e.hangoutLink ?? null,
      conferenceData: e.conferenceData ?? null,
      attendees: e.attendees ?? [],
      conferenceData: e.conferenceData ?? null,
      attendees: e.attendees ?? [],
    }));
}

async function fetchEventsForAccount(
  accessToken: string,
  timeMin: string,
  timeMax: string
): Promise<SanitizedEvent[]> {
    const params = new URLSearchParams({
      timeMin,
      timeMax,
      singleEvents: "true",
      orderBy: "startTime",
      maxResults: "2500",
      conferenceDataVersion: "1",
      fields:
        "items(" +
        "id,summary,description,location," +
        "start(dateTime,date),end(dateTime,date)," +
        "hangoutLink," +
        "conferenceData(entryPoints(uri,entryPointType,label))," +
        "attendees(email,displayName)" +
        ")",
    });

  const res = await fetch(
      `https://www.googleapis.com/calendar/v3/calendars/primary/events?${params.toString()}`,
      {
        headers: {
        Authorization: `Bearer ${accessToken}`,
        },
      }
    );

  if (!res.ok) {
    const text = await res.text();
    throw new Error(
      `google_api_error:${res.status}:${text.slice(0, 200)}`
    );
  }

  const data = await res.json();
  const items: GoogleApiEvent[] = Array.isArray(data?.items) ? data.items : [];
  return sanitizeEvents(items);
}

async function ensureAccessToken(
  ref: DocumentReference,
  doc: AccountDoc
) {
  const now = Date.now();
  if (
    doc.accessToken &&
    typeof doc.expiresAt === "number" &&
    doc.expiresAt - 5000 > now
  ) {
    return doc.accessToken;
  }

  if (!doc.refreshToken) {
    throw new Error("missing_refresh_token");
  }

  const refreshed = await refreshToken(doc.refreshToken);
  const expiresAt = now + Number(refreshed.expires_in ?? 3600) * 1000;
  await ref.set(
    {
      accessToken: refreshed.access_token,
      expiresAt,
      updatedAt: FieldValue.serverTimestamp(),
    },
    { merge: true }
  );

  return refreshed.access_token as string;
}

export async function GET(req: Request) {
  try {
    const { uid } = await requireUser(req);

    const accountsSnap = await adminDb
      .collection("users")
      .doc(uid)
      .collection("googleAccounts")
      .get();

    if (accountsSnap.empty) {
      return NextResponse.json({ events: [], accounts: [] });
    }

    const timeMin = new Date().toISOString();
    const timeMax = new Date("2027-01-01T00:00:00Z").toISOString();

    const allEvents: (SanitizedEvent & {
      accountId: string;
      sourceEmail?: string;
      internalId: string;
    })[] = [];
    const accountMeta: { accountId: string; email?: string; name?: string }[] =
      [];
    const errors: { accountId: string; message: string }[] = [];

    for (const doc of accountsSnap.docs) {
      const data = doc.data() as AccountDoc;
      accountMeta.push({
        accountId: doc.id,
        email: data.email,
        name: data.name,
      });

      try {
        const accessToken = await ensureAccessToken(doc.ref, data);
        const events = await fetchEventsForAccount(
          accessToken,
          timeMin,
          timeMax
        );
        allEvents.push(
          ...events.map((ev) => ({
            ...ev,
            accountId: doc.id,
            sourceEmail: data.email,
            internalId: `${doc.id}:${ev.id}`,
          }))
        );
      } catch (error) {
        console.error("Google account sync failed", doc.id, error);
        errors.push({
          accountId: doc.id,
          message:
            error instanceof Error ? error.message : "unknown_error",
        });
      }
    }

    return NextResponse.json({ events: allEvents, accounts: accountMeta, errors });
  } catch (error) {
    const status =
      error instanceof Error && error.message === "UNAUTHENTICATED"
        ? 401
        : 500;
    if (status !== 401) {
    console.error("Google Events Error:", error);
    }
    return NextResponse.json(
      {
        events: [],
        accounts: [],
        error:
          error instanceof Error ? error.message : "unknown_error",
      },
      { status }
    );
  }
}
