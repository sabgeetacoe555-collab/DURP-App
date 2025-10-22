import React, { useState } from "react"
import { StyleSheet, Pressable, View, Modal, Platform } from "react-native"
import { Text } from "@/components/Themed"
import DateTimePicker from "@react-native-community/datetimepicker"
import { Ionicons } from "@expo/vector-icons"
import { useColorScheme } from "@/components/useColorScheme"
import Colors from "@/constants/Colors"

interface DatePickerProps {
  date: Date
  onDateChange: (date: Date) => void
  label: string
}

export default function DatePicker({
  date,
  onDateChange,
  label,
}: DatePickerProps) {
  const colors = useColorScheme()
  const [showDatePicker, setShowDatePicker] = useState(false)

  const handleDateChange = (event: any, selectedDate?: Date) => {
    setShowDatePicker(Platform.OS === "ios") // Keep picker open on iOS for spinner, close on Android
    if (selectedDate) {
      onDateChange(selectedDate)
    }
  }

  const formatDate = (date: Date) => {
    return date.toLocaleDateString([], {
      weekday: "short",
      month: "short",
      day: "numeric",
    })
  }

  return (
    <>
      <View style={styles.inputContainer}>
        <Text style={[styles.label, { color: colors.text }]}>{label}</Text>
        <Pressable
          style={[styles.dateButton, { borderColor: colors.text + "30" }]}
          onPress={() => setShowDatePicker(true)}
        >
          <Ionicons name="calendar-outline" size={20} color={colors.text} />
          <Text style={[styles.dateText, { color: colors.text }]}>
            {formatDate(date)}
          </Text>
        </Pressable>
      </View>

      {/* Date Picker Modal */}
      <Modal
        visible={showDatePicker}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowDatePicker(false)}
      >
        <View style={styles.pickerOverlay}>
          <View
            style={[
              styles.pickerContainer,
              { backgroundColor: colors.background },
            ]}
          >
            <View
              style={[
                styles.pickerHeader,
                { borderBottomColor: colors.text + "20" },
              ]}
            >
              <Pressable onPress={() => setShowDatePicker(false)}>
                <Text style={[styles.pickerButton, { color: colors.tint }]}>
                  Cancel
                </Text>
              </Pressable>
              <Text style={[styles.pickerTitle, { color: colors.text }]}>
                Select Date
              </Text>
              <Pressable onPress={() => setShowDatePicker(false)}>
                <Text style={[styles.pickerButton, { color: colors.tint }]}>
                  Done
                </Text>
              </Pressable>
            </View>
            <View style={styles.pickerContent}>
              <DateTimePicker
                value={date}
                mode="date"
                display={Platform.OS === "ios" ? "spinner" : "default"}
                onChange={handleDateChange}
                minimumDate={new Date()}
                style={styles.picker}
              />
            </View>
          </View>
        </View>
      </Modal>
    </>
  )
}

const styles = StyleSheet.create({
  inputContainer: {
    marginBottom: 16,
  },
  label: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 8,
  },
  dateButton: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
  },
  dateText: {
    fontSize: 16,
    fontWeight: "500",
  },
  pickerOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  pickerContainer: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: 34, // Safe area
  },
  pickerHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  pickerButton: {
    fontSize: 16,
    fontWeight: "600",
  },
  pickerTitle: {
    fontSize: 18,
    fontWeight: "600",
  },
  pickerContent: {
    padding: 20,
  },
  picker: {
    height: Platform.OS === "ios" ? 250 : 200,
  },
})
