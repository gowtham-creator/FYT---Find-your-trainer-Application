import { describe, expect, it } from "vitest";
import { HttpsError } from "firebase-functions/v2/https";
import { DomainError, LAST_ACTIVE_THROTTLE_MS, type UserDoc } from "@fyt/domain";
import { ensureUserCore, type UserStore } from "../../src/callables/ensureUser";
import { saveProfileCore } from "../../src/callables/saveProfile";
import { fail, toHttpsError } from "../../src/lib/errors";

function memoryStore(initial: Record<string, UserDoc> = {}) {
  const docs: Record<string, UserDoc> = { ...initial };
  const store: UserStore = {
    get: async (uid) => docs[uid],
    set: (uid, doc) => void (docs[uid] = doc),
    update: (uid, patch) => void (docs[uid] = { ...docs[uid]!, ...patch }),
  };
  return { docs, store };
}

const T0 = 1_790_000_000_000;

describe("ensureUserV1 core", () => {
  it("creates the skeleton on first call", async () => {
    const { docs, store } = memoryStore();
    const r = await ensureUserCore(store, "u1", "+919000000003", T0);
    expect(r.created).toBe(true);
    expect(docs.u1?.onboardingStep).toBe("segment");
    expect(docs.u1?.phone).toBe("+919000000003");
  });

  it("throttles lastActiveAt to once per 6 hours", async () => {
    const { docs, store } = memoryStore();
    await ensureUserCore(store, "u1", "+919000000003", T0);
    await ensureUserCore(store, "u1", "+919000000003", T0 + 1000);
    expect(docs.u1?.lastActiveAt).toBe(T0);
    const r = await ensureUserCore(store, "u1", "+919000000003", T0 + LAST_ACTIVE_THROTTLE_MS);
    expect(r.created).toBe(false);
    expect(docs.u1?.lastActiveAt).toBe(T0 + LAST_ACTIVE_THROTTLE_MS);
  });

  it("returns blocked users honestly instead of failing", async () => {
    const { store } = memoryStore();
    const { user } = await ensureUserCore(store, "u4", "+919000000004", T0);
    const blocked = memoryStore({ u4: { ...user, blocked: true } });
    const r = await ensureUserCore(blocked.store, "u4", "+919000000004", T0 + 1);
    expect(r.user.blocked).toBe(true);
  });
});

describe("saveProfileV1 core", () => {
  it("needs an existing user doc", () => {
    expect(() => saveProfileCore(undefined, { step: "segment", segment: "student" }, T0)).toThrow(DomainError);
  });

  it("applies the segment step", async () => {
    const { docs, store } = memoryStore();
    await ensureUserCore(store, "u1", "+919000000003", T0);
    const next = saveProfileCore(docs.u1, { step: "segment", segment: "corporate" }, T0 + 5);
    expect(next.segment).toBe("corporate");
    expect(next.onboardingStep).toBe("details");
  });
});

describe("error envelope", () => {
  it("carries the reason, retryability and request id", () => {
    const e = fail("SLOT_FULL", "That slot was just taken.", { requestId: "r1" });
    expect(e.code).toBe("resource-exhausted");
    expect(e.details).toEqual({ reason: "SLOT_FULL", retryable: false, requestId: "r1" });
  });

  it("maps domain errors and hides unknown ones", () => {
    const d = toHttpsError(new DomainError("VALIDATION_FAILED", "Bad", { fieldErrors: { name: ["x"] } }), "r2");
    expect(d.code).toBe("invalid-argument");
    expect((d.details as { fieldErrors: unknown }).fieldErrors).toEqual({ name: ["x"] });
    const u = toHttpsError(new Error("secret stack detail"), "r3");
    expect(u).toBeInstanceOf(HttpsError);
    expect(u.message).not.toContain("secret");
    expect((u.details as { reason: string }).reason).toBe("INTERNAL");
  });
});
