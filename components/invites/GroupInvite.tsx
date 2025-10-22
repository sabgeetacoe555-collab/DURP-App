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
import { Group } from "@/types"
import { useAuth } from "@/hooks/useAuth"
import { groupsService } from "@/services/groupsService"
import { useRouter } from "expo-router"
import { supabase } from "@/lib/supabase"

interface GroupInviteProps {
  groupId: string
  groupData: Group
  onError: (error: string) => void
}

export const GroupInvite: React.FC<GroupInviteProps> = ({
  groupId,
  groupData,
  onError,
}) => {
  const router = useRouter()
  const { user } = useAuth()

  const handleJoinGroup = async () => {
    console.log("Joining group:", groupId)

    try {
      // Check if user is already a member by user_id (for logged-in users)
      const { data: existingMember, error: memberError } = await supabase
        .from("group_members")
        .select("*")
        .eq("group_id", groupId)
        .eq("user_id", user?.id)
        .single()

      if (memberError && memberError.code !== "PGRST116") {
        // PGRST116 is "not found" error, which is expected if user isn't a member
        console.error("Error checking group membership:", memberError)
        Alert.alert(
          "Error",
          "Could not check group membership. Please try again."
        )
        return
      }

      if (existingMember) {
        Alert.alert(
          "Already a Member",
          "You are already a member of this group."
        )
        // Navigate to group details
        router.replace(`/(tabs)/groups/${groupId}`)
        return
      }

      // Get user's email for the contact info
      const { data: userData, error: userError } = await supabase
        .from("users")
        .select("email, name")
        .eq("id", user?.id)
        .single()

      if (userError) {
        console.error("Error fetching user data:", userError)
        Alert.alert("Error", "Could not verify your account. Please try again.")
        return
      }

      // Add user as a member to the group using user_id
      await groupsService.addGroupMember(groupId, {
        contact_name:
          userData.name || userData.email?.split("@")[0] || "New Member",
        contact_phone: undefined, // Not required for group invites
        contact_email: userData.email,
        user_id: user?.id, // Link to authenticated user
      })

      console.log("✅ Successfully joined group:", groupId)
      Alert.alert(
        "Join Request Sent",
        "Your request to join the group has been sent to the group administrators for approval. You'll be notified once approved.",
        [
          {
            text: "OK",
            onPress: () => {
              // Navigate to group details
              router.replace(`/(tabs)/groups/${groupId}`)
            },
          },
        ]
      )
    } catch (error) {
      console.error("Error joining group:", error)
      Alert.alert("Error", "Failed to join group. Please try again.")
    }
  }

  const handleDeclineInvite = async () => {
    console.log("Declining group invite:", groupId)

    // Navigate back to home
    router.replace("/(tabs)/groups")
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Invite Header */}
      <View style={styles.inviteHeader}>
        <Ionicons name="people-outline" size={24} color="#4A90E2" />
        <Text style={styles.inviteTitle}>Group Invitation</Text>
        <Text style={styles.inviteSubtitle}>
          You've been invited to join this group
        </Text>
      </View>

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
      >
        {/* Group Info Card */}
        <View style={styles.groupCard}>
          <View style={styles.groupHeader}>
            <Ionicons name="people" size={24} color="#4A90E2" />
            <Text style={styles.groupName}>{groupData.name}</Text>
          </View>

          {groupData.description && (
            <View style={styles.groupDetail}>
              <Ionicons
                name="document-text-outline"
                size={20}
                color="#4A90E2"
              />
              <Text style={styles.groupDetailText}>
                {groupData.description}
              </Text>
            </View>
          )}

          <View style={styles.groupDetail}>
            <Ionicons name="calendar-outline" size={20} color="#4A90E2" />
            <Text style={styles.groupDetailText}>
              Created{" "}
              {new Date(groupData.created_at).toLocaleDateString("en-US", {
                weekday: "long",
                month: "long",
                day: "numeric",
                year: "numeric",
              })}
            </Text>
          </View>

          <View style={styles.groupDetail}>
            <Ionicons
              name="information-circle-outline"
              size={20}
              color="#4A90E2"
            />
            <Text style={styles.groupDetailText}>
              Join this group to connect with other pickleball players and get
              notified about group activities
            </Text>
          </View>
        </View>

        {/* Group Benefits Section */}
        <View style={styles.benefitsSection}>
          <Text style={styles.benefitsTitle}>Group Benefits</Text>
          <View style={styles.benefitsList}>
            <View style={styles.benefitItem}>
              <Ionicons name="checkmark-circle" size={20} color="#28a745" />
              <Text style={styles.benefitText}>
                Get notified about group sessions
              </Text>
            </View>
            <View style={styles.benefitItem}>
              <Ionicons name="checkmark-circle" size={20} color="#28a745" />
              <Text style={styles.benefitText}>Connect with other players</Text>
            </View>
            <View style={styles.benefitItem}>
              <Ionicons name="checkmark-circle" size={20} color="#28a745" />
              <Text style={styles.benefitText}>Share group discussions</Text>
            </View>
            <View style={styles.benefitItem}>
              <Ionicons name="checkmark-circle" size={20} color="#28a745" />
              <Text style={styles.benefitText}>Organize group activities</Text>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Action Buttons */}
      {user && (
        <View style={styles.actionButtonContainer}>
          <View style={styles.inviteButtonRow}>
            <Pressable
              style={styles.declineButton}
              onPress={handleDeclineInvite}
            >
              <Text style={styles.declineButtonText}>Decline</Text>
            </Pressable>
            <Pressable style={styles.acceptButton} onPress={handleJoinGroup}>
              <Text style={styles.acceptButtonText}>Join Group</Text>
            </Pressable>
          </View>
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
  groupCard: {
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
  groupHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
    gap: 12,
  },
  groupName: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#333",
  },
  groupDetail: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 16,
    gap: 12,
  },
  groupDetailText: {
    fontSize: 16,
    color: "#333",
    fontWeight: "500",
    flex: 1,
  },
  benefitsSection: {
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
  benefitsTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#333",
    marginBottom: 16,
  },
  benefitsList: {
    gap: 12,
  },
  benefitItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  benefitText: {
    fontSize: 16,
    color: "#333",
    flex: 1,
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
})
