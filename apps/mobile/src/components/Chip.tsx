import { Feather } from "@expo/vector-icons";
import { Pressable, StyleSheet } from "react-native";
import { radius, usePalette } from "../theme";
import { Txt } from "./Txt";

/** Selectable chip. Selection shows a check icon as well as colour. */
export function Chip({ label, selected, onPress }: { label: string; selected: boolean; onPress: () => void }) {
  const p = usePalette();
  return (
    <Pressable
      accessibilityRole="checkbox"
      accessibilityState={{ checked: selected }}
      onPress={onPress}
      hitSlop={6}
      style={[styles.chip, { backgroundColor: selected ? p.accentSoft : p.surface, borderColor: selected ? p.accent : p.line }]}
    >
      {selected ? <Feather name="check" size={14} color={p.onAccentSoft} /> : null}
      <Txt variant="caption" style={{ color: selected ? p.onAccentSoft : p.ink2 }}>
        {label}
      </Txt>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  chip: { flexDirection: "row", alignItems: "center", gap: 6, minHeight: 36, paddingHorizontal: 12, borderRadius: radius.control, borderWidth: 1 },
});
