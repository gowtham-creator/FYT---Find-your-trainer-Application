import { parseEnv } from "./env";

describe("app env", () => {
  it("defaults to the emulator with the platform's loopback host", () => {
    expect(parseEnv({}, "android", true)).toEqual({ env: "emulator", emulatorHost: "10.0.2.2", authBypass: false });
    expect(parseEnv({}, "ios", true).emulatorHost).toBe("127.0.0.1");
  });

  it("uses an explicit host (physical device on the LAN)", () => {
    expect(parseEnv({ emulatorHost: " 192.168.1.20 " }, "ios", true).emulatorHost).toBe("192.168.1.20");
  });

  it("the auth bypass is dev-only and never in prod", () => {
    expect(parseEnv({ authBypass: "1" }, "ios", true).authBypass).toBe(true);
    expect(parseEnv({ authBypass: "1" }, "ios", false).authBypass).toBe(false);
    expect(parseEnv({ authBypass: "1", env: "prod" }, "ios", true).authBypass).toBe(false);
  });

  it("an unknown env falls back to emulator", () => {
    expect(parseEnv({ env: "production" }, "ios", true).env).toBe("emulator");
  });
});
