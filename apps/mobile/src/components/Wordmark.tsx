import { StyleSheet, View } from "react-native";
import { usePalette } from "../theme";
import { Txt } from "./Txt";

/** Typographic FYT lockup: Playfair wordmark with a marigold rule. */
export function Wordmark({ size = 34 }: { size?: number }) {
  const p = usePalette();
  return (
    <View style={styles.row} accessible accessibilityLabel="FYT, Find Your Trainer">
      <Txt variant="display" style={{ fontSize: size, lineHeight: size * 1.15 }}>
        FYT
      </Txt>
      <View style={[styles.rule, { backgroundColor: p.accent, height: Math.max(3, size / 10) }]} />
    </View>
  );
}

const styles = StyleSheet.create({ row: { alignSelf: "flex-start", gap: 4 }, rule: { width: "60%", borderRadius: 2 } });
