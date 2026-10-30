/** Copy for the gate screens, from config/public. Pure so it is unit-tested. */
import type { ConfigPublic } from "@fyt/domain";
import type { SessionState } from "./state";

export interface GateCopy {
  eyebrow: string;
  title: string;
  body: string;
  supportEmail?: string;
  supportPhone?: string;
}

const IST = 330 * 60_000;

/** "6:30 pm IST, 12 Nov". Always IST, labelled, whatever the device timezone. */
export function formatIstShort(ms: number): string {
  const d = new Date(ms + IST);
  const h = d.getUTCHours();
  const m = d.getUTCMinutes();
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const time = `${h % 12 || 12}:${String(m).padStart(2, "0")} ${h < 12 ? "am" : "pm"}`;
  return `${time} IST, ${d.getUTCDate()} ${months[d.getUTCMonth()]}`;
}

export function gateCopy(state: SessionState, config: ConfigPublic | null | undefined): GateCopy | null {
  const support = { supportEmail: config?.supportEmail || undefined, supportPhone: config?.supportPhone || undefined };
  switch (state.kind) {
    case "updateRequired":
      return {
        eyebrow: "Update required",
        title: "A newer version is ready",
        body: "This version of FYT is no longer supported. Update from the store to keep booking sessions.",
        ...support,
      };
    case "maintenance":
      return {
        eyebrow: "Maintenance",
        title: "We'll be back shortly",
        body:
          (state.message?.trim() || "FYT is being updated. Your bookings are safe.") +
          (state.until ? ` Expected back by ${formatIstShort(state.until)}.` : ""),
        ...support,
      };
    case "blocked":
      return {
        eyebrow: "Account blocked",
        title: "This account can't sign in",
        body: "Your account has been blocked by the FYT team. If you think this is a mistake, contact support.",
        ...support,
      };
    default:
      return null;
  }
}
