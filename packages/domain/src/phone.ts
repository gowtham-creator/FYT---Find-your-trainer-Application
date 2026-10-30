/**
 * Indian mobile numbers. Same rule as the admin's `lib/auth/identifiers.ts`:
 * 10 digits starting 6-9, normalised to E.164 `+91XXXXXXXXXX`.
 */

export function normalizeIndianPhone(input: string): string | null {
  if (typeof input !== "string" || input.length > 32) return null;
  const compact = input.trim().replace(/[\s().-]/g, "");
  let national: string | null = null;
  if (/^\+91\d{10}$/.test(compact)) national = compact.slice(3);
  else if (/^0091\d{10}$/.test(compact)) national = compact.slice(4);
  else if (/^91\d{10}$/.test(compact)) national = compact.slice(2);
  else if (/^0\d{10}$/.test(compact)) national = compact.slice(1);
  else if (/^\d{10}$/.test(compact)) national = compact;
  if (!national || !/^[6-9]\d{9}$/.test(national)) return null;
  return `+91${national}`;
}

/** `+919000247318` -> `+91 90002 47318` (display only). */
export function formatIndianPhone(e164: string): string {
  const n = e164.replace(/^\+91/, "");
  return /^\d{10}$/.test(n) ? `+91 ${n.slice(0, 5)} ${n.slice(5)}` : e164;
}
