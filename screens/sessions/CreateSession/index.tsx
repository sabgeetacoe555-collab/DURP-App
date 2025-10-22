import React, { useState, useRef, useMemo, useCallback } from "react"
import {
  StyleSheet,
  Pressable,
  TextInput,
  ScrollView,
  Platform,
  Alert,
  View,
  Switch,
  Image,
} from "react-native"
import { Text } from "@/components/Themed"
import DateTimePicker from "@react-native-community/datetimepicker"
import { Calendar } from "react-native-calendars"
import { Ionicons } from "@expo/vector-icons"
import { useColorScheme } from "@/components/useColorScheme"
import Colors from "@/constants/Colors"
import { useRouter, useFocusEffect } from "expo-router"
import BottomSheet, { BottomSheetView } from "@gorhom/bottom-sheet"
import ActionButtons from "@/screens/sessions/common/ActionButtons"
import { sessionService } from "@/services/sessionService"
import {
  CreateSessionData,
  CreateSessionInviteData,
  SessionType,
} from "@/types"
import { locationService, LocationData } from "@/services/locationService"
import LocationAutocomplete from "@/components/LocationAutocomplete"
import CustomHeader from "@/components/CustomHeader"
// Removed contacts and SMS imports - moved to InviteFriends screen

type Visibility = "public" | "friends" | "private"

