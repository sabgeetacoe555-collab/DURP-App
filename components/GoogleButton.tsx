import React from "react"
import { TouchableOpacity, Text, StyleSheet, View } from "react-native"
import { useColorScheme } from "./useColorScheme"
import Colors from "@/constants/Colors"
import { Ionicons } from "@expo/vector-icons"

interface GoogleButtonProps {
  onPress: () => void
  disabled?: boolean
  loading?: boolean
}

export default function GoogleButton({
  onPress,
  disabled = false,
  loading = false,
}: GoogleButtonProps) {
  const colors = useColorScheme()

  return (
    <TouchableOpacity
      style={[
        styles.socialButton,
        {
          borderColor: colors.tabIconDefault,
          opacity: disabled || loading ? 0.6 : 1,
        },
      ]}
      onPress={onPress}
      disabled={disabled || loading}
    >
      <View style={styles.buttonContent}>
        <Ionicons
          name="logo-google"
          size={20}
          color={colors.text}
          style={styles.icon}
        />
        <Text style={[styles.socialButtonText, { color: colors.text }]}>
          {loading ? "Signing in..." : "Google"}
        </Text>
      </View>
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  socialButton: {
    flex: 1,
    height: 50,
    borderWidth: 1,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
    marginHorizontal: 8,
  },
  buttonContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  icon: {
    marginRight: 8,
  },
  socialButtonText: {
    fontSize: 16,
    fontWeight: "500",
  },
})
