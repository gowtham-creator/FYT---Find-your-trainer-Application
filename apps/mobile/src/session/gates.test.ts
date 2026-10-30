import { DEFAULT_CONFIG_PUBLIC } from "@fyt/domain";
import { formatIstShort, gateCopy } from "./gates";

const cfg = { ...DEFAULT_CONFIG_PUBLIC, supportEmail: "help@example.com", supportPhone: "+91 90000 00000" };

describe("gate copy", () => {
  it("only gate states have copy", () => {
    expect(gateCopy({ kind: "signedOut" }, cfg)).toBeNull();
    expect(gateCopy({ kind: "ready", segment: "student" }, cfg)).toBeNull();
  });

  it("update required links support from config", () => {
    const c = gateCopy({ kind: "updateRequired" }, cfg)!;
    expect(c.eyebrow).toBe("Update required");
    expect(c.supportEmail).toBe("help@example.com");
  });

  it("maintenance uses the configured message and the IST end time", () => {
    const until = Date.UTC(2026, 10, 12, 13, 0); // 18:30 IST
    const c = gateCopy({ kind: "maintenance", message: "Upgrading the catalog.", until }, cfg)!;
    expect(c.body).toBe("Upgrading the catalog. Expected back by 6:30 pm IST, 12 Nov.");
  });

  it("maintenance has a default message", () => {
    expect(gateCopy({ kind: "maintenance" }, cfg)!.body).toMatch(/bookings are safe/);
  });

  it("blocked works without a config", () => {
    const c = gateCopy({ kind: "blocked" }, null)!;
    expect(c.title).toBe("This account can't sign in");
    expect(c.supportEmail).toBeUndefined();
  });

  it("formats IST across the UTC day boundary", () => {
    expect(formatIstShort(Date.UTC(2026, 10, 11, 18, 30))).toBe("12:00 am IST, 12 Nov");
  });
});
