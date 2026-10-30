import { DEFAULT_CONFIG_PUBLIC, newUserDoc, type ConfigPublic, type UserDoc } from "@fyt/domain";
import { deriveSession, redirectFor, ROUTES, type SessionInputs, type SessionState } from "./state";

const NOW = 1_790_000_000_000;
const fresh = newUserDoc("+919000000003", NOW);
const student: UserDoc = { ...fresh, name: "Asha", segment: "student", institution: "X", interests: ["Design"], skillsToLearn: ["React"], onboarded: true, onboardingStep: "done" };
const corporate: UserDoc = { ...student, segment: "corporate", currentRole: "Dev", yearsExperience: 2 };
const cfg = (patch: Partial<ConfigPublic> = {}): ConfigPublic => ({ ...DEFAULT_CONFIG_PUBLIC, ...patch });

const base: SessionInputs = {
  authResolved: true,
  config: cfg(),
  appVersion: "1.0.0",
  platform: "android",
  authUser: { uid: "u1", phone: "+919000000001" },
  authDisabled: false,
  userDoc: student,
};
const s = (patch: Partial<SessionInputs>) => deriveSession({ ...base, ...patch });

describe("deriveSession", () => {
  it("boots until auth and config resolve", () => {
    expect(s({ authResolved: false }).kind).toBe("booting");
    expect(s({ config: undefined }).kind).toBe("booting");
  });

  it("boots while a signed-in user's doc is loading", () => {
    expect(s({ userDoc: undefined }).kind).toBe("booting");
  });

  it("update required beats maintenance, per platform", () => {
    const c = cfg({ minAppVersion: { android: "2.0.0", ios: "1.0.0" }, maintenance: { on: true } });
    expect(s({ config: c }).kind).toBe("updateRequired");
    expect(s({ config: c, platform: "ios" }).kind).toBe("maintenance");
  });

  it("maintenance applies even when signed out and carries the message", () => {
    const st = s({ authUser: null, config: cfg({ maintenance: { on: true, message: "Back at 6" } }) });
    expect(st).toEqual({ kind: "maintenance", message: "Back at 6", until: undefined });
  });

  it("a missing config never blocks (falls through)", () => {
    expect(s({ config: null }).kind).toBe("ready");
  });

  it("signed out without a user", () => {
    expect(s({ authUser: null, userDoc: undefined }).kind).toBe("signedOut");
  });

  it("blocked by an Auth-disabled sign-in or by the user doc", () => {
    expect(s({ authUser: null, authDisabled: true }).kind).toBe("blocked");
    expect(s({ userDoc: { ...student, blocked: true, blockedReason: "abuse" } })).toEqual({ kind: "blocked", reason: "abuse" });
  });

  it("new learners pick a segment first, then details", () => {
    expect(s({ userDoc: null })).toEqual({ kind: "needsOnboarding", step: "segment" });
    expect(s({ userDoc: fresh })).toEqual({ kind: "needsOnboarding", step: "segment" });
    expect(s({ userDoc: { ...fresh, segment: "student", onboardingStep: "details" } })).toEqual({ kind: "needsOnboarding", step: "details" });
  });

  it("ready with the segment once onboarded (the profile step is optional)", () => {
    expect(s({})).toEqual({ kind: "ready", segment: "student" });
    expect(s({ userDoc: corporate })).toEqual({ kind: "ready", segment: "corporate" });
    expect(s({ userDoc: { ...student, onboardingStep: "profile" } }).kind).toBe("ready");
  });
});

describe("redirectFor", () => {
  const cases: [SessionState, string, string | null][] = [
    [{ kind: "booting" }, "/", null],
    [{ kind: "booting" }, "/home", "/"],
    [{ kind: "updateRequired" }, "/auth/phone", ROUTES.update],
    [{ kind: "updateRequired" }, ROUTES.update, null],
    [{ kind: "maintenance" }, "/home", ROUTES.maintenance],
    [{ kind: "maintenance" }, ROUTES.maintenance, null],
    [{ kind: "blocked" }, "/auth/otp", ROUTES.blocked],
    [{ kind: "blocked" }, ROUTES.blocked, null],
    [{ kind: "signedOut" }, "/", ROUTES.phone],
    [{ kind: "signedOut" }, "/home", ROUTES.phone],
    [{ kind: "signedOut" }, ROUTES.phone, null],
    [{ kind: "signedOut" }, ROUTES.otp, null],
    [{ kind: "signedOut" }, ROUTES.maintenance, ROUTES.phone],
    [{ kind: "needsOnboarding", step: "segment" }, ROUTES.otp, ROUTES.segment],
    [{ kind: "needsOnboarding", step: "segment" }, ROUTES.details, ROUTES.segment],
    [{ kind: "needsOnboarding", step: "details" }, ROUTES.segment, null],
    [{ kind: "needsOnboarding", step: "details" }, "/home", ROUTES.details],
    [{ kind: "ready", segment: "student" }, ROUTES.otp, ROUTES.home],
    [{ kind: "ready", segment: "student" }, ROUTES.segment, ROUTES.home],
    [{ kind: "ready", segment: "student" }, ROUTES.blocked, ROUTES.home],
    [{ kind: "ready", segment: "student" }, "/", ROUTES.home],
    [{ kind: "ready", segment: "corporate" }, ROUTES.bookings, null],
    [{ kind: "ready", segment: "corporate" }, "/profile/", null],
    [{ kind: "ready", segment: "corporate" }, ROUTES.explore, null],
  ];
  it.each(cases)("%j at %s -> %s", (state, path, expected) => {
    expect(redirectFor(state, path)).toBe(expected);
  });

  it("every state's own target is stable (no redirect loops)", () => {
    const states: SessionState[] = [
      { kind: "booting" },
      { kind: "updateRequired" },
      { kind: "maintenance" },
      { kind: "blocked" },
      { kind: "signedOut" },
      { kind: "needsOnboarding", step: "segment" },
      { kind: "needsOnboarding", step: "details" },
      { kind: "ready", segment: "student" },
    ];
    for (const st of states) {
      const target = redirectFor(st, "/somewhere-else") ?? "/somewhere-else";
      expect(redirectFor(st, target)).toBeNull();
    }
  });
});
