import { Feather } from "@expo/vector-icons";
import { Tabs } from "expo-router";
import type { ComponentProps } from "react";
import type { ColorValue } from "react-native";
import { font, usePalette } from "../../theme";

type Icon = ComponentProps<typeof Feather>["name"];
const tab = (title: string, icon: Icon) => ({
  title,
  tabBarIcon: ({ color, size }: { color: ColorValue; size: number }) => <Feather name={icon} size={size - 2} color={color as string} />,
});

/** Learner shell: Home, Explore, Bookings, Profile. Active tab = ink + marigold indicator. */
export default function LearnerTabs() {
  const p = usePalette();
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: p.ink,
        tabBarInactiveTintColor: p.ink3,
        tabBarActiveBackgroundColor: p.accentSoft,
        tabBarStyle: { backgroundColor: p.sunken, borderTopColor: p.line },
        tabBarItemStyle: { borderRadius: 6, marginHorizontal: 6, marginVertical: 4 },
        tabBarLabelStyle: { fontFamily: font.sansMedium, fontSize: 13 },
        sceneStyle: { backgroundColor: p.paper },
      }}
    >
      <Tabs.Screen name="home" options={tab("Home", "home")} />
      <Tabs.Screen name="explore" options={tab("Explore", "search")} />
      <Tabs.Screen name="bookings" options={tab("Bookings", "calendar")} />
      <Tabs.Screen name="profile" options={tab("Profile", "user")} />
    </Tabs>
  );
}
