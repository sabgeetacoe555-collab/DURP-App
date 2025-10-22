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
} from "react-native"
import { router } from "expo-router"
import { useColorScheme } from "@/components/useColorScheme"
import Colors from "@/constants/Colors"
import { authService } from "@/services/authService"

export default function ForgotPasswordScreen() {
  const [email, setEmail] = useState("")
  const [loading, setLoading] = useState(false)
  const [emailSent, setEmailSent] = useState(false)
  const colors = useColorScheme()

  const handleResetPassword = async () => {
    // Validate inputs
    if (!email) {
      Alert.alert("Error", "Please enter your email address")
      return
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      Alert.alert("Error", "Please enter a valid email address")
      return
    }

    setLoading(true)

    try {
      await authService.resetPassword(email)
      setEmailSent(true)
    } catch (error) {
      // Error is already handled by authService with Alert
      console.error("Reset password error:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleBackToLogin = () => {
    router.back()
  }

  const handleResendEmail = () => {
    setEmailSent(false)
    setEmail("")
  }

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.keyboardView}
      >
        <View style={styles.content}>
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
            Reset Password
          </Text>

          {!emailSent ? (
            <>
              {/* Description */}
              <Text style={[styles.description, { color: colors.text }]}>
                Enter your email address and we'll send you a link to reset your
                password.
              </Text>

              {/* Email Input */}
              <View
                style={[
                  styles.inputContainer,
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
                />
              </View>

              {/* Reset Button */}
              <TouchableOpacity
                style={[
                  styles.resetButton,
                  {
                    backgroundColor: loading
                      ? colors.tabIconDefault
                      : colors.tint,
                    opacity: loading ? 0.7 : 1,
                  },
                ]}
                onPress={handleResetPassword}
                disabled={loading}
              >
                <Text
                  style={[styles.resetButtonText, { color: colors.background }]}
                >
                  {loading ? "Sending..." : "Send Reset Link"}
                </Text>
              </TouchableOpacity>
            </>
          ) : (
            <>
              {/* Success Message */}
              <View style={styles.successContainer}>
                <Text style={[styles.successTitle, { color: colors.text }]}>
                  Check Your Email
                </Text>
                <Text style={[styles.successText, { color: colors.text }]}>
                  We've sent a password reset link to:
                </Text>
                <Text style={[styles.emailText, { color: colors.tint }]}>
                  {email}
                </Text>
                <Text style={[styles.successText, { color: colors.text }]}>
                  Click the link in the email to reset your password.
                </Text>
              </View>

              {/* Resend Button */}
              <TouchableOpacity
                style={[styles.resendButton, { borderColor: colors.tint }]}
                onPress={handleResendEmail}
              >
                <Text style={[styles.resendButtonText, { color: colors.tint }]}>
                  Resend Email
                </Text>
              </TouchableOpacity>
            </>
          )}

          {/* Back to Login */}
          <TouchableOpacity
            onPress={handleBackToLogin}
            style={styles.backToLoginContainer}
          >
            <Text style={[styles.backToLoginText, { color: colors.tint }]}>
              Back to Login
            </Text>
          </TouchableOpacity>
        </View>
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
    paddingTop: 60,
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
  title: {
    fontSize: 24,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 16,
  },
  description: {
    fontSize: 16,
    textAlign: "center",
    marginBottom: 32,
    lineHeight: 22,
  },
  inputContainer: {
    marginBottom: 24,
  },
  input: {
    height: 50,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 16,
    fontSize: 16,
  },
  resetButton: {
    height: 50,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 24,
  },
  resetButtonText: {
    fontSize: 16,
    fontWeight: "600",
  },
  backToLoginContainer: {
    alignItems: "center",
  },
  backToLoginText: {
    fontSize: 16,
    fontWeight: "500",
  },
  successContainer: {
    alignItems: "center",
    marginBottom: 40,
  },
  successTitle: {
    fontSize: 24,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 16,
  },
  successText: {
    fontSize: 16,
    textAlign: "center",
    marginBottom: 16,
    lineHeight: 22,
  },
  emailText: {
    fontSize: 16,
    fontWeight: "600",
  },
  resendButton: {
    height: 50,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
  },
  resendButtonText: {
    fontSize: 16,
    fontWeight: "600",
  },
})
