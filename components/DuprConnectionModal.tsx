import React, { useState } from "react"
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  Alert,
  ActivityIndicator,
  ScrollView,
} from "react-native"
import { useColorScheme } from "@/components/useColorScheme"
import Colors from "@/constants/Colors"
import { useDupr } from "@/hooks/useDupr"
import { useAuth } from "@/hooks/useAuth"

interface DuprConnectionModalProps {
  visible: boolean
  onClose: () => void
  onSuccess?: (duprRating: number) => void
}

export default function DuprConnectionModal({
  visible,
  onClose,
  onSuccess,
}: DuprConnectionModalProps) {
  const colors = useColorScheme()
  const { authenticateUser, isLoading, error, clearError } = useDupr()
  const { user } = useAuth()

  const [email, setEmail] = useState("")
  const [connectionStatus, setConnectionStatus] = useState<{
    type: "success" | "error" | "info" | null
    message: string
  }>({ type: null, message: "" })

  const handleConnect = async () => {
    if (!email) {
      Alert.alert("Error", "Please enter your email address")
      return
    }

    setConnectionStatus({ type: "info", message: "Connecting to DUPR..." })
    clearError()

    try {
      const currentUserEmail = user?.email
      if (!currentUserEmail) {
        setConnectionStatus({
          type: "error",
          message: "Please log in to connect your DUPR account",
        })
        return
      }

      const success = await authenticateUser(email, currentUserEmail)

      if (success) {
        setConnectionStatus({
          type: "success",
          message: "Successfully connected to DUPR!",
        })

        // Clear form
        setEmail("")

        // Close modal after a short delay
        setTimeout(() => {
          onClose()
          setConnectionStatus({ type: null, message: "" })
        }, 2000)
      } else {
        setConnectionStatus({
          type: "error",
          message: error || "Authentication failed",
        })
      }
    } catch (error) {
      console.error("DUPR connection error:", error)
      setConnectionStatus({
        type: "error",
        message: "Connection failed. Please try again.",
      })
    }
  }

  const handleClose = () => {
    if (!isLoading) {
      setEmail("")
      setConnectionStatus({ type: null, message: "" })
      onClose()
    }
  }

  const getStatusColor = () => {
    switch (connectionStatus.type) {
      case "success":
        return "#4CAF50"
      case "error":
        return "#F44336"
      case "info":
        return colors.tint
      default:
        return colors.text
    }
  }

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={handleClose}
    >
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.header}>
          <Text style={[styles.title, { color: colors.text }]}>
            Connect DUPR Account
          </Text>
          <TouchableOpacity
            style={styles.closeButton}
            onPress={handleClose}
            disabled={isLoading}
          >
            <Text style={[styles.closeButtonText, { color: colors.text }]}>
              ✕
            </Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.descriptionContainer}>
            <Text style={[styles.description, { color: colors.text }]}>
              Connect your DUPR account using your email address to
              automatically sync your pickleball rating and access your
              tournament data.
            </Text>
          </View>

          <View style={styles.form}>
            <View style={styles.inputContainer}>
              <Text style={[styles.label, { color: colors.text }]}>
                Email Address
              </Text>
              <TextInput
                style={[
                  styles.input,
                  {
                    color: colors.text,
                    borderColor: colors.tabIconDefault,
                    backgroundColor:
                      colors.isDark ? "#1a1a1a" : "#f5f5f5",
                  },
                ]}
                placeholder="Enter your DUPR email"
                placeholderTextColor={colors.tabIconDefault}
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                editable={!isLoading}
              />
            </View>

            {connectionStatus.message && (
              <View style={styles.statusContainer}>
                <Text style={[styles.statusText, { color: getStatusColor() }]}>
                  {connectionStatus.message}
                </Text>
              </View>
            )}

            {connectionStatus.type !== "success" && (
              <TouchableOpacity
                style={[
                  styles.connectButton,
                  {
                    backgroundColor: isLoading
                      ? colors.tabIconDefault
                      : colors.tint,
                    opacity: isLoading ? 0.7 : 1,
                  },
                ]}
                onPress={handleConnect}
                disabled={isLoading || !email}
              >
                {isLoading ? (
                  <ActivityIndicator color={colors.background} />
                ) : (
                  <Text
                    style={[
                      styles.connectButtonText,
                      { color: colors.background },
                    ]}
                  >
                    Connect Account
                  </Text>
                )}
              </TouchableOpacity>
            )}
          </View>

          <View style={styles.footer}>
            <Text style={[styles.footerText, { color: colors.tabIconDefault }]}>
              Your email is securely transmitted to DUPR and your DUPR ID and
              ratings are stored in our system.
            </Text>
          </View>
        </ScrollView>
      </View>
    </Modal>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(0,0,0,0.1)",
  },
  title: {
    fontSize: 20,
    fontWeight: "600",
  },
  closeButton: {
    width: 32,
    height: 32,
    justifyContent: "center",
    alignItems: "center",
  },
  closeButtonText: {
    fontSize: 20,
    fontWeight: "500",
  },
  content: {
    flex: 1,
    padding: 20,
  },
  descriptionContainer: {
    marginBottom: 24,
  },
  description: {
    fontSize: 16,
    lineHeight: 24,
    textAlign: "center",
  },
  form: {
    marginBottom: 24,
  },
  inputContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: "500",
    marginBottom: 8,
  },
  input: {
    height: 50,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 16,
    fontSize: 16,
  },
  statusContainer: {
    marginBottom: 20,
    padding: 12,
    borderRadius: 8,
    backgroundColor: "rgba(0,0,0,0.05)",
  },
  statusText: {
    fontSize: 14,
    textAlign: "center",
    fontWeight: "500",
  },
  connectButton: {
    height: 50,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 8,
  },
  connectButtonText: {
    fontSize: 16,
    fontWeight: "600",
  },
  footer: {
    paddingTop: 20,
  },
  footerText: {
    fontSize: 12,
    textAlign: "center",
    lineHeight: 18,
  },
})
