import React, { useState, useRef, useEffect } from "react"
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Pressable,
  TextInput,
  Image,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from "react-native"
import { Ionicons } from "@expo/vector-icons"
import { useColorScheme } from "@/components/useColorScheme"
import CustomHeader from "@/components/CustomHeader"
import { useAuth } from "@/hooks/useAuth"
import { useRouter } from "expo-router"

// Mock data for conversations
const MOCK_CONVERSATIONS = [
  {
    id: "1",
    name: "Sarah Johnson",
    lastMessage: "Hey! Are you still up for the game tomorrow?",
    timestamp: "2 min ago",
    unreadCount: 2,
    avatar: null,
    isOnline: true,
  },
  {
    id: "2",
    name: "Mike's Pickleball Group",
    lastMessage: "Mike: The court is reserved for 3 PM",
    timestamp: "1 hour ago",
    unreadCount: 0,
    avatar: null,
    isGroup: true,
    isOnline: false,
  },
  {
    id: "3",
    name: "Alex Chen",
    lastMessage: "Thanks for the great game today!",
    timestamp: "3 hours ago",
    unreadCount: 0,
    avatar: null,
    isOnline: false,
  },
  {
    id: "4",
    name: "Weekend Warriors",
    lastMessage: "Emma: Don't forget to bring water bottles",
    timestamp: "1 day ago",
    unreadCount: 5,
    avatar: null,
    isGroup: true,
    isOnline: false,
  },
  {
    id: "5",
    name: "David Wilson",
    lastMessage: "See you at the courts!",
    timestamp: "2 days ago",
    unreadCount: 0,
    avatar: null,
    isOnline: true,
  },
]

// Mock data for messages in a conversation
const MOCK_MESSAGES = [
  {
    id: "1",
    text: "Hey! Are you still up for the game tomorrow?",
    timestamp: "2:30 PM",
    senderId: "other",
    senderName: "Sarah Johnson",
  },
  {
    id: "2",
    text: "Yes, absolutely! What time were you thinking?",
    timestamp: "2:32 PM",
    senderId: "me",
    senderName: "You",
  },
  {
    id: "3",
    text: "How about 10 AM? The courts should be less crowded then.",
    timestamp: "2:33 PM",
    senderId: "other",
    senderName: "Sarah Johnson",
  },
  {
    id: "4",
    text: "Perfect! I'll see you there. Don't forget to bring your paddle!",
    timestamp: "2:35 PM",
    senderId: "me",
    senderName: "You",
  },
  {
    id: "5",
    text: "Of course! Can't wait to play. I've been practicing my serve 😄",
    timestamp: "2:36 PM",
    senderId: "other",
    senderName: "Sarah Johnson",
  },
]

interface Conversation {
  id: string
  name: string
  lastMessage: string
  timestamp: string
  unreadCount: number
  avatar: string | null
  isGroup?: boolean
  isOnline: boolean
}

interface Message {
  id: string
  text: string
  timestamp: string
  senderId: string
  senderName: string
}

