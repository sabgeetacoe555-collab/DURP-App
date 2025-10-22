// hooks/useDiscussions.ts
import { useState, useEffect, useCallback } from "react"
import { discussionService } from "../services/discussionService"
import { useAuth } from "./useAuth"
import {
  DiscussionWithParticipants,
  PostWithAuthor,
  ReplyWithAuthor,
  CreatePostData,
  CreateReplyData,
  UpdatePostData,
  UpdateReplyData,
  DiscussionFilters,
} from "../types/discussions"

export const useDiscussions = (discussionId?: string) => {
  const { user } = useAuth()
  const [discussion, setDiscussion] =
    useState<DiscussionWithParticipants | null>(null)
  const [posts, setPosts] = useState<PostWithAuthor[]>([])
  const [currentPost, setCurrentPost] = useState<PostWithAuthor | null>(null)
  const [replies, setReplies] = useState<ReplyWithAuthor[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [filters, setFilters] = useState<DiscussionFilters>({
    sort_by: "pinned_first",
  })

  // Load discussion
  const loadDiscussion = useCallback(async (id: string) => {
    if (!id) return

    try {
      setLoading(true)
      setError(null)
      const discussionData = await discussionService.getDiscussion(id)
      setDiscussion(discussionData)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load discussion")
    } finally {
      setLoading(false)
    }
  }, [])

  // Load posts
  const loadPosts = useCallback(
    async (id: string, currentFilters?: DiscussionFilters) => {
      if (!id) return

      try {
        setLoading(true)
        setError(null)
        const postsData = await discussionService.getPosts(
          id,
          currentFilters || filters
        )
        setPosts(postsData)
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load posts")
      } finally {
        setLoading(false)
      }
    },
    [filters]
  )

  // Load a specific post with replies
  const loadPost = useCallback(async (postId: string) => {
    if (!postId) return

    try {
      setLoading(true)
      setError(null)

      // Load post details
      const postData = await discussionService.getPost(postId)
      setCurrentPost(postData)

      // Increment view count
      await discussionService.incrementViewCount(postId)

      // Load replies
      const repliesData = await discussionService.getReplies(postId)
      setReplies(repliesData)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load post")
    } finally {
      setLoading(false)
    }
  }, [])

  // Create a new post
  const createPost = useCallback(
    async (data: CreatePostData) => {
      if (!user) throw new Error("User not authenticated")

      try {
        setError(null)
        const newPost = await discussionService.createPost(data)
        setPosts((prev) => [newPost, ...prev])
        return newPost
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to create post")
        throw err
      }
    },
    [user]
  )

  // Update a post
  const updatePost = useCallback(
    async (postId: string, data: UpdatePostData) => {
      if (!user) throw new Error("User not authenticated")

      try {
        setError(null)
        const updatedPost = await discussionService.updatePost(postId, data)

        // Update in posts list
        setPosts((prev) =>
          prev.map((post) => (post.id === postId ? updatedPost : post))
        )

        // Update current post if it's the one being edited
        if (currentPost?.id === postId) {
          setCurrentPost(updatedPost)
        }

        return updatedPost
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to update post")
        throw err
      }
    },
    [user, currentPost]
  )

  // Delete a post
  const deletePost = useCallback(
    async (postId: string) => {
      if (!user) throw new Error("User not authenticated")

      try {
        setError(null)
        await discussionService.deletePost(postId)

        // Remove from posts list
        setPosts((prev) => prev.filter((post) => post.id !== postId))

        // Clear current post if it's the one being deleted
        if (currentPost?.id === postId) {
          setCurrentPost(null)
          setReplies([])
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to delete post")
        throw err
      }
    },
    [user, currentPost]
  )

  // Create a reply
  const createReply = useCallback(
    async (data: CreateReplyData) => {
      if (!user) throw new Error("User not authenticated")

      try {
        setError(null)
        const newReply = await discussionService.createReply(data)

        // Add to replies list
        if (data.parent_reply_id) {
          // Nested reply - find the parent reply and add to its replies
          setReplies((prev) =>
            prev.map((reply) => {
              if (reply.id === data.parent_reply_id) {
                return {
                  ...reply,
                  replies: [...(reply.replies || []), newReply],
                }
              }
              return reply
            })
          )
        } else {
          // Top-level reply
          setReplies((prev) => [...prev, newReply])
        }

        // Update reply count in posts
        setPosts((prev) =>
          prev.map((post) =>
            post.id === data.post_id
              ? { ...post, reply_count: post.reply_count + 1 }
              : post
          )
        )

        return newReply
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to create reply")
        throw err
      }
    },
    [user]
  )

  // Update a reply
  const updateReply = useCallback(
    async (replyId: string, data: UpdateReplyData) => {
      if (!user) throw new Error("User not authenticated")

      try {
        setError(null)
        const updatedReply = await discussionService.updateReply(replyId, data)

        // Update in replies list
        setReplies((prev) =>
          prev.map((reply) => (reply.id === replyId ? updatedReply : reply))
        )

        return updatedReply
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to update reply")
        throw err
      }
    },
    [user]
  )

  // Delete a reply
  const deleteReply = useCallback(
    async (replyId: string) => {
      if (!user) throw new Error("User not authenticated")

      try {
        setError(null)
        await discussionService.deleteReply(replyId)

        // Remove from replies list
        setReplies((prev) => prev.filter((reply) => reply.id !== replyId))
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to delete reply")
        throw err
      }
    },
    [user]
  )

  // Add reaction to post
  const addPostReaction = useCallback(
    async (postId: string, reactionType: string) => {
      if (!user) throw new Error("User not authenticated")

      try {
        setError(null)
        await discussionService.addPostReaction(postId, user.id, reactionType)

        // Update post reactions in state
        setPosts((prev) =>
          prev.map((post) => {
            if (post.id === postId) {
              const newReaction = {
                id: `temp-${Date.now()}`,
                post_id: postId,
                user_id: user.id,
                reaction_type: reactionType,
                created_at: new Date().toISOString(),
              }
              return {
                ...post,
                reactions: [...(post.reactions || []), newReaction],
              }
            }
            return post
          })
        )
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to add reaction")
        throw err
      }
    },
    [user]
  )

  // Remove reaction from post
  const removePostReaction = useCallback(
    async (postId: string, reactionType: string) => {
      if (!user) throw new Error("User not authenticated")

      try {
        setError(null)
        await discussionService.removePostReaction(
          postId,
          user.id,
          reactionType
        )

        // Remove reaction from state
        setPosts((prev) =>
          prev.map((post) => {
            if (post.id === postId) {
              return {
                ...post,
                reactions: (post.reactions || []).filter(
                  (reaction) =>
                    !(
                      reaction.user_id === user.id &&
                      reaction.reaction_type === reactionType
                    )
                ),
              }
            }
            return post
          })
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

  // Add reaction to reply
  const addReplyReaction = useCallback(
    async (replyId: string, reactionType: string) => {
      if (!user) throw new Error("User not authenticated")

      try {
        setError(null)
        await discussionService.addReplyReaction(replyId, user.id, reactionType)

        // Update reply reactions in state
        setReplies((prev) =>
          prev.map((reply) => {
            if (reply.id === replyId) {
              const newReaction = {
                id: `temp-${Date.now()}`,
                reply_id: replyId,
                user_id: user.id,
                reaction_type: reactionType,
                created_at: new Date().toISOString(),
              }
              return {
                ...reply,
                reactions: [...(reply.reactions || []), newReaction],
              }
            }
            return reply
          })
        )
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to add reaction")
        throw err
      }
    },
    [user]
  )

  // Remove reaction from reply
  const removeReplyReaction = useCallback(
    async (replyId: string, reactionType: string) => {
      if (!user) throw new Error("User not authenticated")

      try {
        setError(null)
        await discussionService.removeReplyReaction(
          replyId,
          user.id,
          reactionType
        )

        // Remove reaction from state
        setReplies((prev) =>
          prev.map((reply) => {
            if (reply.id === replyId) {
              return {
                ...reply,
                reactions: (reply.reactions || []).filter(
                  (reaction) =>
                    !(
                      reaction.user_id === user.id &&
                      reaction.reaction_type === reactionType
                    )
                ),
              }
            }
            return reply
          })
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

  // Update filters
  const updateFilters = useCallback(
    (newFilters: Partial<DiscussionFilters>) => {
      setFilters((prev) => ({ ...prev, ...newFilters }))
    },
    []
  )

  // Mark discussion as read
  const markAsRead = useCallback(
    async (id: string) => {
      if (!user) return

      try {
        await discussionService.markDiscussionAsRead(id, user.id)
      } catch (err) {
        console.error("Failed to mark discussion as read:", err)
      }
    },
    [user]
  )

  // Load discussion when discussionId changes
  useEffect(() => {
    if (discussionId) {
      loadDiscussion(discussionId)
      loadPosts(discussionId, { sort_by: "pinned_first" })
    }
  }, [discussionId, loadDiscussion, loadPosts])

  return {
    // State
    discussion,
    posts,
    currentPost,
    replies,
    loading,
    error,
    filters,

    // Actions
    loadDiscussion,
    loadPosts,
    loadPost,
    createPost,
    updatePost,
    deletePost,
    createReply,
    updateReply,
    deleteReply,
    addPostReaction,
    removePostReaction,
    addReplyReaction,
    removeReplyReaction,
    updateFilters,
    markAsRead,

    // Utilities
    clearError: () => setError(null),
    clearCurrentPost: () => {
      setCurrentPost(null)
      setReplies([])
    },
  }
}
