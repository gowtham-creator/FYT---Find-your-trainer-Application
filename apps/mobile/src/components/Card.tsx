import type { ReactNode } from "react";
import { StyleSheet, View, type ViewStyle } from "react-native";
import { radius, usePalette } from "../theme";

/** Depth comes from tone plus a 1px line; no shadow. */
export function Card({ children, style }: { children: ReactNode; style?: ViewStyle }) {
  const p = usePalette();
  return <View style={[styles.card, { backgroundColor: p.surface, borderColor: p.line }, style]}>{children}</View>;
}

const styles = StyleSheet.create({ card: { borderRadius: radius.card, borderWidth: 1, padding: 16, gap: 8 } });
