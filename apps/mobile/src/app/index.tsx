import { useEffect, useState } from "react";
import { ActivityIndicator, StyleSheet, View } from "react-native";
import { Txt, Wordmark } from "../components";
import { usePalette } from "../theme";

/** Splash / boot: waits for auth, config/public and the user doc. The spinner appears only after 600 ms. */
export default function Splash() {
  const p = usePalette();
  const [slow, setSlow] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setSlow(true), 600);
    return () => clearTimeout(t);
  }, []);
  return (
    <View style={[styles.wrap, { backgroundColor: p.paper }]}>
      <Wordmark size={44} />
      <Txt variant="meta" tone="ink2">
        Find your trainer
      </Txt>
      <View style={styles.spin}>{slow ? <ActivityIndicator color={p.ink3} accessibilityLabel="Loading" /> : null}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, alignItems: "center", justifyContent: "center", gap: 8 },
  spin: { height: 32, marginTop: 16 },
});
