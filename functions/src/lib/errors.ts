import { HttpsError, type FunctionsErrorCode } from "firebase-functions/v2/https";
import { DomainError, HTTPS_CODE, RETRYABLE, type ErrorDetails, type ErrorReason } from "@fyt/domain";

/** Builds the HttpsError every client decodes: `details.reason` is the contract, the message is display copy. */
export function fail(
  reason: ErrorReason,
  message: string,
  opts: { retryable?: boolean; fieldErrors?: Record<string, string[]>; requestId?: string } = {},
): HttpsError {
  const details: ErrorDetails = {
    reason,
    retryable: opts.retryable ?? RETRYABLE.has(reason),
    ...(opts.requestId ? { requestId: opts.requestId } : {}),
    ...(opts.fieldErrors ? { fieldErrors: opts.fieldErrors } : {}),
  };
  return new HttpsError(HTTPS_CODE[reason] as FunctionsErrorCode, message, details);
}

/** Maps anything thrown by a handler to an HttpsError. Unknown errors become INTERNAL with no detail leaked. */
export function toHttpsError(e: unknown, requestId: string): HttpsError {
  if (e instanceof HttpsError) return e;
  if (e instanceof DomainError) return fail(e.reason, e.message, { retryable: e.retryable, fieldErrors: e.fieldErrors, requestId });
  return fail("INTERNAL", "Something went wrong on our side. Try again.", { requestId });
}
