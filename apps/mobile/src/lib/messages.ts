/**
 * Maps backend error codes (Firebase Auth codes and callable reasons) to
 * plain copy: what happened and what to do next. Switches on codes, never on
 * message text.
 */
import { USER_MESSAGE, type ErrorReason } from "@fyt/domain";

const AUTH: Record<string, string> = {
  "auth/invalid-phone-number": "That number doesn't look right. Enter the 10-digit mobile number.",
  "auth/invalid-verification-code": "That code isn't right. Check the SMS and try again.",
  "auth/code-expired": "That code has expired. Request a new one.",
  "auth/session-expired": "That code has expired. Request a new one.",
  "auth/too-many-requests": "Too many attempts. Wait a few minutes and try again.",
  "auth/quota-exceeded": "We can't send codes right now. Try again later.",
  "auth/network-request-failed": "You're offline. Connect to the internet and try again.",
  "auth/user-disabled": "This account is blocked. Contact support for help.",
  NETWORK: "You're offline. Connect to the internet and try again.",
};

export function messageFor(code: string | undefined): string {
  if (!code) return "Something went wrong. Try again.";
  return AUTH[code] ?? USER_MESSAGE[code as ErrorReason] ?? "Something went wrong. Try again.";
}
