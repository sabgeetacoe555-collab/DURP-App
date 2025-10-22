import React, { useState, useEffect } from "react"
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  TextInput,
  ScrollView,
  Image,
  Modal,
  KeyboardAvoidingView,
  Platform,
} from "react-native"
import { Ionicons } from "@expo/vector-icons"
import { useColorScheme } from "../useColorScheme"
import { AttachmentPicker } from "./AttachmentPicker"
import { Attachment } from "../../types/discussions"

interface CreatePostProps {
  visible: boolean
  onClose: () => void
  onSubmit: (
    title: string,
    content: string,
    attachments: Attachment[],
    postType: "discussion" | "announcement"
  ) => Promise<void>
  submitting?: boolean
  colors: any
}

export const CreatePost: React.FC<CreatePostProps> = ({
  visible,
  onClose,
  onSubmit,
  submitting = false,
  colors,
}) => {
  const [newPostTitle, setNewPostTitle] = useState("")
  const [newPostContent, setNewPostContent] = useState("")
  const [newPostAttachments, setNewPostAttachments] = useState<Attachment[]>([])
  const [isPinned, setIsPinned] = useState(false)
  const [showAttachmentPicker, setShowAttachmentPicker] = useState(false)

  // Reset form state when modal is closed

  // Reset form state when modal is closed
  useEffect(() => {
    if (!visible) {
      setNewPostTitle("")
      setNewPostContent("")
      setNewPostAttachments([])
      setIsPinned(false)
      setShowAttachmentPicker(false)
    }
  }, [visible])

  const handleSubmit = async () => {
    if (!newPostContent.trim() && newPostAttachments.length === 0) return
    if (submitting) return

    try {
      await onSubmit(
        newPostTitle.trim(),
        newPostContent.trim(),
        newPostAttachments,
        isPinned ? "announcement" : "discussion"
      )
      // Reset form
      setNewPostTitle("")
      setNewPostContent("")
      setNewPostAttachments([])
      setIsPinned(false)
      handleClose()
    } catch (error) {
      console.error("Error creating post:", error)
    }
  }

  const handleAttachmentSelected = (attachment: Attachment) => {
    setNewPostAttachments((prev) => [...prev, attachment])
  }

  const removeAttachment = (index: number) => {
    setNewPostAttachments((prev) => prev.filter((_, i) => i !== index))
  }

  const canSubmit =
    newPostContent.trim().length > 0 || newPostAttachments.length > 0

  const handleClose = () => {
    onClose()
  }

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        style={styles.modalContainer}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>
              Create New Post
            </Text>
            <Pressable onPress={onClose}>
              <Ionicons name="close" size={24} color={colors.text} />
            </Pressable>
          </View>

          <ScrollView style={styles.modalScrollContent}>
            <View style={styles.controlsRow}>
              {/* Pinned Toggle */}
              <Pressable
                style={[
                  styles.controlButton,
                  isPinned && {
                    backgroundColor: colors.tint,
                  },
                ]}
                onPress={() => setIsPinned(!isPinned)}
              >
                <Ionicons
                  name="pin"
                  size={16}
                  color={isPinned ? "white" : colors.text}
                />
                <Text
                  style={[
                    styles.controlButtonText,
                    {
                      color: isPinned ? "white" : colors.text,
                    },
                  ]}
                >
                  Pinned
                </Text>
              </Pressable>

              {/* Attachment Button */}
              <Pressable
                style={[
                  styles.controlButton,
                  { borderColor: colors.text + "20" },
                ]}
                onPress={() => setShowAttachmentPicker(true)}
                disabled={submitting}
              >
                <Ionicons name="attach" size={16} color={colors.text} />
                <Text
                  style={[styles.controlButtonText, { color: colors.text }]}
                >
                  Add Attachments
                </Text>
              </Pressable>
            </View>

            <TextInput
              style={[
                styles.titleInput,
                {
                  color: colors.text,
                  borderColor: colors.text + "20",
                  backgroundColor: colors.background,
                },
              ]}
              placeholder="Post title (optional)"
              placeholderTextColor={colors.text + "60"}
              value={newPostTitle}
              onChangeText={setNewPostTitle}
            />

            {/* Pending attachments preview */}
            {newPostAttachments.length > 0 && (
              <View style={styles.pendingAttachmentsContainer}>
                <Text
                  style={[
                    styles.pendingAttachmentsTitle,
                    { color: colors.text },
                  ]}
                >
                  Pending attachments ({newPostAttachments.length})
                </Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  {newPostAttachments.map((attachment, index) => (
                    <View key={index} style={styles.pendingAttachmentItem}>
                      {attachment.file_type === "image" ? (
                        <Image
                          source={{ uri: attachment.file_path }}
                          style={styles.pendingAttachmentImage}
                          resizeMode="cover"
                        />
                      ) : (
                        <View
                          style={[
                            styles.pendingAttachmentFile,
                            { backgroundColor: colors.tint + "20" },
                          ]}
                        >
                          <Ionicons
                            name={
                              attachment.file_type === "document"
                                ? "document"
                                : attachment.file_type === "video"
                                ? "videocam"
                                : "musical-notes"
                            }
                            size={20}
                            color={colors.tint}
                          />
                        </View>
                      )}
                      <Pressable
                        style={styles.removeAttachmentButton}
                        onPress={() => removeAttachment(index)}
                      >
                        <Ionicons
                          name="close-circle"
                          size={20}
                          color="#FF3B30"
                        />
                      </Pressable>
                    </View>
                  ))}
                </ScrollView>
              </View>
            )}

            {/* Message Input */}
            <View style={styles.messageInputContainer}>
              <View style={styles.messageInputWrapper}>
                <TextInput
                  style={[styles.messageInput, { color: colors.text }]}
                  placeholder="What would you like to discuss?"
                  placeholderTextColor={colors.text + "60"}
                  value={newPostContent}
                  onChangeText={setNewPostContent}
                  multiline
                  maxLength={1000}
                  textAlignVertical="top"
                  editable={!submitting}
                />

                {/* Send Button */}
                <Pressable
                  style={[
                    styles.sendButton,
                    {
                      backgroundColor: canSubmit
                        ? colors.tint
                        : colors.text + "20",
                    },
                  ]}
                  onPress={handleSubmit}
                  disabled={!canSubmit || submitting}
                >
                  {submitting ? (
                    <Ionicons name="hourglass" size={20} color="white" />
                  ) : (
                    <Ionicons name="send" size={20} color="white" />
                  )}
                </Pressable>
              </View>
            </View>

            {/* Attachment Picker */}
            <AttachmentPicker
              visible={showAttachmentPicker}
              onClose={() => setShowAttachmentPicker(false)}
              onAttachmentSelected={handleAttachmentSelected}
              entityType="post"
              entityId="pending"
            />
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  )
}

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  modalContent: {
    flex: 1,
    backgroundColor: "white",
    padding: 20,
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: "600",
  },
  modalScrollContent: {
    flex: 1,
  },
  controlsRow: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 16,
  },
  controlButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#ddd",
  },
  controlButtonText: {
    fontSize: 14,
    fontWeight: "500",
  },
  titleInput: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 12,
  },
  pendingAttachmentsContainer: {
    marginBottom: 12,
  },
  pendingAttachmentsTitle: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 8,
  },
  pendingAttachmentItem: {
    position: "relative",
    marginRight: 12,
  },
  pendingAttachmentImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
  },
  pendingAttachmentFile: {
    width: 80,
    height: 80,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  removeAttachmentButton: {
    position: "absolute",
    top: -8,
    right: -8,
    backgroundColor: "white",
    borderRadius: 12,
  },
  messageInputContainer: {
    flex: 1,
  },
  messageInputWrapper: {
    flexDirection: "row",
    alignItems: "flex-start",
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    minHeight: 144,
  },
  messageInput: {
    flex: 1,
    fontSize: 16,
    maxHeight: 120,
    marginRight: 8,
    minHeight: 44,
  },
  sendButton: {
    padding: 8,
    borderRadius: 16,
    width: 36,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
  },
})
