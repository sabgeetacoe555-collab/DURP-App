import React from "react"
import { StyleSheet, Pressable } from "react-native"
import { Text, View } from "@/components/Themed"
import { Ionicons } from "@expo/vector-icons"
import { useColorScheme } from "@/components/useColorScheme"
import Colors from "@/constants/Colors"
import Card from "@/components/Card"

interface CheckboxCardProps<T extends string> {
  title: string
  options: T[]
  selectedValues?: T[]
  onSelectionChange: (values: T[]) => void
}

export default function CheckboxCard<T extends string>({
  title,
  options,
  selectedValues = [],
  onSelectionChange,
}: CheckboxCardProps<T>) {
  const colors = useColorScheme()

  // Define border color based on color scheme
  const borderColor = colors.isDark ? "#444" : "#ddd"

  const handleSelection = (option: T) => {
    const currentValues = selectedValues || []
    const newValues = currentValues.includes(option)
      ? currentValues.filter((v) => v !== option)
      : [...currentValues, option]
    onSelectionChange(newValues)
  }

  const formatOptionText = (option: string) => {
    return option.charAt(0).toUpperCase() + option.slice(1)
  }

  return (
    <Card title={title}>
      <View
        style={[styles.optionsContainer, { backgroundColor: "transparent" }]}
      >
        {options.map((option) => (
          <Pressable
            key={option}
            style={styles.optionRow}
            onPress={() => handleSelection(option)}
          >
            <View
              style={[
                styles.checkbox,
                { borderColor },
                selectedValues?.includes(option) && {
                  backgroundColor: colors.tint,
                },
              ]}
            >
              {selectedValues?.includes(option) && (
                <Ionicons name="checkmark" size={12} color="white" />
              )}
            </View>
            <Text style={[styles.optionLabel, { color: colors.text }]}>
              {formatOptionText(option)}
            </Text>
          </Pressable>
        ))}
      </View>
    </Card>
  )
}

const styles = StyleSheet.create({
  optionsContainer: {
    gap: 12,
  },
  optionRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderWidth: 2,
    borderRadius: 4,
    alignItems: "center",
    justifyContent: "center",
  },
  optionLabel: {
    fontSize: 16,
  },
})
