import React, { useState, useEffect } from "react"
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  FlatList,
  TextInput,
  Alert,
  ActivityIndicator,
  Image,
} from "react-native"
import { useRouter } from "expo-router"
import { Ionicons } from "@expo/vector-icons"
import { useDiscussions } from "../../hooks/useDiscussions"
import { discussionService } from "../../services/discussionService"
import { useAuth } from "../../hooks/useAuth"
import { PostWithAuthor, CreatePostData } from "../../types/discussions"
import { MessageSearch } from "../../components/messages/MessageSearch"
import { CreatePost } from "../../components/messages/CreatePost"
import { MessageHeader } from "../../components/messages/MessageHeader"
import UserWithDUPRRating from "../../components/UserWithDUPRRating"

interface MessagesTabProps {
  groupId: string
  membersWithAccounts: any[]
  onShowAddMembersModal: () => void
  canManageGroup: boolean
  colors: any
  onCreatePost?: () => void
  showCreatePost?: boolean
  onCloseCreatePost?: () => void
}

export const MessagesTab: React.FC<MessagesTabProps> = ({
  groupId,
  membersWithAccounts,
  onShowAddMembersModal,
  canManageGroup,
  colors,
  onCreatePost,
  showCreatePost: externalShowCreatePost,
  onCloseCreatePost,
}) => {
  const { user } = useAuth()
  const router = useRouter()
  const [discussionId, setDiscussionId] = useState<string | null>(null)
  const [isInitializing, setIsInitializing] = useState(false)
  const [showCreatePost, setShowCreatePost] = useState(false)
  const [showSearch, setShowSearch] = useState(false)
  const [showArchived, setShowArchived] = useState(false)
  const [archivedPosts, setArchivedPosts] = useState<PostWithAuthor[]>([])
  const [loadingArchived, setLoadingArchived] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [searchType, setSearchType] = useState<"all" | "posts" | "replies">(
    "all"
  )
  const [filteredPosts, setFilteredPosts] = useState<PostWithAuthor[]>([])
  const [sortBy, setSortBy] = useState<
    "newest" | "oldest" | "most_replies" | "most_views" | "pinned_first"
  >("pinned_first")

  const {
    discussion,
    posts,
    loading,
    error,
    createPost,
    loadDiscussion,
    loadPosts,
  } = useDiscussions(discussionId || undefined)

  // Initialize or get existing discussion for this group
  useEffect(() => {
    const initializeDiscussion = async () => {
      // Don't initialize if no members or no groupId
      if (!groupId || membersWithAccounts.length === 0) {
        setIsInitializing(false)
        return
      }

      setIsInitializing(true)
      try {
        // Try to get existing discussion
        let existingDiscussion = await discussionService.getDiscussionByEntity(
          "group",
          groupId
        )

        if (!existingDiscussion) {
          // Create new discussion if it doesn't exist
          const participantIds = membersWithAccounts
            .map((member) => member.userId)
            .filter(Boolean) // Filter out any undefined values

          // Add current user to participants if not already included
          if (user && !participantIds.includes(user.id)) {
            participantIds.push(user.id)
          }

          console.log("Creating discussion with participants:", participantIds)
          const newDiscussion = await discussionService.createDiscussion({
            discussion_type: "group",
            entity_id: groupId,
            participant_ids: participantIds,
          })
          existingDiscussion = await discussionService.getDiscussion(
            newDiscussion.id
          )
        }

        if (existingDiscussion) {
          setDiscussionId(existingDiscussion.id)
        }
      } catch (err) {
        console.error("Error initializing discussion:", err)
      } finally {
        setIsInitializing(false)
      }
    }

    initializeDiscussion()
  }, [groupId, membersWithAccounts])

  const handleCreatePost = async (
    title: string,
    content: string,
    attachments: any[],
    postType: "discussion" | "announcement"
  ) => {
    if (!discussionId || !content.trim()) return

    try {
      const postData: CreatePostData = {
        discussion_id: discussionId,
        title: title || undefined,
        content: content.trim(),
        post_type: postType,
        attachments: attachments.length > 0 ? attachments : undefined,
      }

      console.log("Creating post with data:", postData)
      await createPost(postData)
    } catch (err) {
      console.error("Error creating post:", err)
      Alert.alert(
        "Error",
        `Failed to create post: ${
          err instanceof Error ? err.message : "Unknown error"
        }`
      )
    }
  }

  const handleCreatePostPress = () => {
    if (onCreatePost) {
      onCreatePost()
    } else {
      setShowCreatePost(true)
    }
  }

  const handlePostPress = (post: PostWithAuthor) => {
    router.push(`/(tabs)/groups/thread/${post.id}`)
  }

  const handleArchivePost = async (postId: string) => {
    try {
      await discussionService.archivePost(postId)
      // Refresh posts to remove the archived post
      if (discussionId) {
        loadPosts(discussionId, { include_archived: false, sort_by: sortBy })
      }
      Alert.alert("Success", "Post archived successfully")
    } catch (err) {
      console.error("Error archiving post:", err)
      Alert.alert("Error", "Failed to archive post")
    }
  }

  const handleUnarchivePost = async (postId: string) => {
    try {
      await discussionService.unarchivePost(postId)
      // Refresh archived posts
      if (discussionId) {
        loadArchivedPosts()
      }
      Alert.alert("Success", "Post unarchived successfully")
    } catch (err) {
      console.error("Error unarchiving post:", err)
      Alert.alert("Error", "Failed to unarchive post")
    }
  }

  const loadArchivedPosts = async () => {
    if (!discussionId) return

    setLoadingArchived(true)
    try {
      const archived = await discussionService.getArchivedPosts(discussionId)
      setArchivedPosts(archived)
    } catch (err) {
      console.error("Error loading archived posts:", err)
    } finally {
      setLoadingArchived(false)
    }
  }

  // Load archived posts when switching to archived view
  useEffect(() => {
    if (showArchived && discussionId) {
      loadArchivedPosts()
    }
  }, [showArchived, discussionId])

  // Initialize filtered posts when posts or archived posts change
  useEffect(() => {
    setFilteredPosts(showArchived ? archivedPosts : posts)
  }, [posts, archivedPosts, showArchived])

  // Filter posts based on search query
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredPosts(showArchived ? archivedPosts : posts)
      return
    }

    const query = searchQuery.toLowerCase()
    const postsToFilter = showArchived ? archivedPosts : posts

    const filtered = postsToFilter.filter((post) => {
      const titleMatch = post.title?.toLowerCase().includes(query)
      const contentMatch = post.content.toLowerCase().includes(query)
      const authorMatch =
        post.author.name?.toLowerCase().includes(query) ||
        post.author.email?.toLowerCase().includes(query)

      if (searchType === "posts") {
        return titleMatch || contentMatch || authorMatch
      }

      // For "all" and "replies", we'll need to also check replies
      // For now, just filter posts
      return titleMatch || contentMatch || authorMatch
    })

    setFilteredPosts(filtered)
  }, [searchQuery, searchType, posts, archivedPosts, showArchived])

  const renderPost = ({ item }: { item: PostWithAuthor }) => (
    <Pressable
      style={[styles.postCard, { borderColor: colors.text + "20" }]}
      onPress={() => handlePostPress(item)}
    >
      <View style={styles.postHeader}>
        <View style={styles.postAuthor}>
          <View style={styles.authorAvatar}>
            <Ionicons name="person" size={16} color={colors.text + "80"} />
          </View>
          <View style={styles.authorInfo}>
            <UserWithDUPRRating
              name={
                item.author.name ||
                item.author.email?.split("@")[0] ||
                "Unknown"
              }
              singlesRating={item.author.dupr_rating_singles}
              doublesRating={item.author.dupr_rating_doubles}
              size="small"
            />
            <Text style={[styles.postDate, { color: colors.text + "60" }]}>
              {new Date(item.created_at).toLocaleDateString()} at{" "}
              {new Date(item.created_at).toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </Text>
          </View>
        </View>
        <View style={styles.postType}>
          <Ionicons
            name={item.post_type === "announcement" ? "pin" : "chatbubble"}
            size={16}
            color={item.post_type === "announcement" ? "#ff6b6b" : colors.tint}
          />
        </View>
      </View>

      {item.title && (
        <Text style={[styles.postTitle, { color: colors.text }]}>
          {item.title}
        </Text>
      )}

      <Text style={[styles.postContent, { color: colors.text }]}>
        {item.content}
      </Text>

      <View style={styles.postFooter}>
        <View style={styles.postStats}>
          <View style={styles.stat}>
            <Ionicons name="eye" size={14} color={colors.text + "60"} />
            <Text style={[styles.statText, { color: colors.text + "60" }]}>
              {item.view_count}
            </Text>
          </View>
          <View style={styles.stat}>
            <Ionicons name="chatbubble" size={14} color={colors.text + "60"} />
            <Text style={[styles.statText, { color: colors.text + "60" }]}>
              {item.reply_count}
            </Text>
          </View>
        </View>

        {item.is_pinned && (
          <View style={styles.pinnedBadge}>
            <Ionicons name="pin" size={12} color="#ff6b6b" />
            <Text style={styles.pinnedText}>Pinned</Text>
          </View>
        )}

        {/* Archive/Unarchive Button */}
        {(user?.id === item.author_id || canManageGroup) && (
          <Pressable
            style={[styles.archiveButton, { borderColor: colors.border }]}
            onPress={() => {
              if (showArchived) {
                handleUnarchivePost(item.id)
              } else {
                handleArchivePost(item.id)
              }
            }}
          >
            <Ionicons
              name={showArchived ? "arrow-up" : "archive"}
              size={16}
              color={colors.text + "60"}
            />
            <Text
              style={[styles.archiveButtonText, { color: colors.text + "60" }]}
            >
              {showArchived ? "Unarchive" : "Archive"}
            </Text>
          </Pressable>
        )}
      </View>
    </Pressable>
  )

  // Show loading state while initializing discussion (only if we have members)
  if (isInitializing && membersWithAccounts.length > 0) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.tint} />
        <Text style={[styles.loadingText, { color: colors.text }]}>
          Setting up discussions...
        </Text>
      </View>
    )
  }

  // Show loading state while loading posts
  if (loading && discussionId) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.tint} />
        <Text style={[styles.loadingText, { color: colors.text }]}>
          Loading posts...
        </Text>
      </View>
    )
  }

  // Show empty state if no members
  if (membersWithAccounts.length === 0) {
    return (
      <View style={styles.emptyMessages}>
        <Ionicons
          name="chatbubbles-outline"
          size={64}
          color={colors.text + "40"}
        />
        <Text style={[styles.emptyMessagesTitle, { color: colors.text }]}>
          Group Discussions Not Available
        </Text>
        <Text style={[styles.emptyMessagesText, { color: colors.text + "80" }]}>
          Group discussions are only available with members who have joined Net
          Gains. Send invitations to enable group discussions.
        </Text>
        {canManageGroup && (
          <Pressable
            style={[styles.startChatButton, { backgroundColor: colors.tint }]}
            onPress={onShowAddMembersModal}
          >
            <Text style={styles.startChatButtonText}>Send Invitations</Text>
          </Pressable>
        )}
      </View>
    )
  }

  return (
    <>
      {/* Create Post Bottom Sheet - rendered at root level */}
      <CreatePost
        visible={externalShowCreatePost || showCreatePost}
        onClose={() => {
          if (onCloseCreatePost) {
            onCloseCreatePost()
          } else {
            setShowCreatePost(false)
          }
        }}
        onSubmit={handleCreatePost}
        submitting={false}
        colors={colors}
      />

      <View style={styles.container}>
        {/* Header with Search and Archive */}
        <MessageHeader
          showSearch={showSearch}
          showArchived={showArchived}
          onSearchToggle={() => setShowSearch(!showSearch)}
          onArchiveToggle={() => setShowArchived(!showArchived)}
          colors={colors}
        />

        {/* Inline Search - appears below header buttons */}
        {showSearch && (
          <MessageSearch
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            searchType={searchType}
            onSearchTypeChange={setSearchType}
          />
        )}

        {/* Posts List - Always visible, but search results overlay when active */}
        <FlatList
          data={filteredPosts}
          renderItem={renderPost}
          keyExtractor={(item) => item.id}
          contentContainerStyle={[
            styles.postsList,
            showSearch && { paddingTop: 0 }, // Remove top padding when search is active
            { paddingBottom: 120 }, // Extra padding for better scroll experience
          ]}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyPosts}>
              <Ionicons
                name={showArchived ? "archive" : "chatbubbles-outline"}
                size={48}
                color={colors.text + "40"}
              />
              <Text style={[styles.emptyPostsTitle, { color: colors.text }]}>
                {showArchived
                  ? "No Archived Posts"
                  : showSearch && searchQuery.trim()
                  ? "No Search Results"
                  : "No Posts Yet"}
              </Text>
              <Text
                style={[styles.emptyPostsText, { color: colors.text + "80" }]}
              >
                {showArchived
                  ? "Archived posts will appear here"
                  : showSearch && searchQuery.trim()
                  ? "Try adjusting your search terms"
                  : "Create a message in this group"}
              </Text>
            </View>
          }
        />
      </View>
    </>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 40,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
  },
  emptyMessages: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 40,
  },
  emptyMessagesTitle: {
    fontSize: 20,
    fontWeight: "600",
    marginTop: 16,
    marginBottom: 8,
  },
  emptyMessagesText: {
    fontSize: 16,
    textAlign: "center",
    marginBottom: 24,
  },
  startChatButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  startChatButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
  },
  postsList: {
    padding: 16,
  },
  postCard: {
    backgroundColor: "white",
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  postHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  postAuthor: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  authorAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#f0f0f0",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  authorInfo: {
    flex: 1,
  },
  postDate: {
    fontSize: 12,
  },
  postType: {
    padding: 4,
  },
  postTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 8,
  },
  postContent: {
    fontSize: 16,
    lineHeight: 24,
    marginBottom: 12,
  },
  postFooter: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  postStats: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
  },
  stat: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  statText: {
    fontSize: 12,
  },
  pinnedBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#fff5f5",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  pinnedText: {
    fontSize: 10,
    color: "#ff6b6b",
    fontWeight: "600",
  },
  emptyPosts: {
    alignItems: "center",
    paddingVertical: 40,
  },
  emptyPostsTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginTop: 16,
    marginBottom: 8,
  },
  emptyPostsText: {
    fontSize: 16,
    textAlign: "center",
  },

  archiveButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    gap: 4,
  },
  archiveButtonText: {
    fontSize: 12,
    fontWeight: "500",
  },
})
