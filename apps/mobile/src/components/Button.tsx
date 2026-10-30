import { ActivityIndicator, Pressable, StyleSheet, View } from "react-native";
import { radius, TOUCH, usePalette } from "../theme";
import { Txt } from "./Txt";

interface Props {
  label: string;
  onPress: () => void;
  variant?: "primary" | "secondary" | "ghost";
  disabled?: boolean;
  loading?: boolean;
  accessibilityHint?: string;
}

/** Primary buttons are ink, never marigold (DESIGN.md). */
export function Button({ label, onPress, variant = "primary", disabled, loading, accessibilityHint }: Props) {
  const p = usePalette();
  const inactive = disabled || loading;
  const bg = variant === "primary" ? p.ink : variant === "secondary" ? p.surface : "transparent";
  const fg = variant === "primary" ? p.paper : p.ink;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: !!inactive, busy: !!loading }}
      accessibilityHint={accessibilityHint}
      onPress={onPress}
      disabled={inactive}
      style={({ pressed }) => [
        styles.base,
        { backgroundColor: bg, borderColor: variant === "secondary" ? p.lineStrong : "transparent", opacity: inactive ? 0.45 : pressed ? 0.85 : 1 },
      ]}
    >
      <View style={styles.row}>
        {loading ? <ActivityIndicator size="small" color={fg} /> : null}
        <Txt variant="label" style={{ color: fg }}>
          {label}
        </Txt>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: { minHeight: TOUCH, borderRadius: radius.control, borderWidth: 1, paddingHorizontal: 16, alignItems: "center", justifyContent: "center" },
  row: { flexDirection: "row", alignItems: "center", gap: 8 },
});
