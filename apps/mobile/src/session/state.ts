/**
 * Session state machine (APP-ARCHITECTURE §4.2) and the route redirect table
 * (§3.3). Both are pure and unit-tested; the router only applies the result.
 *
 * Precedence: Booting > UpdateRequired > Maintenance > Blocked(auth disabled)
 *   > SignedOut > Blocked(user doc) > NeedsOnboarding > Ready.
 */
import { isBelowMin, type ConfigPublic, type Platform, type Segment, type UserDoc } from "@fyt/domain";

export type OnboardingRoute = "segment" | "details";

export type SessionState =
  | { kind: "booting" }
  | { kind: "updateRequired" }
  | { kind: "maintenance"; message?: string; until?: number }
  | { kind: "signedOut" }
  | { kind: "blocked"; reason?: string }
  | { kind: "needsOnboarding"; step: OnboardingRoute }
  | { kind: "ready"; segment: Segment };

export interface AuthUser {
  uid: string;
  phone: string | null;
}

export interface SessionInputs {
  /** False until the first auth callback has fired. */
  authResolved: boolean;
  /** undefined while the first config/public read is pending; null if it is missing or unreadable. */
  config: ConfigPublic | null | undefined;
  appVersion: string;
  platform: Platform;
  authUser: AuthUser | null;
  /** Sign-in was refused because the Auth account is disabled (blocked learner). */
  authDisabled: boolean;
  /** undefined while loading; null when the doc doesn't exist yet (brand-new learner). */
  userDoc: UserDoc | null | undefined;
}

export function deriveSession(i: SessionInputs): SessionState {
  if (!i.authResolved || i.config === undefined) return { kind: "booting" };
  if (i.config && isBelowMin(i.appVersion, i.config.minAppVersion[i.platform])) return { kind: "updateRequired" };
  if (i.config?.maintenance.on) return { kind: "maintenance", message: i.config.maintenance.message, until: i.config.maintenance.until };
  if (i.authDisabled) return { kind: "blocked" };
  if (!i.authUser) return { kind: "signedOut" };
  if (i.userDoc === undefined) return { kind: "booting" };
  if (i.userDoc?.blocked) return { kind: "blocked", reason: i.userDoc.blockedReason };
  if (!i.userDoc || !i.userDoc.onboarded) {
    const step: OnboardingRoute = i.userDoc?.segment && i.userDoc.onboardingStep !== "segment" ? "details" : "segment";
    return { kind: "needsOnboarding", step };
  }
  if (!i.userDoc.segment) return { kind: "needsOnboarding", step: "segment" };
  return { kind: "ready", segment: i.userDoc.segment };
}

/* ---------------- routes ---------------- */

export const ROUTES = {
  splash: "/",
  update: "/gate/update",
  maintenance: "/gate/maintenance",
  blocked: "/gate/blocked",
  phone: "/auth/phone",
  otp: "/auth/otp",
  segment: "/onboarding/segment",
  details: "/onboarding/details",
  home: "/home",
  explore: "/explore",
  bookings: "/bookings",
  profile: "/profile",
} as const;

const LEARNER_TABS: readonly string[] = [ROUTES.home, ROUTES.explore, ROUTES.bookings, ROUTES.profile];

/**
 * Where the router must go for `state` when it is at `path`, or null to stay.
 * Every state owns a set of allowed paths; anything else goes to its home.
 */
export function redirectFor(state: SessionState, path: string): string | null {
  const p = path.length > 1 ? path.replace(/\/+$/, "") : path;
  const stay = (allowed: readonly string[], home: string) => (allowed.includes(p) ? null : home);
  switch (state.kind) {
    case "booting":
      return stay([ROUTES.splash], ROUTES.splash);
    case "updateRequired":
      return stay([ROUTES.update], ROUTES.update);
    case "maintenance":
      return stay([ROUTES.maintenance], ROUTES.maintenance);
    case "blocked":
      return stay([ROUTES.blocked], ROUTES.blocked);
    case "signedOut":
      return stay([ROUTES.phone, ROUTES.otp], ROUTES.phone);
    case "needsOnboarding": {
      const target = state.step === "segment" ? ROUTES.segment : ROUTES.details;
      // Going back from details to change the segment is allowed.
      return stay(state.step === "details" ? [ROUTES.details, ROUTES.segment] : [ROUTES.segment], target);
    }
    case "ready":
      return LEARNER_TABS.includes(p) || p.startsWith("/dev/") ? null : ROUTES.home;
  }
}
