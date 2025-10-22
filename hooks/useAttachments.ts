import { useState } from "react"
import * as ImagePicker from "expo-image-picker"
import * as DocumentPicker from "expo-document-picker"
import { attachmentService } from "../services/attachmentService"
import { Attachment, CreateAttachmentData } from "../types/discussions"

export const useAttachments = () => {
  const [uploading, setUploading] = useState(false)

  // Pick image from camera or gallery
  const pickImage = async (): Promise<ImagePicker.ImagePickerResult> => {
    try {
      console.log("Requesting media library permissions...")
      const permissionResult =
        await ImagePicker.requestMediaLibraryPermissionsAsync()

      console.log("Permission result:", permissionResult)

      if (permissionResult.granted === false) {
        throw new Error("Permission to access camera roll is required!")
      }

      console.log("Launching image library...")
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images", "videos"],
        allowsEditing: false,
        aspect: [4, 3],
        quality: 0.8,
        videoMaxDuration: 60,
        videoQuality: ImagePicker.UIImagePickerControllerQualityType.Medium,
      })

      console.log("Image picker result:", result)
      return result
    } catch (error) {
      console.error("Error in pickImage:", error)
      throw error
    }
  }

  // Pick multiple images from gallery
  const pickMultipleImages =
    async (): Promise<ImagePicker.ImagePickerResult> => {
      try {
        console.log("Requesting media library permissions...")
        const permissionResult =
          await ImagePicker.requestMediaLibraryPermissionsAsync()

        console.log("Permission result:", permissionResult)

        if (permissionResult.granted === false) {
          throw new Error("Permission to access camera roll is required!")
        }

        console.log("Launching multiple image library...")
        const result = await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ["images"],
          allowsEditing: false,
          quality: 0.8,
          allowsMultipleSelection: true,
        })

        console.log("Multiple image picker result:", result)
        return result
      } catch (error) {
        console.error("Error in pickMultipleImages:", error)
        throw error
      }
    }

  // Take photo with camera
  const takePhoto = async (): Promise<ImagePicker.ImagePickerResult> => {
    try {
      console.log("Requesting camera permissions...")
      const permissionResult = await ImagePicker.requestCameraPermissionsAsync()

      console.log("Camera permission result:", permissionResult)

      if (permissionResult.granted === false) {
        throw new Error("Permission to access camera is required!")
      }

      console.log("Launching camera...")
      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      })

      console.log("Camera result:", result)
      return result
    } catch (error) {
      console.error("Error in takePhoto:", error)
      throw error
    }
  }

  // Record video with camera
  const recordVideo = async (): Promise<ImagePicker.ImagePickerResult> => {
    try {
      console.log("Requesting camera permissions...")
      const permissionResult = await ImagePicker.requestCameraPermissionsAsync()

      console.log("Camera permission result:", permissionResult)

      if (permissionResult.granted === false) {
        throw new Error("Permission to access camera is required!")
      }

      console.log("Launching camera for video...")
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ["videos"],
        allowsEditing: true,
        quality: 0.8,
        videoMaxDuration: 60, // 1 minute max
        videoQuality: ImagePicker.UIImagePickerControllerQualityType.Medium,
      })

      console.log("Video recording result:", result)
      return result
    } catch (error) {
      console.error("Error in recordVideo:", error)
      throw error
    }
  }

  // Pick document
  const pickDocument =
    async (): Promise<DocumentPicker.DocumentPickerResult> => {
      return await DocumentPicker.getDocumentAsync({
        type: "*/*",
        copyToCacheDirectory: true,
      })
    }

  // Upload attachment
  const uploadAttachment = async (
    fileUri: string,
    fileName: string,
    mimeType: string,
    entityType: "post" | "reply",
    entityId: string
  ): Promise<Attachment> => {
    setUploading(true)
    try {
      // Upload file to storage
      const filePath = await attachmentService.uploadFile(
        fileUri,
        fileName,
        mimeType,
        entityType,
        entityId
      )

      // Get file size
      const fileSize = await attachmentService.getFileSize(fileUri)

      // Determine file type
      const fileType = attachmentService.getFileType(mimeType)

      // Create attachment record
      const attachmentData: CreateAttachmentData = {
        [entityType === "post" ? "post_id" : "reply_id"]: entityId,
        file_name: fileName,
        file_path: filePath,
        file_size: fileSize,
        mime_type: mimeType,
        file_type: fileType,
      }

      const attachment = await attachmentService.createAttachment(
        attachmentData
      )
      return attachment
    } catch (error) {
      console.error("Error uploading attachment:", error)
      throw error
    } finally {
      setUploading(false)
    }
  }

  // Handle image selection
  const handleImageSelection = async (
    entityType: "post" | "reply",
    entityId: string,
    source: "camera" | "gallery" = "gallery"
  ): Promise<Attachment | null> => {
    try {
      let result: ImagePicker.ImagePickerResult

      if (source === "camera") {
        result = await takePhoto()
      } else {
        result = await pickImage()
      }

      if (!result.canceled && result.assets && result.assets[0]) {
        const asset = result.assets[0]
        const fileName = asset.fileName || `image_${Date.now()}.jpg`
        const mimeType = asset.type || "image/jpeg"

        // If entityId is "pending", just return a local attachment object
        if (entityId === "pending") {
          return {
            id: `pending_${Date.now()}`,
            file_name: fileName,
            file_path: asset.uri,
            file_size: asset.fileSize || 0,
            mime_type: mimeType,
            file_type: "image",
            created_at: new Date().toISOString(),
            created_by: null,
            post_id: null,
            reply_id: null,
          } as Attachment
        }

        // Otherwise, upload the attachment
        return await uploadAttachment(
          asset.uri,
          fileName,
          mimeType,
          entityType,
          entityId
        )
      }

      return null
    } catch (error) {
      console.error("Error handling image selection:", error)
      throw error
    }
  }

  // Handle video recording
  const handleVideoRecording = async (
    entityType: "post" | "reply",
    entityId: string
  ): Promise<Attachment | null> => {
    try {
      const result = await recordVideo()

      if (!result.canceled && result.assets && result.assets[0]) {
        const asset = result.assets[0]
        const fileName = asset.fileName || `video_${Date.now()}.mp4`
        const mimeType = asset.type || "video/mp4"

        // If entityId is "pending", just return a local attachment object
        if (entityId === "pending") {
          return {
            id: `pending_${Date.now()}`,
            file_name: fileName,
            file_path: asset.uri,
            file_size: asset.fileSize || 0,
            mime_type: mimeType,
            file_type: "video",
            created_at: new Date().toISOString(),
            created_by: null,
            post_id: null,
            reply_id: null,
          } as Attachment
        }

        // Otherwise, upload the attachment
        return await uploadAttachment(
          asset.uri,
          fileName,
          mimeType,
          entityType,
          entityId
        )
      }

      return null
    } catch (error) {
      console.error("Error handling video recording:", error)
      throw error
    }
  }

  // Handle custom camera photo
  const handleCustomCameraPhoto = async (
    entityType: "post" | "reply",
    entityId: string,
    photoUri: string
  ): Promise<Attachment | null> => {
    try {
      console.log("Processing custom camera photo:", photoUri)
      const fileName = `photo_${Date.now()}.jpg`
      const mimeType = "image/jpeg"

      // If entityId is "pending", just return a local attachment object
      if (entityId === "pending") {
        return {
          id: `pending_${Date.now()}`,
          file_name: fileName,
          file_path: photoUri,
          file_size: 0, // We'll get this later if needed
          mime_type: mimeType,
          file_type: "image",
          created_at: new Date().toISOString(),
          created_by: null,
          post_id: null,
          reply_id: null,
        } as Attachment
      }

      // Otherwise, upload the attachment
      return await uploadAttachment(
        photoUri,
        fileName,
        mimeType,
        entityType,
        entityId
      )
    } catch (error) {
      console.error("Error handling custom camera photo:", error)
      throw error
    }
  }

  // Handle custom camera video
  const handleCustomCameraVideo = async (
    entityType: "post" | "reply",
    entityId: string,
    videoUri: string
  ): Promise<Attachment | null> => {
    try {
      console.log("Processing custom camera video:", videoUri)
      const fileName = `video_${Date.now()}.mp4`
      const mimeType = "video/mp4"

      // If entityId is "pending", just return a local attachment object
      if (entityId === "pending") {
        return {
          id: `pending_${Date.now()}`,
          file_name: fileName,
          file_path: videoUri,
          file_size: 0, // We'll get this later if needed
          mime_type: mimeType,
          file_type: "video",
          created_at: new Date().toISOString(),
          created_by: null,
          post_id: null,
          reply_id: null,
        } as Attachment
      }

      // Otherwise, upload the attachment
      return await uploadAttachment(
        videoUri,
        fileName,
        mimeType,
        entityType,
        entityId
      )
    } catch (error) {
      console.error("Error handling custom camera video:", error)
      throw error
    }
  }

  // Handle QR code scanning
  const handleQRCodeScan = async (
    entityType: "post" | "reply",
    entityId: string,
    qrData: string
  ): Promise<Attachment | null> => {
    try {
      // Create a text file with the QR code data
      const fileName = `qr_code_${Date.now()}.txt`
      const mimeType = "text/plain"

      // For QR codes, we'll create a text attachment with the scanned data
      const attachmentData = {
        id: `pending_${Date.now()}`,
        file_name: fileName,
        file_path: `data:text/plain;base64,${Buffer.from(qrData).toString(
          "base64"
        )}`,
        file_size: qrData.length,
        mime_type: mimeType,
        file_type: "document",
        created_at: new Date().toISOString(),
        created_by: null,
        post_id: null,
        reply_id: null,
        qr_data: qrData, // Store the actual QR data for easy access
      } as Attachment & { qr_data: string }

      return attachmentData
    } catch (error) {
      console.error("Error handling QR code scan:", error)
      throw error
    }
  }

  // Handle multiple image selection
  const handleMultipleImageSelection = async (
    entityType: "post" | "reply",
    entityId: string
  ): Promise<Attachment[]> => {
    try {
      const result = await pickMultipleImages()

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const attachments: Attachment[] = []

        for (const asset of result.assets) {
          const fileName = asset.fileName || `image_${Date.now()}.jpg`
          const mimeType = asset.type || "image/jpeg"

          // If entityId is "pending", just return a local attachment object
          if (entityId === "pending") {
            attachments.push({
              id: `pending_${Date.now()}_${Math.random()}`,
              file_name: fileName,
              file_path: asset.uri,
              file_size: asset.fileSize || 0,
              mime_type: mimeType,
              file_type: "image",
              created_at: new Date().toISOString(),
              created_by: null,
              post_id: null,
              reply_id: null,
            } as Attachment)
          } else {
            // Otherwise, upload the attachment
            const attachment = await uploadAttachment(
              asset.uri,
              fileName,
              mimeType,
              entityType,
              entityId
            )
            if (attachment) {
              attachments.push(attachment)
            }
          }
        }

        return attachments
      }

      return []
    } catch (error) {
      console.error("Error handling multiple image selection:", error)
      throw error
    }
  }

  // Handle document selection
  const handleDocumentSelection = async (
    entityType: "post" | "reply",
    entityId: string
  ): Promise<Attachment | null> => {
    try {
      const result = await pickDocument()

      if (!result.canceled && result.assets && result.assets[0]) {
        const asset = result.assets[0]
        const fileName = asset.name || `document_${Date.now()}`
        const mimeType = asset.mimeType || "application/octet-stream"

        // If entityId is "pending", just return a local attachment object
        if (entityId === "pending") {
          return {
            id: `pending_${Date.now()}`,
            file_name: fileName,
            file_path: asset.uri,
            file_size: asset.size || 0,
            mime_type: mimeType,
            file_type: "document",
            created_at: new Date().toISOString(),
            created_by: null,
            post_id: null,
            reply_id: null,
          } as Attachment
        }

        // Otherwise, upload the attachment
        return await uploadAttachment(
          asset.uri,
          fileName,
          mimeType,
          entityType,
          entityId
        )
      }

      return null
    } catch (error) {
      console.error("Error handling document selection:", error)
      throw error
    }
  }

  // Delete attachment
  const deleteAttachment = async (attachmentId: string): Promise<void> => {
    try {
      await attachmentService.deleteAttachment(attachmentId)
    } catch (error) {
      console.error("Error deleting attachment:", error)
      throw error
    }
  }

  // Get attachments for post
  const getPostAttachments = async (postId: string): Promise<Attachment[]> => {
    try {
      return await attachmentService.getPostAttachments(postId)
    } catch (error) {
      console.error("Error getting post attachments:", error)
      throw error
    }
  }

  // Get attachments for reply
  const getReplyAttachments = async (
    replyId: string
  ): Promise<Attachment[]> => {
    try {
      return await attachmentService.getReplyAttachments(replyId)
    } catch (error) {
      console.error("Error getting reply attachments:", error)
      throw error
    }
  }

  return {
    uploading,
    pickImage,
    pickMultipleImages,
    takePhoto,
    recordVideo,
    pickDocument,
    uploadAttachment,
    handleImageSelection,
    handleVideoRecording,
    handleCustomCameraPhoto,
    handleCustomCameraVideo,
    handleQRCodeScan,
    handleMultipleImageSelection,
    handleDocumentSelection,
    deleteAttachment,
    getPostAttachments,
    getReplyAttachments,
    formatFileSize: attachmentService.formatFileSize,
  }
}
