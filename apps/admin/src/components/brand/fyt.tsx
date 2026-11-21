import { cn } from "@/lib/utils";
import { HORIZONTAL, HORIZONTAL_REVERSED, STACKED, STACKED_REVERSED, SYMBOL, SYMBOL_REVERSED, SYMBOL_SMALL, SYMBOL_VIEWBOX, type Lockup } from "./fyt-paths";

/**
 * FYT brand, Converge v2 (owner-approved). Geometry comes from the logo kit
 * via ./fyt-paths.ts; colours and usage follow the kit's guidelines.md:
 *  - the combined mark (symbol + "FYT" + "Find Your Trainer") is the logo;
 *    "FYT" never appears alone, so there is no wordmark component;
 *  - the symbol alone is for square or small slots (collapsed sidebar, icons);
 *  - minimum sizes: horizontal lockup 40px tall, stacked 64px, symbol 16px
 *    (pass `small` below 32px for the small-size cut);
 *  - clear space: one trainer-dot diameter (about 0.28 x the lockup height)
 *    on every side, left to the caller's padding.
 *
 * tone="azure"  light surfaces: azure symbol, navy type; in the dark theme the
 *               dark-UI version (sky symbol, white type, thinned cut).
 * tone="onDark" the azure sidebar and the sign-in panel: the reversed white cut.
 */
export type FytTone = "azure" | "onDark";

const AZURE = "#1E4FB8";
const NAVY = "#0F1A36";
const SKY = "#6FA0FF";
const WHITE = "#FFFFFF";

function LockupSvg({ l, symbol, type, className, label }: { l: Lockup; symbol: string; type: string; className?: string; label: string }) {
  return (
    <svg viewBox={`0 0 ${l.width} ${l.height}`} className={className} role="img" aria-label={label}>
      <path fill={symbol} d={l.symbol} />
      <path fill={type} d={l.name} />
      <path fill={type} d={l.descriptor} />
    </svg>
  );
}

/** The primary logo. Size it by height (h-10 = the 40px horizontal minimum). */
export function FytLogo({ className, tone = "azure", layout = "horizontal" }: { className?: string; tone?: FytTone; layout?: "horizontal" | "stacked" }) {
  const light = layout === "stacked" ? STACKED : HORIZONTAL;
  const reversed = layout === "stacked" ? STACKED_REVERSED : HORIZONTAL_REVERSED;
  const label = "FYT, Find Your Trainer";
  const size = cn("block h-10 w-auto shrink-0", className);
  if (tone === "onDark") return <LockupSvg l={reversed} symbol={WHITE} type={WHITE} className={size} label={label} />;
  return (
    <>
      <LockupSvg l={light} symbol={AZURE} type={NAVY} className={cn(size, "dark:hidden")} label={label} />
      <LockupSvg l={reversed} symbol={SKY} type={WHITE} className={cn(size, "hidden dark:block")} label={label} />
    </>
  );
}

/** The symbol alone, for square and small slots. `small` uses the 16–32px cut. */
export function FytSymbol({ className, tone = "azure", small, title = "FYT" }: { className?: string; tone?: FytTone; small?: boolean; title?: string }) {
  const size = cn("block size-8 shrink-0", className);
  if (tone === "onDark") {
    return (
      <svg viewBox={SYMBOL_VIEWBOX} className={size} role="img" aria-label={title}>
        <path fill={WHITE} d={small ? SYMBOL_SMALL : SYMBOL_REVERSED} />
      </svg>
    );
  }
  return (
    <svg viewBox={SYMBOL_VIEWBOX} className={size} role="img" aria-label={title}>
      <path fill={AZURE} d={small ? SYMBOL_SMALL : SYMBOL} className="dark:hidden" />
      <path fill={SKY} d={small ? SYMBOL_SMALL : SYMBOL_REVERSED} className="hidden dark:block" />
    </svg>
  );
}
