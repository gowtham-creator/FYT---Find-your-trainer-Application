import { appEnv } from "../config/env";
import type { Backend } from "./types";

let instance: Backend | null = null;

/**
 * The app's single backend. The Firebase module is required lazily so the
 * dev bypass runs in Expo Go, where the native modules don't exist.
 */
export function backend(): Backend {
  if (instance) return instance;
  if (appEnv.authBypass) {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    instance = (require("./mock") as typeof import("./mock")).createMockBackend();
  } else {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    instance = (require("./firebase") as typeof import("./firebase")).createFirebaseBackend(appEnv);
  }
  return instance;
}

export { BackendError } from "./types";
export type { Backend } from "./types";
