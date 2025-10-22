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
// import CreateGroupModal from "../../components/CreateGroupModal"
import {
  SessionInfoCard,
  SearchBar,
  AppFriendsSection,
  GroupsSection,
  ContactsSection,
  InvitedFriendsList,
} from "../../components/InviteFriends"
import { sessionService } from "../../services/sessionService"
import { groupsService } from "../../services/groupsService"
import { GroupWithMembers } from "../../types/frontend"
import { CreateSessionInviteData } from "../../types/frontend"

export default function InviteFriends() {
  const router = useRouter()
  const params = useLocalSearchParams()
  const colors = useColorScheme()
  const sessionId = params.sessionId as string

  // Session data state
  const [sessionData, setSessionData] = useState<any>(null)
  const [sessionLoading, setSessionLoading] = useState(true)

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

  // Group creation functionality
  // const [showCreateGroupModal, setShowCreateGroupModal] = useState(false)
  const [contactsForGroup, setContactsForGroup] = useState<Contacts.Contact[]>(
    []
  )

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
    if (sessionId) {
      loadSessionData()
    }
    loadContacts()
    loadGroups()
    loadFriends()
  }, [sessionId])

  const loadSessionData = async () => {
    if (!sessionId) return

    try {
      setSessionLoading(true)
      const session = await sessionService.getSessionById(sessionId)
      setSessionData(session)
    } catch (error) {
      console.error("Error loading session:", error)
      Alert.alert("Error", "Failed to load session data")
    } finally {
      setSessionLoading(false)
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
      setGroups(groupsData)

      // Auto-expand groups section if it has data
      if (groupsData.length > 0) {
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

  const handleSaveSession = async () => {
    if (!sessionData || !sessionId) {
      Alert.alert("Error", "Session data not found")
      return
    }

    try {
      // Prepare invites from all sources
      let invites: CreateSessionInviteData[] = []

      // Add selected app friends (users who accepted previous invites)
      if (selectedSessionInvitees.length > 0) {
        const selectedAppFriends = selectedSessionInvitees.map((friendId) => {
          const friend = sessionInvitees.find((f) => f.id === friendId)
          return {
            invitee_name: friend?.name || "Unknown",
            invitee_phone: friend?.phone || "",
            invitee_id: friend?.id, // This will be used to send push notification instead of SMS
          } as CreateSessionInviteData
        })
        invites.push(...selectedAppFriends)
      }

      // Add selected contacts
      if (selectedFriends.length > 0) {
        const selectedInvites = selectedFriends.map((friendId) => {
          const friend = contacts.find((contact) => contact.id === friendId)
          return {
            invitee_name: friend?.name || "Unknown",
            invitee_phone: friend?.phoneNumbers?.[0]?.number || "",
          } as CreateSessionInviteData
        })
        invites.push(...selectedInvites)
      }

      // Add selected group members
      if (selectedGroups.length > 0) {
        const selectedGroupMembers = selectedGroups.flatMap((groupId) => {
          const group = groups.find((g) => g.id === groupId)
          return (
            group?.members.map((member) => ({
              invitee_name: member.contact_name,
              invitee_phone: member.contact_phone || "",
            })) || []
          )
        })
        invites.push(...selectedGroupMembers)
      }

      // Note: SMS invites (invitedFriends) are now saved immediately when SMS is sent
      // No need to add them here to avoid duplicates

      // Add invites to the existing session
      if (invites.length > 0) {
        await sessionService.addInvitesToSession(sessionId, invites)
      }

      // Check if we have invited friends and prompt for group creation
      const allInvitedContacts = [...invitedFriends]
      if (allInvitedContacts.length > 0) {
        Alert.alert(
          "Invites Added!",
          "Your session invites have been added successfully!",
          [
            {
              text: "Skip",
              style: "cancel",
              onPress: () => {
                router.push("/(tabs)/sessions")
              },
            },
            {
              text: "Create Group",
              onPress: () => {
                setContactsForGroup(allInvitedContacts)
                // setShowCreateGroupModal(true)
              },
            },
          ]
        )
      } else {
        Alert.alert("Success", "Your session invites have been added!", [
          {
            text: "OK",
            onPress: () => {
              router.push("/(tabs)/sessions")
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
    if (sessionId) {
      try {
        const inviteData: CreateSessionInviteData = {
          invitee_name: contact.name || "Unknown",
          invitee_phone: contact.phoneNumbers?.[0]?.number || "",
        }

        await sessionService.addInvitesToSession(sessionId, [inviteData])
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
    if (!sessionData) {
      Alert.alert("Error", "Session data not found")
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

      // Create session details for the message
      const sessionDate = formatDate(sessionData.session_datetime)
      const sessionTime = formatTime(sessionData.session_datetime)
      const sessionEndTime = formatTime(sessionData.end_datetime)

      // Create deep link URL with actual session ID and phone number for association
      const deepLinkUrl = `https://netgains.app/${sessionId}?phone=${encodeURIComponent(
        phoneNumber
      )}&invite=true`

      // Create the SMS message
      const duprText =
        sessionData.dupr_min && sessionData.dupr_max
          ? `\n🎯 DUPR: ${sessionData.dupr_min.toFixed(
              2
            )} - ${sessionData.dupr_max.toFixed(2)}`
          : sessionData.dupr_min
          ? `\n🎯 DUPR: ${sessionData.dupr_min.toFixed(2)}+`
          : sessionData.dupr_max
          ? `\n🎯 DUPR: Up to ${sessionData.dupr_max.toFixed(2)}`
          : ""

      const message = `Hey! I'm inviting you to a pickleball session:

🏓 ${sessionData.session_type || sessionData.name || "Pickleball Session"}
📅 ${sessionDate}
⏰ ${sessionTime} - ${sessionEndTime}
📍 ${sessionData.location}
👥 Max ${sessionData.max_players} players${
        sessionData.allow_guests ? " (guests welcome)" : ""
      }${duprText}

Join me! Download Net Gains: ${deepLinkUrl}

See you on the court! 🎾`

      // Enhanced console logging for simulator testing - ALWAYS show this
      console.log("=".repeat(80))
      console.log("📱 SMS INVITATION DETAILS (Simulator Mode)")
      console.log("=".repeat(80))
      console.log("👤 Contact:", contact.name)
      console.log("📞 Phone:", phoneNumber)
      console.log("🔗 Deep Link URL:", deepLinkUrl)
      console.log("📅 Session Date:", sessionDate)
      console.log("⏰ Session Time:", `${sessionTime} - ${sessionEndTime}`)
      console.log("📍 Location:", sessionData.location)
      console.log("👥 Max Players:", sessionData.max_players)
      console.log("🎯 DUPR Range:", duprText || "Not specified")
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

  const formatDate = (date: Date | string) => {
    const dateObj = date instanceof Date ? date : new Date(date)
    return dateObj.toLocaleDateString("en-US", {
      weekday: "long",
      month: "long",
      day: "numeric",
      year: "numeric",
    })
  }

  const formatTime = (time: Date | string) => {
    const timeObj = time instanceof Date ? time : new Date(time)
    return timeObj.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    })
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
      <CustomHeader title="Invite Friends" showBackButton={true} />

      {/* Content */}
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Session Info */}
        {sessionLoading ? (
          <View style={styles.sessionInfoSection}>
            <View style={styles.loadingContainer}>
              <Text style={[styles.loadingText, { color: colors.text }]}>
                Loading session details...
              </Text>
            </View>
          </View>
        ) : (
          <SessionInfoCard
            sessionData={sessionData}
            formatDate={formatDate}
            formatTime={formatTime}
          />
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
        <Pressable style={styles.saveButton} onPress={handleSaveSession}>
          <Text style={styles.saveButtonText}>Done</Text>
        </Pressable>
      </View>

      {/* Create Group Modal */}
      {/* <CreateGroupModal
        visible={showCreateGroupModal}
        onClose={() => setShowCreateGroupModal(false)}
        contacts={contactsForGroup}
        onGroupCreated={() => {
          setShowCreateGroupModal(false)
          Alert.alert("Group Created!", "Group created successfully!", [
            {
              text: "OK",
              onPress: () => {
                router.push("/(tabs)/sessions")
              },
            },
          ])
        }}
      /> */}
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
  sessionInfoSection: {
    marginBottom: 20,
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
