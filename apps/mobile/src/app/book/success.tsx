import * as Haptics from "expo-haptics";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect } from "react";
import { Platform, ScrollView, StyleSheet, View } from "react-native";
import Animated, { useAnimatedStyle, useReducedMotion, useSharedValue, withDelay, withSpring, withTiming } from "react-native-reanimated";
import { Button, FadeUp, Hairline, Icon, IconButton, Kicker, Page, Pill, Row, SplitView, Txt } from "../../components";
import { courseById, inr } from "../../fixtures";
import { dur, ease, radius, spring, useColumn, useLayout, usePalette, useTwoPane } from "../../theme";

/** Tick circle: scales in on a no-wobble spring, then the check lands. Reduce Motion: a short fade. */
function Tick() {
  const p = usePalette();
  const reduced = useReducedMotion();
  const ring = useSharedValue(reduced ? 1 : 0.6);
  const mark = useSharedValue(0);
  useEffect(() => {
    if (Platform.OS !== "web") void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    ring.value = reduced ? 1 : withSpring(1, spring.pop);
    mark.value = withDelay(reduced ? 0 : 80, withTiming(1, { duration: reduced ? 120 : 280, easing: ease.enter }));
  }, [mark, reduced, ring]);
  const ringStyle = useAnimatedStyle(() => ({ opacity: Math.min(1, (ring.value - 0.6) / 0.25), transform: [{ scale: ring.value }] }));
  const markStyle = useAnimatedStyle(() => ({ opacity: mark.value, transform: [{ scale: reduced ? 1 : 0.5 + mark.value * 0.5 }, { rotate: `${reduced ? 0 : (1 - mark.value) * -20}deg` }] }));
  return (
    <Animated.View style={[styles.tick, { backgroundColor: p.accent }, ringStyle]} accessibilityElementsHidden>
      <Animated.View style={markStyle}>
        <Icon name="check" size={28} weight="bold" color={p.accentInk} />
      </Animated.View>
    </Animated.View>
  );
}

/**
 * S18 Booking confirmed. The one choreographed moment in the app (§6.2 M13):
 * tick at 0 ms, headline at 120 ms, the ticket rises at 220 ms, actions at
 * 420 ms. The time is the headline fact, set in mono. On a wide landscape
 * window the message and actions sit left of the fold and the ticket right.
 */
export default function BookingConfirmed() {
  const p = usePalette();
  const router = useRouter();
  const { course: id } = useLocalSearchParams<{ course?: string }>();
  const course = courseById(id);
  const column = useColumn(600);
  const twoPane = useTwoPane();
  const { gutter } = useLayout();
  const pad = { paddingHorizontal: gutter };

  const message = (
    <View style={[styles.head, pad]}>
      <Tick />
      <FadeUp delay={120} rise={12}>
        <Txt variant="display" accessibilityRole="header" accessibilityLiveRegion="polite">
          Demo booked
        </Txt>
      </FadeUp>
      <FadeUp delay={170}>
        <Txt variant="bodyLg" tone="ink2">
          {course.trainer} will take the class on Thursday. We're setting up the Google Meet link now. It lands in Bookings within a minute.
        </Txt>
      </FadeUp>
    </View>
  );

  const ticket = (
    <FadeUp delay={220} rise={16} style={pad}>
      <View style={[styles.ticket, { backgroundColor: p.surface, borderColor: p.line }]}>
        <View style={[styles.ticketTop, { paddingHorizontal: 20 }]}>
          <Kicker tone="accent">Free demo · 60 min · Google Meet</Kicker>
          <View style={styles.when}>
            <Txt variant="monoHero">7:00 pm</Txt>
            <Txt variant="h3" tone="ink2">
              Thu 19 Nov
            </Txt>
          </View>
          <Txt variant="h3">{course.title}</Txt>
          <Txt variant="meta" tone="ink2">
            with {course.trainer}, {course.institute}
          </Txt>
        </View>
        <View style={styles.perf}>
          <View style={[styles.notch, styles.notchL, { backgroundColor: p.paper, borderColor: p.line }]} />
          <View style={[styles.dash, { borderColor: p.lineStrong }]} />
          <View style={[styles.notch, styles.notchR, { backgroundColor: p.paper, borderColor: p.line }]} />
        </View>
        <Row label="Booking ref" value="FYT-7K2M9Q" mono chevron={false} right={<IconButton name="copy" label="Copy booking ref" color={p.ink2} />} />
        <Row label="Meet link" sub="Usually ready in under a minute" chevron={false} right={<Pill label="Setting up" tone="info" icon="timer" />} />
        <Row label="Demo fee" sub={`If you join, the course is ${inr(course.fee)}, paid to the institute.`} value="Free" chevron={false} last />
      </View>
      <View style={styles.tip}>
        <Icon name="bell" size={20} color={p.ink2} />
        <Txt variant="meta" tone="ink2" style={styles.flex}>
          We'll remind you <Txt variant="meta" mono tone="ink">1 hr</Txt> and <Txt variant="meta" mono tone="ink">15 min</Txt> before, by notification and SMS.
        </Txt>
      </View>
    </FadeUp>
  );

  const actions = (
    <FadeUp delay={420} style={[styles.footer, pad, !twoPane && { borderTopColor: p.line, borderTopWidth: StyleSheet.hairlineWidth }]}>
      <Button label="See booking" onPress={() => router.replace("/bookings/b2" as never)} />
      <Button label="Back to home" variant="ghost" size="md" block onPress={() => router.replace("/home" as never)} />
    </FadeUp>
  );

  if (twoPane) {
    return (
      <Page bottom>
        <SplitView
          lead={
            <View style={styles.leadPane}>
              <ScrollView contentContainerStyle={styles.pb}>{message}</ScrollView>
              {actions}
            </View>
          }
          detail={<ScrollView contentContainerStyle={[styles.pb, styles.pt40]}>{ticket}</ScrollView>}
        />
      </Page>
    );
  }

  return (
    <Page bottom>
      <View style={[styles.flex, column]}>
        <ScrollView contentContainerStyle={styles.pb}>
          {message}
          {ticket}
        </ScrollView>
        {actions}
      </View>
    </Page>
  );
}

const NOTCH = 14;
const styles = StyleSheet.create({
  flex: { flex: 1 },
  pb: { paddingBottom: 24 },
  pt40: { paddingTop: 40 },
  leadPane: { flex: 1 },
  head: { gap: 12, paddingTop: 40, paddingBottom: 28 },
  tick: { width: 64, height: 64, borderRadius: 32, alignItems: "center", justifyContent: "center", marginBottom: 12 },
  ticket: { borderRadius: radius.r20, borderWidth: StyleSheet.hairlineWidth, overflow: "hidden" },
  ticketTop: { gap: 6, paddingTop: 20, paddingBottom: 18 },
  when: { flexDirection: "row", alignItems: "baseline", gap: 12, flexWrap: "wrap", paddingVertical: 2 },
  perf: { height: NOTCH * 2, justifyContent: "center" },
  dash: { marginHorizontal: NOTCH + 6, borderTopWidth: 1, borderStyle: "dashed" },
  notch: { position: "absolute", width: NOTCH * 2, height: NOTCH * 2, borderRadius: NOTCH, borderWidth: StyleSheet.hairlineWidth },
  notchL: { left: -NOTCH },
  notchR: { right: -NOTCH },
  tip: { flexDirection: "row", gap: 10, alignItems: "center", paddingTop: 20 },
  footer: { gap: 4, paddingTop: 12, paddingBottom: 12 },
});
