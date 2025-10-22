import React, { useEffect } from "react"
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  Share,
  Alert,
} from "react-native"
import { Ionicons } from "@expo/vector-icons"
import QRCode from "react-native-qrcode-svg"

interface AboutTabProps {
  group: any
  membersWithAccounts: any[]
  membersWithoutAccounts: any[]
  invitedMembers: any[]
  invitedMembersExpanded: boolean
  setInvitedMembersExpanded: (expanded: boolean) => void
  pendingApprovals: any[]
  showAddMembersModal: boolean
  setShowAddMembersModal: (show: boolean) => void
  onMembersAdded: () => void
  onRemoveMember: (member: any) => void
  onAssignAdminRole: (memberId: string, isAdmin: boolean) => void
  onApproveInvite: (memberId: string) => void
  onDenyInvite: (memberId: string) => void
  isCurrentUserMember: (member: any) => boolean
  isCurrentUserAdmin: () => boolean
  canManageGroup: boolean
  getUserDisplayName: () => string
  user: any
  colors: any
}

export const AboutTab: React.FC<AboutTabProps> = ({
  group,
  membersWithAccounts,
  membersWithoutAccounts,
  invitedMembers,
  invitedMembersExpanded,
  setInvitedMembersExpanded,
  pendingApprovals,
  setShowAddMembersModal,
  onRemoveMember,
  onAssignAdminRole,
  onApproveInvite,
  onDenyInvite,
  isCurrentUserMember,
  isCurrentUserAdmin,
  canManageGroup,
  getUserDisplayName,
  user,
  colors,
}) => {
  // Log the deep link URL when component mounts
  useEffect(() => {
    console.log(
      "🔗 Group Invite Deep Link:",
      `https://netgains.app/g-${group.id}?invite=true`
    )
  }, [group.id])

  const handleShareGroup = async () => {
    try {
      // Create the same message as SMS
      const deepLinkUrl = `https://netgains.app/g-${group.id}?invite=true`
      const message = `Hey! I'm inviting you to join my pickleball group:

🏓 ${group.name}
${group.description ? `📝 ${group.description}` : ""}

Join me! Download Net Gains: ${deepLinkUrl}

See you on the court! 🎾`

      // Use React Native's built-in Share API
      const result = await Share.share({
        message: message,
        title: `Join ${group.name} on Net Gains`,
        url: deepLinkUrl, // This will be used by apps that support URL sharing
      })

      if (result.action === Share.sharedAction) {
        console.log("✅ Group invite shared successfully")
      } else if (result.action === Share.dismissedAction) {
        console.log("📱 Share dialog dismissed")
      }
    } catch (error) {
      console.error("Error sharing group:", error)
      Alert.alert("Error", "Failed to share group invite. Please try again.")
    }
  }

  return (
    <ScrollView
      style={styles.content}
      contentContainerStyle={styles.contentContainer}
      showsVerticalScrollIndicator={false}
    >
      {/* Group Invite QR Code - Only show for admins */}
      {isCurrentUserAdmin() && (
        <View style={styles.qrCodeSection}>
          <View style={styles.qrCodeHeader}>
            <Ionicons name="qr-code-outline" size={20} color="#666" />
            <Text style={[styles.qrCodeTitle, { color: colors.text }]}>
              Invite to Group
            </Text>
          </View>
          <View style={styles.qrCodeContainer}>
            <QRCode
              value={`https://netgains.app/g-${group.id}?invite=true`}
              size={200}
              color="#000"
              backgroundColor="#fff"
            />
          </View>
          <Text
            style={[styles.qrCodeDescription, { color: colors.text + "80" }]}
          >
            Scan this QR code to join the group. If you don't have the app,
            you'll be directed to download it.
          </Text>

          {/* Share Button */}
          <Pressable style={styles.shareButton} onPress={handleShareGroup}>
            <Ionicons name="share-outline" size={20} color="#007AFF" />
            <Text style={styles.shareButtonText}>Share Group Invite</Text>
          </Pressable>
        </View>
      )}

      {/* Group Info */}
      <View style={styles.groupInfoSection}>
        {group.description && (
          <Text
            style={[styles.groupDescription, { color: colors.text + "80" }]}
          >
            {group.description}
          </Text>
        )}
        <Text style={[styles.groupDate, { color: colors.text + "60" }]}>
          Created {new Date(group.created_at).toLocaleDateString()} by{" "}
          {getUserDisplayName()}
        </Text>
      </View>

      {/* Admin Info Section */}
      {isCurrentUserAdmin() && (
        <View style={styles.adminInfoSection}>
          <View style={styles.sectionHeader}>
            <Ionicons name="shield-checkmark" size={20} color="#4CAF50" />
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              Admin Information
            </Text>
          </View>
          <View style={styles.adminInfoCard}>
            <View style={styles.adminInfoRow}>
              <Text
                style={[styles.adminInfoLabel, { color: colors.text + "80" }]}
              >
                Name:
              </Text>
              <Text style={[styles.adminInfoValue, { color: colors.text }]}>
                {getUserDisplayName()}
              </Text>
            </View>
            {user?.email && (
              <View style={styles.adminInfoRow}>
                <Text
                  style={[styles.adminInfoLabel, { color: colors.text + "80" }]}
                >
                  Email:
                </Text>
                <Text style={[styles.adminInfoValue, { color: colors.text }]}>
                  {user.email}
                </Text>
              </View>
            )}
            {user?.phone && (
              <View style={styles.adminInfoRow}>
                <Text
                  style={[styles.adminInfoLabel, { color: colors.text + "80" }]}
                >
                  Phone:
                </Text>
                <Text style={[styles.adminInfoValue, { color: colors.text }]}>
                  {user.phone}
                </Text>
              </View>
            )}
          </View>
        </View>
      )}

      {/* Pending Approval Section - Only show for admins */}
      {/* Shows invitees who have accepted but have not been approved by admin */}
      {isCurrentUserAdmin() && pendingApprovals.length > 0 && (
        <View style={styles.pendingApprovalSection}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              Pending Approval ({pendingApprovals.length})
            </Text>
            <Ionicons name="time-outline" size={20} color="#FF9500" />
          </View>
          <View style={styles.pendingApprovalList}>
            {pendingApprovals.map((member) => (
              <View key={member.id} style={styles.pendingApprovalItem}>
                <View style={styles.memberInfo}>
                  <View style={styles.memberAvatar}>
                    <Ionicons name="person" size={16} color="#666" />
                  </View>
                  <View style={styles.memberDetails}>
                    <Text style={[styles.memberName, { color: colors.text }]}>
                      {member.contact_name}
                    </Text>
                    {member.contact_email && (
                      <Text
                        style={[
                          styles.memberContact,
                          { color: colors.text + "60" },
                        ]}
                      >
                        {member.contact_email}
                      </Text>
                    )}
                    <Text style={[styles.pendingStatus, { color: "#FF9500" }]}>
                      Awaiting admin approval
                    </Text>
                  </View>
                </View>
                <View style={styles.approvalActions}>
                  <Pressable
                    style={styles.approveButton}
                    onPress={() => onApproveInvite(member.id)}
                  >
                    <Ionicons name="checkmark" size={16} color="#4CAF50" />
                    <Text style={styles.approveButtonText}>Approve</Text>
                  </Pressable>
                  <Pressable
                    style={styles.denyButton}
                    onPress={() => onDenyInvite(member.id)}
                  >
                    <Ionicons name="close" size={16} color="#FF4444" />
                    <Text style={styles.denyButtonText}>Deny</Text>
                  </Pressable>
                </View>
              </View>
            ))}
          </View>
        </View>
      )}

      {/* Members Section */}
      {/* Shows admin(s) and users who have accepted and been approved */}
      <View style={styles.membersSection}>
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            Members ({membersWithAccounts.length})
          </Text>
        </View>

        {membersWithAccounts.length > 0 ? (
          <View style={styles.membersList}>
            {membersWithAccounts.map((member: any) => (
              <View
                key={member.id}
                style={[styles.memberCard, { borderColor: colors.text + "20" }]}
              >
                <View style={styles.memberInfo}>
                  <View style={styles.memberAvatar}>
                    <Ionicons name="person" size={16} color="#666" />
                  </View>
                  <View style={styles.memberDetails}>
                    <View style={styles.memberNameRow}>
                      <Text style={[styles.memberName, { color: colors.text }]}>
                        {member.contact_name}
                      </Text>
                      {member.is_admin && (
                        <View style={styles.adminBadge}>
                          <Text style={styles.adminBadgeText}>Admin</Text>
                        </View>
                      )}
                    </View>
                    {member.contact_phone && (
                      <Text
                        style={[
                          styles.memberContact,
                          { color: colors.text + "60" },
                        ]}
                      >
                        {member.contact_phone}
                      </Text>
                    )}
                    <Text
                      style={[
                        styles.memberStatus,
                        { color: colors.text + "60" },
                      ]}
                    >
                      {member.accepted_invite ? "✓ Accepted" : "⏳ Pending"}
                    </Text>
                  </View>
                </View>
                <View style={styles.memberActions}>
                  {canManageGroup && !isCurrentUserMember(member) && (
                    <Pressable
                      style={[
                        styles.adminToggleButton,
                        member.is_admin && styles.adminToggleButtonActive,
                      ]}
                      onPress={() =>
                        onAssignAdminRole(member.id, !member.is_admin)
                      }
                    >
                      <Ionicons
                        name={
                          member.is_admin
                            ? "shield-checkmark"
                            : "shield-outline"
                        }
                        size={16}
                        color={member.is_admin ? "#4CAF50" : "#666"}
                      />
                      <Text
                        style={[
                          styles.adminToggleText,
                          { color: member.is_admin ? "#4CAF50" : "#666" },
                        ]}
                      >
                        {member.is_admin ? "Remove Admin" : "Add as Admin"}
                      </Text>
                    </Pressable>
                  )}
                  {(isCurrentUserMember(member) || isCurrentUserAdmin()) && (
                    <Pressable
                      style={styles.memberDeleteButton}
                      onPress={() => onRemoveMember(member)}
                    >
                      <Ionicons name="close-circle" size={20} color="#ff4444" />
                    </Pressable>
                  )}
                </View>
              </View>
            ))}
          </View>
        ) : (
          <View style={styles.emptyMembers}>
            <Ionicons
              name="people-outline"
              size={48}
              color={colors.text + "40"}
            />
            <Text style={[styles.emptyMembersTitle, { color: colors.text }]}>
              No Members Yet
            </Text>
            <Text
              style={[styles.emptyMembersText, { color: colors.text + "80" }]}
            >
              {canManageGroup
                ? "Add members to your group to get started"
                : "No members have been added to this group yet"}
            </Text>
            {canManageGroup && (
              <Pressable
                style={[
                  styles.addMembersButton,
                  { backgroundColor: colors.tint },
                ]}
                onPress={() => setShowAddMembersModal(true)}
              >
                <Text style={styles.addMembersButtonText}>Add Members</Text>
              </Pressable>
            )}
          </View>
        )}

        {/* Pending Invites Section */}
        {/* Shows people who have not accepted the invite */}
        {invitedMembers.length > 0 && (
          <View style={styles.invitedMembersSection}>
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>
                Pending Invites ({invitedMembers.length})
              </Text>
              <Pressable
                style={styles.expandButton}
                onPress={() =>
                  setInvitedMembersExpanded(!invitedMembersExpanded)
                }
              >
                <Ionicons
                  name={invitedMembersExpanded ? "chevron-up" : "chevron-down"}
                  size={20}
                  color="#666"
                />
              </Pressable>
            </View>
            {invitedMembersExpanded && (
              <View style={styles.invitedMembersList}>
                {invitedMembers.map((invitedMember) => (
                  <View
                    key={invitedMember.id}
                    style={[
                      styles.invitedMemberCard,
                      { borderColor: colors.text + "20" },
                    ]}
                  >
                    <View style={styles.memberInfo}>
                      <View style={styles.memberAvatar}>
                        <Ionicons name="person" size={16} color="#666" />
                      </View>
                      <View style={styles.memberDetails}>
                        <Text
                          style={[styles.memberName, { color: colors.text }]}
                        >
                          {invitedMember.contact_name}
                        </Text>
                        {invitedMember.contact_phone && (
                          <Text
                            style={[
                              styles.memberContact,
                              { color: colors.text + "60" },
                            ]}
                          >
                            {invitedMember.contact_phone}
                          </Text>
                        )}
                        <Text
                          style={[
                            styles.invitedStatus,
                            { color: colors.text + "60" },
                          ]}
                        >
                          Invited
                        </Text>
                      </View>
                    </View>
                  </View>
                ))}
              </View>
            )}
          </View>
        )}

        {/* Members Without Accounts Section */}
        {/* Shows approved members who don't have Net Gains accounts */}
        {membersWithoutAccounts.length > 0 && (
          <View style={styles.membersWithoutAccountsSection}>
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>
                Members Without Accounts ({membersWithoutAccounts.length})
              </Text>
            </View>
            <View style={styles.membersWithoutAccountsList}>
              {membersWithoutAccounts.map((member) => (
                <View
                  key={member.id}
                  style={[
                    styles.memberCard,
                    { borderColor: colors.text + "20" },
                  ]}
                >
                  <View style={styles.memberInfo}>
                    <View style={styles.memberAvatar}>
                      <Ionicons name="person" size={16} color="#666" />
                    </View>
                    <View style={styles.memberDetails}>
                      <Text style={[styles.memberName, { color: colors.text }]}>
                        {member.contact_name}
                      </Text>
                      {member.contact_phone && (
                        <Text
                          style={[
                            styles.memberContact,
                            { color: colors.text + "60" },
                          ]}
                        >
                          {member.contact_phone}
                        </Text>
                      )}
                      <Text
                        style={[
                          styles.noAccountStatus,
                          { color: colors.text + "60" },
                        ]}
                      >
                        Pending invite
                      </Text>
                    </View>
                  </View>
                </View>
              ))}
            </View>
          </View>
        )}
      </View>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  contentContainer: {
    paddingBottom: 100, // Space for sticky button
  },
  qrCodeSection: {
    alignItems: "center",
    paddingVertical: 24,
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
  },
  qrCodeHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 16,
  },
  qrCodeTitle: {
    fontSize: 18,
    fontWeight: "600",
  },
  qrCodeContainer: {
    padding: 16,
    backgroundColor: "white",
    borderRadius: 12,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    marginBottom: 12,
  },
  qrCodeDescription: {
    fontSize: 14,
    textAlign: "center",
    lineHeight: 20,
    paddingHorizontal: 20,
  },
  shareButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#007AFF20",
    borderWidth: 1,
    borderColor: "#007AFF",
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 20,
    marginTop: 16,
    marginHorizontal: 20,
    gap: 8,
  },
  shareButtonText: {
    color: "#007AFF",
    fontSize: 16,
    fontWeight: "600",
  },
  groupInfoSection: {
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
  },
  groupDescription: {
    fontSize: 16,
    lineHeight: 24,
    marginBottom: 8,
  },
  groupDate: {
    fontSize: 14,
  },
  adminInfoSection: {
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
  },
  adminInfoCard: {
    backgroundColor: "white",
    borderRadius: 12,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  adminInfoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  adminInfoLabel: {
    fontSize: 14,
    fontWeight: "500",
  },
  adminInfoValue: {
    fontSize: 14,
    flex: 1,
    textAlign: "right",
  },
  pendingApprovalSection: {
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
  },
  pendingApprovalList: {
    gap: 12,
  },
  pendingApprovalItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#FFF8E1",
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: "#FFE0B2",
  },
  pendingStatus: {
    fontSize: 12,
    fontWeight: "500",
    marginTop: 2,
  },
  approvalActions: {
    flexDirection: "column",
    gap: 8,
  },
  approveButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#4CAF5020",
    borderWidth: 1,
    borderColor: "#4CAF50",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
    gap: 4,
  },
  approveButtonText: {
    color: "#4CAF50",
    fontSize: 12,
    fontWeight: "600",
  },
  denyButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FF444420",
    borderWidth: 1,
    borderColor: "#FF4444",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
    gap: 4,
  },
  denyButtonText: {
    color: "#FF4444",
    fontSize: 12,
    fontWeight: "600",
  },
  membersSection: {
    paddingVertical: 20,
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
  membersList: {
    gap: 12,
  },
  memberCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
    backgroundColor: "white",
    borderRadius: 12,
    borderWidth: 1,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  memberInfo: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  memberAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#f0f0f0",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  memberDetails: {
    flex: 1,
  },
  memberNameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 2,
  },
  memberName: {
    fontSize: 16,
    fontWeight: "500",
  },
  adminBadge: {
    backgroundColor: "#4CAF50",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  adminBadgeText: {
    color: "white",
    fontSize: 10,
    fontWeight: "600",
  },
  memberContact: {
    fontSize: 14,
  },
  memberStatus: {
    fontSize: 12,
    fontStyle: "italic",
    marginTop: 2,
  },
  memberActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  adminToggleButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    backgroundColor: "transparent",
    borderWidth: 1,
    borderColor: "#e0e0e0",
  },
  adminToggleButtonActive: {
    backgroundColor: "#4CAF5020",
    borderColor: "#4CAF50",
  },
  adminToggleText: {
    fontSize: 12,
    fontWeight: "500",
    marginLeft: 4,
  },
  memberDeleteButton: {
    padding: 4,
  },
  emptyMembers: {
    alignItems: "center",
    paddingVertical: 40,
  },
  emptyMembersTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginTop: 16,
    marginBottom: 8,
  },
  emptyMembersText: {
    fontSize: 16,
    textAlign: "center",
    marginBottom: 24,
  },
  addMembersButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  addMembersButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
  },
  invitedMembersSection: {
    marginTop: 24,
  },
  invitedMembersList: {
    gap: 12,
  },
  invitedMemberCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    backgroundColor: "white",
    borderRadius: 12,
    borderWidth: 1,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  invitedStatus: {
    fontSize: 12,
    fontStyle: "italic",
    marginTop: 2,
  },
  membersWithoutAccountsSection: {
    marginTop: 24,
  },
  membersWithoutAccountsList: {
    gap: 12,
  },
  noAccountStatus: {
    fontSize: 12,
    fontStyle: "italic",
    marginTop: 2,
  },
})
