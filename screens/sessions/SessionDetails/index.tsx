import React, { useEffect, useState } from "react"
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  SafeAreaView,
  ActivityIndicator,
  Alert,
} from "react-native"
import { useRouter, useLocalSearchParams } from "expo-router"
import { Ionicons } from "@expo/vector-icons"
import { sessionService } from "@/services/sessionService"
import { Session } from "@/types"
import { useAuth } from "@/hooks/useAuth"
import { SessionMessages } from "@/screens/sessions/SessionDetails/SessionMessages"
import CustomHeader from "@/components/CustomHeader"
import { supabase } from "@/lib/supabase"
import { CreatePost } from "@/components/messages/CreatePost"
import { useColorScheme } from "@/components/useColorScheme"
import { SessionCard } from "./SessionCard"
import { ConfirmedParticipantsSection } from "./ConfirmedParticipantsSection"
import { MailPlus, UserPlus } from "lucide-react-native"

export default function SessionDetails() {
  const router = useRouter()
  const { sessionId } = useLocalSearchParams()
  const { user } = useAuth()
  const [sessionData, setSessionData] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)
  const [messagesLoading, setMessagesLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<"details" | "messages">("details")
  const [participantData, setParticipantData] = useState<{
    [key: string]: any
  }>({})
  const colors = useColorScheme()
  const [showCreatePost, setShowCreatePost] = useState(false)

  // Fetch participant user data
  const fetchParticipantData = async (session: Session) => {
    try {
      const userIds = [session.user_id] // Start with host

      // Add accepted participants
      if (session.accepted_participants) {
        userIds.push(...session.accepted_participants)
      }

      // Remove duplicates
      const uniqueUserIds = [...new Set(userIds)]

      if (uniqueUserIds.length > 0) {
        const { data: users, error } = await supabase
          .from("users")
          .select(
            "id, name, dupr_rating, dupr_rating_singles, dupr_rating_doubles"
          )
          .in("id", uniqueUserIds)

        if (error) {
          console.error("Error fetching participant data:", error)
          return
        }

        // Create a map of user data by ID
        const userDataMap: { [key: string]: any } = {}
        users?.forEach((user) => {
          userDataMap[user.id] = user
        })

        setParticipantData(userDataMap)
      }
    } catch (error) {
      console.error("Error in fetchParticipantData:", error)
    }
  }

  useEffect(() => {
    const loadSessionData = async () => {
      if (!sessionId) {
        setError("No session ID provided")
        setLoading(false)
        return
      }

      try {
        setLoading(true)
        const session = await sessionService.getSessionById(sessionId as string)
        console.log("Session data:", session)
        console.log("Location data:", {
          location: session?.location,
          location_lat: session?.location_lat,
          location_lng: session?.location_lng,
          location_display_address: session?.location_display_address,
        })
        setSessionData(session)

        // Fetch participant data after session is loaded
        if (session) {
          await fetchParticipantData(session)
        }
      } catch (err) {
        console.error("Error loading session:", err)
        setError("Failed to load session details")
        Alert.alert(
          "Error",
          "Unable to load session details. Please try again."
        )
      } finally {
        setLoading(false)
      }
    }

    loadSessionData()
  }, [sessionId])

  const handleJoinSession = () => {
    // Handle join session logic here
    console.log("Joining session:", sessionId)
    // For now, just close the modal
    router.back()
  }

  const handleBack = () => {
    router.back()
  }

  // Show loading state
  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <CustomHeader title="Session Details" showBackButton={false} />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#4A90E2" />
          <Text style={styles.loadingText}>Loading session details...</Text>
        </View>
      </SafeAreaView>
    )
  }

  // Show error state
  if (error || !sessionData) {
    return (
      <SafeAreaView style={styles.container}>
        <CustomHeader title="Session Details" showBackButton={false} />
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle-outline" size={48} color="#FF6B6B" />
          <Text style={styles.errorText}>{error || "Session not found"}</Text>
          <Pressable onPress={handleBack}>
            <Text style={styles.backButtonText}>Go Back</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={styles.container}>
      <CustomHeader title="Session Details" showBackButton={false} />

      <View style={styles.sessionTitleRow}>
        <Ionicons name="tennisball-outline" size={20} color="#4A90E2" />
        <Text style={styles.sessionTitle}>
          {sessionData.name || sessionData.session_type}
        </Text>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={{ paddingBottom: 120 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Session Card */}
        <SessionCard sessionData={sessionData} />

        {/* Focus Areas */}
        {sessionData.focus_type && sessionData.focus_type.length > 0 && (
          <View style={styles.focusSection}>
            <Text style={styles.focusTitle}>Focus Areas</Text>
            <View style={styles.focusCard}>
              {sessionData.focus_type.map((focus, index) => (
                <Text key={index} style={styles.focusText}>
                  • {focus}
                </Text>
              ))}
            </View>
          </View>
        )}

        {/* Confirmed Participants Section */}
        {/* <ConfirmedParticipantsSection
          sessionData={sessionData}
          participantData={participantData}
        /> */}

        {/* Messages Tab */}
        <SessionMessages
          sessionId={sessionId as string}
          isMessagesLoaded={() => setMessagesLoading(false)}
        />
      </ScrollView>

      {/* FABs Container */}
      <View style={styles.fabsContainer}>
        {/* Invite More People FAB - Only show for host */}
        {user && sessionData && user.id === sessionData.user_id && (
          <Pressable
            style={[styles.inviteFab, { backgroundColor: "#28a745" }]}
            onPress={() =>
              router.push(
                `/(tabs)/sessions/InviteFriends?sessionId=${sessionId}`
              )
            }
          >
            <UserPlus size={24} color="white" />
            {/* <Ionicons name="person-add" size={24} color="white" /> */}
          </Pressable>
        )}

        {/* Create Post FAB */}
        <Pressable
          style={[styles.createPostButton, { backgroundColor: colors.tint }]}
          onPress={() => setShowCreatePost(true)}
        >
          <MailPlus size={24} color="white" />
          {/* <Ionicons name="add" size={24} color="white" /> */}
        </Pressable>
      </View>

      {/* Create Post Modal */}
      <CreatePost
        visible={showCreatePost}
        onClose={() => setShowCreatePost(false)}
        onSubmit={async () => {}} //handleCreatePost
        submitting={false}
        colors={colors}
      />

      {/* Action Buttons - Only for non-hosts who haven't joined */}
      {user &&
        sessionData &&
        user.id !== sessionData.user_id &&
        !sessionData.accepted_participants?.includes(user.id) &&
        activeTab === "details" && (
          <View style={styles.actionButtonContainer}>
            <Pressable style={styles.joinButton} onPress={handleJoinSession}>
              <Text style={styles.joinButtonText}>Join Session</Text>
            </Pressable>
          </View>
        )}
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#ffffff",
    paddingBottom: 120,
  },
  scrollView: {
    flex: 1,
  },
  sessionTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    // marginBottom: 8,
    gap: 12,
    backgroundColor: "white",
    padding: 20,
    borderWidth: 1,
    borderColor: "#e0e0e0",
  },
  sessionTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: "#333",
  },
  focusSection: {
    backgroundColor: "white",
    marginHorizontal: 20,
    marginBottom: 16,
    borderRadius: 16,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  focusTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#333",
    marginBottom: 12,
  },
  focusCard: {
    backgroundColor: "#f8f9fa",
    padding: 12,
    borderRadius: 8,
  },
  focusText: {
    fontSize: 16,
    color: "#333",
    marginBottom: 4,
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
  backButtonText: {
    fontSize: 16,
    color: "#4A90E2",
    fontWeight: "500",
  },
  actionButtonContainer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "white",
    paddingHorizontal: 20,
    paddingVertical: 16,
    paddingBottom: 32,
    borderTopWidth: 1,
    borderTopColor: "#f0f0f0",
  },
  joinButton: {
    backgroundColor: "#4A90E2",
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: "center",
  },
  joinButtonText: {
    color: "white",
    fontSize: 18,
    fontWeight: "600",
  },
  fabsContainer: {
    position: "absolute",
    bottom: 20,
    right: 20,
    flexDirection: "column",
    gap: 12,
  },
  createPostButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  inviteFab: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
})
