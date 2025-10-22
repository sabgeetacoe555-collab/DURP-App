import React, { useEffect, useState } from "react"
import { View, Text, StyleSheet, Pressable, ScrollView } from "react-native"
import { Ionicons } from "@expo/vector-icons"
import { useSessions } from "@/contexts/SessionsContext"

interface SessionsTabProps {
  groupId: string
  membersWithAccounts: any[]
  colors: any
}

export const SessionsTab: React.FC<SessionsTabProps> = ({
  groupId,
  membersWithAccounts,
  colors,
}) => {
  const {
    groupSessions,
    pastGroupSessions,
    groupSessionsLoading,
    refreshGroupSessions,
  } = useSessions()
  const [pastSessionsExpanded, setPastSessionsExpanded] = useState(false)

  useEffect(() => {
    const memberIds = membersWithAccounts.map((member) => member.id)
    refreshGroupSessions(groupId, memberIds)
  }, [groupId, membersWithAccounts, refreshGroupSessions])

  const currentGroupSessions = groupSessions[groupId] || []
  const currentPastGroupSessions = pastGroupSessions[groupId] || []
  const isLoading = groupSessionsLoading[groupId] || false

  return (
    <ScrollView
      style={styles.content}
      contentContainerStyle={styles.contentContainer}
      showsVerticalScrollIndicator={false}
    >
      {/* Upcoming Sessions */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>
          Upcoming Sessions
        </Text>
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <Text style={[styles.loadingText, { color: colors.text + "60" }]}>
              Loading sessions...
            </Text>
          </View>
        ) : currentGroupSessions.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="calendar-outline" size={48} color="#666" />
            <Text style={[styles.emptyTitle, { color: colors.text }]}>
              No upcoming sessions
            </Text>
            <Text
              style={[styles.emptyDescription, { color: colors.text + "60" }]}
            >
              Group members haven't created any sessions yet
            </Text>
          </View>
        ) : (
          <View style={styles.sessionsList}>
            {currentGroupSessions.map((session) => (
              <View key={session.id} style={styles.sessionCard}>
                <View style={styles.sessionHeader}>
                  <Text style={[styles.sessionTitle, { color: colors.text }]}>
                    {session.name || session.session_type}
                  </Text>
                  <Text
                    style={[
                      styles.sessionDateTime,
                      { color: colors.text + "60" },
                    ]}
                  >
                    {new Date(session.date).toLocaleDateString()} •{" "}
                    {new Date(session.date).toLocaleTimeString()}
                  </Text>
                </View>
                {session.location && (
                  <Text
                    style={[
                      styles.sessionLocation,
                      { color: colors.text + "60" },
                    ]}
                  >
                    📍 {session.location}
                  </Text>
                )}
              </View>
            ))}
          </View>
        )}
      </View>

      {/* Past Sessions */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            Past Sessions
          </Text>
          {currentPastGroupSessions.length > 0 && (
            <Pressable
              style={styles.expandButton}
              onPress={() => setPastSessionsExpanded(!pastSessionsExpanded)}
            >
              <Ionicons
                name={pastSessionsExpanded ? "chevron-up" : "chevron-down"}
                size={20}
                color="#666"
              />
            </Pressable>
          )}
        </View>
        {currentPastGroupSessions.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="time-outline" size={48} color="#666" />
            <Text style={[styles.emptyTitle, { color: colors.text }]}>
              No past sessions
            </Text>
            <Text
              style={[styles.emptyDescription, { color: colors.text + "60" }]}
            >
              Completed sessions will appear here
            </Text>
          </View>
        ) : pastSessionsExpanded ? (
          <View style={styles.sessionsList}>
            {currentPastGroupSessions.map((session) => (
              <View key={session.id} style={styles.sessionCard}>
                <View style={styles.sessionHeader}>
                  <Text style={[styles.sessionTitle, { color: colors.text }]}>
                    {session.name || session.session_type}
                  </Text>
                  <Text
                    style={[
                      styles.sessionDateTime,
                      { color: colors.text + "60" },
                    ]}
                  >
                    {new Date(session.date).toLocaleDateString()} •{" "}
                    {new Date(session.date).toLocaleTimeString()}
                  </Text>
                </View>
                {session.location && (
                  <Text
                    style={[
                      styles.sessionLocation,
                      { color: colors.text + "60" },
                    ]}
                  >
                    📍 {session.location}
                  </Text>
                )}
              </View>
            ))}
          </View>
        ) : (
          <View style={styles.collapsedContainer}>
            <Text style={[styles.collapsedText, { color: colors.text + "60" }]}>
              {currentPastGroupSessions.length} past session
              {currentPastGroupSessions.length !== 1 ? "s" : ""}
            </Text>
          </View>
        )}
      </View>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  content: {
    flex: 1,
    padding: 20,
  },
  contentContainer: {
    paddingBottom: 100, // Space for sticky button
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
  },
  expandButton: {
    padding: 4,
  },
  loadingContainer: {
    alignItems: "center",
    paddingVertical: 20,
  },
  loadingText: {
    fontSize: 16,
    marginTop: 8,
  },
  emptyContainer: {
    alignItems: "center",
    paddingVertical: 40,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginTop: 16,
    marginBottom: 8,
  },
  emptyDescription: {
    fontSize: 16,
    textAlign: "center",
  },
  sessionsList: {
    gap: 12,
  },
  sessionCard: {
    padding: 16,
    backgroundColor: "white",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#e0e0e0",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  sessionHeader: {
    marginBottom: 8,
  },
  sessionTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 4,
  },
  sessionDateTime: {
    fontSize: 14,
  },
  sessionLocation: {
    fontSize: 14,
  },
  collapsedContainer: {
    padding: 16,
    backgroundColor: "#f8f8f8",
    borderRadius: 8,
    alignItems: "center",
  },
  collapsedText: {
    fontSize: 14,
  },
})
