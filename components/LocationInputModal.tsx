import React, { useState } from "react"
import { View, Text, Pressable, Modal, StyleSheet, Alert } from "react-native"
import { Ionicons } from "@expo/vector-icons"
import { useColorScheme } from "@/components/useColorScheme"
import Colors from "@/constants/Colors"
import SimpleLocationAutocomplete from "@/components/SimpleLocationAutocomplete"

interface LocationInputModalProps {
  visible: boolean
  onLocationSubmit: (location: string) => void
  onCancel: () => void
  onEnableLocation?: () => void
  title?: string
  message?: string
  hasLocationPermission?: boolean
}

export default function LocationInputModal({
  visible,
  onLocationSubmit,
  onCancel,
  onEnableLocation,
  title = "Location Needed",
  message = "To find games near you, please enter your city or enable location access.",
  hasLocationPermission = false,
}: LocationInputModalProps) {
  const [locationInput, setLocationInput] = useState("")
  const [loading, setLoading] = useState(false)
  const colorScheme = useColorScheme()
  const colors = useColorScheme()

  const handleSubmit = async () => {
    if (!locationInput.trim()) {
      Alert.alert("Error", "Please enter a city or location")
      return
    }

    setLoading(true)
    try {
      await onLocationSubmit(locationInput.trim())
      setLocationInput("")
    } finally {
      setLoading(false)
    }
  }

  const handleCancel = () => {
    setLocationInput("")
    onCancel()
  }

  const handleEnableLocation = () => {
    // Clear the input field when using current location
    setLocationInput("")
    if (onEnableLocation) {
      onEnableLocation()
    }
  }

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={handleCancel}
    >
      <View style={styles.overlay}>
        <View style={[styles.modal, { backgroundColor: colors.background }]}>
          {/* Header */}
          <View style={styles.header}>
            <Ionicons name="location-outline" size={32} color="#007AFF" />
            <Text style={[styles.title, { color: colors.text }]}>{title}</Text>
            <Text style={[styles.message, { color: colors.text }]}>
              {message}
            </Text>
          </View>

          {/* Manual Location Input */}
          <View style={styles.inputSection}>
            <Text style={[styles.inputLabel, { color: colors.text }]}>
              Enter your city or location:
            </Text>
            <SimpleLocationAutocomplete
              value={locationInput}
              onChangeText={setLocationInput}
              onLocationSelect={setLocationInput}
              placeholder="e.g., Austin, TX or New York"
            />
          </View>

          {/* Action Buttons */}
          <View style={styles.actions}>
            {onEnableLocation && (
              <Pressable
                style={[styles.button, styles.secondaryButton]}
                onPress={handleEnableLocation}
              >
                <Ionicons
                  name={hasLocationPermission ? "navigate" : "location"}
                  size={16}
                  color="#007AFF"
                />
                <Text style={styles.secondaryButtonText}>
                  {hasLocationPermission
                    ? "Use Current Location"
                    : "Enable Location"}
                </Text>
              </Pressable>
            )}

            <View style={styles.primaryActions}>
              <Pressable
                style={[styles.button, styles.cancelButton]}
                onPress={handleCancel}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </Pressable>

              <Pressable
                style={[
                  styles.button,
                  styles.submitButton,
                  loading && styles.buttonDisabled,
                ]}
                onPress={handleSubmit}
                disabled={loading}
              >
                <Text style={styles.submitButtonText}>
                  {loading ? "Searching..." : "Find Games"}
                </Text>
              </Pressable>
            </View>
          </View>
        </View>
      </View>
    </Modal>
  )
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  modal: {
    width: "100%",
    maxWidth: 400,
    borderRadius: 16,
    padding: 24,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  header: {
    alignItems: "center",
    marginBottom: 24,
  },
  title: {
    fontSize: 22,
    fontWeight: "600",
    marginTop: 12,
    marginBottom: 8,
    textAlign: "center",
  },
  message: {
    fontSize: 16,
    textAlign: "center",
    lineHeight: 22,
    opacity: 0.8,
  },
  inputSection: {
    marginBottom: 24,
    zIndex: 1000, // Ensure autocomplete suggestions appear above other elements
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: "500",
    marginBottom: 8,
  },
  actions: {
    gap: 12,
  },
  primaryActions: {
    flexDirection: "row",
    gap: 12,
  },
  button: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 12,
    minHeight: 50,
  },
  secondaryButton: {
    backgroundColor: "#e3f2fd",
    gap: 8,
  },
  secondaryButtonText: {
    color: "#007AFF",
    fontSize: 16,
    fontWeight: "500",
  },
  cancelButton: {
    backgroundColor: "#f5f5f5",
    flex: 1,
  },
  cancelButtonText: {
    color: "#666",
    fontSize: 16,
    fontWeight: "500",
  },
  submitButton: {
    backgroundColor: "#007AFF",
    flex: 2,
  },
  submitButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
  },
  buttonDisabled: {
    opacity: 0.6,
  },
})
