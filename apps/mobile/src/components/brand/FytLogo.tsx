import { useColorScheme, View, type StyleProp, type ViewStyle } from "react-native";
import Svg, { Path } from "react-native-svg";
import { HORIZONTAL, HORIZONTAL_REVERSED, STACKED, STACKED_REVERSED, SYMBOL, SYMBOL_REVERSED, SYMBOL_SMALL, SYMBOL_VIEWBOX } from "./fyt-paths";

/**
 * FYT brand, Converge v2 (owner-approved; kit in brand/logo, rules in
 * brand/logo/guidelines.md). The combined mark (symbol + "FYT" + "Find Your
 * Trainer") is the logo; "FYT" never appears on its own. Minimum sizes: the
 * horizontal lockup 40 pt tall, the stacked 64 pt, the symbol 16 pt (the small
 * cut below 32). Clear space of one trainer-dot diameter (about 0.28 x the
 * lockup height) is left to the caller's layout.
 *
 * tone="auto"     light surfaces: azure symbol and navy type; in dark mode the
 *                 dark-UI version (sky symbol, white type, thinned cut).
 * tone="onBrand"  the azure / navy brand band: the reversed white cut.
 */
export type FytTone = "auto" | "onBrand";

const AZURE = "#1E4FB8";
const NAVY = "#0F1A36";
const SKY = "#6FA0FF";
const WHITE = "#FFFFFF";

export function FytLogo({ height = 40, tone = "auto", layout = "horizontal", style }: { height?: number; tone?: FytTone; layout?: "horizontal" | "stacked"; style?: StyleProp<ViewStyle> }) {
  const dark = useColorScheme() === "dark";
  const reversed = tone === "onBrand" || dark;
  const l = layout === "stacked" ? (reversed ? STACKED_REVERSED : STACKED) : reversed ? HORIZONTAL_REVERSED : HORIZONTAL;
  const symbol = tone === "onBrand" ? WHITE : dark ? SKY : AZURE;
  const type = reversed ? WHITE : NAVY;
  return (
    // Accessibility lives on the View: react-native-svg forwards unknown props to the web <svg>.
    <View style={[{ alignSelf: "flex-start" }, style]} accessible accessibilityRole="image" accessibilityLabel="FYT, Find Your Trainer">
      <Svg width={(height * l.width) / l.height} height={height} viewBox={`0 0 ${l.width} ${l.height}`}>
        <Path fill={symbol} d={l.symbol} />
        <Path fill={type} d={l.name} />
        <Path fill={type} d={l.descriptor} />
      </Svg>
    </View>
  );
}

/** The symbol alone, for square and small slots. Below 32 pt it uses the small cut. */
export function FytSymbol({ size = 32, tone = "auto", style }: { size?: number; tone?: FytTone; style?: StyleProp<ViewStyle> }) {
  const dark = useColorScheme() === "dark";
  const small = size < 32;
  const fill = tone === "onBrand" ? WHITE : dark ? SKY : AZURE;
  const d = small ? SYMBOL_SMALL : tone === "onBrand" || dark ? SYMBOL_REVERSED : SYMBOL;
  return (
    <View style={style} accessible accessibilityRole="image" accessibilityLabel="FYT">
      <Svg width={size} height={size} viewBox={SYMBOL_VIEWBOX}>
        <Path fill={fill} d={d} />
      </Svg>
    </View>
  );
}
