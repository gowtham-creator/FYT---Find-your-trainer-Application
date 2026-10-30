import { describe, expect, it } from "vitest";
import { assertSafeTarget } from "../../scripts/seed-emulator";

const env = { FIRESTORE_EMULATOR_HOST: "127.0.0.1:8080", FIREBASE_AUTH_EMULATOR_HOST: "127.0.0.1:9099" };

describe("seed script guard", () => {
  it("accepts demo- projects on the emulator", () => expect(() => assertSafeTarget("demo-fyt", env)).not.toThrow());
  it("refuses real project ids", () => expect(() => assertSafeTarget("fyt-prod", env)).toThrow(/only demo-/));
  it("refuses when emulator hosts are missing", () => expect(() => assertSafeTarget("demo-fyt", {})).toThrow(/emulator hosts/));
});
