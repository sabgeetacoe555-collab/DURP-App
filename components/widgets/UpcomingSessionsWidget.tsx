import React from "react"
import { StyleSheet, Pressable, View } from "react-native"
import { Text } from "@/components/Themed"
import { useSessions } from "@/contexts/SessionsContext"
import { Ionicons } from "@expo/vector-icons"
import { useRouter } from "expo-router"

export default function UpcomingSessionsWidget() {
  const { getUpcomingSessions, loading } = useSessions()
  const router = useRouter()

  const sessions = getUpcomingSessions(3)

  const formatSessionTime = (sessionDatetime: string) => {
    const date = new Date(sessionDatetime)
    return (
      date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      }) +
      " • " +
      date.toLocaleTimeString("en-US", {
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
      })
    )
  }

  const handleSessionPress = (sessionId: string) => {
    router.push(`/(tabs)/widgets/SessionDetails?sessionId=${sessionId}`)
  }

  const handleViewAll = () => {
    router.push("/(tabs)/sessions")
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Upcoming Sessions</Text>
        {sessions.length > 0 && (
          <Pressable style={styles.viewAllButton} onPress={handleViewAll}>
            <Text style={styles.viewAllText}>View All</Text>
          </Pressable>
        )}
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading sessions...</Text>
        </View>
      ) : sessions.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="calendar-outline" size={32} color="#7f8c8d" />
          <Text style={styles.emptyText}>No upcoming sessions</Text>
          <Pressable
            style={styles.createButton}
            onPress={() => router.push("/(tabs)/widgets/CreateSession")}
          >
            <Text style={styles.createButtonText}>Create Session</Text>
          </Pressable>
        </View>
      ) : (
        <View style={styles.sessionsContainer}>
          {sessions.map((session) => (
            <Pressable
              key={session.id}
              style={styles.sessionItem}
              onPress={() => handleSessionPress(session.id)}
            >
              <View style={styles.sessionInfo}>
                <Text style={styles.sessionName}>
                  {session.name || session.session_type || "Session"}
                </Text>
                <Text style={styles.sessionTime}>
                  {formatSessionTime(session.date || "")}
                </Text>
                <Text style={styles.sessionLocation}>
                  {session.location || "Location not specified"}
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#7f8c8d" />
            </Pressable>
          ))}
        </View>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#f8f9fa",
    borderRadius: 12,
    padding: 16,
    marginVertical: 8,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#2c3e50",
  },
  viewAllButton: {
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  viewAllText: {
    fontSize: 14,
    color: "#007AFF",
    fontWeight: "500",
  },
  loadingContainer: {
    alignItems: "center",
    paddingVertical: 20,
  },
  loadingText: {
    fontSize: 16,
    color: "#7f8c8d",
    fontStyle: "italic",
  },
  emptyContainer: {
    alignItems: "center",
    paddingVertical: 20,
    gap: 12,
  },
  emptyText: {
    fontSize: 16,
    color: "#7f8c8d",
    textAlign: "center",
  },
  createButton: {
    backgroundColor: "#007AFF",
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 6,
    marginTop: 8,
  },
  createButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "600",
  },
  sessionsContainer: {
    gap: 8,
  },
  sessionItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 12,
    backgroundColor: "#FFFFFF",
    borderRadius: 8,
    marginBottom: 8,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  sessionInfo: {
    flex: 1,
  },
  sessionName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#2c3e50",
    marginBottom: 4,
  },
  sessionTime: {
    fontSize: 14,
    color: "#007AFF",
    fontWeight: "500",
    marginBottom: 2,
  },
  sessionLocation: {
    fontSize: 14,
    color: "#7f8c8d",
  },
})
