import { Alert, Platform, ScrollView, StyleSheet, View } from "react-native";
import { formatIndianPhone } from "@fyt/domain";
import { backend } from "../../backend";
import { useRouter } from "expo-router";
import { Avatar, Button, Eyebrow, FadeUp, Hairline, IconButton, LargeTitle, Page, Pill, Progress, RailItem, Row, SectionTitle, SplitView, TextLink, Txt } from "../../components";
import { CourseRow } from "../../features/catalog/CourseRow";
import { appVersion } from "../../config/app-info";
import { appEnv } from "../../config/env";
import { BATCH, COURSES, LEARNER, SESSIONS } from "../../fixtures";

const SAVED = [COURSES[2], COURSES[4], COURSES[5]];
import { useSessionStore } from "../../session/store";
import { useColumn, useLayout, useTwoPane } from "../../theme";

/** S22 Profile: identity, how complete the profile is and why it matters, then hairline-divided groups. */
export default function Profile() {
  const router = useRouter();
  const { gutter } = useLayout();
  const column = useColumn(640);
  const twoPane = useTwoPane();
  const user = useSessionStore((s) => s.userDoc);
  const phone = useSessionStore((s) => s.authUser?.phone);
  const name = user?.name || LEARNER.name;
  const corporate = user?.segment === "corporate";

  const signOut = () => {
    if (Platform.OS === "web") return void backend().signOut();
    Alert.alert("Sign out of FYT?", undefined, [
      { text: "Cancel", style: "cancel" },
      { text: "Sign out", style: "destructive", onPress: () => void backend().signOut() },
    ]);
  };

  const list = (
    <ScrollView contentContainerStyle={[styles.pb, twoPane ? null : column]}>
      <LargeTitle title="Profile" actions={<IconButton name="settings" label="Settings" />} />
      <FadeUp index={0} style={[styles.identity, { paddingHorizontal: gutter }]}>
        <Avatar name={name} size={56} />
        <View style={styles.flex}>
          <Txt variant="h2">{name}</Txt>
          <Txt variant="mono" tone="ink2">
            {phone ? formatIndianPhone(phone) : LEARNER.phone}
          </Txt>
          <View style={styles.mt8}>
            <Pill label={corporate ? "Working professional" : "Final-year student"} tone="neutral" icon={corporate ? "institute" : "education"} />
          </View>
        </View>
        <Button label="Edit" variant="tonal" size="sm" onPress={() => undefined} />
      </FadeUp>

      <FadeUp index={1} style={[styles.complete, { paddingHorizontal: gutter }]}>
        <View style={styles.completeRow}>
          <Txt variant="label">
            Profile <Txt variant="label" mono>60%</Txt> done
          </Txt>
          <TextLink label="Add education" />
        </View>
        <Progress value={6} of={10} />
        <Txt variant="caption" tone="ink3">
          Institutes see this when you book. Your degree and passing year help them place you in the right batch.
        </Txt>
      </FadeUp>

      <FadeUp index={2}>
        <Eyebrow>Learning</Eyebrow>
        <Hairline />
        <Row icon="bookings" label="Bookings" value={String(SESSIONS.length)} mono onPress={() => undefined} />
        <Row icon="bookmark" label="Saved courses" value={String(SAVED.length)} mono onPress={() => undefined} />
        <Row icon="star" label="Interests and skills" sub="Full stack · React, Node.js" onPress={() => undefined} last />
        <Hairline />

        <Eyebrow>About you</Eyebrow>
        <Hairline />
        {corporate ? (
          <>
            <Row icon="institute" label="Current role" value={user?.currentRole ?? "QA engineer"} onPress={() => undefined} />
            <Row icon="clock" label="Experience" value={`${user?.yearsExperience ?? 3} yr`} mono onPress={() => undefined} />
          </>
        ) : (
          <>
            <Row icon="education" label="College" value={user?.institution || LEARNER.college} onPress={() => undefined} />
            <Row icon="education" label="Degree and year" value="Not added" onPress={() => undefined} />
          </>
        )}
        <Row icon="pin" label="Area" value={LEARNER.area} onPress={() => undefined} last />
        <Hairline />

        <Eyebrow>App</Eyebrow>
        <Hairline />
        <Row icon="bell" label="Reminders" value="1 hr and 15 min before" onPress={() => undefined} />
        <Row icon="settings" label="Appearance" value="Match phone" onPress={() => undefined} />
        <Row icon="info" label="Help and support" onPress={() => undefined} />
        <Row icon="external" label="Terms and privacy" onPress={() => undefined} last />
        <Hairline />
      </FadeUp>

      <View style={[styles.signOut, { paddingHorizontal: gutter }]}>
        <Button label="Sign out" variant="ghost" size="md" icon="logout" onPress={signOut} />
      </View>
      <Txt variant="monoSm" tone="ink3" style={styles.center}>
        FYT {appVersion()}
        {appEnv.env !== "prod" ? ` · ${appEnv.env}${appEnv.authBypass ? " · dev bypass" : ""}` : ""}
      </Txt>
      {appEnv.authBypass ? <DevGates /> : null}
    </ScrollView>
  );

  if (!twoPane) return <Page>{list}</Page>;

  // iPhone Duo inner display, landscape: settings left of the fold, the learner's week right of it.
  return (
    <Page>
      <SplitView
        lead={list}
        detail={
          <ScrollView contentContainerStyle={styles.pb}>
            <FadeUp index={1}>
              <SectionTitle title="Your week" caption="Everything you've booked, in order" action="All bookings" onAction={() => router.push("/bookings" as never)} />
              {SESSIONS.slice(0, 3).map((x, i) => (
                <RailItem key={x.id} time={x.time} sub={i === 0 ? "today" : x.dayLabel.slice(0, 6)} first={i === 0} last={i === 2} active={i === 0} onPress={() => router.push(`/bookings/${x.id}` as never)}>
                  <Txt variant="h3">{x.title}</Txt>
                  <Txt variant="meta" tone="ink2">
                    {x.context}
                  </Txt>
                </RailItem>
              ))}
            </FadeUp>
            <FadeUp index={2}>
              <SectionTitle title="Your batch" />
              <View style={[styles.batch, { paddingHorizontal: gutter }]}>
                <Txt variant="h3">{BATCH.course}</Txt>
                <Progress value={BATCH.attended} of={BATCH.of} />
                <Txt variant="caption" tone="ink3">
                  <Txt variant="caption" mono tone="ink2">{BATCH.attended}</Txt> of <Txt variant="caption" mono tone="ink2">{BATCH.of}</Txt> classes attended · week <Txt variant="caption" mono tone="ink2">{BATCH.week}</Txt>, {BATCH.module}
                </Txt>
              </View>
            </FadeUp>
            <FadeUp index={3}>
              <SectionTitle title="Saved courses" caption="Demos are free. Book one before the batch fills." />
              {SAVED.map((c, i) => (
                <CourseRow key={c.id} course={c} last={i === SAVED.length - 1} onPress={() => router.push(`/courses/${c.id}` as never)} />
              ))}
            </FadeUp>
          </ScrollView>
        }
      />
    </Page>
  );
}

