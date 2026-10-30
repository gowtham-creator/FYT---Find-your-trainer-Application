import { Feather } from "@expo/vector-icons";
import { useMutation } from "@tanstack/react-query";
import type { ComponentProps } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import type { Segment } from "@fyt/domain";
import { backend, BackendError } from "../../backend";
import { Screen, Txt } from "../../components";
import { messageFor } from "../../lib/messages";
import { useSessionStore } from "../../session/store";
import { radius, usePalette } from "../../theme";

const OPTIONS: { segment: Segment; title: string; body: string; icon: ComponentProps<typeof Feather>["name"] }[] = [
  { segment: "student", title: "Student", body: "Courses, institutes and trainers to start your career.", icon: "book-open" },
  { segment: "corporate", title: "Working professional", body: "Mentors, upskilling courses and consultants for your next role.", icon: "briefcase" },
];

/** Onboarding step 1. The router moves to the details step once the user doc updates. */
export default function SegmentPicker() {
  const p = usePalette();
  const current = useSessionStore((s) => s.userDoc?.segment ?? null);
  const save = useMutation({ mutationFn: (segment: Segment) => backend().saveProfile({ step: "segment", segment }) });

  return (
    <Screen>
      <View style={styles.head}>
        <Txt variant="eyebrow" tone="ink3">
          Step 1 of 2
        </Txt>
        <Txt variant="headline" accessibilityRole="header">
          Which describes you?
        </Txt>
        <Txt variant="body" tone="ink2">
          {"We'll tailor what you see first. You can change this later in your profile."}
        </Txt>
      </View>
      {OPTIONS.map((o) => {
        const selected = save.variables === o.segment ? true : !save.isPending && current === o.segment;
        return (
          <Pressable
            key={o.segment}
            accessibilityRole="radio"
            accessibilityState={{ selected, busy: save.isPending && save.variables === o.segment }}
            disabled={save.isPending}
            onPress={() => save.mutate(o.segment)}
            style={({ pressed }) => [
              styles.card,
              { backgroundColor: selected ? p.accentSoft : p.surface, borderColor: selected ? p.accent : p.line, opacity: pressed ? 0.9 : 1 },
            ]}
          >
            <View style={[styles.icon, { backgroundColor: p.sunken, borderColor: p.line }]}>
              <Feather name={o.icon} size={20} color={p.ink} />
            </View>
            <View style={styles.text}>
              <Txt variant="cardTitle">{o.title}</Txt>
              <Txt variant="meta" tone="ink2">
                {o.body}
              </Txt>
            </View>
            <Feather name={selected ? "check-circle" : "chevron-right"} size={20} color={selected ? p.onAccentSoft : p.ink3} />
          </Pressable>
        );
      })}
      {save.error ? (
        <Txt variant="caption" tone="bad">
          {messageFor(save.error instanceof BackendError ? save.error.code : undefined)}
        </Txt>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  head: { gap: 8, paddingTop: 24, paddingBottom: 8 },
  card: { flexDirection: "row", alignItems: "center", gap: 12, padding: 16, borderRadius: radius.card, borderWidth: 1, minHeight: 88 },
  icon: { width: 44, height: 44, borderRadius: radius.control, borderWidth: 1, alignItems: "center", justifyContent: "center" },
  text: { flex: 1, gap: 2 },
});
