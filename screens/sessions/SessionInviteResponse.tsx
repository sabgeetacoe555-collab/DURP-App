import React, { useState, useEffect } from "react"
import {
  StyleSheet,
  View,
  Text,
  Pressable,
  ScrollView,
  Alert,
  ActivityIndicator,
} from "react-native"
import { useRouter, useLocalSearchParams } from "expo-router"
import { Ionicons } from "@expo/vector-icons"
import { useColorScheme } from "@/components/useColorScheme"
import Colors from "@/constants/Colors"
import { sessionService } from "@/services/sessionService"
import CustomHeader from "@/components/CustomHeader"

type InviteResponse = "accepted" | "declined" | "maybe"

interface SessionInviteData {
  id: string
  status: string
  invited_at: string
  group_id?: string // Group created from session invites
  sessions: {
    id: string
    session_type: string
    location: string
    session_datetime: string
    end_datetime: string
    max_players: number
    allow_guests: boolean
    dupr_min?: number
    dupr_max?: number
    visibility: string
  }
  users: {
    id: string
    name: string
    email: string
  }
}

export default function SessionInviteResponse() {
  const router = useRouter()
  const params = useLocalSearchParams()
  const colors = useColorScheme()

  const inviteId = params.inviteId as string
  const [inviteData, setInviteData] = useState<SessionInviteData | null>(null)
  const [loading, setLoading] = useState(true)
  const [responding, setResponding] = useState(false)

  useEffect(() => {
    if (inviteId) {
      loadInviteData()
    }
  }, [inviteId])

  const loadInviteData = async () => {
    try {
      setLoading(true)
      // Get the specific invite data by ID (works for both internal and external invites)
      const invite = await sessionService.getSessionInviteById(inviteId)

      if (invite && invite.status === "pending") {
        setInviteData(invite as SessionInviteData)
      } else if (invite && invite.status !== "pending") {
        Alert.alert("Error", "This invitation has already been responded to")
        router.back()
      } else {
        Alert.alert("Error", "Invitation not found")
        router.back()
      }
    } catch (error) {
      console.error("Error loading invite:", error)
      Alert.alert("Error", "Failed to load invite details")
    } finally {
      setLoading(false)
    }
  }

  const handleResponse = async (response: InviteResponse) => {
    if (!inviteData) return

    try {
      setResponding(true)
      await sessionService.respondToSessionInvite(inviteId, response)

      // If accepted and there's a group, add user to the group
      if (response === "accepted" && inviteData.group_id) {
        try {
          await sessionService.addUserToGroupFromSessionInvite(
            inviteData.group_id,
            inviteData.users.id,
            inviteData.users.name || "Unknown",
            inviteData.users.email || undefined
          )
        } catch (groupError) {
          console.error("Error adding user to group:", groupError)
          // Don't fail the whole response if group addition fails
        }
      }

      let message = ""
      switch (response) {
        case "accepted":
          message = "You've accepted the invitation!"
          break
        case "declined":
          message = "You've declined the invitation"
          break
        case "maybe":
          message = "You've marked the invitation as maybe"
          break
      }

      Alert.alert("Response Sent", message, [
        {
          text: "OK",
          onPress: () => {
            // Navigate back to sessions list
            // Note: We navigate to sessions list instead of session details
            // because external invites may not have access to full session data due to RLS
            router.push("/(tabs)/sessions")
          },
        },
      ])
    } catch (error) {
      console.error("Error responding to invite:", error)
      Alert.alert("Error", "Failed to send response. Please try again.")
    } finally {
      setResponding(false)
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString("en-US", {
      weekday: "long",
      month: "long",
      day: "numeric",
      year: "numeric",
    })
  }

  const formatTime = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    })
  }

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    })
  }

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.tint} />
        <Text style={[styles.loadingText, { color: colors.text }]}>
          Loading invite details...
        </Text>
      </View>
    )
  }

  if (!inviteData) {
    return (
      <View style={styles.errorContainer}>
        <Text style={[styles.errorText, { color: colors.text }]}>
          Invite not found
        </Text>
      </View>
    )
  }

  const { sessions, users } = inviteData

  return (
    <View style={styles.container}>
      <CustomHeader title="Session Invitation" showBackButton={true} />

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Response Actions - Moved to Top */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            How would you like to respond?
          </Text>

          <View style={styles.responseButtons}>
            <Pressable
              style={[
                styles.responseButton,
                styles.acceptButton,
                { backgroundColor: colors.tint },
              ]}
              onPress={() => handleResponse("accepted")}
              disabled={responding}
            >
              <Ionicons name="checkmark-circle" size={24} color="white" />
              <Text style={styles.responseButtonText}>Accept</Text>
            </Pressable>

            <Pressable
              style={[
                styles.responseButton,
                styles.maybeButton,
                { borderColor: colors.tint, backgroundColor: "transparent" },
              ]}
              onPress={() => handleResponse("maybe")}
              disabled={responding}
            >
              <Ionicons name="help-circle" size={24} color={colors.tint} />
              <Text style={[styles.responseButtonText, { color: colors.tint }]}>
                Maybe
              </Text>
            </Pressable>

            <Pressable
              style={[
                styles.responseButton,
                styles.declineButton,
                { borderColor: "#ff6b6b", backgroundColor: "transparent" },
              ]}
              onPress={() => handleResponse("declined")}
              disabled={responding}
            >
              <Ionicons name="close-circle" size={24} color="#ff6b6b" />
              <Text style={[styles.responseButtonText, { color: "#ff6b6b" }]}>
                Decline
              </Text>
            </Pressable>
          </View>

          {responding && (
            <View style={styles.respondingContainer}>
              <ActivityIndicator size="small" color={colors.tint} />
              <Text style={[styles.respondingText, { color: colors.text }]}>
                Sending response...
              </Text>
            </View>
          )}
        </View>

        {/* Inviter Info */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            Invitation from
          </Text>
          <View style={[styles.inviterCard, { borderColor: colors.tint }]}>
            <Ionicons name="person-circle" size={40} color={colors.tint} />
            <View style={styles.inviterInfo}>
              <Text style={[styles.inviterName, { color: colors.text }]}>
                {users.name}
              </Text>
              <Text
                style={[styles.inviterEmail, { color: colors.text + "80" }]}
              >
                {users.email}
              </Text>
            </View>
          </View>
        </View>

        {/* Session Details */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            Session Details
          </Text>
          <View style={[styles.sessionCard, { borderColor: colors.tint }]}>
            <Text style={[styles.sessionTitle, { color: colors.text }]}>
              {sessions.session_type || "Pickleball Session"}
            </Text>

            <View style={styles.sessionDetailRow}>
              <Ionicons name="calendar" size={20} color={colors.tint} />
              <Text style={[styles.sessionDetailText, { color: colors.text }]}>
                {formatDate(sessions.session_datetime)}
              </Text>
            </View>

            <View style={styles.sessionDetailRow}>
              <Ionicons name="time" size={20} color={colors.tint} />
              <Text style={[styles.sessionDetailText, { color: colors.text }]}>
                {formatTime(sessions.session_datetime)} -{" "}
                {formatTime(sessions.end_datetime)}
              </Text>
            </View>

            <View style={styles.sessionDetailRow}>
              <Ionicons name="location" size={20} color={colors.tint} />
              <Text style={[styles.sessionDetailText, { color: colors.text }]}>
                {sessions.location}
              </Text>
            </View>

            <View style={styles.sessionDetailRow}>
              <Ionicons name="people" size={20} color={colors.tint} />
              <Text style={[styles.sessionDetailText, { color: colors.text }]}>
                Max {sessions.max_players} players
                {sessions.allow_guests ? " (guests welcome)" : ""}
              </Text>
            </View>

            {sessions.dupr_min || sessions.dupr_max ? (
              <View style={styles.sessionDetailRow}>
                <Ionicons name="trophy" size={20} color={colors.tint} />
                <Text
                  style={[styles.sessionDetailText, { color: colors.text }]}
                >
                  DUPR: {sessions.dupr_min || "Any"} -{" "}
                  {sessions.dupr_max || "Any"}
                </Text>
              </View>
            ) : null}
          </View>
        </View>

        {/* Additional Info */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            Additional Information
          </Text>
          <View style={[styles.infoCard, { borderColor: colors.text + "20" }]}>
            <Text style={[styles.infoText, { color: colors.text + "80" }]}>
              • You can change your response later by going to the session
              details
            </Text>
            <Text style={[styles.infoText, { color: colors.text + "80" }]}>
              • If you accept, you'll be added to the session participants
            </Text>
            <Text style={[styles.infoText, { color: colors.text + "80" }]}>
              • You'll receive updates about any changes to the session
            </Text>
          </View>
        </View>
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "white",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "white",
  },
  loadingText: {
    fontSize: 16,
    marginTop: 16,
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "white",
  },
  errorText: {
    fontSize: 16,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "600",
    marginBottom: 16,
  },
  inviterCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    backgroundColor: "#f8f9fa",
  },
  inviterInfo: {
    marginLeft: 16,
    flex: 1,
  },
  inviterName: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 4,
  },
  inviterEmail: {
    fontSize: 14,
  },
  sessionCard: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    backgroundColor: "#f8f9fa",
  },
  sessionTitle: {
    fontSize: 20,
    fontWeight: "600",
    marginBottom: 16,
  },
  sessionDetailRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  sessionDetailText: {
    fontSize: 16,
    marginLeft: 12,
    flex: 1,
  },
  responseButtons: {
    gap: 12,
  },
  responseButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 12,
    borderWidth: 2,
    gap: 8,
  },
  acceptButton: {
    borderWidth: 0,
  },
  maybeButton: {
    borderWidth: 2,
  },
  declineButton: {
    borderWidth: 2,
  },
  responseButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "white",
  },
  respondingContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 16,
    gap: 8,
  },
  respondingText: {
    fontSize: 14,
  },
  infoCard: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    backgroundColor: "#f8f9fa",
  },
  infoText: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 8,
  },
})
