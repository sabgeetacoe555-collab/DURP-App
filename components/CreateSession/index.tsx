import React, { useState, useRef, useMemo, useCallback } from "react"
import {
  StyleSheet,
  Pressable,
  TextInput,
  Alert,
  View,
  ActivityIndicator,
} from "react-native"
import { Text } from "@/components/Themed"
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

interface CreateSessionModalProps {
  visible: boolean
  onClose: () => void
  onSessionCreated?: () => void
}

export default function CreateSessionModal({
  visible,
  onClose,
  onSessionCreated,
}: CreateSessionModalProps) {
  const colors = useColorScheme()
  const router = useRouter()

  // Bottom sheet ref and snap points
  const bottomSheetRef = useRef<BottomSheet>(null)
  const snapPoints = useMemo(() => ["95%"], [])

  // Handle visible prop
  React.useEffect(() => {
    if (visible) {
      bottomSheetRef.current?.expand()
    } else {
      bottomSheetRef.current?.close()
    }
  }, [visible])

  // Handle bottom sheet changes
  const handleSheetChanges = useCallback(
    (index: number) => {
      if (index === -1) {
        onClose()
      }
    },
    [onClose]
  )

  // Form state
  const [sessionTitle, setSessionTitle] = useState("")
  const [sessionInfo, setSessionInfo] = useState("")
  const [location, setLocation] = useState("")
  const [locationData, setLocationData] = useState<LocationData | null>(null)
  const [sessionType, setSessionType] = useState<SessionType>("open play")
  const [visibility, setVisibility] = useState<Visibility>("public")
  const [maxPlayersNum, setMaxPlayersNum] = useState(4)
  const [allowGuests, setAllowGuests] = useState(true)
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
      setSessionType("open play")
      setVisibility("public")
      setMaxPlayersNum(4)
      setAllowGuests(true)
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
      }

      // Always save to database first using the social session service
      const createdSession = await sessionService.createSocialSession(
        sessionData
      )

      Alert.alert(
        "Session Created!",
        `"${sessionTitle}" session has been created successfully.`,
        [
          {
            text: "OK",
            onPress: () => {
              onSessionCreated?.()
              onClose()
              // Navigate to invite friends screen
              router.push({
                pathname: "/(tabs)/sessions/InviteFriends" as any,
                params: { sessionId: createdSession.id },
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

  // Simple handlers for sub-components
  const handleDateChange = (newDate: Date) => {
    setDate(newDate)
  }

  const handleStartTimeChange = (newTime: Date) => {
    setStartTime(newTime)
  }

  const handleEndTimeChange = (newTime: Date) => {
    setEndTime(newTime)
  }

  const handleDuprMinChange = (value: number | null) => {
    setDuprMin(value)
  }

  const handleDuprMaxChange = (value: number | null) => {
    setDuprMax(value)
  }

  const formatDate = (date: Date) => {
    return date.toLocaleDateString([], {
      weekday: "short",
      month: "short",
      day: "numeric",
    })
  }

  return (
    <BottomSheet
      ref={bottomSheetRef}
      index={-1}
      snapPoints={snapPoints}
      onChange={handleSheetChanges}
      enablePanDownToClose={true}
      backgroundStyle={{ backgroundColor: colors.background }}
      handleIndicatorStyle={{ backgroundColor: colors.text + "40" }}
      style={styles.bottomSheet}
    >
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.text + "20" }]}>
        <Pressable onPress={onClose} style={styles.closeButton}>
          <Ionicons name="close" size={24} color={colors.text} />
        </Pressable>
        <Text style={[styles.headerTitle, { color: colors.text }]}>
          Create Session
        </Text>
        <View style={styles.headerSpacer} />
      </View>

      <BottomSheetScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        bounces={false}
      >
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

          <DatePicker
            date={date}
            onDateChange={handleDateChange}
            label="Date"
          />

          <View style={styles.timeRow}>
            <TimePicker
              time={startTime}
              onTimeChange={handleStartTimeChange}
              label="Start Time"
            />
            <TimePicker
              time={endTime}
              onTimeChange={handleEndTimeChange}
              label="End Time"
            />
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

        {/* Session Type */}
        <View style={styles.section}>
          <SessionTypeSelector
            sessionType={sessionType}
            onSessionTypeChange={setSessionType}
          />
        </View>

        {/* Visibility */}
        <View style={styles.section}>
          <VisibilitySelector
            visibility={visibility}
            onVisibilityChange={setVisibility}
          />
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
                onPress={() => setMaxPlayersNum(Math.max(2, maxPlayersNum - 1))}
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
                onPress={() => setMaxPlayersNum(Math.min(8, maxPlayersNum + 1))}
                disabled={isCreating}
              >
                <Ionicons name="add" size={20} color={colors.tint} />
              </Pressable>
            </View>
          </View>

          <SessionSettings
            allowGuests={allowGuests}
            onAllowGuestsChange={setAllowGuests}
            requireApproval={false}
            onRequireApprovalChange={() => {}} // Not implemented yet
          />
        </View>

        {/* DUPR Rating (Optional) */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            DUPR Rating (Optional)
          </Text>
          <View style={styles.duprRow}>
            <DUPRRatingInput
              value={duprMin}
              onChange={handleDuprMinChange}
              label="Min Rating"
            />
            <DUPRRatingInput
              value={duprMax}
              onChange={handleDuprMaxChange}
              label="Max Rating"
            />
          </View>
        </View>
      </BottomSheetScrollView>

      {/* Action Button - Inside Bottom Sheet */}
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
    </BottomSheet>
  )
}

const styles = StyleSheet.create({
  bottomSheet: {
    marginTop: 30, // Reduced top margin to give more space for content
  },
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 20, // Normal padding since BottomSheetScrollView handles scrolling properly
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
  duprInput: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
    fontWeight: "500",
    textAlign: "center",
    minHeight: 48,
  },
  actionButtonContainer: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    paddingBottom: 100, // Account for tab bar + safe area
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
