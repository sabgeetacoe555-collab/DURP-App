import React from "react"
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
} from "react-native"
import { useMessaging } from "../../hooks/useMessaging"
import { ConversationWithParticipants } from "../../services/messagingService"
import Colors from "../../constants/Colors"
import { StyledText } from "../StyledText"

interface ConversationListProps {
  onConversationPress: (conversation: ConversationWithParticipants) => void
  onNewConversationPress?: () => void
}

export const ConversationList: React.FC<ConversationListProps> = ({
  onConversationPress,
  onNewConversationPress,
}) => {
  const {
    conversations,
    loading,
    error,
    totalUnreadCount,
    loadConversations,
    clearError,
  } = useMessaging()

  const renderConversationItem = ({
    item,
  }: {
    item: ConversationWithParticipants
  }) => {
    const isUnread = (item.unread_count || 0) > 0

    // Get conversation name based on type
    const getConversationName = () => {
      if (item.conversation_type === "direct") {
        // For direct conversations, show the other person's name
        const participants = item.participants || []
        const otherParticipant = participants.find((p) => p.user_id !== item.id)
        return otherParticipant ? "Direct Message" : "You"
      }
      return item.name || "Unnamed Conversation"
    }

    // Get last message preview
    const getLastMessagePreview = () => {
      if (!item.last_message) return "No messages yet"

      const content = item.last_message.content
      return content.length > 50 ? `${content.substring(0, 50)}...` : content
    }

    // Format timestamp
    const formatTimestamp = (timestamp: string) => {
      const date = new Date(timestamp)
      const now = new Date()
      const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60)

      if (diffInHours < 24) {
        return date.toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        })
      } else if (diffInHours < 168) {
        // 7 days
        return date.toLocaleDateString([], { weekday: "short" })
      } else {
        return date.toLocaleDateString([], { month: "short", day: "numeric" })
      }
    }

    return (
      <TouchableOpacity
        style={[styles.conversationItem, isUnread && styles.unreadItem]}
        onPress={() => onConversationPress(item)}
      >
        <View style={styles.conversationContent}>
          <View style={styles.conversationHeader}>
            <StyledText
              style={[styles.conversationName, isUnread && styles.unreadText]}
            >
              {getConversationName()}
            </StyledText>
            {item.last_message && (
              <StyledText style={styles.timestamp}>
                {formatTimestamp(item.last_message.created_at || "")}
              </StyledText>
            )}
          </View>

          <View style={styles.conversationFooter}>
            <StyledText
              style={[styles.lastMessage, isUnread && styles.unreadText]}
              numberOfLines={1}
            >
              {getLastMessagePreview()}
            </StyledText>

            {isUnread && (
              <View style={styles.unreadBadge}>
                <StyledText style={styles.unreadCount}>
                  {item.unread_count}
                </StyledText>
              </View>
            )}
          </View>
        </View>
      </TouchableOpacity>
    )
  }

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <StyledText style={styles.emptyStateTitle}>
        No conversations yet
      </StyledText>
      <StyledText style={styles.emptyStateSubtitle}>
        Start a conversation with friends or join a group chat
      </StyledText>
      {onNewConversationPress && (
        <TouchableOpacity
          style={styles.newConversationButton}
          onPress={onNewConversationPress}
        >
          <StyledText style={styles.newConversationButtonText}>
            Start New Conversation
          </StyledText>
        </TouchableOpacity>
      )}
    </View>
  )

  const renderHeader = () => (
    <View style={styles.header}>
      <StyledText style={styles.headerTitle}>Messages</StyledText>
      {totalUnreadCount > 0 && (
        <View style={styles.totalUnreadBadge}>
          <StyledText style={styles.totalUnreadCount}>
            {totalUnreadCount}
          </StyledText>
        </View>
      )}
      {onNewConversationPress && (
        <TouchableOpacity
          style={styles.newButton}
          onPress={onNewConversationPress}
        >
          <StyledText style={styles.newButtonText}>+</StyledText>
        </TouchableOpacity>
      )}
    </View>
  )

  if (loading && (conversations || []).length === 0) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.light.tint} />
        <StyledText style={styles.loadingText}>
          Loading conversations...
        </StyledText>
      </View>
    )
  }

  return (
    <View style={styles.container}>
      {renderHeader()}

      {error && (
        <View style={styles.errorContainer}>
          <StyledText style={styles.errorText}>{error}</StyledText>
          <TouchableOpacity
            style={styles.retryButton}
            onPress={loadConversations}
          >
            <StyledText style={styles.retryButtonText}>Retry</StyledText>
          </TouchableOpacity>
        </View>
      )}

      <FlatList
        data={conversations || []}
        renderItem={renderConversationItem}
        keyExtractor={(item) => item.id}
        style={styles.list}
        contentContainerStyle={
          (conversations || []).length === 0 ? styles.emptyList : undefined
        }
        refreshControl={
          <RefreshControl
            refreshing={loading}
            onRefresh={loadConversations}
            tintColor={Colors.light.tint}
          />
        }
        ListEmptyComponent={renderEmptyState}
        showsVerticalScrollIndicator={false}
      />
    </View>
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
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.border,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: Colors.light.text,
  },
  totalUnreadBadge: {
    backgroundColor: Colors.light.tint,
    borderRadius: 12,
    minWidth: 24,
    height: 24,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 8,
  },
  totalUnreadCount: {
    color: "white",
    fontSize: 12,
    fontWeight: "bold",
  },
  newButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.light.tint,
    alignItems: "center",
    justifyContent: "center",
  },
  newButtonText: {
    color: "white",
    fontSize: 20,
    fontWeight: "bold",
  },
  list: {
    flex: 1,
  },
  emptyList: {
    flex: 1,
  },
  conversationItem: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.border,
  },
  unreadItem: {
    backgroundColor: Colors.light.background,
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
    color: Colors.light.text,
    flex: 1,
  },
  unreadText: {
    fontWeight: "bold",
  },
  timestamp: {
    fontSize: 12,
    color: Colors.light.tabIconDefault,
  },
  conversationFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  lastMessage: {
    fontSize: 14,
    color: Colors.light.tabIconDefault,
    flex: 1,
    marginRight: 8,
  },
  unreadBadge: {
    backgroundColor: Colors.light.tint,
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  unreadCount: {
    color: "white",
    fontSize: 12,
    fontWeight: "bold",
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
    marginBottom: 8,
  },
  retryButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: Colors.light.tint,
    borderRadius: 8,
  },
  retryButtonText: {
    color: "white",
    fontWeight: "600",
  },
  emptyState: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 32,
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: Colors.light.text,
    marginBottom: 8,
  },
  emptyStateSubtitle: {
    fontSize: 14,
    color: Colors.light.tabIconDefault,
    textAlign: "center",
    marginBottom: 24,
  },
  newConversationButton: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: Colors.light.tint,
    borderRadius: 8,
  },
  newConversationButtonText: {
    color: "white",
    fontWeight: "600",
  },
})
