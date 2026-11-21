/**
 * Flat building blocks for the redesigned screens: hairline lists, large
 * left-aligned titles, the time rail and the two-pane split. No cards around
 * everything; structure comes from type, spacing and 1 px rules.
 */
import { useRouter } from "expo-router";
import type { ReactNode } from "react";
import { useEffect } from "react";
import { Pressable, ScrollView, StyleSheet, View, type ViewStyle } from "react-native";
import Animated, { Easing, useAnimatedStyle, useReducedMotion, useSharedValue, withRepeat, withTiming } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { radius, useLayout, usePalette } from "../theme";
import { PressScale } from "./Motion";
import { Icon, type IconName } from "./Icon";
import { Txt } from "./Txt";

export function Hairline({ inset = 0, style }: { inset?: number; style?: ViewStyle }) {
  const p = usePalette();
  return <View style={[{ height: StyleSheet.hairlineWidth, backgroundColor: p.lineStrong, marginLeft: inset }, style]} />;
}

/** Tab-root header: big title left, optional actions right. */
export function LargeTitle({ title, sub, actions }: { title: string; sub?: string; actions?: ReactNode }) {
  const { gutter } = useLayout();
  return (
    <View style={[styles.largeTitle, { paddingHorizontal: gutter }]}>
      <View style={styles.flex}>
        <Txt variant="display" accessibilityRole="header">
          {title}
        </Txt>
        {sub ? (
          <Txt variant="meta" tone="ink2" style={styles.mt4}>
            {sub}
          </Txt>
        ) : null}
      </View>
      {actions ? <View style={styles.actions}>{actions}</View> : null}
    </View>
  );
}

export function IconButton({ name, label, onPress, color }: { name: IconName; label: string; onPress?: () => void; color?: string }) {
  return (
    <Pressable accessibilityRole="button" accessibilityLabel={label} onPress={onPress} style={({ pressed }) => [styles.iconBtn, { opacity: pressed ? 0.6 : 1 }]}>
      <Icon name={name} size={24} color={color} />
    </Pressable>
  );
}

/** 56 pt nav bar: back chevron left, optional title and actions. */
export function TopBar({ title, actions, onBack, back = true }: { title?: string; actions?: ReactNode; onBack?: () => void; back?: boolean }) {
  const router = useRouter();
  const { gutter } = useLayout();
  return (
    <View style={[styles.topBar, { paddingHorizontal: gutter - 12 }]}>
      {back ? <IconButton name="back" label="Back" onPress={onBack ?? (() => (router.canGoBack() ? router.back() : router.replace("/home" as never)))} /> : <View style={styles.iconBtn} />}
      <Txt variant="h3" numberOfLines={1} style={styles.topTitle}>
        {title ?? ""}
      </Txt>
      <View style={styles.actions}>{actions}</View>
    </View>
  );
}

/** Section heading: h2 left, optional text action right. Hairline-free; spacing does the work. */
export function SectionTitle({ title, caption, action, onAction }: { title: string; caption?: string; action?: string; onAction?: () => void }) {
  const { gutter } = useLayout();
  return (
    <View style={[styles.section, { paddingHorizontal: gutter }]}>
      <View style={styles.flex}>
        <Txt variant="h2" accessibilityRole="header">
          {title}
        </Txt>
        {caption ? (
          <Txt variant="meta" tone="ink3">
            {caption}
          </Txt>
        ) : null}
      </View>
      {action ? <TextLink label={action} onPress={onAction} /> : null}
    </View>
  );
}

/** Small uppercase group header used above day groups and lists. */
export function Eyebrow({ children, style }: { children: string; style?: ViewStyle }) {
  const { gutter } = useLayout();
  return (
    <View style={[{ paddingHorizontal: gutter, paddingTop: 24, paddingBottom: 8 }, style]}>
      <Txt variant="micro" tone="ink3">
        {children}
      </Txt>
    </View>
  );
}

export function TextLink({ label, onPress, tone = "accent" }: { label: string; onPress?: () => void; tone?: "accent" | "ink2" }) {
  return (
    <Pressable accessibilityRole="link" onPress={onPress} hitSlop={12}>
      <Txt variant="label" tone={tone}>
        {label}
      </Txt>
    </Pressable>
  );
}

