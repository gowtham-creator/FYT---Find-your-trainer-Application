import { StyleSheet, View } from "react-native";
import { Txt } from "./Txt";

export function SectionHeader({ title, caption }: { title: string; caption?: string }) {
  return (
    <View style={styles.wrap} accessibilityRole="header">
      <Txt variant="title">{title}</Txt>
      {caption ? (
        <Txt variant="meta" tone="ink2">
          {caption}
        </Txt>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({ wrap: { gap: 2, marginTop: 8 } });
