/**
 * Expo app config. Native Firebase config files are never committed (the repo
 * is public). Resolution order for each platform file:
 *   1. GOOGLE_SERVICES_JSON / GOOGLE_SERVICE_INFO_PLIST env vars (EAS file env vars, CI)
 *   2. ./firebase/google-services.json / ./firebase/GoogleService-Info.plist (gitignored, local)
 *   3. emulator env only: the committed fake demo-fyt example files
 */
import { existsSync } from "node:fs";
import path from "node:path";
import type { ConfigContext, ExpoConfig } from "expo/config";

const env = process.env.EXPO_PUBLIC_FYT_ENV ?? "emulator";
const isProd = env === "prod";
const variantSuffix = isProd ? "" : `.${env === "staging" ? "stg" : "dev"}`;
// Placeholder application id until the client confirms the store identity (APP-ARCHITECTURE Q3).
const appId = `in.findyourtrainer.fyt${variantSuffix}`;

function firebaseFile(envVar: string, local: string, example: string): string {
  const fromEnv = process.env[envVar];
  if (fromEnv) return fromEnv;
  if (existsSync(path.join(__dirname, local))) return local;
  if (env === "emulator") return example;
  throw new Error(`Missing ${local} for the "${env}" env. Download it from the Firebase console (see apps/mobile/README.md) or set ${envVar}.`);
}

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: isProd ? "FYT" : `FYT ${env === "staging" ? "Staging" : "Dev"}`,
  slug: "fyt",
  version: "1.0.0",
  orientation: "portrait",
  icon: "./assets/images/icon.png",
  scheme: "fyt",
  web: { favicon: "./assets/images/favicon.png" },
  userInterfaceStyle: "automatic",
  ios: {
    bundleIdentifier: appId,
    supportsTablet: false,
    googleServicesFile: firebaseFile("GOOGLE_SERVICE_INFO_PLIST", "./firebase/GoogleService-Info.plist", "./firebase/GoogleService-Info.example.plist"),
  },
  android: {
    package: appId,
    googleServicesFile: firebaseFile("GOOGLE_SERVICES_JSON", "./firebase/google-services.json", "./firebase/google-services.example.json"),
    adaptiveIcon: {
      // FYT logo kit (brand/logo/app-icons): white Converge symbol on the azure gradient.
      backgroundColor: "#1E4FB8",
      foregroundImage: "./assets/images/android-icon-foreground.png",
      backgroundImage: "./assets/images/android-icon-background.png",
      monochromeImage: "./assets/images/android-icon-monochrome.png",
    },
    predictiveBackGestureEnabled: false,
  },
  plugins: [
    "expo-router",
    "expo-font",
    "expo-image",
    "@react-native-firebase/app",
    "@react-native-firebase/auth",
    // Firebase Apple SDK 13+ is SPM-only and needs dynamic frameworks.
    ["expo-build-properties", { ios: { useFrameworks: "dynamic" } }],
    // Splash: the white symbol centred on the brand band colour (azure; navy in dark mode).
    ["expo-splash-screen", { backgroundColor: "#1E4FB8", image: "./assets/images/splash-icon.png", imageWidth: 112, dark: { backgroundColor: "#0F1A36", image: "./assets/images/splash-icon.png" } }],
  ],
  experiments: { reactCompiler: true },
  extra: {
    fytEnv: env,
    // Set by `eas init` (links this app to the owner's Expo project); kept out of git until then.
    ...(process.env.EAS_PROJECT_ID ? { eas: { projectId: process.env.EAS_PROJECT_ID } } : {}),
  },
  ...(process.env.EAS_PROJECT_ID ? { updates: { url: `https://u.expo.dev/${process.env.EAS_PROJECT_ID}` }, runtimeVersion: { policy: "appVersion" } } : {}),
});
