import { describe, expect, it } from "vitest";
import { compareVersions, ConfigPublic, DEFAULT_CONFIG_PUBLIC, ERROR_REASONS, ErrorDetails, formatIndianPhone, HTTPS_CODE, isBelowMin, normalizeIndianPhone, reasonOf } from "../src";

describe("semver gate", () => {
  it("compares numerically, not as strings", () => {
    expect(compareVersions("1.10.0", "1.9.9")).toBe(1);
    expect(compareVersions("1.0.0", "1.0.0")).toBe(0);
    expect(compareVersions("0.9.0", "1.0.0")).toBe(-1);
  });
  it("fails closed on a bad app version and open on a bad config", () => {
    expect(isBelowMin("1.0.0", "9.0.0")).toBe(true);
    expect(isBelowMin("1.0.0", "1.0.0")).toBe(false);
    expect(isBelowMin("garbage", "1.0.0")).toBe(true);
    expect(isBelowMin("1.0.0", "x")).toBe(false);
    expect(isBelowMin(null, undefined)).toBe(false);
  });
});

describe("Indian phone numbers", () => {
  it.each([
    ["9000247318", "+919000247318"],
    ["+91 90002 47318", "+919000247318"],
    ["09000247318", "+919000247318"],
    ["0091-90002-47318", "+919000247318"],
  ])("normalises %s", (input, out) => expect(normalizeIndianPhone(input)).toBe(out));
  it.each(["5000247318", "900024731", "+14155550100", ""])("rejects %s", (input) => expect(normalizeIndianPhone(input)).toBeNull());
  it("formats for display", () => expect(formatIndianPhone("+919000247318")).toBe("+91 90002 47318"));
});

describe("error codes", () => {
  it("maps every reason to an HttpsError code", () => {
    for (const r of ERROR_REASONS) expect(HTTPS_CODE[r]).toMatch(/^[a-z-]+$/);
  });
  it("reads reasons from details and falls back to INTERNAL", () => {
    expect(reasonOf({ reason: "SLOT_FULL", retryable: false })).toBe("SLOT_FULL");
    expect(reasonOf({ reason: "MADE_UP", retryable: false })).toBe("INTERNAL");
    expect(reasonOf(undefined)).toBe("INTERNAL");
    expect(ErrorDetails.safeParse({ reason: "CONTENTION", retryable: true, requestId: "r1" }).success).toBe(true);
  });
});

describe("config/public", () => {
  it("defaults parse", () => expect(ConfigPublic.parse(DEFAULT_CONFIG_PUBLIC)).toEqual(DEFAULT_CONFIG_PUBLIC));
  it("rejects a non-semver minimum version", () => {
    expect(ConfigPublic.safeParse({ ...DEFAULT_CONFIG_PUBLIC, minAppVersion: { android: "1.0", ios: "1.0.0" } }).success).toBe(false);
  });
});
