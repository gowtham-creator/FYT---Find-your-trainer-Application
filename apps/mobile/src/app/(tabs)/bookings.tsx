import { useRouter } from "expo-router";
import { Fragment, useState } from "react";
import { ScrollView, StyleSheet, View } from "react-native";
import { Eyebrow, Hairline, LargeTitle, Page, Pill, Progress, RailItem, Segmented, SplitView, Txt } from "../../components";
import { SessionDetail } from "../../features/bookings/SessionDetail";
import { BATCH, PAST, SESSIONS } from "../../fixtures";
import { useLayout, usePalette } from "../../theme";

/** Pill text that says what the learner is waiting for, not the internal state. */
export const statusLabel = (status: string, who: string) => (status === "Requested" ? `Waiting for ${who.split(" ")[0]}` : status);

/** S19 Bookings: day groups on one time rail. Width ≥ 600: the selected session opens beside the list. */
export default function Bookings() {
  const p = usePalette();
  const router = useRouter();
  const { gutter, split } = useLayout();
  const [view, setView] = useState<"Upcoming" | "Past">("Upcoming");
  const [selected, setSelected] = useState(SESSIONS[0].id);
  const open = (id: string) => (split ? setSelected(id) : router.push(`/bookings/${id}` as never));
  const days = [...new Set(SESSIONS.map((s) => s.day))];

  const list = (
    <ScrollView contentContainerStyle={styles.pb}>
      <LargeTitle title="Bookings" sub="Demos, mentor calls and your batch classes" />
      <View style={{ paddingHorizontal: gutter }}>
        <Segmented options={["Upcoming", "Past"] as const} value={view} onChange={setView} />
      </View>
      {view === "Upcoming" ? (
        <>
          <Eyebrow>Your batch</Eyebrow>
          <View style={[styles.batch, { paddingHorizontal: gutter }]}>
            <Txt variant="h3">{BATCH.course}</Txt>
            <Txt variant="meta" tone="ink2">
              {BATCH.days} at <Txt variant="meta" mono tone="ink2">{BATCH.time}</Txt> · {BATCH.institute}
            </Txt>
            <View style={styles.mt6}>
              <Progress value={BATCH.attended} of={BATCH.of} />
            </View>
            <Txt variant="caption" tone="onTealSoft">
              <Txt variant="caption" mono tone="onTealSoft">{BATCH.attended}</Txt> of <Txt variant="caption" mono tone="onTealSoft">{BATCH.of}</Txt> classes attended
            </Txt>
          </View>
          {days.map((d) => {
            const items = SESSIONS.filter((s) => s.day === d);
            return (
              <Fragment key={d}>
                <Eyebrow>{d}</Eyebrow>
                {items.map((s, i) => (
                  <View key={s.id} style={split && s.id === selected ? { backgroundColor: p.accentSoft } : undefined}>
                    <RailItem time={s.time} sub={s.end} first={i === 0} last={i === items.length - 1} active={s.status === "Link ready"} onPress={() => open(s.id)}>
                      <Txt variant="h3">{s.title}</Txt>
                      <Txt variant="meta" tone="ink2" numberOfLines={1}>
                        {s.context}
                      </Txt>
                      <Txt variant="meta" tone="ink3" numberOfLines={1}>
                        with {s.with}
                      </Txt>
                      <View style={styles.mt6}>
                        <Pill label={statusLabel(s.status, s.with)} tone={s.status === "Requested" ? "info" : "ok"} icon={s.status === "Requested" ? "clock" : s.status === "Link ready" ? "video" : "check-circle"} />
                      </View>
                    </RailItem>
                  </View>
                ))}
              </Fragment>
            );
          })}
        </>
      ) : (
        <>
          <Eyebrow>November</Eyebrow>
          <Hairline />
          {PAST.map((s) => (
            <View key={s.id}>
              <View style={[styles.past, { paddingHorizontal: gutter }]}>
                <Txt variant="mono" tone="ink2" style={styles.pastDate}>
                  {s.date}
                </Txt>
                <Txt variant="body" style={styles.flex}>
                  {s.title}
                </Txt>
                <Pill label={s.status} tone={s.status === "Attended" ? "teal" : "bad"} icon={s.status === "Attended" ? "check-circle" : "close"} />
              </View>
              <Hairline inset={gutter} />
            </View>
          ))}
        </>
      )}
    </ScrollView>
  );

  const session = SESSIONS.find((s) => s.id === selected) ?? SESSIONS[0];
  return (
    <Page>
      <SplitView lead={list} detail={<SessionDetail key={session.id} session={session} embedded />} />
    </Page>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, minWidth: 0 },
  pb: { paddingBottom: 32 },
  batch: { gap: 6 },
  mt6: { marginTop: 6 },
  past: { flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 14 },
  pastDate: { width: 92 },
});
