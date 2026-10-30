/**
 * DEV-ONLY in-memory backend (EXPO_PUBLIC_FYT_AUTH_BYPASS=1). Lets the whole
 * UI flow be clicked through without native Firebase, including in Expo Go.
 * Never active in prod (see config/env.ts).
 *
 * Phone numbers mirror the emulator seed:
 *   +91 90000 00001  onboarded student      +91 90000 00002  onboarded corporate
 *   +91 90000 00004  blocked (Auth disabled) any other valid number: new learner
 * The OTP is always 123456.
 */
import { applyProfile, DEFAULT_CONFIG_PUBLIC, newUserDoc, type ConfigPublic, type SaveProfileRequest, type UserDoc } from "@fyt/domain";
import type { AuthUser } from "../session/state";
import { BackendError, type Backend } from "./types";

export const MOCK_OTP = "123456";

type Listener<T> = (v: T) => void;

export function createMockBackend(now: () => number = Date.now): Backend & { setConfig(patch: Partial<ConfigPublic>): void } {
  let user: AuthUser | null = null;
  let pendingPhone: string | null = null;
  let config: ConfigPublic = { ...DEFAULT_CONFIG_PUBLIC };
  const docs = new Map<string, UserDoc>();
  const authL = new Set<Listener<AuthUser | null>>();
  const cfgL = new Set<Listener<ConfigPublic | null>>();
  const docL = new Map<string, Set<Listener<UserDoc | null>>>();

  const emitDoc = (uid: string) => docL.get(uid)?.forEach((cb) => cb(docs.get(uid) ?? null));
  const seedFor = (phone: string): UserDoc | null => {
    const base = newUserDoc(phone, now());
    if (phone === "+919000000001")
      return { ...base, name: "Asha Rao", segment: "student", institution: "Demo Engineering College", interests: ["Software development"], skillsToLearn: ["React"], onboarded: true, onboardingStep: "done" };
    if (phone === "+919000000002")
      return { ...base, name: "Ravi Kumar", segment: "corporate", currentRole: "QA engineer", yearsExperience: 3, skillsToLearn: ["Python"], onboarded: true, onboardingStep: "done" };
    return null;
  };
  const delay = () => new Promise((r) => setTimeout(r, 350));
  const uidOf = (phone: string) => `mock-${phone.slice(-4)}`;

  return {
    kind: "mock",
    onAuthChanged(cb) {
      authL.add(cb);
      cb(user);
      return () => void authL.delete(cb);
    },
    onConfig(cb) {
      cfgL.add(cb);
      cb(config);
      return () => void cfgL.delete(cb);
    },
    onUserDoc(uid, cb) {
      const set = docL.get(uid) ?? new Set();
      set.add(cb);
      docL.set(uid, set);
      cb(docs.get(uid) ?? null);
      return () => void set.delete(cb);
    },
    async sendCode(phone) {
      await delay();
      pendingPhone = phone;
    },
    async confirmCode(code) {
      await delay();
      if (!pendingPhone) throw new BackendError("auth/session-expired", "Request a new code.");
      if (code !== MOCK_OTP) throw new BackendError("auth/invalid-verification-code", "That code isn't right.");
      if (pendingPhone === "+919000000004") throw new BackendError("auth/user-disabled", "This account is blocked.");
      const uid = uidOf(pendingPhone);
      if (!docs.has(uid)) {
        const seeded = seedFor(pendingPhone);
        if (seeded) docs.set(uid, seeded);
      }
      user = { uid, phone: pendingPhone };
      pendingPhone = null;
      authL.forEach((cb) => cb(user));
    },
    async ensureUser() {
      if (!user) throw new BackendError("UNAUTHENTICATED", "Sign in again.");
      let doc = docs.get(user.uid);
      if (!doc) {
        doc = newUserDoc(user.phone ?? "+919000000003", now());
        docs.set(user.uid, doc);
        emitDoc(user.uid);
      }
      return doc;
    },
    async saveProfile(req: SaveProfileRequest) {
      await delay();
      if (!user) throw new BackendError("UNAUTHENTICATED", "Sign in again.");
      const cur = docs.get(user.uid);
      if (!cur) throw new BackendError("PROFILE_INCOMPLETE", "Your account isn't set up yet.");
      try {
        const next = applyProfile(cur, req, now());
        docs.set(user.uid, next);
        emitDoc(user.uid);
        return next;
      } catch (e) {
        const err = e as { reason?: string; message: string; fieldErrors?: Record<string, string[]> };
        throw new BackendError(err.reason ?? "INTERNAL", err.message, err.fieldErrors);
      }
    },
    async signOut() {
      user = null;
      authL.forEach((cb) => cb(null));
    },
    setConfig(patch) {
      config = { ...config, ...patch };
      cfgL.forEach((cb) => cb(config));
    },
  };
}
