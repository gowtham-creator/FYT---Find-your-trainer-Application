import { StyleSheet, View } from "react-native";
import { FadeUp, Hairline, Icon, Kicker, Txt } from "../../components";
import { OPEN_DEMOS } from "../../fixtures";
import { usePalette } from "../../theme";

/** "Open demos this week": a small slice of the timetable, shown before sign-in so the app explains itself. */
export function OpenDemos({ title = true }: { title?: boolean }) {
  const p = usePalette();
  return (
    <View style={styles.wrap}>
      {title ? <Kicker>Free demos with seats this week</Kicker> : null}
      <View>
        {OPEN_DEMOS.map((d, i) => (
          <FadeUp key={d.title} index={i + 2}>
            <View style={styles.row} accessible accessibilityLabel={`${d.when} ${d.time}: ${d.title} demo, ${d.who}, ${d.mode}`}>
              <View style={styles.when}>
                <Txt variant="caption" tone="ink3">
                  {d.when}
                </Txt>
                <Txt variant="mono">{d.time}</Txt>
              </View>
              <View style={[styles.bar, { backgroundColor: i === 0 ? p.accent : p.lineStrong }]} />
              <View style={styles.flex}>
                <Txt variant="label">{d.title}</Txt>
                <Txt variant="meta" tone="ink2" numberOfLines={1}>
                  {d.who}
                </Txt>
                <View style={styles.mode}>
                  <Icon name={d.mode === "Online" ? "video" : "pin"} size={16} color={p.ink3} />
                  <Txt variant="caption" tone="ink3">
                    {d.mode}
                  </Txt>
                </View>
              </View>
            </View>
            {i < OPEN_DEMOS.length - 1 ? <Hairline inset={88} /> : null}
          </FadeUp>
        ))}
      </View>
    </View>
  );
}

/** What happens after the code: the real next steps, so the wait for an SMS has context. */
export function NextSteps({ step }: { step: 1 | 2 }) {
  const p = usePalette();
  const steps = [
    ["Confirm your number", "One code, no password."],
    ["Tell us where you are", "Student or working, and your area, so batch timings make sense."],
    ["Book a free demo", "Pick a trainer and a time. The Meet link arrives in the app."],
  ];
  return (
    <View style={styles.wrap}>
      <Kicker>What happens next</Kicker>
      {steps.map(([t, d], i) => {
        const done = i < step - 1;
        const now = i === step - 1;
        return (
          <FadeUp key={t} index={i + 1} style={styles.step}>
            <View style={[styles.num, { backgroundColor: now ? p.accent : done ? p.accentSoft : "transparent", borderColor: now ? p.accent : p.lineStrong }]}>
              {done ? <Icon name="check" size={16} weight="bold" color={p.onAccentSoft} /> : <Txt variant="mono" style={{ color: now ? p.accentInk : p.ink2 }}>{String(i + 1)}</Txt>}
            </View>
            <View style={styles.flex}>
              <Txt variant="label" tone={now ? "ink" : "ink2"}>
                {t}
              </Txt>
              <Txt variant="meta" tone="ink3">
                {d}
              </Txt>
            </View>
          </FadeUp>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 12 },
  flex: { flex: 1, minWidth: 0, gap: 2 },
  row: { flexDirection: "row", gap: 12, paddingVertical: 12, alignItems: "stretch" },
  when: { width: 64, gap: 2 },
  bar: { width: 2, borderRadius: 1 },
  mode: { flexDirection: "row", alignItems: "center", gap: 4, marginTop: 2 },
  step: { flexDirection: "row", gap: 14, alignItems: "flex-start", paddingVertical: 6 },
  num: { width: 28, height: 28, borderRadius: 14, borderWidth: 1, alignItems: "center", justifyContent: "center" },
});
