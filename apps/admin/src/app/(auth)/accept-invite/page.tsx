import Link from "next/link";
import { LinkIcon } from "lucide-react";
import { ROLE_LABEL } from "@/lib/rbac";
import { AuthShell } from "../login/auth-shell";
import { AUTH_TITLE } from "../login/step-indicator";
import { findInvite } from "./actions";
import { AcceptForm } from "./accept-form";

export const metadata = { title: "Accept invite" };

export default async function AcceptInvitePage({ searchParams }: { searchParams: Promise<{ token?: string }> }) {
  const { token = "" } = await searchParams;
  const invite = await findInvite(token);
  return (
    <AuthShell>
      {invite ? (
        <>
          <p className="text-micro font-medium uppercase tracking-[0.14em] text-accent">Operator invite</p>
          <h1 className={"mt-3 " + AUTH_TITLE}>Welcome, {invite.name.split(" ")[0]}</h1>
          <p className="mt-2 text-body leading-relaxed text-ink-2">
            You were invited as <span className="font-medium text-ink">{ROLE_LABEL[invite.role]}</span>. Set a password for{" "}
            <span className="num text-ink">{invite.email}</span> to finish.
          </p>
          <AcceptForm token={token} email={invite.email} />
        </>
      ) : (
        <div className="flex flex-col items-start gap-3">
          <span className="grid size-11 place-items-center rounded-[10px] border border-line bg-sunken text-ink-2">
            <LinkIcon className="size-5" strokeWidth={1.5} aria-hidden />
          </span>
          <h1 className={"mt-1 " + AUTH_TITLE}>This invite link doesn&apos;t work</h1>
          <p className="text-body text-ink-2">It may have been used already or withdrawn. Ask the super admin who invited you for a new link.</p>
          <Link href="/login" className="text-body font-medium text-ink underline decoration-line-strong underline-offset-4">Go to sign in</Link>
        </div>
      )}
    </AuthShell>
  );
}
