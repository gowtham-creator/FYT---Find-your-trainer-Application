/**
 * Shared shell for the auth screens (/login, /login/verify, /accept-invite),
 * so every step feels like the same page.
 *
 * Layout follows "Auth Section 1" by solaceui on 21st.dev
 * (https://21st.dev/@solaceui/components/auth-section-1): two inset rounded
 * panes on the page, a bordered form pane and a dark grain-gradient pane with
 * one large headline and a glass strip at the foot. Adapted for FYT:
 *  - recoloured to the console tokens and an azure-on-navy grain (the source's
 *    orange, black and white are not used), see ./grain-field.tsx;
 *  - the console's fonts and type scale, not the source's;
 *  - the FYT lockup on the dark pane;
 *  - below `lg` the dark pane shrinks to a short brand band above the form,
 *    so sign-in stays on one screen on a phone.
 */
import { FytMark, FytWordmark } from "@/components/brand/fyt";
import { GrainField } from "./grain-field";
import { PanelIntro } from "./panel-intro";
import { ThemeToggle } from "./theme-toggle";

function Lockup() {
  return (
    <div className="animate-rise relative flex items-center gap-3 self-start">
      <FytMark tone="onDark" className="h-9 w-auto" />
      <div className="leading-tight">
        <FytWordmark tone="onDark" className="h-[17px] w-auto" />
        <p className="mt-1 text-micro uppercase tracking-[0.16em] text-white/75">Find your trainer</p>
      </div>
    </div>
  );
}

export function AuthShell({ children }: { children: React.ReactNode }) {
  return (
    <main className="relative isolate flex min-h-dvh flex-col gap-3 bg-paper p-3 lg:grid lg:h-dvh lg:grid-cols-[minmax(0,0.94fr)_minmax(0,1.06fr)] lg:overflow-hidden">
      {/* ---------- Dark pane: grain, lockup, headline ---------- */}
      <aside className="relative flex min-h-[84px] shrink-0 flex-col justify-center overflow-hidden rounded-[14px] bg-[#060E24] px-5 py-4 text-white lg:order-2 lg:justify-start lg:p-10 xl:p-14">
        <GrainField className="absolute inset-0 size-full" />
        {/* On the short band the lockup needs a calm side to sit on. */}
        <span aria-hidden className="absolute inset-0 bg-[linear-gradient(90deg,#060E24_30%,rgb(6_14_36/0.6)_62%,transparent)] lg:hidden" />
        <Lockup />
        <PanelIntro />
      </aside>

      {/* ---------- Form pane ---------- */}
      <div className="relative flex min-h-0 flex-1 flex-col rounded-[14px] border border-line bg-surface px-5 py-6 sm:px-10 lg:overflow-y-auto">
        <div className="absolute right-3 top-3 z-10 sm:right-4 sm:top-4">
          <ThemeToggle />
        </div>
        <div className="animate-rise m-auto w-full max-w-[420px]" style={{ animationDelay: "40ms", animationFillMode: "both" }}>
          {children}
        </div>
      </div>
    </main>
  );
}
