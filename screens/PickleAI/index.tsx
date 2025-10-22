import {
  StyleSheet,
  TextInput,
  TouchableOpacity,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Text,
  Alert,
  ActivityIndicator,
  SafeAreaView,
  Keyboard,
  Animated,
  ScrollView,
} from "react-native"
import { View } from "@/components/Themed"
import { Ionicons } from "@expo/vector-icons"

import React, { useState, useCallback, useEffect, useRef } from "react"
import { useAuth } from "@/hooks/useAuth"
import { supabase } from "@/lib/supabase"
import CustomHeader from "@/components/CustomHeader"

// Import our functional services
import {
  subscribe,
  getState,
  sendMessage as sendChatMessage,
  clearMessages,
  clearError,
  initializeChat,
  ChatState,
  updateUserContext,
  ChatMessage,
} from "@/services/pickleAI"

interface Message {
  id: string
  text: string
  createdAt: Date
  user: {
    id: number
    name: string
  }
}

interface PromptCategory {
  id: string
  title: string
  icon: keyof typeof Ionicons.glyphMap
  prompts: string[]
}

const promptCategories: PromptCategory[] = [
  {
    id: "skills",
    title: "Skills",
    icon: "fitness",
    prompts: [
      "What are the best drills to improve my serve accuracy in pickleball?",
      "How can I improve my dinking technique for better control at the net?",
      "What strategies can I use to win more points at the non-volley zone?",
      "How do I develop a more powerful smash in pickleball?",
      "What are some exercises to improve my footwork and court movement?",
      "How can I practice pickleball alone to get better?",
      "What's the best way to improve my backhand shot in pickleball?",
      "How do I read my opponent's shots and anticipate their moves?",
      "What are the top mistakes beginners make and how can I avoid them?",
      "How can I improve my consistency during long rallies?",
      "What's the best way to practice my third-shot drop?",
      "How do I choose the right paddle to improve my game?",
      "What are some warm-up routines to prepare for a pickleball match?",
      "How can I improve my teamwork and communication in doubles pickleball?",
      "What mental strategies can help me stay focused during a pickleball match?",
    ],
  },
  {
    id: "rules",
    title: "Rules",
    icon: "document-text",
    prompts: [
      "What are the basic pickleball rules explained for beginners?",
      "Can you volley in the kitchen (non-volley zone)?",
      "What is a 'pickle-over' in pickleball?",
      "How do you score in pickleball?",
      "What are the rules for serving in pickleball?",
      "What happens if the ball lands on the line during a pickleball game?",
      "Can you explain the double-bounce rule in pickleball?",
      "What are the regulations for paddle size and specifications in pickleball?",
      "How do tiebreakers work in pickleball tournaments?",
      "What is a fault in pickleball, and what are common examples?",
      "Are there different rules for singles vs. doubles in pickleball?",
      "What are the rules for calling a let in pickleball?",
      "How does the non-volley zone rule affect net play?",
      "What are the official court dimensions and setup rules for pickleball?",
      "Can you explain the rules for timeouts and player substitutions in pickleball?",
    ],
  },
  {
    id: "equipment",
    title: "Equipment",
    icon: "tennisball",
    prompts: [
      "What paddle should I buy as a beginner?",
      "How do I choose the right grip size?",
      "What's the difference between paddle materials?",
      "How often should I replace my paddle?",
      "What balls are best for outdoor play?",
    ],
  },
  {
    id: "general",
    title: "General",
    icon: "help-circle",
    prompts: [
      "What are the most common pickleball injuries?",
      "How can I prevent pickleball injuries?",
      "How do I find pickleball tournaments near me?",
      "Can you explain pickleball ratings and how they work?",
      "What is the history of pickleball?",
      "Can AI analyze my pickleball gameplay?",
      "What are some effective pickleball coaching tips?",
      "Where can I find local pickleball courts or clubs?",
      "How do I get started with pickleball as a complete beginner?",
      "What are the benefits of playing pickleball for fitness?",
      "How can I find a pickleball partner or group to play with?",
      "What are the differences between recreational and competitive pickleball?",
      "How do I prepare for my first pickleball tournament?",
      "What are some tips for playing pickleball in hot or cold weather?",
      "How has pickleball grown in popularity, and what's its future?",
    ],
  },
]

