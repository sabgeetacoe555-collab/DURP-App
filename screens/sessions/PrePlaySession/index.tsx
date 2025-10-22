import React, { useState, useRef, useMemo } from "react"
import {
  StyleSheet,
  Pressable,
  TextInput,
  ScrollView,
  Platform,
  Alert,
  View,
} from "react-native"
import { Text } from "@/components/Themed"
import DateTimePicker from "@react-native-community/datetimepicker"
import { Calendar } from "react-native-calendars"
import { Ionicons } from "@expo/vector-icons"
import { useColorScheme } from "@/components/useColorScheme"
import Colors from "@/constants/Colors"
import { useRouter } from "expo-router"
import BottomSheet, { BottomSheetView } from "@gorhom/bottom-sheet"
import ExpandableCard from "../common/ExpandableCard"
import Card from "@/components/Card"
import RadioCard from "../common/RadioCard"
import CheckboxCard from "../common/CheckboxCard"
import ActionButtons from "../common/ActionButtons"
import { sessionService } from "@/services/sessionService"
import {
  SessionType,
  FocusArea,
  Rating,
  BodyReadiness,
  createSessionData,
} from "@/types"

export default function PrePlaySessionScreen() {
  const colors = useColorScheme()
  const router = useRouter()

  // Bottom sheet refs
  const calendarBottomSheetRef = useRef<BottomSheet>(null)
  const timeBottomSheetRef = useRef<BottomSheet>(null)

  // Bottom sheet snap points
  const snapPoints = useMemo(() => ["70%"], [])
  const timeSnapPoints = useMemo(() => ["50%"], [])

  // State management
  const [date, setDate] = useState(new Date())
  const [time, setTime] = useState(new Date())
  const [location, setLocation] = useState("")
  const [selectedSession, setSelectedSession] = useState<SessionType | null>(
    null
  )
  const [selectedFocus, setSelectedFocus] = useState<FocusArea[]>([])
  const [rating, setRating] = useState<Rating | null>(null)
  const [bodyReadiness, setBodyReadiness] = useState<BodyReadiness | null>(null)

  const sessionTypes: SessionType[] = [
    "open play",
    "tournament",
    "drills",
    "private lesson",
    "ladder",
    "solo",
  ]
  const focusAreas: FocusArea[] = [
    "serve",
    "return",
    "dinking",
    "volleys",
    "speed ups",
    "communication",
  ]
  const bodyReadinessOptions: BodyReadiness[] = ["tired", "average", "great"]

  const handleDateSelect = (day: any) => {
    // Parse the date string manually to avoid timezone issues
    const [year, month, dayNum] = day.dateString.split("-").map(Number)
    const selectedDate = new Date(year, month - 1, dayNum) // month is 0-indexed
    setDate(selectedDate)
    calendarBottomSheetRef.current?.close()
  }

  const openCalendar = () => {
    calendarBottomSheetRef.current?.expand()
  }

  const closeCalendar = () => {
    calendarBottomSheetRef.current?.close()
  }

  const openTimePicker = () => {
    timeBottomSheetRef.current?.expand()
  }

  const closeTimePicker = () => {
    timeBottomSheetRef.current?.close()
  }

  const handleTimeChange = (event: any, selectedTime?: Date) => {
    if (selectedTime) {
      setTime(selectedTime)
    }
    closeTimePicker()
  }

  const handleSessionSelection = (value: string | string[]) => {
    setSelectedSession(value as SessionType)
  }

  const handleFocusSelection = (value: string | string[]) => {
    setSelectedFocus(value as FocusArea[])
  }

  const handleSave = async () => {
    // Validate required fields
    if (!selectedSession) {
      Alert.alert("Missing Information", "Please select a session type")
      return
    }

    if (selectedFocus.length === 0) {
      Alert.alert(
        "Missing Information",
        "Please select at least one focus area"
      )
      return
    }

    try {
      // Create session data for database
      const sessionData = createSessionData(
        date,
        time,
        location,
        selectedSession,
        selectedFocus,
        rating || undefined,
        bodyReadiness || undefined
      )

      // Save to database
      await sessionService.createSession(sessionData)

      Alert.alert("Success", "Your pre-play session has been saved!", [
        {
          text: "OK",
          onPress: () => {
            router.push("/(tabs)/sessions")
          },
        },
      ])
    } catch (error) {
      console.error("Error saving session:", error)
      // Error handling is already done in the service
    }
  }

  const handleCancel = () => {
    router.back()
  }

  const formatDate = (date: Date) => {
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    })
  }

  const formatTime = (time: Date) => {
    return time.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    })
  }

  const getRatingColors = (ratingOption: Rating, isSelected: boolean) => {
    switch (ratingOption) {
      case "bad":
        return {
          backgroundColor: isSelected ? "#ff4444" : "#ffcccc",
          borderColor: isSelected ? "#ff4444" : "#ffaaaa",
        }
      case "ok":
        return {
          backgroundColor: isSelected ? "#ffcc00" : "#fff2cc",
          borderColor: isSelected ? "#ffcc00" : "#ffe066",
        }
      case "good":
        return {
          backgroundColor: isSelected ? "#44aa44" : "#ccffcc",
          borderColor: isSelected ? "#44aa44" : "#aaffaa",
        }
      default:
        return {
          backgroundColor: "transparent",
          borderColor: borderColor,
        }
    }
  }

  const getBodyReadinessColors = (
    readinessOption: BodyReadiness,
    isSelected: boolean
  ) => {
    switch (readinessOption) {
      case "tired":
        return {
          backgroundColor: isSelected ? "#ff6666" : "#ffdddd",
          borderColor: isSelected ? "#ff6666" : "#ffbbbb",
        }
      case "average":
        return {
          backgroundColor: isSelected ? "#ffaa00" : "#ffe6cc",
          borderColor: isSelected ? "#ffaa00" : "#ffd699",
        }
      case "great":
        return {
          backgroundColor: isSelected ? "#00aa44" : "#ccffdd",
          borderColor: isSelected ? "#00aa44" : "#99ffbb",
        }
      default:
        return {
          backgroundColor: "transparent",
          borderColor: borderColor,
        }
    }
  }

  // Define border and card colors based on color scheme
  const borderColor = colors.isDark ? "#444" : "#ddd"
  const cardColor = colors.isDark ? "#1a1a1a" : "#f8f8f8"

  return (
    <View style={{ flex: 1 }}>
      <ScrollView
        style={[styles.container, { backgroundColor: "rgba(0, 128, 192, 1)" }]}
        contentContainerStyle={styles.contentContainer}
      >
        {/* Row 1: Title */}
        <View style={[styles.headerRow, { backgroundColor: "transparent" }]}>
          <Ionicons name="calendar-outline" size={24} color="white" />
          <Text style={styles.headerText}>Add details about Pre-Play</Text>
        </View>

        {/* Row 2: Date and Time */}
        <View style={[styles.row, { backgroundColor: "transparent" }]}>
          <Pressable
            style={[
              styles.inputContainer,
              styles.halfWidth,
              { borderColor, backgroundColor: "rgba(255, 255, 255, 0.6)" },
            ]}
            onPress={openCalendar}
          >
            <Text style={[styles.inputText, { color: colors.text }]}>
              {formatDate(date)}
            </Text>
            <Ionicons name="calendar-outline" size={20} color="black" />
          </Pressable>

          <Pressable
            style={[
              styles.inputContainer,
              styles.halfWidth,
              { borderColor, backgroundColor: "rgba(255, 255, 255, 0.6)" },
            ]}
            onPress={openTimePicker}
          >
            <Text style={[styles.inputText, { color: colors.text }]}>
              {formatTime(time)}
            </Text>
            <Ionicons name="time-outline" size={20} color="black" />
          </Pressable>
        </View>

        {/* Row 3: Location */}
        <View style={[styles.row, { backgroundColor: "transparent" }]}>
          <View
            style={[
              styles.inputContainer,
              styles.fullWidth,
              { borderColor, backgroundColor: "rgba(255, 255, 255, 0.6)" },
            ]}
          >
            <TextInput
              style={[styles.textInput, { color: colors.text }]}
              placeholder="Location"
              placeholderTextColor={colors.text + "80"}
              value={location}
              onChangeText={setLocation}
            />
            <Ionicons name="location-outline" size={20} color="black" />
          </View>
        </View>

        {/* Row 4: Session Type */}
        <View style={[styles.row, { backgroundColor: "transparent" }]}>
          <ExpandableCard
            title="My session is:"
            options={sessionTypes}
            type="radio"
            selectedValue={selectedSession}
            onSelectionChange={handleSessionSelection}
          />
        </View>

        {/* Row 5: Today's Focus */}
        <View style={[styles.row, { backgroundColor: "transparent" }]}>
          <ExpandableCard
            title="Today's focus:"
            options={focusAreas}
            type="check"
            selectedValues={selectedFocus}
            onSelectionChange={handleFocusSelection}
          />
        </View>

        {/* Row 6: Rating */}
        <View style={[styles.row, { backgroundColor: "transparent" }]}>
          <Card title="Mood">
            <View
              style={[
                styles.ratingContainer,
                { backgroundColor: "transparent" },
              ]}
            >
              {(["bad", "ok", "good"] as Rating[]).map((ratingOption) => {
                const ratingColors = getRatingColors(
                  ratingOption,
                  rating === ratingOption
                )
                return (
                  <Pressable
                    key={ratingOption}
                    style={[
                      styles.ratingButton,
                      {
                        backgroundColor: ratingColors.backgroundColor,
                        borderColor: ratingColors.borderColor,
                      },
                    ]}
                    onPress={() => setRating(ratingOption)}
                  >
                    <Text
                      style={[
                        styles.ratingButtonText,
                        { color: rating === ratingOption ? "white" : "#333" },
                      ]}
                    >
                      {ratingOption.charAt(0).toUpperCase() +
                        ratingOption.slice(1)}
                    </Text>
                  </Pressable>
                )
              })}
            </View>
          </Card>
        </View>

        {/* Row 7: Body Readiness */}
        <View style={[styles.row, { backgroundColor: "transparent" }]}>
          <Card title="Body readiness">
            <View
              style={[
                styles.ratingContainer,
                { backgroundColor: "transparent" },
              ]}
            >
              {bodyReadinessOptions.map((readinessOption) => {
                const readinessColors = getBodyReadinessColors(
                  readinessOption,
                  bodyReadiness === readinessOption
                )
                return (
                  <Pressable
                    key={readinessOption}
                    style={[
                      styles.ratingButton,
                      {
                        backgroundColor: readinessColors.backgroundColor,
                        borderColor: readinessColors.borderColor,
                      },
                    ]}
                    onPress={() => setBodyReadiness(readinessOption)}
                  >
                    <Text
                      style={[
                        styles.ratingButtonText,
                        {
                          color:
                            bodyReadiness === readinessOption
                              ? "white"
                              : "#333",
                        },
                      ]}
                    >
                      {readinessOption.charAt(0).toUpperCase() +
                        readinessOption.slice(1)}
                    </Text>
                  </Pressable>
                )
              })}
            </View>
          </Card>
        </View>

        {/* Action Buttons */}
        <ActionButtons onCancel={handleCancel} onSave={handleSave} />
      </ScrollView>

      {/* Time Picker Bottom Sheet */}
      <BottomSheet
        ref={timeBottomSheetRef}
        snapPoints={timeSnapPoints}
        index={-1}
        enablePanDownToClose={true}
        backgroundStyle={{
          backgroundColor: "rgba(229, 242, 249, 1)",
          borderRadius: 32,
          shadowColor: "#000",
          shadowOffset: {
            width: 0,
            height: -4,
          },
          shadowOpacity: 0.25,
          shadowRadius: 12,
          elevation: 8,
        }}
        handleIndicatorStyle={{ backgroundColor: colors.text + "40" }}
      >
        <BottomSheetView style={styles.bottomSheetContent}>
          <View style={styles.bottomSheetHeader}>
            <Text style={[styles.bottomSheetTitle, { color: colors.text }]}>
              Select Time
            </Text>
            <Pressable onPress={closeTimePicker}>
              <Ionicons name="close" size={24} color={colors.text} />
            </Pressable>
          </View>

          <View style={styles.timePickerContainer}>
            <DateTimePicker
              value={time}
              mode="time"
              display="spinner"
              onChange={handleTimeChange}
              style={styles.timePicker}
            />
          </View>
        </BottomSheetView>
      </BottomSheet>

      {/* Calendar Bottom Sheet */}
      <BottomSheet
        ref={calendarBottomSheetRef}
        snapPoints={snapPoints}
        index={-1}
        enablePanDownToClose={true}
        backgroundStyle={{
          backgroundColor: "rgba(229, 242, 249, 1)",
          borderRadius: 32,
          shadowColor: "#000",
          shadowOffset: {
            width: 0,
            height: -4,
          },
          shadowOpacity: 0.25,
          shadowRadius: 12,
          elevation: 8,
        }}
        handleIndicatorStyle={{ backgroundColor: colors.text + "40" }}
      >
        <BottomSheetView style={styles.bottomSheetContent}>
          <View style={styles.bottomSheetHeader}>
            <Text style={[styles.bottomSheetTitle, { color: colors.text }]}>
              Select Date
            </Text>
            <Pressable onPress={closeCalendar}>
              <Ionicons name="close" size={24} color={colors.text} />
            </Pressable>
          </View>

          <Calendar
            onDayPress={handleDateSelect}
            markedDates={{
              [date.toISOString().split("T")[0]]: {
                selected: true,
                selectedColor: colors.tint,
              },
            }}
            theme={{
              backgroundColor: cardColor,
              calendarBackground: cardColor,
              textSectionTitleColor: colors.text,
              selectedDayBackgroundColor: colors.tint,
              selectedDayTextColor: "white",
              todayTextColor: colors.tint,
              dayTextColor: colors.text,
              textDisabledColor: colors.text + "40",
              arrowColor: colors.tint,
              monthTextColor: colors.text,
              indicatorColor: colors.tint,
            }}
          />
        </BottomSheetView>
      </BottomSheet>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentContainer: {
    padding: 20,
    // paddingBottom: 40,
    flex: 1,
    backgroundColor: "transparent",
  },
  row: {
    marginBottom: 16,
    flexDirection: "row",
    gap: 12,
    backgroundColor: "transparent",
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  halfWidth: {
    flex: 1,
  },
  fullWidth: {
    width: "100%",
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
    gap: 12,
  },
  headerText: {
    fontSize: 20,
    fontWeight: "bold",
    color: "white",
  },
  inputText: {
    fontSize: 16,
    fontWeight: "500",
  },
  textInput: {
    fontSize: 16,
    flex: 1,
    paddingRight: 8,
  },
  card: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: "600",
  },
  ratingTitle: {
    textAlign: "center",
    marginBottom: 16,
  },
  ratingContainer: {
    flexDirection: "row",
    gap: 12,
  },
  ratingButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderWidth: 2,
    borderRadius: 8,
    alignItems: "center",
  },
  ratingButtonText: {
    fontSize: 16,
    fontWeight: "600",
  },
  actionButton: {
    flex: 1,
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  cancelActionButton: {
    backgroundColor: "transparent",
    borderWidth: 2,
  },
  saveActionButton: {
    borderWidth: 0,
  },
  actionButtonText: {
    fontSize: 18,
    fontWeight: "600",
  },
  bottomSheetContent: {
    flex: 1,
    padding: 20,
  },
  bottomSheetHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
    backgroundColor: "transparent",
  },
  bottomSheetTitle: {
    fontSize: 20,
    fontWeight: "600",
  },
  timePickerContainer: {
    alignItems: "center",
    justifyContent: "center",
    minHeight: 200,
  },
  timePicker: {
    width: "100%",
    height: 200,
  },
})
