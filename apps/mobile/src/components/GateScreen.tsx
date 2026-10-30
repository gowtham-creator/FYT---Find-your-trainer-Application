import { Feather } from "@expo/vector-icons";
import type { ComponentProps, ReactNode } from "react";
import { Linking, StyleSheet, View } from "react-native";
import type { GateCopy } from "../session/gates";
import { radius, usePalette, type Palette } from "../theme";
import { Button } from "./Button";
import { Screen } from "./Screen";
import { Txt } from "./Txt";

interface Props {
  copy: GateCopy;
  icon: ComponentProps<typeof Feather>["name"];
  tone: "warn" | "info" | "bad";
  actions?: ReactNode;
}

/** Full-screen gate: update required, maintenance, blocked. Icon + label, never colour alone. */
export function GateScreen({ copy, icon, tone, actions }: Props) {
  const p = usePalette();
  const soft = p[`${tone}Soft` as keyof Palette];
  const on = p[`on${tone[0]!.toUpperCase()}${tone.slice(1)}Soft` as keyof Palette];
  return (
    <Screen
      footer={
        <View style={styles.actions}>
          {actions}
          {copy.supportEmail ? <Button variant="ghost" label={`Email ${copy.supportEmail}`} onPress={() => Linking.openURL(`mailto:${copy.supportEmail}`)} /> : null}
          {copy.supportPhone ? <Button variant="ghost" label={`Call ${copy.supportPhone}`} onPress={() => Linking.openURL(`tel:${copy.supportPhone}`)} /> : null}
        </View>
      }
    >
      <View style={styles.top}>
        <View style={[styles.badge, { backgroundColor: soft }]}>
          <Feather name={icon} size={16} color={on} />
          <Txt variant="caption" style={{ color: on }}>
            {copy.eyebrow}
          </Txt>
        </View>
        <Txt variant="headline" accessibilityRole="header">
          {copy.title}
        </Txt>
        <Txt variant="body" tone="ink2">
          {copy.body}
        </Txt>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  top: { gap: 12, paddingTop: 48 },
  badge: { flexDirection: "row", alignItems: "center", alignSelf: "flex-start", gap: 6, paddingHorizontal: 10, paddingVertical: 4, borderRadius: radius.control },
  actions: { gap: 4 },
});