export default function PickleAIScreen() {
  const { user, getUserDisplayName } = useAuth()
  const [messages, setMessages] = useState<Message[]>([])
  const [inputText, setInputText] = useState("")
  const [hasStartedChat, setHasStartedChat] = useState(false)
  const [chatState, setChatState] = useState<ChatState>(getState())
  const [keyboardHeight, setKeyboardHeight] = useState(0)
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const flatListRef = useRef<FlatList>(null)

  // Convert ChatMessage to Message format for UI
  const convertChatMessageToMessage = useCallback(
    (chatMsg: ChatMessage): Message => {
      return {
        id: chatMsg.id,
        text: chatMsg.content,
        createdAt: chatMsg.timestamp,
        user: {
          id: chatMsg.role === "user" ? 1 : 2,
          name: chatMsg.role === "user" ? "You" : "PickleAI",
        },
      }
    },
    []
  )

  // Load user data and update chatbot context
  useEffect(() => {
    const loadUserData = async () => {
      if (!user) return

      try {
        // Get user profile data from database
        const { data: userProfile } = await supabase
          .from("users")
          .select("name, dupr_rating_singles, dupr_rating_doubles")
          .eq("id", user.id)
          .single()

        // Update chatbot context with user information
        const userContext: any = {}

        // Add name if available
        if (userProfile?.name) {
          userContext.playerName = userProfile.name
        } else if (user.user_metadata?.full_name) {
          userContext.playerName = user.user_metadata.full_name
        }

        // Add DUPR rating if available (prefer singles, fallback to doubles)
        const duprRating =
          userProfile?.dupr_rating_singles || userProfile?.dupr_rating_doubles
        if (duprRating) {
          userContext.duprScore = duprRating
        }

        // Add experience level based on DUPR rating
        if (duprRating) {
          if (duprRating < 3.0) {
            userContext.experience = "beginner"
          } else if (duprRating < 4.0) {
            userContext.experience = "intermediate"
          } else {
            userContext.experience = "advanced"
          }
        }

        // Update the chatbot context
        if (Object.keys(userContext).length > 0) {
          updateUserContext(userContext)
        }
      } catch (error) {
        console.error("Error loading user data for chatbot:", error)
      }
    }

    // Only load user data if startup is complete
    if (user) {
      loadUserData()
    }
  }, [user])

  // Subscribe to MessageService updates
  useEffect(() => {
    const unsubscribe = subscribe((state) => {
      setChatState(state)

      // Convert ChatMessages to Messages for UI
      const convertedMessages = state.messages
        .map(convertChatMessageToMessage)
        .reverse()
      setMessages(convertedMessages)

      // If we have messages and haven't started chat UI, start it
      if (state.messages.length > 0 && !hasStartedChat) {
        setHasStartedChat(true)
      }
    })

    return unsubscribe
  }, [convertChatMessageToMessage, hasStartedChat])

  // Separate effect to handle scrolling when messages change
  useEffect(() => {
    if (messages.length > 0 && hasStartedChat) {
      // Auto-scroll to newest messages (beginning since list is inverted)
      setTimeout(() => {
        flatListRef.current?.scrollToOffset({ offset: 0, animated: true })
      }, 100)
    }
  }, [messages, hasStartedChat])

  // Keyboard listeners
  useEffect(() => {
    const keyboardDidShowListener = Keyboard.addListener(
      "keyboardDidShow",
      (e) => {
        setKeyboardHeight(e.endCoordinates.height)
        setIsKeyboardVisible(true)
        // Scroll to newest messages when keyboard appears (beginning since list is inverted)
        setTimeout(() => {
          flatListRef.current?.scrollToOffset({ offset: 0, animated: true })
        }, 100)
      }
    )
    const keyboardDidHideListener = Keyboard.addListener(
      "keyboardDidHide",
      () => {
        // Animate the keyboard height change smoothly
        const animateKeyboardHide = () => {
          const startHeight = keyboardHeight
          const endHeight = 0
          const duration = 300 // 300ms animation
          const startTime = Date.now()

          const animate = () => {
            const elapsed = Date.now() - startTime
            const progress = Math.min(elapsed / duration, 1)

            // Ease-out animation
            const easeOut = 1 - Math.pow(1 - progress, 3)
            const currentHeight = startHeight - startHeight * easeOut

            setKeyboardHeight(currentHeight)

            if (progress < 1) {
              requestAnimationFrame(animate)
            } else {
              setKeyboardHeight(0)
              setIsKeyboardVisible(false)
              // Scroll to newest messages when keyboard is dismissed (beginning since list is inverted)
              setTimeout(() => {
                flatListRef.current?.scrollToOffset({
                  offset: 0,
                  animated: true,
                })
              }, 50)
            }
          }

          requestAnimationFrame(animate)
        }

        animateKeyboardHide()
      }
    )

    return () => {
      keyboardDidShowListener?.remove()
      keyboardDidHideListener?.remove()
    }
  }, [keyboardHeight])

  const onSend = useCallback(
    async (text: string) => {
      if (text.trim() && !chatState.isLoading) {
        try {
          // Pass user ID for security checks
          await sendChatMessage(text.trim(), user?.id)
          setInputText("")
        } catch (error) {
          Alert.alert("Error", "Failed to send message. Please try again.")
        }
      }
    },
    [chatState.isLoading, user?.id]
  )

  const handleInitialSend = useCallback(async () => {
    if (inputText.trim()) {
      setHasStartedChat(true)
      await onSend(inputText)
    }
  }, [inputText, onSend])

  const handleClearChat = useCallback(() => {
    Alert.alert("Clear Chat", "Are you sure you want to start over?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Clear",
        style: "destructive",
        onPress: () => {
          clearMessages()
          setHasStartedChat(false)
          setMessages([])
          setSelectedCategory(null)
        },
      },
    ])
  }, [])

  const handleCategoryPress = useCallback(
    (categoryId: string) => {
      setSelectedCategory(selectedCategory === categoryId ? null : categoryId)
    },
    [selectedCategory]
  )

  const handlePromptPress = useCallback(
    async (prompt: string) => {
      setInputText(prompt)
      setSelectedCategory(null)
      // Set chat as started immediately when prompt is selected
      setHasStartedChat(true)
      // Auto-send the prompt
      await onSend(prompt)
    },
    [onSend]
  )

  const renderMessage = ({ item }: { item: Message }) => (
    <View
      style={[
        styles.messageBubble,
        item.user.id === 1 ? styles.userBubble : styles.aiBubble,
      ]}
    >
      {item.user.id !== 1 && (
        <Text style={styles.aiName}>{item.user.name}</Text>
      )}
      <Text
        style={[
          styles.messageText,
          item.user.id === 1 ? styles.userText : styles.aiText,
        ]}
      >
        {item.text}
      </Text>
      <Text
        style={[
          styles.timestamp,
          item.user.id === 1 ? styles.userTimestamp : styles.aiTimestamp,
        ]}
      >
        {item.createdAt.toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        })}
      </Text>
    </View>
  )

  const renderTypingIndicator = () => {
    // Removed typing indicator for cleaner UI
    return null
  }

  const renderError = () => {
    if (!chatState.error) return null

    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>{chatState.error}</Text>
        <TouchableOpacity
          style={styles.retryButton}
          onPress={() => clearError()}
        >
          <Text style={styles.retryText}>Dismiss</Text>
        </TouchableOpacity>
      </View>
    )
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <CustomHeader title="PickleAI Assistant" />
      <View
        style={[
          styles.container,
          { paddingBottom: keyboardHeight > 0 ? keyboardHeight - 80 : 0 },
        ]}
      >
        {/* Error Display */}
        {renderError()}

        {/* Category Buttons - Only show when chat hasn't started */}
        {!hasStartedChat && (
          <View style={styles.categoryContainer}>
            <Text style={{ paddingLeft: 8, paddingBottom: 8 }}>
              Select a topic for suggested prompts
            </Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {promptCategories.map((category) => (
                <TouchableOpacity
                  key={category.id}
                  style={[
                    styles.categoryButton,
                    selectedCategory === category.id &&
                      styles.categoryButtonActive,
                  ]}
                  onPress={() => handleCategoryPress(category.id)}
                >
                  <Ionicons
                    name={category.icon}
                    size={20}
                    color={
                      selectedCategory === category.id ? "#ffffff" : "#0080C0"
                    }
                  />
                  <Text
                    style={[
                      styles.categoryButtonText,
                      selectedCategory === category.id &&
                        styles.categoryButtonTextActive,
                    ]}
                  >
                    {category.title}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

        {/* Main Content Area */}
        <View style={styles.contentArea}>
          {/* Chat Messages - Show when chat has started */}
          {hasStartedChat ? (
            <View style={styles.chatContainer}>
              <View style={styles.header}>
                <Text style={styles.headerTitle}>PickleAI Assistant</Text>
                <TouchableOpacity
                  style={styles.clearButton}
                  onPress={handleClearChat}
                >
                  <Ionicons name="refresh" size={20} color="#0080C0" />
                </TouchableOpacity>
              </View>
              <FlatList
                ref={flatListRef}
                data={messages}
                renderItem={renderMessage}
                keyExtractor={(item) => item.id}
                style={styles.messagesList}
                contentContainerStyle={styles.messagesContentContainer}
                inverted
                showsVerticalScrollIndicator={false}
                ListFooterComponent={renderTypingIndicator}
                onContentSizeChange={() => {
                  flatListRef.current?.scrollToOffset({
                    offset: 0,
                    animated: true,
                  })
                }}
              />
            </View>
          ) : (
            /* Prompt Suggestions - Show when category is selected but chat hasn't started */
            selectedCategory && (
              <View style={styles.promptSuggestionsContainer}>
                <Text style={styles.promptSuggestionsTitle}>
                  Suggested questions about{" "}
                  {promptCategories
                    .find((c) => c.id === selectedCategory)
                    ?.title.toLowerCase()}
                  :
                </Text>
                <ScrollView style={styles.promptSuggestionsList}>
                  {promptCategories
                    .find((c) => c.id === selectedCategory)
                    ?.prompts.map((prompt, index) => (
                      <TouchableOpacity
                        key={index}
                        style={styles.promptSuggestion}
                        onPress={() => handlePromptPress(prompt)}
                      >
                        <Text style={styles.promptSuggestionText}>
                          {prompt}
                        </Text>
                        <Ionicons
                          name="chevron-forward"
                          size={16}
                          color="#0080C0"
                        />
                      </TouchableOpacity>
                    ))}
                </ScrollView>
              </View>
            )
          )}
        </View>

        {/* Input Container - Always at bottom */}
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.textInput}
            placeholder={
              !hasStartedChat
                ? "Ask about pickleball rules, strategy, equipment..."
                : "Type your message here..."
            }
            value={inputText}
            onChangeText={setInputText}
            multiline
            maxLength={500}
            placeholderTextColor="#666"
            editable={!chatState.isLoading}
            onFocus={() => {
              // Scroll to newest messages when input is focused (beginning since list is inverted)
              setTimeout(() => {
                flatListRef.current?.scrollToOffset({
                  offset: 0,
                  animated: true,
                })
              }, 100)
            }}
          />
          <TouchableOpacity
            style={[
              styles.sendButton,
              inputText.trim() && !chatState.isLoading
                ? styles.sendButtonActive
                : styles.sendButtonInactive,
            ]}
            onPress={
              !hasStartedChat ? handleInitialSend : () => onSend(inputText)
            }
            disabled={!inputText.trim() || chatState.isLoading}
          >
            {chatState.isLoading ? (
              <ActivityIndicator size={20} color="#ffffff" />
            ) : (
              <Ionicons name="send" size={20} color="#ffffff" />
            )}
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#333",
  },
  clearButton: {
    padding: 8,
  },
  messagesList: {
    flex: 1,
    paddingHorizontal: 16,
  },
  messagesContentContainer: {
    paddingBottom: 20,
  },
  initialPromptContainer: {
    flex: 1,
    padding: 20,
    paddingBottom: 40,
  },
  promptCard: {
    backgroundColor: "#91D1E9",
    borderRadius: 20,
    padding: 24,
    width: "100%",
    maxWidth: 400,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  promptTitle: {
    fontSize: 14,
    color: "#333",
    marginBottom: 18,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 12,
    padding: 16,
    backgroundColor: "#f5f5f5",
    borderTopWidth: 1,
    borderTopColor: "#e0e0e0",
  },
  textInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#e0e0e0",
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
    maxHeight: 100,
    backgroundColor: "#ffffff",
  },
  sendButton: {
    borderRadius: 20,
    minWidth: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
  },
  sendButtonActive: {
    backgroundColor: "#0080C0",
  },
  sendButtonInactive: {
    backgroundColor: "#cccccc",
  },
  messageBubble: {
    marginVertical: 4,
    marginHorizontal: 8,
    padding: 12,
    borderRadius: 18,
    maxWidth: "80%",
  },
  aiBubble: {
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "#e0e0e0",
    alignSelf: "flex-start",
  },
  userBubble: {
    backgroundColor: "#007AFF",
    alignSelf: "flex-end",
  },
  aiName: {
    fontSize: 12,
    fontWeight: "600",
    color: "#666",
    marginBottom: 4,
  },
  messageText: {
    fontSize: 16,
    lineHeight: 20,
  },
  aiText: {
    color: "#333",
  },
  userText: {
    color: "#ffffff",
  },
  timestamp: {
    fontSize: 11,
    marginTop: 4,
    opacity: 0.7,
  },
  userTimestamp: {
    color: "#ffffff",
    textAlign: "right",
  },
  aiTimestamp: {
    color: "#666",
  },
  typingBubble: {
    marginTop: 8,
  },
  typingContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  typingText: {
    marginLeft: 8,
    color: "#666",
    fontStyle: "italic",
    fontSize: 14,
  },
  errorContainer: {
    backgroundColor: "#ffebee",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#ffcdd2",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  errorText: {
    color: "#c62828",
    flex: 1,
    marginRight: 12,
    fontSize: 14,
  },
  retryButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: "#c62828",
    borderRadius: 4,
  },
  retryText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "500",
  },
  categoryContainer: {
    backgroundColor: "#ffffff",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
  },
  categoryButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f8f9fa",
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginHorizontal: 6,
    borderWidth: 1,
    borderColor: "#e0e0e0",
  },
  categoryButtonActive: {
    backgroundColor: "#0080C0",
    borderColor: "#0080C0",
  },
  categoryButtonText: {
    marginLeft: 6,
    fontSize: 14,
    fontWeight: "500",
    color: "#0080C0",
  },
  categoryButtonTextActive: {
    color: "#ffffff",
  },
  promptSuggestionsContainer: {
    backgroundColor: "#ffffff",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
    // maxHeight: 200,
    flex: 1,
  },
  promptSuggestionsTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#333",
    marginBottom: 8,
  },
  promptSuggestionsList: {
    // maxHeight: 150,
  },
  promptSuggestion: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 10,
    paddingHorizontal: 12,
    backgroundColor: "#f8f9fa",
    borderRadius: 8,
    marginBottom: 6,
    borderWidth: 1,
    borderColor: "#e0e0e0",
  },
  promptSuggestionText: {
    flex: 1,
    fontSize: 14,
    color: "#333",
    marginRight: 8,
  },
  welcomeTitle: {
    fontSize: 24,
    fontWeight: "700",
    color: "#333",
    textAlign: "center",
    marginBottom: 8,
  },
  welcomeSubtitle: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
    marginBottom: 24,
  },
  categorySection: {
    marginBottom: 16,
    backgroundColor: "#ffffff",
    borderRadius: 12,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  categoryHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: "#f8f9fa",
  },
  categoryHeaderContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  categoryHeaderText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    marginLeft: 12,
  },
  categoryPrompts: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  initialPromptSuggestion: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 12,
    paddingHorizontal: 12,
    backgroundColor: "#ffffff",
    borderRadius: 8,
    marginTop: 8,
    borderWidth: 1,
    borderColor: "#e0e0e0",
  },
  initialPromptSuggestionText: {
    flex: 1,
    fontSize: 14,
    color: "#333",
    marginRight: 8,
  },
  contentArea: {
    flex: 1,
  },
  chatContainer: {
    flex: 1,
  },
})
