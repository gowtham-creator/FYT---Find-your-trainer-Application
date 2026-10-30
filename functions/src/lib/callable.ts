/**
 * `appCallable` wraps every learner-facing callable: auth (phone accounts
 * only), zod parsing, the maintenance / version / blocked gates, a request id
 * and one structured log line.
 */
import { randomUUID } from "node:crypto";
import { logger } from "firebase-functions/v2";
import { onCall, type CallableRequest } from "firebase-functions/v2/https";
import type { z } from "zod";
import { ConfigPublic, UserDoc, type ClientMeta } from "@fyt/domain";
import { db, isEmulator } from "./admin";
import { fail, toHttpsError } from "./errors";
import { checkGates } from "./gates";

export interface CallContext {
  uid: string;
  phone: string;
  requestId: string;
  now: number;
  config: ConfigPublic | null;
}

interface Options {
  /** ensureUserV1 and deleteAccountV1 must work for blocked users. */
  skipBlockedCheck?: boolean;
}

export async function readConfig(): Promise<ConfigPublic | null> {
  const snap = await db().doc("config/public").get();
  if (!snap.exists) return null;
  const parsed = ConfigPublic.safeParse(snap.data());
  return parsed.success ? parsed.data : null;
}

export async function readUser(uid: string): Promise<UserDoc | null> {
  const snap = await db().doc(`users/${uid}`).get();
  if (!snap.exists) return null;
  const parsed = UserDoc.safeParse(snap.data());
  return parsed.success ? parsed.data : null;
}

export function appCallable<S extends z.ZodType<{ client?: ClientMeta }>, R extends object>(
  name: string,
  schema: S,
  handler: (data: z.infer<S>, ctx: CallContext) => Promise<R>,
  opts: Options = {},
) {
  return onCall({ enforceAppCheck: false, cors: isEmulator() }, async (req: CallableRequest<unknown>) => {
    const requestId = randomUUID();
    const started = Date.now();
    const uid = req.auth?.uid;
    try {
      const provider = req.auth?.token.firebase?.sign_in_provider;
      const phone = req.auth?.token.phone_number;
      if (!uid || provider !== "phone" || !phone) throw fail("UNAUTHENTICATED", "Sign in with your mobile number.", { requestId });

      const parsed = schema.safeParse(req.data ?? {});
      if (!parsed.success) {
        const fieldErrors: Record<string, string[]> = {};
        for (const issue of parsed.error.issues) (fieldErrors[issue.path.join(".") || "_"] ??= []).push(issue.message);
        throw fail("VALIDATION_FAILED", "Some details need fixing.", { fieldErrors, requestId });
      }

      const [config, user] = await Promise.all([readConfig(), opts.skipBlockedCheck ? Promise.resolve(null) : readUser(uid)]);
      checkGates({ config, client: parsed.data.client, user, skipBlockedCheck: !!opts.skipBlockedCheck });

      const result = await handler(parsed.data, { uid, phone, requestId, now: Date.now(), config });
      logger.info("callable", { fn: name, requestId, uid, ms: Date.now() - started, ok: true });
      return { ...result, requestId };
    } catch (e) {
      const err = toHttpsError(e, requestId);
      logger.warn("callable", { fn: name, requestId, uid, ms: Date.now() - started, ok: false, reason: (err.details as { reason?: string })?.reason });
      throw err;
    }
  });
}
