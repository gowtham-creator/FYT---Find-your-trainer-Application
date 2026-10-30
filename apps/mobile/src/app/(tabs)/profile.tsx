import { StyleSheet, View } from "react-native";
import { formatIndianPhone } from "@fyt/domain";
import { backend } from "../../backend";
import { Button, Card, Screen, Txt } from "../../components";
import { appVersion } from "../../config/app-info";
import { appEnv } from "../../config/env";
import { useSessionStore } from "../../session/store";
import { radius, usePalette } from "../../theme";

function Row({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <View style={styles.row}>
      <Txt variant="meta" tone="ink2">
        {label}
      </Txt>
      <Txt variant="meta" mono={mono} style={styles.value}>
        {value}
      </Txt>
    </View>
  );
}

export default function Profile() {
  const p = usePalette();
  const user = useSessionStore((s) => s.userDoc);
  const phone = useSessionStore((s) => s.authUser?.phone);

  return (
    <Screen edges={["top"]}>
      <Txt variant="headline" accessibilityRole="header">
        {user?.name || "Profile"}
      </Txt>
      <Card>
        <Row label="Mobile" value={phone ? formatIndianPhone(phone) : "Not set"} mono />
        <Row label="I am a" value={user?.segment === "corporate" ? "Working professional" : "Student"} />
        <Row label="App version" value={appVersion()} mono />
      </Card>
      {appEnv.env !== "prod" ? (
        <View style={[styles.env, { backgroundColor: p.infoSoft }]}>
          <Txt variant="caption" style={{ color: p.onInfoSoft }}>
            Environment: {appEnv.env}
            {appEnv.authBypass ? " · dev auth bypass" : ""}
          </Txt>
        </View>
      ) : null}
      <Txt variant="meta" tone="ink2">
        Editing your details, education and experience arrives in the next build.
      </Txt>
      <Button variant="secondary" label="Sign out" onPress={() => backend().signOut()} />
      {appEnv.authBypass ? <DevGates /> : null}
    </Screen>
  );
}

/** Bypass-only: preview the maintenance and update gates without touching config/public. */
function DevGates() {
  const b = backend() as ReturnType<typeof backend> & { setConfig?: (patch: object) => void };
  const config = useSessionStore((s) => s.config);
  if (!b.setConfig || !config) return null;
  return (
    <Card>
      <Txt variant="eyebrow" tone="ink3">
        Dev gate preview
      </Txt>
      <Button variant="ghost" label="Show maintenance for 10 seconds" onPress={() => {
        b.setConfig!({ maintenance: { on: true, message: "Preview of the maintenance gate.", until: Date.now() + 10_000 } });
        setTimeout(() => b.setConfig!({ maintenance: { on: false } }), 10_000);
      }} />
      <Button variant="ghost" label="Show update required for 10 seconds" onPress={() => {
        b.setConfig!({ minAppVersion: { android: "999.0.0", ios: "999.0.0" } });
        setTimeout(() => b.setConfig!({ minAppVersion: config.minAppVersion }), 10_000);
      }} />
    </Card>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", justifyContent: "space-between", gap: 12, paddingVertical: 4 },
  value: { flexShrink: 1, textAlign: "right" },
  env: { alignSelf: "flex-start", paddingHorizontal: 10, paddingVertical: 4, borderRadius: radius.control },
});
