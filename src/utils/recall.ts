export type JoinPlan = {
  startAtIso: string;
  desiredIso: string;
  actualJoinAtIso: string;
  isLate: boolean;
  mode: "lead" | "just_before" | "asap";
};

/**
 * Plan join times:
 * - ideal: start - leadMin minutes
 * - if that window already passed, try to join just BEFORE start
 * - if even that is impossible, join ASAP
 */
export function planJoinTimes(startISO: string, leadMin: number): JoinPlan {
  const start = new Date(startISO);
  const startMs = start.getTime();
  const desiredMs = startMs - leadMin * 60_000;
  const nowMs = Date.now();

  const bufferBeforeStart = 15_000; // arrive at least 15s before start if possible
  const bufferNow = 10_000; // when late, join ~10s from now

  let joinMs: number;
  let mode: JoinPlan["mode"] = "lead";
  let isLate = false;

  if (desiredMs > nowMs + bufferNow) {
    joinMs = desiredMs;
    mode = "lead";
  } else {
    const latestBeforeStart = startMs - bufferBeforeStart;
    if (latestBeforeStart > nowMs + bufferNow) {
      joinMs = latestBeforeStart;
      mode = "just_before";
    } else {
      joinMs = nowMs + bufferNow;
      mode = "asap";
    }
  }

  if (joinMs >= startMs) {
    isLate = true;
  }

  return {
    startAtIso: new Date(startMs).toISOString(),
    desiredIso: new Date(desiredMs).toISOString(),
    actualJoinAtIso: new Date(joinMs).toISOString(),
    isLate,
    mode,
  };
}

