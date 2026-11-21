import { useRouter } from "expo-router";
import { ScrollView, StyleSheet, View } from "react-native";
import { Avatar, Button, FactStrip, FadeUp, Hairline, Icon, IconButton, Kicker, MetaLine, RailItem, Row, SectionTitle, SplitView, StickyBar, TopBar, Txt } from "../../components";
import { inr, type Course } from "../../fixtures";
import { useColumn, useLayout, usePalette, useTwoPane } from "../../theme";

/**
 * S13 Course detail. Title block, the place/mode/next-batch lines, a mono
 * fact strip, then reading sections and a sticky fee + action bar.
 * `embedded` renders it as the detail pane of Explore. Pushed on a wide
 * landscape window it becomes two panes: the pitch on the left, the
 * decision (batches, curriculum, fee and the button) on the right, so price
 * and action stay together in one half.
 */
export function CourseDetail({ course, embedded }: { course: Course; embedded?: boolean }) {
  const p = usePalette();
  const router = useRouter();
  const { gutter } = useLayout();
  const column = useColumn(720);
  const twoPane = useTwoPane() && !embedded;
  const pad = { paddingHorizontal: gutter };
  const mode = course.mode === "Online + Class" ? "Online or in the classroom" : course.mode === "Online" ? "Online, on Google Meet" : "In the classroom";

  const head = (
    <FadeUp index={0} style={[pad, styles.titleBlock]}>
      <Kicker>{`${course.category} · course`}</Kicker>
      <Txt variant="h1" accessibilityRole="header">
        {course.title}
      </Txt>
      <View style={styles.meta}>
        <MetaLine icon="institute">
          <Txt variant="meta" tone="accent">
            {course.institute}
          </Txt>
          , {course.area}
        </MetaLine>
        <MetaLine icon="video">{mode}</MetaLine>
        <MetaLine icon="calendar">
          Next batch <Txt variant="meta" mono tone="ink">{course.nextBatch}</Txt> · {course.batchDays}, <Txt variant="meta" mono tone="ink2">{course.batchTime}</Txt>
        </MetaLine>
      </View>
      <FactStrip
        style={styles.strip}
        facts={[
          { value: `${course.weeks} wk`, label: "Duration" },
          { value: String(course.sessions), label: "Live classes" },
          { value: course.rating.toFixed(1), label: "Rating", icon: "star" },
        ]}
      />
    </FadeUp>
  );

  const pitch = (
    <FadeUp index={1}>
      <SectionTitle title="About the course" />
      <Txt variant="bodyLg" style={[pad, styles.reading]}>
        {course.summary}
      </Txt>
      <SectionTitle title="By the end you can" />
      <View style={[pad, styles.outcomes]}>
        {course.outcomes.map((o) => (
          <View key={o} style={styles.outcome}>
            <Icon name="check-circle" size={20} weight="fill" color={p.accent} />
            <Txt variant="body" style={styles.flex}>
              {o}
            </Txt>
          </View>
        ))}
      </View>
      <SectionTitle title="Who teaches it" />
      <View style={[pad, styles.trainer]}>
        <Avatar name={course.trainer} size={56} />
        <View style={styles.flex}>
          <Txt variant="h3">{course.trainer}</Txt>
          <Txt variant="meta" tone="ink2">
            {course.trainerLine}
          </Txt>
        </View>
      </View>
    </FadeUp>
  );

  const plan = (
    <FadeUp index={2}>
      <SectionTitle title="Batches" caption="Reserving a seat is free. The institute confirms within one working day." />
      <Hairline />
      <Row label={`Starts ${course.nextBatch}`} sub={`${course.batchDays}, ${course.batchTime} · 12 of 30 seats left`} chevron={false} right={<Button label="Reserve" variant="tonal" size="sm" onPress={() => undefined} />} />
      <Row label="Starts 5 Dec" sub="Sat Sun, 10:00 am · 4 of 25 seats left" chevron={false} last right={<Button label="Reserve" variant="tonal" size="sm" onPress={() => undefined} />} />
      <Hairline />

      <SectionTitle title="Week by week" caption={`${course.modules.length} modules over ${course.weeks} weeks`} />
      <View style={styles.railWrap}>
        {course.modules.map((m, i) => (
          <RailItem key={m.weeks} time={m.weeks} first={i === 0} last={i === course.modules.length - 1}>
            <Txt variant="h3">{m.title}</Txt>
            <Txt variant="meta" tone="ink2">
              {m.detail}
            </Txt>
          </RailItem>
        ))}
      </View>

      <SectionTitle title="Fees and language" />
      <Hairline />
      <Row label="Demo class" value="Free, 60 min" chevron={false} />
      <Row label="Course fee" sub="You pay the institute directly if you join. FYT never takes a fee." value={inr(course.fee)} mono chevron={false} />
      <Row label="Taught in" value="English, with Telugu where it helps" chevron={false} last />
      <Hairline />
    </FadeUp>
  );

  const bar = (
    <StickyBar
      left={
        <>
          <Txt variant="monoLg">{inr(course.fee)}</Txt>
          <Txt variant="caption" tone="ink3">
            Demo is free
          </Txt>
        </>
      }
      right={<Button label="Book a free demo" size="md" block={false} onPress={() => router.push(`/book/${course.id}` as never)} />}
    />
  );

  const top = embedded ? null : (
    <TopBar
      actions={
        <>
          <IconButton name="share" label="Share course" />
          <IconButton name="bookmark" label="Save course" />
        </>
      }
    />
  );

  if (twoPane) {
    return (
      <View style={styles.fill}>
        {top}
        <SplitView
          lead={
            <ScrollView contentContainerStyle={styles.scroll}>
              {head}
              {pitch}
            </ScrollView>
          }
          detail={
            <View style={styles.fill}>
              <ScrollView contentContainerStyle={styles.scroll}>{plan}</ScrollView>
              {bar}
            </View>
          }
        />
      </View>
    );
  }

  return (
    <View style={styles.fill}>
      {top}
      <ScrollView contentContainerStyle={[styles.scroll, embedded ? null : column]}>
        {head}
        {pitch}
        {plan}
      </ScrollView>
      {bar}
    </View>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  flex: { flex: 1 },
  scroll: { paddingBottom: 40 },
  titleBlock: { gap: 10, paddingTop: 8 },
  meta: { gap: 6, paddingTop: 2 },
  strip: { marginTop: 14 },
  reading: { maxWidth: 600 },
  outcomes: { gap: 12 },
  outcome: { flexDirection: "row", gap: 12, alignItems: "flex-start" },
  railWrap: { marginTop: 4 },
  trainer: { flexDirection: "row", gap: 14, alignItems: "center" },
});
