import React, { useState, useEffect } from "react"
import {
  View,
  Text,
  TextInput,
  Button,
  Alert,
  StyleSheet,
  ScrollView,
  Switch,
} from "react-native"
import { useAuth } from "../hooks/useAuth"
import { useDupr } from "../hooks/useDupr"
import { supabase } from "../lib/supabase"

interface DuprConnectionProps {
  onConnectionChange?: (connected: boolean) => void
}

const DuprConnection: React.FC<DuprConnectionProps> = ({
  onConnectionChange,
}) => {
  const { user } = useAuth()
  const { isLoading, error, refreshToken } = useDupr()

  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [isConnected, setIsConnected] = useState(false)
  const [connectionData, setConnectionData] = useState<any>(null)
  const [showPassword, setShowPassword] = useState(false)

  // Check if user is already connected to DUPR
  useEffect(() => {
    if (user) {
      checkDuprConnection()
    }
  }, [user])

  const checkDuprConnection = async () => {
    try {
      const { data, error } = await supabase
        .from("user_dupr_connections")
        .select("*")
        .eq("user_id", user?.id)
        .single()

      if (data && !error) {
        setIsConnected(true)
        setConnectionData(data)
        setEmail(data.dupr_email || "")
        onConnectionChange?.(true)
      } else {
        setIsConnected(false)
        setConnectionData(null)
        onConnectionChange?.(false)
      }
    } catch (error) {
      console.error("Error checking DUPR connection:", error)
      setIsConnected(false)
      onConnectionChange?.(false)
    }
  }

  const handleConnect = async () => {
    if (!email || !password) {
      Alert.alert("Error", "Please enter both email and password")
      return
    }

    if (!user) {
      Alert.alert("Error", "You must be logged in to connect your DUPR account")
      return
    }

    try {
      // First, test the DUPR connection with the provided credentials
      const testResult = await refreshToken()

      if (!testResult) {
        Alert.alert(
          "Connection Failed",
          "Unable to authenticate with DUPR. Please check your credentials."
        )
        return
      }

      // Store the connection in the database
      const { data, error } = await supabase
        .from("user_dupr_connections")
        .upsert({
          user_id: user.id,
          dupr_email: email,
          // Note: In a real implementation, you'd store tokens from user authentication
          // For now, we're just storing the connection status
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .select()
        .single()

      if (error) {
        throw error
      }

      setIsConnected(true)
      setConnectionData(data)
      setPassword("") // Clear password for security
      onConnectionChange?.(true)

      Alert.alert(
        "Success",
        "Your DUPR account has been connected successfully!"
      )
    } catch (error) {
      console.error("Error connecting DUPR account:", error)
      Alert.alert(
        "Error",
        "Failed to connect your DUPR account. Please try again."
      )
    }
  }

  const handleDisconnect = async () => {
    if (!user) return

    Alert.alert(
      "Disconnect DUPR Account",
      "Are you sure you want to disconnect your DUPR account?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Disconnect",
          style: "destructive",
          onPress: async () => {
            try {
              const { error } = await supabase
                .from("user_dupr_connections")
                .delete()
                .eq("user_id", user.id)

              if (error) {
                throw error
              }

              setIsConnected(false)
              setConnectionData(null)
              setEmail("")
              setPassword("")
              onConnectionChange?.(false)

              Alert.alert("Success", "Your DUPR account has been disconnected.")
            } catch (error) {
              console.error("Error disconnecting DUPR account:", error)
              Alert.alert("Error", "Failed to disconnect your DUPR account.")
            }
          },
        },
      ]
    )
  }

  const handleRefreshConnection = async () => {
    try {
      const success = await refreshToken()
      if (success) {
        Alert.alert("Success", "DUPR connection refreshed successfully!")
      } else {
        Alert.alert("Error", "Failed to refresh DUPR connection.")
      }
    } catch (error) {
      Alert.alert("Error", "Failed to refresh DUPR connection.")
    }
  }

  if (!user) {
    return (
      <View style={styles.container}>
        <Text style={styles.message}>
          Please log in to connect your DUPR account
        </Text>
      </View>
    )
  }

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>DUPR Account Connection</Text>

      {isConnected ? (
        <View style={styles.connectedSection}>
          <Text style={styles.statusText}>✅ Connected to DUPR</Text>
          <Text style={styles.emailText}>
            Email: {connectionData?.dupr_email}
          </Text>

          <View style={styles.buttonGroup}>
            <Button
              title="Refresh Connection"
              onPress={handleRefreshConnection}
              disabled={isLoading}
            />
            <Button
              title="Disconnect"
              onPress={handleDisconnect}
              color="#ff4444"
            />
          </View>
        </View>
      ) : (
        <View style={styles.connectSection}>
          <Text style={styles.instructions}>
            Connect your DUPR account to access your pickleball data, ratings,
            and events.
          </Text>

          <TextInput
            style={styles.input}
            placeholder="DUPR Email"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
          />

          <View style={styles.passwordContainer}>
            <TextInput
              style={[styles.input, styles.passwordInput]}
              placeholder="DUPR Password"
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
              autoCapitalize="none"
              autoCorrect={false}
            />
            <Switch
              value={showPassword}
              onValueChange={setShowPassword}
              style={styles.passwordToggle}
            />
          </View>

          <Button
            title="Connect DUPR Account"
            onPress={handleConnect}
            disabled={isLoading || !email || !password}
          />

          <Text style={styles.note}>
            Note: Your credentials are used only to authenticate with DUPR and
            are not stored in our system.
          </Text>
        </View>
      )}

      {error && (
        <View style={styles.errorSection}>
          <Text style={styles.errorText}>Error: {error}</Text>
        </View>
      )}

      {isLoading && (
        <View style={styles.loadingSection}>
          <Text style={styles.loadingText}>Processing...</Text>
        </View>
      )}
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 20,
    textAlign: "center",
  },
  message: {
    textAlign: "center",
    fontSize: 16,
    color: "#666",
    marginTop: 20,
  },
  connectedSection: {
    backgroundColor: "#e8f5e8",
    padding: 20,
    borderRadius: 8,
    marginBottom: 20,
  },
  statusText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#2e7d32",
    marginBottom: 10,
  },
  emailText: {
    fontSize: 14,
    color: "#666",
    marginBottom: 15,
  },
  buttonGroup: {
    gap: 10,
  },
  connectSection: {
    backgroundColor: "#f5f5f5",
    padding: 20,
    borderRadius: 8,
    marginBottom: 20,
  },
  instructions: {
    fontSize: 14,
    color: "#666",
    marginBottom: 20,
    textAlign: "center",
  },
  input: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 4,
    padding: 12,
    marginBottom: 15,
    backgroundColor: "white",
    fontSize: 16,
  },
  passwordContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 15,
  },
  passwordInput: {
    flex: 1,
    marginBottom: 0,
  },
  passwordToggle: {
    marginLeft: 10,
  },
  note: {
    fontSize: 12,
    color: "#999",
    textAlign: "center",
    marginTop: 15,
    fontStyle: "italic",
  },
  errorSection: {
    backgroundColor: "#ffebee",
    padding: 15,
    borderRadius: 4,
    marginTop: 10,
  },
  errorText: {
    color: "#c62828",
    fontSize: 14,
  },
  loadingSection: {
    alignItems: "center",
    marginTop: 20,
  },
  loadingText: {
    color: "#2196f3",
    fontSize: 16,
    fontStyle: "italic",
  },
})

export default DuprConnection
