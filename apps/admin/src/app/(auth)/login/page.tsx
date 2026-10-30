/**
 * FYT operator console: sign in, step 1 of 2.
 *
 * Layout: ./auth-shell.tsx (after the "Auth Page" component by efferd on
 * 21st.dev). Step 1 never creates a session; it earns a 6-digit code checked
 * on /login/verify. No social proof anywhere: the left panel is a headline and
 * three plain capability lines.
 */
import type { Metadata } from "next";
import { AlertCircle } from "lucide-react";
import { DATA_SOURCE } from "@/lib/data/store";
import { safeNext } from "@/lib/auth/identifiers";
import { googleOAuthStatus } from "@/lib/auth/oauth-google";
import { ssoStatus } from "@/lib/auth/sso";
import { AuthShell } from "./auth-shell";
import { LoginForm } from "./login-form";
import { StepIndicator } from "./step-indicator";

export const metadata: Metadata = { title: "Sign in" };

const NOTICES: Record<string, string> = {
  expired: "That sign-in expired before the code was entered. Start again.",
  locked: "Too many incorrect codes, so that sign-in was stopped. Start again.",
  unavailable: "This account can't sign in right now. Ask a super admin to check it.",
};

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string; notice?: string }> }) {
  const { next, notice } = await searchParams;
  const dest = safeNext(next);
  const message = notice && Object.hasOwn(NOTICES, notice) ? NOTICES[notice] : undefined;

  return (
    <AuthShell>
      <header>
        <StepIndicator current={1} />
        <p className="num mt-5 text-micro font-medium uppercase tracking-[0.16em] text-accent">Operator console</p>
        <h1 className="font-display mt-1.5 text-[26px] font-semibold leading-[1.15] tracking-[-0.02em] text-ink">Sign in to FYT Console</h1>
        <p className="mt-1.5 text-meta leading-relaxed text-ink-2">
          Step 2 is a 6{"\u2011"}digit code we send you.
        </p>
      </header>

      {message ? (
        <p role="status" className="mt-5 flex items-start gap-2.5 rounded-[12px] bg-info-soft px-3.5 py-3 text-meta leading-snug text-ink ring-1 ring-inset ring-info/20">
          <AlertCircle className="mt-px size-4 shrink-0 text-on-info-soft" strokeWidth={1.75} aria-hidden />
          {message}
        </p>
      ) : null}

      <LoginForm next={dest === "/" ? undefined : dest} demo={DATA_SOURCE === "demo"} google={googleOAuthStatus()} sso={ssoStatus()} />

    </AuthShell>
  );
}
