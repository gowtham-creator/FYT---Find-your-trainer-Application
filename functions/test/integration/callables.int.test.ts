/**
 * End-to-end callables against the Firebase Emulator Suite (needs Java 21):
 *
 *   npm run test:integration        (from the repo root)
 *
 * Signs in a phone user through the Auth emulator REST API, then calls the
 * functions over HTTP the way the app's SDK does.
 */
import { beforeAll, describe, expect, it } from "vitest";

const PROJECT = "demo-fyt";
const AUTH = `http://${process.env.FIREBASE_AUTH_EMULATOR_HOST ?? "127.0.0.1:9099"}`;
const FN = `http://127.0.0.1:5001/${PROJECT}/asia-south1`;

async function json(url: string, init?: RequestInit) {
  const r = await fetch(url, { ...init, headers: { "content-type": "application/json", ...(init?.headers ?? {}) } });
  return { status: r.status, body: (await r.json()) as Record<string, any> };
}

async function phoneSignIn(phoneNumber: string): Promise<string> {
  const idt = `${AUTH}/identitytoolkit.googleapis.com/v1`;
  const sent = await json(`${idt}/accounts:sendVerificationCode?key=fake`, { method: "POST", body: JSON.stringify({ phoneNumber, recaptchaToken: "ignored" }) });
  const codes = await json(`${AUTH}/emulator/v1/projects/${PROJECT}/verificationCodes`);
  const code = codes.body.verificationCodes.filter((c: any) => c.phoneNumber === phoneNumber).at(-1).code;
  const signed = await json(`${idt}/accounts:signInWithPhoneNumber?key=fake`, { method: "POST", body: JSON.stringify({ sessionInfo: sent.body.sessionInfo, code }) });
  return signed.body.idToken;
}

const call = (name: string, token: string | null, data: unknown) =>
  json(`${FN}/${name}`, { method: "POST", headers: token ? { authorization: `Bearer ${token}` } : {}, body: JSON.stringify({ data }) });

describe("callables on the emulator", () => {
  let token = "";
  beforeAll(async () => {
    token = await phoneSignIn("+919000000099");
  });

  it("rejects unauthenticated calls", async () => {
    const r = await call("ensureUserV1", null, {});
    expect(r.body.error.details.reason).toBe("UNAUTHENTICATED");
  });

  it("ensureUserV1 creates the user, saveProfileV1 sets the segment", async () => {
    const a = await call("ensureUserV1", token, { client: { appVersion: "1.0.0", platform: "android" } });
    expect(a.body.result.user.onboardingStep).toBe("segment");
    const b = await call("saveProfileV1", token, { step: "segment", segment: "student" });
    expect(b.body.result.user.segment).toBe("student");
    const c = await call("saveProfileV1", token, { step: "details", name: "A" });
    expect(c.body.error.details.reason).toBe("VALIDATION_FAILED");
  });
});
