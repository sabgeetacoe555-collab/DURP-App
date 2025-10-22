import React, { useState } from "react"
import {
  View,
  TextInput,
  StyleSheet,
  Pressable,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Image,
  ScrollView,
  Text,
} from "react-native"
import { Ionicons } from "@expo/vector-icons"
import { useColorScheme } from "../useColorScheme"
import { AttachmentPicker } from "./AttachmentPicker"

import { Attachment } from "../../types/discussions"

interface MessageInputProps {
  placeholder?: string
  onSubmit: (content: string, attachments: Attachment[]) => Promise<void>
  entityType: "post" | "reply"
  entityId: string
  disabled?: boolean
  submitting?: boolean
}

export const MessageInput: React.FC<MessageInputProps> = ({
  placeholder = "Write a message...",
  onSubmit,
  entityType,
  entityId,
  disabled = false,
  submitting = false,
}) => {
  const colors = useColorScheme()
  const [content, setContent] = useState("")
  const [showAttachmentPicker, setShowAttachmentPicker] = useState(false)
  const [pendingAttachments, setPendingAttachments] = useState<Attachment[]>([])

  const handleSubmit = async () => {
    if (!content.trim() && pendingAttachments.length === 0) return
    if (submitting) return

    try {
      await onSubmit(content.trim(), pendingAttachments)
      setContent("")
      setPendingAttachments([])
    } catch (error) {
      console.error("Error submitting message:", error)
    }
  }

  const handleAttachmentSelected = (attachment: Attachment) => {
    setPendingAttachments((prev) => [...prev, attachment])
  }

  const handleMultipleAttachmentsSelected = (attachments: Attachment[]) => {
    setPendingAttachments((prev) => [...prev, ...attachments])
  }

  const removeAttachment = (index: number) => {
    setPendingAttachments((prev) => prev.filter((_, i) => i !== index))
  }

  const canSubmit =
    (content.trim().length > 0 || pendingAttachments.length > 0) && !submitting

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 0}
    >
      {/* Pending attachments preview */}
      {pendingAttachments.length > 0 && (
        <View
          style={[
            styles.pendingAttachmentsContainer,
            { backgroundColor: colors.background },
          ]}
        >
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
        <View
          style={[
            styles.messageInputWrapper,
            { borderColor: colors.text + "20" },
          ]}
        >
          <TextInput
            style={[styles.messageInput, { color: colors.text }]}
            placeholder={placeholder}
            placeholderTextColor={colors.text + "60"}
            value={content}
            onChangeText={setContent}
            multiline
            maxLength={1000}
            textAlignVertical="top"
            editable={!disabled}
          />

          {/* Attachment Button */}
          <Pressable
            style={[
              styles.attachmentButton,
              { borderColor: colors.text + "20" },
            ]}
            onPress={() => setShowAttachmentPicker(true)}
            disabled={disabled}
          >
            <Ionicons
              name="add-circle-outline"
              size={20}
              color={colors.text + "60"}
            />
          </Pressable>

          {/* Send Button */}
          <Pressable
            style={[
              styles.sendButton,
              {
                backgroundColor: canSubmit ? "#007AFF" : "#E0E0E0",
              },
            ]}
            onPress={handleSubmit}
            disabled={!canSubmit}
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
        onMultipleAttachmentsSelected={handleMultipleAttachmentsSelected}
        entityType={entityType}
        entityId={entityId}
        allowMultiple={true}
      />
    </KeyboardAvoidingView>
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
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: "#e0e0e0",
  },
  messageInputWrapper: {
    flexDirection: "row",
    alignItems: "flex-end",
    borderWidth: 1,
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 8,
    minHeight: 44,
  },
  messageInput: {
    flex: 1,
    fontSize: 16,
    maxHeight: 100,
    marginRight: 8,
  },
  attachmentButton: {
    padding: 8,
    marginRight: 8,
    borderRadius: 16,
    borderWidth: 1,
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
