import React, { useState, useEffect } from "react"
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  FlatList,
  Alert,
  ActivityIndicator,
} from "react-native"
import { useRouter } from "expo-router"
import { Ionicons } from "@expo/vector-icons"
import { discussionService } from "../../../services/discussionService"
import { useAuth } from "../../../hooks/useAuth"
import {
  PostWithAuthor,
  CreatePostData,
  DiscussionFilters,
} from "../../../types/discussions"
import { useColorScheme } from "../../../components/useColorScheme"
import { MessageSearch } from "../../../components/messages/MessageSearch"
import { CreatePost } from "../../../components/messages/CreatePost"
import { MessageHeader } from "../../../components/messages/MessageHeader"
import UserWithDUPRRating from "../../../components/UserWithDUPRRating"

interface SessionMessagesProps {
  sessionId: string
  isMessagesLoaded: (isLoaded: boolean) => void
}

export function SessionMessages({
  sessionId,
  isMessagesLoaded,
}: SessionMessagesProps) {
  const router = useRouter()
  const { user } = useAuth()
  const colors = useColorScheme()

  const [posts, setPosts] = useState<PostWithAuthor[]>([])
  const [archivedPosts, setArchivedPosts] = useState<PostWithAuthor[]>([])
  const [loading, setLoading] = useState(true)
  // const [loadingArchived, setLoadingArchived] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [discussionId, setDiscussionId] = useState<string | null>(null)
  const [isInitializing, setIsInitializing] = useState(false)
  const [showSearch, setShowSearch] = useState(false)
  // const [showArchived, setShowArchived] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  // const [searchType, setSearchType] = useState<"all" | "posts" | "replies">(
  //   "all"
  // )
  const [filteredPosts, setFilteredPosts] = useState<PostWithAuthor[]>([])
  const [showCreatePost, setShowCreatePost] = useState(false)

  useEffect(() => {
    if (sessionId) {
      initializeDiscussion()
    }
  }, [sessionId])

  const initializeDiscussion = async () => {
    try {
      setIsInitializing(true)
      setError(null)

      // Check if discussion already exists for this session
      let discussion = await discussionService.getDiscussionByEntity(
        "session",
        sessionId
      )

      if (!discussion) {
        // Create new discussion for this session
        const sessionData = await discussionService.getSessionData(sessionId)
        if (!sessionData) {
          throw new Error("Session not found")
        }

        const newDiscussion = await discussionService.createDiscussion({
          discussion_type: "session",
          entity_id: sessionId,
          name: `${sessionData.name || "Session"} Discussion`,
          participant_ids: user ? [user.id] : [],
        })

        // Get the discussion with participants
        discussion = await discussionService.getDiscussion(newDiscussion.id)
      }

      if (discussion) {
        setDiscussionId(discussion.id)
        await loadPosts(discussion.id, {
          include_archived: false,
          sort_by: "pinned_first",
        })
      }
    } catch (err) {
      console.error("Error initializing discussion:", err)
      setError("Failed to initialize discussion")
    } finally {
      setIsInitializing(false)
      setLoading(false)
      isMessagesLoaded(true)
    }
  }

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
      const newPost = await discussionService.createPost(postData)

      // Add the new post to the list
      setPosts((prev) => [newPost, ...prev])
      setFilteredPosts((prev) => [newPost, ...prev])
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

  const loadPosts = async (
    discussionId: string,
    filters: DiscussionFilters = {}
  ) => {
    try {
      setLoading(true)
      const postsData = await discussionService.getPosts(discussionId, filters)
      setPosts(postsData)
    } catch (err) {
      console.error("Error loading posts:", err)
      setError(
        `Failed to load posts: ${
          err instanceof Error ? err.message : "Unknown error"
        }`
      )
    } finally {
      setLoading(false)
      isMessagesLoaded(true)
    }
  }

  const handlePostPress = (post: PostWithAuthor) => {
    router.push(`/(tabs)/sessions/thread/${post.id}`)
  }

  // const handleArchivePost = async (postId: string) => {
  //   try {
  //     await discussionService.archivePost(postId)
  //     // Refresh posts to remove the archived post
  //     if (discussionId) {
  //       loadPosts(discussionId, {
  //         include_archived: false,
  //         sort_by: "pinned_first",
  //       })
  //     }
  //     Alert.alert("Success", "Post archived successfully")
  //   } catch (err) {
  //     console.error("Error archiving post:", err)
  //     Alert.alert("Error", "Failed to archive post")
  //   }
  // }

  // const handleUnarchivePost = async (postId: string) => {
  //   try {
  //     await discussionService.unarchivePost(postId)
  //     // Refresh archived posts
  //     if (discussionId) {
  //       loadArchivedPosts()
  //     }
  //     Alert.alert("Success", "Post unarchived successfully")
  //   } catch (err) {
  //     console.error("Error unarchiving post:", err)
  //     Alert.alert("Error", "Failed to unarchive post")
  //   }
  // }

  // const loadArchivedPosts = async () => {
  //   if (!discussionId) return

  //   setLoadingArchived(true)
  //   try {
  //     const archived = await discussionService.getArchivedPosts(discussionId)
  //     setArchivedPosts(archived)
  //   } catch (err) {
  //     console.error("Error loading archived posts:", err)
  //   } finally {
  //     setLoadingArchived(false)
  //   }
  // }

  // Load archived posts when switching to archived view
  // useEffect(() => {
  //   if (showArchived && discussionId) {
  //     loadArchivedPosts()
  //   }
  // }, [showArchived, discussionId])

  // Initialize filtered posts when posts or archived posts change
  // useEffect(() => {
  //   setFilteredPosts(showArchived ? archivedPosts : posts)
  // }, [posts, archivedPosts, showArchived])

  // Filter posts based on search query
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredPosts([...archivedPosts, ...posts])
      return
    }

    const query = searchQuery.toLowerCase()
    const postsToFilter = [...archivedPosts, ...posts]

    const filtered = postsToFilter.filter((post) => {
      const titleMatch = post.title?.toLowerCase().includes(query)
      const contentMatch = post.content.toLowerCase().includes(query)
      const authorMatch =
        post.author.name?.toLowerCase().includes(query) ||
        post.author.email?.toLowerCase().includes(query)

      // if (searchType === "posts") {
      //   return titleMatch || contentMatch || authorMatch
      // }

      // For "all" and "replies", we'll need to also check replies
      // For now, just filter posts
      return titleMatch || contentMatch || authorMatch
    })

    setFilteredPosts(filtered)
  }, [searchQuery, posts, archivedPosts])

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
        {/* <View style={styles.postActions}>
          {showArchived ? (
            <Pressable
              style={styles.archiveButton}
              onPress={() => handleUnarchivePost(item.id)}
            >
              <Ionicons name="archive-outline" size={16} color={colors.tint} />
              <Text style={[styles.archiveButtonText, { color: colors.tint }]}>
                Unarchive
              </Text>
            </Pressable>
          ) : (
            <Pressable
              style={styles.archiveButton}
              onPress={() => handleArchivePost(item.id)}
            >
              <Ionicons name="archive" size={16} color={colors.text + "60"} />
              <Text
                style={[
                  styles.archiveButtonText,
                  { color: colors.text + "60" },
                ]}
              >
                Archive
              </Text>
            </Pressable>
          )}
        </View> */}
      </View>

      {item.title && (
        <Text style={[styles.postTitle, { color: colors.text }]}>
          {item.title}
        </Text>
      )}

      <Text style={[styles.postContent, { color: colors.text }]}>
        {item.content}
      </Text>

      <View style={styles.postMeta}>
        <View style={styles.postType}>
          <Ionicons
            name={item.post_type === "announcement" ? "pin" : "chatbubble"}
            size={12}
            color={item.post_type === "announcement" ? "#ff6b6b" : colors.tint}
          />
          <Text
            style={[
              styles.postTypeText,
              {
                color:
                  item.post_type === "announcement" ? "#ff6b6b" : colors.tint,
              },
            ]}
          >
            {item.post_type === "announcement" ? "Pinned" : "Discussion"}
          </Text>
        </View>
        <Text style={[styles.replyCount, { color: colors.text + "60" }]}>
          {item.reply_count} replies
        </Text>
      </View>
    </Pressable>
  )

  if (loading || isInitializing) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.tint} />
        <Text style={[styles.loadingText, { color: colors.text }]}>
          {isInitializing ? "Setting up discussions..." : "Loading posts..."}
        </Text>
      </View>
    )
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Ionicons name="alert-circle" size={64} color={colors.text + "40"} />
        <Text style={[styles.errorTitle, { color: colors.text }]}>
          Unable to Load Discussions
        </Text>
        <Text style={[styles.errorText, { color: colors.text + "80" }]}>
          {error}
        </Text>
        <Pressable
          style={[styles.retryButton, { backgroundColor: colors.tint }]}
          onPress={() => initializeDiscussion()}
        >
          <Text style={styles.retryButtonText}>Try Again</Text>
        </Pressable>
      </View>
    )
  }

  return (
    <View style={styles.container}>
      {/* Header with Search and Archive buttons */}
      <MessageHeader
        showSearch={showSearch}
        showArchived={false}
        onSearchToggle={() => setShowSearch(!showSearch)}
        onArchiveToggle={() => {}}
        colors={colors}
        compact={true}
      />
      {/* Search UI */}
      {showSearch && (
        <MessageSearch
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          searchType={"all"}
          onSearchTypeChange={() => {}}
        />
      )}
      {/* Posts List */}
      <View
        style={[styles.postsList, showSearch && styles.postsListWithSearch]}
      >
        {filteredPosts.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons
              name="chatbubbles-outline"
              size={64}
              color={colors.text + "40"}
            />
            <Text style={[styles.emptyTitle, { color: colors.text }]}>
              {searchQuery.trim() ? "No Posts Found" : "No Posts Yet"}
            </Text>
            <Text style={[styles.emptyText, { color: colors.text + "80" }]}>
              {searchQuery.trim()
                ? "Try adjusting your search terms"
                : "Be the first to create a message!"}
            </Text>
          </View>
        ) : (
          filteredPosts.map((item) => (
            <View key={item.id}>{renderPost({ item })}</View>
          ))
        )}
      </View>
      {/* Create Post FAB */}
      {/* <View style={styles.createPostButtonContainer}>
        <Pressable
          style={[styles.createPostButton, { backgroundColor: colors.tint }]}
          onPress={() => setShowCreatePost(true)}
        >
          <Ionicons name="add" size={24} color="white" />
        </Pressable>
      </View> */}
      {/* Create Post Modal */}
      {/* <CreatePost
        visible={showCreatePost}
        onClose={() => setShowCreatePost(false)}
        onSubmit={handleCreatePost}
        submitting={false}
        colors={colors}
      /> */}
    </View>
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
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 40,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: "600",
    marginTop: 16,
    marginBottom: 8,
  },
  errorText: {
    fontSize: 16,
    textAlign: "center",
    marginBottom: 24,
  },
  retryButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
  },
  postsList: {
    padding: 16,
  },
  postsListWithSearch: {
    paddingTop: 8,
  },
  postCard: {
    backgroundColor: "white",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 1,
    elevation: 1,
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
  postActions: {
    flexDirection: "row",
    alignItems: "center",
  },
  archiveButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  archiveButtonText: {
    fontSize: 12,
  },
  postTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 8,
  },
  postContent: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 12,
  },
  postMeta: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  postType: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  postTypeText: {
    fontSize: 12,
    textTransform: "capitalize",
  },
  replyCount: {
    fontSize: 12,
  },
  emptyContainer: {
    alignItems: "center",
    paddingVertical: 40,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    textAlign: "center",
  },
  createPostButtonContainer: {
    position: "absolute",
    bottom: 20,
    right: 20,
  },
  createPostButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
})
