/**
 * Type scale (APP-ARCHITECTURE §3.5). Never 600 or bold: hierarchy comes from
 * size, ink/ink2/ink3 and spacing. Playfair only at 18px and up. Nothing below
 * 13px except the uppercase 12px eyebrow.
 */
import type { TextStyle } from "react-native";

/** Family names registered by `useFytFonts` (one family per weight on native). */
export const font = {
  sans: "Inter_400Regular",
  sansMedium: "Inter_500Medium",
  display: "PlayfairDisplay_500Medium",
  mono: "GeistMono_400Regular",
  monoMedium: "GeistMono_500Medium",
} as const;

export type TextVariant = "display" | "headline" | "title" | "cardTitle" | "body" | "bodyDense" | "meta" | "label" | "caption" | "eyebrow";

export const MIN_TEXT_SIZE = 13;

export const type: Record<TextVariant, TextStyle> = {
  display: { fontFamily: font.display, fontSize: 34, lineHeight: 40 },
  headline: { fontFamily: font.display, fontSize: 28, lineHeight: 34, letterSpacing: -0.28 },
  title: { fontFamily: font.display, fontSize: 22, lineHeight: 28 },
  cardTitle: { fontFamily: font.sansMedium, fontSize: 17, lineHeight: 24 },
  body: { fontFamily: font.sans, fontSize: 16, lineHeight: 24 },
  bodyDense: { fontFamily: font.sans, fontSize: 15, lineHeight: 22 },
  meta: { fontFamily: font.sans, fontSize: 14, lineHeight: 20 },
  label: { fontFamily: font.sansMedium, fontSize: 15, lineHeight: 20 },
  caption: { fontFamily: font.sansMedium, fontSize: 13, lineHeight: 18 },
  eyebrow: { fontFamily: font.sansMedium, fontSize: 12, lineHeight: 16, letterSpacing: 0.72, textTransform: "uppercase" },
};
