/**
 * Runtime environment for the JS side. Values come from EXPO_PUBLIC_* env
 * vars (apps/mobile/.env, gitignored; see .env.example) or EAS build profiles.
 * Native Firebase config (google-services.json / GoogleService-Info.plist)
 * is wired in app.config.ts, never committed.
 *
 * Each process.env.EXPO_PUBLIC_* must be referenced literally so Metro inlines it.
 */
import { Platform } from "react-native";

export type FytEnv = "emulator" | "dev" | "staging" | "prod";

export interface AppEnv {
  env: FytEnv;
  /** Host running the Firebase Emulator Suite (emulator env only). */
  emulatorHost: string;
  /**
   * Dev-only: replace Firebase with an in-memory backend so the UI can be
   * clicked through without native auth (works in Expo Go). Ignored in prod.
   */
  authBypass: boolean;
}

const ENVS: readonly FytEnv[] = ["emulator", "dev", "staging", "prod"];

export function parseEnv(raw: { env?: string; emulatorHost?: string; authBypass?: string }, os: string, isDev: boolean): AppEnv {
  const env = (ENVS as readonly string[]).includes(raw.env ?? "") ? (raw.env as FytEnv) : "emulator";
  const defaultHost = os === "android" ? "10.0.2.2" : "127.0.0.1";
  const wantsBypass = raw.authBypass === "1" || raw.authBypass === "true";
  return {
    env,
    emulatorHost: raw.emulatorHost?.trim() || defaultHost,
    authBypass: wantsBypass && env !== "prod" && isDev,
  };
}

export const appEnv: AppEnv = parseEnv(
  {
    env: process.env.EXPO_PUBLIC_FYT_ENV,
    emulatorHost: process.env.EXPO_PUBLIC_FYT_EMULATOR_HOST,
    authBypass: process.env.EXPO_PUBLIC_FYT_AUTH_BYPASS,
  },
  Platform.OS,
  typeof __DEV__ !== "undefined" ? __DEV__ : false,
);
