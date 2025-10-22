import React, { useState } from "react"
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Image,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ScrollView,
} from "react-native"
import { router } from "expo-router"
import { useColorScheme } from "@/components/useColorScheme"
import Colors from "@/constants/Colors"
import { authService } from "@/services/authService"
import { locationService, LocationData } from "@/services/locationService"
import GoogleButton from "@/components/GoogleButton"
import AppleButton from "@/components/AppleButton"
import LocationAutocomplete from "@/components/LocationAutocomplete"

export default function SignupScreen() {
  const [email, setEmail] = useState("")
  const [name, setName] = useState("")
  const [phone, setPhone] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [location, setLocation] = useState<LocationData | null>(null)
  const [locationAddress, setLocationAddress] = useState("")
  const [loading, setLoading] = useState(false)
  const [locationLoading, setLocationLoading] = useState(false)
  const colors = useColorScheme()

  const handleGetCurrentLocation = async () => {
    setLocationLoading(true)
    try {
      const locationData = await locationService.getCurrentLocation()
      if (locationData) {
        setLocation(locationData)
        setLocationAddress(
          locationData.displayAddress || locationData.address || ""
        )
      }
    } catch (error) {
      console.error("Error getting location:", error)
    } finally {
      setLocationLoading(false)
    }
  }

  const handleSignup = async () => {
    // Validate inputs
    if (!email || !name || !password || !confirmPassword) {
      Alert.alert("Error", "Please fill in all fields")
      return
    }

    if (password !== confirmPassword) {
      Alert.alert("Error", "Passwords do not match")
      return
    }

    if (password.length < 6) {
      Alert.alert("Error", "Password must be at least 6 characters")
      return
    }

    setLoading(true)

    try {
      await authService.signUp(email, password, name, phone, location)
      router.replace("/(tabs)/widgets")
    } catch (error) {
      // Error is already handled by authService with Alert
      console.error("Signup error:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleGoogleSignup = () => {
    // For now, just navigate to main app
    router.replace("/(tabs)/widgets")
  }

  const handleAppleSignup = () => {
    // For now, just navigate to main app
    router.replace("/(tabs)/widgets")
  }

  const handleBackToLogin = () => {
    router.back()
  }

  const handleLocationChange = (
    address: string,
    locationData: LocationData | null
  ) => {
    setLocationAddress(address)
    setLocation(locationData)
  }

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.keyboardView}
      >
        <ScrollView style={styles.content}>
          {/* Logo */}
          <View style={styles.logoContainer}>
            <Image
              source={require("@/assets/images/netGainsIcon.png")}
              style={styles.logoImage}
              resizeMode="contain"
            />
          </View>

          {/* Title */}
          <Text style={[styles.title, { color: colors.text }]}>
            Create Your Account
          </Text>

          {/* Signup Container */}
          <View
            style={[
              styles.signupContainer,
              { borderColor: colors.tabIconDefault },
            ]}
          >
            <TextInput
              style={[
                styles.input,
                {
                  color: colors.text,
                  borderColor: colors.tabIconDefault,
                  backgroundColor: colors.isDark ? "#1a1a1a" : "#f5f5f5",
                },
              ]}
              placeholder="Email"
              placeholderTextColor={colors.tabIconDefault}
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
            />
            <TextInput
              style={[
                styles.input,
                {
                  color: colors.text,
                  borderColor: colors.tabIconDefault,
                  backgroundColor: colors.isDark ? "#1a1a1a" : "#f5f5f5",
                },
              ]}
              placeholder="Full Name"
              placeholderTextColor={colors.tabIconDefault}
              value={name}
              onChangeText={setName}
              autoCapitalize="words"
            />
            <TextInput
              style={[
                styles.input,
                {
                  color: colors.text,
                  borderColor: colors.tabIconDefault,
                  backgroundColor: colors.isDark ? "#1a1a1a" : "#f5f5f5",
                },
              ]}
              placeholder="(123) 456-7890 or +1 123 456-7890"
              placeholderTextColor={colors.tabIconDefault}
              value={
                phone
                  ? (() => {
                      // If it's +1, parse it as US number
                      if (phone.startsWith("+1")) {
                        const digits = phone.replace(/\D/g, "").slice(1) // Remove +1 and non-digits
                        if (digits.length <= 3) {
                          return `(${digits}`
                        } else if (digits.length <= 6) {
                          return `(${digits.slice(0, 3)}) ${digits.slice(3)}`
                        } else {
                          return `(${digits.slice(0, 3)}) ${digits.slice(
                            3,
                            6
                          )}-${digits.slice(6, 10)}`
                        }
                      }

                      // If it's other international number (starts with +), display as-is
                      if (phone.startsWith("+")) {
                        return phone
                      }

                      // Format US numbers
                      if (phone.length <= 3) {
                        return `(${phone}`
                      } else if (phone.length <= 6) {
                        return `(${phone.slice(0, 3)}) ${phone.slice(3)}`
                      } else {
                        return `(${phone.slice(0, 3)}) ${phone.slice(
                          3,
                          6
                        )}-${phone.slice(6, 10)}`
                      }
                    })()
                  : ""
              }
              onChangeText={(text) => {
                // Handle international format if it starts with +
                if (text.startsWith("+")) {
                  // For international numbers, store the full formatted string
                  setPhone(text)
                  return
                }

                // Remove all non-digits for US numbers
                const cleaned = text.replace(/\D/g, "")

                // Apply phone number mask: (XXX) XXX-XXXX for US numbers
                let formatted = ""
                if (cleaned.length > 0) {
                  if (cleaned.length <= 3) {
                    formatted = `(${cleaned}`
                  } else if (cleaned.length <= 6) {
                    formatted = `(${cleaned.slice(0, 3)}) ${cleaned.slice(3)}`
                  } else {
                    formatted = `(${cleaned.slice(0, 3)}) ${cleaned.slice(
                      3,
                      6
                    )}-${cleaned.slice(6, 10)}`
                  }
                }

                setPhone(cleaned) // Store cleaned digits for US numbers
              }}
              keyboardType="phone-pad"
              autoCapitalize="none"
              autoCorrect={false}
              maxLength={20}
            />
            {phone.length > 0 && (
              <Text
                style={[styles.helperText, { color: colors.tabIconDefault }]}
              >
                Phone number will be used for session invites and notifications
              </Text>
            )}
            <TextInput
              style={[
                styles.input,
                {
                  color: colors.text,
                  borderColor: colors.tabIconDefault,
                  backgroundColor: colors.isDark ? "#1a1a1a" : "#f5f5f5",
                },
              ]}
              placeholder="Password"
              placeholderTextColor={colors.tabIconDefault}
              value={password}
              onChangeText={setPassword}
              secureTextEntry
            />
            <TextInput
              style={[
                styles.input,
                {
                  color: colors.text,
                  borderColor: colors.tabIconDefault,
                  backgroundColor: colors.isDark ? "#1a1a1a" : "#f5f5f5",
                },
              ]}
              placeholder="Confirm Password"
              placeholderTextColor={colors.tabIconDefault}
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry
            />

            {/* Enhanced Location Section with Google Places Autocomplete */}
            <LocationAutocomplete
              value={locationAddress}
              onLocationChange={handleLocationChange}
              onGetCurrentLocation={handleGetCurrentLocation}
              locationLoading={locationLoading}
              placeholder="Location (optional) - Try typing an address or city"
            />
          </View>

          {/* Signup Button */}
          <TouchableOpacity
            style={[
              styles.signupButton,
              {
                backgroundColor: loading ? colors.tabIconDefault : colors.tint,
                opacity: loading ? 0.7 : 1,
              },
            ]}
            onPress={handleSignup}
            disabled={loading}
          >
            <Text
              style={[styles.signupButtonText, { color: colors.background }]}
            >
              {loading ? "Creating account..." : "Create Account"}
            </Text>
          </TouchableOpacity>

          {/* Or Continue With */}
          <View style={styles.orContainer}>
            <View
              style={[
                styles.divider,
                { backgroundColor: colors.tabIconDefault },
              ]}
            />
            <Text style={[styles.orText, { color: colors.tabIconDefault }]}>
              Or continue with
            </Text>
            <View
              style={[
                styles.divider,
                { backgroundColor: colors.tabIconDefault },
              ]}
            />
          </View>

          {/* Social Signup Buttons */}
          <View style={styles.socialContainer}>
            <GoogleButton onPress={handleGoogleSignup} />
            <AppleButton onPress={handleAppleSignup} />
          </View>

          {/* Back to Login Link */}
          <View style={styles.backToLoginContainer}>
            <Text style={[styles.backToLoginText, { color: colors.text }]}>
              Already have an account?{" "}
            </Text>
            <TouchableOpacity onPress={handleBackToLogin}>
              <Text style={[styles.backToLoginLink, { color: colors.tint }]}>
                Sign in
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    // paddingTop: 60,
    paddingBottom: 40,
  },
  logoContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: "center",
    alignItems: "center",
    alignSelf: "center",
    marginBottom: 24,
  },
  logoImage: {
    width: 60,
    height: 60,
  },
  logoText: {
    fontSize: 16,
    fontWeight: "bold",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 40,
  },
  signupContainer: {
    marginBottom: 24,
  },
  input: {
    height: 50,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 16,
    marginBottom: 16,
    fontSize: 16,
  },
  signupButton: {
    height: 50,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 32,
  },
  signupButtonText: {
    fontSize: 16,
    fontWeight: "600",
  },
  orContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 24,
  },
  divider: {
    flex: 1,
    height: 1,
  },
  orText: {
    marginHorizontal: 16,
    fontSize: 14,
  },
  socialContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 40,
  },
  backToLoginContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },
  backToLoginText: {
    fontSize: 14,
  },
  backToLoginLink: {
    fontSize: 14,
    fontWeight: "600",
  },
  helperText: {
    fontSize: 12,
    marginTop: -12,
    marginBottom: 8,
    marginLeft: 4,
    fontStyle: "italic",
  },
  locationContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  locationButton: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
    minWidth: 100,
    height: 50,
  },
  locationButtonText: {
    fontSize: 14,
    fontWeight: "600",
  },
})
