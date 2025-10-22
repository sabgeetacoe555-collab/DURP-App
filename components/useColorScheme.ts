import { useColorScheme as useNativeColorScheme } from "react-native"
import Colors from "@/constants/Colors"

type Theme = "light" | "dark"
type ThemeColors = typeof Colors.light

export function useColorScheme(): ThemeColors & {
  theme: Theme
  isDark: boolean
  isLight: boolean
} {
  const colorScheme = useNativeColorScheme()
  const theme: Theme = colorScheme ?? "light"
  const colors = Colors[theme] as ThemeColors

  return {
    ...colors,
    theme,
    isDark: theme === "dark",
    isLight: theme === "light",
  }
}
