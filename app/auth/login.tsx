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
import GoogleButton from "@/components/GoogleButton"
import AppleButton from "@/components/AppleButton"

export default function LoginScreen() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const colors = useColorScheme()

  const handleLogin = async () => {
    // Validate inputs
    if (!email || !password) {
      Alert.alert("Error", "Please fill in all fields")
      return
    }

    setLoading(true)

    try {
      await authService.signIn(email, password)
      router.replace("/(tabs)/widgets")
    } catch (error) {
      // Error is already handled by authService with Alert
      console.error("Login error:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleGoogleLogin = () => {
    // For now, just navigate to main app
    router.replace("/(tabs)/widgets")
  }

  const handleAppleLogin = () => {
    // For now, just navigate to main app
    router.replace("/(tabs)/widgets")
  }

  const handleForgotPassword = () => {
    router.push("/auth/forgot-password")
  }

  const handleCreateAccount = () => {
    router.push("/auth/signup")
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
            Your Mobile Home Court
          </Text>

          {/* Login Container */}
          <View
            style={[
              styles.loginContainer,
              { borderColor: colors.tabIconDefault },
            ]}
          >
            <TextInput
              style={[
                styles.input,
                {
                  color: colors.text,
                  borderColor: colors.tabIconDefault,
                  backgroundColor:
                    colors.isDark ? "#1a1a1a" : "#f5f5f5",
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
                  backgroundColor:
                    colors.isDark ? "#1a1a1a" : "#f5f5f5",
                },
              ]}
              placeholder="Password"
              placeholderTextColor={colors.tabIconDefault}
              value={password}
              onChangeText={setPassword}
              secureTextEntry
            />
          </View>

          {/* Forgot Password */}
          <TouchableOpacity
            onPress={handleForgotPassword}
            style={styles.forgotPasswordContainer}
          >
            <Text style={[styles.forgotPasswordText, { color: colors.tint }]}>
              Forgot password?
            </Text>
          </TouchableOpacity>

          {/* Login Button */}
          <TouchableOpacity
            style={[
              styles.loginButton,
              {
                backgroundColor: loading ? colors.tabIconDefault : colors.tint,
                opacity: loading ? 0.7 : 1,
              },
            ]}
            onPress={handleLogin}
            disabled={loading}
          >
            <Text
              style={[styles.loginButtonText, { color: colors.background }]}
            >
              {loading ? "Signing in..." : "Login"}
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

          {/* Social Login Buttons */}
          <View style={styles.socialContainer}>
            <GoogleButton onPress={handleGoogleLogin} />
            <AppleButton onPress={handleAppleLogin} />
          </View>

          {/* Create Account Link */}
          <View style={styles.createAccountContainer}>
            <Text style={[styles.createAccountText, { color: colors.text }]}>
              Don't have an account?{" "}
            </Text>
            <TouchableOpacity onPress={handleCreateAccount}>
              <Text style={[styles.createAccountLink, { color: colors.tint }]}>
                Create new account
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
  loginContainer: {
    marginBottom: 16,
  },
  input: {
    height: 50,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 16,
    marginBottom: 16,
    fontSize: 16,
  },
  forgotPasswordContainer: {
    alignSelf: "flex-end",
    marginBottom: 24,
  },
  forgotPasswordText: {
    fontSize: 14,
    fontWeight: "500",
  },
  loginButton: {
    height: 50,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 32,
  },
  loginButtonText: {
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
  createAccountContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },
  createAccountText: {
    fontSize: 14,
  },
  createAccountLink: {
    fontSize: 14,
    fontWeight: "600",
  },
})
