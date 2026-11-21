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
    instance = (require("./mock") as typeof import("./mock")).createMockBackend(Date.now, devSignedInPhone());
  } else {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    instance = (require("./firebase") as typeof import("./firebase")).createFirebaseBackend(appEnv);
  }
  return instance;
}

/**
 * Dev-only fixture hook (auth bypass on web): `?dev=student` or `?dev=corporate`
 * in the URL starts the mock backend signed in, so any screen can be opened directly.
 */
function devSignedInPhone(): string | undefined {
  const search = (globalThis as { location?: { search?: string } }).location?.search ?? "";
  const who = /[?&]dev=(student|corporate)/.exec(search)?.[1];
  return who === "student" ? "+919000000001" : who === "corporate" ? "+919000000002" : undefined;
}

export { BackendError } from "./types";
export type { Backend } from "./types";
