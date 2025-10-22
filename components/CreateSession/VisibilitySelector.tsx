import React from "react"
import { StyleSheet, Pressable, View } from "react-native"
import { Text } from "@/components/Themed"
import { Ionicons } from "@expo/vector-icons"
import { useColorScheme } from "@/components/useColorScheme"

type Visibility = "public" | "friends" | "private"

interface VisibilitySelectorProps {
  visibility: Visibility
  onVisibilityChange: (visibility: Visibility) => void
}

export default function VisibilitySelector({
  visibility,
  onVisibilityChange,
}: VisibilitySelectorProps) {
  const colors = useColorScheme()

  const visibilityOptions: {
    type: Visibility
    label: string
    icon: keyof typeof Ionicons.glyphMap
  }[] = [
    { type: "public", label: "Public", icon: "globe-outline" },
    { type: "friends", label: "Friends", icon: "people-outline" },
    { type: "private", label: "Private", icon: "lock-closed-outline" },
  ]

  return (
    <View style={styles.container}>
      <Text style={[styles.label, { color: colors.text }]}>Visibility</Text>
      <View style={styles.visibilityRow}>
        {visibilityOptions.map(({ type, label, icon }) => (
          <Pressable
            key={type}
            style={[
              styles.visibilityButton,
              {
                borderColor: colors.text + "30",
                backgroundColor:
                  visibility === type ? colors.tint + "20" : "transparent",
              },
            ]}
            onPress={() => onVisibilityChange(type)}
          >
            <Ionicons
              name={icon}
              size={20}
              color={visibility === type ? colors.tint : colors.text}
            />
            <Text
              style={[
                styles.visibilityText,
                {
                  color: visibility === type ? colors.tint : colors.text,
                  fontWeight: visibility === type ? "600" : "500",
                },
              ]}
            >
              {label}
            </Text>
          </Pressable>
        ))}
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  label: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 8,
  },
  visibilityRow: {
    flexDirection: "row",
    gap: 12,
  },
  visibilityButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 16,
    gap: 8,
  },
  visibilityText: {
    fontSize: 14,
  },
})
