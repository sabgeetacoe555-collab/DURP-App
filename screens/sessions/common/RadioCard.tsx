import React from "react"
import { StyleSheet, Pressable } from "react-native"
import { Text, View } from "@/components/Themed"
import { Ionicons } from "@expo/vector-icons"
import { useColorScheme } from "@/components/useColorScheme"
import Colors from "@/constants/Colors"
import Card from "@/components/Card"

interface RadioCardProps<T extends string> {
  title: string
  options: T[]
  selectedValue?: T | null
  onSelectionChange: (value: T) => void
}

export default function RadioCard<T extends string>({
  title,
  options,
  selectedValue,
  onSelectionChange,
}: RadioCardProps<T>) {
  const colors = useColorScheme()

  // Define border color based on color scheme
  const borderColor = colors.isDark ? "#444" : "#ddd"

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
            onPress={() => onSelectionChange(option)}
          >
            <View
              style={[
                styles.radio,
                { borderColor },
                selectedValue === option && {
                  backgroundColor: colors.tint,
                },
              ]}
            >
              {selectedValue === option && (
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
  radio: {
    width: 20,
    height: 20,
    borderWidth: 2,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  optionLabel: {
    fontSize: 16,
  },
})
