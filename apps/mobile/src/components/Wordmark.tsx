import { StyleSheet, View } from "react-native";
import { font, usePalette } from "../theme";
import { Txt } from "./Txt";

/** Typographic FYT mark: SemiBold letters with an azure full stop. */
export function Wordmark({ size = 22 }: { size?: number }) {
  const p = usePalette();
  return (
    <View style={styles.row} accessible accessibilityLabel="FYT, Find Your Trainer">
      <Txt style={{ fontFamily: font.sansSemi, fontSize: size, lineHeight: size * 1.2, letterSpacing: -0.4 }}>FYT</Txt>
      <View style={[styles.dot, { backgroundColor: p.accent, width: size / 4, height: size / 4, marginBottom: size * 0.22 }]} />
    </View>
  );
}

const styles = StyleSheet.create({ row: { alignSelf: "flex-start", flexDirection: "row", alignItems: "flex-end", gap: 2 }, dot: { borderRadius: 99 } });
