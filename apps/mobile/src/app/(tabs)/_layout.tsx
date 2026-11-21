import { Tabs } from "expo-router";
import type { ColorValue } from "react-native";
import { StyleSheet } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Icon, type IconName } from "../../components";
import { font, usePalette } from "../../theme";

const tab = (title: string, icon: IconName) => ({
  title,
  tabBarIcon: ({ color, focused }: { color: ColorValue; focused: boolean }) => <Icon name={icon} size={24} weight={focused ? "fill" : "regular"} color={color} />,
});

/** Learner shell: Home, Explore, Bookings, Profile. Active = azure filled icon. */
export default function LearnerTabs() {
  const p = usePalette();
  const insets = useSafeAreaInsets();
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: p.accent,
        tabBarInactiveTintColor: p.ink3,
        tabBarStyle: { backgroundColor: p.surface, borderTopColor: p.line, borderTopWidth: StyleSheet.hairlineWidth, height: 64 + insets.bottom, paddingTop: 6, paddingBottom: insets.bottom },
        tabBarItemStyle: { height: 56, justifyContent: "center" },
        tabBarLabelStyle: { fontFamily: font.sansMedium, fontSize: 12, lineHeight: 16, marginTop: 2 },
        sceneStyle: { backgroundColor: p.paper },
      }}
    >
      <Tabs.Screen name="home" options={tab("Home", "home")} />
      <Tabs.Screen name="explore" options={tab("Explore", "explore")} />
      <Tabs.Screen name="bookings" options={tab("Bookings", "bookings")} />
      <Tabs.Screen name="profile" options={tab("Profile", "profile")} />
    </Tabs>
  );
}
