/**
 * ensureUserV1: creates `users/{uid}` on first sign-in (registration) and
 * bumps `lastActiveAt`, throttled to once per 6 hours. Works for blocked users
 * so the app can show the Blocked gate honestly.
 */
import { EnsureUserV1Request, LAST_ACTIVE_THROTTLE_MS, newUserDoc, UserDoc } from "@fyt/domain";
import { db } from "../lib/admin";
import { appCallable } from "../lib/callable";

export interface UserStore {
  get(uid: string): Promise<unknown | undefined>;
  set(uid: string, doc: UserDoc): void;
  update(uid: string, patch: Partial<UserDoc>): void;
}

/** The transaction body, separated so it is unit-testable with an in-memory store. */
export async function ensureUserCore(store: UserStore, uid: string, phone: string, now: number): Promise<{ user: UserDoc; created: boolean }> {
  const existing = await store.get(uid);
  if (existing === undefined) {
    const user = newUserDoc(phone, now);
    store.set(uid, user);
    return { user, created: true };
  }
  const user = UserDoc.parse(existing);
  if (now - user.lastActiveAt >= LAST_ACTIVE_THROTTLE_MS) {
    store.update(uid, { lastActiveAt: now });
    return { user: { ...user, lastActiveAt: now }, created: false };
  }
  return { user, created: false };
}

export const ensureUserV1 = appCallable(
  "ensureUserV1",
  EnsureUserV1Request,
  async (_data, ctx) => {
    const ref = (uid: string) => db().doc(`users/${uid}`);
    const { user } = await db().runTransaction(async (tx) => {
      const snap = await tx.get(ref(ctx.uid));
      return ensureUserCore(
        {
          get: async () => (snap.exists ? snap.data() : undefined),
          set: (uid, doc) => void tx.set(ref(uid), doc),
          update: (uid, patch) => void tx.update(ref(uid), patch),
        },
        ctx.uid,
        ctx.phone,
        ctx.now,
      );
    });
    return { user };
  },
  { skipBlockedCheck: true },
);
