import React, { useRef, useMemo, useEffect } from "react"
import { StyleSheet, Pressable, Alert, Platform } from "react-native"
import { Text, View } from "@/components/Themed"
import { useRouter } from "expo-router"
import Colors from "@/constants/Colors"
import { useColorScheme } from "@/components/useColorScheme"
import { useModal } from "./ModalContext"
import BottomSheet, {
  BottomSheetView,
  BottomSheetBackdrop,
} from "@gorhom/bottom-sheet"
import { Ionicons } from "@expo/vector-icons"

export function SessionModal() {
  const router = useRouter()
  const colors = useColorScheme()
  const { isModalVisible, hideModal } = useModal()

  // Bottom sheet refs and snap points
  const bottomSheetRef = useRef<BottomSheet>(null)
  const snapPoints = useMemo(() => ["50%"], [])

  // Handle modal visibility changes
  useEffect(() => {
    if (isModalVisible) {
      bottomSheetRef.current?.expand()
    } else {
      bottomSheetRef.current?.close()
    }
  }, [isModalVisible])

  const handleCreateSession = () => {
    try {
      console.log("Create Session button pressed")
      hideModal()
      router.navigate("/(tabs)/sessions/CreateSession" as any)
    } catch (error) {
      console.error("Navigation error:", error)
      Alert.alert("Navigation Error", "Could not navigate to Create Session")
    }
  }

  const handlePrePlay = () => {
    try {
      console.log("Pre-Play button pressed")
      hideModal()
      router.navigate("/(tabs)/sessions/PrePlaySession" as any)
    } catch (error) {
      console.error("Navigation error:", error)
      Alert.alert("Navigation Error", "Could not navigate to Pre-Play session")
    }
  }

  const handlePostPlay = () => {
    try {
      console.log("Post-Play button pressed")
      hideModal()
      router.navigate("/(tabs)/sessions/PostPlaySession" as any)
    } catch (error) {
      console.error("Navigation error:", error)
      Alert.alert("Navigation Error", "Could not navigate to Post-Play session")
    }
  }

  const handleCancel = () => {
    hideModal()
  }

  // Backdrop component for bottom sheet
  const renderBackdrop = (props: any) => (
    <BottomSheetBackdrop
      {...props}
      appearsOnIndex={0}
      disappearsOnIndex={-1}
      opacity={0.6}
    />
  )

  return (
    <BottomSheet
      ref={bottomSheetRef}
      snapPoints={snapPoints}
      index={-1}
      enablePanDownToClose={true}
      backgroundStyle={{ backgroundColor: "rgba(229, 242, 249, 1)" }}
      handleIndicatorStyle={{ backgroundColor: "#999" }}
      backdropComponent={renderBackdrop}
      onClose={hideModal}
    >
      <BottomSheetView style={styles.bottomSheetContent}>
        <View style={styles.bottomSheetHeader}>
          <Text style={[styles.title, { color: "#333" }]}>
            Create New Session
          </Text>
          <Pressable onPress={handleCancel} style={styles.closeButton}>
            <Ionicons name="close" size={24} color="#333" />
          </Pressable>
        </View>

        {/* <Text style={[styles.subtitle, { color: "#666" }]}>
          Select entry type
        </Text> */}

        <View style={styles.buttonsContainer}>
          <Pressable style={[styles.entryButton]} onPress={handleCreateSession}>
            <View style={styles.buttonTopRow}>
              <Ionicons name="people" size={20} color="black" />
              <Text style={[styles.buttonText]}>Create Session</Text>
            </View>
            <Text style={styles.buttonDescription}>
              Schedule a social game and invite other players to join.
            </Text>
          </Pressable>

          <Pressable style={[styles.entryButton]} onPress={handlePrePlay}>
            <View style={styles.buttonTopRow}>
              <Ionicons name="flash" size={20} color="black" />
              <Text style={[styles.buttonText]}>Pre-Play</Text>
            </View>
            <Text style={styles.buttonDescription}>
              Set your game plan and goals before your match.
            </Text>
          </Pressable>

          <Pressable style={[styles.entryButton]} onPress={handlePostPlay}>
            <View style={styles.buttonTopRow}>
              <Ionicons name="calendar" size={20} color="black" />
              <Text style={[styles.buttonText]}>Post-Play</Text>
            </View>
            <Text style={styles.buttonDescription}>
              Identify areas for improvements and track your progress.
            </Text>
          </Pressable>
        </View>
      </BottomSheetView>
    </BottomSheet>
  )
}

const styles = StyleSheet.create({
  bottomSheetContent: {
    flex: 1,
    paddingHorizontal: 30,
    paddingBottom: 30,
    backgroundColor: "rgba(229, 242, 249, 1)",
  },
  bottomSheetHeader: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
    backgroundColor: "rgba(229, 242, 249, 1)",
    position: "relative",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
  },
  subtitle: {
    fontSize: 16,
    opacity: 0.7,
    marginBottom: 30,
    textAlign: "center",
  },
  buttonsContainer: {
    width: "100%",
    gap: 15,
    backgroundColor: "rgba(229, 242, 249, 1)",
  },
  entryButton: {
    padding: 16,
    borderRadius: 20,
    borderWidth: 1,
    alignItems: "flex-start",
    backgroundColor: "white",
  },
  buttonTopRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
    gap: 8,
    backgroundColor: "white",
  },
  buttonText: {
    fontSize: 18,
    fontWeight: "600",
    color: "#333",
  },
  buttonDescription: {
    fontSize: 14,
    opacity: 0.7,
    color: "#666",
    lineHeight: 20,
  },
  closeButton: {
    position: "absolute",
    right: 10,
    top: 10,
  },
})
