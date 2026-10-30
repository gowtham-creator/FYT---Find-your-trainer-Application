/**
 * React Native Firebase backend (modular API). Needs a dev build
 * (expo-dev-client): the native modules are not in Expo Go.
 * In the "emulator" env it points Auth, Firestore and Functions at the
 * Firebase Emulator Suite before any other call.
 */
import { getApp } from "@react-native-firebase/app";
import { connectAuthEmulator, getAuth, onAuthStateChanged, signInWithPhoneNumber, signOut as fbSignOut } from "@react-native-firebase/auth";
import { connectFirestoreEmulator, doc, getFirestore, onSnapshot } from "@react-native-firebase/firestore";
import { connectFunctionsEmulator, getFunctions, httpsCallable } from "@react-native-firebase/functions";
import {
  CALLABLES,
  ConfigPublic,
  FUNCTIONS_REGION,
  reasonOf,
  UserDoc,
  UserV1Response,
  type SaveProfileRequest,
} from "@fyt/domain";
import { clientMeta } from "../config/app-info";
import type { AppEnv } from "../config/env";
import { BackendError, type Backend } from "./types";

export function createFirebaseBackend(env: AppEnv): Backend {
  const auth = getAuth();
  const db = getFirestore();
  const functions = getFunctions(getApp(), FUNCTIONS_REGION);

  if (env.env === "emulator") {
    const host = env.emulatorHost;
    connectAuthEmulator(auth, `http://${host}:9099`);
    connectFirestoreEmulator(db, host, 8080);
    connectFunctionsEmulator(functions, host, 5001);
  }

  let confirmation: Awaited<ReturnType<typeof signInWithPhoneNumber>> | null = null;

  async function call(name: string, data: object) {
    try {
      const res = await httpsCallable(functions, name)({ ...data, client: clientMeta() });
      return UserV1Response.parse(res.data).user;
    } catch (e) {
      const err = e as { details?: unknown; message?: string; code?: string };
      const details = err.details as { fieldErrors?: Record<string, string[]> } | undefined;
      const reason = err.details ? reasonOf(err.details) : err.code === "functions/unavailable" ? "NETWORK" : "INTERNAL";
      throw new BackendError(reason, err.message ?? "Request failed", details?.fieldErrors);
    }
  }

  function authError(e: unknown): BackendError {
    const err = e as { code?: string; message?: string };
    return new BackendError(err.code ?? "auth/unknown", err.message ?? "Sign-in failed");
  }

  return {
    kind: "firebase",
    onAuthChanged(cb) {
      return onAuthStateChanged(auth, (u) => cb(u ? { uid: u.uid, phone: u.phoneNumber } : null));
    },
    onConfig(cb) {
      return onSnapshot(
        doc(db, "config", "public"),
        (snap) => {
          const parsed = snap.exists() ? ConfigPublic.safeParse(snap.data()) : null;
          cb(parsed?.success ? parsed.data : null);
        },
        () => cb(null),
      );
    },
    onUserDoc(uid, cb, onError) {
      return onSnapshot(
        doc(db, "users", uid),
        (snap) => {
          if (!snap.exists()) return cb(null);
          const parsed = UserDoc.safeParse(snap.data());
          if (parsed.success) cb(parsed.data);
          else onError(parsed.error);
        },
        onError,
      );
    },
    async sendCode(phone) {
      try {
        confirmation = await signInWithPhoneNumber(auth, phone);
      } catch (e) {
        throw authError(e);
      }
    },
    async confirmCode(code) {
      if (!confirmation) throw new BackendError("auth/session-expired", "Request a new code.");
      try {
        await confirmation.confirm(code);
        confirmation = null;
      } catch (e) {
        throw authError(e);
      }
    },
    ensureUser: () => call(CALLABLES.ensureUser, {}),
    saveProfile: (req: SaveProfileRequest) => call(CALLABLES.saveProfile, req),
    async signOut() {
      // Milestone 6: unregisterDeviceV1 runs here first, while still authenticated.
      await fbSignOut(auth);
    },
  };
}
