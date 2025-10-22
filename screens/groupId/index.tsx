import React, { useEffect, useState } from "react"
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  SafeAreaView,
  ActivityIndicator,
  Alert,
} from "react-native"
import { useLocalSearchParams, useRouter } from "expo-router"
import { Ionicons } from "@expo/vector-icons"
import { useAuth } from "@/hooks/useAuth"
import { groupsService } from "@/services/groupsService"
import { supabase } from "@/lib/supabase"
import { useColorScheme } from "@/components/useColorScheme"
import Colors from "@/constants/Colors"
import AddMembersModal from "@/components/AddMembersModal"
import { ScreenTabs, TabItem } from "@/components/ScreenTabs"
// import { MembersTab } from "./MembersTab"
import { SessionsTab } from "./SessionsTab"
import { MessagesTab } from "./MessagesTab"
import { AboutTab } from "./AboutTab"
// import GroupHeader from "../../components/GroupHeader"
import CustomHeader from "@/components/CustomHeader"
import CreateGroupSessionModal from "../../components/CreateSession/CreateGroupSessionModal"

export default function GroupDetailsScreen() {
  const { groupId, tab } = useLocalSearchParams<{
    groupId: string
    tab?: string
  }>()
  const router = useRouter()
  const { user } = useAuth()
  const colors = useColorScheme()

  const [group, setGroup] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<"sessions" | "messages" | "about">(
    (tab as "sessions" | "messages" | "about") || "messages"
  )
  const [showAddMembersModal, setShowAddMembersModal] = useState(false)
  const [membersWithAccounts, setMembersWithAccounts] = useState<any[]>([])
  const [membersWithoutAccounts, setMembersWithoutAccounts] = useState<any[]>(
    []
  )
  const [invitedMembers, setInvitedMembers] = useState<any[]>([])
  const [invitedMembersExpanded, setInvitedMembersExpanded] = useState(false)
  const [pendingApprovals, setPendingApprovals] = useState<any[]>([])
  const [currentConversation, setCurrentConversation] = useState<any>(null)
  const [isGroupAdmin, setIsGroupAdmin] = useState(false)
  const [isGroupCreator, setIsGroupCreator] = useState(false)
  const [canManageGroup, setCanManageGroup] = useState(false)
  const [showCreatePost, setShowCreatePost] = useState(false)
  const [showCreateSessionModal, setShowCreateSessionModal] = useState(false)

  // Tab configuration
  const tabs: TabItem[] = [
    { key: "messages", label: "Messages" },
    { key: "sessions", label: "Sessions" },
    { key: "about", label: "About" },
  ]

  const handleTabPress = (tabKey: string) => {
    setActiveTab(tabKey as "sessions" | "messages" | "about")
  }

  useEffect(() => {
    if (groupId) {
      loadUserPermissions().then(() => {
        loadGroupDetails()
      })
    }
  }, [groupId])

  // Handle tab parameter changes
  useEffect(() => {
    if (tab && ["sessions", "messages", "about"].includes(tab)) {
      setActiveTab(tab as "sessions" | "messages" | "about")
    }
  }, [tab])

  const loadUserPermissions = async () => {
    if (!groupId) return

    try {
      const [admin, creator, canManage] = await Promise.all([
        groupsService.isGroupAdmin(groupId),
        groupsService.isGroupCreator(groupId),
        groupsService.canManageGroup(groupId),
      ])

      setIsGroupAdmin(admin)
      setIsGroupCreator(creator)
      setCanManageGroup(canManage)
    } catch (error) {
      console.error("Error loading user permissions:", error)
    }
  }

  const loadGroupDetails = async () => {
    try {
      setLoading(true)
      const groupData = await groupsService.getGroupWithMembers(groupId)
      setGroup(groupData)

      // Check which members have accounts
      if (groupData?.members && groupData.members.length > 0) {
        const memberAccountChecks = await Promise.all(
          groupData.members.map(async (member) => {
            let hasAccount = false
            let userId = null

            if (member.contact_phone) {
              const { data: userByPhone } = await supabase
                .from("users")
                .select("id")
                .eq("phone", member.contact_phone)
                .single()
              if (userByPhone) {
                hasAccount = true
                userId = userByPhone.id
              }
            }

            if (!hasAccount && member.contact_email) {
              const { data: userByEmail } = await supabase
                .from("users")
                .select("id")
                .eq("email", member.contact_email)
                .single()
              if (userByEmail) {
                hasAccount = true
                userId = userByEmail.id
              }
            }

            return { member, hasAccount, userId }
          })
        )

        // Members: admin(s) and users who have accepted and been approved
        const membersWithAccountsData = memberAccountChecks
          .filter(
            ({ hasAccount, member }) =>
              hasAccount &&
              member.accepted_invite === true &&
              member.approval_status === "approved"
          )
          .map(({ member, userId }) => ({ ...member, userId }))

        const membersWithoutAccountsData = memberAccountChecks
          .filter(
            ({ hasAccount, member }) =>
              !hasAccount &&
              member.accepted_invite === true &&
              member.approval_status === "approved"
          )
          .map(({ member }) => member)

        setMembersWithAccounts(membersWithAccountsData)
        setMembersWithoutAccounts(membersWithoutAccountsData)
      }

      // Load invited members
      try {
        const invitedMembersData = await groupsService.getInvitedMembers(
          groupId
        )
        setInvitedMembers(invitedMembersData)
      } catch (error) {
        console.error("Error loading invited members:", error)
        // Don't show error alert for this as it's not critical
      }

      // Load pending approvals (only for admins)
      console.log(
        "🔍 Loading pending approvals, canManageGroup:",
        canManageGroup
      )
      if (canManageGroup) {
        try {
          const pendingApprovalsData = await groupsService.getPendingApprovals(
            groupId
          )
          console.log("📋 Pending approvals loaded:", pendingApprovalsData)
          setPendingApprovals(pendingApprovalsData)
        } catch (error) {
          console.error("Error loading pending approvals:", error)
        }
      } else {
        console.log("❌ Cannot manage group, skipping pending approvals load")
      }
    } catch (error) {
      console.error("Error loading group details:", error)
      Alert.alert("Error", "Failed to load group details. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteGroup = async () => {
    if (!group) return

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
              Alert.alert("Success", "Group deleted successfully.")
              router.back()
            } catch (error) {
              console.error("Error deleting group:", error)
              Alert.alert("Error", "Failed to delete group. Please try again.")
            }
          },
        },
      ]
    )
  }

  const handleInviteToSession = () => {
    if (!group) return
    setShowCreateSessionModal(true)
  }

  const handleSessionCreated = () => {
    // Refresh sessions when a new session is created
    // This could trigger a refresh of the sessions tab if needed
    console.log("Session created for group:", group?.name)
  }

  const handleStartGroupChat = async () => {
    if (!group) return

    try {
      if (membersWithAccounts.length === 0) {
        Alert.alert(
          "No Members",
          "You need at least one member with a Net Gains account to start a group chat."
        )
        return
      }

      // Create or get existing conversation
      const { data: conversation, error } = await supabase
        .from("conversations")
        .select("*")
        .eq("group_id", group.id)
        .single()

      if (error && error.code !== "PGRST116") {
        throw error
      }

      if (conversation) {
        setCurrentConversation(conversation)
        setActiveTab("messages")
      } else {
        // Create new conversation
        const { data: newConversation, error: createError } = await supabase
          .from("conversations")
          .insert({
            name: group.name,
            group_id: group.id,
            created_by: user?.id,
          })
          .select()
          .single()

        if (createError) throw createError

        setCurrentConversation(newConversation)
        setActiveTab("messages")
      }
    } catch (error) {
      console.error("Error starting group chat:", error)
      Alert.alert("Error", "Failed to start group chat. Please try again.")
    }
  }

  const isCurrentUserMember = (member: any) => {
    return (
      (member.contact_phone && user?.phone === member.contact_phone) ||
      (member.contact_email && user?.email === member.contact_email)
    )
  }

  const isCurrentUserAdmin = () => {
    return isGroupCreator || isGroupAdmin
  }

  const handleRemoveMember = async (member: any) => {
    // Check if user is trying to remove themselves
    const isRemovingSelf = isCurrentUserMember(member)

    // Check if user is the only admin
    const adminMembers = membersWithAccounts.filter((m) => m.is_admin)
    const isOnlyAdmin =
      isRemovingSelf && adminMembers.length === 1 && member.is_admin

    let alertTitle = "Remove Member"
    let alertMessage = `Are you sure you want to remove ${member.contact_name} from the group?`

    if (isRemovingSelf) {
      alertTitle = "Leave Group"
      alertMessage = "Are you sure you want to leave this group?"

      if (isOnlyAdmin) {
        alertMessage =
          "You are the only admin of this group. If you leave, the group will have no administrators. Are you sure you want to leave?"
      }
    }

    Alert.alert(alertTitle, alertMessage, [
      { text: "Cancel", style: "cancel" },
      {
        text: isRemovingSelf ? "Leave" : "Remove",
        style: "destructive",
        onPress: async () => {
          try {
            await groupsService.removeGroupMember(member.id)
            await loadGroupDetails()

            if (isRemovingSelf) {
              Alert.alert("Success", "You have left the group.")
              router.back()
            } else {
              Alert.alert("Success", "Member removed successfully.")
            }
          } catch (error) {
            console.error("Error removing member:", error)
            Alert.alert("Error", "Failed to remove member. Please try again.")
          }
        },
      },
    ])
  }

  const handleAssignAdminRole = async (memberId: string, isAdmin: boolean) => {
    try {
      await groupsService.assignAdminRole(memberId, isAdmin)
      await loadGroupDetails()
      Alert.alert(
        "Success",
        `Member ${
          isAdmin ? "promoted to admin" : "removed from admin role"
        } successfully.`
      )
    } catch (error) {
      console.error("Error assigning admin role:", error)
      Alert.alert("Error", "Failed to update admin role. Please try again.")
    }
  }

  const handleApproveInvite = async (memberId: string) => {
    try {
      await groupsService.approveGroupInvite(memberId)
      await loadGroupDetails()
      Alert.alert("Success", "Group invite approved successfully.")
    } catch (error) {
      console.error("Error approving group invite:", error)
      Alert.alert("Error", "Failed to approve group invite. Please try again.")
    }
  }

  const handleDenyInvite = async (memberId: string) => {
    Alert.alert(
      "Deny Group Invite",
      "Are you sure you want to deny this group invite?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Deny",
          style: "destructive",
          onPress: async () => {
            try {
              await groupsService.denyGroupInvite(memberId)
              await loadGroupDetails()
              Alert.alert("Success", "Group invite denied.")
            } catch (error) {
              console.error("Error denying group invite:", error)
              Alert.alert(
                "Error",
                "Failed to deny group invite. Please try again."
              )
            }
          },
        },
      ]
    )
  }

  const getUserDisplayName = () => {
    if (!user) return "Unknown User"
    return (
      user.user_metadata?.full_name ||
      user.email?.split("@")[0] ||
      "Unknown User"
    )
  }

  if (loading) {
    return (
      <SafeAreaView
        style={[styles.container, { backgroundColor: colors.background }]}
      >
        <CustomHeader title="Groups" showBackButton={false} />
        <View style={styles.centerContent}>
          <ActivityIndicator size="large" color={colors.tint} />
          <Text style={[styles.loadingText, { color: colors.text }]}>
            Loading group details...
          </Text>
        </View>
      </SafeAreaView>
    )
  }

  if (error || !group) {
    return (
      <SafeAreaView
        style={[styles.container, { backgroundColor: colors.background }]}
      >
        <CustomHeader title="Groups" />
        <View style={styles.centerContent}>
          <Ionicons name="alert-circle" size={64} color="#ff4444" />
          <Text style={[styles.errorTitle, { color: colors.text }]}>
            {error || "Group not found"}
          </Text>
          <Text
            style={[styles.errorDescription, { color: colors.text + "80" }]}
          >
            The group you're looking for doesn't exist or you don't have
            permission to view it.
          </Text>
          <Pressable
            style={[styles.backButton, { backgroundColor: colors.tint }]}
            onPress={() => router.back()}
          >
            <Text style={styles.backButtonText}>Go Back</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
    >
      {/* Custom Group Header */}
      {/* <GroupHeader
        groupName={group.name}
        canManageGroup={canManageGroup}
        isCurrentUserAdmin={isCurrentUserAdmin()}
        isCurrentUserMember={isCurrentUserMember(group)}
        onEditPress={() => {
          // TODO: Implement edit group functionality
          console.log("Edit group pressed")
        }}
        onDeletePress={handleDeleteGroup}
      /> */}

      <CustomHeader title="Groups" showBackButton={false} />

      <View style={styles.titleSection}>
        <Text style={styles.title}>{group.name}</Text>
      </View>

      {/* Tab Navigation */}
      <ScreenTabs
        tabs={tabs}
        activeTab={activeTab}
        onTabPress={handleTabPress}
        colors={colors}
      />

      {activeTab === "messages" && (
        <MessagesTab
          groupId={groupId}
          membersWithAccounts={membersWithAccounts}
          onShowAddMembersModal={() => setShowAddMembersModal(true)}
          canManageGroup={canManageGroup}
          colors={colors}
          onCreatePost={() => setShowCreatePost(true)}
          showCreatePost={showCreatePost}
          onCloseCreatePost={() => setShowCreatePost(false)}
        />
      )}

      {/* Tab Content */}
      {activeTab === "sessions" && (
        <SessionsTab
          groupId={groupId}
          membersWithAccounts={membersWithAccounts}
          colors={colors}
        />
      )}

      {activeTab === "about" && (
        <AboutTab
          group={group}
          membersWithAccounts={membersWithAccounts}
          membersWithoutAccounts={membersWithoutAccounts}
          invitedMembers={invitedMembers}
          invitedMembersExpanded={invitedMembersExpanded}
          setInvitedMembersExpanded={setInvitedMembersExpanded}
          pendingApprovals={pendingApprovals}
          showAddMembersModal={showAddMembersModal}
          setShowAddMembersModal={setShowAddMembersModal}
          onMembersAdded={loadGroupDetails}
          onRemoveMember={handleRemoveMember}
          onAssignAdminRole={handleAssignAdminRole}
          onApproveInvite={handleApproveInvite}
          onDenyInvite={handleDenyInvite}
          isCurrentUserMember={isCurrentUserMember}
          isCurrentUserAdmin={isCurrentUserAdmin}
          canManageGroup={canManageGroup}
          getUserDisplayName={getUserDisplayName}
          user={user}
          colors={colors}
        />
      )}

      {/* Sticky Invite to Session Button - Only show on sessions tab */}
      {activeTab === "sessions" && (
        <View style={styles.stickyButtonContainer}>
          <Pressable
            style={[styles.stickyButton, { backgroundColor: colors.tint }]}
            onPress={handleInviteToSession}
          >
            <Ionicons name="calendar-outline" size={20} color="white" />
            <Text style={styles.stickyButtonText}>Create Session</Text>
          </Pressable>
        </View>
      )}

      {/* Sticky Create Post Button - Only show on messages tab */}
      {activeTab === "messages" && (
        <View style={styles.stickyButtonContainer}>
          <Pressable
            style={[styles.stickyButton, { backgroundColor: colors.tint }]}
            onPress={() => setShowCreatePost(true)}
          >
            <Ionicons name="add" size={20} color="white" />
            <Text style={styles.stickyButtonText}>Create Post</Text>
          </Pressable>
        </View>
      )}

      {/* Sticky Add Members Button - Only show on members tab */}
      {activeTab === "about" && canManageGroup && (
        <View style={styles.stickyButtonContainer}>
          <Pressable
            style={[styles.stickyButton, { backgroundColor: colors.tint }]}
            onPress={() => setShowAddMembersModal(true)}
          >
            <Ionicons name="person-add-outline" size={20} color="white" />
            <Text style={styles.stickyButtonText}>Add Members</Text>
          </Pressable>
        </View>
      )}

      {/* Add Members Modal */}
      <AddMembersModal
        isVisible={showAddMembersModal}
        onClose={() => setShowAddMembersModal(false)}
        groupId={groupId || ""}
        groupName={group?.name || ""}
        groupMembers={group?.members}
        onMembersAdded={loadGroupDetails}
      />

      {/* Create Group Session Modal */}
      <CreateGroupSessionModal
        visible={showCreateSessionModal}
        onClose={() => setShowCreateSessionModal(false)}
        onSessionCreated={handleSessionCreated}
        groupId={groupId}
        groupName={group?.name}
      />
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centerContent: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 40,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: "600",
    marginTop: 16,
    marginBottom: 8,
  },
  errorDescription: {
    fontSize: 16,
    textAlign: "center",
    marginBottom: 24,
  },
  backButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  backButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
  },
  titleSection: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "bold",
    flex: 1,
    marginHorizontal: 16,
  },
  headerActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  editButton: {
    padding: 8,
  },
  deleteButton: {
    padding: 8,
  },

  stickyButtonContainer: {
    position: "absolute",
    bottom: 20,
    left: 20,
    right: 20,
  },
  stickyButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    gap: 8,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  stickyButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
  },
  content: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
})
