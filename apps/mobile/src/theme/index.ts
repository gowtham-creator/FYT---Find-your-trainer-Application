import { useColorScheme, useWindowDimensions } from "react-native";
import { dark, light, type Palette } from "./tokens";

export * from "./fonts";
export * from "./motion";
export * from "./tokens";
export * from "./typography";

/** The active palette, following the system light/dark setting. */
export function usePalette(): Palette {
  return useColorScheme() === "dark" ? dark : light;
}

/** Width at which list/detail screens show two panes (iPhone Duo inner display, tablets). */
export const SPLIT_MIN_WIDTH = 600;
/**
 * Band kept clear around the centre fold of a wide landscape window (iPhone Duo
 * inner display: fold at half width). Panes meet either side of it, never on it.
 */
export const FOLD_GAP = 32;

export interface Layout {
  width: number;
  height: number;
  gutter: number;
  /** Two panes side by side. */
  split: boolean;
  /** Width of the leading (list) pane when split. */
  leadWidth: number;
  /** Gap between the panes when split. */
  paneGap: number;
}

/**
 * Style for a single reading column. On a wide landscape window it fills the
 * leading pane so no input or text runs through the centre fold; otherwise it
 * is centred and capped at `max`.
 */
export function useColumn(max: number) {
  const { width, height, split, leadWidth } = useLayout();
  if (split && width > height) return { width: leadWidth, alignSelf: "flex-start" as const };
  return { width: "100%" as const, maxWidth: max, alignSelf: "center" as const };
}

/** Width-based layout, re-read on every resize (fold, rotate, Split View). */
export function useLayout(): Layout {
  const { width, height } = useWindowDimensions();
  const split = width >= SPLIT_MIN_WIDTH;
  // Landscape windows on a foldable split at the centre, so the gap straddles the fold.
  const landscape = width > height;
  const paneGap = split ? (landscape ? FOLD_GAP : 1) : 0;
  const leadWidth = split ? (landscape ? Math.floor((width - paneGap) / 2) : Math.max(300, Math.floor(width * 0.46))) : width;
  return { width, height, gutter: width < 360 ? 16 : 20, split, leadWidth, paneGap };
}

/**
 * Two side-by-side panes for pushed screens (course, pick a time, confirmed,
 * sign-in): only on a wide landscape window such as the iPhone Duo inner
 * display, where each half is phone-shaped and the fold runs down the middle.
 */
export function useTwoPane(): boolean {
  const { split, width, height } = useLayout();
  return split && width > height;
}
