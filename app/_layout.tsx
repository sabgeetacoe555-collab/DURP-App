import FontAwesome from "@expo/vector-icons/FontAwesome"
import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider,
} from "@react-navigation/native"
import { useFonts } from "expo-font"
import { Stack, usePathname, useRouter } from "expo-router"
import * as SplashScreen from "expo-splash-screen"
import { useEffect } from "react"
import "react-native-reanimated"
import { GestureHandlerRootView } from "react-native-gesture-handler"

import { useColorScheme } from "@/components/useColorScheme"
import { ModalProvider } from "@/components/ModalContext"
import { SessionModal } from "@/components/SessionModal"
import { AuthProvider, useAuth } from "@/contexts/AuthContext"
import { LocationProvider } from "@/contexts/LocationContext"
import { SessionsProvider } from "@/contexts/SessionsContext"
import { GroupsProvider } from "@/contexts/GroupsContext"
import { useNotifications } from "@/hooks/useNotifications"
import { useNotificationNavigation } from "@/hooks/useNotificationNavigation"
import { setupDeepLinkListener } from "@/utils/deepLinkHandler"
import { AppState } from "react-native"

export {
  // Catch any errors thrown by the Layout component.
  ErrorBoundary,
} from "expo-router"

export const unstable_settings = {
  // Ensure that reloading on `/modal` keeps a back button present.
  initialRouteName: "index",
}

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync()

export default function RootLayout() {
  const [loaded, error] = useFonts({
    SpaceMono: require("../assets/fonts/SpaceMono-Regular.ttf"),
    ...FontAwesome.font,
  })

  // Expo Router uses Error Boundaries to catch errors in the navigation tree.
  useEffect(() => {
    if (error) throw error
  }, [error])

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync()
    }
  }, [loaded])

  if (!loaded) {
    return null
  }

  return <RootLayoutNav />
}

function RootLayoutNav() {
  const colorScheme = useColorScheme()

  return (
    <AuthProvider>
      <AuthenticatedApp colorScheme={colorScheme.theme} />
    </AuthProvider>
  )
}

function AuthenticatedApp({
  colorScheme,
}: {
  colorScheme: string | null | undefined
}) {
  const { user, isLoading, isStartupComplete } = useAuth()
  const pathname = usePathname()
  const router = useRouter()

  // Check if we're on auth screens
  const isAuthScreen = pathname.startsWith("/auth")
  const isNotificationsScreen = pathname.startsWith("/notifications")

  // Initialize notifications only when user is authenticated
  useNotifications(user)

  // Handle navigation from notifications and deep links at app root level
  useNotificationNavigation()

  // Set up deep link listener at app root level
  useEffect(() => {
    const subscription = setupDeepLinkListener()
    return () => {
      if (subscription) {
        subscription.remove()
      }
    }
  }, [])

  // Note: Pending notifications are now handled by the useNotificationNavigation hook
  // in the sessions layout, which provides better integration with the navigation system

  // Handle authentication routing
  useEffect(() => {
    // Wait for both authentication loading and startup to complete
    if (!isLoading && isStartupComplete) {
      // Check if we're on an invalid route (like deep link routes that don't exist)
      const isInvalidRoute =
        pathname.includes("/session/") || pathname === "/session"

      if (user && (pathname === "/" || isInvalidRoute)) {
        // User is authenticated and on the index page or invalid route
        // Don't auto-navigate - let the VideoSplash component handle navigation
        // when the video finishes playing
        console.log(
          "🎬 Layout: App ready, but letting VideoSplash handle navigation"
        )
      } else if (!user && !isAuthScreen) {
        // User is not authenticated and not on an auth screen, redirect to login
        router.replace("/auth/login")
      }
    }
  }, [user, isLoading, isStartupComplete, pathname, isAuthScreen, router])

  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: "#ffffff" }}>
      <ModalProvider>
        <LocationProvider>
          <SessionsProvider>
            <GroupsProvider>
              <ThemeProvider
                value={colorScheme === "dark" ? DarkTheme : DefaultTheme}
              >
                <Stack>
                  <Stack.Screen name="index" options={{ headerShown: false }} />
                  <Stack.Screen name="auth" options={{ headerShown: false }} />
                  <Stack.Screen
                    name="(tabs)"
                    options={{ headerShown: false }}
                  />
                </Stack>
                <SessionModal />
              </ThemeProvider>
            </GroupsProvider>
          </SessionsProvider>
        </LocationProvider>
      </ModalProvider>
    </GestureHandlerRootView>
  )
}
