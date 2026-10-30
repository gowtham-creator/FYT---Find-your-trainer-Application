/**
 * Shared shell for both sign-in steps (/login and /login/verify), so step 2
 * feels like the same page.
 *
 * Structure follows the "Auth Page" component by efferd on 21st.dev
 * (https://21st.dev/@efferd/components/auth-page): a split layout with an
 * animated left panel and a centred auth column on the right over soft radial
 * washes. Restyled after the NXT Schools demo sign-in: the left panel is a
 * slowly shifting azure gradient with floating cool glows and white floating
 * paths; the right column is calm slate with two faint washes and a 20px card
 * with a brand-gradient top bar. Cool hues only: no amber, gold or brown.
 * The left panel is hidden below `lg`, as in the source.
 */
import { FytMark, FytWordmark, type FytTone } from "@/components/brand/fyt";
import { FloatingPaths } from "./floating-paths";
import { PanelIntro } from "./panel-intro";
import { ThemeToggle } from "./theme-toggle";

function Lockup({ className, tone = "azure" }: { className?: string; tone?: FytTone }) {
  return (
    <div className={className}>
      <FytMark tone={tone} className={tone === "onDark" ? "h-9 w-auto" : "h-9 w-auto drop-shadow-[0_2px_4px_oklch(0.2_0.08_262/0.35)]"} />
      <div className="leading-tight">
        <FytWordmark tone={tone} className="h-[17px] w-auto" />
        <p className={"mt-1 text-micro uppercase tracking-[0.16em] " + (tone === "onDark" ? "text-white/75" : "text-ink-2")}>
          Find your trainer
        </p>
      </div>
    </div>
  );
}

export function AuthShell({ children }: { children: React.ReactNode }) {
  return (
    <main className="relative isolate min-h-dvh bg-paper lg:grid lg:h-dvh lg:grid-cols-[1.05fr_0.95fr] lg:overflow-hidden">
      {/* ---------- Left: azure panel, motion + a short introduction (lg and up) ---------- */}
      <aside className="relative hidden h-dvh flex-col overflow-hidden bg-[#1E4FB8] p-10 text-white lg:flex xl:p-14">
        {/* Two panel-sized gradients crossfading on opacity (compositor only).
            A panned 240% layer or an animated background-position costs far
            more paint and tile memory for the same slow drift. */}
        <div aria-hidden className="pointer-events-none absolute inset-0 bg-[linear-gradient(135deg,#0E2659_0%,#1E4FB8_46%,#2C63D6_74%,#16409A_100%)]" />
        <div aria-hidden className="pointer-events-none absolute inset-0 bg-[linear-gradient(315deg,#0E2659_0%,#1E4FB8_42%,#2C63D6_70%,#16409A_100%)] animate-bg-shift" />
        {/* Cool glows only (NXT's amber and gold glows are not used). */}
        <div aria-hidden className="pointer-events-none absolute inset-0">
          <span className="absolute -right-24 -top-36 size-[480px] rounded-full bg-[radial-gradient(circle,rgba(111,160,255,0.6),transparent_60%)] animate-glow-a" />
          <span className="absolute -bottom-40 -left-24 size-[440px] rounded-full bg-[radial-gradient(circle,rgba(56,189,248,0.45),transparent_60%)] animate-glow-b" />
          <span className="absolute left-[34%] top-[30%] size-[360px] rounded-full bg-[radial-gradient(circle,rgba(165,200,255,0.35),transparent_60%)] animate-glow-a [animation-delay:-6s]" />
        </div>
        <div className="absolute inset-0">
          <FloatingPaths position={1} />
          <FloatingPaths position={-1} />
        </div>

        <div className="relative z-10 self-start">
          <Lockup tone="onDark" className="animate-rise flex items-center gap-3" />
        </div>

        <div className="relative z-10 mt-auto">
          {/* A soft fade toward the panel's deep end so no stroke crosses the copy. */}
          <div
            aria-hidden
            className="pointer-events-none absolute -inset-x-14 -bottom-14 -top-32 -z-10 bg-[linear-gradient(to_bottom,transparent,rgb(14_38_89/0.55)_8rem)]"
          />
          <PanelIntro />
          <p className="mt-10 text-caption text-white/60">© FYT · Find your trainer</p>
        </div>
      </aside>

      {/* ---------- Right: the auth column ---------- */}
      <div className="relative flex min-h-dvh flex-col overflow-hidden bg-paper bg-[radial-gradient(640px_400px_at_82%_-10%,color-mix(in_oklab,var(--accent)_12%,transparent),transparent_70%),radial-gradient(560px_440px_at_4%_112%,color-mix(in_oklab,#38BDF8_10%,transparent),transparent_68%)] px-4 py-5 sm:px-8 lg:min-h-0 lg:py-0">
        {/* At lg the lockup lives in the left panel, so this row floats and
            the card gets the full height to stay centred without scrolling. */}
        <div className="flex items-center justify-between lg:absolute lg:inset-x-0 lg:top-0 lg:z-10 lg:px-8 lg:py-5">
          <Lockup className="animate-rise flex items-center gap-3 lg:invisible" />
          <ThemeToggle />
        </div>

        <div className="flex flex-1 items-center justify-center py-6">
          <div
            className="animate-rise relative w-full max-w-[420px] rounded-[20px] border border-line bg-surface px-5 pb-6 pt-7 shadow-[0_2px_6px_oklch(var(--shadow-ink)/0.04),0_40px_80px_-38px_oklch(var(--shadow-ink)/0.34)] sm:px-8"
            style={{ animationDelay: "40ms", animationFillMode: "both" }}
          >
            {/* NXT .dm-login-card::before: a 3px brand bar inset from the edges. */}
            <span aria-hidden className="absolute inset-x-7 top-0 h-[3px] rounded-b-full" style={{ background: "var(--brand-gradient)" }} />
            {children}
          </div>
        </div>
      </div>
    </main>
  );
}
