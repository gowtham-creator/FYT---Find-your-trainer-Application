/**
 * Checks every app callable runs before its handler (APP-ARCHITECTURE §7).
 * Pure, so it is unit-tested without the emulator.
 */
import { DomainError, isBelowMin, type ClientMeta, type ConfigPublic, type UserDoc } from "@fyt/domain";

export interface GateInput {
  config: ConfigPublic | null;
  client: ClientMeta | undefined;
  user: UserDoc | null;
  skipBlockedCheck: boolean;
}

export function checkGates({ config, client, user, skipBlockedCheck }: GateInput): void {
  if (config?.maintenance.on) {
    throw new DomainError("MAINTENANCE", config.maintenance.message || "FYT is under maintenance. Try again shortly.", { retryable: true });
  }
  if (config && client && isBelowMin(client.appVersion, config.minAppVersion[client.platform])) {
    throw new DomainError("APP_UPDATE_REQUIRED", "Update the app to keep going.");
  }
  if (!skipBlockedCheck && user?.blocked) {
    throw new DomainError("USER_BLOCKED", "This account is blocked. Contact support for help.");
  }
}
