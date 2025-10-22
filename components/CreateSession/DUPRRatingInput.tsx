import React from "react"
import { StyleSheet, TextInput, View } from "react-native"
import { Text } from "@/components/Themed"
import { useColorScheme } from "@/components/useColorScheme"

interface DUPRRatingInputProps {
  value: number | null
  onChange: (value: number | null) => void
  label: string
}

export default function DUPRRatingInput({
  value,
  onChange,
  label,
}: DUPRRatingInputProps) {
  const colors = useColorScheme()

  const handleChange = (text: string) => {
    const numValue = parseFloat(text)
    if (text === "" || (!isNaN(numValue) && numValue >= 0 && numValue <= 10)) {
      onChange(text === "" ? null : numValue)
    }
  }

  return (
    <View style={styles.inputContainer}>
      <Text style={[styles.label, { color: colors.text }]}>{label}</Text>
      <TextInput
        style={[
          styles.duprInput,
          {
            borderColor: colors.text + "30",
            color: colors.text,
            backgroundColor: colors.background,
          },
        ]}
        value={value ? value.toString() : ""}
        onChangeText={handleChange}
        placeholder="Any"
        placeholderTextColor={colors.text + "60"}
        keyboardType="numeric"
        returnKeyType="done"
      />
    </View>
  )
}

const styles = StyleSheet.create({
  inputContainer: {
    flex: 1,
  },
  label: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 8,
  },
  duprInput: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
    fontWeight: "500",
    textAlign: "center",
    minHeight: 48,
  },
})
