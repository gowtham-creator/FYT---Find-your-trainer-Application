import { Text, type TextProps } from "react-native";
import { type, usePalette, type Palette, type TextVariant } from "../theme";

export type Tone = "ink" | "ink2" | "ink3" | "accentInk" | "bad" | "ok" | "info";

interface Props extends TextProps {
  variant?: TextVariant;
  tone?: Tone;
  /** Geist Mono with tabular figures: times, refs, codes, phone numbers. */
  mono?: boolean;
}

export function Txt({ variant = "body", tone = "ink", mono, style, ...rest }: Props) {
  const p = usePalette();
  const base = type[variant];
  return (
    <Text
      {...rest}
      style={[
        base,
        { color: p[tone as keyof Palette] },
        mono && { fontFamily: base.fontFamily?.includes("Medium") ? "GeistMono_500Medium" : "GeistMono_400Regular", fontVariant: ["tabular-nums"] },
        style,
      ]}
    />
  );
}
