import React from "react"
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  Pressable,
  Alert,
} from "react-native"
import { Ionicons } from "@expo/vector-icons"
import MapView, { Marker, PROVIDER_GOOGLE } from "react-native-maps"
import { Session } from "@/types"
import { useAuth } from "@/hooks/useAuth"
import { supabase } from "@/lib/supabase"
import { sessionService } from "@/services/sessionService"
import { useRouter } from "expo-router"

interface SessionInviteProps {
  sessionId: string
  phone?: string
  invite?: string
  sessionData: Session
  onError: (error: string) => void
}

export const SessionInvite: React.FC<SessionInviteProps> = ({
  sessionId,
  phone,
  invite,
  sessionData,
  onError,
}) => {
  const router = useRouter()
  const { user } = useAuth()
  const isInvite = invite === "true" && !!phone

  const handleJoinSession = async () => {
    console.log("Joining session:", sessionId)

    if (isInvite) {
      try {
        // Find the invite by session ID and phone number
        const { data: invite, error: inviteError } = await supabase
          .from("session_invites")
          .select("id")
          .eq("session_id", sessionId)
          .eq("invitee_phone", phone)
          .eq("status", "pending")
          .single()

        if (inviteError) {
          console.error("Error finding invite:", inviteError)
          Alert.alert("Error", "Could not find invite. Please try again.")
          return
        }

        // Call API to accept invite
        await sessionService.respondToSessionInvite(invite.id, "accepted")
        console.log(
          "✅ Successfully accepted invite for session:",
          sessionId,
          "phone:",
          phone
        )
      } catch (error) {
        console.error("Error accepting invite:", error)
        Alert.alert("Error", "Failed to accept invite. Please try again.")
        return
      }
    }

    // Navigate to SessionDetails screen and clear deeplink data
    router.replace(`/(tabs)/sessions/SessionDetails?sessionId=${sessionId}`)
  }

  const handleDeclineInvite = async () => {
    console.log("Declining invite for session:", sessionId)

    try {
      // Find the invite by session ID and phone number
      const { data: invite, error: inviteError } = await supabase
        .from("session_invites")
        .select("id")
        .eq("session_id", sessionId)
        .eq("invitee_phone", phone)
        .eq("status", "pending")
        .single()

      if (inviteError) {
        console.error("Error finding invite:", inviteError)
        // Don't show alert for decline - just go back
      } else {
        // Call API to decline invite
        await sessionService.respondToSessionInvite(invite.id, "declined")
        console.log(
          "✅ Successfully declined invite for session:",
          sessionId,
          "phone:",
          phone
        )
      }
    } catch (error) {
      console.error("Error declining invite:", error)
      // Don't show alert for decline - just go back
    }

    // Navigate back to home and clear deeplink data
    router.replace("/(tabs)/sessions")
  }

  // Check if we have valid coordinates for the map - HARDCODED FOR TESTING
  const hasValidCoordinates = () => {
    // Always return true for testing
    console.log("DEBUG hasValidCoordinates - using hardcoded coordinates")
    return true
  }

  // Get map region - HARDCODED FOR TESTING
  const getMapRegion = () => {
    // Hardcoded coordinates for Meridian, Idaho (from your session data)
    const region = {
      latitude: 43.6357763, // Your session's latitude
      longitude: -116.397774, // Your session's longitude
      latitudeDelta: 0.005,
      longitudeDelta: 0.005,
    }

    console.log("DEBUG getMapRegion - using hardcoded region:", region)
    return region
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Invite Header */}
      {isInvite && (
        <View style={styles.inviteHeader}>
          <Ionicons name="mail-outline" size={24} color="#4A90E2" />
          <Text style={styles.inviteTitle}>Session Invitation</Text>
          <Text style={styles.inviteSubtitle}>
            You've been invited to join this session
          </Text>
        </View>
      )}

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
      >
        {/* Session Info Card */}
        <View style={styles.sessionCard}>
          {/* Session Type moved to top */}
          {sessionData.session_type && (
            <View style={styles.sessionDetail}>
              <Ionicons name="tennisball-outline" size={20} color="#4A90E2" />
              <Text style={styles.sessionDetailText}>
                {sessionData.session_type}
              </Text>
            </View>
          )}

          <View style={styles.sessionDetail}>
            <Ionicons name="calendar-outline" size={20} color="#4A90E2" />
            <Text style={styles.sessionDetailText}>
              {new Date(sessionData.session_datetime || "").toLocaleDateString(
                "en-US",
                {
                  weekday: "short",
                  month: "short",
                  day: "numeric",
                }
              )}
            </Text>
          </View>

          <View style={styles.sessionDetail}>
            <Ionicons name="time-outline" size={20} color="#4A90E2" />
            <Text style={styles.sessionDetailText}>
              {new Date(sessionData.session_datetime || "").toLocaleTimeString(
                "en-US",
                {
                  hour: "numeric",
                  minute: "2-digit",
                  hour12: true,
                }
              )}{" "}
              -{" "}
              {new Date(sessionData.end_datetime || "").toLocaleTimeString(
                "en-US",
                {
                  hour: "numeric",
                  minute: "2-digit",
                  hour12: true,
                }
              )}
            </Text>
          </View>

          <View style={styles.sessionDetail}>
            <Ionicons name="location-outline" size={20} color="#4A90E2" />
            <View>
              <Text style={styles.sessionDetailText}>
                {sessionData.location || "Location not specified"}
              </Text>
              {sessionData.location_display_address && (
                <Text style={styles.sessionDetailSubtext}>
                  {sessionData.location_display_address}
                </Text>
              )}
            </View>
          </View>

          <View style={styles.sessionDetail}>
            <Ionicons name="people-outline" size={20} color="#4A90E2" />
            <Text style={styles.sessionDetailText}>
              {sessionData.max_players
                ? `Max ${sessionData.max_players} players`
                : "No player limit"}
              {sessionData.dupr_min &&
                sessionData.dupr_max &&
                ` • DUPR ${sessionData.dupr_min}-${sessionData.dupr_max}`}
            </Text>
          </View>

          {sessionData.visibility && (
            <View style={styles.sessionDetail}>
              <Ionicons name="eye-outline" size={20} color="#4A90E2" />
              <Text style={styles.sessionDetailText}>
                {sessionData.visibility === "public"
                  ? "Public Session"
                  : "Private Session"}
              </Text>
            </View>
          )}

          {sessionData.allow_guests && (
            <View style={styles.sessionDetail}>
              <Ionicons name="person-add-outline" size={20} color="#4A90E2" />
              <Text style={styles.sessionDetailText}>Guests allowed</Text>
            </View>
          )}
        </View>

        {/* Map Section */}
        <View style={styles.mapSection}>
          <Text style={styles.mapTitle}>Location</Text>
          {hasValidCoordinates() ? (
            <View style={styles.mapContainer}>
              <MapView
                style={styles.map}
                provider={PROVIDER_GOOGLE}
                region={getMapRegion()!}
                showsUserLocation={true}
                showsMyLocationButton={true}
                showsCompass={true}
                showsScale={true}
                zoomEnabled={true}
                scrollEnabled={true}
                pitchEnabled={true}
                rotateEnabled={true}
              >
                {/* HARDCODED MARKER FOR TESTING */}
                <Marker
                  coordinate={{
                    latitude: 43.6357763, // Hardcoded from your session data
                    longitude: -116.397774, // Hardcoded from your session data
                  }}
                  title={sessionData.location || "Session Location"}
                  description={sessionData.location_display_address || ""}
                >
                  <View style={styles.customMarker}>
                    <Ionicons name="location" size={30} color="#4A90E2" />
                  </View>
                </Marker>
              </MapView>
            </View>
          ) : (
            <View style={styles.noLocationContainer}>
              <Ionicons name="location-outline" size={48} color="#ccc" />
              <Text style={styles.noLocationText}>
                {sessionData.location || "Location not specified"}
              </Text>
              {sessionData.location_display_address && (
                <Text style={styles.noLocationSubtext}>
                  {sessionData.location_display_address}
                </Text>
              )}
              <Text style={styles.noLocationSubtext}>
                {sessionData.location
                  ? "Coordinates not available"
                  : "No location data"}
              </Text>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Action Buttons */}
      {user && sessionData && user.id !== sessionData.user_id && (
        <View style={styles.actionButtonContainer}>
          {isInvite ? (
            // Invite response buttons
            <View style={styles.inviteButtonRow}>
              <Pressable
                style={styles.declineButton}
                onPress={handleDeclineInvite}
              >
                <Text style={styles.declineButtonText}>Decline</Text>
              </Pressable>
              <Pressable
                style={styles.acceptButton}
                onPress={handleJoinSession}
              >
                <Text style={styles.acceptButtonText}>Accept Invite</Text>
              </Pressable>
            </View>
          ) : (
            // Regular join button
            <Pressable style={styles.joinButton} onPress={handleJoinSession}>
              <Text style={styles.joinButtonText}>Join Session</Text>
            </Pressable>
          )}
        </View>
      )}
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  scrollView: {
    flex: 1,
  },
  sessionCard: {
    backgroundColor: "white",
    margin: 20,
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
  sessionDetail: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 16,
    gap: 12,
  },
  sessionDetailText: {
    fontSize: 16,
    color: "#333",
    fontWeight: "500",
  },
  sessionDetailSubtext: {
    fontSize: 14,
    color: "#666",
    marginTop: 2,
  },
  mapSection: {
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
  mapTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#333",
    marginBottom: 12,
  },
  mapContainer: {
    width: "100%",
    height: 200,
    borderRadius: 12,
    overflow: "hidden",
    position: "relative",
  },
  map: {
    ...StyleSheet.absoluteFillObject,
  },
  customMarker: {
    alignItems: "center",
    justifyContent: "center",
  },
  noLocationContainer: {
    width: "100%",
    height: 200,
    borderRadius: 12,
    backgroundColor: "#f8f9fa",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#e9ecef",
    borderStyle: "dashed",
  },
  noLocationText: {
    fontSize: 16,
    color: "#666",
    marginTop: 12,
    textAlign: "center",
  },
  noLocationSubtext: {
    fontSize: 14,
    color: "#999",
    marginTop: 4,
    textAlign: "center",
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
  inviteHeader: {
    backgroundColor: "#E0F2F7",
    padding: 20,
    alignItems: "center",
    marginBottom: 16,
    borderRadius: 16,
  },
  inviteTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#333",
    marginTop: 10,
    textAlign: "center",
  },
  inviteSubtitle: {
    fontSize: 16,
    color: "#666",
    marginTop: 5,
    textAlign: "center",
  },
  inviteButtonRow: {
    flexDirection: "row",
    gap: 12,
  },
  declineButton: {
    flex: 1,
    backgroundColor: "#6c757d",
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: "center",
  },
  declineButtonText: {
    color: "white",
    fontSize: 18,
    fontWeight: "600",
  },
  acceptButton: {
    flex: 1,
    backgroundColor: "#28a745",
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: "center",
  },
  acceptButtonText: {
    color: "white",
    fontSize: 18,
    fontWeight: "600",
  },
})
