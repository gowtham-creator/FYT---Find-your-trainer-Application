import Link from "next/link";
import { solarIcon } from "@/components/icons/solar";
import { EmptyState } from "./primitives";

/** The 404 body, shared by the console (inside the shell) and the root route. */
export function NotFoundPanel() {
  return (
    <div className="rounded-[var(--radius-panel)] border border-line bg-surface shadow-[var(--shadow-card)]">
      <EmptyState
        icon={solarIcon("magnifer-bold-duotone")}
        title="This page doesn't exist"
        body={
          <>
            <span className="num text-ink-2">404</span>: the link may be old, or the address mistyped. Nothing was changed.
          </>
        }
        action={
          <Link
            href="/"
            className="inline-flex h-9 items-center rounded-[var(--radius-control)] bg-accent px-4 text-meta font-medium text-accent-ink transition-colors duration-150 ease-[var(--ease-out-quart)] hover:bg-accent-hover"
          >
            Back to Overview
          </Link>
        }
      />
    </div>
  );
}
