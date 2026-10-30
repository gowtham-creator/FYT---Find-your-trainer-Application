/**
 * Callable envelope (INTEGRATION-PLAN §3, APP-ARCHITECTURE §7) and the v1
 * request/response schemas of the Milestone 1 callables.
 */
import { z } from "zod";
import { Platform } from "./common";
import { SaveProfileRequest, UserDoc } from "./user";

export const ClientMeta = z.object({
  appVersion: z.string().max(32),
  platform: Platform,
});
export type ClientMeta = z.infer<typeof ClientMeta>;

/** Every app request may carry `client`; it is required by the version gate. */
export const withClient = <T extends z.ZodRawShape>(shape: z.ZodObject<T>) => shape.extend({ client: ClientMeta.optional() });

export const EnsureUserV1Request = withClient(z.object({}));
export type EnsureUserV1Request = z.infer<typeof EnsureUserV1Request>;

export const SaveProfileV1Request = withClient(SaveProfileRequest);
export type SaveProfileV1Request = z.infer<typeof SaveProfileV1Request>;

export const UserV1Response = z.object({ user: UserDoc, requestId: z.string() });
export type UserV1Response = z.infer<typeof UserV1Response>;

/** Callable names, versioned. Never change a published one; add `…V2`. */
export const CALLABLES = {
  ensureUser: "ensureUserV1",
  saveProfile: "saveProfileV1",
} as const;
