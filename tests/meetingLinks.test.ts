import { describe, it, expect } from "vitest";
import {
  extractJoinUrl,
  detectPlatform,
  type CalendarEventForLinks,
} from "@/utils/meetingLinks";

const baseEvent = (): CalendarEventForLinks => ({
  summary: "Strategy Session",
});

describe("meetingLinks", () => {
  it("uses conference entry points first", () => {
    const event: CalendarEventForLinks = {
      ...baseEvent(),
      conferenceData: {
        entryPoints: [{ uri: "https://zoom.us/j/123" }],
      },
    };
    expect(extractJoinUrl(event)).toContain("zoom.us");
  });

  it("falls back to description/body links", () => {
    const event: CalendarEventForLinks = {
      ...baseEvent(),
      description: "Join here: https://meet.google.com/abc-defg-hij",
    };
    expect(extractJoinUrl(event)).toContain("meet.google.com");
  });

  it("detects platform from url", () => {
    expect(detectPlatform("https://zoom.us/j/1")).toBe("zoom");
    expect(detectPlatform("https://meet.google.com/abc")).toBe("meet");
    expect(detectPlatform(null)).toBe("unknown");
  });
});

