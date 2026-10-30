import { DEFAULT_CONFIG_PUBLIC, type UserDoc } from "@fyt/domain";
import { deriveSession } from "../session/state";
import type { AuthUser } from "../session/state";
import { createMockBackend, MOCK_OTP } from "./mock";
import { BackendError } from "./types";

/** Drives the dev-bypass backend through the session machine, like the app does. */
async function signIn(phone: string) {
  const b = createMockBackend(() => 1_790_000_000_000);
  let user: AuthUser | null = null;
  let doc: UserDoc | null | undefined;
  b.onAuthChanged((u) => (user = u));
  await b.sendCode(phone);
  await b.confirmCode(MOCK_OTP);
  b.onUserDoc(user!.uid, (d) => (doc = d), () => undefined);
  await b.ensureUser();
  const state = () =>
    deriveSession({ authResolved: true, config: DEFAULT_CONFIG_PUBLIC, appVersion: "1.0.0", platform: "ios", authUser: user, authDisabled: false, userDoc: doc });
  return { b, state };
}

describe("dev bypass backend", () => {
  it("seeded student and corporate land on their homes", async () => {
    expect((await signIn("+919000000001")).state()).toEqual({ kind: "ready", segment: "student" });
    expect((await signIn("+919000000002")).state()).toEqual({ kind: "ready", segment: "corporate" });
  });

  it("a new learner goes segment -> details -> ready", async () => {
    const { b, state } = await signIn("+919000000003");
    expect(state()).toEqual({ kind: "needsOnboarding", step: "segment" });
    await b.saveProfile({ step: "segment", segment: "corporate" });
    expect(state()).toEqual({ kind: "needsOnboarding", step: "details" });
    await expect(b.saveProfile({ step: "details", name: "Ravi" })).rejects.toMatchObject({ code: "VALIDATION_FAILED" });
    await b.saveProfile({ step: "details", name: "Ravi", currentRole: "Dev", yearsExperience: 1, skillsToLearn: ["AWS"] });
    expect(state()).toEqual({ kind: "ready", segment: "corporate" });
  });

  it("rejects a wrong code and the blocked number", async () => {
    const b = createMockBackend();
    await b.sendCode("+919000000005");
    await expect(b.confirmCode("000000")).rejects.toBeInstanceOf(BackendError);
    await b.sendCode("+919000000004");
    await expect(b.confirmCode(MOCK_OTP)).rejects.toMatchObject({ code: "auth/user-disabled" });
  });

  it("sign out returns to signed out", async () => {
    const { b, state } = await signIn("+919000000001");
    await b.signOut();
    expect(state().kind).toBe("signedOut");
  });
});
