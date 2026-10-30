import { GeistMono_400Regular, GeistMono_500Medium } from "@expo-google-fonts/geist-mono";
import { Inter_400Regular, Inter_500Medium } from "@expo-google-fonts/inter";
import { PlayfairDisplay_500Medium } from "@expo-google-fonts/playfair-display";
import { useFonts } from "expo-font";

/** Fonts are bundled with the app (no runtime fetch), so first paint works offline. */
export function useFytFonts(): [loaded: boolean, error: Error | null] {
  return useFonts({ Inter_400Regular, Inter_500Medium, PlayfairDisplay_500Medium, GeistMono_400Regular, GeistMono_500Medium });
}
