import { useRouter } from "expo-router";
import { Pressable, ScrollView, StyleSheet, View } from "react-native";
import { Avatar, Button, FadeUp, Hairline, Icon, IconButton, LiveDot, Page, Progress, RailItem, SectionTitle, Txt } from "../../components";
import { CourseRow } from "../../features/catalog/CourseRow";
import { BATCH, COURSES, LEARNER, MENTORS, SESSIONS } from "../../fixtures";
import { useSessionStore } from "../../session/store";
import { radius, useLayout, usePalette, useTwoPane } from "../../theme";

/**
 * S09 Home. Answers "what is my next session" before anything else: tonight's
 * class sits in the one azure panel on the screen, the rest of the week runs
 * down the time rail, then the batch in progress, then picks. On a wide
 * landscape window (iPhone Duo inner display) the schedule and the picks sit
 * either side of the fold.
 */
export default function Home() {
  const p = usePalette();
  const router = useRouter();
  const { gutter, leadWidth, paneGap } = useLayout();
  const split = useTwoPane();
  const segment = useSessionStore((s) => s.userDoc?.segment);
  const first = useSessionStore((s) => s.userDoc?.name?.split(" ")[0]) ?? LEARNER.first;
  const [tonight, ...later] = SESSIONS;

  const schedule = (
    <View>
      <FadeUp index={0} style={[styles.head, { paddingHorizontal: gutter }]}>
        <View style={styles.flex}>
          <Txt variant="monoSm" tone="ink3">
            Tue 17 Nov
          </Txt>
          <Txt variant="h1" accessibilityRole="header" numberOfLines={2}>
            Good evening, {first}
          </Txt>
        </View>
        <View>
          <IconButton name="bell" label="Notifications, 2 unread" />
          <View style={[styles.dot, { backgroundColor: p.accent, borderColor: p.paper }]} />
        </View>
      </FadeUp>

      <FadeUp index={1} style={{ paddingHorizontal: gutter }}>
        <View style={[styles.hero, { backgroundColor: p.band }]} accessibilityLabel={`Tonight at ${tonight.time}: ${tonight.title}, ${tonight.context}, with ${tonight.with} on Google Meet. Link ready.`}>
          <View style={styles.heroTop}>
            <LiveDot color={p.onBand} />
            <Txt variant="micro" tone="onBand" style={styles.dim}>
              Tonight · link ready
            </Txt>
          </View>
          <View style={styles.heroTime}>
            <Txt variant="monoHero" tone="onBand">
              {tonight.time}
            </Txt>
            <Txt variant="monoSm" tone="onBand" style={styles.dim}>
              to {tonight.end}
            </Txt>
          </View>
          <View style={styles.gap2}>
            <Txt variant="h2" tone="onBand">
              {tonight.title}
            </Txt>
            <Txt variant="meta" tone="onBand" style={styles.dim}>
              {tonight.context} · {tonight.with}
            </Txt>
          </View>
          <View style={styles.heroFoot}>
            <Button label="Join on Google Meet" variant="inverse" size="md" block={false} icon="video" onPress={() => undefined} />
            <Pressable accessibilityRole="link" hitSlop={12} onPress={() => router.push(`/bookings/${tonight.id}` as never)} style={styles.details}>
              <Txt variant="label" tone="onBand">
                Details
              </Txt>
              <Icon name="chevron" size={16} color={p.onBand} />
            </Pressable>
          </View>
          <Txt variant="caption" tone="onBand" style={styles.dim}>
            The Meet room opens at <Txt variant="caption" mono tone="onBand">6:50 pm</Txt>, ten minutes before class.
          </Txt>
        </View>
      </FadeUp>

      <FadeUp index={2}>
        <SectionTitle title="Later this week" action="All bookings" onAction={() => router.push("/bookings" as never)} />
        {later.slice(0, 2).map((s, i) => (
          <RailItem key={s.id} time={s.time} sub={s.dayLabel.slice(0, 6)} first={i === 0} last={i === 1} onPress={() => router.push(`/bookings/${s.id}` as never)}>
            <Txt variant="h3">{s.title}</Txt>
            <Txt variant="meta" tone="ink2">
              {s.context}
            </Txt>
            <Txt variant="meta" tone="ink3">
              with {s.with}
            </Txt>
          </RailItem>
        ))}
      </FadeUp>

      <FadeUp index={3}>
        <SectionTitle title="Your batch" />
        <View style={[styles.batch, { paddingHorizontal: gutter }]}>
          <View style={styles.batchTop}>
            <View style={styles.flex}>
              <Txt variant="h3">{BATCH.course}</Txt>
              <Txt variant="meta" tone="ink2">
                Week <Txt variant="meta" mono>{BATCH.week}</Txt> of <Txt variant="meta" mono>{BATCH.weeks}</Txt> · {BATCH.module}
              </Txt>
            </View>
            <View style={styles.batchCount} accessible accessibilityLabel={`${BATCH.attended} of ${BATCH.of} classes attended`}>
              <Txt variant="monoXl">{BATCH.attended}</Txt>
              <Txt variant="monoSm" tone="ink3">
                /{BATCH.of}
              </Txt>
            </View>
          </View>
          <Progress value={BATCH.attended} of={BATCH.of} />
          <Txt variant="caption" tone="ink3">
            Classes attended · {BATCH.institute}
          </Txt>
        </View>
      </FadeUp>
    </View>
  );

  const picks = (
    <View style={split ? styles.pt8 : undefined}>
      <FadeUp index={split ? 1 : 4}>
        <SectionTitle
          title={segment === "corporate" ? "Weekend batches for working people" : "Batches starting soon"}
          caption="Evening and weekend timings, Ameerpet and online"
          action="See all"
          onAction={() => router.push("/explore" as never)}
        />
        {COURSES.slice(1, 4).map((c, i) => (
          <CourseRow key={c.id} course={c} last={i === 2} onPress={() => router.push(`/courses/${c.id}` as never)} />
        ))}
      </FadeUp>
      <FadeUp index={split ? 2 : 5}>
        <SectionTitle title="Ask someone in the job" caption="45-minute calls with working engineers. Free." />
        {MENTORS.map((m, i) => (
          <View key={m.name}>
            <View style={[styles.mentor, { paddingHorizontal: gutter }]}>
              <Avatar name={m.name} />
              <View style={styles.flex}>
                <Txt variant="label">{m.name}</Txt>
                <Txt variant="meta" tone="ink2" numberOfLines={1}>
                  {m.line}
                </Txt>
                <View style={styles.topic}>
                  <Icon name="people" size={16} color={p.ink3} />
                  <Txt variant="caption" tone="ink3" style={styles.flex}>
                    {m.topic}
                  </Txt>
                </View>
              </View>
              <Button label="Book" variant="tonal" size="sm" block={false} onPress={() => undefined} />
            </View>
            {i < MENTORS.length - 1 ? <Hairline inset={gutter + 52} /> : null}
          </View>
        ))}
      </FadeUp>
    </View>
  );

  return (
    <Page>
      {split ? (
        <ScrollView contentContainerStyle={[styles.row, styles.pb]}>
          <View style={{ width: leadWidth }}>{schedule}</View>
          <View style={{ width: paneGap }} />
          <View style={styles.flex}>{picks}</View>
        </ScrollView>
      ) : (
        <ScrollView contentContainerStyle={styles.pb}>
          {schedule}
          {picks}
        </ScrollView>
      )}
    </Page>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, minWidth: 0 },
  row: { flexDirection: "row" },
  pb: { paddingBottom: 40 },
  pt8: { paddingTop: 8 },
  head: { flexDirection: "row", alignItems: "flex-start", gap: 8, paddingTop: 12, paddingBottom: 20 },
  dot: { position: "absolute", top: 10, right: 10, width: 10, height: 10, borderRadius: 5, borderWidth: 2 },
  hero: { borderRadius: radius.r20, padding: 20, gap: 14 },
  heroTop: { flexDirection: "row", alignItems: "center", gap: 6, marginLeft: -4 },
  heroTime: { flexDirection: "row", alignItems: "baseline", gap: 10 },
  heroFoot: { flexDirection: "row", alignItems: "center", gap: 12, flexWrap: "wrap", marginTop: 2 },
  dim: { opacity: 0.82 },
  details: { flexDirection: "row", alignItems: "center", gap: 2, minHeight: 44 },
  gap2: { gap: 2 },
  batch: { gap: 10 },
  batchTop: { flexDirection: "row", alignItems: "flex-end", gap: 12 },
  batchCount: { flexDirection: "row", alignItems: "baseline" },
  mentor: { flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 14 },
  topic: { flexDirection: "row", alignItems: "center", gap: 6, marginTop: 2 },
});
