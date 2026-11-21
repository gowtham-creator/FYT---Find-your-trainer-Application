import type { ReactNode } from "react";
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View, type ViewStyle } from "react-native";
import { SafeAreaView, type Edge } from "react-native-safe-area-context";
import { useColumn, useLayout, usePalette, useTwoPane } from "../theme";

interface Props {
  children: ReactNode;
  scroll?: boolean;
  edges?: Edge[];
  header?: ReactNode;
  footer?: ReactNode;
  contentStyle?: ViewStyle;
  /** Companion content for the right pane on a wide landscape window (iPhone Duo inner display). Hidden elsewhere. */
  aside?: ReactNode;
}

/**
 * Single-column form screens (auth, onboarding, gates): paper background,
 * per-edge safe areas, width-based gutter, and a 560 pt reading column on
 * wide windows so nothing stretches across a foldable or tablet.
 */
export function Screen({ children, scroll = true, edges = ["top", "bottom", "left", "right"], header, footer, contentStyle, aside }: Props) {
  const p = usePalette();
  const { gutter, leadWidth, paneGap } = useLayout();
  const twoPane = useTwoPane();
  const column = { paddingHorizontal: gutter, ...useColumn(560 + gutter * 2) };
  const body = scroll ? (
    <ScrollView contentContainerStyle={[styles.content, column, contentStyle]} keyboardShouldPersistTaps="handled">
      {children}
    </ScrollView>
  ) : (
    <View style={[styles.content, column, styles.fill, contentStyle]}>{children}</View>
  );
  const main = (
    <KeyboardAvoidingView style={styles.fill} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      {header ? <View style={[column, { paddingHorizontal: 0 }]}>{header}</View> : null}
      {body}
      {footer ? (
        <View style={[styles.footer, { borderTopColor: twoPane ? "transparent" : p.line, backgroundColor: p.paper }]}>
          <View style={column}>{footer}</View>
        </View>
      ) : null}
    </KeyboardAvoidingView>
  );
  if (twoPane && aside) {
    return (
      <SafeAreaView edges={edges} style={[styles.fill, styles.row, { backgroundColor: p.paper }]}>
        <View style={{ width: leadWidth }}>{main}</View>
        <View style={{ width: paneGap, backgroundColor: p.sunken }} />
        <ScrollView style={[styles.fill, { backgroundColor: p.sunken }]} contentContainerStyle={[styles.aside, { paddingHorizontal: gutter + 4 }]}>
          {aside}
        </ScrollView>
      </SafeAreaView>
    );
  }
  return (
    <SafeAreaView edges={edges} style={[styles.fill, { backgroundColor: p.paper }]}>
      {main}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  row: { flexDirection: "row" },
  aside: { paddingTop: 40, paddingBottom: 32, gap: 16 },
  content: { paddingTop: 16, paddingBottom: 32, gap: 16 },
  footer: { paddingTop: 12, paddingBottom: 12, borderTopWidth: StyleSheet.hairlineWidth },
});
