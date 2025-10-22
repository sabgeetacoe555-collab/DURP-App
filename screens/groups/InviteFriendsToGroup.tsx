import React, { useState, useEffect } from "react"
import {
  View,
  ScrollView,
  Alert,
  Pressable,
  Text,
  StyleSheet,
} from "react-native"
import { useRouter, useLocalSearchParams } from "expo-router"
import { useColorScheme } from "../../components/useColorScheme"
import * as Contacts from "expo-contacts"
import * as SMS from "expo-sms"
import CustomHeader from "../../components/CustomHeader"
import {
  SearchBar,
  AppFriendsSection,
  GroupsSection,
  ContactsSection,
  InvitedFriendsList,
} from "../../components/InviteFriends"
import { groupsService } from "../../services/groupsService"
import { sessionService } from "../../services/sessionService"
import { GroupWithMembers } from "../../types/frontend"

export default function InviteFriendsToGroup() {
  const router = useRouter()
  const params = useLocalSearchParams()
  const colors = useColorScheme()
  const groupId = params.groupId as string

  // Group data state
  const [groupData, setGroupData] = useState<any>(null)
  const [groupLoading, setGroupLoading] = useState(true)

  // Contacts functionality
  const [selectedFriends, setSelectedFriends] = useState<string[]>([])
  const [invitedFriends, setInvitedFriends] = useState<Contacts.Contact[]>([])
  const [contacts, setContacts] = useState<Contacts.Contact[]>([])
  const [contactsLoading, setContactsLoading] = useState(false)
  const [contactsPermission, setContactsPermission] = useState<boolean | null>(
    null
  )

  // Groups functionality
  const [groups, setGroups] = useState<GroupWithMembers[]>([])
  const [groupsLoading, setGroupsLoading] = useState(false)
  const [selectedGroups, setSelectedGroups] = useState<string[]>([])

  // App Friends functionality (users who accepted previous invites)
  const [sessionInvitees, setSessionInvitees] = useState<any[]>([])
  const [sessionInviteesLoading, setSessionInviteesLoading] = useState(false)
  const [selectedSessionInvitees, setSelectedSessionInvitees] = useState<
    string[]
  >([])

  // Search functionality
  const [searchQuery, setSearchQuery] = useState("")

  // Expandable sections state - default to closed if empty
  const [expandedSections, setExpandedSections] = useState({
    groups: false, // Will be updated based on data
    friends: false, // Will be updated based on data
    contacts: false, // Will be updated based on data
  })

  // Filter contacts based on search query
  const filteredContacts = contacts.filter((contact) => {
    if (!searchQuery.trim()) return true

    const query = searchQuery.toLowerCase().trim()
    const name = contact.name?.toLowerCase() || ""

    // Split name into parts for first/last name matching
    const nameParts = name.split(" ").filter((part) => part.length > 0)

    // Check if any part of the name contains the search query
    // Also check if the full name contains the query for partial matches
    return (
      nameParts.some((part) => part.includes(query)) || name.includes(query)
    )
  })

  // Filter groups based on search query
  const filteredGroups = groups.filter((group) => {
    if (!searchQuery.trim()) return true

    const query = searchQuery.toLowerCase().trim()
    const name = group.name.toLowerCase()

    return name.includes(query)
  })

  // Filter session invitees based on search query
  const filteredSessionInvitees = sessionInvitees.filter((invitee) => {
    if (!searchQuery.trim()) return true

    const query = searchQuery.toLowerCase().trim()
    const name = invitee.name?.toLowerCase() || ""

    return name.includes(query)
  })

  // Remove contacts that are already in session invitees (deduplication by phone number)
  const deduplicatedContacts = filteredContacts.filter((contact) => {
    const contactPhone = contact.phoneNumbers?.[0]?.number
    if (!contactPhone) return true

    return !sessionInvitees.some((invitee) => invitee.phone === contactPhone)
  })

  // Load data on component mount
  useEffect(() => {
    if (groupId) {
      loadGroupData()
    }
    loadContacts()
    loadGroups()
    loadFriends()
  }, [groupId])

  const loadGroupData = async () => {
    if (!groupId) return

    try {
      setGroupLoading(true)
      const group = await groupsService.getGroupById(groupId)
      setGroupData(group)
    } catch (error) {
      console.error("Error loading group:", error)
      Alert.alert("Error", "Failed to load group data")
    } finally {
      setGroupLoading(false)
    }
  }

  const loadFriends = async () => {
    try {
      setSessionInviteesLoading(true)
      const friendsData = await sessionService.getFriends()
      setSessionInvitees(friendsData)
      console.log(`Loaded ${friendsData.length} friends who accepted invites`)

      // Auto-expand app friends section if it has data
      if (friendsData.length > 0) {
        setExpandedSections((prev) => ({ ...prev, friends: true }))
      }
    } catch (error) {
      console.error("Error loading friends:", error)
      // Don't show alert for friends loading failure - it's not critical
    } finally {
      setSessionInviteesLoading(false)
    }
  }

  const loadContacts = async () => {
    try {
      setContactsLoading(true)
      const { status } = await Contacts.requestPermissionsAsync()
      setContactsPermission(status === "granted")

      if (status === "granted") {
        const { data } = await Contacts.getContactsAsync({
          fields: [
            Contacts.Fields.Name,
            Contacts.Fields.PhoneNumbers,
            // Contacts.Fields.Image,
          ],
        })

        if (data.length > 0) {
          setContacts(data)

          // Auto-expand contacts section if it has data
          setExpandedSections((prev) => ({ ...prev, contacts: true }))
        }
      }
    } catch (error) {
      console.error("Error loading contacts:", error)
      Alert.alert("Error", "Failed to load contacts")
    } finally {
      setContactsLoading(false)
    }
  }

  const loadGroups = async () => {
    try {
      setGroupsLoading(true)
      const groupsData = await groupsService.getGroupsWithMembers()
      // Filter out the current group from the list
      const otherGroups = groupsData.filter((group) => group.id !== groupId)
      setGroups(otherGroups)

      // Auto-expand groups section if it has data
      if (otherGroups.length > 0) {
        setExpandedSections((prev) => ({ ...prev, groups: true }))
      }
    } catch (error) {
      console.error("Error loading groups:", error)
      Alert.alert("Error", "Failed to load groups")
    } finally {
      setGroupsLoading(false)
    }
  }

  const handleBack = () => {
    router.back()
  }

  const handleSaveGroup = async () => {
    if (!groupData || !groupId) {
      Alert.alert("Error", "Group data not found")
      return
    }

    try {
      // Prepare invites from all sources
      let invites: any[] = []

      // Add selected app friends (users who accepted previous invites)
      if (selectedSessionInvitees.length > 0) {
        const selectedAppFriends = selectedSessionInvitees.map((friendId) => {
          const friend = sessionInvitees.find((f) => f.id === friendId)
          return {
            contact_name: friend?.name || "Unknown",
            contact_phone: friend?.phone || "",
            user_id: friend?.id, // This will be used to send push notification instead of SMS
          }
        })
        invites.push(...selectedAppFriends)
      }

      // Add selected contacts
      if (selectedFriends.length > 0) {
        const selectedInvites = selectedFriends.map((friendId) => {
          const friend = contacts.find((contact) => contact.id === friendId)
          return {
            contact_name: friend?.name || "Unknown",
            contact_phone: friend?.phoneNumbers?.[0]?.number || "",
          }
        })
        invites.push(...selectedInvites)
      }

      // Add selected group members
      if (selectedGroups.length > 0) {
        const selectedGroupMembers = selectedGroups.flatMap((groupId) => {
          const group = groups.find((g) => g.id === groupId)
          return (
            group?.members.map((member) => ({
              contact_name: member.contact_name,
              contact_phone: member.contact_phone || "",
              user_id: member.user_id,
            })) || []
          )
        })
        invites.push(...selectedGroupMembers)
      }

      // Add invites to the existing group
      if (invites.length > 0) {
        await groupsService.addMembersToGroup(groupId, invites)
      }

      // Check if we have invited friends and show success message
      const allInvitedContacts = [...invitedFriends]
      if (allInvitedContacts.length > 0) {
        Alert.alert(
          "Invites Added!",
          "Your group invites have been added successfully!",
          [
            {
              text: "OK",
              onPress: () => {
                router.back()
              },
            },
          ]
        )
      } else {
        Alert.alert("Success", "Your group invites have been added!", [
          {
            text: "OK",
            onPress: () => {
              router.back()
            },
          },
        ])
      }
    } catch (error) {
      console.error("Error adding invites:", error)
      Alert.alert("Error", "Failed to add invites. Please try again.")
    }
  }

  const toggleFriendSelection = (friendId: string) => {
    // Check if this contact is already in invitedFriends
    const isAlreadyInvited = invitedFriends.some(
      (invited) => invited.id === friendId
    )

    if (isAlreadyInvited) {
      // If already invited, just toggle selection
      setSelectedFriends((prev) =>
        prev.includes(friendId)
          ? prev.filter((id) => id !== friendId)
          : [...prev, friendId]
      )
    } else {
      // If not invited, just toggle selection - SMS invitation will add to invitedFriends later
      const contact = contacts.find((c) => c.id === friendId)
      if (contact) {
        console.log("👥 Contact selected for SMS invitation:", contact.name)
        setSelectedFriends((prev) => [...prev, friendId])
      }
    }
  }

  const handleSuccessfulInvitation = async (contact: Contacts.Contact) => {
    // Add to invited friends list
    setInvitedFriends((prev) => [...prev, contact])

    // Remove from selected friends if they were selected
    setSelectedFriends((prev) =>
      prev.filter((id) => id !== (contact.id || `contact-${Math.random()}`))
    )

    // Immediately save the invite to the database since SMS was sent
    if (groupId) {
      try {
        const inviteData = {
          contact_name: contact.name || "Unknown",
          contact_phone: contact.phoneNumbers?.[0]?.number || "",
        }

        await groupsService.addMembersToGroup(groupId, [inviteData])
        console.log("✅ SMS invite saved to database for:", contact.name)
      } catch (error) {
        console.error("❌ Failed to save SMS invite to database:", error)
        // Don't show alert to user - they already sent the SMS
      }
    }

    // No alert - just silently add to invited list
    console.log("✅ Contact added to invited friends:", contact.name)
  }

  const sendSMSInvitation = async (contact: Contacts.Contact) => {
    if (!groupData) {
      Alert.alert("Error", "Group data not found")
      return
    }

    try {
      console.log(
        "🔍 Starting SMS invitation process for contact:",
        contact.name
      )

      // Get phone number first
      const phoneNumber = contact.phoneNumbers?.[0]?.number
      if (!phoneNumber) {
        Alert.alert(
          "No Phone Number",
          "This contact doesn't have a phone number."
        )
        return
      }

      // Create deep link URL for group invite
      const deepLinkUrl = `https://netgains.app/g-${groupId}?invite=true`

      // Create the SMS message
      const message = `Hey! I'm inviting you to join my pickleball group:

🏓 ${groupData.name}
${groupData.description ? `📝 ${groupData.description}` : ""}

Join me! Download Net Gains: ${deepLinkUrl}

See you on the court! 🎾`

      // Enhanced console logging for simulator testing - ALWAYS show this
      console.log("=".repeat(80))
      console.log("📱 SMS GROUP INVITATION DETAILS (Simulator Mode)")
      console.log("=".repeat(80))
      console.log("👤 Contact:", contact.name)
      console.log("📞 Phone:", phoneNumber)
      console.log("🔗 Deep Link URL:", deepLinkUrl)
      console.log("🏓 Group Name:", groupData.name)
      console.log(
        "📝 Group Description:",
        groupData.description || "No description"
      )
      console.log("=".repeat(80))
      console.log("💬 COMPLETE SMS MESSAGE:")
      console.log("=".repeat(80))
      console.log(message)
      console.log("=".repeat(80))

      // Check if SMS is available
      const isAvailable = await SMS.isAvailableAsync()
      console.log("📱 SMS availability check result:", isAvailable)

      if (!isAvailable) {
        console.log("⚠️ SMS not available, simulating invitation")
        // For simulator or devices without SMS, simulate successful invitation
        await handleSuccessfulInvitation(contact)
        return
      }

      console.log("📤 Opening SMS UI with message...")

      // Open SMS UI - this will open the native SMS app
      const { result } = await SMS.sendSMSAsync([phoneNumber], message)
      console.log("📱 SMS UI result:", result)

      // Note: result will be "sent" if user sent it, "cancelled" if they cancelled
      // We can't guarantee they actually sent it, so we'll treat any result as "invited"
      if (result === "sent" || result === "cancelled") {
        console.log("✅ SMS invitation flow completed, adding to invited list")
        await handleSuccessfulInvitation(contact)
      } else {
        console.log("❌ SMS failed with result:", result)
        Alert.alert("SMS Failed", "Failed to open SMS app. Please try again.")
      }
    } catch (error) {
      console.error("Error sending SMS:", error)
      Alert.alert("Error", "Failed to send SMS invitation. Please try again.")
    }
  }

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }))
  }

  const toggleGroupSelection = (groupId: string) => {
    setSelectedGroups((prev) =>
      prev.includes(groupId)
        ? prev.filter((id) => id !== groupId)
        : [...prev, groupId]
    )
  }

  const toggleSessionInviteeSelection = (inviteeId: string) => {
    setSelectedSessionInvitees((prev) =>
      prev.includes(inviteeId)
        ? prev.filter((id) => id !== inviteeId)
        : [...prev, inviteeId]
    )
  }

  const getTotalSelectedCount = () => {
    return (
      selectedFriends.length +
      selectedSessionInvitees.length +
      selectedGroups.length +
      invitedFriends.length
    )
  }

  return (
    <View style={styles.container}>
      <CustomHeader title="Invite to Group" showBackButton={true} />

      {/* Content */}
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Group Info */}
        {groupLoading ? (
          <View style={styles.groupInfoSection}>
            <View style={styles.loadingContainer}>
              <Text style={[styles.loadingText, { color: colors.text }]}>
                Loading group details...
              </Text>
            </View>
          </View>
        ) : (
          <View style={styles.groupInfoSection}>
            <Text style={[styles.groupName, { color: colors.text }]}>
              {groupData?.name}
            </Text>
            {groupData?.description && (
              <Text
                style={[styles.groupDescription, { color: colors.text + "80" }]}
              >
                {groupData.description}
              </Text>
            )}
          </View>
        )}

        {/* Already Invited Friends */}
        <InvitedFriendsList invitedFriends={invitedFriends} />

        {/* Search Input */}
        <SearchBar searchQuery={searchQuery} setSearchQuery={setSearchQuery} />

        {/* Groups Section */}
        <GroupsSection
          groups={filteredGroups}
          groupsLoading={groupsLoading}
          expanded={expandedSections.groups}
          onToggleSection={() => toggleSection("groups")}
          selectedGroups={selectedGroups}
          onToggleGroupSelection={toggleGroupSelection}
          searchQuery={searchQuery}
        />

        {/* App Friends Section (Users who accepted previous invites) */}
        <AppFriendsSection
          friends={sessionInvitees}
          friendsLoading={sessionInviteesLoading}
          expanded={expandedSections.friends}
          onToggleSection={() => toggleSection("friends")}
          selectedFriends={selectedSessionInvitees}
          onToggleFriendSelection={toggleSessionInviteeSelection}
          searchQuery={searchQuery}
        />

        {/* Contacts Section */}
        <ContactsSection
          contacts={contacts}
          contactsLoading={contactsLoading}
          expanded={expandedSections.contacts}
          onToggleSection={() => toggleSection("contacts")}
          selectedContacts={selectedFriends}
          onToggleContactSelection={toggleFriendSelection}
          onSendSMSInvitation={sendSMSInvitation}
          searchQuery={searchQuery}
          deduplicatedContacts={deduplicatedContacts}
        />
      </ScrollView>

      {/* Action Button */}
      <View style={styles.actionButtonContainer}>
        <Pressable style={styles.saveButton} onPress={handleSaveGroup}>
          <Text style={styles.saveButtonText}>Done</Text>
        </Pressable>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  content: {
    flex: 1,
    padding: 16,
  },
  groupInfoSection: {
    marginBottom: 20,
    padding: 16,
    backgroundColor: "white",
    borderRadius: 12,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  groupName: {
    fontSize: 20,
    fontWeight: "600",
    marginBottom: 8,
  },
  groupDescription: {
    fontSize: 16,
    lineHeight: 24,
  },
  loadingContainer: {
    padding: 20,
    alignItems: "center",
  },
  loadingText: {
    fontSize: 16,
    textAlign: "center",
    opacity: 0.6,
  },
  actionButtonContainer: {
    padding: 16,
    backgroundColor: "white",
    borderTopWidth: 1,
    borderTopColor: "#e0e0e0",
  },
  saveButton: {
    backgroundColor: "#007AFF",
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  saveButtonText: {
    color: "white",
    fontSize: 18,
    fontWeight: "600",
  },
})
