import React, { useState } from "react"
import {
  View,
  TextInput,
  StyleSheet,
  Pressable,
  ActivityIndicator,
  ScrollView,
  Image,
  Text,
} from "react-native"
import { Ionicons } from "@expo/vector-icons"
import { AttachmentPicker } from "./AttachmentPicker"
import { Attachment } from "../../types/discussions"

interface ReplyInputProps {
  onSubmit: (content: string, attachments: Attachment[]) => Promise<void>
  submitting?: boolean
  colors: any
  placeholder?: string
}

export const ReplyInput: React.FC<ReplyInputProps> = ({
  onSubmit,
  submitting = false,
  colors,
  placeholder = "Type a reply...",
}) => {
  const [replyContent, setReplyContent] = useState("")
  const [showAttachmentPicker, setShowAttachmentPicker] = useState(false)
  const [pendingAttachments, setPendingAttachments] = useState<Attachment[]>([])

  const handleSubmit = async () => {
    if (!replyContent.trim() && pendingAttachments.length === 0) return
    if (submitting) return

    try {
      await onSubmit(replyContent.trim(), pendingAttachments)
      setReplyContent("")
      setPendingAttachments([])
    } catch (error) {
      console.error("Error submitting reply:", error)
    }
  }

  const handleAttachmentSelected = (attachment: Attachment) => {
    setPendingAttachments((prev) => [...prev, attachment])
  }

  const removeAttachment = (index: number) => {
    setPendingAttachments((prev) => prev.filter((_, i) => i !== index))
  }

  const canSubmit =
    replyContent.trim().length > 0 || pendingAttachments.length > 0

  return (
    <>
      {/* Pending attachments preview */}
      {pendingAttachments.length > 0 && (
        <View style={styles.pendingAttachmentsContainer}>
          <Text
            style={[styles.pendingAttachmentsTitle, { color: colors.text }]}
          >
            Pending attachments ({pendingAttachments.length})
          </Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {pendingAttachments.map((attachment, index) => (
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
                  <Ionicons name="close-circle" size={20} color="#FF3B30" />
                </Pressable>
              </View>
            ))}
          </ScrollView>
        </View>
      )}

      {/* Message Input */}
      <View
        style={[
          styles.messageInputContainer,
          { backgroundColor: colors.background },
        ]}
      >
        <View style={styles.messageInputWrapper}>
          <TextInput
            style={[styles.messageInput, { color: colors.text }]}
            placeholder={placeholder}
            placeholderTextColor="#999"
            value={replyContent}
            onChangeText={setReplyContent}
            multiline
            maxLength={1000}
            editable={!submitting}
          />

          {/* Attachment Button */}
          <Pressable
            style={styles.attachmentButton}
            onPress={() => setShowAttachmentPicker(true)}
            disabled={submitting}
          >
            <Ionicons name="add" size={20} color="#666" />
          </Pressable>

          {/* Send Button */}
          <Pressable
            style={[
              styles.sendButton,
              {
                backgroundColor: canSubmit ? "#4A90E2" : "#E0E0E0",
              },
            ]}
            onPress={handleSubmit}
            disabled={!canSubmit || submitting}
          >
            {submitting ? (
              <ActivityIndicator size="small" color="white" />
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
        entityType="reply"
        entityId="pending"
      />
    </>
  )
}

const styles = StyleSheet.create({
  pendingAttachmentsContainer: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: "#e0e0e0",
  },
  pendingAttachmentsTitle: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 8,
  },
  pendingAttachmentItem: {
    position: "relative",
    marginRight: 12,
    marginTop: 4,
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
    top: -6,
    right: -6,
    backgroundColor: "white",
    borderRadius: 12,
  },
  messageInputContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: "#e0e0e0",
    gap: 12,
  },
  messageInputWrapper: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  messageInput: {
    flex: 1,
    backgroundColor: "#f5f5f5",
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 16,
    maxHeight: 100,
  },
  attachmentButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#f5f5f5",
    justifyContent: "center",
    alignItems: "center",
  },
  sendButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
  },
})
