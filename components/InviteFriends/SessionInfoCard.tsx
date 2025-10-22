import React from "react"
import { View, Text } from "react-native"
import { useColorScheme } from "../../components/useColorScheme"

interface SessionInfoCardProps {
  sessionData: any
  formatDate: (date: Date | string) => string
  formatTime: (time: Date | string) => string
}

export default function SessionInfoCard({
  sessionData,
  formatDate,
  formatTime,
}: SessionInfoCardProps) {
  const colors = useColorScheme()

  if (!sessionData) {
    return (
      <View style={styles.sessionInfoSection}>
        <View style={styles.emptyContainer}>
          <Text style={[styles.emptyText, { color: colors.text }]}>
            Session details not found.
          </Text>
        </View>
      </View>
    )
  }

  return (
    <View style={styles.sessionInfoSection}>
      <View style={[styles.sessionInfoCard, { borderColor: colors.tint }]}>
        <Text style={[styles.sessionTitle, { color: colors.text }]}>
          {sessionData.session_type || sessionData.name || "Pickleball Session"}
        </Text>
        <Text style={[styles.sessionDetails, { color: colors.text }]}>
          {formatDate(sessionData.session_datetime)} •{" "}
          {formatTime(sessionData.session_datetime)} -{" "}
          {formatTime(sessionData.end_datetime)}
        </Text>
        <Text style={[styles.sessionDetails, { color: colors.text }]}>
          📍 {sessionData.location}
        </Text>
      </View>
    </View>
  )
}

const styles = {
  sessionInfoSection: {
    marginBottom: 20,
  },
  sessionInfoCard: {
    backgroundColor: "white",
    borderRadius: 12,
    padding: 16,
    borderWidth: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sessionTitle: {
    fontSize: 18,
    fontWeight: "600" as const,
    marginBottom: 8,
  },
  sessionDetails: {
    fontSize: 14,
    marginBottom: 4,
    opacity: 0.8,
  },
  emptyContainer: {
    padding: 20,
    alignItems: "center" as const,
  },
  emptyText: {
    fontSize: 16,
    textAlign: "center" as const,
    opacity: 0.6,
  },
}
