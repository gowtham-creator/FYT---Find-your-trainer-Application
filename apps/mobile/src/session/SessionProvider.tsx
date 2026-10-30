/**
 * Wires the backend's realtime listeners into the session store and exposes
 * the derived SessionState. Mount once, at the root layout.
 */
import { useEffect, useMemo, type ReactNode } from "react";
import { DEFAULT_CONFIG_PUBLIC } from "@fyt/domain";
import { backend } from "../backend";
import { appVersion, clientMeta } from "../config/app-info";
import { deriveSession, type SessionState } from "./state";
import { useSessionStore } from "./store";

export function SessionProvider({ children }: { children: ReactNode }) {
  const set = useSessionStore((s) => s.set);
  const uid = useSessionStore((s) => s.authUser?.uid ?? null);

  useEffect(() => {
    const b = backend();
    // A missing or unreadable config falls back to defaults so the app never hangs on boot.
    const offConfig = b.onConfig((config) => set({ config: config ?? DEFAULT_CONFIG_PUBLIC }));
    const offAuth = b.onAuthChanged((authUser) => set({ authUser, authResolved: true, ...(authUser ? { authDisabled: false } : { userDoc: undefined }) }));
    return () => {
      offConfig();
      offAuth();
    };
  }, [set]);

  useEffect(() => {
    if (!uid) return;
    const b = backend();
    set({ userDoc: undefined });
    const off = b.onUserDoc(
      uid,
      (userDoc) => set({ userDoc }),
      () => set({ userDoc: null }),
    );
    // Registration: creates users/{uid} on first sign-in. Non-blocking; the doc listener picks it up.
    b.ensureUser().catch(() => undefined);
    return off;
  }, [uid, set]);

  return <>{children}</>;
}

export function useSession(): SessionState {
  const s = useSessionStore();
  return useMemo(
    () =>
      deriveSession({
        authResolved: s.authResolved,
        config: s.config,
        appVersion: appVersion(),
        platform: clientMeta().platform,
        authUser: s.authUser,
        authDisabled: s.authDisabled,
        userDoc: s.userDoc,
      }),
    [s.authResolved, s.config, s.authUser, s.authDisabled, s.userDoc],
  );
}
