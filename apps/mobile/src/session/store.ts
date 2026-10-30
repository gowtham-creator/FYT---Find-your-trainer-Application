import { create } from "zustand";
import type { ConfigPublic, UserDoc } from "@fyt/domain";
import type { AuthUser } from "./state";

/** Raw inputs to the session machine. `deriveSession` turns them into a SessionState. */
interface SessionStore {
  authResolved: boolean;
  config: ConfigPublic | null | undefined;
  authUser: AuthUser | null;
  authDisabled: boolean;
  userDoc: UserDoc | null | undefined;
  /** The number the OTP was sent to, shown on the OTP screen. */
  pendingPhone: string | null;
  set(patch: Partial<Omit<SessionStore, "set">>): void;
}

export const useSessionStore = create<SessionStore>((set) => ({
  authResolved: false,
  config: undefined,
  authUser: null,
  authDisabled: false,
  userDoc: undefined,
  pendingPhone: null,
  set: (patch) => set(patch),
}));
