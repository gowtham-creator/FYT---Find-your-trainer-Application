import { Feather } from "@expo/vector-icons";
import type { ComponentProps } from "react";
import { StyleSheet, View } from "react-native";
import { radius, usePalette } from "../theme";
import { Txt } from "./Txt";

type Icon = ComponentProps<typeof Feather>["name"];

/** Teaches the next action and never invents numbers. */
export function EmptyState({ icon, title, body }: { icon: Icon; title: string; body: string }) {
  const p = usePalette();
  return (
    <View style={[styles.wrap, { borderColor: p.line, backgroundColor: p.sunken }]}>
      <View style={[styles.icon, { backgroundColor: p.surface, borderColor: p.line }]}>
        <Feather name={icon} size={18} color={p.ink2} />
      </View>
      <View style={styles.text}>
        <Txt variant="cardTitle">{title}</Txt>
        <Txt variant="meta" tone="ink2">
          {body}
        </Txt>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flexDirection: "row", gap: 12, padding: 16, borderRadius: radius.card, borderWidth: 1, borderStyle: "dashed" },
  icon: { width: 36, height: 36, borderRadius: radius.control, borderWidth: 1, alignItems: "center", justifyContent: "center" },
  text: { flex: 1, gap: 2 },
});
