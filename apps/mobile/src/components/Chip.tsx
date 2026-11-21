import { StyleSheet } from "react-native";
import { radius, usePalette } from "../theme";
import { Icon } from "./Icon";
import { PressScale } from "./Motion";
import { Txt } from "./Txt";

/** Selectable filter chip. Selection shows a check as well as colour. */
export function Chip({ label, selected, onPress }: { label: string; selected: boolean; onPress: () => void }) {
  const p = usePalette();
  return (
    <PressScale
      accessibilityRole="checkbox"
      accessibilityState={{ checked: selected }}
      accessibilityLabel={label}
      onPress={onPress}
      hitSlop={6}
      style={[styles.chip, { backgroundColor: selected ? p.accentSoft : p.surface, borderColor: selected ? p.accent : p.lineStrong }]}
    >
      {selected ? <Icon name="check" size={16} weight="bold" color={p.onAccentSoft} /> : null}
      <Txt variant="caption" style={{ color: selected ? p.onAccentSoft : p.ink2 }}>
        {label}
      </Txt>
    </PressScale>
  );
}

const styles = StyleSheet.create({
  chip: { flexDirection: "row", alignItems: "center", gap: 6, minHeight: 36, paddingHorizontal: 14, borderRadius: radius.pill, borderWidth: 1 },
});
