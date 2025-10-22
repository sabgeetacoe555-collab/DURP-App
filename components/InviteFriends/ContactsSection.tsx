import React from "react"
import { View, Text, Pressable, Image } from "react-native"
import { Ionicons } from "@expo/vector-icons"
import { useColorScheme } from "../../components/useColorScheme"
import * as Contacts from "expo-contacts"

type Contact = any

interface ContactsSectionProps {
  contacts: Contact[]
  contactsLoading: boolean
  expanded: boolean
  onToggleSection: () => void
  selectedContacts: string[]
  onToggleContactSelection: (contactId: string) => void
  onSendSMSInvitation: (contact: any) => void
  searchQuery: string
  deduplicatedContacts: Contact[]
}

export default function ContactsSection({
  contacts,
  contactsLoading,
  expanded,
  onToggleSection,
  selectedContacts,
  onToggleContactSelection,
  onSendSMSInvitation,
  searchQuery,
  deduplicatedContacts,
}: ContactsSectionProps) {
  const colors = useColorScheme()

  const filteredContacts = deduplicatedContacts.filter((contact) => {
    if (!searchQuery.trim()) return true
    const query = searchQuery.toLowerCase().trim()
    const name = contact.name?.toLowerCase() || ""
    const nameParts = name.split(" ").filter((part: string) => part.length > 0)
    return (
      nameParts.some((part: string) => part.includes(query)) ||
      name.includes(query)
    )
  })

  return (
    <View style={styles.section}>
      <Pressable style={styles.sectionHeader} onPress={onToggleSection}>
        <View style={styles.sectionHeaderContent}>
          <Ionicons name="person" size={20} color={colors.tint} />
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            Contacts ({filteredContacts.length})
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
          {contactsLoading ? (
            <View style={styles.loadingContainer}>
              <Text style={[styles.loadingText, { color: colors.text }]}>
                Loading contacts...
              </Text>
            </View>
          ) : filteredContacts.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Text style={[styles.emptyText, { color: colors.text }]}>
                {searchQuery.trim()
                  ? `No contacts found matching "${searchQuery}"`
                  : "No contacts found. Add contacts to your device to invite them."}
              </Text>
            </View>
          ) : (
            filteredContacts.map((contact) => {
              const contactId = contact.id || `contact-${Math.random()}`
              return (
                <View
                  key={contactId}
                  style={[
                    styles.contactItem,
                    {
                      borderColor: selectedContacts.includes(contactId)
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
                    <Text style={[styles.contactName, { color: colors.text }]}>
                      {contact.name || "Unknown"}
                    </Text>
                    <Text
                      style={[
                        styles.contactPhone,
                        { color: colors.text + "80" },
                      ]}
                    >
                      {contact.phoneNumbers?.[0]?.number || "No phone number"}
                    </Text>
                  </View>

                  <View style={styles.contactActions}>
                    {/* Selection Checkbox - This now triggers SMS invitation flow */}
                    <Pressable
                      onPress={() => {
                        // First toggle selection
                        onToggleContactSelection(contactId)
                        // Then trigger SMS invitation
                        onSendSMSInvitation(contact)
                      }}
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
  contactItem: {
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
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  defaultAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#f0f0f0",
    alignItems: "center" as const,
    justifyContent: "center" as const,
  },
  contactInfo: {
    flex: 1,
  },
  contactName: {
    fontSize: 16,
    fontWeight: "500" as const,
    marginBottom: 2,
  },
  contactPhone: {
    fontSize: 14,
  },
  contactActions: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    gap: 8,
  },
  smsButton: {
    padding: 8,
    borderRadius: 8,
  },
  selectionButton: {
    padding: 4,
  },
}
