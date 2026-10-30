/**
 * FYT brand tokens: the admin console's paper/ink + marigold palette
 * (apps/admin/src/app/globals.css, OKLCH) converted to sRGB. Keep in sync
 * with docs/APP-ARCHITECTURE.md §3.4.
 */
export interface Palette {
  paper: string;
  surface: string;
  sunken: string;
  raised: string;
  line: string;
  lineStrong: string;
  ink: string;
  ink2: string;
  ink3: string;
  accent: string;
  accentSoft: string;
  accentInk: string;
  onAccentSoft: string;
  ok: string;
  okSoft: string;
  onOkSoft: string;
  warn: string;
  warnSoft: string;
  onWarnSoft: string;
  bad: string;
  badSoft: string;
  onBadSoft: string;
  info: string;
  infoSoft: string;
  onInfoSoft: string;
}

export const light: Palette = {
  paper: "#FCFAF6",
  surface: "#FFFDFA",
  sunken: "#F5F2EC",
  raised: "#FFFFFD",
  line: "#E3DFD8",
  lineStrong: "#CECAC2",
  ink: "#1F1913",
  ink2: "#5B544C",
  ink3: "#857F79",
  accent: "#F5A32F",
  accentSoft: "#FFECCD",
  accentInk: "#4C2905",
  onAccentSoft: "#4C2905",
  ok: "#298954",
  okSoft: "#DDF6E4",
  onOkSoft: "#167645",
  warn: "#CB5A1A",
  warnSoft: "#FFE8D6",
  onWarnSoft: "#A34000",
  bad: "#C92F33",
  badSoft: "#FFE6E3",
  onBadSoft: "#BC272C",
  info: "#27709C",
  infoSoft: "#E5F2FD",
  onInfoSoft: "#1F6A96",
};

export const dark: Palette = {
  paper: "#15120F",
  surface: "#1C1915",
  sunken: "#0F0D0A",
  raised: "#25211D",
  line: "#312D28",
  lineStrong: "#47413C",
  ink: "#EEEBE4",
  ink2: "#AEAAA2",
  ink3: "#7E7A72",
  accent: "#F8AC3D",
  accentSoft: "#462D0B",
  accentInk: "#281606",
  onAccentSoft: "#FED081",
  ok: "#5EC386",
  okSoft: "#173523",
  onOkSoft: "#5EC386",
  warn: "#F7945A",
  warnSoft: "#4B2915",
  onWarnSoft: "#F7945A",
  bad: "#F2716A",
  badSoft: "#4E201E",
  onBadSoft: "#F2716A",
  info: "#74B3DE",
  infoSoft: "#1A3040",
  onInfoSoft: "#74B3DE",
};

/** Spacing scale. Screen gutter is 16; minimum touch target 48. */
export const space = { 1: 4, 2: 8, 3: 12, 4: 16, 5: 20, 6: 24, 8: 32, 10: 40 } as const;
export const GUTTER = 16;
export const TOUCH = 48;

/** Radii: controls 6, cards 10, sheets and dialogs 14. No pill-shaped panels. */
export const radius = { control: 6, card: 10, sheet: 14 } as const;
