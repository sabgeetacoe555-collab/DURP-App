import React, { useState } from "react"
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Modal,
  Alert,
  ActivityIndicator,
} from "react-native"
import { Ionicons } from "@expo/vector-icons"
import { useAttachments } from "../../hooks/useAttachments"
import { useColorScheme } from "../useColorScheme"
import { CameraModal } from "./CameraModal"

interface AttachmentPickerProps {
  onAttachmentSelected: (attachment: any) => void
  onMultipleAttachmentsSelected?: (attachments: any[]) => void
  entityType: "post" | "reply"
  entityId: string
  visible: boolean
  onClose: () => void
  allowMultiple?: boolean
}

export const AttachmentPicker: React.FC<AttachmentPickerProps> = ({
  onAttachmentSelected,
  onMultipleAttachmentsSelected,
  entityType,
  entityId,
  visible,
  onClose,
  allowMultiple = false,
}) => {
  const colors = useColorScheme()
  const {
    uploading,
    handleImageSelection,
    handleVideoRecording,
    handleCustomCameraPhoto,
    handleCustomCameraVideo,
    handleQRCodeScan,
    handleMultipleImageSelection,
    handleDocumentSelection,
  } = useAttachments()
  const [loading, setLoading] = useState(false)
  const [showCamera, setShowCamera] = useState(false)
  const [cameraMode, setCameraMode] = useState<"photo" | "video" | "qr">(
    "photo"
  )

  const handleImagePick = async (source: "camera" | "gallery") => {
    if (source === "camera") {
      setCameraMode("photo")
      setShowCamera(true)
      return
    }

    try {
      setLoading(true)
      console.log(`Starting image pick for ${source}...`)
      const attachment = await handleImageSelection(
        entityType,
        entityId,
        source
      )
      if (attachment) {
        console.log("Image attachment created:", attachment)
        onAttachmentSelected(attachment)
        onClose()
      } else {
        console.log("No image selected or attachment creation failed")
      }
    } catch (error) {
      console.error("Error picking image:", error)
      Alert.alert(
        "Error",
        `Failed to pick image: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      )
    } finally {
      setLoading(false)
    }
  }

  const handleVideoRecord = () => {
    setCameraMode("video")
    setShowCamera(true)
  }

  const handleQRScan = () => {
    setCameraMode("qr")
    setShowCamera(true)
  }

  const handlePhotoTaken = async (uri: string) => {
    try {
      setLoading(true)
      console.log("Processing photo from custom camera:", uri)

      const attachment = await handleCustomCameraPhoto(
        entityType,
        entityId,
        uri
      )
      if (attachment) {
        console.log("Created attachment:", attachment)
        onAttachmentSelected(attachment)
        onClose()
      } else {
        console.log("No attachment created")
        Alert.alert("Error", "Failed to create attachment from photo.")
      }
    } catch (error) {
      console.error("Error handling photo:", error)
      Alert.alert("Error", "Failed to process photo. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  const handleVideoRecorded = async (uri: string) => {
    try {
      setLoading(true)
      console.log("Processing video from custom camera:", uri)

      const attachment = await handleCustomCameraVideo(
        entityType,
        entityId,
        uri
      )
      if (attachment) {
        console.log("Created attachment:", attachment)
        onAttachmentSelected(attachment)
        onClose()
      } else {
        console.log("No attachment created")
        Alert.alert("Error", "Failed to create attachment from video.")
      }
    } catch (error) {
      console.error("Error handling video:", error)
      Alert.alert("Error", "Failed to process video. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  const handleQRCodeScanned = async (data: string) => {
    try {
      setLoading(true)
      const attachment = await handleQRCodeScan(entityType, entityId, data)
      if (attachment) {
        onAttachmentSelected(attachment)
        onClose()
      }
    } catch (error) {
      console.error("Error handling QR code:", error)
      Alert.alert("Error", "Failed to process QR code. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  const handleMultipleImagePick = async () => {
    try {
      setLoading(true)
      console.log("Starting multiple image pick...")
      const attachments = await handleMultipleImageSelection(
        entityType,
        entityId
      )
      if (attachments.length > 0) {
        if (onMultipleAttachmentsSelected) {
          onMultipleAttachmentsSelected(attachments)
        } else {
          // Fallback to single attachment selection for each
          attachments.forEach((attachment) => onAttachmentSelected(attachment))
        }
        onClose()
      } else {
        console.log("No images selected")
      }
    } catch (error) {
      console.error("Error picking multiple images:", error)
      Alert.alert(
        "Error",
        `Failed to pick images: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      )
    } finally {
      setLoading(false)
    }
  }

  const handleDocumentPick = async () => {
    try {
      setLoading(true)
      const attachment = await handleDocumentSelection(entityType, entityId)
      if (attachment) {
        onAttachmentSelected(attachment)
        onClose()
      }
    } catch (error) {
      console.error("Error picking document:", error)
      Alert.alert("Error", "Failed to pick document. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  const AttachmentOption = ({
    icon,
    title,
    subtitle,
    onPress,
    disabled = false,
  }: {
    icon: string
    title: string
    subtitle: string
    onPress: () => void
    disabled?: boolean
  }) => (
    <Pressable
      style={[
        styles.option,
        {
          backgroundColor: colors.background,
          borderColor: colors.border,
          opacity: disabled ? 0.5 : 1,
        },
      ]}
      onPress={onPress}
      disabled={disabled}
    >
      <View
        style={[styles.optionIcon, { backgroundColor: colors.tint + "20" }]}
      >
        <Ionicons name={icon as any} size={24} color={colors.tint} />
      </View>
      <View style={styles.optionContent}>
        <Text style={[styles.optionTitle, { color: colors.text }]}>
          {title}
        </Text>
        <Text style={[styles.optionSubtitle, { color: colors.text + "80" }]}>
          {subtitle}
        </Text>
      </View>
      <Ionicons name="chevron-forward" size={20} color={colors.text + "60"} />
    </Pressable>
  )

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View
          style={[styles.container, { backgroundColor: colors.background }]}
        >
          <View style={styles.header}>
            <Text style={[styles.title, { color: colors.text }]}>
              Add Attachment
            </Text>
            <Pressable onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color={colors.text} />
            </Pressable>
          </View>

          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={colors.tint} />
              <Text style={[styles.loadingText, { color: colors.text }]}>
                Processing...
              </Text>
            </View>
          ) : (
            <View style={styles.options}>
              <AttachmentOption
                icon="camera"
                title="Take Photo"
                subtitle="Use camera to take a new photo"
                onPress={() => handleImagePick("camera")}
                disabled={uploading}
              />

              <AttachmentOption
                icon="videocam"
                title="Record Video"
                subtitle="Record a video with your camera"
                onPress={handleVideoRecord}
                disabled={uploading}
              />

              <AttachmentOption
                icon="qr-code"
                title="Scan QR Code"
                subtitle="Scan a QR code with your camera"
                onPress={handleQRScan}
                disabled={uploading}
              />

              <AttachmentOption
                icon="images"
                title="Choose Photo"
                subtitle="Select from your photo library"
                onPress={() => handleImagePick("gallery")}
                disabled={uploading}
              />

              {allowMultiple && (
                <AttachmentOption
                  icon="images-outline"
                  title="Choose Multiple Photos"
                  subtitle="Select multiple photos from your library"
                  onPress={handleMultipleImagePick}
                  disabled={uploading}
                />
              )}

              <AttachmentOption
                icon="document"
                title="Choose Document"
                subtitle="Select a file from your device"
                onPress={handleDocumentPick}
                disabled={uploading}
              />
            </View>
          )}

          <Pressable
            style={[styles.cancelButton, { borderColor: colors.border }]}
            onPress={onClose}
          >
            <Text style={[styles.cancelButtonText, { color: colors.text }]}>
              Cancel
            </Text>
          </Pressable>
        </View>
      </View>

      <CameraModal
        visible={showCamera}
        onClose={() => setShowCamera(false)}
        onPhotoTaken={handlePhotoTaken}
        onVideoRecorded={handleVideoRecorded}
        onQRCodeScanned={handleQRCodeScanned}
        mode={cameraMode}
      />
    </Modal>
  )
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  container: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    paddingBottom: 40,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: "600",
  },
  closeButton: {
    padding: 4,
  },
  loadingContainer: {
    alignItems: "center",
    paddingVertical: 40,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
  },
  options: {
    gap: 12,
  },
  option: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
  },
  optionIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 16,
  },
  optionContent: {
    flex: 1,
  },
  optionTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 2,
  },
  optionSubtitle: {
    fontSize: 14,
  },
  cancelButton: {
    marginTop: 20,
    paddingVertical: 16,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: "center",
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: "600",
  },
})
