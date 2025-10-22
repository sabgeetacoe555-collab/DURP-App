import React, {
  useRef,
  useState,
  useEffect,
  forwardRef,
  useImperativeHandle,
} from "react"
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Pressable,
  Image,
  Modal,
  Dimensions,
  Alert,
} from "react-native"
import { Ionicons } from "@expo/vector-icons"
import * as WebBrowser from "expo-web-browser"
import { ReplyWithAttachments } from "../../types/discussions"
import { useColorScheme } from "../useColorScheme"
import UserWithDUPRRating from "../UserWithDUPRRating"

interface RepliesListProps {
  replies: ReplyWithAttachments[]
  colors: any
  onReplyPress?: (reply: ReplyWithAttachments) => void
}

export interface RepliesListRef {
  scrollToBottom: () => void
}

export const RepliesList = forwardRef<RepliesListRef, RepliesListProps>(
  ({ replies, colors, onReplyPress }, ref) => {
    const flatListRef = useRef<FlatList>(null)
    const [showCatchUpButton, setShowCatchUpButton] = useState(false)
    const [selectedImage, setSelectedImage] = useState<string | null>(null)
    const [showImageModal, setShowImageModal] = useState(false)

    const scrollToBottom = () => {
      if (flatListRef.current && replies.length > 0) {
        flatListRef.current.scrollToEnd({ animated: true })
        setShowCatchUpButton(false)
      }
    }

    // Expose scroll function to parent component
    useImperativeHandle(
      ref,
      () => ({
        scrollToBottom,
      }),
      []
    )

    const handleScroll = (event: any) => {
      const { contentOffset, contentSize, layoutMeasurement } =
        event.nativeEvent
      const isNearBottom =
        contentOffset.y + layoutMeasurement.height >= contentSize.height - 100

      if (!isNearBottom && replies.length > 0) {
        setShowCatchUpButton(true)
      } else {
        setShowCatchUpButton(false)
      }
    }

    const handleImagePress = (imageUri: string) => {
      setSelectedImage(imageUri)
      setShowImageModal(true)
    }

    const closeImageModal = () => {
      setShowImageModal(false)
      setSelectedImage(null)
    }

    const handleFilePress = async (filePath: string, fileName: string) => {
      try {
        // For web URLs, open directly in browser
        if (filePath.startsWith("http")) {
          await WebBrowser.openBrowserAsync(filePath, {
            presentationStyle:
              WebBrowser.WebBrowserPresentationStyle.FORM_SHEET,
          })
        } else {
          // For local files, we might need to handle differently
          Alert.alert(
            "File Preview",
            `Cannot preview ${fileName} directly. The file is stored locally.`,
            [{ text: "OK" }]
          )
        }
      } catch (error) {
        console.error("Error opening file:", error)
        Alert.alert("Error", "Could not open the file. Please try again.", [
          { text: "OK" },
        ])
      }
    }

    const renderReply = ({ item }: { item: ReplyWithAttachments }) => {
      return (
        <View style={[styles.replyCard, { borderColor: colors.text + "20" }]}>
          <View style={styles.replyHeader}>
            <View style={styles.replyAuthor}>
              <View style={styles.authorAvatar}>
                <Image
                  source={{
                    uri: `https://i.pravatar.cc/28?u=${
                      item.author.id || item.author.email
                    }`,
                  }}
                  style={styles.avatarImage}
                />
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
              </View>
            </View>
            <Text style={[styles.replyDate, { color: colors.text + "60" }]}>
              {new Date(item.created_at).toLocaleDateString()} at{" "}
              {new Date(item.created_at).toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </Text>
          </View>

          <Text style={[styles.replyContent, { color: colors.text }]}>
            {item.content}
          </Text>

          {/* Display attachments */}
          {item.attachments && item.attachments.length > 0 && (
            <View style={styles.attachmentsContainer}>
              {(() => {
                const images = item.attachments.filter(
                  (att) => att.file_type === "image"
                )
                const nonImages = item.attachments.filter(
                  (att) => att.file_type !== "image"
                )

                return (
                  <>
                    {/* Display images in grid if multiple, or single if one */}
                    {images.length > 0 && (
                      <View style={styles.imagesContainer}>
                        {images.length === 1 ? (
                          <Pressable
                            onPress={() =>
                              handleImagePress(images[0].file_path)
                            }
                          >
                            <View style={styles.imageWrapper}>
                              <Image
                                source={{ uri: images[0].file_path }}
                                style={styles.attachmentImage}
                                resizeMode="cover"
                              />
                              <View style={styles.imageOverlay}>
                                <Ionicons
                                  name="expand"
                                  size={20}
                                  color="white"
                                />
                              </View>
                            </View>
                          </Pressable>
                        ) : (
                          <View style={styles.imageGrid}>
                            {images.map((attachment, index) => (
                              <Pressable
                                key={attachment.id}
                                onPress={() =>
                                  handleImagePress(attachment.file_path)
                                }
                                style={[
                                  styles.gridImageWrapper,
                                  index === images.length - 1 &&
                                    images.length % 2 === 1 &&
                                    styles.gridImageWrapperLast,
                                ]}
                              >
                                <Image
                                  source={{ uri: attachment.file_path }}
                                  style={styles.gridImage}
                                  resizeMode="cover"
                                />
                                <View style={styles.gridImageOverlay}>
                                  <Ionicons
                                    name="expand"
                                    size={16}
                                    color="white"
                                  />
                                </View>
                                {images.length > 4 && index === 3 && (
                                  <View style={styles.moreImagesOverlay}>
                                    <Text style={styles.moreImagesText}>
                                      +{images.length - 4}
                                    </Text>
                                  </View>
                                )}
                              </Pressable>
                            ))}
                          </View>
                        )}
                      </View>
                    )}

                    {/* Display non-image attachments */}
                    {nonImages.map((attachment) => (
                      <Pressable
                        key={attachment.id}
                        style={styles.attachmentItem}
                        onPress={() =>
                          handleFilePress(
                            attachment.file_path,
                            attachment.file_name
                          )
                        }
                      >
                        <View style={styles.attachmentFile}>
                          <Ionicons
                            name={
                              attachment.file_type === "document"
                                ? "document"
                                : attachment.file_type === "video"
                                ? "videocam"
                                : "musical-notes"
                            }
                            size={20}
                            color={colors.tint}
                          />
                          <View style={styles.attachmentFileInfo}>
                            <Text style={styles.attachmentFileName}>
                              {attachment.file_name}
                            </Text>
                            <Text style={styles.attachmentFileSize}>
                              {attachment.file_size
                                ? `${(attachment.file_size / 1024).toFixed(
                                    1
                                  )} KB`
                                : "Unknown size"}
                            </Text>
                          </View>
                          <Ionicons
                            name="open-outline"
                            size={16}
                            color={colors.text + "60"}
                          />
                        </View>
                      </Pressable>
                    ))}
                  </>
                )
              })()}
            </View>
          )}
        </View>
      )
    }

    return (
      <>
        <FlatList
          ref={flatListRef}
          data={replies}
          keyExtractor={(item) => item.id}
          renderItem={renderReply}
          style={styles.repliesScrollView}
          contentContainerStyle={styles.repliesContentContainer}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          onScroll={handleScroll}
          scrollEventThrottle={16}
          ListHeaderComponent={
            <View style={styles.repliesSection}>
              <Text style={[styles.repliesTitle, { color: colors.text }]}>
                Replies ({replies.length})
              </Text>
            </View>
          }
          ListEmptyComponent={
            <View style={styles.emptyReplies}>
              <Ionicons
                name="chatbubble-outline"
                size={32}
                color={colors.text + "40"}
              />
              <Text
                style={[styles.emptyRepliesText, { color: colors.text + "80" }]}
              >
                No replies yet. Be the first to respond!
              </Text>
            </View>
          }
        />

        {/* Catch Up FAB */}
        {showCatchUpButton && (
          <View style={styles.catchUpButtonContainer}>
            <Pressable
              style={[styles.catchUpButton, { backgroundColor: colors.tint }]}
              onPress={scrollToBottom}
            >
              <Ionicons name="arrow-down" size={20} color="white" />
              <Text style={styles.catchUpButtonText}>Catch me up</Text>
            </Pressable>
          </View>
        )}

        {/* Image Modal */}
        <Modal
          visible={showImageModal}
          transparent={true}
          animationType="fade"
          onRequestClose={closeImageModal}
        >
          <View style={styles.imageModalOverlay}>
            <Pressable
              style={styles.imageModalBackground}
              onPress={closeImageModal}
            >
              <View style={styles.imageModalContent}>
                <Pressable onPress={() => {}} style={styles.imageContainer}>
                  <Image
                    source={{ uri: selectedImage || "" }}
                    style={styles.fullScreenImage}
                    resizeMode="contain"
                  />
                </Pressable>
                <Pressable style={styles.closeButton} onPress={closeImageModal}>
                  <Ionicons name="close" size={24} color="white" />
                </Pressable>
              </View>
            </Pressable>
          </View>
        </Modal>
      </>
    )
  }
)

const styles = StyleSheet.create({
  repliesScrollView: {
    flex: 1,
  },
  repliesContentContainer: {
    paddingBottom: 20,
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
    marginHorizontal: 16,
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
  authorAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "#f0f0f0",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
    overflow: "hidden",
  },
  avatarImage: {
    width: "100%",
    height: "100%",
    borderRadius: 14,
  },
  authorInfo: {
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
  attachmentsContainer: {
    marginTop: 12,
    gap: 8,
  },
  imagesContainer: {
    marginBottom: 8,
  },
  imageGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 4,
  },
  gridImageWrapper: {
    width: "48%",
    aspectRatio: 1,
    borderRadius: 8,
    overflow: "hidden",
    position: "relative",
  },
  gridImageWrapperLast: {
    width: "100%",
  },
  gridImage: {
    width: "100%",
    height: "100%",
    backgroundColor: "#f0f0f0",
  },
  gridImageOverlay: {
    position: "absolute",
    top: 4,
    right: 4,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    justifyContent: "center",
    alignItems: "center",
  },
  moreImagesOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    justifyContent: "center",
    alignItems: "center",
  },
  moreImagesText: {
    color: "white",
    fontSize: 18,
    fontWeight: "bold",
  },
  attachmentItem: {
    borderRadius: 8,
    overflow: "hidden",
  },
  imageWrapper: {
    position: "relative",
  },
  attachmentImage: {
    width: "100%",
    maxHeight: 400,
    aspectRatio: 4 / 3, // Good balance for most images
    borderRadius: 8,
    backgroundColor: "#f0f0f0",
  },
  imageOverlay: {
    position: "absolute",
    top: 8,
    right: 8,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    justifyContent: "center",
    alignItems: "center",
  },
  attachmentFile: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    borderRadius: 8,
    gap: 12,
    backgroundColor: "#f8f9fa",
  },
  attachmentFileInfo: {
    flex: 1,
  },
  attachmentFileName: {
    fontSize: 14,
    fontWeight: "500",
    color: "#333",
  },
  attachmentFileSize: {
    fontSize: 12,
    color: "#666",
    marginTop: 2,
  },
  catchUpButtonContainer: {
    position: "absolute",
    bottom: 100,
    right: 20,
  },
  catchUpButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 24,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
    gap: 8,
  },
  catchUpButtonText: {
    color: "white",
    fontSize: 14,
    fontWeight: "600",
  },
  // Image Modal Styles
  imageModalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.9)",
    justifyContent: "center",
    alignItems: "center",
  },
  imageModalBackground: {
    flex: 1,
    width: "100%",
    justifyContent: "center",
    alignItems: "center",
  },
  imageModalContent: {
    flex: 1,
    width: "100%",
    justifyContent: "center",
    alignItems: "center",
    position: "relative",
  },
  imageContainer: {
    flex: 1,
    width: "100%",
    justifyContent: "center",
    alignItems: "center",
  },
  fullScreenImage: {
    width: "100%",
    height: "100%",
  },
  closeButton: {
    position: "absolute",
    top: 50,
    right: 20,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
})