/** One list row: label (and optional sub) left, value right, hairline under. */
export function Row({ label, sub, value, mono, chevron = true, onPress, last, icon, right }: { label: string; sub?: string; value?: string; mono?: boolean; chevron?: boolean; onPress?: () => void; last?: boolean; icon?: IconName; right?: ReactNode }) {
  const p = usePalette();
  const { gutter } = useLayout();
  return (
    <Pressable onPress={onPress} disabled={!onPress} accessibilityRole={onPress ? "button" : undefined} style={({ pressed }) => [{ backgroundColor: pressed ? p.sunken : "transparent" }]}>
      <View style={[styles.row, { paddingHorizontal: gutter }]}>
        {icon ? <Icon name={icon} size={20} color={p.ink2} /> : null}
        <View style={styles.flex}>
          <Txt variant="body">{label}</Txt>
          {sub ? (
            <Txt variant="meta" tone="ink3">
              {sub}
            </Txt>
          ) : null}
        </View>
        {value ? (
          <Txt variant={mono ? "mono" : "meta"} tone="ink2" numberOfLines={1} style={styles.rowValue}>
            {value}
          </Txt>
        ) : null}
        {right}
        {onPress && chevron ? <Icon name="chevron" size={16} color={p.ink3} /> : null}
      </View>
      {last ? null : <Hairline inset={gutter} />}
    </Pressable>
  );
}

type PillTone = "ok" | "info" | "warn" | "bad" | "neutral" | "teal";
/** Status pill: always icon + label, never colour alone. */
export function Pill({ label, tone, icon }: { label: string; tone: PillTone; icon?: IconName }) {
  const p = usePalette();
  const map = {
    ok: [p.okSoft, p.onOkSoft],
    info: [p.infoSoft, p.onInfoSoft],
    warn: [p.warnSoft, p.onWarnSoft],
    bad: [p.badSoft, p.onBadSoft],
    neutral: [p.sunken, p.ink2],
    teal: [p.tealSoft, p.onTealSoft],
  } as const;
  const [bg, fg] = map[tone];
  return (
    <View style={[styles.pill, { backgroundColor: bg }]}>
      {icon ? <Icon name={icon} size={16} weight="fill" color={fg} /> : null}
      <Txt variant="caption" style={{ color: fg }}>
        {label}
      </Txt>
    </View>
  );
}

/** Attendance bar. Teal is reserved for progress. */
export function Progress({ value, of }: { value: number; of: number }) {
  const p = usePalette();
  return (
    <View style={[styles.progress, { backgroundColor: p.sunken }]} accessibilityRole="progressbar" accessibilityValue={{ min: 0, max: of, now: value }}>
      <View style={{ width: `${Math.round((value / of) * 100)}%`, backgroundColor: p.teal, borderRadius: 2 }} />
    </View>
  );
}

export function Avatar({ name, size = 40 }: { name: string; size?: 40 | 56 }) {
  const p = usePalette();
  const initials = name
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("");
  return (
    <View style={{ width: size, height: size, borderRadius: size / 2, backgroundColor: p.accentSoft, alignItems: "center", justifyContent: "center" }} accessibilityElementsHidden>
      <Txt variant={size > 40 ? "h3" : "label"} tone="onAccentSoft">
        {initials}
      </Txt>
    </View>
  );
}

/**
 * The time rail: mono time (and sub) in a fixed left column, a 2 px rail with
 * a node, content on the right. Consecutive items join into one line.
 */
export function RailItem({ time, sub, children, first, last, active, onPress }: { time: string; sub?: string; children: ReactNode; first?: boolean; last?: boolean; active?: boolean; onPress?: () => void }) {
  const p = usePalette();
  const { gutter } = useLayout();
  return (
    <PressScale onPress={onPress} disabled={!onPress} scaleTo={0.985} accessibilityRole={onPress ? "button" : undefined} style={[styles.rail, { paddingHorizontal: gutter }]}>
      <View style={styles.railTime}>
        <Txt variant="monoLg" numberOfLines={1} maxFontSizeMultiplier={1.3} tone={active ? "accent" : "ink"}>
          {time}
        </Txt>
        {sub ? (
          <Txt variant="monoSm" tone="ink3">
            {sub}
          </Txt>
        ) : null}
      </View>
      <View style={styles.railTrack}>
        <View style={[styles.railLine, { backgroundColor: first ? "transparent" : p.lineStrong, height: 10 }]} />
        <View style={[styles.railNode, { borderColor: active ? p.accent : p.lineField, backgroundColor: active ? p.accent : p.paper }]} />
        <View style={[styles.railLine, styles.flex, { backgroundColor: last ? "transparent" : p.lineStrong }]} />
      </View>
      <View style={[styles.flex, styles.railBody]}>{children}</View>
    </PressScale>
  );
}

