import React, { useState, useCallback } from "react"
import {
  StyleSheet,
  View,
  Text,
  Pressable,
  ScrollView,
  Alert,
  ActivityIndicator,
  RefreshControl,
} from "react-native"
import { Ionicons } from "@expo/vector-icons"
import { useColorScheme } from "@/components/useColorScheme"
import Colors from "@/constants/Colors"
import { useRouter } from "expo-router"
import { groupsService } from "@/services/groupsService"
import { Group, GroupWithMembers } from "@/types"
import CustomHeader from "@/components/CustomHeader"
import CreateGroupModal from "@/components/CreateGroupModal"
import { useGroups } from "@/contexts/GroupsContext"
import DUPRRatingPill from "@/components/DUPRRatingPill"

export default function GroupsScreen() {
  const colors = useColorScheme()
  const router = useRouter()
  const { groups, loading, refreshGroups } = useGroups()

  const [refreshing, setRefreshing] = useState(false)
  const [showCreateGroupModal, setShowCreateGroupModal] = useState(false)

  const onRefresh = useCallback(async () => {
    setRefreshing(true)
    try {
      await refreshGroups()
      console.log("Groups refreshed successfully")
    } catch (error) {
      console.error("Error refreshing groups:", error)
    } finally {
      setRefreshing(false)
    }
  }, [refreshGroups])

  const handleCreateGroup = () => {
    setShowCreateGroupModal(true)
  }

  const handleGroupCreated = () => {
    // Refresh groups when a new group is created
    refreshGroups()
  }

  const handleGroupPress = (group: Group) => {
    // Navigate to group details screen
    router.push({
      pathname: "/(tabs)/groups/[groupId]" as any,
      params: { groupId: group.id },
    })
  }

  const handleDeleteGroup = async (group: Group) => {
    Alert.alert(
      "Delete Group",
      `Are you sure you want to delete "${group.name}"? This action cannot be undone.`,
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              await groupsService.deleteGroup(group.id)
              await refreshGroups() // Reload groups
              Alert.alert("Success", "Group deleted successfully.")
            } catch (error) {
              console.error("Error deleting group:", error)
              Alert.alert("Error", "Failed to delete group. Please try again.")
            }
          },
        },
      ]
    )
  }

  if (loading) {
    return (
      <View style={{ flex: 1 }}>
        <CustomHeader title="Groups" showBackButton={false} />
        <View style={[styles.container, styles.centerContent]}>
          <ActivityIndicator size="large" color={colors.tint} />
          <Text style={[styles.loadingText, { color: colors.text }]}>
            Loading groups...
          </Text>
          <Pressable
            style={[styles.retryButton, { backgroundColor: colors.tint }]}
            onPress={refreshGroups}
          >
            <Text style={styles.retryButtonText}>Retry</Text>
          </Pressable>
        </View>
      </View>
    )
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <CustomHeader title="Groups" showBackButton={false} />

      {/* Content */}
      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.scrollViewContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        <View style={styles.titleSection}>
          <Text style={styles.title}>My Groups</Text>
        </View>
        {groups.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons
              name="people-outline"
              size={64}
              color={colors.text + "40"}
            />
            <Text style={[styles.emptyTitle, { color: colors.text }]}>
              No Groups Yet
            </Text>
            <Text
              style={[styles.emptyDescription, { color: colors.text + "80" }]}
            >
              Create groups to easily invite the same people to your sessions.
            </Text>
            <Pressable
              style={[styles.emptyButton, { backgroundColor: colors.tint }]}
              onPress={handleCreateGroup}
            >
              <Text style={styles.emptyButtonText}>
                Create Your First Group
              </Text>
            </Pressable>
          </View>
        ) : (
          <View style={styles.groupsList}>
            {groups.map((group) => (
              <Pressable
                key={group.id}
                style={[styles.groupCard, { borderColor: colors.text + "20" }]}
                onPress={() => handleGroupPress(group)}
              >
                <View style={styles.groupInfo}>
                  <Text style={[styles.groupName, { color: colors.text }]}>
                    {group.name}
                  </Text>
                  {group.description && (
                    <Text
                      style={[
                        styles.groupDescription,
                        { color: colors.text + "80" },
                      ]}
                    >
                      {group.description}
                    </Text>
                  )}
                  <View style={styles.statsContainer}>
                    <View style={styles.memberCountSection}>
                      <Text
                        style={[
                          styles.statsLabel,
                          { color: colors.text + "60" },
                        ]}
                      >
                        Member Count
                      </Text>
                      <Text
                        style={[styles.memberCount, { color: colors.text }]}
                      >
                        {group.memberCount || 0}
                      </Text>
                    </View>
                    <View style={styles.duprSection}>
                      <Text
                        style={[
                          styles.statsLabel,
                          { color: colors.text + "60" },
                        ]}
                      >
                        Average DUPR Score
                      </Text>
                      <View style={styles.duprPills}>
                        <DUPRRatingPill
                          singlesRating={group.averageSinglesRating}
                          doublesRating={group.averageDoublesRating}
                          size="small"
                          showLabel={true}
                          showBoth={true}
                        />
                      </View>
                    </View>
                  </View>
                </View>

                <View style={styles.groupActions}>
                  <Pressable
                    style={styles.actionButton}
                    onPress={() => handleGroupPress(group)}
                  >
                    <Ionicons
                      name="chevron-forward"
                      size={20}
                      color={colors.text + "60"}
                    />
                  </Pressable>
                </View>
              </Pressable>
            ))}
          </View>
        )}
      </ScrollView>

      {/* Fixed Create Group Button */}
      <View style={styles.stickyButtonContainer}>
        <Pressable style={styles.createGroupButton} onPress={handleCreateGroup}>
          <Ionicons name="add" size={24} color="white" />
          <Text style={styles.createGroupButtonText}>Create Group</Text>
        </Pressable>
      </View>

      {/* Create Group Modal */}
      <CreateGroupModal
        visible={showCreateGroupModal}
        onClose={() => setShowCreateGroupModal(false)}
        onGroupCreated={handleGroupCreated}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centerContent: {
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    marginBottom: 16,
  },
  retryButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  retryButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
  },
  titleSection: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
  },
  createButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 8,
  },
  createButtonText: {
    color: "white",
    fontSize: 14,
    fontWeight: "600",
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  scrollViewContent: {
    paddingBottom: 120, // Extra padding for better scroll experience
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: "600",
    marginTop: 16,
    marginBottom: 8,
  },
  emptyDescription: {
    fontSize: 16,
    textAlign: "center",
    marginBottom: 24,
    paddingHorizontal: 40,
  },
  emptyButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  emptyButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
  },
  groupsList: {
    paddingTop: 20,
    gap: 12,
  },
  groupCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    backgroundColor: "#f8f9fa",
  },
  groupInfo: {
    flex: 1,
  },
  groupName: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 4,
  },
  groupDescription: {
    fontSize: 14,
    marginBottom: 4,
  },
  statsContainer: {
    flexDirection: "row",
    marginTop: 8,
    gap: 24,
  },
  memberCountSection: {
    flex: 1,
  },
  duprSection: {
    flex: 2,
  },
  statsLabel: {
    fontSize: 12,
    marginBottom: 4,
  },
  memberCount: {
    fontSize: 16,
    fontWeight: "600",
  },
  duprPills: {
    flexDirection: "row",
    alignItems: "center",
  },
  groupActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  actionButton: {
    padding: 8,
  },
  stickyButtonContainer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "white",
    paddingHorizontal: 24,
    paddingVertical: 20,
    borderTopWidth: 1,
    borderTopColor: "#e8eaed",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: -4,
    },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 8,
    zIndex: 1000,
  },
  createGroupButton: {
    backgroundColor: "#007AFF",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 18,
    paddingHorizontal: 32,
    borderRadius: 16,
    shadowColor: "#007AFF",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 6,
  },
  createGroupButtonText: {
    color: "white",
    fontSize: 18,
    fontWeight: "600",
    marginLeft: 8,
  },
})
