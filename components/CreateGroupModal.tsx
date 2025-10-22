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
  Modal,
} from "react-native"
import { Ionicons } from "@expo/vector-icons"
import { useColorScheme } from "@/components/useColorScheme"
import { groupsService } from "@/services/groupsService"
import { useAuth } from "@/hooks/useAuth"
import { useRouter } from "expo-router"

interface CreateGroupModalProps {
  visible: boolean
  onClose: () => void
  onGroupCreated?: () => void
}

export default function CreateGroupModal({
  visible,
  onClose,
  onGroupCreated,
}: CreateGroupModalProps) {
  const colors = useColorScheme()
  const { user } = useAuth()
  const router = useRouter()

  // Form state
  const [groupName, setGroupName] = useState("")
  const [description, setDescription] = useState("")
  const [isCreating, setIsCreating] = useState(false)

  // Reset form when modal opens/closes
  useEffect(() => {
    if (!visible) {
      // Reset form when modal closes
      setGroupName("")
      setDescription("")
      setIsCreating(false)
    }
  }, [visible])

  const handleCreateGroup = async () => {
    if (!groupName.trim()) {
      Alert.alert("Missing Information", "Please enter a group name")
      return
    }

    setIsCreating(true)

    try {
      // Create the group
      const group = await groupsService.createGroup({
        name: groupName.trim(),
        description: description.trim() || undefined,
        members: [], // Start with empty members array
      })

      // Close modal and navigate to group's About tab
      onGroupCreated?.()
      onClose()
      // Navigate to the group's About tab
      router.push(`/(tabs)/groups/${group.id}?tab=about`)
    } catch (error) {
      console.error("Error creating group:", error)
      Alert.alert("Error", "Failed to create group. Please try again.")
    } finally {
      setIsCreating(false)
    }
  }

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        {/* Header */}
        <View
          style={[styles.header, { borderBottomColor: colors.text + "20" }]}
        >
          <Pressable onPress={onClose} style={styles.closeButton}>
            <Ionicons name="close" size={24} color={colors.text} />
          </Pressable>
          <Text style={[styles.headerTitle, { color: colors.text }]}>
            Create Group
          </Text>
          <View style={styles.headerSpacer} />
        </View>

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

          {/* Info Section */}
          <View style={styles.section}>
            <View style={styles.infoContainer}>
              <Ionicons
                name="information-circle-outline"
                size={24}
                color={colors.tint}
              />
              <Text style={[styles.infoText, { color: colors.text }]}>
                You can invite members to your group after creating it from the
                group's About tab.
              </Text>
            </View>
          </View>
        </ScrollView>

        {/* Action Button */}
        <View
          style={[
            styles.actionButtonContainer,
            { borderTopColor: colors.text + "20" },
          ]}
        >
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
    </Modal>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  closeButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "600",
  },
  headerSpacer: {
    width: 32, // Same width as close button to center the title
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
  infoContainer: {
    flexDirection: "row",
    alignItems: "flex-start",
    backgroundColor: "#f0f8ff",
    padding: 16,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#e0f2ff",
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    marginLeft: 12,
    lineHeight: 20,
  },
  actionButtonContainer: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    paddingBottom: 32,
    borderTopWidth: 1,
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
