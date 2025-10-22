import React, { useState, useRef, useEffect } from "react"
import {
  View,
  Text,
  FlatList,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
} from "react-native"
import { useMessaging } from "../../hooks/useMessaging"
import {
  ConversationWithParticipants,
  MessageWithSender,
} from "../../services/messagingService"
import Colors from "../../constants/Colors"
import { StyledText } from "../StyledText"
import { useAuth } from "../../hooks/useAuth"

interface ChatScreenProps {
  conversation: ConversationWithParticipants
  onBack: () => void
}

export const ChatScreen: React.FC<ChatScreenProps> = ({
  conversation,
  onBack,
}) => {
  const { user } = useAuth()
  const {
    messages,
    loading,
    error,
    sendMessage,
    editMessage,
    deleteMessage,
    addReaction,
    removeReaction,
    markConversationAsRead,
    loadConversation,
  } = useMessaging()

  const [newMessage, setNewMessage] = useState("")
  const [isEditing, setIsEditing] = useState<string | null>(null)
  const [editContent, setEditContent] = useState("")
  const flatListRef = useRef<FlatList>(null)

  // Load conversation messages when component mounts
  useEffect(() => {
    loadConversation(conversation.id)
    markConversationAsRead(conversation.id)
  }, [conversation.id])

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true })
      }, 100)
    }
  }, [messages.length])

  const handleSendMessage = async () => {
    if (!newMessage.trim()) return

    try {
      await sendMessage(conversation.id, newMessage.trim())
      setNewMessage("")
    } catch (err) {
      Alert.alert("Error", "Failed to send message")
    }
  }

  const handleEditMessage = async (messageId: string) => {
    if (!editContent.trim()) return

    try {
      await editMessage(messageId, editContent.trim())
      setIsEditing(null)
      setEditContent("")
    } catch (err) {
      Alert.alert("Error", "Failed to edit message")
    }
  }

  const handleDeleteMessage = async (messageId: string) => {
    Alert.alert(
      "Delete Message",
      "Are you sure you want to delete this message?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              await deleteMessage(messageId)
            } catch (err) {
              Alert.alert("Error", "Failed to delete message")
            }
          },
        },
      ]
    )
  }

  const handleReaction = async (messageId: string, reactionType: string) => {
    try {
      const message = messages.find((m) => m.id === messageId)
      const reactions = message?.reactions || []
      const existingReaction = reactions.find(
        (r) => r.user_id === user?.id && r.reaction_type === reactionType
      )

      if (existingReaction) {
        await removeReaction(messageId, reactionType)
      } else {
        await addReaction(messageId, reactionType)
      }
    } catch (err) {
      Alert.alert("Error", "Failed to add reaction")
    }
  }

  const renderMessage = ({ item }: { item: MessageWithSender }) => {
    const isOwnMessage = item.sender_id === user?.id
    const isEditingThis = isEditing === item.id

    return (
      <View
        style={[
          styles.messageContainer,
          isOwnMessage ? styles.ownMessage : styles.otherMessage,
        ]}
      >
        {!isOwnMessage && (
          <StyledText style={styles.senderName}>
            {item.sender.name || item.sender.email || "Unknown User"}
          </StyledText>
        )}

        {isEditingThis ? (
          <View style={styles.editContainer}>
            <TextInput
              style={styles.editInput}
              value={editContent}
              onChangeText={setEditContent}
              multiline
              autoFocus
            />
            <View style={styles.editActions}>
              <TouchableOpacity
                style={styles.editButton}
                onPress={() => handleEditMessage(item.id)}
              >
                <StyledText style={styles.editButtonText}>Save</StyledText>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => {
                  setIsEditing(null)
                  setEditContent("")
                }}
              >
                <StyledText style={styles.cancelButtonText}>Cancel</StyledText>
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <View style={styles.messageContent}>
            <StyledText
              style={[
                styles.messageText,
                isOwnMessage ? styles.ownMessageText : styles.otherMessageText,
              ]}
            >
              {item.content}
            </StyledText>

            {item.is_edited && (
              <StyledText style={styles.editedIndicator}>edited</StyledText>
            )}

            <StyledText style={styles.timestamp}>
              {new Date(item.created_at || "").toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </StyledText>
          </View>
        )}

        {/* Message actions */}
        {!isEditingThis && (
          <View style={styles.messageActions}>
            {isOwnMessage && (
              <>
                <TouchableOpacity
                  style={styles.actionButton}
                  onPress={() => {
                    setIsEditing(item.id)
                    setEditContent(item.content)
                  }}
                >
                  <StyledText style={styles.actionButtonText}>Edit</StyledText>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.actionButton}
                  onPress={() => handleDeleteMessage(item.id)}
                >
                  <StyledText
                    style={[styles.actionButtonText, styles.deleteButtonText]}
                  >
                    Delete
                  </StyledText>
                </TouchableOpacity>
              </>
            )}

            {/* Reactions */}
            <View style={styles.reactionsContainer}>
              {["👍", "❤️", "😂", "😮", "😢", "😡"].map((emoji) => (
                <TouchableOpacity
                  key={emoji}
                  style={styles.reactionButton}
                  onPress={() => handleReaction(item.id, emoji)}
                >
                  <StyledText style={styles.reactionEmoji}>{emoji}</StyledText>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {/* Show reactions */}
        {item.reactions && item.reactions.length > 0 && (
          <View style={styles.reactionsDisplay}>
            {item.reactions.map((reaction, index) => (
              <View key={index} style={styles.reactionItem}>
                <StyledText style={styles.reactionEmoji}>
                  {reaction.reaction_type}
                </StyledText>
              </View>
            ))}
          </View>
        )}
      </View>
    )
  }

  const renderHeader = () => (
    <View style={styles.header}>
      <TouchableOpacity style={styles.backButton} onPress={onBack}>
        <StyledText style={styles.backButtonText}>←</StyledText>
      </TouchableOpacity>
      <View style={styles.headerInfo}>
        <StyledText style={styles.conversationName}>
          {conversation.name || "Conversation"}
        </StyledText>
        <StyledText style={styles.participantCount}>
          {(conversation.participants || []).length} participant
          {(conversation.participants || []).length !== 1 ? "s" : ""}
        </StyledText>
      </View>
    </View>
  )

  const renderInput = () => (
    <View style={styles.inputContainer}>
      <TextInput
        style={styles.textInput}
        value={newMessage}
        onChangeText={setNewMessage}
        placeholder="Type a message..."
        multiline
        maxLength={1000}
      />
      <TouchableOpacity
        style={[
          styles.sendButton,
          !newMessage.trim() && styles.sendButtonDisabled,
        ]}
        onPress={handleSendMessage}
        disabled={!newMessage.trim()}
      >
        <StyledText style={styles.sendButtonText}>Send</StyledText>
      </TouchableOpacity>
    </View>
  )

  if (loading && (messages || []).length === 0) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.light.tint} />
        <StyledText style={styles.loadingText}>Loading messages...</StyledText>
      </View>
    )
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      {renderHeader()}

      {error && (
        <View style={styles.errorContainer}>
          <StyledText style={styles.errorText}>{error}</StyledText>
        </View>
      )}

      <FlatList
        ref={flatListRef}
        data={messages || []}
        renderItem={renderMessage}
        keyExtractor={(item) => item.id}
        style={styles.messagesList}
        contentContainerStyle={styles.messagesContent}
        showsVerticalScrollIndicator={false}
        onEndReachedThreshold={0.1}
      />

      {renderInput()}
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.border,
  },
  backButton: {
    marginRight: 12,
  },
  backButtonText: {
    fontSize: 24,
    color: Colors.light.tint,
  },
  headerInfo: {
    flex: 1,
  },
  conversationName: {
    fontSize: 18,
    fontWeight: "bold",
    color: Colors.light.text,
  },
  participantCount: {
    fontSize: 12,
    color: Colors.light.tabIconDefault,
  },
  messagesList: {
    flex: 1,
  },
  messagesContent: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  messageContainer: {
    marginVertical: 4,
    maxWidth: "80%",
  },
  ownMessage: {
    alignSelf: "flex-end",
  },
  otherMessage: {
    alignSelf: "flex-start",
  },
  senderName: {
    fontSize: 12,
    color: Colors.light.tabIconDefault,
    marginBottom: 2,
  },
  messageContent: {
    padding: 12,
    borderRadius: 16,
    position: "relative",
  },
  ownMessageText: {
    color: "white",
  },
  otherMessageText: {
    color: Colors.light.text,
  },
  messageText: {
    fontSize: 16,
    lineHeight: 20,
  },
  editedIndicator: {
    fontSize: 10,
    color: Colors.light.tabIconDefault,
    fontStyle: "italic",
    marginTop: 2,
  },
  timestamp: {
    fontSize: 10,
    color: Colors.light.tabIconDefault,
    marginTop: 4,
    alignSelf: "flex-end",
  },
  messageActions: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 4,
  },
  actionButton: {
    marginRight: 8,
  },
  actionButtonText: {
    fontSize: 12,
    color: Colors.light.tint,
  },
  deleteButtonText: {
    color: "red",
  },
  reactionsContainer: {
    flexDirection: "row",
    marginLeft: "auto",
  },
  reactionButton: {
    marginLeft: 4,
  },
  reactionEmoji: {
    fontSize: 16,
  },
  reactionsDisplay: {
    flexDirection: "row",
    marginTop: 4,
  },
  reactionItem: {
    marginRight: 4,
  },
  editContainer: {
    padding: 12,
    borderRadius: 16,
    backgroundColor: Colors.light.background,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  editInput: {
    fontSize: 16,
    color: Colors.light.text,
    minHeight: 40,
    textAlignVertical: "top",
  },
  editActions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    marginTop: 8,
  },
  editButton: {
    marginRight: 8,
    paddingHorizontal: 12,
    paddingVertical: 4,
    backgroundColor: Colors.light.tint,
    borderRadius: 4,
  },
  editButtonText: {
    color: "white",
    fontSize: 12,
    fontWeight: "600",
  },
  cancelButton: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    backgroundColor: Colors.light.border,
    borderRadius: 4,
  },
  cancelButtonText: {
    color: Colors.light.text,
    fontSize: 12,
    fontWeight: "600",
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "flex-end",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: Colors.light.border,
  },
  textInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: Colors.light.border,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 8,
    maxHeight: 100,
    fontSize: 16,
    color: Colors.light.text,
  },
  sendButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: Colors.light.tint,
    borderRadius: 20,
  },
  sendButtonDisabled: {
    backgroundColor: Colors.light.border,
  },
  sendButtonText: {
    color: "white",
    fontWeight: "600",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 12,
    color: Colors.light.tabIconDefault,
  },
  errorContainer: {
    padding: 16,
    alignItems: "center",
  },
  errorText: {
    color: "red",
    textAlign: "center",
  },
})
