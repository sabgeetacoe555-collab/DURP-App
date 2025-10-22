import { supabase } from "../lib/supabase"
import { Attachment, CreateAttachmentData } from "../types/discussions"
import * as FileSystem from "expo-file-system"
import * as ImageManipulator from "expo-image-manipulator"

export const attachmentService = {
  // Optimize image before upload
  async optimizeImage(fileUri: string): Promise<string> {
    try {
      console.log("Optimizing image...")

      // Resize and compress the image
      const result = await ImageManipulator.manipulateAsync(
        fileUri,
        [
          {
            resize: {
              width: 1200, // Max width
              height: 1200, // Max height
            },
          },
        ],
        {
          compress: 0.8, // 80% quality
          format: ImageManipulator.SaveFormat.JPEG,
        }
      )

      console.log("Image optimized:", {
        originalUri: fileUri,
        optimizedUri: result.uri,
        size: result.width + "x" + result.height,
      })

      return result.uri
    } catch (error) {
      console.error("Error optimizing image:", error)
      // Return original URI if optimization fails
      return fileUri
    }
  },

  // Upload file to Supabase Storage
  async uploadFile(
    fileUri: string,
    fileName: string,
    mimeType: string,
    entityType: "post" | "reply",
    entityId: string
  ): Promise<string> {
    try {
      // Don't upload if entityId is "pending" - this should be handled differently
      if (entityId === "pending") {
        throw new Error("Cannot upload file with pending entityId")
      }

      console.log("Starting file upload process...")
      console.log("File info:", { fileName, mimeType, entityType, entityId })

      // Optimize image if it's an image file
      let optimizedUri = fileUri
      if (mimeType.startsWith("image/")) {
        console.log("Optimizing image before upload...")
        optimizedUri = await this.optimizeImage(fileUri)
      }

      // Read file as base64
      console.log("Reading file as base64...")
      const base64 = await FileSystem.readAsStringAsync(optimizedUri, {
        encoding: FileSystem.EncodingType.Base64,
      })

      console.log("File size (base64):", base64.length, "characters")

      // Create file path in storage
      const filePath = `${entityType}s/${entityId}/${Date.now()}_${fileName}`

      console.log("Uploading to Supabase Storage...")
      console.log("File path:", filePath)

      // Upload to Supabase Storage with timeout
      const uploadPromise = supabase.storage
        .from("attachments")
        .upload(filePath, decode(base64), {
          contentType: mimeType,
          upsert: false,
        })

      // Add timeout to prevent hanging
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(
          () => reject(new Error("Upload timeout after 30 seconds")),
          30000
        )
      })

      const { data, error } = (await Promise.race([
        uploadPromise,
        timeoutPromise,
      ])) as any

      if (error) {
        console.error("Error uploading file:", error)
        throw new Error(`Failed to upload file: ${error.message}`)
      }

      console.log("File uploaded successfully:", data)

      // Get public URL
      const { data: urlData } = supabase.storage
        .from("attachments")
        .getPublicUrl(filePath)

      console.log("Public URL generated:", urlData.publicUrl)
      return urlData.publicUrl
    } catch (error) {
      console.error("Error in uploadFile:", error)
      throw error
    }
  },

  // Create attachment record in database
  async createAttachment(data: CreateAttachmentData): Promise<Attachment> {
    const { data: attachment, error } = await supabase
      .from("attachments")
      .insert(data)
      .select("*")
      .single()

    if (error) {
      console.error("Error creating attachment:", error)
      throw new Error(`Failed to create attachment: ${error.message}`)
    }

    return attachment
  },

  // Get attachments for a post
  async getPostAttachments(postId: string): Promise<Attachment[]> {
    const { data: attachments, error } = await supabase
      .from("attachments")
      .select("*")
      .eq("post_id", postId)
      .order("created_at", { ascending: true })

    if (error) {
      console.error("Error fetching post attachments:", error)
      throw new Error(`Failed to fetch attachments: ${error.message}`)
    }

    return attachments || []
  },

  // Get attachments for a reply
  async getReplyAttachments(replyId: string): Promise<Attachment[]> {
    console.log(`Fetching attachments for reply: ${replyId}`)
    const { data: attachments, error } = await supabase
      .from("attachments")
      .select("*")
      .eq("reply_id", replyId)
      .order("created_at", { ascending: true })

    if (error) {
      console.error("Error fetching reply attachments:", error)
      throw new Error(`Failed to fetch attachments: ${error.message}`)
    }

    console.log(
      `Found ${attachments?.length || 0} attachments for reply ${replyId}:`,
      attachments
    )
    return attachments || []
  },

  // Delete attachment
  async deleteAttachment(attachmentId: string): Promise<void> {
    // First get the attachment to get the file path
    const { data: attachment, error: fetchError } = await supabase
      .from("attachments")
      .select("file_path")
      .eq("id", attachmentId)
      .single()

    if (fetchError) {
      console.error("Error fetching attachment for deletion:", fetchError)
      throw new Error(`Failed to fetch attachment: ${fetchError.message}`)
    }

    // Delete from storage
    const { error: storageError } = await supabase.storage
      .from("attachments")
      .remove([attachment.file_path])

    if (storageError) {
      console.error("Error deleting file from storage:", storageError)
      // Continue with database deletion even if storage deletion fails
    }

    // Delete from database
    const { error: dbError } = await supabase
      .from("attachments")
      .delete()
      .eq("id", attachmentId)

    if (dbError) {
      console.error("Error deleting attachment from database:", dbError)
      throw new Error(`Failed to delete attachment: ${dbError.message}`)
    }
  },

  // Get file size
  async getFileSize(fileUri: string): Promise<number> {
    try {
      const fileInfo = await FileSystem.getInfoAsync(fileUri)
      const size = fileInfo.exists ? (fileInfo as any).size || 0 : 0
      console.log("File size:", size, "bytes")
      return size
    } catch (error) {
      console.error("Error getting file size:", error)
      return 0
    }
  },

  // Determine file type from MIME type
  getFileType(mimeType: string): "image" | "document" | "video" | "audio" {
    if (mimeType.startsWith("image/")) return "image"
    if (mimeType.startsWith("video/")) return "video"
    if (mimeType.startsWith("audio/")) return "audio"
    return "document"
  },

  // Format file size for display
  formatFileSize(bytes: number): string {
    if (bytes === 0) return "0 Bytes"
    const k = 1024
    const sizes = ["Bytes", "KB", "MB", "GB"]
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
  },
}

// Helper function to decode base64
function decode(base64: string): Uint8Array {
  const binaryString = atob(base64)
  const bytes = new Uint8Array(binaryString.length)
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i)
  }
  return bytes
}
