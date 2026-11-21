import { ScrollView, StyleSheet, View } from "react-native";
import { Button, FadeUp, Hairline, Icon, Kicker, LiveDot, Pill, Row, SectionTitle, TopBar, Txt } from "../../components";
import type { Session } from "../../fixtures";
import { useLayout, usePalette } from "../../theme";

const tone = (s: Session["status"]) => (s === "Requested" ? "info" : "ok");

/** S20 Session detail: what and when first (time in mono), the one action, then the facts as hairline rows. */
export function SessionDetail({ session, embedded }: { session: Session; embedded?: boolean }) {
  const p = usePalette();
  const { gutter } = useLayout();
  const online = session.where === "Google Meet";
  const first = session.with.split(" ")[0] === "Dr." ? session.with.split(" ").slice(0, 2).join(" ") : session.with.split(" ")[0];
  const pad = { paddingHorizontal: gutter };
  const note =
    session.status === "Requested"
      ? `${first} hasn't accepted yet. You'll get a notification once the call is confirmed. If the time doesn't work, you can pick another.`
      : online && session.status !== "Link ready"
        ? "The Google Meet link shows up here 10 minutes before the start."
        : online
          ? "The Meet room opens 10 minutes before the start. You don't need the Meet app; the browser works."
          : `In person at ${session.where}. Carry a photo ID for the front desk.`;
  return (
    <View style={styles.fill}>
      {embedded ? null : <TopBar title="Booking" />}
      <ScrollView contentContainerStyle={styles.pb}>
        <FadeUp index={0} style={[styles.head, pad, { paddingTop: embedded ? 24 : 8 }]}>
          <Kicker>{session.kind}</Kicker>
          <Txt variant="h1" accessibilityRole="header">
            {session.title}
          </Txt>
          <Txt variant="meta" tone="ink2">
            {session.context}
          </Txt>
          <View style={styles.time}>
            <Txt variant="monoXl">{session.time}</Txt>
            <Txt variant="mono" tone="ink2">
              to {session.end} · {session.dayLabel}
            </Txt>
          </View>
          <View style={styles.status}>
            {session.status === "Link ready" ? <LiveDot color={p.ok} /> : null}
            <Pill label={session.status === "Requested" ? `Waiting for ${first}` : session.status} tone={tone(session.status)} icon={session.status === "Requested" ? "clock" : session.status === "Link ready" ? "video" : "check-circle"} />
          </View>
        </FadeUp>
        <FadeUp index={1} style={[styles.actions, pad]}>
          {online && session.status === "Link ready" ? <Button label="Join on Google Meet" icon="video" onPress={() => undefined} /> : null}
          <View style={styles.note}>
            <Icon name={session.status === "Requested" ? "clock" : online ? "timer" : "pin"} size={20} color={p.ink3} />
            <Txt variant="meta" tone="ink2" style={styles.flex}>
              {note}
            </Txt>
          </View>
        </FadeUp>
        <FadeUp index={2}>
          <SectionTitle title="Details" />
          <Hairline />
          <Row label="With" value={session.with} chevron={false} />
          <Row label="Where" value={session.where} chevron={false} />
          <Row label="Booking ref" value={session.ref} mono chevron={false} />
          <Row label="Fee" value={session.kind === "Batch class" ? "Part of your batch" : "Free"} chevron={false} last />
          <Hairline />
          <Txt variant="meta" tone="ink2" style={[styles.policy, pad]}>
            You can cancel or move this up to 2 hours before it starts. We'll remind you 1 hour and 15 minutes before.
          </Txt>
          <View style={[styles.actions, pad]}>
            <Button label="Add to calendar" variant="secondary" size="md" block icon="calendar" onPress={() => undefined} />
            <Button label="Move to another time" variant="secondary" size="md" block icon="clock" onPress={() => undefined} />
            <Button label="Cancel booking" variant="ghost" size="md" block onPress={() => undefined} />
          </View>
        </FadeUp>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  flex: { flex: 1 },
  pb: { paddingBottom: 40 },
  head: { gap: 8 },
  time: { gap: 2, paddingTop: 8, paddingBottom: 4 },
  status: { flexDirection: "row", alignItems: "center", gap: 4, marginLeft: -4 },
  actions: { paddingTop: 20, gap: 10, alignItems: "stretch" },
  note: { flexDirection: "row", gap: 10, alignItems: "flex-start" },
  policy: { paddingTop: 16 },
});
