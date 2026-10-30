import * as Application from "expo-application";
import Constants from "expo-constants";
import { Platform } from "react-native";
import type { ClientMeta } from "@fyt/domain";

/** The installed app's version (the store version), used by the update gate. */
export function appVersion(): string {
  return Application.nativeApplicationVersion ?? Constants.expoConfig?.version ?? "0.0.0";
}

export function clientMeta(): ClientMeta {
  return { appVersion: appVersion(), platform: Platform.OS === "ios" ? "ios" : "android" };
}
