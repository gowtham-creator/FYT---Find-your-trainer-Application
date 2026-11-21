import { JetBrainsMono_400Regular, JetBrainsMono_500Medium } from "@expo-google-fonts/jetbrains-mono";
import { useFonts } from "expo-font";

/** Bundled fonts (no runtime fetch): Open Sauce One (OFL, from the admin console) + JetBrains Mono. */
export function useFytFonts(): [loaded: boolean, error: Error | null] {
  return useFonts({
    "OpenSauceOne-Regular": require("../../assets/fonts/OpenSauceOne-Regular.ttf"),
    "OpenSauceOne-Medium": require("../../assets/fonts/OpenSauceOne-Medium.ttf"),
    "OpenSauceOne-SemiBold": require("../../assets/fonts/OpenSauceOne-SemiBold.ttf"),
    JetBrainsMono_400Regular,
    JetBrainsMono_500Medium,
  });
}
