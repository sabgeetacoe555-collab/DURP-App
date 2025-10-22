// services/discussionService.ts
import { supabase } from "../lib/supabase"

import {
  Discussion,
  DiscussionWithParticipants,
  Post,
  PostWithAuthor,
  Reply,
  ReplyWithAuthor,
  CreateDiscussionData,
  CreatePostData,
  CreateReplyData,
  UpdatePostData,
  UpdateReplyData,
  DiscussionFilters,
} from "../types/discussions"

export const discussionService = {
  // Discussion Management
  async createDiscussion(data: CreateDiscussionData): Promise<Discussion> {
    const { data: discussion, error } = await supabase
      .from("discussions")
      .insert({
        discussion_type: data.discussion_type,
        entity_id: data.entity_id,
        name: data.name,
      })
      .select()
      .single()

    if (error) throw error

    // Add participants
    if (data.participant_ids.length > 0) {
      const participants = data.participant_ids.map((user_id) => ({
        discussion_id: discussion.id,
        user_id,
      }))

      const { error: participantError } = await supabase
        .from("discussion_participants")
        .insert(participants)

      if (participantError) throw participantError
    }

    return discussion
  },

  async getDiscussion(
    discussionId: string
  ): Promise<DiscussionWithParticipants> {
    const { data: discussion, error } = await supabase
      .from("discussions")
      .select(
        `
        *,
        participants:discussion_participants(*)
      `
      )
      .eq("id", discussionId)
      .single()

    if (error) throw error
    return discussion
  },

  async getDiscussionByEntity(
    discussionType: "group" | "session",
    entityId: string
  ): Promise<DiscussionWithParticipants | null> {
    const { data: discussion, error } = await supabase
      .from("discussions")
      .select(
        `
        *,
        participants:discussion_participants(*)
      `
      )
      .eq("discussion_type", discussionType)
      .eq("entity_id", entityId)
      .single()

    if (error && error.code !== "PGRST116") throw error
    return discussion || null
  },

  async joinDiscussion(discussionId: string, userId: string): Promise<void> {
    const { error } = await supabase.from("discussion_participants").insert({
      discussion_id: discussionId,
      user_id: userId,
    })

    if (error) throw error
  },

  async getSessionData(sessionId: string): Promise<any> {
    const { data: session, error } = await supabase
      .from("sessions")
      .select("*")
      .eq("id", sessionId)
      .single()

    if (error) throw error
    return session
  },

  // Posts Management
  async createPost(data: CreatePostData): Promise<PostWithAuthor> {
    console.log("DiscussionService: Creating post with data:", data)

    // Get current user
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      throw new Error("User not authenticated")
    }

    const { data: post, error } = await supabase
      .from("posts")
      .insert({
        discussion_id: data.discussion_id,
        author_id: user.id,
        title: data.title,
        content: data.content,
        post_type: data.post_type || "discussion",
      })
      .select("*")
      .single()

    if (error) {
      console.error("DiscussionService: Error creating post:", error)
      throw error
    }

    // Handle attachments if provided
    if (data.attachments && data.attachments.length > 0) {
      try {
        const { attachmentService } = await import("./attachmentService")

        // Upload and create attachments for the post
        await Promise.all(
          data.attachments.map(async (attachmentData) => {
            // Upload the file to storage
            const filePath = await attachmentService.uploadFile(
              attachmentData.file_path,
              attachmentData.file_name,
              attachmentData.mime_type,
              "post",
              post.id
            )

            // Create attachment record
            await attachmentService.createAttachment({
              post_id: post.id,
              file_name: attachmentData.file_name,
              file_path: filePath,
              file_size: attachmentData.file_size,
              mime_type: attachmentData.mime_type,
              file_type: attachmentData.file_type,
            })
          })
        )
      } catch (attachmentError) {
        console.error("Error handling attachments:", attachmentError)
        // Continue with post creation even if attachments fail
      }
    }

    // Get author information
    const { data: authorData } = await supabase
      .from("users")
      .select("id, name, email")
      .eq("id", user.id)
      .single()

    const postWithAuthor: PostWithAuthor = {
      ...post,
      author: authorData || { id: user.id, name: null, email: null },
    }

    console.log("DiscussionService: Post created successfully:", postWithAuthor)
    return postWithAuthor
  },

  async getPosts(
    discussionId: string,
    filters: DiscussionFilters = {},
    limit: number = 20,
    offset: number = 0
  ): Promise<PostWithAuthor[]> {
    let query = supabase
      .from("posts")
      .select("*")
      .eq("discussion_id", discussionId)

    // Apply filters
    if (filters.post_type) {
      query = query.eq("post_type", filters.post_type)
    }

    if (filters.pinned_only) {
      query = query.eq("is_pinned", true)
    }

    // Filter out archived posts by default
    if (!filters.include_archived) {
      query = query.eq("is_archived", false)
    }

    // Apply sorting
    switch (filters.sort_by) {
      case "oldest":
        query = query.order("created_at", { ascending: true })
        break
      case "most_replies":
        query = query.order("reply_count", { ascending: false })
        break
      case "most_views":
        query = query.order("view_count", { ascending: false })
        break
      case "pinned_first":
        // For pinned first, we'll sort by is_pinned (true first), then by created_at (newest first)
        query = query
          .order("is_pinned", { ascending: false })
          .order("created_at", { ascending: false })
        break
      default: // newest
        query = query.order("created_at", { ascending: false })
    }

    // Apply pagination
    query = query.range(offset, offset + limit - 1)

    const { data: posts, error } = await query

    if (error) throw error

    // Get author information for all posts
    const postsWithAuthors = await Promise.all(
      (posts || []).map(async (post) => {
        const { data: authorData } = await supabase
          .from("users")
          .select("id, name, email, dupr_rating_singles, dupr_rating_doubles")
          .eq("id", post.author_id)
          .single()

        return {
          ...post,
          author: authorData || { id: post.author_id, name: null, email: null },
        }
      })
    )

    return postsWithAuthors
  },

  async getPost(postId: string): Promise<PostWithAuthor> {
    const { data: post, error } = await supabase
      .from("posts")
      .select("*")
      .eq("id", postId)
      .single()

    if (error) throw error

    // Get author information
    const { data: authorData } = await supabase
      .from("users")
      .select("id, name, email, dupr_rating_singles, dupr_rating_doubles")
      .eq("id", post.author_id)
      .single()

    return {
      ...post,
      author: authorData || { id: post.author_id, name: null, email: null },
    }
  },

  async updatePost(
    postId: string,
    data: UpdatePostData
  ): Promise<PostWithAuthor> {
    const { data: post, error } = await supabase
      .from("posts")
      .update({
        ...data,
        updated_at: new Date().toISOString(),
      })
      .eq("id", postId)
      .select("*")
      .single()

    if (error) throw error

    // Get author information
    const { data: authorData } = await supabase
      .from("users")
      .select("id, name, email, dupr_rating_singles, dupr_rating_doubles")
      .eq("id", post.author_id)
      .single()

    return {
      ...post,
      author: authorData || {
        id: post.author_id,
        name: null,
        email: null,
        dupr_rating_singles: null,
        dupr_rating_doubles: null,
      },
    }
  },

  async deletePost(postId: string): Promise<void> {
    const { error } = await supabase.from("posts").delete().eq("id", postId)

    if (error) throw error
  },

  async incrementViewCount(postId: string): Promise<void> {
    const { error } = await supabase
      .from("posts")
      .update({
        view_count: supabase.rpc("increment", {
          row_id: postId,
          column_name: "view_count",
        }),
      })
      .eq("id", postId)

    if (error) throw error
  },

  // Replies Management
  async createReply(data: CreateReplyData): Promise<ReplyWithAuthor> {
    // Get current user
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      throw new Error("User not authenticated")
    }

    const { data: reply, error } = await supabase
      .from("replies")
      .insert({
        post_id: data.post_id,
        parent_reply_id: data.parent_reply_id,
        author_id: user.id,
        content: data.content,
      })
      .select("*")
      .single()

    if (error) throw error

    // Get author information
    const { data: authorData } = await supabase
      .from("users")
      .select("id, name, email, dupr_rating_singles, dupr_rating_doubles")
      .eq("id", user.id)
      .single()

    // Send notifications to other participants (excluding the author)
    try {
      await this.sendReplyNotifications(reply, authorData)
    } catch (error) {
      console.error("Error sending reply notifications:", error)
      // Don't fail the reply creation if notifications fail
    }

    return {
      ...reply,
      author: authorData || {
        id: user.id,
        name: null,
        email: null,
        dupr_rating_singles: null,
        dupr_rating_doubles: null,
      },
    }
  },

  async getReplies(
    postId: string,
    limit: number = 50,
    offset: number = 0
  ): Promise<ReplyWithAuthor[]> {
    const { data: replies, error } = await supabase
      .from("replies")
      .select("*")
      .eq("post_id", postId)
      .is("parent_reply_id", null) // Only top-level replies
      .order("created_at", { ascending: true })
      .range(offset, offset + limit - 1)

    if (error) throw error

    // Get author information for all replies
    const repliesWithAuthors = await Promise.all(
      (replies || []).map(async (reply) => {
        const { data: authorData } = await supabase
          .from("users")
          .select("id, name, email, dupr_rating_singles, dupr_rating_doubles")
          .eq("id", reply.author_id)
          .single()

        return {
          ...reply,
          author: authorData || {
            id: reply.author_id,
            name: null,
            email: null,
            dupr_rating_singles: null,
            dupr_rating_doubles: null,
          },
        }
      })
    )

    // Get nested replies for each top-level reply
    const repliesWithNested = await Promise.all(
      repliesWithAuthors.map(async (reply) => {
        const nestedReplies = await this.getNestedReplies(reply.id)
        return {
          ...reply,
          replies: nestedReplies,
        }
      })
    )

    return repliesWithNested
  },

  async getNestedReplies(parentReplyId: string): Promise<ReplyWithAuthor[]> {
    const { data: replies, error } = await supabase
      .from("replies")
      .select("*")
      .eq("parent_reply_id", parentReplyId)
      .order("created_at", { ascending: true })

    if (error) throw error

    // Get author information for all replies
    const repliesWithAuthors = await Promise.all(
      (replies || []).map(async (reply) => {
        const { data: authorData } = await supabase
          .from("users")
          .select("id, name, email, dupr_rating_singles, dupr_rating_doubles")
          .eq("id", reply.author_id)
          .single()

        return {
          ...reply,
          author: authorData || {
            id: reply.author_id,
            name: null,
            email: null,
            dupr_rating_singles: null,
            dupr_rating_doubles: null,
          },
        }
      })
    )

    return repliesWithAuthors
  },

  // Send notifications to discussion participants when a reply is created
  async sendReplyNotifications(
    reply: Reply,
    authorData: {
      id: string
      name: string | null
      email: string | null
      dupr_rating_singles?: number | null
      dupr_rating_doubles?: number | null
    } | null
  ): Promise<void> {
    try {
      // Get the post and discussion information
      const { data: post } = await supabase
        .from("posts")
        .select("*, discussions(*)")
        .eq("id", reply.post_id)
        .single()

      if (!post || !post.discussions) {
        console.log("Post or discussion not found for notification")
        return
      }

      const discussion = post.discussions as Discussion
      const authorName =
        authorData?.name || authorData?.email?.split("@")[0] || "Someone"
      const threadTitle = post.title || post.content.substring(0, 50) + "..."

      // Get all participants in the discussion (excluding the reply author)
      const { data: participants } = await supabase
        .from("discussion_participants")
        .select("user_id")
        .eq("discussion_id", discussion.id)
        .neq("user_id", reply.author_id)

      if (!participants || participants.length === 0) {
        console.log("No participants to notify")
        return
      }

      // Send notifications to all participants
      // TODO: Implement push notification service
      console.log(`Would send ${participants.length} reply notifications`)
    } catch (error) {
      console.error("Error sending reply notifications:", error)
    }
  },

  async updateReply(
    replyId: string,
    data: UpdateReplyData
  ): Promise<ReplyWithAuthor> {
    const { data: reply, error } = await supabase
      .from("replies")
      .update({
        content: data.content,
        is_edited: true,
        edited_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", replyId)
      .select("*")
      .single()

    if (error) throw error

    // Get author information
    const { data: authorData } = await supabase
      .from("users")
      .select("id, name, email")
      .eq("id", reply.author_id)
      .single()

    return {
      ...reply,
      author: authorData || { id: reply.author_id, name: null, email: null },
    }
  },

  async deleteReply(replyId: string): Promise<void> {
    const { error } = await supabase.from("replies").delete().eq("id", replyId)

    if (error) throw error
  },

  // Reactions Management
  async addPostReaction(
    postId: string,
    userId: string,
    reactionType: string
  ): Promise<void> {
    const { error } = await supabase.from("post_reactions").insert({
      post_id: postId,
      user_id: userId,
      reaction_type: reactionType,
    })

    if (error) throw error
  },

  async removePostReaction(
    postId: string,
    userId: string,
    reactionType: string
  ): Promise<void> {
    const { error } = await supabase
      .from("post_reactions")
      .delete()
      .eq("post_id", postId)
      .eq("user_id", userId)
      .eq("reaction_type", reactionType)

    if (error) throw error
  },

  async addReplyReaction(
    replyId: string,
    userId: string,
    reactionType: string
  ): Promise<void> {
    const { error } = await supabase.from("reply_reactions").insert({
      reply_id: replyId,
      user_id: userId,
      reaction_type: reactionType,
    })

    if (error) throw error
  },

  async removeReplyReaction(
    replyId: string,
    userId: string,
    reactionType: string
  ): Promise<void> {
    const { error } = await supabase
      .from("reply_reactions")
      .delete()
      .eq("reply_id", replyId)
      .eq("user_id", userId)
      .eq("reaction_type", reactionType)

    if (error) throw error
  },

  // Utility functions
  async markDiscussionAsRead(
    discussionId: string,
    userId: string
  ): Promise<void> {
    const { error } = await supabase
      .from("discussion_participants")
      .update({
        last_read_at: new Date().toISOString(),
      })
      .eq("discussion_id", discussionId)
      .eq("user_id", userId)

    if (error) throw error
  },

  async getUnreadCount(discussionId: string, userId: string): Promise<number> {
    // Get the last read timestamp for this user
    const { data: participant } = await supabase
      .from("discussion_participants")
      .select("last_read_at")
      .eq("discussion_id", discussionId)
      .eq("user_id", userId)
      .single()

    if (!participant) return 0

    // Count posts created after the last read timestamp
    const { count, error } = await supabase
      .from("posts")
      .select("*", { count: "exact", head: true })
      .eq("discussion_id", discussionId)
      .eq("is_archived", false)
      .gt("created_at", participant.last_read_at)

    if (error) throw error
    return count || 0
  },

  // Archive Management
  async archivePost(postId: string): Promise<void> {
    const { error } = await supabase.rpc("archive_post_and_replies", {
      post_id_to_archive: postId,
    })

    if (error) {
      console.error("Error archiving post:", error)
      throw new Error(`Failed to archive post: ${error.message}`)
    }
  },

  async unarchivePost(postId: string): Promise<void> {
    const { error } = await supabase.rpc("unarchive_post_and_replies", {
      post_id_to_unarchive: postId,
    })

    if (error) {
      console.error("Error unarchiving post:", error)
      throw new Error(`Failed to unarchive post: ${error.message}`)
    }
  },

  async getArchivedPosts(
    discussionId: string,
    limit: number = 20,
    offset: number = 0
  ): Promise<PostWithAuthor[]> {
    const { data: posts, error } = await supabase
      .from("posts")
      .select("*")
      .eq("discussion_id", discussionId)
      .eq("is_archived", true)
      .order("archived_at", { ascending: false })
      .range(offset, offset + limit - 1)

    if (error) {
      console.error("Error fetching archived posts:", error)
      throw new Error(`Failed to fetch archived posts: ${error.message}`)
    }

    // Get author information for all posts
    const postsWithAuthors = await Promise.all(
      (posts || []).map(async (post) => {
        const { data: authorData } = await supabase
          .from("users")
          .select("id, name, email")
          .eq("id", post.author_id)
          .single()

        return {
          ...post,
          author: authorData || { id: post.author_id, name: null, email: null },
        }
      })
    )

    return postsWithAuthors
  },

  // Search functionality
  async searchPosts(
    discussionId: string,
    searchQuery: string,
    limit: number = 20,
    offset: number = 0
  ): Promise<PostWithAuthor[]> {
    const { data: posts, error } = await supabase
      .from("posts")
      .select("*")
      .eq("discussion_id", discussionId)
      .eq("is_archived", false)
      .textSearch("search_vector", searchQuery)
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1)

    if (error) {
      console.error("Error searching posts:", error)
      throw new Error(`Failed to search posts: ${error.message}`)
    }

    // Get author information for all posts
    const postsWithAuthors = await Promise.all(
      (posts || []).map(async (post) => {
        const { data: authorData } = await supabase
          .from("users")
          .select("id, name, email, dupr_rating_singles, dupr_rating_doubles")
          .eq("id", post.author_id)
          .single()

        return {
          ...post,
          author: authorData || { id: post.author_id, name: null, email: null },
        }
      })
    )

    return postsWithAuthors
  },

  async searchReplies(
    discussionId: string,
    searchQuery: string,
    limit: number = 20,
    offset: number = 0
  ): Promise<ReplyWithAuthor[]> {
    const { data: replies, error } = await supabase
      .from("replies")
      .select("*")
      .eq("is_archived", false)
      .textSearch("search_vector", searchQuery)
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1)

    if (error) {
      console.error("Error searching replies:", error)
      throw new Error(`Failed to search replies: ${error.message}`)
    }

    // Filter replies to only include those from posts in this discussion
    const { data: discussionPosts } = await supabase
      .from("posts")
      .select("id")
      .eq("discussion_id", discussionId)

    const postIds = discussionPosts?.map((p) => p.id) || []
    const filteredReplies =
      replies?.filter((reply) => postIds.includes(reply.post_id)) || []

    // Get author information for all replies
    const repliesWithAuthors = await Promise.all(
      filteredReplies.map(async (reply) => {
        const { data: authorData } = await supabase
          .from("users")
          .select("id, name, email, dupr_rating_singles, dupr_rating_doubles")
          .eq("id", reply.author_id)
          .single()

        return {
          ...reply,
          author: authorData || {
            id: reply.author_id,
            name: null,
            email: null,
            dupr_rating_singles: null,
            dupr_rating_doubles: null,
          },
        }
      })
    )

    return repliesWithAuthors
  },
}
