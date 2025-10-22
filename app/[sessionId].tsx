import React, { useEffect, useState } from "react"
import { useRouter, useLocalSearchParams } from "expo-router"
import {
  View,
  Text,
  ActivityIndicator,
  StyleSheet,
  SafeAreaView,
  Pressable,
} from "react-native"
import { Ionicons } from "@expo/vector-icons"
import { sessionService } from "@/services/sessionService"
import { groupsService } from "@/services/groupsService"
import { Session, Group } from "@/types"
import { useAuth } from "@/hooks/useAuth"
import { SessionInvite } from "@/components/invites/SessionInvite"
import { GroupInvite } from "@/components/invites/GroupInvite"

export default function InviteHandler() {
  const router = useRouter()
  const { sessionId, phone, invite } = useLocalSearchParams<{
    sessionId: string
    phone?: string
    invite?: string
  }>()
  const { user } = useAuth()

  // Log all the parameters we receive
  console.log("🔗 [sessionId].tsx - Received parameters:")
  console.log("  sessionId:", sessionId)
  console.log("  phone:", phone)
  console.log("  invite:", invite)
  console.log("  user:", user?.id)

  // Check if this is a group invite
  const isGroupInvite = sessionId.startsWith("g-")
  const actualId = isGroupInvite ? sessionId.substring(2) : sessionId

  console.log("🔍 [sessionId].tsx - Parsed values:")
  console.log("  isGroupInvite:", isGroupInvite)
  console.log("  actualId:", actualId)

  const [sessionData, setSessionData] = useState<Session | null>(null)
  const [groupData, setGroupData] = useState<Group | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const handleInvite = async () => {
      if (!sessionId) {
        setError("Invalid Invitation - This invitation link is invalid.")
        setLoading(false)
        return
      }

      // Check if this is a temporary session ID (sent via SMS before session was saved)
      if (!isGroupInvite && sessionId.startsWith("temp-")) {
        setError(
          "Session Not Yet Available - This session hasn't been saved yet. Please ask the host to save the session first, or try again later."
        )
        setLoading(false)
        return
      }

      try {
        setLoading(true)

        if (isGroupInvite) {
          // Handle group invite
          console.log(
            "🔍 [sessionId].tsx - Loading group data for ID:",
            actualId
          )
          console.log(
            "🔍 [sessionId].tsx - Calling groupsService.getGroupByIdForInvite with:",
            actualId
          )

          const group = await groupsService.getGroupByIdForInvite(actualId)
          console.log("🔍 [sessionId].tsx - Group data received:", group)

          if (group) {
            console.log("✅ [sessionId].tsx - Group found, setting group data")
            setGroupData(group)
          } else {
            console.log("❌ [sessionId].tsx - Group not found, setting error")
            setError(
              "Group Not Found - This group may have been deleted or is no longer available."
            )
          }
        } else {
          // Handle session invite
          console.log("Loading session data for ID:", actualId)
          const session = await sessionService.getSessionById(actualId)
          console.log("Session data:", session)

          if (session) {
            setSessionData(session)
          } else {
            setError(
              "Session Not Found - This session may have been cancelled or is no longer available."
            )
          }
        }
      } catch (error) {
        console.error("Error handling invite:", error)
        setError("Unable to load details. Please try again.")
      } finally {
        setLoading(false)
      }
    }

    handleInvite()
  }, [sessionId, actualId, isGroupInvite])

  // Show loading state
  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#0080C0" />
          <Text style={styles.loadingText}>
            Loading {isGroupInvite ? "group" : "session"} details...
          </Text>
        </View>
      </SafeAreaView>
    )
  }

  // Show error state
  if (error || (!sessionData && !groupData)) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle-outline" size={48} color="#FF6B6B" />
          <Text style={styles.errorText}>
            {error || `${isGroupInvite ? "Group" : "Session"} not found`}
          </Text>
          <Pressable style={styles.backButton} onPress={() => router.back()}>
            <Text style={styles.backButtonText}>Go Back</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    )
  }

  // Render the appropriate invite component
  if (isGroupInvite && groupData) {
    return (
      <GroupInvite
        groupId={actualId}
        groupData={groupData}
        onError={setError}
      />
    )
  }

  if (!isGroupInvite && sessionData) {
    return (
      <SessionInvite
        sessionId={actualId}
        phone={phone}
        invite={invite}
        sessionData={sessionData}
        onError={setError}
      />
    )
  }

  // Fallback
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.errorContainer}>
        <Ionicons name="alert-circle-outline" size={48} color="#FF6B6B" />
        <Text style={styles.errorText}>Unable to load invite details</Text>
        <Pressable style={styles.backButton} onPress={() => router.back()}>
          <Text style={styles.backButtonText}>Go Back</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: "#666",
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
  },
  errorText: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
    marginTop: 16,
    marginBottom: 24,
  },
  backButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    backgroundColor: "#4A90E2",
    borderRadius: 8,
  },
  backButtonText: {
    fontSize: 16,
    color: "white",
    fontWeight: "500",
  },
})
