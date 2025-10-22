import React, { useState, useEffect } from "react"
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  Alert,
  ActivityIndicator,
  TextInput,
} from "react-native"
import { useRouter } from "expo-router"
import { Ionicons } from "@expo/vector-icons"
import { useColorScheme } from "@/components/useColorScheme"
import CustomHeader from "@/components/CustomHeader"
import { groupsService } from "@/services/groupsService"
import * as Contacts from "expo-contacts"
import { useAuth } from "@/hooks/useAuth"

export default function CreateGroup() {
  const router = useRouter()
  const colors = useColorScheme()
  const { user } = useAuth()

  // Form state
  const [groupName, setGroupName] = useState("")
  const [description, setDescription] = useState("")
  const [isCreating, setIsCreating] = useState(false)

  // Contacts state
  const [contacts, setContacts] = useState<Contacts.Contact[]>([])
  const [contactsLoading, setContactsLoading] = useState(false)
  const [contactsPermission, setContactsPermission] = useState<boolean | null>(
    null
  )
  const [selectedContacts, setSelectedContacts] = useState<string[]>([])

  // Load contacts on mount
  useEffect(() => {
    loadContacts()
  }, [])

  const loadContacts = async () => {
    try {
      setContactsLoading(true)

      // Request contacts permission
      const { status } = await Contacts.requestPermissionsAsync()
      setContactsPermission(status === "granted")

      if (status === "granted") {
        const { data } = await Contacts.getContactsAsync({
          fields: [
            Contacts.Fields.Name,
            Contacts.Fields.PhoneNumbers,
            Contacts.Fields.Emails,
          ],
        })

        // Filter out contacts without names
        const validContacts = data.filter(
          (contact) => contact.name && contact.name.trim()
        )
        setContacts(validContacts)
      }
    } catch (error) {
      console.error("Error loading contacts:", error)
      Alert.alert("Error", "Failed to load contacts. Please try again.")
    } finally {
      setContactsLoading(false)
    }
  }

  const handleCreateGroup = async () => {
    if (!groupName.trim()) {
      Alert.alert("Missing Information", "Please enter a group name")
      return
    }

    if (selectedContacts.length === 0) {
      Alert.alert(
        "No Members",
        "Please select at least one contact to add to the group"
      )
      return
    }

    setIsCreating(true)

    try {
      // Convert selected contacts to group members format
      const selectedContactObjects = contacts.filter((contact) =>
        selectedContacts.includes(contact.id || "")
      )

      const members = selectedContactObjects.map((contact) => ({
        contact_name: contact.name || "Unknown",
        contact_phone: contact.phoneNumbers?.[0]?.number,
        contact_email: contact.emails?.[0]?.email,
      }))

      const group = await groupsService.createGroup({
        name: groupName.trim(),
        description: description.trim() || undefined,
        members,
      })

      Alert.alert(
        "Group Created!",
        `"${groupName}" group has been created with ${selectedContacts.length} members.`,
        [
          {
            text: "OK",
            onPress: () => {
              router.back()
            },
          },
        ]
      )
    } catch (error) {
      console.error("Error creating group:", error)
      Alert.alert("Error", "Failed to create group. Please try again.")
    } finally {
      setIsCreating(false)
    }
  }

  const toggleContactSelection = (contactId: string) => {
    setSelectedContacts((prev) =>
      prev.includes(contactId)
        ? prev.filter((id) => id !== contactId)
        : [...prev, contactId]
    )
  }

  const renderContactItem = (contact: Contacts.Contact) => {
    const isSelected = selectedContacts.includes(contact.id || "")

    return (
      <Pressable
        key={contact.id}
        style={[
          styles.contactItem,
          {
            borderColor: colors.text + "20",
            backgroundColor: isSelected ? colors.tint + "10" : "#f8f9fa",
          },
        ]}
        onPress={() => toggleContactSelection(contact.id || "")}
      >
        <View style={styles.contactInfo}>
          <Text style={[styles.contactName, { color: colors.text }]}>
            {contact.name || "Unknown"}
          </Text>
          {contact.phoneNumbers?.[0]?.number && (
            <Text style={[styles.contactPhone, { color: colors.text + "80" }]}>
              {contact.phoneNumbers[0].number}
            </Text>
          )}
        </View>
        <Ionicons
          name={isSelected ? "checkmark-circle" : "ellipse-outline"}
          size={20}
          color={isSelected ? colors.tint : colors.text + "40"}
        />
      </Pressable>
    )
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <CustomHeader title="Create Group" showBackButton={true} />

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Group Details Section */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            Group Details
          </Text>

          {/* Group Name */}
          <View style={styles.formRow}>
            <Text style={[styles.label, { color: colors.text }]}>
              Group Name<Text style={{ color: "red" }}> *</Text>
            </Text>
            <TextInput
              style={[
                styles.textInput,
                {
                  borderColor: colors.text + "30",
                  color: colors.text,
                  backgroundColor: colors.background,
                },
              ]}
              value={groupName}
              onChangeText={setGroupName}
              placeholder="Enter group name"
              placeholderTextColor={colors.text + "60"}
              maxLength={50}
              editable={!isCreating}
            />
          </View>

          {/* Description */}
          <View style={styles.formRow}>
            <Text style={[styles.label, { color: colors.text }]}>
              Description (Optional)
            </Text>
            <TextInput
              style={[
                styles.textArea,
                {
                  borderColor: colors.text + "30",
                  color: colors.text,
                  backgroundColor: colors.background,
                },
              ]}
              value={description}
              onChangeText={setDescription}
              placeholder="Add a description for this group"
              placeholderTextColor={colors.text + "60"}
              multiline
              numberOfLines={3}
              maxLength={200}
              editable={!isCreating}
            />
          </View>
        </View>

        {/* Contacts Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              Add Members ({selectedContacts.length} selected)
            </Text>
            {contactsPermission === false && (
              <Pressable onPress={loadContacts} style={styles.permissionButton}>
                <Text
                  style={[styles.permissionButtonText, { color: colors.tint }]}
                >
                  Grant Permission
                </Text>
              </Pressable>
            )}
          </View>

          {contactsPermission === false ? (
            <View style={styles.permissionContainer}>
              <Ionicons
                name="lock-closed-outline"
                size={48}
                color={colors.text + "40"}
              />
              <Text style={[styles.permissionText, { color: colors.text }]}>
                Contacts permission is required to add members to your group.
              </Text>
              <Pressable
                style={[
                  styles.permissionButton,
                  { backgroundColor: colors.tint },
                ]}
                onPress={loadContacts}
              >
                <Text style={styles.permissionButtonText}>
                  Grant Permission
                </Text>
              </Pressable>
            </View>
          ) : contactsLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={colors.tint} />
              <Text style={[styles.loadingText, { color: colors.text }]}>
                Loading contacts...
              </Text>
            </View>
          ) : contacts.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Ionicons
                name="people-outline"
                size={48}
                color={colors.text + "40"}
              />
              <Text style={[styles.emptyText, { color: colors.text }]}>
                No contacts found
              </Text>
            </View>
          ) : (
            <View style={styles.contactsList}>
              {contacts.map(renderContactItem)}
            </View>
          )}
        </View>
      </ScrollView>

      {/* Action Button */}
      <View style={styles.actionButtonContainer}>
        <Pressable
          style={[
            styles.createButton,
            {
              backgroundColor: isCreating ? colors.text + "40" : colors.tint,
            },
          ]}
          onPress={handleCreateGroup}
          disabled={isCreating}
        >
          {isCreating ? (
            <ActivityIndicator size="small" color="white" />
          ) : (
            <Text style={styles.createButtonText}>Create Group</Text>
          )}
        </Pressable>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  section: {
    marginTop: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 16,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  formRow: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: "500",
    marginBottom: 8,
  },
  textInput: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
  },
  textArea: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
    minHeight: 80,
    textAlignVertical: "top",
  },
  contactsList: {
    gap: 8,
  },
  contactItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
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
  permissionContainer: {
    alignItems: "center",
    paddingVertical: 40,
  },
  permissionText: {
    fontSize: 16,
    textAlign: "center",
    marginVertical: 16,
    paddingHorizontal: 20,
  },
  permissionButton: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
  },
  permissionButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
  },
  loadingContainer: {
    alignItems: "center",
    paddingVertical: 40,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
  },
  emptyContainer: {
    alignItems: "center",
    paddingVertical: 40,
  },
  emptyText: {
    marginTop: 16,
    fontSize: 16,
  },
  actionButtonContainer: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    paddingBottom: 32,
    borderTopWidth: 1,
    borderTopColor: "#e0e0e0",
  },
  createButton: {
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  createButtonText: {
    color: "white",
    fontSize: 18,
    fontWeight: "600",
  },
})
