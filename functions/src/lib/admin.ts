import { getApps, initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";
import { setGlobalOptions } from "firebase-functions/v2";
import { FUNCTIONS_REGION } from "@fyt/domain";

setGlobalOptions({ region: FUNCTIONS_REGION, maxInstances: 20 });

if (getApps().length === 0) {
  initializeApp();
  // Optional fields are omitted rather than stored as undefined.
  getFirestore().settings({ ignoreUndefinedProperties: true });
}

export const db = () => getFirestore();
export const auth = () => getAuth();

/** True inside the Firebase Emulator Suite. */
export const isEmulator = () => process.env.FUNCTIONS_EMULATOR === "true";
