import React, { useState, useRef, useMemo, useCallback } from "react"
import {
  StyleSheet,
  Pressable,
  TextInput,
  Alert,
  View,
  ActivityIndicator,
  Modal,
  ScrollView,
  Switch,
} from "react-native"
import { Text } from "@/components/Themed"
import DateTimePicker from "@react-native-community/datetimepicker"
import { Ionicons } from "@expo/vector-icons"
import { useColorScheme } from "@/components/useColorScheme"
import Colors from "@/constants/Colors"
import { useRouter } from "expo-router"
import BottomSheet, { BottomSheetScrollView } from "@gorhom/bottom-sheet"
import { sessionService } from "@/services/sessionService"
import {
  CreateSessionData,
  CreateSessionInviteData,
  SessionType,
} from "@/types"
import { locationService, LocationData } from "@/services/locationService"
import LocationAutocomplete from "@/components/LocationAutocomplete"
import DatePicker from "./DatePicker"
import TimePicker from "./TimePicker"
import DUPRRatingInput from "./DUPRRatingInput"
import SessionTypeSelector from "./SessionTypeSelector"
import VisibilitySelector from "./VisibilitySelector"
import SessionSettings from "./SessionSettings"

type Visibility = "public" | "friends" | "private"

interface CreateGroupSessionModalProps {
  visible: boolean
  onClose: () => void
  onSessionCreated?: () => void
  groupId?: string
  groupName?: string
}