/** Bypass-only: preview the maintenance and update gates without touching config/public. */
function DevGates() {
  const b = backend() as ReturnType<typeof backend> & { setConfig?: (patch: object) => void };
  const config = useSessionStore((s) => s.config);
  if (!b.setConfig || !config) return null;
  return (
    <View>
      <Eyebrow>Dev gate preview</Eyebrow>
      <Row
        label="Show maintenance for 10 seconds"
        onPress={() => {
          b.setConfig!({ maintenance: { on: true, message: "Preview of the maintenance gate.", until: Date.now() + 10_000 } });
          setTimeout(() => b.setConfig!({ maintenance: { on: false } }), 10_000);
        }}
      />
      <Row
        label="Show update required for 10 seconds"
        last
        onPress={() => {
          b.setConfig!({ minAppVersion: { android: "999.0.0", ios: "999.0.0" } });
          setTimeout(() => b.setConfig!({ minAppVersion: config.minAppVersion }), 10_000);
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, minWidth: 0 },
  pb: { paddingBottom: 32 },
  identity: { flexDirection: "row", alignItems: "flex-start", gap: 16, paddingTop: 4 },
  mt8: { marginTop: 8 },
  complete: { gap: 8, paddingTop: 24, paddingBottom: 4 },
  completeRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", gap: 8, flexWrap: "wrap" },
  signOut: { paddingTop: 24, alignItems: "flex-start" },
  batch: { gap: 10 },
  center: { textAlign: "center", paddingTop: 16 },
});
