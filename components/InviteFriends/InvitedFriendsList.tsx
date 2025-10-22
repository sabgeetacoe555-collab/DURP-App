import React from "react"
import { View, Text, Image } from "react-native"
import { Ionicons } from "@expo/vector-icons"
import { useColorScheme } from "../../components/useColorScheme"
import * as Contacts from "expo-contacts"

type Contact = any

interface InvitedFriendsListProps {
  invitedFriends: Contact[]
}

export default function InvitedFriendsList({
  invitedFriends,
}: InvitedFriendsListProps) {
  const colors = useColorScheme()

  if (invitedFriends.length === 0) {
    return null
  }

  return (
    <View style={styles.invitedFriendsSection}>
      <Text style={[styles.sectionTitle, { color: colors.text }]}>
        Invited Friends ({invitedFriends.length})
      </Text>
      <Text style={[styles.sectionSubtitle, { color: colors.text + "80" }]}>
        These friends have been sent SMS invitations
      </Text>

      {invitedFriends.map((contact) => {
        const contactId = contact.id || `contact-${Math.random()}`
        return (
          <View
            key={contactId}
            style={[styles.invitedFriendItem, { borderColor: colors.tint }]}
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

            <View style={styles.friendInfo}>
              <Text style={[styles.friendName, { color: colors.text }]}>
                {contact.name || "Unknown"}
              </Text>
              <Text style={[styles.friendPhone, { color: colors.text + "80" }]}>
                {contact.phoneNumbers?.[0]?.number || "No phone number"}
              </Text>
            </View>

            <View style={styles.invitedStatus}>
              <Ionicons name="checkmark-circle" size={24} color={colors.tint} />
              <Text style={[styles.invitedText, { color: colors.tint }]}>
                Invited
              </Text>
            </View>
          </View>
        )
      })}
    </View>
  )
}

const styles = {
  invitedFriendsSection: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600" as const,
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontSize: 14,
    marginBottom: 12,
  },
  invitedFriendItem: {
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
  invitedStatus: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    gap: 4,
  },
  invitedText: {
    fontSize: 14,
    fontWeight: "500" as const,
  },
}
