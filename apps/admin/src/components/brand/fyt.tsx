import * as React from "react";
import { cn } from "@/lib/utils";

/**
 * FYT brand. Source of truth: brand/logo/*.svg (the master stays gold there).
 * The console renders the mark in azure; brand/ keeps the master gold.
 * Mark: a map pin ("Find") split by a Y ("Your": two paths meeting) into three
 * faceted planes. Below ~24px use `flat` so the Y cut stays legible.
 *
 * tone="azure"  light surfaces (login card, mobile header); lighter facets in dark theme.
 * tone="onDark" the blue sidebar and the blue login aside: a white faceted pin.
 */
export type FytTone = "azure" | "onDark";

const PIN = "M50 114 C 38 100 12 74 12 48 A38 38 0 0 1 88 48 C 88 74 62 100 50 114 Z";
const Y = "M32.5 29.5 L50 50 L67.5 29.5 M50 50 V79";

/* Stop colours as classes so the azure tone can lift in dark theme. */
const FACETS: Record<FytTone, { t: [string, string]; l: [string, string]; r: [string, string]; flat: string }> = {
  azure: {
    t: ["[stop-color:#7FAEFF] dark:[stop-color:#A9C4FF]", "[stop-color:#3B78E7] dark:[stop-color:#6FA0FF]"],
    l: ["[stop-color:#2F6BDE] dark:[stop-color:#6FA0FF]", "[stop-color:#1E4FB8] dark:[stop-color:#3B78E7]"],
    r: ["[stop-color:#1A45A0] dark:[stop-color:#3A6CE0]", "[stop-color:#0E2659] dark:[stop-color:#1E4FB8]"],
    flat: "fill-[#1E4FB8] dark:fill-[#6FA0FF]",
  },
  onDark: {
    t: ["[stop-color:#FFFFFF]", "[stop-color:#FFFFFF]"],
    l: ["[stop-color:#DCE7FF]", "[stop-color:#DCE7FF]"],
    r: ["[stop-color:#A9C4FF]", "[stop-color:#A9C4FF]"],
    flat: "fill-white",
  },
};

export function FytMark({ className, flat, title = "FYT", tone = "azure" }: { className?: string; flat?: boolean; title?: string; tone?: FytTone }) {
  const id = React.useId().replace(/:/g, "");
  const f = FACETS[tone];
  if (flat) {
    return (
      <svg viewBox="0 0 100 120" className={className} role="img" aria-label={title}>
        <defs>
          <mask id={`${id}m`} maskUnits="userSpaceOnUse" x="0" y="0" width="100" height="120">
            <path d={PIN} fill="#fff" />
            <path d={Y} stroke="#000" strokeWidth="10.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
          </mask>
        </defs>
        <path d={PIN} className={f.flat} mask={`url(#${id}m)`} />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 100 120" className={className} role="img" aria-label={title}>
      <defs>
        <linearGradient id={`${id}t`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" className={f.t[0]} />
          <stop offset="1" className={f.t[1]} />
        </linearGradient>
        <linearGradient id={`${id}l`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" className={f.l[0]} />
          <stop offset="1" className={f.l[1]} />
        </linearGradient>
        <linearGradient id={`${id}r`} x1="1" y1="0" x2="0" y2="1">
          <stop offset="0" className={f.r[0]} />
          <stop offset="1" className={f.r[1]} />
        </linearGradient>
        <mask id={`${id}m`} maskUnits="userSpaceOnUse" x="0" y="0" width="100" height="120">
          <path d={PIN} fill="#fff" />
          <path d={Y} stroke="#000" strokeWidth="7.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
        </mask>
      </defs>
      <g mask={`url(#${id}m)`}>
        <polygon points="50,50 -1,-10 101,-10" fill={`url(#${id}t)`} />
        <polygon points="50,50 -1,-10 -10,-10 -10,130 50,130" fill={`url(#${id}l)`} />
        <polygon points="50,50 101,-10 110,-10 110,130 50,130" fill={`url(#${id}r)`} />
      </g>
    </svg>
  );
}

/** Monoline FYT wordmark; the Y carries the azure accent. F and T follow currentColor. */
export function FytWordmark({ className, tone = "azure" }: { className?: string; tone?: FytTone }) {
  const id = React.useId().replace(/:/g, "");
  const stops =
    tone === "onDark"
      ? ["[stop-color:#9CC0FF]", "[stop-color:#FFFFFF]"]
      : ["[stop-color:#3B78E7] dark:[stop-color:#A9C4FF]", "[stop-color:#1A45A0] dark:[stop-color:#6FA0FF]"];
  return (
    <svg viewBox="-2 -2 146 72" className={cn(tone === "onDark" ? "text-white" : "text-ink", className)} role="img" aria-label="FYT">
      <defs>
        <linearGradient id={`${id}w`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" className={stops[0]} />
          <stop offset="1" className={stops[1]} />
        </linearGradient>
      </defs>
      <path d="M6 6 V62 M6 6 H38 M6 33 H32 M98 6 H136 M117 6 V62" stroke="currentColor" strokeWidth="11" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      <path d="M52 6 L69 31 L86 6 M69 31 V62" stroke={`url(#${id}w)`} strokeWidth="11" strokeLinecap="round" strokeLinejoin="round" fill="none" />
    </svg>
  );
}

export function FytLockup({
  className,
  markClassName = "h-8 w-auto",
  wordClassName = "h-5 w-auto",
  tone = "azure",
}: {
  className?: string;
  markClassName?: string;
  wordClassName?: string;
  tone?: FytTone;
}) {
  return (
    <span className={cn("inline-flex items-center gap-2.5", className)}>
      <FytMark className={markClassName} tone={tone} />
      <FytWordmark className={wordClassName} tone={tone} />
    </span>
  );
}
