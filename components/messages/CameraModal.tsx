import React, { useState, useRef } from "react"
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Modal,
  Alert,
  ActivityIndicator,
} from "react-native"
import { CameraView, CameraType, useCameraPermissions } from "expo-camera"
import { Ionicons } from "@expo/vector-icons"
import { useColorScheme } from "../useColorScheme"

interface CameraModalProps {
  visible: boolean
  onClose: () => void
  onPhotoTaken: (uri: string) => void
  onVideoRecorded: (uri: string) => void
  onQRCodeScanned: (data: string) => void
  mode: "photo" | "video" | "qr"
}

export const CameraModal: React.FC<CameraModalProps> = ({
  visible,
  onClose,
  onPhotoTaken,
  onVideoRecorded,
  onQRCodeScanned,
  mode,
}) => {
  const colors = useColorScheme()
  const [permission, requestPermission] = useCameraPermissions()
  const [isRecording, setIsRecording] = useState(false)
  const [facing, setFacing] = useState<CameraType>("back")
  const [isCameraReady, setIsCameraReady] = useState(false)
  const cameraRef = useRef<CameraView>(null)
  const cameraReadyTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(
    null
  )

  const handleCameraReady = () => {
    console.log("Camera is ready - onCameraReady callback fired")
    setIsCameraReady(true)
    // Clear the fallback timeout if it exists
    if (cameraReadyTimeoutRef.current) {
      clearTimeout(cameraReadyTimeoutRef.current)
      cameraReadyTimeoutRef.current = null
    }
  }

  const handleBarcodeScanned = ({ data }: { data: string }) => {
    console.log("QR Code scanned:", data)
    onQRCodeScanned(data)
    onClose()
  }

  const takePicture = async () => {
    console.log("Taking picture...")
    console.log("Camera ready state:", isCameraReady)
    console.log("Camera ref exists:", !!cameraRef.current)

    if (cameraRef.current) {
      try {
        const photo = await cameraRef.current.takePictureAsync({
          quality: 0.8,
          base64: false,
        })
        console.log("Photo taken successfully:", photo.uri)
        if (photo.uri) {
          onPhotoTaken(photo.uri)
          onClose()
        } else {
          console.error("No photo URI returned")
          Alert.alert("Error", "Photo was taken but no file was created.")
        }
      } catch (error) {
        console.error("Error taking picture:", error)
        Alert.alert(
          "Error",
          `Failed to take picture: ${
            error instanceof Error ? error.message : "Unknown error"
          }`
        )
      }
    } else {
      console.error("Camera ref is null")
      Alert.alert("Error", "Camera is not available. Please try again.")
    }
  }

  const startRecording = async () => {
    console.log("Starting video recording...")
    console.log("Camera ready state:", isCameraReady)
    console.log("Camera ref exists:", !!cameraRef.current)

    if (!cameraRef.current) {
      console.error("Camera ref is null")
      Alert.alert("Error", "Camera is not available. Please try again.")
      return
    }

    // Force enable camera if it's not ready but ref exists
    if (!isCameraReady) {
      console.log("Camera not ready, but attempting to record anyway")
      setIsCameraReady(true)
    }

    try {
      setIsRecording(true)
      console.log("Calling recordAsync...")

      // Add a small delay to ensure camera is ready
      await new Promise((resolve) => setTimeout(resolve, 100))

      const video = await cameraRef.current.recordAsync({
        maxDuration: 60, // 1 minute max
      })

      console.log("Video recorded successfully:", video?.uri)
      if (video?.uri) {
        onVideoRecorded(video.uri)
        onClose()
      } else {
        console.error("No video URI returned")
        Alert.alert("Error", "Video was recorded but no file was created.")
      }
      setIsRecording(false)
    } catch (error) {
      console.error("Error recording video:", error)
      Alert.alert(
        "Error",
        `Failed to record video: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      )
      setIsRecording(false)
    }
  }

  const stopRecording = async () => {
    if (cameraRef.current) {
      try {
        await cameraRef.current.stopRecording()
        setIsRecording(false)
      } catch (error) {
        console.error("Error stopping recording:", error)
        setIsRecording(false)
      }
    }
  }

  const toggleCameraFacing = () => {
    setFacing((current) => (current === "back" ? "front" : "back"))
    setIsCameraReady(false) // Reset camera ready state when switching cameras
  }

  // Reset camera ready state when modal opens and add fallback timeout
  React.useEffect(() => {
    if (visible) {
      console.log("Camera modal opened, resetting camera ready state")
      setIsCameraReady(false)

      // Clear any existing timeout
      if (cameraReadyTimeoutRef.current) {
        clearTimeout(cameraReadyTimeoutRef.current)
      }

      // Set a fallback timeout in case onCameraReady doesn't fire
      cameraReadyTimeoutRef.current = setTimeout(() => {
        console.log("Camera ready fallback timeout - enabling camera anyway")
        setIsCameraReady(true)
      }, 2000) // 2 second fallback

      // Also try to enable camera after a shorter delay if ref is available
      setTimeout(() => {
        if (cameraRef.current && !isCameraReady) {
          console.log(
            "Camera ref available but onCameraReady not fired - enabling camera"
          )
          setIsCameraReady(true)
        }
      }, 500) // Reduced to 500ms for faster response

      // Additional check after 1.5 seconds
      setTimeout(() => {
        if (!isCameraReady) {
          console.log("Force enabling camera after 1.5 seconds")
          setIsCameraReady(true)
        }
      }, 1500)
    } else {
      // Clean up timeout when modal closes
      if (cameraReadyTimeoutRef.current) {
        clearTimeout(cameraReadyTimeoutRef.current)
        cameraReadyTimeoutRef.current = null
      }
    }

    // Cleanup function
    return () => {
      if (cameraReadyTimeoutRef.current) {
        clearTimeout(cameraReadyTimeoutRef.current)
        cameraReadyTimeoutRef.current = null
      }
    }
  }, [visible])

  if (!permission) {
    return (
      <Modal visible={visible} transparent animationType="slide">
        <View style={styles.overlay}>
          <View
            style={[styles.container, { backgroundColor: colors.background }]}
          >
            <ActivityIndicator size="large" color={colors.tint} />
            <Text style={[styles.loadingText, { color: colors.text }]}>
              Requesting camera permission...
            </Text>
          </View>
        </View>
      </Modal>
    )
  }

  if (!permission.granted) {
    return (
      <Modal visible={visible} transparent animationType="slide">
        <View style={styles.overlay}>
          <View
            style={[styles.container, { backgroundColor: colors.background }]}
          >
            <Text style={[styles.permissionText, { color: colors.text }]}>
              We need your permission to show the camera
            </Text>
            <Pressable
              style={[
                styles.permissionButton,
                { backgroundColor: colors.tint },
              ]}
              onPress={requestPermission}
            >
              <Text style={styles.permissionButtonText}>Grant Permission</Text>
            </Pressable>
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
      </Modal>
    )
  }

  const getModeTitle = () => {
    switch (mode) {
      case "photo":
        return "Take Photo"
      case "video":
        return "Record Video"
      case "qr":
        return "Scan QR Code"
      default:
        return "Camera"
    }
  }

  const getModeSubtitle = () => {
    if (!isCameraReady) {
      return "Initializing camera..."
    }

    switch (mode) {
      case "photo":
        return "Tap the capture button to take a photo"
      case "video":
        return isRecording
          ? "Tap stop to finish recording"
          : "Tap record to start recording video"
      case "qr":
        return "Point your camera at a QR code to scan"
      default:
        return ""
    }
  }

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={styles.overlay}>
        <View style={styles.cameraContainer}>
          <CameraView
            ref={cameraRef}
            style={styles.camera}
            facing={facing}
            onCameraReady={handleCameraReady}
            onMountError={(error) => {
              console.error("Camera mount error:", error)
              // Enable camera anyway after mount error
              setTimeout(() => setIsCameraReady(true), 1000)
            }}
            barcodeScannerSettings={
              mode === "qr"
                ? {
                    barcodeTypes: ["qr", "pdf417"],
                  }
                : undefined
            }
            onBarcodeScanned={mode === "qr" ? handleBarcodeScanned : undefined}
          />

          {/* Header - positioned absolutely over camera */}
          <View style={styles.header}>
            <Text style={styles.headerTitle}>{getModeTitle()}</Text>
            <Pressable onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color="white" />
            </Pressable>
          </View>

          {/* Mode subtitle - positioned absolutely over camera */}
          <View style={styles.subtitleContainer}>
            <Text style={styles.subtitle}>{getModeSubtitle()}</Text>
          </View>

          {/* Controls - positioned absolutely over camera */}
          <View style={styles.controls}>
            {/* Flip camera button */}
            <Pressable
              style={styles.controlButton}
              onPress={toggleCameraFacing}
            >
              <Ionicons name="camera-reverse" size={24} color="white" />
            </Pressable>

            {/* Main action button */}
            <Pressable
              style={[styles.mainButton, isRecording && styles.recordingButton]}
              onPress={
                mode === "photo"
                  ? takePicture
                  : mode === "video"
                  ? isRecording
                    ? stopRecording
                    : startRecording
                  : undefined
              }
              disabled={mode === "qr"}
            >
              {mode === "photo" ? (
                <Ionicons name="camera" size={32} color="white" />
              ) : mode === "video" ? (
                <Ionicons
                  name={isRecording ? "stop" : "videocam"}
                  size={32}
                  color="white"
                />
              ) : (
                <Ionicons name="qr-code" size={32} color="white" />
              )}
            </Pressable>

            {/* Placeholder for symmetry */}
            <View style={styles.controlButton} />
          </View>
        </View>
      </View>
    </Modal>
  )
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "black",
  },
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  cameraContainer: {
    flex: 1,
  },
  camera: {
    flex: 1,
  },
  header: {
    position: "absolute",
    top: 60,
    left: 0,
    right: 0,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    zIndex: 1,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "white",
  },
  closeButton: {
    padding: 8,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    borderRadius: 20,
  },
  subtitleContainer: {
    position: "absolute",
    top: 120,
    left: 0,
    right: 0,
    alignItems: "center",
    zIndex: 1,
  },
  subtitle: {
    fontSize: 16,
    color: "white",
    textAlign: "center",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  controls: {
    position: "absolute",
    bottom: 60,
    left: 0,
    right: 0,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 40,
    zIndex: 1,
  },
  controlButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  mainButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "rgba(255, 255, 255, 0.3)",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 4,
    borderColor: "white",
  },
  recordingButton: {
    backgroundColor: "rgba(255, 0, 0, 0.5)",
  },
  disabledButton: {
    opacity: 0.5,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    textAlign: "center",
  },
  permissionText: {
    fontSize: 16,
    textAlign: "center",
    marginBottom: 20,
  },
  permissionButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    marginBottom: 12,
  },
  permissionButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
    textAlign: "center",
  },
  cancelButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    borderWidth: 1,
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: "600",
    textAlign: "center",
  },
})
