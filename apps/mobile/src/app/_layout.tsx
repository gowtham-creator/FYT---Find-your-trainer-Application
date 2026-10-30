import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Stack, usePathname, useRouter } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import { useEffect, useState } from "react";
import { useColorScheme } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { SessionProvider, useSession } from "../session/SessionProvider";
import { redirectFor } from "../session/state";
import { useFytFonts, usePalette } from "../theme";

SplashScreen.preventAutoHideAsync().catch(() => undefined);

/** Applies the pure redirect table to the current route whenever the session changes. */
function SessionRouter() {
  const session = useSession();
  const path = usePathname();
  const router = useRouter();
  useEffect(() => {
    const target = redirectFor(session, path);
    if (target && target !== path) router.replace(target as never);
  }, [session, path, router]);
  return null;
}

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFytFonts();
  const [queryClient] = useState(() => new QueryClient({ defaultOptions: { mutations: { retry: 0 }, queries: { retry: 1 } } }));
  const p = usePalette();
  const scheme = useColorScheme();

  useEffect(() => {
    if (fontsLoaded || fontError) SplashScreen.hideAsync().catch(() => undefined);
  }, [fontsLoaded, fontError]);

  if (!fontsLoaded && !fontError) return null;

  return (
    <SafeAreaProvider>
      <QueryClientProvider client={queryClient}>
        <SessionProvider>
          <StatusBar style={scheme === "dark" ? "light" : "dark"} />
          <SessionRouter />
          <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: p.paper }, animation: "fade" }} />
        </SessionProvider>
      </QueryClientProvider>
    </SafeAreaProvider>
  );
}
