import { useState, useEffect, useCallback, useRef } from "react"
import {
  messagingService,
  ConversationWithParticipants,
  MessageWithSender,
} from "../services/messagingService"
import { useAuth } from "./useAuth"

export const useMessaging = () => {
  const { user } = useAuth()
  const [conversations, setConversations] = useState<
    ConversationWithParticipants[]
  >([])
  const [currentConversation, setCurrentConversation] =
    useState<ConversationWithParticipants | null>(null)
  const [messages, setMessages] = useState<MessageWithSender[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [totalUnreadCount, setTotalUnreadCount] = useState(0)

  const subscriptionRef = useRef<any>(null)

  // Load conversations
  const loadConversations = useCallback(async () => {
    if (!user) return

    try {
      setLoading(true)
      setError(null)
      const data = await messagingService.getConversations()
      setConversations(data)

      // Calculate total unread count
      const totalUnread = await messagingService.getTotalUnreadCount()
      setTotalUnreadCount(totalUnread)
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to load conversations"
      )
    } finally {
      setLoading(false)
    }
  }, [user])

  // Load a specific conversation
  const loadConversation = useCallback(
    async (conversationId: string, limit: number = 50, offset: number = 0) => {
      if (!user) return

      try {
        setLoading(true)
        setError(null)
        const data = await messagingService.getConversation(
          conversationId,
          limit,
          offset
        )
        setCurrentConversation(data.conversation)
        setMessages(data.messages)
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to load conversation"
        )
      } finally {
        setLoading(false)
      }
    },
    [user]
  )

  // Send a message
  const sendMessage = useCallback(
    async (
      conversationId: string,
      content: string,
      messageType: "text" | "image" | "location" | "system" = "text",
      metadata?: Record<string, any>
    ) => {
      if (!user) return

      try {
        setError(null)
        const message = await messagingService.sendMessage({
          conversation_id: conversationId,
          content,
          message_type: messageType,
          metadata,
        })

        // Add the new message to the current messages
        if (currentConversation?.id === conversationId) {
          setMessages((prev) => [...prev, message as MessageWithSender])
        }

        // Update conversations list to show latest message
        await loadConversations()

        return message
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to send message")
        throw err
      }
    },
    [user, currentConversation, loadConversations]
  )

  // Create or get direct conversation
  const startDirectConversation = useCallback(
    async (otherUserId: string) => {
      if (!user) return

      try {
        setError(null)
        const conversationId =
          await messagingService.getOrCreateDirectConversation(otherUserId)
        await loadConversation(conversationId)
        await loadConversations() // Refresh conversations list
        return conversationId
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to start conversation"
        )
        throw err
      }
    },
    [user, loadConversation, loadConversations]
  )

  // Create group conversation
  const createGroupConversation = useCallback(
    async (name: string, participantIds: string[]) => {
      if (!user) return

      try {
        setError(null)
        const conversationId = await messagingService.createGroupConversation({
          name,
          participant_ids: participantIds,
        })
        await loadConversation(conversationId)
        await loadConversations() // Refresh conversations list
        return conversationId
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "Failed to create group conversation"
        )
        throw err
      }
    },
    [user, loadConversation, loadConversations]
  )

  // Edit a message
  const editMessage = useCallback(
    async (messageId: string, newContent: string) => {
      if (!user) return

      try {
        setError(null)
        const updatedMessage = await messagingService.editMessage(
          messageId,
          newContent
        )

        // Update the message in the current messages
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === messageId ? { ...msg, ...updatedMessage } : msg
          )
        )

        return updatedMessage
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to edit message")
        throw err
      }
    },
    [user]
  )

  // Delete a message
  const deleteMessage = useCallback(
    async (messageId: string) => {
      if (!user) return

      try {
        setError(null)
        await messagingService.deleteMessage(messageId)

        // Remove the message from the current messages
        setMessages((prev) => prev.filter((msg) => msg.id !== messageId))
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to delete message"
        )
        throw err
      }
    },
    [user]
  )

  // Add reaction to message
  const addReaction = useCallback(
    async (messageId: string, reactionType: string) => {
      if (!user) return

      try {
        setError(null)
        const reaction = await messagingService.addReaction(
          messageId,
          reactionType
        )

        // Update the message reactions in the current messages
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === messageId
              ? {
                  ...msg,
                  reactions: [...(msg.reactions || []), reaction],
                }
              : msg
          )
        )

        return reaction
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to add reaction")
        throw err
      }
    },
    [user]
  )

  // Remove reaction from message
  const removeReaction = useCallback(
    async (messageId: string, reactionType: string) => {
      if (!user) return

      try {
        setError(null)
        await messagingService.removeReaction(messageId, reactionType)

        // Remove the reaction from the current messages
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === messageId
              ? {
                  ...msg,
                  reactions: (msg.reactions || []).filter(
                    (r) =>
                      !(
                        r.user_id === user.id &&
                        r.reaction_type === reactionType
                      )
                  ),
                }
              : msg
          )
        )
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to remove reaction"
        )
        throw err
      }
    },
    [user]
  )

  // Mark conversation as read
  const markConversationAsRead = useCallback(
    async (conversationId: string) => {
      if (!user) return

      try {
        await messagingService.markConversationAsRead(conversationId)

        // Update unread count in conversations list
        setConversations((prev) =>
          prev.map((conv) =>
            conv.id === conversationId ? { ...conv, unread_count: 0 } : conv
          )
        )

        // Update total unread count
        const totalUnread = await messagingService.getTotalUnreadCount()
        setTotalUnreadCount(totalUnread)
      } catch (err) {
        console.error("Failed to mark conversation as read:", err)
      }
    },
    [user]
  )

  // Search conversations
  const searchConversations = useCallback(
    async (query: string) => {
      if (!user) return []

      try {
        setError(null)
        const results = await messagingService.searchConversations(query)
        return results
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to search conversations"
        )
        return []
      }
    },
    [user]
  )

  // Search messages in current conversation
  const searchMessages = useCallback(
    async (query: string, limit: number = 20) => {
      if (!user || !currentConversation) return []

      try {
        setError(null)
        const results = await messagingService.searchMessages(
          currentConversation.id,
          query,
          limit
        )
        return results
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to search messages"
        )
        return []
      }
    },
    [user, currentConversation]
  )

  // Subscribe to real-time updates
  useEffect(() => {
    if (!user || !currentConversation) return

    // Subscribe to conversation updates
    subscriptionRef.current = messagingService.subscribeToConversation(
      currentConversation.id,
      (payload) => {
        if (payload.eventType === "INSERT") {
          // New message received
          const newMessage = payload.new as MessageWithSender
          setMessages((prev) => [...prev, newMessage])

          // Update conversations list
          loadConversations()
        } else if (payload.eventType === "UPDATE") {
          // Message updated
          const updatedMessage = payload.new as MessageWithSender
          setMessages((prev) =>
            prev.map((msg) =>
              msg.id === updatedMessage.id ? updatedMessage : msg
            )
          )
        } else if (payload.eventType === "DELETE") {
          // Message deleted
          const deletedMessageId = payload.old.id
          setMessages((prev) =>
            prev.filter((msg) => msg.id !== deletedMessageId)
          )
        }
      }
    )

    return () => {
      if (subscriptionRef.current && subscriptionRef.current.unsubscribe) {
        subscriptionRef.current.unsubscribe()
      }
    }
  }, [user, currentConversation, loadConversations])

  // Subscribe to conversation list updates
  useEffect(() => {
    if (!user) return

    const subscription = messagingService.subscribeToUserConversations(
      (payload) => {
        if (payload.eventType === "UPDATE") {
          // Conversation updated (new message, etc.)
          loadConversations()
        }
      }
    )

    return () => {
      if (subscription && subscription.unsubscribe) {
        subscription.unsubscribe()
      }
    }
  }, [user, loadConversations])

  // Load conversations on mount
  useEffect(() => {
    loadConversations()
  }, [loadConversations])

  return {
    // State
    conversations,
    currentConversation,
    messages,
    loading,
    error,
    totalUnreadCount,

    // Actions
    loadConversations,
    loadConversation,
    sendMessage,
    startDirectConversation,
    createGroupConversation,
    editMessage,
    deleteMessage,
    addReaction,
    removeReaction,
    markConversationAsRead,
    searchConversations,
    searchMessages,

    // Utilities
    clearError: () => setError(null),
    setCurrentConversation,
  }
}
