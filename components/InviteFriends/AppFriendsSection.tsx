import React from "react"
import { View, Text, Pressable } from "react-native"
import { Ionicons } from "@expo/vector-icons"
import { useColorScheme } from "../../components/useColorScheme"

interface AppFriend {
  id: string
  name?: string
  email?: string
  phone?: string
  invitee_name?: string
  invitee_phone?: string
}

interface AppFriendsSectionProps {
  friends: AppFriend[]
  friendsLoading: boolean
  expanded: boolean
  onToggleSection: () => void
  selectedFriends: string[]
  onToggleFriendSelection: (friendId: string) => void
  searchQuery: string
}

export default function AppFriendsSection({
  friends,
  friendsLoading,
  expanded,
  onToggleSection,
  selectedFriends,
  onToggleFriendSelection,
  searchQuery,
}: AppFriendsSectionProps) {
  const colors = useColorScheme()

  const filteredFriends = friends.filter(
    (friend) =>
      searchQuery.trim() === "" ||
      friend.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      friend.email?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <View style={styles.section}>
      <Pressable style={styles.sectionHeader} onPress={onToggleSection}>
        <View style={styles.sectionHeaderContent}>
          <Ionicons name="checkmark-circle" size={20} color={colors.tint} />
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            App Friends ({friends.length})
          </Text>
        </View>
        <Ionicons
          name={expanded ? "chevron-up" : "chevron-down"}
          size={20}
          color={colors.text}
        />
      </Pressable>

      {expanded && (
        <View style={styles.sectionContent}>
          {friendsLoading ? (
            <View style={styles.loadingContainer}>
              <Text style={[styles.loadingText, { color: colors.text }]}>
                Loading app friends...
              </Text>
            </View>
          ) : filteredFriends.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Text style={[styles.emptyText, { color: colors.text }]}>
                {searchQuery.trim()
                  ? `No app friends found matching "${searchQuery}"`
                  : "No app friends found. Invite people to sessions to build your network!"}
              </Text>
            </View>
          ) : (
            filteredFriends.map((friend) => (
              <View
                key={friend.id}
                style={[
                  styles.friendItem,
                  {
                    borderColor: selectedFriends.includes(friend.id)
                      ? colors.tint
                      : "#ddd",
                  },
                ]}
              >
                <View style={styles.avatarContainer}>
                  <View style={styles.defaultAvatar}>
                    <Ionicons
                      name="person"
                      size={20}
                      color={colors.text + "80"}
                    />
                  </View>
                </View>

                <View style={styles.friendInfo}>
                  <Text style={[styles.friendName, { color: colors.text }]}>
                    {friend.name || friend.invitee_name || "Unknown"}
                  </Text>
                  <Text
                    style={[styles.friendPhone, { color: colors.text + "80" }]}
                  >
                    {friend.email ||
                      friend.phone ||
                      friend.invitee_phone ||
                      "No contact info"}
                  </Text>
                </View>

                <Pressable
                  onPress={() => onToggleFriendSelection(friend.id)}
                  style={styles.selectionButton}
                >
                  <Ionicons
                    name={
                      selectedFriends.includes(friend.id)
                        ? "checkmark-circle"
                        : "ellipse-outline"
                    }
                    size={24}
                    color={
                      selectedFriends.includes(friend.id)
                        ? colors.tint
                        : colors.text + "60"
                    }
                  />
                </Pressable>
              </View>
            ))
          )}
        </View>
      )}
    </View>
  )
}

const styles = {
  section: {
    marginBottom: 20,
  },
  sectionHeader: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    justifyContent: "space-between" as const,
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: "white",
    borderRadius: 12,
    marginBottom: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  sectionHeaderContent: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600" as const,
    marginLeft: 8,
  },
  sectionContent: {
    paddingHorizontal: 16,
  },
  loadingContainer: {
    padding: 20,
    alignItems: "center" as const,
  },
  loadingText: {
    fontSize: 14,
    opacity: 0.6,
  },
  emptyContainer: {
    padding: 20,
    alignItems: "center" as const,
  },
  emptyText: {
    fontSize: 14,
    textAlign: "center" as const,
    opacity: 0.6,
  },
  friendItem: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    backgroundColor: "white",
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
    borderWidth: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  avatarContainer: {
    marginRight: 12,
  },
  defaultAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#f0f0f0",
    alignItems: "center" as const,
    justifyContent: "center" as const,
  },
  friendInfo: {
    flex: 1,
  },
  friendName: {
    fontSize: 16,
    fontWeight: "500" as const,
    marginBottom: 2,
  },
  friendPhone: {
    fontSize: 14,
  },
  selectionButton: {
    padding: 4,
  },
}
