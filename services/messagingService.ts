import { supabase } from "../lib/supabase"
import { Database } from "../types/database"

type Conversation = Database["public"]["Tables"]["conversations"]["Row"]
type Message = Database["public"]["Tables"]["messages"]["Row"]
type ConversationParticipant =
  Database["public"]["Tables"]["conversation_participants"]["Row"]
type MessageReaction = Database["public"]["Tables"]["message_reactions"]["Row"]

export interface ConversationWithParticipants extends Conversation {
  participants: ConversationParticipant[]
  last_message?: Message
  unread_count?: number
}

export interface MessageWithSender extends Message {
  sender: {
    id: string
    name: string | null
    email: string | null
  }
  reactions?: MessageReaction[]
}

export interface CreateMessageData {
  conversation_id: string
  content: string
  message_type?: "text" | "image" | "location" | "system"
  metadata?: Record<string, any>
}

export interface CreateGroupConversationData {
  name: string
  participant_ids: string[]
}

export const messagingService = {
  // Get all conversations for the current user
  getConversations: async (): Promise<ConversationWithParticipants[]> => {
    const { data: conversations, error } = await supabase
      .from("conversations")
      .select(
        `
        *,
        participants:conversation_participants(*),
        last_message:messages(
          id,
          content,
          created_at,
          sender_id
        )
      `
      )
      .order("updated_at", { ascending: false })

    if (error) throw error

    // Get unread counts for each conversation
    const conversationsWithUnread = await Promise.all(
      conversations.map(async (conversation) => {
        const unreadCount = await messagingService.getUnreadCount(
          conversation.id
        )
        return {
          ...conversation,
          unread_count: unreadCount,
        }
      })
    )

    return conversationsWithUnread
  },

  // Get a specific conversation with messages
  getConversation: async (
    conversationId: string,
    limit: number = 50,
    offset: number = 0
  ): Promise<{
    conversation: ConversationWithParticipants
    messages: MessageWithSender[]
  }> => {
    // Get conversation details
    const { data: conversation, error: convError } = await supabase
      .from("conversations")
      .select(
        `
        *,
        participants:conversation_participants(*)
      `
      )
      .eq("id", conversationId)
      .single()

    if (convError) throw convError

    // Get messages
    const { data: messages, error: msgError } = await supabase
      .from("messages")
      .select(
        `
        *,
        sender:sender_id(id, name, email),
        reactions:message_reactions(*)
      `
      )
      .eq("conversation_id", conversationId)
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1)

    if (msgError) throw msgError

    // Mark conversation as read
    await messagingService.markConversationAsRead(conversationId)

    return {
      conversation,
      messages: messages.reverse(), // Show oldest first
    }
  },

  // Create or get direct conversation between two users
  getOrCreateDirectConversation: async (
    otherUserId: string
  ): Promise<string> => {
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) throw new Error("User not authenticated")

    const { data, error } = await supabase.rpc(
      "get_or_create_direct_conversation",
      {
        user1_id: user.id,
        user2_id: otherUserId,
      }
    )

    if (error) throw error
    return data
  },

  // Create group conversation
  createGroupConversation: async (
    data: CreateGroupConversationData
  ): Promise<string> => {
    const { data: conversationId, error } = await supabase.rpc(
      "create_group_conversation",
      {
        group_name: data.name,
        participant_ids: data.participant_ids,
      }
    )

    if (error) throw error
    return conversationId
  },

  // Create session conversation
  createSessionConversation: async (
    sessionId: string,
    sessionName: string
  ): Promise<string> => {
    const { data: conversationId, error } = await supabase.rpc(
      "create_session_conversation",
      {
        session_id: sessionId,
        session_name: sessionName,
      }
    )

    if (error) throw error
    return conversationId
  },

  // Send a message
  sendMessage: async (data: CreateMessageData): Promise<Message> => {
    const { data: message, error } = await supabase
      .from("messages")
      .insert({
        conversation_id: data.conversation_id,
        content: data.content,
        message_type: data.message_type || "text",
        metadata: data.metadata || {},
      })
      .select()
      .single()

    if (error) throw error

    // Update conversation's updated_at timestamp
    await supabase
      .from("conversations")
      .update({ updated_at: new Date().toISOString() })
      .eq("id", data.conversation_id)

    return message
  },

  // Edit a message
  editMessage: async (
    messageId: string,
    newContent: string
  ): Promise<Message> => {
    const { data: message, error } = await supabase
      .from("messages")
      .update({
        content: newContent,
        is_edited: true,
        edited_at: new Date().toISOString(),
      })
      .eq("id", messageId)
      .select()
      .single()

    if (error) throw error
    return message
  },

  // Delete a message
  deleteMessage: async (messageId: string): Promise<void> => {
    const { error } = await supabase
      .from("messages")
      .delete()
      .eq("id", messageId)

    if (error) throw error
  },

  // Add reaction to message
  addReaction: async (
    messageId: string,
    reactionType: string
  ): Promise<MessageReaction> => {
    const { data: reaction, error } = await supabase
      .from("message_reactions")
      .insert({
        message_id: messageId,
        reaction_type: reactionType,
      })
      .select()
      .single()

    if (error) throw error
    return reaction
  },

  // Remove reaction from message
  removeReaction: async (
    messageId: string,
    reactionType: string
  ): Promise<void> => {
    const { error } = await supabase
      .from("message_reactions")
      .delete()
      .eq("message_id", messageId)
      .eq("reaction_type", reactionType)

    if (error) throw error
  },

  // Mark conversation as read
  markConversationAsRead: async (conversationId: string): Promise<void> => {
    const { error } = await supabase.rpc("mark_conversation_read", {
      conversation_id: conversationId,
    })

    if (error) throw error
  },

  // Get unread count for a conversation
  getUnreadCount: async (conversationId: string): Promise<number> => {
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return 0

    // Get user's last read timestamp
    const { data: participant } = await supabase
      .from("conversation_participants")
      .select("last_read_at")
      .eq("conversation_id", conversationId)
      .eq("user_id", user.id)
      .single()

    if (!participant) return 0

    // Count messages after last read
    const { count, error } = await supabase
      .from("messages")
      .select("*", { count: "exact", head: true })
      .eq("conversation_id", conversationId)
      .gt("created_at", participant.last_read_at)
      .neq("sender_id", user.id) // Don't count own messages

    if (error) throw error
    return count || 0
  },

  // Get total unread count across all conversations
  getTotalUnreadCount: async (): Promise<number> => {
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return 0

    // First get the conversation IDs for the user
    const { data: participantData, error: participantError } = await supabase
      .from("conversation_participants")
      .select("conversation_id")
      .eq("user_id", user.id)

    if (participantError) throw participantError
    if (!participantData || participantData.length === 0) return 0

    const conversationIds = participantData.map((p) => p.conversation_id)

    // Then get the conversations
    const { data: conversations } = await supabase
      .from("conversations")
      .select("id")
      .in("id", conversationIds)

    if (!conversations) return 0

    let totalUnread = 0
    for (const conversation of conversations) {
      totalUnread += await messagingService.getUnreadCount(conversation.id)
    }

    return totalUnread
  },

  // Add participant to conversation
  addParticipant: async (
    conversationId: string,
    userId: string
  ): Promise<void> => {
    const { error } = await supabase.from("conversation_participants").insert({
      conversation_id: conversationId,
      user_id: userId,
    })

    if (error) throw error
  },

  // Remove participant from conversation
  removeParticipant: async (
    conversationId: string,
    userId: string
  ): Promise<void> => {
    const { error } = await supabase
      .from("conversation_participants")
      .delete()
      .eq("conversation_id", conversationId)
      .eq("user_id", userId)

    if (error) throw error
  },

  // Search conversations
  searchConversations: async (
    query: string
  ): Promise<ConversationWithParticipants[]> => {
    const { data: conversations, error } = await supabase
      .from("conversations")
      .select(
        `
        *,
        participants:conversation_participants(*)
      `
      )
      .or(`name.ilike.%${query}%,conversation_type.ilike.%${query}%`)
      .order("updated_at", { ascending: false })

    if (error) throw error
    return conversations
  },

  // Search messages in a conversation
  searchMessages: async (
    conversationId: string,
    query: string,
    limit: number = 20
  ): Promise<MessageWithSender[]> => {
    const { data: messages, error } = await supabase
      .from("messages")
      .select(
        `
        *,
        sender:sender_id(id, name, email),
        reactions:message_reactions(*)
      `
      )
      .eq("conversation_id", conversationId)
      .ilike("content", `%${query}%`)
      .order("created_at", { ascending: false })
      .limit(limit)

    if (error) throw error
    return messages
  },

  // Get conversation participants
  getConversationParticipants: async (
    conversationId: string
  ): Promise<ConversationParticipant[]> => {
    const { data: participants, error } = await supabase
      .from("conversation_participants")
      .select("*")
      .eq("conversation_id", conversationId)

    if (error) throw error
    return participants
  },

  // Subscribe to real-time updates for a conversation
  subscribeToConversation: (
    conversationId: string,
    callback: (payload: any) => void
  ) => {
    const channel = supabase
      .channel(`conversation:${conversationId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "messages",
          filter: `conversation_id=eq.${conversationId}`,
        },
        callback
      )
      .subscribe()

    return {
      unsubscribe: () => {
        supabase.removeChannel(channel)
      },
    }
  },

  // Subscribe to real-time updates for all user conversations
  subscribeToUserConversations: (callback: (payload: any) => void) => {
    const channel = supabase
      .channel("user_conversations")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "conversations",
        },
        callback
      )
      .subscribe()

    return {
      unsubscribe: () => {
        supabase.removeChannel(channel)
      },
    }
  },
}
