import * as Haptics from "expo-haptics";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useState, type ReactNode } from "react";
import { Platform, ScrollView, StyleSheet, View, type StyleProp, type ViewStyle } from "react-native";
import { Avatar, Button, FadeUp, Icon, Kicker, Page, PressScale, Segmented, SplitView, StickyBar, TopBar, Txt } from "../../components";
import { courseById, DAYS, SLOTS, TAKEN } from "../../fixtures";
import { radius, useColumn, useLayout, usePalette, useTwoPane } from "../../theme";

/** The date strip scrolls sideways on a phone and wraps into a grid in a Duo pane. */
function DayWrap({ twoPane, style, children }: { twoPane: boolean; style: StyleProp<ViewStyle>; children: ReactNode }) {
  if (twoPane) return <View style={style}>{children}</View>;
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={style}>
      {children}
    </ScrollView>
  );
}

const tick = () => {
  if (Platform.OS !== "web") void Haptics.selectionAsync();
};

/**
 * S16 Pick a time (free demo, slot mode). Who and how first, then the day,
 * then the slot; the choice and the action live in the sticky bar. On a wide
 * landscape window the day sits left of the fold and the slots right, with
 * the action under the slots.
 */
export default function PickTime() {
  const p = usePalette();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const course = courseById(id);
  const column = useColumn(680);
  const twoPane = useTwoPane();
  const { gutter, width, leadWidth } = useLayout();
  const [mode, setMode] = useState<"Online" | "Classroom">("Online");
  const [day, setDay] = useState(DAYS.find((d) => d.open && d.date === 19)?.key ?? DAYS.find((d) => d.open)!.key);
  const [slot, setSlot] = useState<string | null>("7:00 pm");
  const paneWidth = twoPane ? width - leadWidth : Math.min(width, 680);
  const cols = Math.min(4, Math.max(3, Math.floor((paneWidth - gutter * 2) / 96)));
  const chosen = DAYS[day];
  const pad = { paddingHorizontal: gutter };

  const who = (
    <FadeUp index={0} style={[styles.summary, pad]}>
      <Kicker>Free demo · 60 min</Kicker>
      <Txt variant="h2" accessibilityRole="header">
        {course.title}
      </Txt>
      <View style={styles.trainer}>
        <Avatar name={course.trainer} />
        <View style={styles.flex}>
          <Txt variant="label">{course.trainer}</Txt>
          <Txt variant="meta" tone="ink2" numberOfLines={1}>
            {course.institute}, {course.area}
          </Txt>
        </View>
      </View>
    </FadeUp>
  );

  const how = (
    <FadeUp index={1} style={[styles.block, pad]}>
      <Segmented
        options={["Online", "Classroom"] as const}
        value={mode}
        onChange={(m) => {
          tick();
          setMode(m);
        }}
      />
      <View style={styles.note}>
        <Icon name={mode === "Online" ? "video" : "pin"} size={16} color={p.ink3} />
        <Txt variant="meta" tone="ink2" style={styles.flex}>
          {mode === "Online" ? "On Google Meet. The link shows up in Bookings 10 minutes before." : `At ${course.institute}, ${course.area}. Bring a laptop if you have one.`}
        </Txt>
      </View>
    </FadeUp>
  );

  const days = (
    <FadeUp index={2}>
      <Kicker style={{ ...pad, paddingTop: 24 }}>November</Kicker>
      <DayWrap twoPane={twoPane} style={[styles.days, pad, twoPane && styles.dayGrid]}>
        {DAYS.map((d) => {
          const on = d.key === day;
          return (
            <PressScale
              key={d.key}
              disabled={!d.open}
              onPress={() => {
                tick();
                setDay(d.key);
              }}
              accessibilityRole="button"
              accessibilityState={{ selected: on, disabled: !d.open }}
              accessibilityLabel={`${d.label}${d.open ? "" : ", no slots"}`}
              style={[styles.day, { borderColor: on ? p.accent : p.line, backgroundColor: on ? p.accent : d.open ? p.surface : "transparent" }]}
            >
              <Txt variant="caption" style={{ color: on ? p.accentInk : d.open ? p.ink2 : p.ink3 }}>
                {d.dow}
              </Txt>
              <Txt variant="monoLg" style={{ color: on ? p.accentInk : d.open ? p.ink : p.ink3, textDecorationLine: d.open ? "none" : "line-through" }}>
                {d.date}
              </Txt>
            </PressScale>
          );
        })}
      </DayWrap>
    </FadeUp>
  );

  const slots = (
    <FadeUp index={3}>
      {twoPane ? (
        <View style={[styles.slotHead, pad, { paddingTop: 72 }]}>
          <Txt variant="h2">{chosen.label.replace(",", "")}</Txt>
          <Txt variant="meta" tone="ink2">
            Times are IST. Pick one, you can change it later.
          </Txt>
        </View>
      ) : null}
      {Object.entries(SLOTS).map(([part, times]) => (
        <View key={part} style={[styles.part, pad]}>
          <Txt variant="micro" tone="ink3">
            {part}
          </Txt>
          <View style={styles.grid}>
            {times.map((t) => {
              const taken = TAKEN.has(t);
              const on = slot === t;
              return (
                <PressScale
                  key={t}
                  disabled={taken}
                  onPress={() => {
                    tick();
                    setSlot(t);
                  }}
                  accessibilityRole="radio"
                  accessibilityState={{ selected: on, disabled: taken }}
                  accessibilityLabel={`${t}${taken ? ", full" : ""}`}
                  style={[
                    styles.slot,
                    { width: `${100 / cols - 2.6}%`, borderColor: on ? p.accent : taken ? p.line : p.lineStrong, backgroundColor: on ? p.accentSoft : taken ? "transparent" : p.surface, borderWidth: on ? 2 : 1 },
                  ]}
                >
                  {on ? <Icon name="check" size={16} weight="bold" color={p.onAccentSoft} /> : null}
                  <Txt variant="mono" style={{ color: on ? p.onAccentSoft : taken ? p.ink3 : p.ink, textDecorationLine: taken ? "line-through" : "none" }}>
                    {t}
                  </Txt>
                </PressScale>
              );
            })}
          </View>
        </View>
      ))}
      <View style={[styles.note, pad]}>
        <Icon name="info" size={16} color={p.ink3} />
        <Txt variant="caption" tone="ink3" style={styles.flex}>
          Crossed-out times are full. Rescheduling is free up to 2 hours before.
        </Txt>
      </View>
    </FadeUp>
  );

  const bar = (
    <StickyBar
      left={
        slot ? (
          <View>
            <Txt variant="caption" tone="ink3">
              Your demo
            </Txt>
            <Txt variant="label">
              {chosen.label.replace(",", "")}, <Txt variant="label" mono>{slot}</Txt>
            </Txt>
          </View>
        ) : (
          <Txt variant="meta" tone="ink3">
            Pick a day and a time
          </Txt>
        )
      }
      right={<Button label="Confirm demo" size="md" block={false} disabled={!slot} onPress={() => router.push(`/book/success?course=${course.id}` as never)} />}
    />
  );

  if (twoPane) {
    return (
      <Page>
        <SplitView
          lead={
            <ScrollView contentContainerStyle={styles.pb}>
              <TopBar title="Book a free demo" />
              {who}
              {how}
              {days}
            </ScrollView>
          }
          detail={
            <View style={styles.flex}>
              <ScrollView contentContainerStyle={styles.pb}>{slots}</ScrollView>
              {bar}
            </View>
          }
        />
      </Page>
    );
  }

  return (
    <Page>
      <View style={[styles.flex, column]}>
        <TopBar title="Book a free demo" />
        <ScrollView contentContainerStyle={styles.pb}>
          {who}
          {how}
          {days}
          {slots}
        </ScrollView>
      </View>
      {bar}
    </Page>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  pb: { paddingBottom: 32 },
  summary: { gap: 8, paddingTop: 4, paddingBottom: 20 },
  trainer: { flexDirection: "row", alignItems: "center", gap: 12, paddingTop: 6 },
  block: { gap: 10 },
  days: { gap: 8, paddingTop: 10, paddingBottom: 20 },
  dayGrid: { flexDirection: "row", flexWrap: "wrap" },
  day: { width: 56, height: 68, borderRadius: radius.r12, borderWidth: 1, alignItems: "center", justifyContent: "center", gap: 2 },
  slotHead: { gap: 2, paddingTop: 16, paddingBottom: 16 },
  part: { gap: 10, paddingBottom: 20 },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  slot: { height: 48, borderRadius: radius.r12, alignItems: "center", justifyContent: "center", flexDirection: "row", gap: 6 },
  note: { flexDirection: "row", gap: 8, alignItems: "center" },
});
