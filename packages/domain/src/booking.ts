/**
 * Booking status machine (docs/firestore-schema.md §3.6). Every writer
 * (callables, admin actions, workers) goes through `assertTransition`.
 */
import type { BookingStatus } from "./common";
import { DomainError } from "./errors";

export type Actor = "user" | "admin" | "system";

/** Where a new booking starts: online waits for its Meet link, offline is confirmed at once. */
export const INITIAL_STATUS = { online: "requested", offline: "confirmed" } as const satisfies Record<string, BookingStatus>;

interface Edge {
  to: BookingStatus;
  by: readonly Actor[];
}

/** The allowed-transition table. Anything not listed is rejected. */
export const TRANSITIONS: Readonly<Record<BookingStatus, readonly Edge[]>> = {
  requested: [
    { to: "confirmed", by: ["system"] },
    { to: "meet_failed", by: ["system"] },
    { to: "cancelled", by: ["user", "admin", "system"] },
  ],
  confirmed: [
    { to: "cancelled", by: ["user", "admin", "system"] },
    { to: "completed", by: ["admin"] },
    { to: "no_show", by: ["admin"] },
  ],
  meet_failed: [
    { to: "confirmed", by: ["admin", "system"] },
    { to: "cancelled", by: ["admin", "system"] },
  ],
  completed: [],
  no_show: [],
  cancelled: [],
};

export const TERMINAL: ReadonlySet<BookingStatus> = new Set<BookingStatus>(["completed", "no_show", "cancelled"]);

/** Statuses that hold a seat in the slot ledger. */
export const HOLDS_SEAT: ReadonlySet<BookingStatus> = new Set<BookingStatus>(["requested", "confirmed", "meet_failed"]);

export function canTransition(from: BookingStatus, to: BookingStatus, actor: Actor): boolean {
  return TRANSITIONS[from].some((e) => e.to === to && e.by.includes(actor));
}

/** Throws `INVALID_STATE` unless `actor` may move a booking from `from` to `to`. */
export function assertTransition(from: BookingStatus, to: BookingStatus, actor: Actor): void {
  if (!canTransition(from, to, actor)) {
    throw new DomainError("INVALID_STATE", `A ${actor} cannot move a booking from ${from} to ${to}.`);
  }
}

/** Outcomes are recorded only after the session ended. */
export function assertOutcomeAllowed(end: number, now: number): void {
  if (now < end) throw new DomainError("INVALID_STATE", "The session has not ended yet.");
}

/** A learner may cancel until `start - windowHours`. */
export function userCanCancel(status: BookingStatus, start: number, now: number, windowHours: number): boolean {
  return canTransition(status, "cancelled", "user") && now < start - windowHours * 3_600_000;
}

/** Display metadata: a status is never shown by colour alone (icon + label). */
export const STATUS_LABEL: Record<BookingStatus, string> = {
  requested: "Requested",
  confirmed: "Confirmed",
  meet_failed: "Link delayed",
  cancelled: "Cancelled",
  completed: "Attended",
  no_show: "Missed",
};
