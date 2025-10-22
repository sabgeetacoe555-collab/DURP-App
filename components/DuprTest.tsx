// components/DuprTest.tsx
import React, { useState } from "react"
import {
  View,
  Text,
  Button,
  Alert,
  TextInput,
  ScrollView,
  StyleSheet,
} from "react-native"
import { useDupr } from "../hooks/useDupr"
import type { DuprEvent } from "../types/dupr"

const DuprTest = () => {
  const [events, setEvents] = useState<DuprEvent[]>([])
  const [userEmail, setUserEmail] = useState("")
  const [userPassword, setUserPassword] = useState("")
  const [testResults, setTestResults] = useState<string[]>([])

  const {
    isLoading,
    error,
    getEvents,
    getUserRating,
    testConnection,
    refreshToken,
    inviteUser,
  } = useDupr()

  const addTestResult = (result: string) => {
    setTestResults((prev) => [
      ...prev,
      `${new Date().toLocaleTimeString()}: ${result}`,
    ])
  }

  const handleTestConnection = async () => {
    console.log("[DuprTest] Testing connection...")
    addTestResult("Testing DUPR API connection...")

    const success = await testConnection()
    console.log("[DuprTest] Connection test result:", { success, error })

    if (success) {
      addTestResult("✅ Connection test successful!")
      Alert.alert("Connection Test", "Success! DUPR API is accessible.")
    } else {
      addTestResult(`❌ Connection test failed: ${error}`)
      Alert.alert("Connection Test", `Failed: ${error}`)
    }
  }

  const handleRefreshToken = async () => {
    console.log("[DuprTest] Refreshing token...")
    addTestResult("Refreshing authentication token...")

    const success = await refreshToken()
    console.log("[DuprTest] Token refresh result:", { success, error })

    if (success) {
      addTestResult("✅ Token refresh successful!")
      Alert.alert("Token Refresh", "Success! Authentication token refreshed.")
    } else {
      addTestResult(`❌ Token refresh failed: ${error}`)
      Alert.alert("Token Refresh", `Failed: ${error}`)
    }
  }

  const handleGetEvents = async () => {
    console.log("[DuprTest] Getting events...")
    addTestResult("Fetching DUPR events...")

    const eventList = await getEvents()
    console.log("[DuprTest] Get events result:", {
      success: !!eventList,
      count: eventList?.length,
      error,
    })

    if (eventList) {
      setEvents(eventList)
      addTestResult(`✅ Found ${eventList.length} events`)
      Alert.alert("Success", `Found ${eventList.length} events`)
    } else {
      addTestResult(`❌ Failed to fetch events: ${error}`)
      Alert.alert("Error", error || "Failed to fetch events")
    }
  }

  const handleGetRating = async () => {
    console.log("[DuprTest] Getting user rating...")
    addTestResult("Fetching user rating...")

    const rating = await getUserRating()
    console.log("[DuprTest] Get rating result:", {
      success: !!rating,
      rating: rating?.provisionalRating,
      error,
    })

    if (rating) {
      addTestResult(`✅ User rating: ${rating.provisionalRating}`)
      Alert.alert("Rating", `Your rating: ${rating.provisionalRating}`)
    } else {
      addTestResult(`❌ Failed to fetch rating: ${error}`)
      Alert.alert("Error", error || "Failed to fetch rating")
    }
  }

  const handleInviteUser = async () => {
    if (!userEmail) {
      Alert.alert("Error", "Please enter an email address")
      return
    }

    console.log("[DuprTest] Inviting user...")
    addTestResult(`Inviting user: ${userEmail}`)

    const inviteData = {
      email: userEmail,
      firstName: "Test",
      lastName: "User",
      message: "You've been invited to join our pickleball community!",
    }

    const success = await inviteUser(inviteData)
    console.log("[DuprTest] Invite result:", { success, error })

    if (success) {
      addTestResult(`✅ User invitation sent to ${userEmail}`)
      Alert.alert("Success", `Invitation sent to ${userEmail}`)
      setUserEmail("")
    } else {
      addTestResult(`❌ Failed to invite user: ${error}`)
      Alert.alert("Error", error || "Failed to send invitation")
    }
  }

  const clearResults = () => {
    setTestResults([])
  }

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>DUPR API Test</Text>

      {/* Authentication Tests */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Authentication</Text>
        <Button
          title="Test Connection"
          onPress={handleTestConnection}
          disabled={isLoading}
        />
        <Button
          title="Refresh Token"
          onPress={handleRefreshToken}
          disabled={isLoading}
        />
      </View>

      {/* API Tests */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>API Tests</Text>
        <Button
          title="Get Events"
          onPress={handleGetEvents}
          disabled={isLoading}
        />
        <Button
          title="Get My Rating"
          onPress={handleGetRating}
          disabled={isLoading}
        />
      </View>

      {/* User Invitation */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>User Invitation</Text>
        <TextInput
          style={styles.input}
          placeholder="Enter email address"
          value={userEmail}
          onChangeText={setUserEmail}
          keyboardType="email-address"
          autoCapitalize="none"
        />
        <Button
          title="Invite User"
          onPress={handleInviteUser}
          disabled={isLoading || !userEmail}
        />
      </View>

      {/* Status */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Status</Text>
        {isLoading && <Text style={styles.loading}>Loading...</Text>}
        {error && <Text style={styles.error}>Error: {error}</Text>}
        <Text style={styles.info}>Events found: {events.length}</Text>
      </View>

      {/* Test Results */}
      <View style={styles.section}>
        <View style={styles.resultsHeader}>
          <Text style={styles.sectionTitle}>Test Results</Text>
          <Button title="Clear" onPress={clearResults} />
        </View>
        <View style={styles.resultsContainer}>
          {testResults.map((result, index) => (
            <Text key={index} style={styles.resultText}>
              {result}
            </Text>
          ))}
          {testResults.length === 0 && (
            <Text style={styles.noResults}>No test results yet</Text>
          )}
        </View>
      </View>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 15,
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 20,
    textAlign: "center",
  },
  section: {
    marginBottom: 20,
    padding: 15,
    backgroundColor: "rgba(0,0,0,0.05)",
    borderRadius: 8,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 10,
  },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 4,
    padding: 10,
    marginBottom: 10,
    backgroundColor: "white",
  },
  loading: {
    color: "blue",
    fontStyle: "italic",
  },
  error: {
    color: "red",
    marginBottom: 10,
  },
  info: {
    color: "green",
    fontWeight: "500",
  },
  resultsHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  resultsContainer: {
    maxHeight: 200,
    backgroundColor: "rgba(0,0,0,0.02)",
    padding: 10,
    borderRadius: 4,
  },
  resultText: {
    fontSize: 12,
    marginBottom: 2,
    fontFamily: "monospace",
  },
  noResults: {
    fontStyle: "italic",
    color: "#666",
    textAlign: "center",
  },
})

export default DuprTest
