import React from "react"
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Image,
  SafeAreaView,
} from "react-native"
import { useRouter, usePathname } from "expo-router"
import FontAwesome from "@expo/vector-icons/FontAwesome"
import FontAwesome5 from "@expo/vector-icons/FontAwesome5"
import { useColorScheme } from "@/components/useColorScheme"
import Colors from "@/constants/Colors"
import { useAuth } from "@/hooks/useAuth"
import { useWeather } from "@/hooks/useWeather"
import { getWeatherIcon } from "@/services/localWeatherService"
import { Bell, User } from "lucide-react-native"

interface CustomHeaderProps {
  title?: string
  showBackButton?: boolean
}

export default function CustomHeader({
  title,
  showBackButton = false,
}: CustomHeaderProps) {
  const router = useRouter()
  const pathname = usePathname()
  const colors = useColorScheme()
  const { getUserDisplayName } = useAuth()
  const { weather, loading } = useWeather()

  // Determine if we should show back button based on current route
  const rootTabPaths = ["/widgets", "/sessions", "/pickleai", "/groups"]

  const shouldShowBackButton =
    (showBackButton || pathname?.includes("/")) &&
    pathname &&
    !rootTabPaths.includes(pathname)

  const handleBackPress = () => {
    if (router.canGoBack()) {
      router.back()
    }
  }

  // Get tab title from pathname if not provided
  // const getTabTitle = () => {
  //   if (title) return title

  //   if (pathname?.includes("/widgets")) return "Widgets"
  //   if (pathname?.includes("/sessions")) return "My play sessions"
  //   if (pathname?.includes("/pickleai")) return "PickleAI Chatbot"
  //   if (pathname?.includes("/groups")) return "Groups"
  //   if (pathname?.includes("/CreateSession")) return "Create Session"
  //   if (pathname?.includes("/PrePlaySession")) return "Pre-Play Session"
  //   if (pathname?.includes("/PostPlaySession")) return "Post-Play Session"

  //   return ""
  // }

  return (
    <SafeAreaView style={[styles.container]}>
      <View style={styles.header}>
        {/* Left side - Back button or empty space */}
        {shouldShowBackButton && (
          <View style={styles.leftSection}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={handleBackPress}
            >
              <FontAwesome5 name="chevron-left" size={20} color="#000000" />
            </TouchableOpacity>
          </View>
        )}

        {/* Center section - Logo, Welcome message and title */}
        {!shouldShowBackButton && (
          <View
            style={[
              styles.centerSection,
              { paddingLeft: shouldShowBackButton ? 8 : 0 },
            ]}
          >
            <View style={styles.welcomeRow}>
              {/* Logo */}
              <View
                style={[styles.logoContainer, { backgroundColor: "white" }]}
              >
                <Image
                  source={require("@/assets/images/netGainsIcon.png")}
                  style={styles.logoImage}
                  resizeMode="contain"
                />
              </View>

              <Text style={[styles.welcomeText, { color: "#000" }]}>
                Hi, {getUserDisplayName()}
              </Text>
            </View>
          </View>
        )}

        {/* Right section - Weather, Envelope icon and XP pill */}
        <View style={styles.rightSection}>
          {/* Weather display */}
          {weather && !loading && (
            <View style={styles.weatherContainer}>
              <Text style={styles.cityAbbreviation}>
                {weather.cityAbbreviation}
              </Text>
              <FontAwesome5
                name={getWeatherIcon(weather.condition)}
                size={14}
                color="#000000"
              />
              <Text style={styles.weatherText}>{weather.temperature}°</Text>
            </View>
          )}

          {/* Envelope icon */}
          <TouchableOpacity
            style={styles.alertIconContainer}
            onPress={() => router.push("/(tabs)/notifications")}
          >
            <Bell size={16} color="#000000" />
          </TouchableOpacity>

          {/* XP pill */}
          <TouchableOpacity
            style={styles.xpPillContainer}
            onPress={() => router.push("/leaders")}
          >
            <Text style={styles.xpText}>XP 1400</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.profileIconContainer}
            onPress={() => router.push("/profile")}
          >
            <User size={16} color="#000000" />
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    minHeight: 60,
  },
  leftSection: {
    width: 40,
    alignItems: "flex-start",
  },
  backButton: {
    padding: 8,
  },
  centerSection: {
    flex: 1,
    alignItems: "flex-start",
  },
  welcomeRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 2,
    gap: 8,
  },
  welcomeText: {
    fontSize: 12,
    fontWeight: "500",
  },
  titleText: {
    fontSize: 18,
    fontWeight: "bold",
  },
  rightSection: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  logoContainer: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  logoImage: {
    width: 18,
    height: 18,
  },
  weatherContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: "#f0f0f0",
  },
  weatherText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#000000",
  },
  cityAbbreviation: {
    fontSize: 10,
    fontWeight: "700",
    color: "#666666",
    marginRight: 2,
  },
  alertIconContainer: {
    width: 32,
    height: 32,
    // borderRadius: 16,
    // borderColor: "#000000",
    // borderWidth: 1,
    backgroundColor: "transparent",
    justifyContent: "center",
    alignItems: "center",
  },
  xpPillContainer: {
    backgroundColor: "#007AFF",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#007AFF",
  },
  xpText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "600",
  },
  profileIconContainer: {
    width: 30,
    height: 30,
    borderRadius: 15,
    // backgroundColor: "#007AFF",
    borderWidth: 1,
    borderColor: "#000000",
    justifyContent: "center",
    alignItems: "center",
  },
})
