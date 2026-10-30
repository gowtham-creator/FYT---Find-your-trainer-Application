import { forwardRef, useState, type ComponentRef, type ReactNode } from "react";
import { StyleSheet, TextInput, View, type TextInputProps } from "react-native";
import { font, radius, TOUCH, usePalette } from "../theme";
import { Txt } from "./Txt";

interface Props extends TextInputProps {
  label: string;
  error?: string | null;
  hint?: string;
  prefix?: ReactNode;
  mono?: boolean;
}

/** Label above, sunken fill, error below. The focus ring is marigold. */
export const TextField = forwardRef<ComponentRef<typeof TextInput>, Props>(function TextField({ label, error, hint, prefix, mono, style, onFocus, onBlur, ...rest }, ref) {
  const p = usePalette();
  const [focused, setFocused] = useState(false);
  return (
    <View style={styles.wrap}>
      <Txt variant="caption" tone="ink2">
        {label}
      </Txt>
      <View
        style={[
          styles.box,
          { backgroundColor: p.sunken, borderColor: error ? p.bad : focused ? p.accent : p.lineStrong, borderWidth: focused || error ? 2 : 1 },
        ]}
      >
        {prefix}
        <TextInput
          ref={ref}
          accessibilityLabel={label}
          placeholderTextColor={p.ink3}
          onFocus={(e) => {
            setFocused(true);
            onFocus?.(e);
          }}
          onBlur={(e) => {
            setFocused(false);
            onBlur?.(e);
          }}
          style={[styles.input, { color: p.ink, fontFamily: mono ? font.mono : font.sans }, style]}
          {...rest}
        />
      </View>
      {error ? (
        <Txt variant="caption" tone="bad" accessibilityLiveRegion="polite">
          {error}
        </Txt>
      ) : hint ? (
        <Txt variant="caption" tone="ink3">
          {hint}
        </Txt>
      ) : null}
    </View>
  );
});

const styles = StyleSheet.create({
  wrap: { gap: 6 },
  box: { minHeight: TOUCH + 4, borderRadius: radius.control, flexDirection: "row", alignItems: "center", paddingHorizontal: 12, gap: 8 },
  input: { flex: 1, fontSize: 17, paddingVertical: 12 },
});
