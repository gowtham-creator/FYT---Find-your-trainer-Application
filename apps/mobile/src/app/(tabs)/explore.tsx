import { useRouter } from "expo-router";
import { useState } from "react";
import { Pressable, ScrollView, StyleSheet, View } from "react-native";
import { Chip, Icon, IconButton, LargeTitle, Page, SplitView, TabStrip, Txt } from "../../components";
import { CourseDetail } from "../../features/catalog/CourseDetail";
import { CourseRow } from "../../features/catalog/CourseRow";
import { COURSES } from "../../fixtures";
import { radius, useLayout, usePalette } from "../../theme";

const TABS = ["Courses", "Trainers", "Institutes", "Mentors"] as const;
const QUICK = ["Starts this month", "Weekend", "Evening", "Online", "Classroom", "Under ₹30,000"];

/** S10 Explore. Width ≥ 600: list on the left, the selected course on the right. */
export default function Explore() {
  const p = usePalette();
  const router = useRouter();
  const { gutter, split } = useLayout();
  const [tab, setTab] = useState<(typeof TABS)[number]>("Courses");
  const [on, setOn] = useState<string[]>([]);
  const [selected, setSelected] = useState(COURSES[0].id);

  const list = (
    <ScrollView stickyHeaderIndices={[1]} contentContainerStyle={styles.pb}>
      <LargeTitle title="Explore" sub="Software courses in Hyderabad, with a free demo before you pay" />
      <View style={{ backgroundColor: p.paper }}>
        <View style={[styles.searchRow, { paddingHorizontal: gutter }]}>
          <Pressable accessibilityRole="search" accessibilityLabel="Search courses, skills or areas" style={[styles.search, { backgroundColor: p.sunken }]}>
            <Icon name="search" size={20} color={p.ink3} />
            <Txt variant="body" tone="ink3" numberOfLines={1}>
              Course, skill or area
            </Txt>
          </Pressable>
          <IconButton name="filter" label="Filters" />
        </View>
        <TabStrip tabs={TABS} value={tab} onChange={setTab} />
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={[styles.chips, { paddingHorizontal: gutter }]}>
        {QUICK.map((q) => (
          <Chip key={q} label={q} selected={on.includes(q)} onPress={() => setOn((o) => (o.includes(q) ? o.filter((x) => x !== q) : [...o, q]))} />
        ))}
      </ScrollView>
      <View style={[styles.count, { paddingHorizontal: gutter }]}>
        <Txt variant="caption" tone="ink3">
          <Txt variant="caption" mono tone="ink2">
            {COURSES.length}
          </Txt>{" "}
          courses with open batches
        </Txt>
        <Pressable accessibilityRole="button" accessibilityLabel="Sort by: starting soonest. Change sort" hitSlop={12} style={styles.sort}>
          <Txt variant="caption" tone="ink2">
            Starting soonest
          </Txt>
          <Icon name="chevron-down" size={16} color={p.ink2} />
        </Pressable>
      </View>
      {COURSES.map((c, i) => (
        <CourseRow key={c.id} course={c} selected={split && c.id === selected} last={i === COURSES.length - 1} onPress={() => (split ? setSelected(c.id) : router.push(`/courses/${c.id}` as never))} />
      ))}
    </ScrollView>
  );

  const course = COURSES.find((c) => c.id === selected) ?? COURSES[0];
  return (
    <Page>
      <SplitView lead={list} detail={<CourseDetail key={course.id} course={course} embedded />} />
    </Page>
  );
}

const styles = StyleSheet.create({
  pb: { paddingBottom: 24 },
  searchRow: { flexDirection: "row", alignItems: "center", gap: 4, paddingBottom: 4 },
  search: { flex: 1, flexDirection: "row", alignItems: "center", gap: 8, height: 44, paddingHorizontal: 12, borderRadius: radius.r12 },
  chips: { gap: 8, paddingVertical: 12 },
  count: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingBottom: 4 },
  sort: { flexDirection: "row", alignItems: "center", gap: 4, minHeight: 32 },
});
