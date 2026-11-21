/**
 * Motion tokens (docs/MOBILE-DESIGN.md §6.1). Corporate-premium: quick, exact,
 * ease-out, no bounce. Only transform and opacity animate.
 */
import { Easing } from "react-native-reanimated";

export const dur = { instant: 90, quick: 140, base: 220, slow: 360, story: 600 } as const;

export const ease = {
  standard: Easing.bezier(0.2, 0, 0, 1),
  enter: Easing.bezier(0.05, 0.7, 0.1, 1),
  exit: Easing.bezier(0.3, 0, 1, 1),
} as const;

export const spring = {
  press: { mass: 1, stiffness: 420, damping: 38 },
  settle: { mass: 1, stiffness: 220, damping: 28 },
  pop: { mass: 1, stiffness: 260, damping: 27 },
} as const;

/** First-mount list entrance: 40 ms apart, capped at 6 items (240 ms total). */
export const STAGGER = 40;
export const STAGGER_MAX = 6;
export const RISE = 8;
