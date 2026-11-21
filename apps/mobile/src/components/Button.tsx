import { ActivityIndicator, StyleSheet, View } from "react-native";
import { radius, TOUCH, usePalette } from "../theme";
import { Icon, type IconName } from "./Icon";
import { PressScale } from "./Motion";
import { Txt } from "./Txt";

interface Props {
  label: string;
  onPress: () => void;
  /** primary = azure fill; inverse = white on an azure band; tonal = accentSoft; secondary = hairline outline; ghost = text only. */
  variant?: "primary" | "inverse" | "tonal" | "secondary" | "ghost";
  size?: "sm" | "md" | "lg";
  disabled?: boolean;
  loading?: boolean;
  accessibilityHint?: string;
  /** Stretch to the container width (default true for lg). */
  block?: boolean;
  /** Leading 20 pt Phosphor icon. */
  icon?: IconName;
}

export function Button({ label, onPress, variant = "primary", size = "lg", disabled, loading, accessibilityHint, block, icon }: Props) {
  const p = usePalette();
  const inactive = disabled || loading;
  const fg = { primary: p.accentInk, inverse: p.accent, tonal: p.onAccentSoft, ghost: p.accent, secondary: p.ink }[variant];
  const bg = { primary: p.accent, inverse: p.surface, tonal: p.accentSoft, ghost: "transparent", secondary: "transparent" }[variant];
  const minHeight = size === "lg" ? 52 : size === "md" ? TOUCH - 4 : 36;
  return (
    <PressScale
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled: !!inactive, busy: !!loading }}
      accessibilityHint={accessibilityHint}
      onPress={onPress}
      disabled={inactive}
      hitSlop={size === "sm" ? 6 : 0}
      style={[
        styles.base,
        {
          minHeight,
          paddingHorizontal: size === "sm" ? 12 : variant === "ghost" ? 4 : 20,
          alignSelf: (block ?? size === "lg") ? "stretch" : "flex-start",
          backgroundColor: bg,
          borderColor: variant === "secondary" ? p.lineStrong : "transparent",
          opacity: inactive ? 0.45 : 1,
        },
      ]}
    >
      <View style={styles.row}>
        {loading ? <ActivityIndicator size="small" color={fg} /> : icon ? <Icon name={icon} size={20} color={fg} weight={variant === "primary" || variant === "inverse" ? "fill" : "regular"} /> : null}
        <Txt variant={size === "sm" ? "caption" : "label"} style={{ color: fg }} maxFontSizeMultiplier={1.3}>
          {label}
        </Txt>
      </View>
    </PressScale>
  );
}

const styles = StyleSheet.create({
  base: { borderRadius: radius.r12, borderWidth: 1, alignItems: "center", justifyContent: "center" },
  row: { flexDirection: "row", alignItems: "center", gap: 8 },
});
