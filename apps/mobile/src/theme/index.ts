import { useColorScheme } from "react-native";
import { dark, light, type Palette } from "./tokens";

export * from "./fonts";
export * from "./tokens";
export * from "./typography";

/** The active palette, following the system light/dark setting. */
export function usePalette(): Palette {
  return useColorScheme() === "dark" ? dark : light;
}
