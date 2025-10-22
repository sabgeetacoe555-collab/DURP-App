import React from "react"
import { View, Text, StyleSheet } from "react-native"
import { useAuth } from "@/contexts/AuthContext"

export default function StartupDebug() {
  const { user, isLoading, isStartupComplete, startupProgress } = useAuth()

  // Only show in development
  if (__DEV__) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Startup Debug Info</Text>
        <Text style={styles.text}>
          User: {user ? "Logged in" : "Not logged in"}
        </Text>
        <Text style={styles.text}>Loading: {isLoading ? "Yes" : "No"}</Text>
        <Text style={styles.text}>
          Startup Complete: {isStartupComplete ? "Yes" : "No"}
        </Text>
        {startupProgress && (
          <>
            <Text style={styles.text}>
              Progress: {startupProgress.step} ({startupProgress.progress}/
              {startupProgress.total})
            </Text>
            {startupProgress.stepDuration !== undefined && (
              <Text style={styles.text}>
                Step: {startupProgress.stepDuration}ms
              </Text>
            )}
            {startupProgress.totalDuration !== undefined && (
              <Text style={styles.text}>
                Total: {startupProgress.totalDuration}ms
              </Text>
            )}
          </>
        )}
      </View>
    )
  }

  return null
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    top: 50,
    right: 10,
    backgroundColor: "rgba(0,0,0,0.8)",
    padding: 10,
    borderRadius: 5,
    zIndex: 1000,
  },
  title: {
    color: "white",
    fontWeight: "bold",
    fontSize: 12,
    marginBottom: 5,
  },
  text: {
    color: "white",
    fontSize: 10,
    marginBottom: 2,
  },
})
