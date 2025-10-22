// types/discussions.ts
export interface Discussion {
  id: string
  discussion_type: "group" | "session"
  entity_id: string // group_id or session_id
  name?: string
  created_at: string
  updated_at: string
}

export interface DiscussionParticipant {
  id: string
  discussion_id: string
  user_id: string
  joined_at: string
  last_read_at: string
  is_admin: boolean
}

export interface Post {
  id: string
  discussion_id: string
  author_id: string
  title?: string
  content: string
  post_type: "discussion" | "announcement"
  is_pinned: boolean
  is_locked: boolean
  is_archived: boolean
  view_count: number
  reply_count: number
  last_reply_at?: string
  archived_at?: string
  archived_by?: string
  created_at: string
  updated_at: string
}

export interface Reply {
  id: string
  post_id: string
  parent_reply_id?: string // For nested replies
  author_id: string
  content: string
  is_edited: boolean
  is_archived: boolean
  edited_at?: string
  archived_at?: string
  archived_by?: string
  created_at: string
  updated_at: string
}

export interface PostReaction {
  id: string
  post_id: string
  user_id: string
  reaction_type: string
  created_at: string
}

export interface ReplyReaction {
  id: string
  reply_id: string
  user_id: string
  reaction_type: string
  created_at: string
}

// Extended interfaces with related data
export interface DiscussionWithParticipants extends Discussion {
  participants: DiscussionParticipant[]
}

export interface PostWithAuthor extends Post {
  author: {
    id: string
    name: string | null
    email: string | null
    dupr_rating_singles?: number | null
    dupr_rating_doubles?: number | null
  }
  reactions?: PostReaction[]
}

export interface ReplyWithAuthor extends Reply {
  author: {
    id: string
    name: string | null
    email: string | null
    dupr_rating_singles?: number | null
    dupr_rating_doubles?: number | null
  }
  reactions?: ReplyReaction[]
  replies?: ReplyWithAuthor[] // For nested replies
}

export interface DiscussionWithPosts extends DiscussionWithParticipants {
  posts: PostWithAuthor[]
}

// Service interfaces
export interface CreateDiscussionData {
  discussion_type: "group" | "session"
  entity_id: string
  name?: string
  participant_ids: string[]
}

export interface CreatePostData {
  discussion_id: string
  title?: string
  content: string
  post_type?: "discussion" | "announcement"
  attachments?: CreateAttachmentData[]
}

export interface CreateReplyData {
  post_id: string
  parent_reply_id?: string
  content: string
}

export interface UpdatePostData {
  title?: string
  content?: string
  post_type?: "discussion" | "announcement"
  is_pinned?: boolean
  is_locked?: boolean
}

export interface UpdateReplyData {
  content: string
}

// UI State interfaces
export interface DiscussionFilters {
  post_type?: "discussion" | "announcement"
  sort_by?: "newest" | "oldest" | "most_replies" | "most_views" | "pinned_first"
  pinned_only?: boolean
  include_archived?: boolean
}

export interface DiscussionState {
  discussions: DiscussionWithPosts[]
  currentDiscussion: DiscussionWithPosts | null
  loading: boolean
  error: string | null
  filters: DiscussionFilters
}

// Attachment types
export interface Attachment {
  id: string
  post_id?: string | null
  reply_id?: string | null
  file_name: string
  file_path: string
  file_size: number
  mime_type: string
  file_type: "image" | "document" | "video" | "audio"
  created_at: string
  created_by: string | null
}

export interface CreateAttachmentData {
  post_id?: string
  reply_id?: string
  file_name: string
  file_path: string
  file_size: number
  mime_type: string
  file_type: "image" | "document" | "video" | "audio"
}

export interface PostWithAttachments extends PostWithAuthor {
  attachments: Attachment[]
}

export interface ReplyWithAttachments extends ReplyWithAuthor {
  attachments: Attachment[]
}