export default function CreateGroupSessionModal({
  visible,
  onClose,
  onSessionCreated,
  groupId,
  groupName,
}: CreateGroupSessionModalProps) {
  const colors = useColorScheme()
  const router = useRouter()

  // Bottom sheet refs
  const calendarBottomSheetRef = useRef<BottomSheet>(null)
  const timeBottomSheetRef = useRef<BottomSheet>(null)
  const endTimeBottomSheetRef = useRef<BottomSheet>(null)
  const duprMinBottomSheetRef = useRef<BottomSheet>(null)
  const duprMaxBottomSheetRef = useRef<BottomSheet>(null)

  // Bottom sheet snap points
  const snapPoints = useMemo(() => ["60%"], [])
  const timeSnapPoints = useMemo(() => ["40%"], [])
  const duprSnapPoints = useMemo(() => ["50%"], [])

  // Form state
  const [sessionTitle, setSessionTitle] = useState("")
  const [sessionInfo, setSessionInfo] = useState("")
  const [location, setLocation] = useState("")
  const [locationData, setLocationData] = useState<LocationData | null>(null)
  const [sessionType, setSessionType] = useState<SessionType>("open play")
  const [visibility, setVisibility] = useState<Visibility>("private") // Default to private for group sessions
  const [maxPlayersNum, setMaxPlayersNum] = useState(4)
  const [allowGuests, setAllowGuests] = useState(false) // Default to false for group sessions
  const [duprMin, setDuprMin] = useState<number | null>(null)
  const [duprMax, setDuprMax] = useState<number | null>(null)
  const [isCreating, setIsCreating] = useState(false)

  // Helper function to round up to next 15-minute increment
  const getNext15MinuteTime = () => {
    const now = new Date()
    const minutes = now.getMinutes()
    const next15Minute = Math.ceil(minutes / 15) * 15
    const roundedTime = new Date(now)

    if (next15Minute >= 60) {
      roundedTime.setHours(roundedTime.getHours() + 1)
      roundedTime.setMinutes(0)
    } else {
      roundedTime.setMinutes(next15Minute)
    }

    roundedTime.setSeconds(0, 0) // Reset seconds and milliseconds
    return roundedTime
  }

  // Date and time state
  const [date, setDate] = useState(new Date())
  const [startTime, setStartTime] = useState(getNext15MinuteTime())
  const [endTime, setEndTime] = useState(() => {
    const start = getNext15MinuteTime()
    const end = new Date(start)
    end.setHours(end.getHours() + 1) // Default to 1 hour duration
    return end
  })
  const [showDatePicker, setShowDatePicker] = useState(false)
  const [showStartTimePicker, setShowStartTimePicker] = useState(false)
  const [showEndTimePicker, setShowEndTimePicker] = useState(false)

  // Reset form when modal opens/closes
  React.useEffect(() => {
    if (visible) {
      // Reset form when modal opens
      const now = new Date()
      setDate(now)
      setStartTime(getNext15MinuteTime())
      setEndTime(() => {
        const start = getNext15MinuteTime()
        const end = new Date(start)
        end.setHours(end.getHours() + 1) // Default to 1 hour duration
        return end
      })
      setSessionTitle("")
      setSessionInfo("")
      setLocation("")
      setLocationData(null)
      setVisibility("private") // Default to private for group sessions
      setMaxPlayersNum(4)
      setAllowGuests(false) // Default to false for group sessions
      setDuprMin(null)
      setDuprMax(null)
      setIsCreating(false)
    }
  }, [visible])

  const handleSave = async () => {
    // Validate required fields
    if (!location.trim()) {
      Alert.alert("Invalid Input", "Please enter a location")
      return
    }

    if (!sessionTitle.trim()) {
      Alert.alert("Invalid Input", "Please enter a session title")
      return
    }

    // Validate time
    if (endTime <= startTime) {
      Alert.alert("Invalid Input", "End time must be after start time")
      return
    }

    // Validate that the session is not in the past
    const sessionDateTime = new Date(
      date.getFullYear(),
      date.getMonth(),
      date.getDate(),
      startTime.getHours(),
      startTime.getMinutes(),
      startTime.getSeconds()
    )

    const now = new Date()
    if (sessionDateTime <= now) {
      Alert.alert(
        "Invalid Date/Time",
        "Session date and time must be in the future. Please select a future date and time."
      )
      return
    }

    setIsCreating(true)

    try {
      // Use the sessionDateTime we already created for validation

      const endDateTime = new Date(
        date.getFullYear(),
        date.getMonth(),
        date.getDate(),
        endTime.getHours(),
        endTime.getMinutes(),
        endTime.getSeconds()
      )

      // Create session data for database
      const sessionData = {
        session_datetime: sessionDateTime.toISOString(), // UTC timestamp
        end_datetime: endDateTime.toISOString(), // UTC timestamp
        location: location.trim(),
        session_type: sessionType,
        session_info: sessionInfo.trim(), // Additional session information
        visibility: visibility,
        max_players: maxPlayersNum,
        allow_guests: allowGuests,
        dupr_min: duprMin,
        dupr_max: duprMax,
        // Include PostGIS location data if available
        locationData: locationData,
        // Include group context
        groupId: groupId,
      }

      // Always save to database first using the social session service
      const createdSession = await sessionService.createSocialSession(
        sessionData
      )

      Alert.alert(
        "Session Created!",
        `"${sessionTitle}" session has been created for ${
          groupName || "the group"
        }.`,
        [
          {
            text: "OK",
            onPress: () => {
              onSessionCreated?.()
              onClose()
              // Navigate to invite friends screen with group context
              router.push({
                pathname: "/(tabs)/sessions/InviteFriends" as any,
                params: {
                  sessionId: createdSession.id,
                  selectedGroupId: groupId,
                },
              })
            },
          },
        ]
      )
    } catch (error) {
      console.error("Error creating session:", error)
      Alert.alert("Error", "Failed to create session. Please try again.")
    } finally {
      setIsCreating(false)
    }
  }

  const handleDateChange = (event: any, selectedDate?: Date) => {
    setShowDatePicker(false)
    if (selectedDate) {
      setDate(selectedDate)
    }
  }

  const handleStartTimeChange = (event: any, selectedTime?: Date) => {
    setShowStartTimePicker(false)
    if (selectedTime) {
      setStartTime(selectedTime)
    }
  }

  const handleEndTimeChange = (event: any, selectedTime?: Date) => {
    setShowEndTimePicker(false)
    if (selectedTime) {
      setEndTime(selectedTime)
    }
  }

  const formatTime = (time: Date) => {
    return time.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
  }

  const formatDate = (date: Date) => {
    return date.toLocaleDateString([], {
      weekday: "short",
      month: "short",
      day: "numeric",
    })
  }

  const renderVisibilityOption = (
    value: Visibility,
    label: string,
    description: string
  ) => (
    <Pressable
      style={[
        styles.visibilityOption,
        {
          borderColor: visibility === value ? colors.tint : colors.text + "30",
          backgroundColor:
            visibility === value ? colors.tint + "10" : "transparent",
        },
      ]}
      onPress={() => setVisibility(value)}
    >
      <View style={styles.visibilityHeader}>
        <Text style={[styles.visibilityLabel, { color: colors.text }]}>
          {label}
        </Text>
        <Ionicons
          name={visibility === value ? "radio-button-on" : "radio-button-off"}
          size={20}
          color={visibility === value ? colors.tint : colors.text + "60"}
        />
      </View>
      <Text
        style={[styles.visibilityDescription, { color: colors.text + "80" }]}
      >
        {description}
      </Text>
    </Pressable>
  )

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        {/* Header */}
        <View
          style={[styles.header, { borderBottomColor: colors.text + "20" }]}
        >
          <Pressable onPress={onClose} style={styles.closeButton}>
            <Ionicons name="close" size={24} color={colors.text} />
          </Pressable>
          <Text style={[styles.headerTitle, { color: colors.text }]}>
            Create Session{groupName ? ` for ${groupName}` : ""}
          </Text>
          <View style={styles.headerSpacer} />
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Group Context */}
          {groupName && (
            <View style={styles.section}>
              <View
                style={[
                  styles.groupContext,
                  { backgroundColor: colors.tint + "10" },
                ]}
              >
                <Ionicons name="people" size={20} color={colors.tint} />
                <Text style={[styles.groupContextText, { color: colors.tint }]}>
                  Creating session for {groupName}
                </Text>
              </View>
            </View>
          )}

          {/* Session Title */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              Session Details
            </Text>
            <View style={styles.formRow}>
              <Text style={[styles.label, { color: colors.text }]}>
                Session Title<Text style={{ color: "red" }}> *</Text>
              </Text>
              <TextInput
                style={[
                  styles.textInput,
                  {
                    borderColor: colors.text + "30",
                    color: colors.text,
                    backgroundColor: colors.background,
                  },
                ]}
                value={sessionTitle}
                onChangeText={setSessionTitle}
                placeholder="Enter session title"
                placeholderTextColor={colors.text + "60"}
                maxLength={50}
                editable={!isCreating}
              />
            </View>

            <View style={styles.formRow}>
              <Text style={[styles.label, { color: colors.text }]}>
                Additional Info (Optional)
              </Text>
              <TextInput
                style={[
                  styles.textArea,
                  {
                    borderColor: colors.text + "30",
                    color: colors.text,
                    backgroundColor: colors.background,
                  },
                ]}
                value={sessionInfo}
                onChangeText={setSessionInfo}
                placeholder="Add any additional information"
                placeholderTextColor={colors.text + "60"}
                multiline
                numberOfLines={3}
                maxLength={200}
                editable={!isCreating}
              />
            </View>
          </View>

          {/* Date and Time */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              Date & Time
            </Text>

            <View style={styles.formRow}>
              <Text style={[styles.label, { color: colors.text }]}>Date</Text>
              <Pressable
                style={[
                  styles.dateTimeButton,
                  { borderColor: colors.text + "30" },
                ]}
                onPress={() => setShowDatePicker(true)}
              >
                <Ionicons
                  name="calendar-outline"
                  size={20}
                  color={colors.tint}
                />
                <Text style={[styles.dateTimeText, { color: colors.text }]}>
                  {formatDate(date)}
                </Text>
              </Pressable>
            </View>

            <View style={styles.timeRow}>
              <View style={styles.timeColumn}>
                <Text style={[styles.label, { color: colors.text }]}>
                  Start Time
                </Text>
                <Pressable
                  style={[
                    styles.dateTimeButton,
                    { borderColor: colors.text + "30" },
                  ]}
                  onPress={() => setShowStartTimePicker(true)}
                >
                  <Ionicons name="time-outline" size={20} color={colors.tint} />
                  <Text style={[styles.dateTimeText, { color: colors.text }]}>
                    {formatTime(startTime)}
                  </Text>
                </Pressable>
              </View>

              <View style={styles.timeColumn}>
                <Text style={[styles.label, { color: colors.text }]}>
                  End Time
                </Text>
                <Pressable
                  style={[
                    styles.dateTimeButton,
                    { borderColor: colors.text + "30" },
                  ]}
                  onPress={() => setShowEndTimePicker(true)}
                >
                  <Ionicons name="time-outline" size={20} color={colors.tint} />
                  <Text style={[styles.dateTimeText, { color: colors.text }]}>
                    {formatTime(endTime)}
                  </Text>
                </Pressable>
              </View>
            </View>
          </View>

          {/* Location */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              Location
            </Text>
            <View style={styles.formRow}>
              <Text style={[styles.label, { color: colors.text }]}>
                Location<Text style={{ color: "red" }}> *</Text>
              </Text>
              <LocationAutocomplete
                value={location}
                onLocationChange={(address, locationData) => {
                  setLocation(address)
                  setLocationData(locationData)
                }}
                placeholder="Enter location"
              />
            </View>
          </View>

          {/* Session Settings */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              Session Settings
            </Text>

            <View style={styles.formRow}>
              <Text style={[styles.label, { color: colors.text }]}>
                Max Players
              </Text>
              <View style={styles.maxPlayersContainer}>
                <Pressable
                  style={[
                    styles.maxPlayersButton,
                    { borderColor: colors.text + "30" },
                  ]}
                  onPress={() =>
                    setMaxPlayersNum(Math.max(2, maxPlayersNum - 1))
                  }
                  disabled={isCreating}
                >
                  <Ionicons name="remove" size={20} color={colors.tint} />
                </Pressable>
                <Text style={[styles.maxPlayersText, { color: colors.text }]}>
                  {maxPlayersNum}
                </Text>
                <Pressable
                  style={[
                    styles.maxPlayersButton,
                    { borderColor: colors.text + "30" },
                  ]}
                  onPress={() =>
                    setMaxPlayersNum(Math.min(8, maxPlayersNum + 1))
                  }
                  disabled={isCreating}
                >
                  <Ionicons name="add" size={20} color={colors.tint} />
                </Pressable>
              </View>
            </View>

            <View style={styles.switchRow}>
              <View style={styles.switchInfo}>
                <Text style={[styles.switchLabel, { color: colors.text }]}>
                  Allow Guests
                </Text>
                <Text
                  style={[
                    styles.switchDescription,
                    { color: colors.text + "80" },
                  ]}
                >
                  Let non-group members join this session
                </Text>
              </View>
              <Switch
                value={allowGuests}
                onValueChange={setAllowGuests}
                disabled={isCreating}
                trackColor={{
                  false: colors.text + "30",
                  true: colors.tint + "50",
                }}
                thumbColor={allowGuests ? colors.tint : colors.text + "60"}
              />
            </View>
          </View>

          {/* Visibility */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              Visibility
            </Text>
            {renderVisibilityOption(
              "private",
              "Private",
              "Only invited people can see this session"
            )}
            {renderVisibilityOption(
              "friends",
              "Friends Only",
              "Only your friends can see this session"
            )}
            {renderVisibilityOption(
              "public",
              "Public",
              "Anyone can see and join this session"
            )}
          </View>

          {/* DUPR Rating (Optional) */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              DUPR Rating (Optional)
            </Text>
            <View style={styles.duprRow}>
              <View style={styles.duprColumn}>
                <Text style={[styles.label, { color: colors.text }]}>
                  Min Rating
                </Text>
                <Pressable
                  style={[
                    styles.duprButton,
                    { borderColor: colors.text + "30" },
                  ]}
                  onPress={() => duprMinBottomSheetRef.current?.expand()}
                >
                  <Text style={[styles.duprText, { color: colors.text }]}>
                    {duprMin ? duprMin.toFixed(1) : "Any"}
                  </Text>
                </Pressable>
              </View>

              <View style={styles.duprColumn}>
                <Text style={[styles.label, { color: colors.text }]}>
                  Max Rating
                </Text>
                <Pressable
                  style={[
                    styles.duprButton,
                    { borderColor: colors.text + "30" },
                  ]}
                  onPress={() => duprMaxBottomSheetRef.current?.expand()}
                >
                  <Text style={[styles.duprText, { color: colors.text }]}>
                    {duprMax ? duprMax.toFixed(1) : "Any"}
                  </Text>
                </Pressable>
              </View>
            </View>
          </View>
        </ScrollView>

        {/* Action Button */}
        <View
          style={[
            styles.actionButtonContainer,
            { borderTopColor: colors.text + "20" },
          ]}
        >
          <Pressable
            style={[
              styles.createButton,
              {
                backgroundColor: isCreating ? colors.text + "40" : colors.tint,
              },
            ]}
            onPress={handleSave}
            disabled={isCreating}
          >
            {isCreating ? (
              <ActivityIndicator size="small" color="white" />
            ) : (
              <Text style={styles.createButtonText}>Create Session</Text>
            )}
          </Pressable>
        </View>

        {/* Date/Time Pickers */}
        {showDatePicker && (
          <DateTimePicker
            value={date}
            mode="date"
            display="default"
            onChange={handleDateChange}
            minimumDate={new Date()}
          />
        )}

        {showStartTimePicker && (
          <DateTimePicker
            value={startTime}
            mode="time"
            display="default"
            onChange={handleStartTimeChange}
          />
        )}

        {showEndTimePicker && (
          <DateTimePicker
            value={endTime}
            mode="time"
            display="default"
            onChange={handleEndTimeChange}
          />
        )}
      </View>
    </Modal>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  closeButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "600",
  },
  headerSpacer: {
    width: 32, // Same width as close button to center the title
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  section: {
    marginTop: 24,
  },
  groupContext: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    borderRadius: 8,
    gap: 8,
  },
  groupContextText: {
    fontSize: 14,
    fontWeight: "500",
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 16,
  },
  formRow: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: "500",
    marginBottom: 8,
  },
  textInput: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
  },
  textArea: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
    minHeight: 80,
    textAlignVertical: "top",
  },
  dateTimeButton: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 12,
    gap: 8,
  },
  dateTimeText: {
    fontSize: 16,
  },
  timeRow: {
    flexDirection: "row",
    gap: 12,
  },
  timeColumn: {
    flex: 1,
  },
  maxPlayersContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  maxPlayersButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  maxPlayersText: {
    fontSize: 18,
    fontWeight: "600",
    minWidth: 30,
    textAlign: "center",
  },
  switchRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  switchInfo: {
    flex: 1,
  },
  switchLabel: {
    fontSize: 16,
    fontWeight: "500",
    marginBottom: 2,
  },
  switchDescription: {
    fontSize: 14,
  },
  visibilityOption: {
    borderWidth: 1,
    borderRadius: 10,
    padding: 16,
    marginBottom: 12,
  },
  visibilityHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  visibilityLabel: {
    fontSize: 16,
    fontWeight: "500",
  },
  visibilityDescription: {
    fontSize: 14,
  },
  duprRow: {
    flexDirection: "row",
    gap: 12,
  },
  duprColumn: {
    flex: 1,
  },
  duprButton: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 12,
    alignItems: "center",
  },
  duprText: {
    fontSize: 16,
    fontWeight: "500",
  },
  actionButtonContainer: {
    paddingHorizontal: 20,
    // paddingVertical: 16,
    // paddingBottom: 32,
    borderTopWidth: 1,
  },
  createButton: {
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  createButtonText: {
    color: "white",
    fontSize: 18,
    fontWeight: "600",
  },
})
