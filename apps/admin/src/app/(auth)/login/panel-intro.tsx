"use client";

/**
 * The dark pane's copy (lg and up): one large headline that arrives word by
 * word and one line in a glass strip at the foot, where "Auth Section 1" has
 * its download link (see ./auth-shell.tsx). No cards, no data, no social proof.
 *
 * Motion is opacity + translate only (motion/react). Under
 * prefers-reduced-motion the same markup renders static and finished.
 */
import { motion } from "motion/react";
import { CalendarCheck2 } from "lucide-react";
import { usePrefersReducedMotion } from "./use-reduced-motion";

const HEADLINE = "Every booking, handled in one place.".split(" ");
const SUPPORT = "The operations console for FYT trainers and institutes.";

const EASE = [0.25, 1, 0.5, 1] as const;
const WORD_STEP = 0.07;
const AFTER_HEADLINE = 0.15 + HEADLINE.length * WORD_STEP;

export function PanelIntro() {
  const reduce = usePrefersReducedMotion();
  const rise = (delay: number, y = 10) =>
    reduce ? {} : { initial: { opacity: 0, y }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.55, delay, ease: EASE } };

  return (
    <div className="relative hidden flex-1 flex-col lg:flex">
      <p className="font-display mt-14 max-w-[13ch] text-balance text-[clamp(40px,4.3vw,64px)] font-medium leading-[1.08] tracking-[-0.04em] text-white xl:mt-16">
        {HEADLINE.map((word, i) => (
          <span key={i}>
            <motion.span className="inline-block" {...rise(0.15 + i * WORD_STEP, 16)}>
              {word}
            </motion.span>
            {i < HEADLINE.length - 1 ? " " : null}
          </span>
        ))}
      </p>

      <motion.p
        className="mt-auto flex min-h-12 items-center gap-3 self-start rounded-[10px] border border-white/25 bg-[#060E24]/70 px-4 py-2.5 text-body text-white/90"
        {...rise(AFTER_HEADLINE)}
      >
        <CalendarCheck2 className="size-[18px] shrink-0" strokeWidth={1.75} aria-hidden />
        {SUPPORT}
      </motion.p>
    </div>
  );
}
