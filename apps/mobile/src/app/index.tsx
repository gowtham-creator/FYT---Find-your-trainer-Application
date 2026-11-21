import { StatusBar } from "expo-status-bar";
import { useEffect, useState } from "react";
import { ActivityIndicator, StyleSheet, useColorScheme, View } from "react-native";
import { FytSymbol } from "../components";

/** Brand band colours, as in the native splash (app.config.ts) so the hand-off does not jump. */
const BAND = { light: "#1E4FB8", dark: "#0F1A36" } as const;

/**
 * Splash / boot: waits for auth, config/public and the user doc. Same frame as
 * the native splash (the white symbol centred on the band); the spinner
 * appears below it only after 600 ms.
 */
export default function Splash() {
  const dark = useColorScheme() === "dark";
  const [slow, setSlow] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setSlow(true), 600);
    return () => clearTimeout(t);
  }, []);
  return (
    <View style={[styles.wrap, { backgroundColor: dark ? BAND.dark : BAND.light }]}>
      <StatusBar style="light" />
      <FytSymbol size={112} tone="onBrand" />
      <View style={styles.spin}>{slow ? <ActivityIndicator color="rgba(255,255,255,0.8)" accessibilityLabel="Loading" /> : null}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, alignItems: "center", justifyContent: "center" },
  spin: { position: "absolute", bottom: "22%", height: 32 },
});
