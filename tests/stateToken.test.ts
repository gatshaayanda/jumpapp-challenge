import { describe, it, expect } from "vitest";
import { encodeState, decodeState } from "@/utils/stateToken";

describe("stateToken", () => {
  it("encodes and decodes payloads", () => {
    const token = encodeState({
      uid: "user-123",
      provider: "linkedin",
      extra: { foo: "bar" },
    });

    const decoded = decodeState(token);
    expect(decoded.uid).toBe("user-123");
    expect(decoded.provider).toBe("linkedin");
    expect(decoded.extra).toEqual({ foo: "bar" });
    expect(typeof decoded.nonce).toBe("string");
    expect(typeof decoded.ts).toBe("number");
  });

  it("rejects tampered tokens", () => {
    const token = encodeState({ uid: "user-1" });
    const [payload] = token.split(".");
    const tampered = `${payload}.invalidsig`;
    expect(() => decodeState(tampered)).toThrow(/signature/i);
  });
});

