import { describe, it, expect, vi, beforeAll, afterAll } from "vitest";
import { planJoinTimes } from "@/utils/recall";

const advanceTo = (ms: number) => {
  vi.setSystemTime(ms);
};

beforeAll(() => {
  vi.useFakeTimers();
});

afterAll(() => {
  vi.useRealTimers();
});

describe("planJoinTimes", () => {
  it("returns lead mode when there is enough time", () => {
    const now = Date.UTC(2025, 0, 1, 12, 0, 0);
    advanceTo(now);
    const start = new Date(now + 60 * 60 * 1000).toISOString(); // 60 min later
    const result = planJoinTimes(start, 15);
    expect(result.mode).toBe("lead");
    expect(result.isLate).toBe(false);
  });

  it("falls back to just_before when lead window has passed", () => {
    const now = Date.UTC(2025, 0, 1, 12, 0, 0);
    advanceTo(now);
    const start = new Date(now + 5 * 60 * 1000).toISOString(); // 5 min later
    const result = planJoinTimes(start, 15);
    expect(result.mode).toBe("just_before");
    expect(new Date(result.actualJoinAtIso).getTime()).toBeLessThan(
      new Date(result.startAtIso).getTime()
    );
  });

  it("joins ASAP when already late", () => {
    const now = Date.UTC(2025, 0, 1, 12, 0, 0);
    advanceTo(now);
    const start = new Date(now - 2 * 60 * 1000).toISOString(); // already started
    const result = planJoinTimes(start, 10);
    expect(result.mode).toBe("asap");
    expect(result.isLate).toBe(true);
  });
});

