import React, { useState } from "react"
import { StyleSheet, Pressable, View, Modal, Platform } from "react-native"
import { Text } from "@/components/Themed"
import DateTimePicker from "@react-native-community/datetimepicker"
import { Ionicons } from "@expo/vector-icons"
import { useColorScheme } from "@/components/useColorScheme"

interface TimePickerProps {
  time: Date
  onTimeChange: (time: Date) => void
  label: string
}

export default function TimePicker({
  time,
  onTimeChange,
  label,
}: TimePickerProps) {
  const colors = useColorScheme()
  const [showTimePicker, setShowTimePicker] = useState(false)

  const handleTimeChange = (event: any, selectedTime?: Date) => {
    setShowTimePicker(false)
    if (selectedTime) {
      // Round to nearest 15-minute increment
      const minutes = selectedTime.getMinutes()
      const roundedMinutes = Math.round(minutes / 15) * 15
      const roundedTime = new Date(selectedTime)
      roundedTime.setMinutes(roundedMinutes, 0, 0) // Reset seconds and milliseconds
      onTimeChange(roundedTime)
    }
  }

  const formatTime = (time: Date) => {
    return time.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
  }

  return (
    <>
      <View style={styles.inputContainer}>
        <Text style={[styles.label, { color: colors.text }]}>{label}</Text>
        <Pressable
          style={[styles.timeButton, { borderColor: colors.text + "30" }]}
          onPress={() => setShowTimePicker(true)}
        >
          <Ionicons name="time-outline" size={20} color={colors.text} />
          <Text style={[styles.timeText, { color: colors.text }]}>
            {formatTime(time)}
          </Text>
        </Pressable>
      </View>

      {/* Time Picker Modal */}
      <Modal
        visible={showTimePicker}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowTimePicker(false)}
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
              <Pressable onPress={() => setShowTimePicker(false)}>
                <Text style={[styles.pickerButton, { color: colors.tint }]}>
                  Cancel
                </Text>
              </Pressable>
              <Text style={[styles.pickerTitle, { color: colors.text }]}>
                Select Time
              </Text>
              <Pressable onPress={() => setShowTimePicker(false)}>
                <Text style={[styles.pickerButton, { color: colors.tint }]}>
                  Done
                </Text>
              </Pressable>
            </View>
            <View style={styles.pickerContent}>
              <DateTimePicker
                value={time}
                mode="time"
                display={Platform.OS === "ios" ? "spinner" : "default"}
                onChange={handleTimeChange}
                style={styles.picker}
                minuteInterval={15}
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
  timeButton: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
  },
  timeText: {
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
