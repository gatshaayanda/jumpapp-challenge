import { adminAuth } from "./firebaseAdmin";

function parseCookies(cookieHeader: string) {
  const output: Record<string, string> = {};
  if (!cookieHeader) return output;
  const parts = cookieHeader.split(";");
  for (const part of parts) {
    const [key, ...rest] = part.trim().split("=");
    if (!key) continue;
    output[key] = decodeURIComponent(rest.join("="));
  }
  return output;
}

export async function requireUser(req: Request) {
  const auth = req.headers.get("authorization") ?? "";
  let token: string | null = null;

  if (auth?.startsWith("Bearer ")) {
    token = auth.slice(7).trim();
  }

  if (!token) {
    const cookies = parseCookies(req.headers.get("cookie") ?? "");
    token = cookies["firebase_session"] ?? null;
  }

  if (!token) {
    throw new Error("UNAUTHENTICATED");
  }

  try {
    const decoded = await adminAuth.verifyIdToken(token);
    return {
      uid: decoded.uid,
      email: decoded.email ?? null,
    };
  } catch (err) {
    console.error("verifyIdToken failed", err);
    throw new Error("UNAUTHENTICATED");
  }
}

