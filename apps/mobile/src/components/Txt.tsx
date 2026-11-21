import { Text, type TextProps } from "react-native";
import { font, maxScale, type, usePalette, type Palette, type TextVariant } from "../theme";

export type Tone = "ink" | "ink2" | "ink3" | "accent" | "accentInk" | "onBand" | "onAccentSoft" | "onTealSoft" | "onOkSoft" | "onWarnSoft" | "bad" | "ok" | "info";

interface Props extends TextProps {
  variant?: TextVariant;
  tone?: Tone;
  /** JetBrains Mono with tabular figures: times, dates, refs, fees, phone numbers. */
  mono?: boolean;
}

/** All text. Honours Dynamic Type, capped per role so headings and mono facts keep their layout. */
export function Txt({ variant = "body", tone = "ink", mono, style, maxFontSizeMultiplier, ...rest }: Props) {
  const p = usePalette();
  const base = type[variant];
  const medium = base.fontFamily !== font.sans && base.fontFamily !== font.mono;
  return (
    <Text
      {...rest}
      maxFontSizeMultiplier={maxFontSizeMultiplier ?? maxScale[variant]}
      style={[base, { color: p[tone as keyof Palette] }, mono && { fontFamily: medium ? font.monoMedium : font.mono, fontVariant: ["tabular-nums"], letterSpacing: 0 }, style]}
    />
  );
}
