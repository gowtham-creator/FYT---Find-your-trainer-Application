import { ArrowDownRight, ArrowUpRight, Minus } from "lucide-react";
import { cn, fmtNumber } from "@/lib/utils";
import { UiIcon } from "@/components/icons/ui-icon";

export interface Kpi {
  label: string;
  /** Solar two-tone icon beside the label. */
  icon?: React.ElementType;
  value: string;
  /** Change vs previous period; undefined = no comparison available. */
  delta?: { text: string; direction: "up" | "down" | "flat"; good: boolean; /** Draw the approved seal instead of the flat dash. */ verified?: boolean };
  hint: string;
}

/* Per-card 3px top bar, cycling cool tones: brand, teal, sky, green. */
const TOP_BARS = ["var(--brand-gradient)", "var(--viz-2)", "var(--info)", "var(--ok)"];

export function KpiBand({ items }: { items: Kpi[] }) {
  return (
    <section aria-label="Key figures" className="grid grid-cols-2 gap-4 lg:grid-cols-4">
      {items.map((k, i) => {
        const Icon = k.icon;
        return (
          <div
            key={k.label}
            className="relative flex min-w-0 flex-col gap-1.5 overflow-hidden rounded-[var(--radius-panel)] border border-line bg-surface px-4 pb-4 pt-5 shadow-[var(--shadow-card)] sm:px-5"
          >
            <span aria-hidden className="absolute inset-x-0 top-0 h-[3px]" style={{ background: TOP_BARS[i % TOP_BARS.length] }} />
            <div className="flex min-w-0 items-start justify-between gap-3">
              <p className="min-w-0 pt-1 text-micro font-medium uppercase tracking-[0.06em] text-ink-3">{k.label}</p>
              {Icon ? (
                <span className="grid size-[38px] shrink-0 place-items-center rounded-[10px] bg-accent-soft text-on-accent-soft">
                  <Icon className="size-[19px]" aria-hidden />
                </span>
              ) : null}
            </div>
            <p className="truncate text-[28px] font-semibold leading-tight tracking-[-0.02em] text-ink tabular-nums" title={k.value}>
              {k.value}
            </p>
            {/* Wraps as a unit: the delta pill never splits across lines, the
                hint drops below it when the card is narrow. */}
            <div className="flex min-h-6 flex-wrap items-center gap-x-2 gap-y-1 text-caption leading-snug">
              {k.delta ? (
                <span
                  className={cn(
                    "inline-flex h-6 shrink-0 items-center gap-0.5 whitespace-nowrap rounded-full px-2 font-medium",
                    k.delta.direction === "flat"
                      ? "bg-sunken text-ink-2"
                      : k.delta.good
                        ? "bg-ok-soft text-on-ok-soft"
                        : "bg-bad-soft text-on-bad-soft",
                  )}
                >
                  {k.delta.direction === "up" ? (
                    <ArrowUpRight className="size-3.5" strokeWidth={2} aria-hidden />
                  ) : k.delta.direction === "down" ? (
                    <ArrowDownRight className="size-3.5" strokeWidth={2} aria-hidden />
                  ) : k.delta.verified ? (
                    <UiIcon name="verified" className="size-3.5 text-ok" />
                  ) : (
                    <Minus className="size-3.5" strokeWidth={2} aria-hidden />
                  )}
                  <span className="num">{k.delta.text}</span>
                </span>
              ) : null}
              <span className="text-ink-3">{k.hint}</span>
            </div>
          </div>
        );
      })}
    </section>
  );
}

export function countDelta(cur: number, prev: number, higherIsGood = true): Kpi["delta"] {
  if (prev === 0 && cur === 0) return { text: "0", direction: "flat", good: true };
  const diff = cur - prev;
  const direction = diff > 0 ? "up" : diff < 0 ? "down" : "flat";
  const text = prev === 0 ? `+${fmtNumber(diff)}` : `${diff > 0 ? "+" : ""}${Math.round((diff / prev) * 100)}%`;
  return { text, direction, good: direction === "flat" || (direction === "up") === higherIsGood };
}

export function rateDelta(cur: number, prev: number): Kpi["delta"] {
  const pp = (cur - prev) * 100;
  const direction = Math.abs(pp) < 0.5 ? "flat" : pp > 0 ? "up" : "down";
  return { text: `${pp > 0 ? "+" : ""}${pp.toFixed(1)} pts`, direction, good: direction !== "down" };
}
