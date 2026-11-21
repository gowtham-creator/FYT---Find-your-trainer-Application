/**
 * Motion primitives (docs/MOBILE-DESIGN.md §6). Everything runs on the UI
 * thread and animates only transform and opacity. Reduce Motion turns
 * entrances into short fades and drops scale and translation.
 */
import { useEffect, type ReactNode } from "react";
import { Pressable, type PressableProps, type StyleProp, type ViewStyle } from "react-native";
import Animated, { useAnimatedStyle, useReducedMotion, useSharedValue, withDelay, withSpring, withTiming } from "react-native-reanimated";
import { dur, ease, RISE, spring, STAGGER, STAGGER_MAX } from "../theme/motion";

/** Fades content up 8 pt once on mount. `index` staggers siblings 40 ms apart (max 6). */
export function FadeUp({ children, index = 0, delay = 0, style, rise = RISE }: { children: ReactNode; index?: number; delay?: number; style?: StyleProp<ViewStyle>; rise?: number }) {
  const reduced = useReducedMotion();
  const t = useSharedValue(0);
  useEffect(() => {
    const wait = delay + Math.min(index, STAGGER_MAX) * STAGGER;
    t.value = withDelay(reduced ? 0 : wait, withTiming(1, { duration: reduced ? 120 : dur.base, easing: ease.enter }));
  }, [delay, index, reduced, t]);
  const a = useAnimatedStyle(() => ({ opacity: t.value, transform: [{ translateY: reduced ? 0 : (1 - t.value) * rise }] }));
  return <Animated.View style={[style, a]}>{children}</Animated.View>;
}

const APressable = Animated.createAnimatedComponent(Pressable);

/**
 * Pressable with the app's press feedback: scale to 0.97 (controls) or 0.985
 * (rows and panels) in 90 ms, released on a no-overshoot spring.
 */
export function PressScale({ children, scaleTo = 0.97, style, ...rest }: Omit<PressableProps, "style"> & { scaleTo?: number; style?: StyleProp<ViewStyle>; children: ReactNode }) {
  const reduced = useReducedMotion();
  const s = useSharedValue(1);
  const a = useAnimatedStyle(() => ({ transform: [{ scale: s.value }] }));
  return (
    <APressable
      {...rest}
      onPressIn={(e) => {
        if (!reduced) s.value = withTiming(scaleTo, { duration: dur.instant, easing: ease.standard });
        rest.onPressIn?.(e);
      }}
      onPressOut={(e) => {
        s.value = withSpring(1, spring.press);
        rest.onPressOut?.(e);
      }}
      style={[style, a]}
    >
      {children}
    </APressable>
  );
}