export default function MessagesScreen() {
  const colors = useColorScheme()
  const { user } = useAuth()
  const router = useRouter()
  const [conversations, setConversations] =
    useState<Conversation[]>(MOCK_CONVERSATIONS)
  const [selectedConversation, setSelectedConversation] =
    useState<Conversation | null>(null)
  const [messages, setMessages] = useState<Message[]>(MOCK_MESSAGES)
  const [newMessage, setNewMessage] = useState("")
  const [isTyping, setIsTyping] = useState(false)
  const flatListRef = useRef<FlatList>(null)

  const handleConversationPress = (conversation: Conversation) => {
    setSelectedConversation(conversation)
    // In a real app, you would load messages for this conversation
    setMessages(MOCK_MESSAGES)
  }

  const handleSendMessage = () => {
    if (!newMessage.trim() || !selectedConversation) return

    const message: Message = {
      id: Date.now().toString(),
      text: newMessage.trim(),
      timestamp: new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      }),
      senderId: "me",
      senderName: "You",
    }

    setMessages((prev) => [...prev, message])
    setNewMessage("")

    // Scroll to bottom
    setTimeout(() => {
      flatListRef.current?.scrollToEnd({ animated: true })
    }, 100)
  }

  const handleBackToConversations = () => {
    setSelectedConversation(null)
    setMessages([])
  }

  const renderConversationItem = ({ item }: { item: Conversation }) => (
    <Pressable
      style={[
        styles.conversationItem,
        { borderBottomColor: colors.text + "10" },
      ]}
      onPress={() => handleConversationPress(item)}
    >
      <View style={styles.avatarContainer}>
        {item.avatar ? (
          <Image source={{ uri: item.avatar }} style={styles.avatar} />
        ) : (
          <View
            style={[
              styles.avatarPlaceholder,
              { backgroundColor: colors.tint + "20" },
            ]}
          >
            <Ionicons
              name={item.isGroup ? "people" : "person"}
              size={20}
              color={colors.tint}
            />
          </View>
        )}
        {item.isOnline && !item.isGroup && (
          <View
            style={[styles.onlineIndicator, { backgroundColor: "#4CAF50" }]}
          />
        )}
      </View>

      <View style={styles.conversationContent}>
        <View style={styles.conversationHeader}>
          <Text style={[styles.conversationName, { color: colors.text }]}>
            {item.name}
          </Text>
          <Text style={[styles.timestamp, { color: colors.text + "60" }]}>
            {item.timestamp}
          </Text>
        </View>

        <View style={styles.conversationFooter}>
          <Text
            style={[
              styles.lastMessage,
              { color: colors.text + "80" },
              item.unreadCount > 0 && { fontWeight: "600" },
            ]}
            numberOfLines={1}
          >
            {item.lastMessage}
          </Text>
          {item.unreadCount > 0 && (
            <View
              style={[styles.unreadBadge, { backgroundColor: colors.tint }]}
            >
              <Text style={styles.unreadCount}>
                {item.unreadCount > 99 ? "99+" : item.unreadCount}
              </Text>
            </View>
          )}
        </View>
      </View>
    </Pressable>
  )

  const renderMessage = ({ item }: { item: Message }) => {
    const isMe = item.senderId === "me"

    return (
      <View
        style={[styles.messageContainer, isMe && styles.messageContainerRight]}
      >
        <View
          style={[
            styles.messageBubble,
            isMe
              ? [styles.messageBubbleRight, { backgroundColor: colors.tint }]
              : [
                  styles.messageBubbleLeft,
                  { backgroundColor: colors.text + "10" },
                ],
          ]}
        >
          <Text
            style={[
              styles.messageText,
              { color: isMe ? "white" : colors.text },
            ]}
          >
            {item.text}
          </Text>
          <Text
            style={[
              styles.messageTimestamp,
              { color: isMe ? "rgba(255,255,255,0.7)" : colors.text + "60" },
            ]}
          >
            {item.timestamp}
          </Text>
        </View>
      </View>
    )
  }

  if (selectedConversation) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <CustomHeader title={selectedConversation.name} showBackButton={true} />

        <KeyboardAvoidingView
          style={styles.chatContainer}
          behavior={Platform.OS === "ios" ? "padding" : "height"}
        >
          <FlatList
            ref={flatListRef}
            data={messages}
            renderItem={renderMessage}
            keyExtractor={(item) => item.id}
            style={styles.messagesList}
            contentContainerStyle={styles.messagesContent}
            showsVerticalScrollIndicator={false}
            onContentSizeChange={() =>
              flatListRef.current?.scrollToEnd({ animated: true })
            }
          />

          <View
            style={[
              styles.inputContainer,
              { borderTopColor: colors.text + "20" },
            ]}
          >
            <View
              style={[
                styles.inputWrapper,
                { backgroundColor: colors.text + "05" },
              ]}
            >
              <TextInput
                style={[styles.textInput, { color: colors.text }]}
                value={newMessage}
                onChangeText={setNewMessage}
                placeholder="Type a message..."
                placeholderTextColor={colors.text + "60"}
                multiline
                maxLength={500}
              />
              <Pressable
                style={[
                  styles.sendButton,
                  {
                    backgroundColor: newMessage.trim()
                      ? colors.tint
                      : colors.text + "30",
                  },
                ]}
                onPress={handleSendMessage}
                disabled={!newMessage.trim()}
              >
                <Ionicons
                  name="send"
                  size={20}
                  color={newMessage.trim() ? "white" : colors.text + "60"}
                />
              </Pressable>
            </View>
          </View>
        </KeyboardAvoidingView>
      </View>
    )
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <CustomHeader title="Messages" showBackButton={false} />

      <View style={styles.conversationsContainer}>
        {conversations.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons
              name="chatbubbles-outline"
              size={64}
              color={colors.text + "40"}
            />
            <Text style={[styles.emptyTitle, { color: colors.text }]}>
              No Conversations Yet
            </Text>
            <Text
              style={[styles.emptyDescription, { color: colors.text + "80" }]}
            >
              Start chatting with other players or join group conversations
            </Text>
          </View>
        ) : (
          <FlatList
            data={conversations}
            renderItem={renderConversationItem}
            keyExtractor={(item) => item.id}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.conversationsList}
          />
        )}
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  conversationsContainer: {
    flex: 1,
  },
  conversationsList: {
    paddingBottom: 20,
  },
  conversationItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  avatarContainer: {
    position: "relative",
    marginRight: 12,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
  },
  avatarPlaceholder: {
    width: 50,
    height: 50,
    borderRadius: 25,
    alignItems: "center",
    justifyContent: "center",
  },
  onlineIndicator: {
    position: "absolute",
    bottom: 2,
    right: 2,
    width: 14,
    height: 14,
    borderRadius: 7,
    borderWidth: 2,
    borderColor: "white",
  },
  conversationContent: {
    flex: 1,
  },
  conversationHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  conversationName: {
    fontSize: 16,
    fontWeight: "600",
    flex: 1,
  },
  timestamp: {
    fontSize: 12,
    marginLeft: 8,
  },
  conversationFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  lastMessage: {
    fontSize: 14,
    flex: 1,
    marginRight: 8,
  },
  unreadBadge: {
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 6,
  },
  unreadCount: {
    color: "white",
    fontSize: 12,
    fontWeight: "600",
  },
  emptyState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 40,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: "600",
    marginTop: 16,
    marginBottom: 8,
  },
  emptyDescription: {
    fontSize: 16,
    textAlign: "center",
    lineHeight: 22,
  },
  chatContainer: {
    flex: 1,
  },
  messagesList: {
    flex: 1,
  },
  messagesContent: {
    paddingVertical: 16,
  },
  messageContainer: {
    marginHorizontal: 20,
    marginVertical: 4,
  },
  messageContainerRight: {
    alignItems: "flex-end",
  },
  messageBubble: {
    maxWidth: "80%",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 20,
  },
  messageBubbleLeft: {
    borderBottomLeftRadius: 4,
  },
  messageBubbleRight: {
    borderBottomRightRadius: 4,
  },
  messageText: {
    fontSize: 16,
    lineHeight: 20,
    marginBottom: 4,
  },
  messageTimestamp: {
    fontSize: 12,
    alignSelf: "flex-end",
  },
  inputContainer: {
    borderTopWidth: 1,
    paddingHorizontal: 20,
    paddingVertical: 12,
    paddingBottom: Platform.OS === "ios" ? 34 : 12, // Account for home indicator
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "flex-end",
    borderRadius: 24,
    paddingHorizontal: 16,
    paddingVertical: 8,
    minHeight: 48,
  },
  textInput: {
    flex: 1,
    fontSize: 16,
    maxHeight: 100,
    paddingVertical: 8,
  },
  sendButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 8,
  },
})
