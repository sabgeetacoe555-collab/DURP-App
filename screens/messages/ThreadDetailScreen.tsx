import React, { useState, useEffect, useRef } from "react"
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  TextInput,
  Alert,
  ActivityIndicator,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Image,
} from "react-native"
import { useSafeAreaInsets } from "react-native-safe-area-context"
import { useLocalSearchParams, useRouter } from "expo-router"
import { Ionicons } from "@expo/vector-icons"
import { discussionService } from "../../services/discussionService"
import { attachmentService } from "../../services/attachmentService"
import { useAuth } from "../../hooks/useAuth"
import {
  PostWithAuthor,
  ReplyWithAuthor,
  ReplyWithAttachments,
  CreateReplyData,
  Attachment,
} from "../../types/discussions"
import { useColorScheme } from "../../components/useColorScheme"
import {
  RepliesList,
  RepliesListRef,
} from "../../components/messages/RepliesList"
import { ReplyInput } from "../../components/messages/ReplyInput"
import { useAttachments } from "../../hooks/useAttachments"
import CustomHeader from "@/components/CustomHeader"
import UserWithDUPRRating from "../../components/UserWithDUPRRating"

export function ThreadDetailScreen() {
  const { threadId } = useLocalSearchParams<{ threadId: string }>()
  const router = useRouter()
  const { user } = useAuth()
  const colors = useColorScheme()
  const insets = useSafeAreaInsets()

  const [post, setPost] = useState<PostWithAuthor | null>(null)
  const [replies, setReplies] = useState<ReplyWithAttachments[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [submittingReply, setSubmittingReply] = useState(false)
  const [currentReplyId, setCurrentReplyId] = useState<string | null>(null)
  const repliesListRef = useRef<RepliesListRef | null>(null)

  const { getReplyAttachments, formatFileSize } = useAttachments()

  useEffect(() => {
    if (threadId) {
      loadThread()
    }
  }, [threadId])

  const loadThread = async () => {
    try {
      setLoading(true)
      setError(null)

      // Load the main post
      const postData = await discussionService.getPost(threadId)
      setPost(postData)

      // Load replies for this post
      const repliesData = await discussionService.getReplies(threadId)
      console.log("Loaded replies:", repliesData.length)

      // Sort replies by earliest first (oldest at top, newest at bottom)
      const sortedRepliesData = repliesData.sort(
        (a, b) =>
          new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
      )

      // Add attachments array to each reply
      const repliesWithAttachments: ReplyWithAttachments[] = await Promise.all(
        sortedRepliesData.map(async (reply) => {
          const attachments = await getReplyAttachments(reply.id)
          console.log(
            `Reply ${reply.id} has ${attachments.length} attachments:`,
            attachments
          )
          if (attachments.length > 0) {
            console.log("First attachment details:", {
              id: attachments[0].id,
              file_type: attachments[0].file_type,
              file_path: attachments[0].file_path,
              file_name: attachments[0].file_name,
            })
          }
          return { ...reply, attachments }
        })
      )
      console.log(
        "Final replies with attachments:",
        repliesWithAttachments.map((r) => ({
          id: r.id,
          attachmentCount: r.attachments?.length || 0,
        }))
      )
      setReplies(repliesWithAttachments)
    } catch (err) {
      console.error("Error loading thread:", err)
      setError("Failed to load thread")
    } finally {
      setLoading(false)
    }
  }

  const handleCreateReply = async (
    content: string,
    attachments: Attachment[]
  ) => {
    if (!content.trim() || !post) return

    try {
      setSubmittingReply(true)

      const replyData: CreateReplyData = {
        post_id: post!.id,
        content: content.trim(),
      }

      const newReply = await discussionService.createReply(replyData)

      // Upload any pending attachments to the new reply
      if (attachments.length > 0) {
        try {
          const uploadedAttachments = await Promise.all(
            attachments.map(async (pendingAttachment) => {
              // For pending attachments, the file_path is the original file URI from the image picker
              // We need to upload this file to Supabase Storage with the actual reply ID
              const filePath = await attachmentService.uploadFile(
                pendingAttachment.file_path, // This is the original file URI from image picker
                pendingAttachment.file_name,
                pendingAttachment.mime_type,
                "reply",
                newReply.id
              )

              // Create the attachment record
              const attachmentData = {
                reply_id: newReply.id,
                file_name: pendingAttachment.file_name,
                file_path: filePath,
                file_size: pendingAttachment.file_size,
                mime_type: pendingAttachment.mime_type,
                file_type: pendingAttachment.file_type,
              }

              return await attachmentService.createAttachment(attachmentData)
            })
          )

          // Create reply with uploaded attachments
          const newReplyWithAttachments: ReplyWithAttachments = {
            ...newReply,
            attachments: uploadedAttachments,
          }

          setReplies((prev) => [...prev, newReplyWithAttachments])
          // Scroll to bottom after adding the reply
          setTimeout(() => {
            if (repliesListRef.current) {
              repliesListRef.current.scrollToBottom()
            }
          }, 100)
        } catch (attachmentError) {
          console.error("Error uploading attachments:", attachmentError)
          // Still add the reply even if attachments fail
          const newReplyWithAttachments: ReplyWithAttachments = {
            ...newReply,
            attachments: [],
          }
          setReplies((prev) => [...prev, newReplyWithAttachments])
          // Scroll to bottom after adding the reply
          setTimeout(() => {
            if (repliesListRef.current) {
              repliesListRef.current.scrollToBottom()
            }
          }, 100)
        }
      } else {
        // No attachments, just add the reply
        const newReplyWithAttachments: ReplyWithAttachments = {
          ...newReply,
          attachments: [],
        }
        setReplies((prev) => [...prev, newReplyWithAttachments])
        // Scroll to bottom after adding the reply
        setTimeout(() => {
          if (repliesListRef.current) {
            repliesListRef.current.scrollToBottom()
          }
        }, 100)
      }
    } catch (err) {
      console.error("Error creating reply:", err)
      Alert.alert("Error", "Failed to create reply")
    } finally {
      setSubmittingReply(false)
    }
  }

  if (loading) {
    return (
      <View style={styles.container}>
        <CustomHeader title="Thread Details" showBackButton={true} />

        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.tint} />
          <Text style={[styles.loadingText, { color: colors.text }]}>
            Loading thread...
          </Text>
        </View>
      </View>
    )
  }

  if (error || !post) {
    return (
      <View style={styles.errorContainer}>
        <CustomHeader title="Thread Details" showBackButton={true} />
        <Ionicons name="alert-circle" size={64} color={colors.text + "40"} />
        <Text style={[styles.errorTitle, { color: colors.text }]}>
          Thread Not Found
        </Text>
        <Text style={[styles.errorText, { color: colors.text + "80" }]}>
          {error || "This thread could not be loaded"}
        </Text>
        <Pressable
          style={[styles.backButton, { backgroundColor: colors.tint }]}
          onPress={() => router.back()}
        >
          <Text style={styles.backButtonText}>Go Back</Text>
        </Pressable>
      </View>
    )
  }

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: colors.background }]}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 0}
    >
      <CustomHeader title="Thread Details" showBackButton={true} />
      {/* Sticky Main Post */}
      <View
        style={[styles.stickyPostCard, { borderColor: colors.text + "20" }]}
      >
        <View style={styles.postHeader}>
          <View style={styles.postAuthor}>
            <View style={styles.authorAvatar}>
              <Image
                source={{
                  uri: `https://i.pravatar.cc/32?u=${
                    post.author.id || post.author.email
                  }`,
                }}
                style={styles.avatarImage}
              />
            </View>
            <View style={styles.authorInfo}>
              <UserWithDUPRRating
                name={
                  post.author.name ||
                  post.author.email?.split("@")[0] ||
                  "Unknown"
                }
                singlesRating={post.author.dupr_rating_singles}
                doublesRating={post.author.dupr_rating_doubles}
                size="small"
              />
            </View>
          </View>
          <View style={styles.postMeta}>
            <Text style={[styles.postDate, { color: colors.text + "60" }]}>
              {new Date(post.created_at).toLocaleDateString()} at{" "}
              {new Date(post.created_at).toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </Text>
            <View style={styles.postType}>
              <Ionicons
                name={post.post_type === "announcement" ? "pin" : "chatbubble"}
                size={16}
                color={
                  post.post_type === "announcement" ? "#ff6b6b" : colors.tint
                }
              />
            </View>
          </View>
        </View>

        {post.title && (
          <Text style={[styles.postTitle, { color: colors.text }]}>
            {post.title}
          </Text>
        )}

        <Text style={[styles.postContent, { color: colors.text }]}>
          {post.content}
        </Text>
      </View>

      {/* Replies List */}
      <RepliesList ref={repliesListRef} replies={replies} colors={colors} />

      {/* Reply Input */}
      <ReplyInput
        onSubmit={handleCreateReply}
        submitting={submittingReply}
        colors={colors}
        placeholder="Type a reply..."
      />
    </KeyboardAvoidingView>
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
  backButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  backButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "600",
    flex: 1,
    textAlign: "center",
  },
  headerSpacer: {
    width: 24,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    paddingBottom: 20,
  },
  stickyPostCard: {
    backgroundColor: "white",
    borderRadius: 12,
    padding: 16,
    margin: 16,
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
  repliesScrollView: {
    flex: 1,
  },
  repliesContentContainer: {
    paddingBottom: 20,
  },
  postCard: {
    backgroundColor: "white",
    borderRadius: 12,
    padding: 16,
    margin: 16,
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
  postMeta: {
    alignItems: "flex-end",
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
    overflow: "hidden",
  },
  avatarImage: {
    width: "100%",
    height: "100%",
    borderRadius: 16,
  },
  authorInfo: {
    flex: 1,
  },
  postDate: {
    fontSize: 12,
    marginBottom: 4,
  },
  postType: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "#f0f0f0",
    alignItems: "center",
    justifyContent: "center",
  },
  postTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 8,
  },
  postContent: {
    fontSize: 16,
    lineHeight: 24,
  },
  repliesSection: {
    paddingHorizontal: 16,
  },
  repliesTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 16,
  },
  replyCard: {
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
  replyHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  replyAuthor: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  replyDate: {
    fontSize: 11,
  },
  replyContent: {
    fontSize: 14,
    lineHeight: 20,
  },
  emptyReplies: {
    alignItems: "center",
    paddingVertical: 40,
  },
  emptyRepliesText: {
    fontSize: 14,
    textAlign: "center",
    marginTop: 8,
  },
  messageInputContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "white",
    borderTopWidth: 1,
    borderTopColor: "#e0e0e0",
    gap: 12,
  },
  messageInputWrapper: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  messageInput: {
    flex: 1,
    backgroundColor: "#f5f5f5",
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 16,
    maxHeight: 100,
  },
  attachmentButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#f5f5f5",
    justifyContent: "center",
    alignItems: "center",
  },
  sendButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
  },
  attachmentsContainer: {
    marginTop: 12,
    gap: 8,
  },
  attachmentItem: {
    borderRadius: 8,
    overflow: "hidden",
  },
  attachmentImage: {
    width: "100%",
    height: 200,
    borderRadius: 8,
    backgroundColor: "#f0f0f0", // Light background for loading
  },
  attachmentFile: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    borderRadius: 8,
    gap: 12,
  },
  attachmentFileName: {
    flex: 1,
    fontSize: 14,
    fontWeight: "500",
  },
  attachmentFileSize: {
    fontSize: 12,
  },
  pendingAttachmentsContainer: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: "#e0e0e0",
  },
  pendingAttachmentsTitle: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 8,
  },
  pendingAttachmentItem: {
    position: "relative",
    marginRight: 12,
  },
  pendingAttachmentImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
  },
  pendingAttachmentFile: {
    width: 80,
    height: 80,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  removeAttachmentButton: {
    position: "absolute",
    top: -8,
    right: -8,
    backgroundColor: "white",
    borderRadius: 12,
  },
})
