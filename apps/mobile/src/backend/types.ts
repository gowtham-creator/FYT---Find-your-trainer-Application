import type { ConfigPublic, SaveProfileRequest, UserDoc } from "@fyt/domain";
import type { AuthUser } from "../session/state";

export type Unsubscribe = () => void;

/**
 * Everything the app needs from Firebase. Reads are realtime listeners;
 * writes go only through versioned callables. Two implementations:
 * `firebase.ts` (React Native Firebase) and `mock.ts` (dev-only bypass).
 */
export interface Backend {
  readonly kind: "firebase" | "mock";
  onAuthChanged(cb: (user: AuthUser | null) => void): Unsubscribe;
  onConfig(cb: (config: ConfigPublic | null) => void): Unsubscribe;
  onUserDoc(uid: string, cb: (doc: UserDoc | null) => void, onError: (e: unknown) => void): Unsubscribe;
  /** Sends the OTP to an E.164 number. Resolves when the code is sent (or the user is already signed in by auto-retrieval). */
  sendCode(phoneE164: string): Promise<void>;
  confirmCode(code: string): Promise<void>;
  ensureUser(): Promise<UserDoc>;
  saveProfile(req: SaveProfileRequest): Promise<UserDoc>;
  signOut(): Promise<void>;
}

/** Error with a stable code the UI can switch on (auth codes or callable reasons). */
export class BackendError extends Error {
  constructor(
    readonly code: string,
    message: string,
    readonly fieldErrors?: Record<string, string[]>,
  ) {
    super(message);
    this.name = "BackendError";
  }
}
