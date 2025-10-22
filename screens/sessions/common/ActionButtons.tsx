import React from "react"
import { StyleSheet, Pressable } from "react-native"
import { Text, View } from "@/components/Themed"
import { useColorScheme } from "@/components/useColorScheme"
import Colors from "@/constants/Colors"

interface ActionButtonsProps {
  onCancel: () => void
  onSave: () => void
  saveText?: string
  cancelText?: string
}

export default function ActionButtons({
  onCancel,
  onSave,
  saveText = "Save Entry",
  cancelText = "Cancel",
}: ActionButtonsProps) {
  const colors = useColorScheme()

  // Define border color based on color scheme
  const borderColor = colors.isDark ? "#444" : "#ddd"

  return (
    <View style={[styles.row, { backgroundColor: "transparent" }]}>
      <Pressable
        style={[
          styles.actionButton,
          styles.cancelActionButton,
          { borderColor },
        ]}
        onPress={onCancel}
      >
        <Text style={[styles.actionButtonText, { color: colors.tint }]}>
          {cancelText}
        </Text>
      </Pressable>

      <Pressable
        style={[
          styles.actionButton,
          styles.saveActionButton,
          { backgroundColor: colors.tint },
        ]}
        onPress={onSave}
      >
        <Text style={[styles.actionButtonText, { color: "white" }]}>
          {saveText}
        </Text>
      </Pressable>
    </View>
  )
}

const styles = StyleSheet.create({
  row: {
    marginBottom: 16,
    flexDirection: "row",
    gap: 12,
    backgroundColor: "transparent",
  },
  actionButton: {
    flex: 1,
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  cancelActionButton: {
    backgroundColor: "transparent",
    borderWidth: 2,
  },
  saveActionButton: {
    borderWidth: 0,
  },
  actionButtonText: {
    fontSize: 18,
    fontWeight: "600",
  },
})
