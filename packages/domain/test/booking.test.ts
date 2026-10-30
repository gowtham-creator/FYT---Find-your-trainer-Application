import { describe, expect, it } from "vitest";
import { assertTransition, BookingStatus, canTransition, DomainError, HOLDS_SEAT, INITIAL_STATUS, TERMINAL, TRANSITIONS, userCanCancel } from "../src";

const H = 3_600_000;

describe("booking status machine", () => {
  it("starts online bookings as requested and offline as confirmed", () => {
    expect(INITIAL_STATUS.online).toBe("requested");
    expect(INITIAL_STATUS.offline).toBe("confirmed");
  });

  it("has a row for every status and no exits from terminal states", () => {
    for (const s of BookingStatus.options) expect(TRANSITIONS[s]).toBeDefined();
    for (const s of TERMINAL) expect(TRANSITIONS[s]).toHaveLength(0);
  });

  it("only lets the system confirm a requested booking (the Meet worker)", () => {
    expect(canTransition("requested", "confirmed", "system")).toBe(true);
    expect(canTransition("requested", "confirmed", "user")).toBe(false);
    expect(canTransition("requested", "confirmed", "admin")).toBe(false);
  });

  it("lets admins record outcomes but never learners", () => {
    expect(canTransition("confirmed", "completed", "admin")).toBe(true);
    expect(canTransition("confirmed", "no_show", "admin")).toBe(true);
    expect(canTransition("confirmed", "completed", "user")).toBe(false);
    expect(canTransition("requested", "completed", "admin")).toBe(false);
  });

  it("does not let a learner cancel a meet_failed booking (operators handle it)", () => {
    expect(canTransition("meet_failed", "cancelled", "user")).toBe(false);
    expect(canTransition("meet_failed", "cancelled", "admin")).toBe(true);
  });

  it("throws INVALID_STATE for a disallowed move", () => {
    expect(() => assertTransition("cancelled", "confirmed", "admin")).toThrow(DomainError);
    try {
      assertTransition("completed", "cancelled", "system");
    } catch (e) {
      expect((e as DomainError).reason).toBe("INVALID_STATE");
      expect((e as DomainError).retryable).toBe(false);
    }
    expect(() => assertTransition("requested", "cancelled", "user")).not.toThrow();
  });

  it("holds a seat only while live", () => {
    expect([...HOLDS_SEAT].sort()).toEqual(["confirmed", "meet_failed", "requested"]);
  });

  it("closes learner cancellation at start minus the window", () => {
    const start = 100 * H;
    expect(userCanCancel("confirmed", start, start - 3 * H, 2)).toBe(true);
    expect(userCanCancel("confirmed", start, start - 2 * H, 2)).toBe(false);
    expect(userCanCancel("cancelled", start, 0, 2)).toBe(false);
  });
});
