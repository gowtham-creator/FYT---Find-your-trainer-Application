import { describe, expect, it } from "vitest";
import { DEFAULT_CONFIG_PUBLIC, DomainError, newUserDoc, type ConfigPublic } from "@fyt/domain";
import { checkGates } from "../../src/lib/gates";

const cfg = (patch: Partial<ConfigPublic> = {}): ConfigPublic => ({ ...DEFAULT_CONFIG_PUBLIC, ...patch });
const user = newUserDoc("+919000000001", 0);

function reason(fn: () => void): string | null {
  try {
    fn();
    return null;
  } catch (e) {
    return (e as DomainError).reason;
  }
}

describe("callable gates", () => {
  it("passes a normal request", () => {
    expect(reason(() => checkGates({ config: cfg(), client: { appVersion: "1.0.0", platform: "ios" }, user, skipBlockedCheck: false }))).toBeNull();
  });

  it("maintenance wins over everything else", () => {
    const c = cfg({ maintenance: { on: true, message: "Back at 6 pm" }, minAppVersion: { android: "9.0.0", ios: "9.0.0" } });
    expect(reason(() => checkGates({ config: c, client: { appVersion: "1.0.0", platform: "android" }, user: { ...user, blocked: true }, skipBlockedCheck: false }))).toBe("MAINTENANCE");
  });

  it("blocks old app versions per platform", () => {
    const c = cfg({ minAppVersion: { android: "2.0.0", ios: "1.0.0" } });
    expect(reason(() => checkGates({ config: c, client: { appVersion: "1.5.0", platform: "android" }, user, skipBlockedCheck: false }))).toBe("APP_UPDATE_REQUIRED");
    expect(reason(() => checkGates({ config: c, client: { appVersion: "1.5.0", platform: "ios" }, user, skipBlockedCheck: false }))).toBeNull();
  });

  it("rejects blocked users unless the callable opts out", () => {
    const blocked = { ...user, blocked: true };
    expect(reason(() => checkGates({ config: cfg(), client: undefined, user: blocked, skipBlockedCheck: false }))).toBe("USER_BLOCKED");
    expect(reason(() => checkGates({ config: cfg(), client: undefined, user: blocked, skipBlockedCheck: true }))).toBeNull();
  });

  it("tolerates a missing config document", () => {
    expect(reason(() => checkGates({ config: null, client: { appVersion: "0.0.1", platform: "ios" }, user: null, skipBlockedCheck: false }))).toBeNull();
  });
});
