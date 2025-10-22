import React from "react"
import { StyleSheet, Pressable, View } from "react-native"
import { Text } from "@/components/Themed"
import { Ionicons } from "@expo/vector-icons"
import { useColorScheme } from "@/components/useColorScheme"
import { SessionType } from "@/types"

interface SessionTypeSelectorProps {
  sessionType: SessionType
  onSessionTypeChange: (type: SessionType) => void
}

export default function SessionTypeSelector({
  sessionType,
  onSessionTypeChange,
}: SessionTypeSelectorProps) {
  const colors = useColorScheme()

  const sessionTypes: {
    type: SessionType
    label: string
    icon: keyof typeof Ionicons.glyphMap
  }[] = [
    { type: "open play", label: "Open Play", icon: "people-outline" },
    { type: "tournament", label: "Tournament", icon: "trophy-outline" },
    { type: "drills", label: "Drills", icon: "fitness-outline" },
  ]

  return (
    <View style={styles.container}>
      <Text style={[styles.label, { color: colors.text }]}>Session Type</Text>
      <View style={styles.typeRow}>
        {sessionTypes.map(({ type, label, icon }) => (
          <Pressable
            key={type}
            style={[
              styles.typeButton,
              {
                borderColor: colors.text + "30",
                backgroundColor:
                  sessionType === type ? colors.tint + "20" : "transparent",
              },
            ]}
            onPress={() => onSessionTypeChange(type)}
          >
            <Ionicons
              name={icon}
              size={20}
              color={sessionType === type ? colors.tint : colors.text}
            />
            <Text
              style={[
                styles.typeText,
                {
                  color: sessionType === type ? colors.tint : colors.text,
                  fontWeight: sessionType === type ? "600" : "500",
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
  typeRow: {
    flexDirection: "row",
    gap: 12,
  },
  typeButton: {
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
  typeText: {
    fontSize: 14,
  },
})
