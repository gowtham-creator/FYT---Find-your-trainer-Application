/**
 * Mobile type system (docs/MOBILE-DESIGN.md §3). Two families, two jobs:
 * Open Sauce One for words, JetBrains Mono only for numbers people read off
 * the screen (times, dates, fees, refs, counts, phone numbers). Weight is
 * chosen by family name, never fontWeight (Android has no synthetic weights).
 *
 * Steps run 12 · 13 · 15 · 17 · 20 · 26 · 32, each at least ~1.15x the last,
 * with the big jumps (17 → 20 → 26 → 32) carrying the hierarchy. Tracking
 * tightens as size grows; uppercase micro labels open up.
 */
import type { TextStyle } from "react-native";

export const font = {
  sans: "OpenSauceOne-Regular",
  sansMedium: "OpenSauceOne-Medium",
  sansSemi: "OpenSauceOne-SemiBold",
  /** Kept for older screens: display copy is Open Sauce SemiBold. */
  display: "OpenSauceOne-SemiBold",
  mono: "JetBrainsMono_400Regular",
  monoMedium: "JetBrainsMono_500Medium",
} as const;

export type TextVariant =
  | "display"
  | "h1"
  | "h2"
  | "h3"
  | "bodyLg"
  | "body"
  | "label"
  | "meta"
  | "caption"
  | "micro"
  | "tab"
  | "monoHero"
  | "monoXl"
  | "monoLg"
  | "mono"
  | "monoSm"
  // aliases used by gate and onboarding screens
  | "headline"
  | "title"
  | "cardTitle"
  | "bodyDense"
  | "eyebrow";

export const MIN_TEXT_SIZE = 12;

const tab: TextStyle["fontVariant"] = ["tabular-nums"];

/**
 * Role table. `display` is for the two moments that deserve it (sign-in and
 * booking confirmed) and tab-root titles; detail screens use `h1` so long
 * course names hold to two lines on a 375 pt phone.
 */
const base = {
  display: { fontFamily: font.sansSemi, fontSize: 32, lineHeight: 38, letterSpacing: -0.8 },
  h1: { fontFamily: font.sansSemi, fontSize: 26, lineHeight: 32, letterSpacing: -0.52 },
  h2: { fontFamily: font.sansSemi, fontSize: 20, lineHeight: 26, letterSpacing: -0.2 },
  h3: { fontFamily: font.sansMedium, fontSize: 17, lineHeight: 23, letterSpacing: -0.1 },
  bodyLg: { fontFamily: font.sans, fontSize: 16, lineHeight: 24 },
  body: { fontFamily: font.sans, fontSize: 15, lineHeight: 22 },
  label: { fontFamily: font.sansMedium, fontSize: 15, lineHeight: 20 },
  meta: { fontFamily: font.sans, fontSize: 14, lineHeight: 20 },
  caption: { fontFamily: font.sansMedium, fontSize: 13, lineHeight: 18 },
  micro: { fontFamily: font.sansMedium, fontSize: 12, lineHeight: 16, letterSpacing: 0.6, textTransform: "uppercase" },
  tab: { fontFamily: font.sansMedium, fontSize: 12, lineHeight: 16 },
  /** The one big number on a screen: tonight's time, the confirmed slot. */
  monoHero: { fontFamily: font.monoMedium, fontSize: 32, lineHeight: 38, letterSpacing: -0.6, fontVariant: tab },
  monoXl: { fontFamily: font.monoMedium, fontSize: 24, lineHeight: 30, letterSpacing: -0.3, fontVariant: tab },
  monoLg: { fontFamily: font.monoMedium, fontSize: 17, lineHeight: 22, fontVariant: tab },
  mono: { fontFamily: font.monoMedium, fontSize: 14, lineHeight: 20, fontVariant: tab },
  monoSm: { fontFamily: font.mono, fontSize: 13, lineHeight: 18, fontVariant: tab },
} satisfies Record<string, TextStyle>;

export const type: Record<TextVariant, TextStyle> = {
  ...base,
  headline: base.h1,
  title: base.h2,
  cardTitle: base.h3,
  bodyDense: base.body,
  eyebrow: base.micro,
};

/**
 * Dynamic Type caps (§3 rules): headings and mono facts stop growing at a
 * point where they would break their layout; reading text is never capped.
 */
export const maxScale: Partial<Record<TextVariant, number>> = {
  display: 1.4,
  h1: 1.5,
  h2: 1.6,
  h3: 1.8,
  label: 1.6,
  caption: 1.8,
  micro: 1.6,
  tab: 1.3,
  monoHero: 1.3,
  monoXl: 1.3,
  monoLg: 1.4,
  mono: 1.8,
  monoSm: 1.8,
};
