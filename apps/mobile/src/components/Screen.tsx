import type { ReactNode } from "react";
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View, type ViewStyle } from "react-native";
import { SafeAreaView, type Edge } from "react-native-safe-area-context";
import { GUTTER, usePalette } from "../theme";

interface Props {
  children: ReactNode;
  scroll?: boolean;
  edges?: Edge[];
  footer?: ReactNode;
  contentStyle?: ViewStyle;
}

/** Paper background, safe areas, 16px gutter, keyboard-aware footer. */
export function Screen({ children, scroll = true, edges = ["top", "bottom"], footer, contentStyle }: Props) {
  const p = usePalette();
  const body = scroll ? (
    <ScrollView contentContainerStyle={[styles.content, contentStyle]} keyboardShouldPersistTaps="handled">
      {children}
    </ScrollView>
  ) : (
    <View style={[styles.content, styles.fill, contentStyle]}>{children}</View>
  );
  return (
    <SafeAreaView edges={edges} style={[styles.fill, { backgroundColor: p.paper }]}>
      <KeyboardAvoidingView style={styles.fill} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        {body}
        {footer ? <View style={[styles.footer, { borderTopColor: p.line, backgroundColor: p.paper }]}>{footer}</View> : null}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  content: { paddingHorizontal: GUTTER, paddingTop: 24, paddingBottom: 32, gap: 16 },
  footer: { paddingHorizontal: GUTTER, paddingTop: 12, paddingBottom: 12, borderTopWidth: StyleSheet.hairlineWidth },
});
