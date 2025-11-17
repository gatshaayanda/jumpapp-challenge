export type EntryPoint = {
  uri?: string | null;
  entryPointType?: string | null;
  label?: string | null;
};

export type CalendarEventForLinks = {
  summary?: string | null;
  description?: string | null;
  location?: string | null;
  hangoutLink?: string | null;
  conferenceData?: { entryPoints?: EntryPoint[] | null } | null;
};

export type Platform = "zoom" | "meet" | "teams" | "unknown";

export function normalizeUrl(raw: string): string {
  return raw.replace(/[)>.,\]]+$/g, "");
}

export function extractAllUrls(text: string | null | undefined): string[] {
  if (!text) return [];
  const urls: string[] = [];
  const re = /https?:\/\/[^\s<>()"'`]+/gi;
  let match: RegExpExecArray | null;
  while ((match = re.exec(text)) !== null) {
    urls.push(normalizeUrl(match[0]));
  }
  return urls;
}

export function classifyProvider(u: string): Platform {
  try {
    const url = new URL(u.toLowerCase());
    const host = url.host;
    if (host.includes("zoom.us")) return "zoom";
    if (host.includes("meet.google.com")) return "meet";
    if (host.includes("teams.microsoft.com")) return "teams";
    return "unknown";
  } catch {
    return "unknown";
  }
}

export function extractJoinUrl(event: CalendarEventForLinks): string | null {
  const entryPoints = event.conferenceData?.entryPoints ?? [];
  for (const ep of entryPoints || []) {
    const uri = ep?.uri;
    if (!uri) continue;
    const kind = classifyProvider(uri);
    if (kind !== "unknown") return uri;
  }

  if (event.description) {
    const urls = extractAllUrls(event.description);
    const hit = urls.find((u) => classifyProvider(u) !== "unknown");
    if (hit) return hit;
  }

  if (event.location) {
    const urls = extractAllUrls(event.location);
    const hit = urls.find((u) => classifyProvider(u) !== "unknown");
    if (hit) return hit;
  }

  if (event.hangoutLink) {
    const kind = classifyProvider(event.hangoutLink);
    if (kind !== "unknown") return normalizeUrl(event.hangoutLink);
  }

  const haystack = [
    event.summary,
    event.description,
    event.location,
    event.hangoutLink,
  ]
    .filter(Boolean)
    .join("\n");
  const urls = extractAllUrls(haystack);
  const hit = urls.find((u) => classifyProvider(u) !== "unknown");
  if (hit) return hit;

  return null;
}

export function detectPlatform(url: string | null): Platform {
  if (!url) return "unknown";
  return classifyProvider(url);
}

