import { StyleSheet, View } from "react-native";
import { CodeTile, Hairline, PressScale, Txt } from "../../components";
import { inr, type Course } from "../../fixtures";
import { useLayout, usePalette } from "../../theme";

/**
 * One course in a hairline list: stack-code tile as the anchor, then
 * category and mode, title, institute, and the mono facts with the fee right.
 */
export function CourseRow({ course, onPress, selected, last }: { course: Course; onPress: () => void; selected?: boolean; last?: boolean }) {
  const p = usePalette();
  const { gutter } = useLayout();
  return (
    <View style={{ backgroundColor: selected ? p.accentSoft : "transparent" }}>
      <PressScale
        onPress={onPress}
        scaleTo={0.985}
        accessibilityRole="button"
        accessibilityState={{ selected }}
        accessibilityLabel={`${course.title}, ${course.institute}, ${course.area}. ${course.mode}. ${course.weeks} weeks, next batch ${course.nextBatch}. Fee ${inr(course.fee)}.`}
        style={[styles.row, { paddingHorizontal: gutter }]}
      >
        <CodeTile code={course.code} />
        <View style={styles.body}>
          <Txt variant="micro" tone="ink3" numberOfLines={1}>
            {course.category} · {course.mode === "Online + Class" ? "Online or classroom" : course.mode}
          </Txt>
          <Txt variant="h3" numberOfLines={2}>
            {course.title}
          </Txt>
          <Txt variant="meta" tone="ink2" numberOfLines={1}>
            {course.institute}, {course.area}
          </Txt>
          <View style={styles.facts}>
            <Txt variant="monoSm" tone="ink2" style={styles.flex}>
              {course.weeks} wk · starts {course.nextBatch}
            </Txt>
            <Txt variant="mono">{inr(course.fee)}</Txt>
          </View>
        </View>
      </PressScale>
      {last ? null : <Hairline inset={gutter + 64} />}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", gap: 16, paddingVertical: 16, alignItems: "flex-start" },
  body: { flex: 1, minWidth: 0, gap: 3 },
  facts: { flexDirection: "row", alignItems: "baseline", gap: 4, columnGap: 12, marginTop: 6, flexWrap: "wrap" },
  flex: { flexGrow: 1, flexShrink: 0 },
});
