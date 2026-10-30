/**
 * saveProfileV1: onboarding steps (segment, details, profile) and profile
 * edits. The field rules live in @fyt/domain `applyProfile`, shared with the app.
 */
import { applyProfile, DomainError, SaveProfileV1Request, UserDoc, type SaveProfileRequest } from "@fyt/domain";
import { db } from "../lib/admin";
import { appCallable } from "../lib/callable";

export function saveProfileCore(existing: unknown | undefined, req: SaveProfileRequest, now: number): UserDoc {
  if (existing === undefined) throw new DomainError("PROFILE_INCOMPLETE", "Your account isn't set up yet. Restart the app and try again.");
  return applyProfile(UserDoc.parse(existing), req, now);
}

export const saveProfileV1 = appCallable("saveProfileV1", SaveProfileV1Request, async (data, ctx) => {
  const { client: _client, ...req } = data;
  const ref = db().doc(`users/${ctx.uid}`);
  const user = await db().runTransaction(async (tx) => {
    const snap = await tx.get(ref);
    const next = saveProfileCore(snap.exists ? snap.data() : undefined, req, ctx.now);
    tx.set(ref, next);
    return next;
  });
  return { user };
});