/** Bottom action bar: summary left, action right, safe-area aware. */
export function StickyBar({ left, right }: { left: ReactNode; right: ReactNode }) {
  const p = usePalette();
  const insets = useSafeAreaInsets();
  const { gutter } = useLayout();
  return (
    <View style={[styles.sticky, { backgroundColor: p.surface, borderTopColor: p.line, paddingBottom: Math.max(insets.bottom, 12), paddingLeft: gutter + insets.left, paddingRight: gutter + insets.right }]}>
      <View style={styles.flex}>{left}</View>
      <View>{right}</View>
    </View>
  );
}

/** Text tabs with an azure underline on the active one. */
export function TabStrip<T extends string>({ tabs, value, onChange }: { tabs: readonly T[]; value: T; onChange: (t: T) => void }) {
  const p = usePalette();
  const { gutter } = useLayout();
  return (
    <View style={[styles.tabStrip, { borderBottomColor: p.line }]}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: gutter, gap: 24 }}>
        {tabs.map((t) => {
          const on = t === value;
          return (
            <Pressable key={t} onPress={() => onChange(t)} accessibilityRole="tab" accessibilityState={{ selected: on }} style={[styles.tab, { borderBottomColor: on ? p.accent : "transparent" }]}>
              <Txt variant="label" tone={on ? "ink" : "ink3"}>
                {t}
              </Txt>
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
}

/** Two-option segmented control on a sunken track. */
export function Segmented<T extends string>({ options, value, onChange }: { options: readonly T[]; value: T; onChange: (t: T) => void }) {
  const p = usePalette();
  return (
    <View style={[styles.segTrack, { backgroundColor: p.sunken }]} accessibilityRole="tablist">
      {options.map((o) => {
        const on = o === value;
        return (
          <Pressable key={o} onPress={() => onChange(o)} accessibilityRole="tab" accessibilityState={{ selected: on }} style={[styles.seg, on && { backgroundColor: p.surface, borderColor: p.line, borderWidth: 1 }]}>
            <Txt variant="label" tone={on ? "ink" : "ink2"}>
              {o}
            </Txt>
          </Pressable>
        );
      })}
    </View>
  );
}

/**
 * List/detail split for windows ≥ 600 pt. In landscape the panes meet either
 * side of the centre fold with a clear gap; in portrait a hairline divides them.
 */
export function SplitView({ lead, detail }: { lead: ReactNode; detail: ReactNode }) {
  const p = usePalette();
  const { split, leadWidth, paneGap } = useLayout();
  if (!split) return <>{lead}</>;
  return (
    <View style={styles.splitRow}>
      <View style={{ width: leadWidth }}>{lead}</View>
      <View style={{ width: paneGap, backgroundColor: paneGap > 1 ? p.sunken : p.lineStrong }} />
      <View style={[styles.flex, { backgroundColor: p.paper }]}>{detail}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, minWidth: 0 },
  mt4: { marginTop: 4 },
  largeTitle: { flexDirection: "row", alignItems: "flex-start", paddingTop: 12, paddingBottom: 16, gap: 12 },
  actions: { flexDirection: "row", alignItems: "center" },
  iconBtn: { width: 44, height: 44, alignItems: "center", justifyContent: "center" },
  topBar: { height: 56, flexDirection: "row", alignItems: "center" },
  topTitle: { flex: 1, textAlign: "center" },
  section: { flexDirection: "row", alignItems: "flex-end", gap: 12, paddingTop: 32, paddingBottom: 8 },
  row: { flexDirection: "row", alignItems: "center", gap: 12, minHeight: 56, paddingVertical: 12 },
  rowValue: { maxWidth: "45%", textAlign: "right" },
  pill: { flexDirection: "row", alignItems: "center", gap: 4, alignSelf: "flex-start", paddingHorizontal: 8, paddingVertical: 3, borderRadius: radius.pill },
  progress: { height: 4, borderRadius: 2, overflow: "hidden", flexDirection: "row" },
  rail: { flexDirection: "row", alignItems: "stretch" },
  railTime: { width: 92, paddingTop: 14 },
  railTrack: { width: 14, alignItems: "center", marginRight: 12 },
  railLine: { width: 2 },
  railNode: { width: 10, height: 10, borderRadius: 5, borderWidth: 2, marginVertical: 4 },
  railBody: { paddingTop: 14, paddingBottom: 20, gap: 4 },
  sticky: { flexDirection: "row", alignItems: "center", gap: 16, paddingTop: 12, borderTopWidth: StyleSheet.hairlineWidth },
  tabStrip: { borderBottomWidth: StyleSheet.hairlineWidth },
  tab: { height: 44, justifyContent: "center", borderBottomWidth: 2 },
  segTrack: { flexDirection: "row", padding: 3, borderRadius: radius.r12, gap: 3 },
  seg: { flex: 1, minHeight: 38, alignItems: "center", justifyContent: "center", borderRadius: 10, borderColor: "transparent", borderWidth: 1 },
  splitRow: { flex: 1, flexDirection: "row" },
  tile: { borderRadius: radius.r12, alignItems: "center", justifyContent: "center" },
  facts: { flexDirection: "row", borderTopWidth: StyleSheet.hairlineWidth, borderBottomWidth: StyleSheet.hairlineWidth },
  fact: { flex: 1, paddingVertical: 14, paddingHorizontal: 12, gap: 2 },
  factValue: { flexDirection: "row", alignItems: "center", gap: 4 },
  metaLine: { flexDirection: "row", alignItems: "center", gap: 8 },
});

/** Route wrapper for flat pushed screens: paper ground, top/left/right safe areas (bottom belongs to the sticky bar). */
export function Page({ children, bottom }: { children: ReactNode; bottom?: boolean }) {
  const p = usePalette();
  const insets = useSafeAreaInsets();
  return (
    <View style={{ flex: 1, backgroundColor: p.paper, paddingTop: insets.top, paddingLeft: insets.left, paddingRight: insets.right, paddingBottom: bottom ? insets.bottom : 0 }}>
      {children}
    </View>
  );
}

/** Small uppercase kicker above a title (Open Sauce, never mono). */
export function Kicker({ children, tone = "ink3", style }: { children: string; tone?: "ink3" | "accent" | "onAccentSoft"; style?: ViewStyle }) {
  return (
    <View style={style}>
      <Txt variant="micro" tone={tone} numberOfLines={1}>
        {children}
      </Txt>
    </View>
  );
}

/**
 * Stack-code tile: the course's short code on a soft azure square. Gives a
 * list a visual anchor without photos, gradients or a card.
 */
export function CodeTile({ code, size = 48 }: { code: string; size?: 48 | 56 }) {
  const p = usePalette();
  return (
    <View style={[styles.tile, { width: size, height: size, backgroundColor: p.accentSoft }]} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
      <Txt variant="caption" tone="onAccentSoft" maxFontSizeMultiplier={1} style={{ fontSize: code.length > 3 ? 12 : 14, letterSpacing: 0.4 }}>
        {code}
      </Txt>
    </View>
  );
}

/** Solid dot with a soft ring that breathes while a session is joinable. Stops under Reduce Motion. */
export function LiveDot({ color, size = 8 }: { color: string; size?: number }) {
  const reduced = useReducedMotion();
  const t = useSharedValue(0);
  useEffect(() => {
    if (reduced) return;
    t.value = withRepeat(withTiming(1, { duration: 1600, easing: Easing.out(Easing.quad) }), -1, false);
  }, [reduced, t]);
  const ring = useAnimatedStyle(() => ({ opacity: 0.5 * (1 - t.value), transform: [{ scale: 1 + t.value * 1.4 }] }));
  return (
    <View style={{ width: size * 2, height: size * 2, alignItems: "center", justifyContent: "center" }} accessibilityElementsHidden>
      <Animated.View style={[{ position: "absolute", width: size, height: size, borderRadius: size, backgroundColor: color }, ring]} />
      <View style={{ width: size, height: size, borderRadius: size, backgroundColor: color }} />
    </View>
  );
}

/** Hairline fact strip: mono value over a caption label, divided by 1 px rules. */
export function FactStrip({ facts, style }: { facts: { value: string; label: string; icon?: IconName }[]; style?: ViewStyle }) {
  const p = usePalette();
  return (
    <View style={[styles.facts, { borderColor: p.line }, style]}>
      {facts.map((f, i) => (
        <View key={f.label} style={[styles.fact, i === 0 && { paddingLeft: 0 }, i > 0 && { borderLeftColor: p.line, borderLeftWidth: StyleSheet.hairlineWidth }]} accessible accessibilityLabel={`${f.label}: ${f.value}`}>
          <View style={styles.factValue}>
            {f.icon ? <Icon name={f.icon} size={16} weight="fill" color={p.accent} /> : null}
            <Txt variant="monoLg" numberOfLines={1}>
              {f.value}
            </Txt>
          </View>
          <Txt variant="caption" tone="ink3" numberOfLines={1}>
            {f.label}
          </Txt>
        </View>
      ))}
    </View>
  );
}

/** Icon + text line for facts like place and mode. Icons are 16 pt regular, ink3. */
export function MetaLine({ icon, children }: { icon: IconName; children: ReactNode }) {
  const p = usePalette();
  return (
    <View style={styles.metaLine}>
      <Icon name={icon} size={16} color={p.ink3} />
      <Txt variant="meta" tone="ink2" style={styles.flex}>
        {children}
      </Txt>
    </View>
  );
}
