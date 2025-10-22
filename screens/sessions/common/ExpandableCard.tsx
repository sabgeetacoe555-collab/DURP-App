import React, { useState } from "react"
import { StyleSheet, Pressable } from "react-native"
import { Text, View } from "@/components/Themed"
import { Ionicons } from "@expo/vector-icons"
import { useColorScheme } from "@/components/useColorScheme"
import Colors from "@/constants/Colors"
import Card from "@/components/Card"

interface ExpandableCardProps {
  title: string
  options: string[]
  type: "radio" | "check"
  selectedValue?: string | null // for radio
  selectedValues?: string[] // for checkbox
  onSelectionChange: (value: string | string[]) => void
}

export default function ExpandableCard({
  title,
  options,
  type,
  selectedValue,
  selectedValues = [],
  onSelectionChange,
}: ExpandableCardProps) {
  const colors = useColorScheme()
  const [isExpanded, setIsExpanded] = useState(false)

  const handleSelection = (option: string) => {
    if (type === "radio") {
      onSelectionChange(option)
      // Auto-close for radio selections
      setIsExpanded(false)
    } else {
      // checkbox logic
      const currentValues = selectedValues || []
      const newValues = currentValues.includes(option)
        ? currentValues.filter((v) => v !== option)
        : [...currentValues, option]
      onSelectionChange(newValues)
      // Don't auto-close for checkboxes since users might want to select multiple
    }
  }

  const isSelected = (option: string) => {
    if (type === "radio") {
      return selectedValue === option
    } else {
      return selectedValues?.includes(option) || false
    }
  }

  const formatOptionText = (option: string) => {
    return option.charAt(0).toUpperCase() + option.slice(1)
  }

  // Generate dynamic title based on selection and expansion state
  const getDynamicTitle = () => {
    // Only show selected values when collapsed
    if (!isExpanded) {
      if (type === "radio") {
        if (selectedValue) {
          return formatOptionText(selectedValue)
        }
      } else {
        if (selectedValues && selectedValues.length > 0) {
          if (selectedValues.length === 1) {
            return formatOptionText(selectedValues[0])
          } else if (selectedValues.length === 2) {
            return `${formatOptionText(selectedValues[0])}, ${formatOptionText(
              selectedValues[1]
            )}`
          } else {
            return `${formatOptionText(selectedValues[0])} +${
              selectedValues.length - 1
            } more`
          }
        }
      }
    }
    // Always show original title when expanded
    return title
  }

  return (
    <Card
      title={getDynamicTitle()}
      expandable={true}
      expanded={isExpanded}
      onToggleExpanded={() => setIsExpanded(!isExpanded)}
    >
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
                type === "radio" ? styles.radio : styles.checkbox,
                {
                  borderColor: colors.tint,
                  backgroundColor: isSelected(option) ? colors.tint : "white",
                },
              ]}
            >
              {isSelected(option) && (
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
