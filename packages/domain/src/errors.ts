/**
 * Error codes shared by every callable and every client (APP-ARCHITECTURE §3.7).
 * Clients switch on `reason`, never on the message text.
 */
import { z } from "zod";

export const ERROR_REASONS = [
  "VALIDATION_FAILED",
  "USER_BLOCKED",
  "APP_UPDATE_REQUIRED",
  "MAINTENANCE",
  "PROFILE_INCOMPLETE",
  "LISTING_NOT_FOUND",
  "SLOT_FULL",
  "SLOT_NOT_OFFERED",
  "LEAD_TIME",
  "USER_OVERLAP",
  "BOOKING_LIMIT",
  "IDEMPOTENCY_MISMATCH",
  "CONTENTION",
  "BOOKING_NOT_FOUND",
  "INVALID_STATE",
  "CANCEL_WINDOW_CLOSED",
  "RESCHEDULE_DISABLED",
  "REAUTH_REQUIRED",
  "RATE_LIMITED",
  "UNAUTHENTICATED",
  "INTERNAL",
] as const;

export const ErrorReason = z.enum(ERROR_REASONS);
export type ErrorReason = z.infer<typeof ErrorReason>;

/** Firebase `HttpsError` codes each reason maps to. */
export const HTTPS_CODE: Record<ErrorReason, string> = {
  VALIDATION_FAILED: "invalid-argument",
  USER_BLOCKED: "permission-denied",
  APP_UPDATE_REQUIRED: "failed-precondition",
  MAINTENANCE: "unavailable",
  PROFILE_INCOMPLETE: "failed-precondition",
  LISTING_NOT_FOUND: "not-found",
  SLOT_FULL: "resource-exhausted",
  SLOT_NOT_OFFERED: "failed-precondition",
  LEAD_TIME: "failed-precondition",
  USER_OVERLAP: "already-exists",
  BOOKING_LIMIT: "resource-exhausted",
  IDEMPOTENCY_MISMATCH: "already-exists",
  CONTENTION: "aborted",
  BOOKING_NOT_FOUND: "not-found",
  INVALID_STATE: "failed-precondition",
  CANCEL_WINDOW_CLOSED: "failed-precondition",
  RESCHEDULE_DISABLED: "failed-precondition",
  REAUTH_REQUIRED: "unauthenticated",
  RATE_LIMITED: "resource-exhausted",
  UNAUTHENTICATED: "unauthenticated",
  INTERNAL: "internal",
};

/** Reasons where retrying the same request can succeed. */
export const RETRYABLE: ReadonlySet<ErrorReason> = new Set<ErrorReason>(["CONTENTION", "RATE_LIMITED", "INTERNAL"]);

/** `details` payload carried by every callable failure. */
export const ErrorDetails = z.object({
  reason: ErrorReason,
  retryable: z.boolean(),
  requestId: z.string().optional(),
  fieldErrors: z.record(z.string(), z.array(z.string())).optional(),
});
export type ErrorDetails = z.infer<typeof ErrorDetails>;

/** Thrown by domain code; Functions turn it into an `HttpsError`. */
export class DomainError extends Error {
  readonly reason: ErrorReason;
  readonly retryable: boolean;
  readonly fieldErrors?: Record<string, string[]>;

  constructor(reason: ErrorReason, message: string, opts: { retryable?: boolean; fieldErrors?: Record<string, string[]> } = {}) {
    super(message);
    this.name = "DomainError";
    this.reason = reason;
    this.retryable = opts.retryable ?? RETRYABLE.has(reason);
    this.fieldErrors = opts.fieldErrors;
  }
}

/** Reads a reason out of an unknown error's `details`, falling back to INTERNAL. */
export function reasonOf(details: unknown): ErrorReason {
  const parsed = ErrorDetails.safeParse(details);
  return parsed.success ? parsed.data.reason : "INTERNAL";
}

/** Plain-language copy for the app. Errors say what happened and what to do next. */
export const USER_MESSAGE: Partial<Record<ErrorReason, string>> = {
  VALIDATION_FAILED: "Some details need fixing. Check the highlighted fields.",
  USER_BLOCKED: "This account is blocked. Contact support for help.",
  APP_UPDATE_REQUIRED: "Update the app to keep going.",
  MAINTENANCE: "FYT is under maintenance. Try again shortly.",
  RATE_LIMITED: "Too many attempts. Wait a minute and try again.",
  UNAUTHENTICATED: "Your session ended. Sign in again.",
  INTERNAL: "Something went wrong on our side. Try again.",
};
