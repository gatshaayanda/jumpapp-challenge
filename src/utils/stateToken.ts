import { createHmac, randomBytes, timingSafeEqual } from "crypto";

function getSecret() {
  const secret = process.env.OAUTH_STATE_SECRET;
  if (!secret) {
    throw new Error("OAUTH_STATE_SECRET env var is required");
  }
  return secret;
}

function base64UrlEncode(buf: Buffer) {
  return buf
    .toString("base64")
    .replace(/=/g, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");
}

function base64UrlDecode(str: string) {
  const pad = 4 - (str.length % 4);
  const padded = str + (pad < 4 ? "=".repeat(pad) : "");
  const b64 = padded.replace(/-/g, "+").replace(/_/g, "/");
  return Buffer.from(b64, "base64");
}

export type StatePayload = {
  uid: string;
  nonce: string;
  ts: number;
  provider?: string;
  extra?: Record<string, unknown>;
};

export function encodeState(
  payload: Omit<StatePayload, "nonce" | "ts"> & Partial<StatePayload>
) {
  const body: StatePayload = {
    uid: payload.uid,
    nonce: payload.nonce ?? base64UrlEncode(randomBytes(9)),
    ts: payload.ts ?? Date.now(),
    provider: payload.provider,
    extra: payload.extra,
  };

  const encoded = base64UrlEncode(Buffer.from(JSON.stringify(body)));
  const sig = createHmac("sha256", getSecret()).update(encoded).digest();
  return `${encoded}.${base64UrlEncode(sig)}`;
}

export function decodeState(state: string): StatePayload {
  const [encoded, sig] = state.split(".");
  if (!encoded || !sig) {
    throw new Error("Invalid state");
  }

  const expected = createHmac("sha256", getSecret()).update(encoded).digest();
  const actual = base64UrlDecode(sig);

  if (
    expected.length !== actual.length ||
    !timingSafeEqual(expected, actual)
  ) {
    throw new Error("Invalid state signature");
  }

  const payload = JSON.parse(base64UrlDecode(encoded).toString()) as StatePayload;
  if (!payload?.uid) {
    throw new Error("Invalid state payload");
  }
  return payload;
}

