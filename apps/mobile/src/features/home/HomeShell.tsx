import { Feather } from "@expo/vector-icons";
import type { ComponentProps } from "react";
import { StyleSheet, View } from "react-native";
import { Card, EmptyState, Screen, SectionHeader, Txt } from "../../components";
import { useSessionStore } from "../../session/store";
import { radius, usePalette } from "../../theme";

export interface HomeSection {
  title: string;
  caption: string;
  icon: ComponentProps<typeof Feather>["name"];
  empty: string;
}

/** Shared home layout: greeting, segment eyebrow, a focus card and the segment's section order. */
export function HomeShell({ eyebrow, focusTitle, focusBody, focusTags, sections }: { eyebrow: string; focusTitle: string; focusBody: string; focusTags: string[]; sections: HomeSection[] }) {
  const p = usePalette();
  const name = useSessionStore((s) => s.userDoc?.name?.split(" ")[0]);
  return (
    <Screen edges={["top"]}>
      <View style={styles.head}>
        <View style={[styles.eyebrow, { backgroundColor: p.accentSoft }]}>
          <Txt variant="eyebrow" style={{ color: p.onAccentSoft }}>
            {eyebrow}
          </Txt>
        </View>
        <Txt variant="headline" accessibilityRole="header">
          {name ? `Hello, ${name}` : "Hello"}
        </Txt>
      </View>
      <Card style={{ backgroundColor: p.raised }}>
        <Txt variant="cardTitle">{focusTitle}</Txt>
        <Txt variant="meta" tone="ink2">
          {focusBody}
        </Txt>
        {focusTags.length ? (
          <View style={styles.tags}>
            {focusTags.map((t) => (
              <View key={t} style={[styles.tag, { borderColor: p.line, backgroundColor: p.sunken }]}>
                <Txt variant="caption" tone="ink2">
                  {t}
                </Txt>
              </View>
            ))}
          </View>
        ) : null}
      </Card>
      {sections.map((s) => (
        <View key={s.title} style={styles.section}>
          <SectionHeader title={s.title} caption={s.caption} />
          <EmptyState icon={s.icon} title="Nothing here yet" body={s.empty} />
        </View>
      ))}
    </Screen>
  );
}

const styles = StyleSheet.create({
  head: { gap: 8, paddingTop: 8 },
  eyebrow: { alignSelf: "flex-start", paddingHorizontal: 8, paddingVertical: 3, borderRadius: radius.control },
  tags: { flexDirection: "row", flexWrap: "wrap", gap: 6, marginTop: 4 },
  tag: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: radius.control, borderWidth: 1 },
  section: { gap: 8 },
});