export default function CreateSession() {
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

  // State management
  const [sessionTitle, setSessionTitle] = useState("")
  const [sessionInfo, setSessionInfo] = useState("")
  const [date, setDate] = useState(new Date())
  const [startTime, setStartTime] = useState(() => {
    const now = new Date()
    // Round to nearest 15-minute increment
    const minutes = Math.round(now.getMinutes() / 15) * 15
    now.setMinutes(minutes, 0, 0) // Reset seconds and milliseconds
    return now
  })
  const [endTime, setEndTime] = useState(() => {
    const end = new Date()
    // Round to nearest 15-minute increment and add 1 hour
    const minutes = Math.round(end.getMinutes() / 15) * 15
    end.setMinutes(minutes, 0, 0) // Reset seconds and milliseconds
    end.setHours(end.getHours() + 1)
    return end
  })
  const [location, setLocation] = useState("")
  const [locationData, setLocationData] = useState<LocationData | null>(null)
  const [selectedSession, setSelectedSession] = useState<SessionType | null>(
    null
  )
  const [visibility, setVisibility] = useState<Visibility>("public")
  const [maxPlayers, setMaxPlayers] = useState("")
  const [allowGuests, setAllowGuests] = useState(true)
  const [duprMin, setDuprMin] = useState<number | null>(null)
  const [duprMax, setDuprMax] = useState<number | null>(null)

  // Removed contacts functionality - moved to InviteFriends screen

  // ScrollView ref for smooth scrolling
  const scrollViewRef = useRef<ScrollView>(null)

  // Reset form state to initial values
  const resetFormState = useCallback(() => {
    setSessionTitle("")
    setDate(new Date())
    setStartTime(() => {
      const now = new Date()
      // Round to nearest 15-minute increment
      const minutes = Math.round(now.getMinutes() / 15) * 15
      now.setMinutes(minutes, 0, 0) // Reset seconds and milliseconds
      return now
    })
    setEndTime(() => {
      const end = new Date()
      // Round to nearest 15-minute increment and add 1 hour
      const minutes = Math.round(end.getMinutes() / 15) * 15
      end.setMinutes(minutes, 0, 0) // Reset seconds and milliseconds
      end.setHours(end.getHours() + 1)
      return end
    })
    setLocation("")
    setLocationData(null)
    setSelectedSession(null)
    setVisibility("public")
    setMaxPlayers("")
    setAllowGuests(true)
    setDuprMin(null)
    setDuprMax(null)
  }, [])

  // Reset form when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      resetFormState()
    }, [resetFormState])
  )

  // Helper function to close all bottom sheets
  const closeAllBottomSheets = () => {
    calendarBottomSheetRef.current?.close()
    timeBottomSheetRef.current?.close()
    endTimeBottomSheetRef.current?.close()
    duprMinBottomSheetRef.current?.close()
    duprMaxBottomSheetRef.current?.close()
  }

  const sessionTypes: SessionType[] = [
    "open play",
    "tournament",
    "drills",
    "private lesson",
    "ladder",
  ]

  // Generate DUPR options in 0.25 increments from 1.0 to 8.0
  const duprOptions = useMemo(() => {
    const options = []
    for (let i = 1.0; i <= 8.0; i += 0.25) {
      options.push(Number(i.toFixed(2)))
    }
    return options
  }, [])

  const handleDateSelect = (day: any) => {
    const [year, month, dayNum] = day.dateString.split("-").map(Number)
    const selectedDate = new Date(year, month - 1, dayNum)
    setDate(selectedDate)
    calendarBottomSheetRef.current?.close()
  }

  const openCalendar = () => {
    closeAllBottomSheets()
    calendarBottomSheetRef.current?.expand()
  }

  const closeCalendar = () => {
    calendarBottomSheetRef.current?.close()
  }

  const openTimePicker = () => {
    closeAllBottomSheets()
    timeBottomSheetRef.current?.expand()
  }

  const closeTimePicker = () => {
    timeBottomSheetRef.current?.close()
  }

  const openEndTimePicker = () => {
    closeAllBottomSheets()
    endTimeBottomSheetRef.current?.expand()
  }

  const closeEndTimePicker = () => {
    endTimeBottomSheetRef.current?.close()
  }

  const openDuprMinPicker = () => {
    closeAllBottomSheets()
    duprMinBottomSheetRef.current?.expand()
  }

  const closeDuprMinPicker = () => {
    duprMinBottomSheetRef.current?.close()
  }

  const openDuprMaxPicker = () => {
    closeAllBottomSheets()
    duprMaxBottomSheetRef.current?.expand()
  }

  const closeDuprMaxPicker = () => {
    duprMaxBottomSheetRef.current?.close()
  }

  const handleTimeChange = (event: any, selectedTime?: Date) => {
    if (selectedTime) {
      setStartTime(selectedTime)
      // Update end time to be 1 hour after the selected start time
      const newEndTime = new Date(selectedTime)
      newEndTime.setHours(newEndTime.getHours() + 1)
      setEndTime(newEndTime)
    }
    closeTimePicker()
  }

  const handleEndTimeChange = (event: any, selectedTime?: Date) => {
    if (selectedTime) {
      setEndTime(selectedTime)
    }
    closeEndTimePicker()
  }

  const handleSessionSelection = (value: string | string[]) => {
    setSelectedSession(value as SessionType)
  }

  const handleLocationChange = (
    address: string,
    locationData: LocationData | null
  ) => {
    setLocation(address)
    setLocationData(locationData)
  }

  const handleDuprMinSelect = (value: number | null) => {
    setDuprMin(value)
    closeDuprMinPicker()
  }

  const handleDuprMaxSelect = (value: number | null) => {
    setDuprMax(value)
    closeDuprMaxPicker()
  }

  const handleSave = async () => {
    // Validate required fields
    if (!sessionTitle.trim()) {
      Alert.alert("Missing Information", "Please enter a session title")
      return
    }

    if (!location.trim()) {
      Alert.alert("Missing Information", "Please enter a location")
      return
    }

    const maxPlayersNum = parseInt(maxPlayers)
    if (isNaN(maxPlayersNum) || maxPlayersNum < 1 || maxPlayersNum > 20) {
      Alert.alert("Invalid Input", "Max players must be between 1 and 20")
      return
    }

    if (duprMin !== null && duprMax !== null && duprMin > duprMax) {
      Alert.alert(
        "Invalid Input",
        "Minimum DUPR cannot be higher than maximum DUPR"
      )
      return
    }

    if (endTime <= startTime) {
      Alert.alert("Invalid Input", "End time must be after start time")
      return
    }

    try {
      // Create UTC timestamps from date and time inputs
      const sessionDateTime = new Date(
        date.getFullYear(),
        date.getMonth(),
        date.getDate(),
        startTime.getHours(),
        startTime.getMinutes(),
        startTime.getSeconds()
      )

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
        session_type: sessionTitle.trim() || "open play", // Use session title as session type for now
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

      // If visibility is "private", navigate to invite friends screen with session ID
      // if (visibility === "private") {
      //   router.push({
      //     pathname: "/(tabs)/sessions/InviteFriends" as any,
      //     params: { sessionId: createdSession.id },
      //   })
      //   return
      // }

      router.push({
        pathname: "/(tabs)/sessions/InviteFriends" as any,
        params: { sessionId: createdSession.id },
      })

      // For public sessions, show success and navigate back
      Alert.alert("Success", "Your session has been created!", [
        {
          text: "OK",
          onPress: () => {
            // First dismiss the modal, then navigate to sessions tab
            router.back()
            // Use setTimeout to ensure modal is dismissed before navigation
            setTimeout(() => {
              router.push("/(tabs)/sessions")
            }, 100)
          },
        },
      ])
    } catch (error) {
      console.error("Error creating session:", error)
      Alert.alert("Error", "Failed to create session. Please try again.")
    }
  }

  const handleCancel = () => {
    router.back()
  }

  // Removed all contact-related functions - moved to InviteFriends screen

  const formatDate = (date: Date) => {
    return date.toLocaleDateString("en-US", {
      weekday: "long",
      month: "long",
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

  // Define border and card colors based on color scheme
  const borderColor = colors.isDark ? "#444" : "#ddd"
  const cardColor = colors.isDark ? "#1a1a1a" : "#f8f8f8"

  return (
    <View style={{ flex: 1 }}>
      <CustomHeader title="Create Session" showBackButton={false} />

      <ScrollView
        ref={scrollViewRef}
        style={[styles.container, { backgroundColor: "white" }]}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
        // keyboardShouldPersistTaps="handled"
        keyboardShouldPersistTaps="never" // Changed from "handled"
        nestedScrollEnabled={false}
      >
        {/* Main Form Container */}
        <View
          style={[
            styles.formContainer,
            {
              backgroundColor: "rgba(255, 255, 255, 0.95)",
              borderColor,
              overflow: "visible",
            },
          ]}
        >
          {/* Basic Info Section */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              Session Details
            </Text>

            {/* Session Title */}
            <View style={styles.compactFormRow}>
              <Text style={[styles.compactLabel, { color: colors.text }]}>
                Title<Text style={{ color: "red" }}> *</Text>
              </Text>
              <TextInput
                style={[
                  styles.compactInput,
                  { color: colors.text, borderColor },
                ]}
                placeholder="e.g. Saturday Morning Pickleball"
                placeholderTextColor={colors.text + "60"}
                value={sessionTitle}
                onChangeText={setSessionTitle}
              />
            </View>

            {/* Session Info */}
            <View style={styles.compactFormRow}>
              <Text style={[styles.compactLabel, { color: colors.text }]}>
                Additional Info
              </Text>
              <TextInput
                style={[
                  styles.compactInput,
                  styles.multilineInput,
                  { color: colors.text, borderColor },
                ]}
                placeholder="Add any additional details about the session..."
                placeholderTextColor={colors.text + "60"}
                value={sessionInfo}
                onChangeText={setSessionInfo}
                multiline={true}
                numberOfLines={3}
                textAlignVertical="top"
              />
            </View>

            {/* Location */}
            <View style={styles.compactFormRow}>
              <Text style={[styles.compactLabel, { color: colors.text }]}>
                Location<Text style={{ color: "red" }}> *</Text>
              </Text>
              <LocationAutocomplete
                value={location}
                onLocationChange={handleLocationChange}
                placeholder="Enter location"
                showCurrentLocationButton={false}
                searchType="full"
              />
            </View>
          </View>

          {/* Date & Time Section */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              When
            </Text>

            {/* Date */}
            <View style={styles.compactFormRow}>
              <Text style={[styles.compactLabel, { color: colors.text }]}>
                Date<Text style={{ color: "red" }}> *</Text>
              </Text>
              <Pressable
                style={[styles.compactInput, { borderColor }]}
                onPress={openCalendar}
              >
                <Ionicons
                  name="calendar-outline"
                  size={18}
                  color={colors.text + "80"}
                />
                <Text
                  style={[
                    styles.compactInputText,
                    { color: colors.text, marginLeft: 8 },
                  ]}
                >
                  {formatDate(date)}
                </Text>
              </Pressable>
            </View>

            {/* Time Row */}
            <View style={styles.compactTimeRow}>
              <View style={styles.compactTimeInput}>
                <Text style={[styles.compactLabel, { color: colors.text }]}>
                  Start<Text style={{ color: "red" }}> *</Text>
                </Text>
                <Pressable
                  style={[styles.compactInput, { borderColor }]}
                  onPress={openTimePicker}
                >
                  <Ionicons
                    name="time-outline"
                    size={18}
                    color={colors.text + "80"}
                  />
                  <Text
                    style={[
                      styles.compactInputText,
                      { color: colors.text, marginLeft: 8 },
                    ]}
                  >
                    {formatTime(startTime)}
                  </Text>
                </Pressable>
              </View>

              <View style={styles.compactTimeInput}>
                <Text style={[styles.compactLabel, { color: colors.text }]}>
                  End<Text style={{ color: "red" }}> *</Text>
                </Text>
                <Pressable
                  style={[styles.compactInput, { borderColor }]}
                  onPress={openEndTimePicker}
                >
                  <Ionicons
                    name="time-outline"
                    size={18}
                    color={colors.text + "80"}
                  />
                  <Text
                    style={[
                      styles.compactInputText,
                      { color: colors.text, marginLeft: 8 },
                    ]}
                  >
                    {formatTime(endTime)}
                  </Text>
                </Pressable>
              </View>
            </View>
          </View>

          {/* Session Settings Section */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              Settings
            </Text>

            {/* Visibility */}
            <View style={styles.compactFormRow}>
              <Text style={[styles.compactLabel, { color: colors.text }]}>
                Visibility
              </Text>
              <View style={styles.compactSegmentedControl}>
                {(["public", "friends", "private"] as Visibility[]).map(
                  (option) => (
                    <Pressable
                      key={option}
                      style={[
                        styles.compactSegmentButton,
                        {
                          backgroundColor:
                            visibility === option ? colors.tint : "transparent",
                          borderColor: colors.tint,
                          borderTopLeftRadius: option === "public" ? 8 : 0,
                          borderBottomLeftRadius: option === "public" ? 8 : 0,
                          borderTopRightRadius: option === "private" ? 8 : 0,
                          borderBottomRightRadius: option === "private" ? 8 : 0,
                        },
                      ]}
                      onPress={() => setVisibility(option)}
                    >
                      <Text
                        style={[
                          styles.compactSegmentButtonText,
                          {
                            color:
                              visibility === option ? "white" : colors.tint,
                          },
                        ]}
                      >
                        {option.charAt(0).toUpperCase() + option.slice(1)}
                      </Text>
                    </Pressable>
                  )
                )}
              </View>
            </View>

            {/* Max Players & Allow Guests Row */}
            <View style={styles.inlineSettingsRow}>
              <View style={styles.inlineSettingItem}>
                <Text style={[styles.inlineLabel, { color: colors.text }]}>
                  Max Players
                </Text>
                <TextInput
                  style={[
                    styles.inlineNumberInput,
                    { color: colors.text, borderColor },
                  ]}
                  placeholder="4"
                  placeholderTextColor={colors.text + "60"}
                  value={maxPlayers}
                  onChangeText={setMaxPlayers}
                  keyboardType="numeric"
                  maxLength={2}
                />
              </View>

              <View style={styles.inlineSettingItem}>
                <Text style={[styles.inlineLabel, { color: colors.text }]}>
                  Allow Guests
                </Text>
                <Pressable
                  style={[
                    styles.inlineCheckbox,
                    {
                      backgroundColor: allowGuests
                        ? colors.tint
                        : "transparent",
                      borderColor: colors.tint,
                    },
                  ]}
                  onPress={() => setAllowGuests(!allowGuests)}
                >
                  {allowGuests && (
                    <Ionicons name="checkmark" size={14} color="white" />
                  )}
                </Pressable>
              </View>
            </View>

            {/* DUPR Range */}
            <View style={styles.compactFormRow}>
              <Text style={[styles.compactLabel, { color: colors.text }]}>
                DUPR Range (Optional)
              </Text>
              <View style={styles.compactDuprRow}>
                <Pressable
                  style={[styles.compactDuprInput, { borderColor }]}
                  onPress={openDuprMinPicker}
                >
                  <Text
                    style={[
                      styles.compactInputText,
                      { color: duprMin ? colors.text : colors.text + "60" },
                    ]}
                  >
                    {duprMin ? duprMin.toFixed(2) : "Any"}
                  </Text>
                </Pressable>
                <Text
                  style={[styles.compactDuprSeparator, { color: colors.text }]}
                >
                  to
                </Text>
                <Pressable
                  style={[styles.compactDuprInput, { borderColor }]}
                  onPress={openDuprMaxPicker}
                >
                  <Text
                    style={[
                      styles.compactInputText,
                      { color: duprMax ? colors.text : colors.text + "60" },
                    ]}
                  >
                    {duprMax ? duprMax.toFixed(2) : "Any"}
                  </Text>
                </Pressable>
              </View>
            </View>
          </View>

          {/* Removed invite friends section - moved to InviteFriends screen */}
        </View>

        {/* Action Buttons */}
        <ActionButtons
          onCancel={handleCancel}
          onSave={handleSave}
          saveText="Save Entry"
        />
      </ScrollView>

      {/* Calendar Bottom Sheet */}
      <BottomSheet
        ref={calendarBottomSheetRef}
        snapPoints={snapPoints}
        index={-1}
        enablePanDownToClose={true}
        backgroundStyle={{
          backgroundColor: "rgba(255, 255, 255, 0.98)",
          borderRadius: 20,
          shadowColor: "#000",
          shadowOffset: { width: 0, height: -2 },
          shadowOpacity: 0.15,
          shadowRadius: 8,
          elevation: 6,
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

      {/* Start Time Bottom Sheet */}
      <BottomSheet
        ref={timeBottomSheetRef}
        snapPoints={timeSnapPoints}
        index={-1}
        enablePanDownToClose={true}
        backgroundStyle={{
          backgroundColor: "rgba(255, 255, 255, 0.98)",
          borderRadius: 20,
          shadowColor: "#000",
          shadowOffset: { width: 0, height: -2 },
          shadowOpacity: 0.15,
          shadowRadius: 8,
          elevation: 6,
        }}
        handleIndicatorStyle={{ backgroundColor: colors.text + "40" }}
      >
        <BottomSheetView style={styles.bottomSheetContent}>
          <View style={styles.bottomSheetHeader}>
            <Text style={[styles.bottomSheetTitle, { color: colors.text }]}>
              Select Start Time
            </Text>
            <Pressable onPress={closeTimePicker}>
              <Ionicons name="close" size={24} color={colors.text} />
            </Pressable>
          </View>
          <View style={styles.timePickerContainer}>
            <DateTimePicker
              value={startTime}
              mode="time"
              display="spinner"
              minuteInterval={15}
              onChange={handleTimeChange}
              style={styles.timePicker}
            />
          </View>
        </BottomSheetView>
      </BottomSheet>

      {/* End Time Bottom Sheet */}
      <BottomSheet
        ref={endTimeBottomSheetRef}
        snapPoints={timeSnapPoints}
        index={-1}
        enablePanDownToClose={true}
        backgroundStyle={{
          backgroundColor: "rgba(255, 255, 255, 0.98)",
          borderRadius: 20,
          shadowColor: "#000",
          shadowOffset: { width: 0, height: -2 },
          shadowOpacity: 0.15,
          shadowRadius: 8,
          elevation: 6,
        }}
        handleIndicatorStyle={{ backgroundColor: colors.text + "40" }}
      >
        <BottomSheetView style={styles.bottomSheetContent}>
          <View style={styles.bottomSheetHeader}>
            <Text style={[styles.bottomSheetTitle, { color: colors.text }]}>
              Select End Time
            </Text>
            <Pressable onPress={closeEndTimePicker}>
              <Ionicons name="close" size={24} color={colors.text} />
            </Pressable>
          </View>
          <View style={styles.timePickerContainer}>
            <DateTimePicker
              value={endTime}
              mode="time"
              display="spinner"
              minuteInterval={15}
              onChange={handleEndTimeChange}
              style={styles.timePicker}
            />
          </View>
        </BottomSheetView>
      </BottomSheet>

      {/* DUPR Min Bottom Sheet */}
      <BottomSheet
        ref={duprMinBottomSheetRef}
        snapPoints={duprSnapPoints}
        index={-1}
        enablePanDownToClose={true}
        backgroundStyle={{
          backgroundColor: "rgba(255, 255, 255, 0.98)",
          borderRadius: 20,
          shadowColor: "#000",
          shadowOffset: { width: 0, height: -2 },
          shadowOpacity: 0.15,
          shadowRadius: 8,
          elevation: 6,
        }}
        handleIndicatorStyle={{ backgroundColor: colors.text + "40" }}
      >
        <BottomSheetView style={styles.bottomSheetContent}>
          <View style={styles.bottomSheetHeader}>
            <Text style={[styles.bottomSheetTitle, { color: colors.text }]}>
              Select Minimum DUPR
            </Text>
            <Pressable onPress={closeDuprMinPicker}>
              <Ionicons name="close" size={24} color={colors.text} />
            </Pressable>
          </View>
          <Pressable
            style={[
              styles.duprOption,
              {
                backgroundColor: duprMin === null ? colors.tint : "transparent",
                borderColor: colors.text + "20",
              },
            ]}
            onPress={() => handleDuprMinSelect(null)}
          >
            <Text
              style={[
                styles.duprOptionText,
                {
                  color: duprMin === null ? "white" : colors.text,
                },
              ]}
            >
              Any
            </Text>
          </Pressable>
          <ScrollView style={styles.duprList}>
            {duprOptions.map((dupr) => (
              <Pressable
                key={dupr}
                style={[
                  styles.duprOption,
                  {
                    backgroundColor:
                      duprMin === dupr ? colors.tint : "transparent",
                    borderColor: colors.text + "20",
                  },
                ]}
                onPress={() => handleDuprMinSelect(dupr)}
              >
                <Text
                  style={[
                    styles.duprOptionText,
                    {
                      color: duprMin === dupr ? "white" : colors.text,
                    },
                  ]}
                >
                  {dupr.toFixed(2)}
                </Text>
              </Pressable>
            ))}
          </ScrollView>
        </BottomSheetView>
      </BottomSheet>

      {/* DUPR Max Bottom Sheet */}
      <BottomSheet
        ref={duprMaxBottomSheetRef}
        snapPoints={duprSnapPoints}
        index={-1}
        enablePanDownToClose={true}
        backgroundStyle={{
          backgroundColor: "rgba(255, 255, 255, 0.98)",
          borderRadius: 20,
          shadowColor: "#000",
          shadowOffset: { width: 0, height: -2 },
          shadowOpacity: 0.15,
          shadowRadius: 8,
          elevation: 6,
        }}
        handleIndicatorStyle={{ backgroundColor: colors.text + "40" }}
      >
        <BottomSheetView style={styles.bottomSheetContent}>
          <View style={styles.bottomSheetHeader}>
            <Text style={[styles.bottomSheetTitle, { color: colors.text }]}>
              Select Maximum DUPR
            </Text>
            <Pressable onPress={closeDuprMaxPicker}>
              <Ionicons name="close" size={24} color={colors.text} />
            </Pressable>
          </View>
          <Pressable
            style={[
              styles.duprOption,
              {
                backgroundColor: duprMax === null ? colors.tint : "transparent",
                borderColor: colors.text + "20",
              },
            ]}
            onPress={() => handleDuprMaxSelect(null)}
          >
            <Text
              style={[
                styles.duprOptionText,
                {
                  color: duprMax === null ? "white" : colors.text,
                },
              ]}
            >
              Any
            </Text>
          </Pressable>
          <ScrollView style={styles.duprList}>
            {duprOptions.map((dupr) => (
              <Pressable
                key={dupr}
                style={[
                  styles.duprOption,
                  {
                    backgroundColor:
                      duprMax === dupr ? colors.tint : "transparent",
                    borderColor: colors.text + "20",
                  },
                ]}
                onPress={() => handleDuprMaxSelect(dupr)}
              >
                <Text
                  style={[
                    styles.duprOptionText,
                    {
                      color: duprMax === dupr ? "white" : colors.text,
                    },
                  ]}
                >
                  {dupr.toFixed(2)}
                </Text>
              </Pressable>
            ))}
          </ScrollView>
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
    padding: 16,
    paddingBottom: 40,
    backgroundColor: "transparent",
  },
  formContainer: {
    borderWidth: 1,
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
  },
  // New compact styles
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 12,
  },
  compactFormRow: {
    marginBottom: 12,
  },
  compactLabel: {
    fontSize: 14,
    fontWeight: "500",
    marginBottom: 6,
  },
  compactInput: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  multilineInput: {
    minHeight: 80,
    alignItems: "flex-start",
    paddingTop: 10,
  },
  compactInputText: {
    fontSize: 14,
    fontWeight: "500",
  },
  compactTimeRow: {
    flexDirection: "row",
    gap: 8,
  },
  compactTimeInput: {
    flex: 1,
  },
  compactSegmentedControl: {
    flexDirection: "row",
    borderRadius: 8,
    // borderWidth: 1,
    overflow: "hidden",
  },
  compactSegmentButton: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    alignItems: "center",
    borderWidth: 1,
  },
  compactSegmentButtonText: {
    fontSize: 14,
    fontWeight: "500",
  },
  compactSettingsRow: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 12,
  },
  compactSettingItem: {
    flex: 1,
  },
  compactNumberInput: {
    fontSize: 14,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: 1,
    borderRadius: 10,
    width: 70,
    textAlign: "center",
  },
  compactCheckbox: {
    width: 20,
    height: 20,
    borderWidth: 2,
    borderRadius: 4,
    alignItems: "center",
    justifyContent: "center",
  },
  compactDuprRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  compactDuprInput: {
    flex: 1,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: 1,
    borderRadius: 10,
    alignItems: "center",
  },
  compactDuprSeparator: {
    fontSize: 14,
    fontWeight: "500",
  },
  // Inline settings styles
  inlineSettingsRow: {
    flexDirection: "row",
    gap: 16,
    marginBottom: 12,
  },
  inlineSettingItem: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  inlineLabel: {
    fontSize: 14,
    fontWeight: "500",
    marginRight: 8,
  },
  inlineNumberInput: {
    fontSize: 14,
    paddingHorizontal: 8,
    paddingVertical: 8,
    borderWidth: 1,
    borderRadius: 8,
    width: 50,
    textAlign: "center",
  },
  inlineCheckbox: {
    width: 20,
    height: 20,
    borderWidth: 2,
    borderRadius: 4,
    alignItems: "center",
    justifyContent: "center",
  },
  // Legacy styles (keeping for compatibility)
  formRow: {
    marginBottom: 16,
  },
  timeRow: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 16,
  },
  label: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 8,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  inputText: {
    fontSize: 16,
    fontWeight: "500",
  },
  sectionHeader: {
    marginTop: 8,
    marginBottom: 16,
  },
  sectionSubtitle: {
    fontSize: 14,
    marginTop: 4,
    marginBottom: 16,
  },
  segmentedControl: {
    flexDirection: "row",
  },
  segmentButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignItems: "center",
    borderWidth: 1,
  },
  segmentButtonText: {
    fontSize: 16,
    fontWeight: "600",
  },
  numberInput: {
    fontSize: 16,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderWidth: 1,
    borderRadius: 12,
    width: 80,
    textAlign: "center",
  },
  checkbox: {
    width: 24,
    height: 24,
    borderWidth: 2,
    borderRadius: 4,
    alignItems: "center",
    justifyContent: "center",
  },
  duprRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  duprInput: {
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderWidth: 1,
    borderRadius: 12,
    alignItems: "center",
  },
  duprSeparator: {
    fontSize: 16,
    fontWeight: "500",
  },
  friendsSection: {
    marginTop: 16,
    marginBottom: 16,
  },
  friendItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 8,
  },
  friendActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  smsButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  selectionButton: {
    padding: 4,
  },
  sendSMSButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    marginBottom: 16,
    gap: 8,
  },
  sendSMSText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
  },
  friendInfo: {
    flex: 1,
  },
  friendName: {
    fontSize: 16,
    fontWeight: "500",
  },
  friendPhone: {
    fontSize: 14,
    marginTop: 2,
  },
  loadingContainer: {
    padding: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  loadingText: {
    fontSize: 16,
    textAlign: "center",
  },
  emptyContainer: {
    padding: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyText: {
    fontSize: 16,
    textAlign: "center",
  },
  avatarContainer: {
    marginRight: 12,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  defaultAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(0, 0, 0, 0.1)",
    alignItems: "center",
    justifyContent: "center",
  },
  bottomSheetContent: {
    flex: 1,
    padding: 16,
  },
  bottomSheetHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
    backgroundColor: "transparent",
  },
  bottomSheetTitle: {
    fontSize: 18,
    fontWeight: "600",
  },
  timePickerContainer: {
    alignItems: "center",
    justifyContent: "center",
    minHeight: 160,
  },
  timePicker: {
    width: "100%",
    height: 160,
  },
  duprList: {
    maxHeight: 250,
  },
  duprOption: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    alignItems: "center",
  },
  duprOptionText: {
    fontSize: 16,
    fontWeight: "500",
  },
})
