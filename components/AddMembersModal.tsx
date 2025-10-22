import React, { useState, useEffect, useCallback, useMemo } from "react"
import {
  StyleSheet,
  View,
  Text,
  Pressable,
  ScrollView,
  Alert,
  Image,
  TextInput,
} from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"
import { Ionicons } from "@expo/vector-icons"
import { useColorScheme } from "@/components/useColorScheme"
import Colors from "@/constants/Colors"
import * as Contacts from "expo-contacts"
import * as SMS from "expo-sms"
import { groupsService } from "@/services/groupsService"
import { sessionService } from "@/services/sessionService"
import { supabase } from "@/lib/supabase"
import BottomSheet, {
  BottomSheetView,
  BottomSheetScrollView,
  BottomSheetBackdrop,
} from "@gorhom/bottom-sheet"

interface AddMembersModalProps {
  isVisible: boolean
  onClose: () => void
  groupId: string
  groupName: string
  groupMembers?: Array<{
    contact_phone?: string
    contact_email?: string
  }>
  onMembersAdded: () => void
}

export default function AddMembersModal({
  isVisible,
  onClose,
  groupId,
  groupName,
  groupMembers = [],
  onMembersAdded,
}: AddMembersModalProps) {
  const colors = useColorScheme()

  // Bottom sheet ref and snap points
  const bottomSheetRef = React.useRef<BottomSheet>(null)
  const snapPoints = useMemo(() => ["95%"], [])

  // Contacts functionality
  const [selectedContacts, setSelectedContacts] = useState<string[]>([])
  const [invitedContacts, setInvitedContacts] = useState<Contacts.Contact[]>([])
  const [contacts, setContacts] = useState<Contacts.Contact[]>([])
  const [contactsLoading, setContactsLoading] = useState(false)
  const [contactsPermission, setContactsPermission] = useState<boolean | null>(
    null
  )

  // Friends functionality (session invitees)
  const [friends, setFriends] = useState<any[]>([])
  const [friendsLoading, setFriendsLoading] = useState(false)
  const [selectedFriends, setSelectedFriends] = useState<string[]>([])

  // Session invites for deduplication
  const [sessionInvites, setSessionInvites] = useState<any[]>([])

  // Users who have accepted invites (have accounts)
  const [acceptedUsers, setAcceptedUsers] = useState<any[]>([])

  // Loading states for deduplication data
  const [sessionInvitesLoading, setSessionInvitesLoading] = useState(false)
  const [acceptedUsersLoading, setAcceptedUsersLoading] = useState(false)

  // Search functionality
  const [searchQuery, setSearchQuery] = useState("")

  // Expandable sections state
  const [expandedSections, setExpandedSections] = useState({
    friends: true,
    contacts: true,
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

  // Filter friends based on search query
  const filteredFriends = friends.filter((friend) => {
    if (!searchQuery.trim()) return true

    const query = searchQuery.toLowerCase().trim()
    const name = friend.invitee_name?.toLowerCase() || ""

    return name.includes(query)
  })

  // Remove duplicates from contacts (same phone number)
  const deduplicatedContacts = filteredContacts.filter(
    (contact, index, self) =>
      index ===
      self.findIndex(
        (c) => c.phoneNumbers?.[0]?.number === contact.phoneNumbers?.[0]?.number
      )
  )

  // Remove friends that are already in the group or have accepted invites (deduplication by phone number)
  const deduplicatedFriends = filteredFriends.filter((friend) => {
    const friendPhone = friend.invitee_phone
    if (!friendPhone) return true

    // Check if this friend is already in the group
    const isAlreadyInGroup = groupMembers?.some(
      (member) => member.contact_phone === friendPhone
    )

    // Check if this friend has accepted an invite (has an account)
    const hasAcceptedInvite = acceptedUsers.some(
      (user) => user.phone === friendPhone
    )

    return !isAlreadyInGroup && !hasAcceptedInvite
  })

  // Only filter contacts if all deduplication data is loaded
  const isDeduplicationDataLoaded =
    !sessionInvitesLoading && !acceptedUsersLoading

  // Remove contacts that are already friends, in the group, have been invited, or have accepted invites (deduplication by phone number)
  const finalDeduplicatedContacts = isDeduplicationDataLoaded
    ? deduplicatedContacts.filter((contact) => {
        const contactPhone = contact.phoneNumbers?.[0]?.number
        if (!contactPhone) return true

        // Check if this contact is already a friend
        const isAlreadyFriend = friends.some(
          (friend) => friend.invitee_phone === contactPhone
        )

        // Check if this contact is already in the group
        const isAlreadyInGroup = groupMembers?.some(
          (member) => member.contact_phone === contactPhone
        )

        // Check if this contact has been invited (session_invites)
        const hasBeenInvited = sessionInvites.some(
          (invite) => invite.invitee_phone === contactPhone
        )

        // Check if this contact has accepted an invite (has an account in users table)
        const hasAcceptedInvite = acceptedUsers.some(
          (user) => user.phone === contactPhone
        )

        return (
          !isAlreadyFriend &&
          !isAlreadyInGroup &&
          !hasBeenInvited &&
          !hasAcceptedInvite
        )
      })
    : deduplicatedContacts

  // Load friends (session invitees)
  const loadFriends = async () => {
    try {
      setFriendsLoading(true)
      const friendsData = await sessionService.getUniqueInvitees()
      setFriends(friendsData)
    } catch (error) {
      console.error("Error loading friends:", error)
    } finally {
      setFriendsLoading(false)
    }
  }

  // Load session invites for deduplication
  const loadSessionInvites = async () => {
    try {
      setSessionInvitesLoading(true)
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) return

      const { data: invites } = await supabase
        .from("session_invites")
        .select("*")
        .eq("inviter_id", user.id)

      console.log("Loaded session invites:", invites?.length || 0, invites)
      setSessionInvites(invites || [])
    } catch (error) {
      console.error("Error loading session invites:", error)
    } finally {
      setSessionInvitesLoading(false)
    }
  }

  // Load users who have accepted invites (have accounts)
  const loadAcceptedUsers = async () => {
    try {
      setAcceptedUsersLoading(true)
      const { data: users } = await supabase
        .from("users")
        .select("id, phone, email")
        .not("phone", "is", null)

      console.log("Loaded accepted users:", users?.length || 0, users)
      setAcceptedUsers(users || [])
    } catch (error) {
      console.error("Error loading accepted users:", error)
    } finally {
      setAcceptedUsersLoading(false)
    }
  }

  // Load contacts
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
            Contacts.Fields.Image,
          ],
        })

        if (data.length > 0) {
          // Filter contacts with phone numbers
          const contactsWithPhone = data.filter(
            (contact) => contact.phoneNumbers && contact.phoneNumbers.length > 0
          )
          setContacts(contactsWithPhone)
        }
      }
    } catch (error) {
      console.error("Error loading contacts:", error)
    } finally {
      setContactsLoading(false)
    }
  }

  // Toggle section expansion
  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }))
  }

  // Toggle friend selection
  const toggleFriendSelection = (friendId: string) => {
    setSelectedFriends((prev) =>
      prev.includes(friendId)
        ? prev.filter((id) => id !== friendId)
        : [...prev, friendId]
    )
  }

  // Toggle contact selection
  const toggleContactSelection = (contactId: string) => {
    setSelectedContacts((prev) =>
      prev.includes(contactId)
        ? prev.filter((id) => id !== contactId)
        : [...prev, contactId]
    )
  }

  // Handle successful invitation
  const handleSuccessfulInvitation = (contact: Contacts.Contact) => {
    // Add to invited contacts list
    setInvitedContacts((prev) => [...prev, contact])

    // Remove from selected contacts if they were selected
    setSelectedContacts((prev) =>
      prev.filter((id) => id !== (contact.id || `contact-${Math.random()}`))
    )

    Alert.alert(
      "Invitation Sent!",
      `SMS invitation sent to ${
        contact.name || "your contact"
      }. They've been added to your invited list!`
    )
  }

  // Send SMS invitation
  const sendSMSInvitation = async (contact: Contacts.Contact) => {
    try {
      // Check if SMS is available
      const isAvailable = await SMS.isAvailableAsync()
      if (!isAvailable) {
        // For simulator or devices without SMS, simulate successful invitation
        handleSuccessfulInvitation(contact)
        return
      }

      // Get phone number
      const phoneNumber = contact.phoneNumbers?.[0]?.number
      if (!phoneNumber) {
        Alert.alert(
          "No Phone Number",
          "This contact doesn't have a phone number."
        )
        return
      }

      // Create the SMS message
      const message = `Hey! I'm inviting you to join my group "${groupName}" on Net Gains!

👥 Join our group to stay connected and get invited to future sessions.

Download Net Gains and join the group: https://netgains.app/group/${groupId}

See you there! 🎾`

      // Send SMS
      const { result } = await SMS.sendSMSAsync([phoneNumber], message)

      if (result === "sent") {
        handleSuccessfulInvitation(contact)
      } else {
        Alert.alert("SMS Not Sent", "The SMS was not sent. Please try again.")
      }
    } catch (error) {
      console.error("Error sending SMS:", error)
      Alert.alert("Error", "Failed to send SMS invitation. Please try again.")
    }
  }

  // Send SMS to selected contacts and friends
  const sendSMSToSelected = async () => {
    if (selectedContacts.length === 0 && selectedFriends.length === 0) {
      Alert.alert(
        "No Contacts Selected",
        "Please select contacts or friends to invite."
      )
      return
    }

    try {
      // Send SMS to selected contacts
      for (const contactId of selectedContacts) {
        const contact = contacts.find((c) => c.id === contactId)
        if (contact) {
          await sendSMSInvitation(contact)
        }
      }

      // Send SMS to selected friends
      for (const friendId of selectedFriends) {
        const friend = friends.find((f) => f.invitee_phone === friendId)
        if (friend) {
          await sendSMSInvitation({
            name: friend.invitee_name,
            phoneNumbers: [{ number: friend.invitee_phone }],
          } as Contacts.Contact)
        }
      }
    } catch (error) {
      console.error("Error sending SMS to selected:", error)
      Alert.alert(
        "Error",
        "Failed to send some SMS invitations. Please try again."
      )
    }
  }

  // Add selected contacts and friends to group
  const addSelectedToGroup = async () => {
    if (selectedContacts.length === 0 && selectedFriends.length === 0) {
      Alert.alert(
        "No Contacts Selected",
        "Please select contacts or friends to add to the group."
      )
      return
    }

    try {
      const selectedContactData = selectedContacts.map((contactId) => {
        const contact = contacts.find((c) => c.id === contactId)
        return {
          contact_name: contact?.name || "Unknown",
          contact_phone: contact?.phoneNumbers?.[0]?.number || "",
          contact_email: contact?.emails?.[0]?.email || "",
        }
      })

      const selectedFriendData = selectedFriends.map((friendId) => {
        const friend = friends.find((f) => f.invitee_phone === friendId)
        return {
          contact_name: friend?.invitee_name || "Unknown",
          contact_phone: friend?.invitee_phone || "",
          contact_email: friend?.invitee_email || "",
        }
      })

      const allSelectedData = [...selectedContactData, ...selectedFriendData]

      // Add each contact/friend to the group
      for (const contactData of allSelectedData) {
        await groupsService.addGroupMember(groupId, contactData)
      }

      Alert.alert(
        "Success",
        `${allSelectedData.length} contact(s) added to the group!`,
        [
          {
            text: "OK",
            onPress: () => {
              onMembersAdded()
              onClose()
            },
          },
        ]
      )
    } catch (error) {
      console.error("Error adding contacts to group:", error)
      Alert.alert("Error", "Failed to add contacts to group. Please try again.")
    }
  }

  // Load contacts and friends when modal opens
  useEffect(() => {
    if (isVisible) {
      loadContacts()
      loadFriends()
      loadSessionInvites()
      loadAcceptedUsers()
    }
  }, [isVisible])

  if (!isVisible) return null

  return (
    <BottomSheet
      ref={bottomSheetRef}
      index={isVisible ? 0 : -1}
      snapPoints={snapPoints}
      enablePanDownToClose
      onClose={onClose}
      backgroundStyle={{
        backgroundColor: colors.background,
        paddingBottom: 50, // Add padding to the bottom sheet background
      }}
      handleIndicatorStyle={{ backgroundColor: colors.text + "40" }}
      backdropComponent={(props) => (
        <BottomSheetBackdrop
          {...props}
          appearsOnIndex={0}
          disappearsOnIndex={-1}
          opacity={0.6}
        />
      )}
      enableOverDrag={false}
    >
      <SafeAreaView style={styles.container} edges={["bottom"]}>
        <BottomSheetView style={styles.container}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={[styles.headerTitle, { color: colors.text }]}>
              Add Members to {groupName}
            </Text>
            <Pressable style={styles.closeButton} onPress={onClose}>
              <Ionicons name="close" size={24} color={colors.text} />
            </Pressable>
          </View>

          {/* Search Bar */}
          <View style={styles.searchContainer}>
            <Ionicons name="search" size={20} color={colors.text + "60"} />
            <TextInput
              style={[styles.searchInput, { color: colors.text }]}
              placeholder="Search contacts..."
              placeholderTextColor={colors.text + "60"}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </View>

          <BottomSheetScrollView
            style={styles.content}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            {/* Selection Summary */}
            {(selectedContacts.length > 0 || selectedFriends.length > 0) && (
              <View
                style={[styles.selectionSummary, { borderColor: colors.tint }]}
              >
                <Text
                  style={[styles.selectionSummaryText, { color: colors.text }]}
                >
                  Selected: {selectedContacts.length} contact(s),{" "}
                  {selectedFriends.length} friend(s)
                </Text>
              </View>
            )}

            {/* Action Buttons */}
            {(selectedContacts.length > 0 || selectedFriends.length > 0) && (
              <View style={styles.actionButtons}>
                <Pressable
                  style={[
                    styles.actionButton,
                    { backgroundColor: colors.tint },
                  ]}
                  onPress={sendSMSToSelected}
                >
                  <Ionicons name="chatbubbles" size={16} color="white" />
                  <Text style={styles.actionButtonText}>
                    Send SMS to{" "}
                    {selectedContacts.length + selectedFriends.length} selected
                  </Text>
                </Pressable>

                <Pressable
                  style={[styles.actionButton, { backgroundColor: "#4CAF50" }]}
                  onPress={addSelectedToGroup}
                >
                  <Ionicons name="add-circle" size={16} color="white" />
                  <Text style={styles.actionButtonText}>
                    Add {selectedContacts.length + selectedFriends.length} to
                    Group
                  </Text>
                </Pressable>
              </View>
            )}

            {/* Friends Section */}
            <View style={styles.section}>
              <Pressable
                style={styles.sectionHeader}
                onPress={() => toggleSection("friends")}
              >
                <View style={styles.sectionHeaderContent}>
                  <Ionicons name="heart" size={20} color={colors.tint} />
                  <Text style={[styles.sectionTitle, { color: colors.text }]}>
                    Friends ({deduplicatedFriends.length})
                  </Text>
                </View>
                <Ionicons
                  name={
                    expandedSections.friends ? "chevron-up" : "chevron-down"
                  }
                  size={20}
                  color={colors.text}
                />
              </Pressable>

              {expandedSections.friends && (
                <View style={styles.sectionContent}>
                  {friendsLoading ? (
                    <View style={styles.loadingContainer}>
                      <Text
                        style={[styles.loadingText, { color: colors.text }]}
                      >
                        Loading friends...
                      </Text>
                    </View>
                  ) : deduplicatedFriends.length === 0 ? (
                    <View style={styles.emptyContainer}>
                      <Text style={[styles.emptyText, { color: colors.text }]}>
                        {searchQuery.trim()
                          ? `No friends found matching "${searchQuery}"`
                          : "No friends found. Invite people to sessions to build your friends list."}
                      </Text>
                    </View>
                  ) : (
                    deduplicatedFriends.map((friend) => {
                      const friendId = friend.invitee_phone
                      return (
                        <View
                          key={friendId}
                          style={[
                            styles.friendItem,
                            {
                              borderColor: selectedFriends.includes(friendId)
                                ? colors.tint
                                : "#ddd",
                            },
                          ]}
                        >
                          {/* Avatar */}
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
                            <Text
                              style={[
                                styles.friendName,
                                { color: colors.text },
                              ]}
                            >
                              {friend.invitee_name || "Unknown"}
                            </Text>
                            <Text
                              style={[
                                styles.friendPhone,
                                { color: colors.text + "80" },
                              ]}
                            >
                              {friend.invitee_phone || "No phone number"}
                            </Text>
                          </View>

                          <View style={styles.friendActions}>
                            {/* SMS Button */}
                            <Pressable
                              style={[
                                styles.smsButton,
                                { backgroundColor: colors.tint },
                              ]}
                              onPress={() =>
                                sendSMSInvitation({
                                  name: friend.invitee_name,
                                  phoneNumbers: [
                                    { number: friend.invitee_phone },
                                  ],
                                } as Contacts.Contact)
                              }
                            >
                              <Ionicons
                                name="chatbubble"
                                size={16}
                                color="white"
                              />
                            </Pressable>

                            {/* Selection Checkbox */}
                            <Pressable
                              onPress={() => toggleFriendSelection(friendId)}
                              style={styles.selectionButton}
                            >
                              <Ionicons
                                name={
                                  selectedFriends.includes(friendId)
                                    ? "checkmark-circle"
                                    : "ellipse-outline"
                                }
                                size={24}
                                color={
                                  selectedFriends.includes(friendId)
                                    ? colors.tint
                                    : colors.text + "60"
                                }
                              />
                            </Pressable>
                          </View>
                        </View>
                      )
                    })
                  )}
                </View>
              )}
            </View>

            {/* Contacts Section */}
            <View style={styles.section}>
              <Pressable
                style={styles.sectionHeader}
                onPress={() => toggleSection("contacts")}
              >
                <View style={styles.sectionHeaderContent}>
                  <Ionicons name="call" size={20} color={colors.tint} />
                  <Text style={[styles.sectionTitle, { color: colors.text }]}>
                    Contacts (
                    {isDeduplicationDataLoaded
                      ? finalDeduplicatedContacts.length
                      : deduplicatedContacts.length}
                    )
                  </Text>
                </View>
                <Ionicons
                  name={
                    expandedSections.contacts ? "chevron-up" : "chevron-down"
                  }
                  size={20}
                  color={colors.text}
                />
              </Pressable>

              {expandedSections.contacts && (
                <View style={styles.sectionContent}>
                  {contactsLoading || !isDeduplicationDataLoaded ? (
                    <View style={styles.loadingContainer}>
                      <Text
                        style={[styles.loadingText, { color: colors.text }]}
                      >
                        {contactsLoading
                          ? "Loading contacts..."
                          : "Preparing contacts..."}
                      </Text>
                    </View>
                  ) : finalDeduplicatedContacts.length === 0 ? (
                    <View style={styles.emptyContainer}>
                      <Text style={[styles.emptyText, { color: colors.text }]}>
                        {searchQuery.trim()
                          ? `No contacts found matching "${searchQuery}"`
                          : contactsPermission === false
                          ? "Contacts permission denied. Please enable in settings."
                          : "No contacts found with phone numbers."}
                      </Text>
                    </View>
                  ) : (
                    finalDeduplicatedContacts
                      .filter(
                        (contact) =>
                          !invitedContacts.some(
                            (invited) => invited.id === contact.id
                          )
                      )
                      .map((contact) => {
                        const contactId =
                          contact.id || `contact-${Math.random()}`
                        return (
                          <View
                            key={contactId}
                            style={[
                              styles.contactItem,
                              {
                                borderColor: selectedContacts.includes(
                                  contactId
                                )
                                  ? colors.tint
                                  : "#ddd",
                              },
                            ]}
                          >
                            {/* Avatar */}
                            <View style={styles.avatarContainer}>
                              {contact.image ? (
                                <Image
                                  source={{ uri: contact.image.uri }}
                                  style={styles.avatar}
                                />
                              ) : (
                                <View style={styles.defaultAvatar}>
                                  <Ionicons
                                    name="person"
                                    size={20}
                                    color={colors.text + "80"}
                                  />
                                </View>
                              )}
                            </View>

                            <View style={styles.contactInfo}>
                              <Text
                                style={[
                                  styles.contactName,
                                  { color: colors.text },
                                ]}
                              >
                                {contact.name || "Unknown"}
                              </Text>
                              <Text
                                style={[
                                  styles.contactPhone,
                                  { color: colors.text + "80" },
                                ]}
                              >
                                {contact.phoneNumbers?.[0]?.number ||
                                  "No phone number"}
                              </Text>
                            </View>

                            <View style={styles.contactActions}>
                              {/* SMS Button */}
                              <Pressable
                                style={[
                                  styles.smsButton,
                                  { backgroundColor: colors.tint },
                                ]}
                                onPress={() => sendSMSInvitation(contact)}
                              >
                                <Ionicons
                                  name="chatbubble"
                                  size={16}
                                  color="white"
                                />
                              </Pressable>

                              {/* Selection Checkbox */}
                              <Pressable
                                onPress={() =>
                                  toggleContactSelection(contactId)
                                }
                                style={styles.selectionButton}
                              >
                                <Ionicons
                                  name={
                                    selectedContacts.includes(contactId)
                                      ? "checkmark-circle"
                                      : "ellipse-outline"
                                  }
                                  size={24}
                                  color={
                                    selectedContacts.includes(contactId)
                                      ? colors.tint
                                      : colors.text + "60"
                                  }
                                />
                              </Pressable>
                            </View>
                          </View>
                        )
                      })
                  )}
                </View>
              )}
            </View>

            {/* Bottom spacer to ensure last item is visible */}
            <View style={{ height: 100 }} />
          </BottomSheetScrollView>
        </BottomSheetView>
      </SafeAreaView>
    </BottomSheet>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 8,
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
  headerTitle: {
    fontSize: 18,
    fontWeight: "bold",
    flex: 1,
  },
  closeButton: {
    padding: 8,
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
  },
  searchInput: {
    flex: 1,
    marginLeft: 12,
    fontSize: 16,
    paddingVertical: 8,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  scrollContent: {
    paddingBottom: 50, // Reduced padding since we're using snap points now
  },
  selectionSummary: {
    padding: 12,
    borderWidth: 1,
    borderRadius: 8,
    marginVertical: 12,
  },
  selectionSummaryText: {
    fontSize: 14,
    fontWeight: "500",
  },
  actionButtons: {
    gap: 12,
    marginBottom: 20,
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    gap: 8,
  },
  actionButtonText: {
    color: "white",
    fontSize: 14,
    fontWeight: "600",
  },
  section: {
    marginBottom: 20,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 12,
  },
  sectionHeaderContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
  },
  sectionContent: {
    marginTop: 8,
  },
  loadingContainer: {
    paddingVertical: 20,
    alignItems: "center",
  },
  loadingText: {
    fontSize: 14,
  },
  emptyContainer: {
    paddingVertical: 20,
    alignItems: "center",
  },
  emptyText: {
    fontSize: 14,
    textAlign: "center",
  },
  contactItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    borderWidth: 1,
    borderRadius: 8,
    marginBottom: 8,
  },
  avatarContainer: {
    marginRight: 12,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  defaultAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#e0e0e0",
    justifyContent: "center",
    alignItems: "center",
  },
  contactInfo: {
    flex: 1,
  },
  contactName: {
    fontSize: 16,
    fontWeight: "500",
    marginBottom: 2,
  },
  contactPhone: {
    fontSize: 14,
  },
  contactActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  // Friend styles (same as contact styles)
  friendItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    borderWidth: 1,
    borderRadius: 8,
    marginBottom: 8,
  },
  friendInfo: {
    flex: 1,
  },
  friendName: {
    fontSize: 16,
    fontWeight: "500",
    marginBottom: 2,
  },
  friendPhone: {
    fontSize: 14,
  },
  friendActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  smsButton: {
    padding: 8,
    borderRadius: 6,
  },
  selectionButton: {
    padding: 4,
  },
})
