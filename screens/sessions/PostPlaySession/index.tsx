import React, { useState, useEffect } from "react"
import { StyleSheet, ScrollView, Alert, View } from "react-native"
import { Text } from "@/components/Themed"
import { Ionicons } from "@expo/vector-icons"
import { useColorScheme } from "@/components/useColorScheme"
import Colors from "@/constants/Colors"
import { useRouter, useLocalSearchParams } from "expo-router"
import RadioCard from "../common/RadioCard"
import CheckboxCard from "../common/CheckboxCard"
import SliderCard from "../common/SliderCard"
import ActionButtons from "../common/ActionButtons"
import { sessionService } from "@/services/sessionService"
import { Session } from "@/types"

type CompletionStatus = "yes" | "no" | "mixed"
type GoalAchievement = "yes" | "no" | "mixed"
type ReflectionTag =
  | "stayed calm"
  | "finished strong"
  | "missed opps"
  | "learned something new"
  | "need practice"

export default function PostPlaySessionScreen() {
  const colors = useColorScheme()
  const router = useRouter()
  const { sessionId } = useLocalSearchParams<{ sessionId: string }>()

  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)

  // State management
  const [completionStatus, setCompletionStatus] =
    useState<CompletionStatus | null>(null)
  const [goalAchievement, setGoalAchievement] =
    useState<GoalAchievement | null>(null)
  const [reflectionTags, setReflectionTags] = useState<ReflectionTag[]>([])
  const [confidence, setConfidence] = useState(3)
  const [intensity, setIntensity] = useState(3)

  const completionOptions: CompletionStatus[] = ["yes", "no", "mixed"]
  const goalOptions: GoalAchievement[] = ["yes", "no", "mixed"]
  const reflectionOptions: ReflectionTag[] = [
    "stayed calm",
    "finished strong",
    "missed opps",
    "learned something new",
    "need practice",
  ]

  // Load session data when component mounts
  useEffect(() => {
    const loadSession = async () => {
      setLoading(true)
      let sessionToLoad: Session | null = null

      if (!sessionId) {
        // No session ID provided, try to find the last incomplete session
        try {
          sessionToLoad = await sessionService.getLastIncompleteSession()
          if (!sessionToLoad) {
            Alert.alert(
              "No Incomplete Sessions",
              "No incomplete sessions found. Please create a new session first.",
              [
                {
                  text: "OK",
                  onPress: () => {
                    router.push("/(tabs)/sessions")
                  },
                },
              ]
            )
            setLoading(false)
            return
          }
          // Update the URL to include the session ID for better UX
          router.setParams({ sessionId: sessionToLoad.id })
        } catch (error) {
          console.error("Error finding last incomplete session:", error)
          Alert.alert("Error", "Failed to find incomplete session")
          router.push("/(tabs)/sessions")
          setLoading(false)
          return
        }
      } else {
        // Session ID provided, load that specific session
        try {
          sessionToLoad = await sessionService.getSessionById(sessionId)
        } catch (error) {
          console.error("Error loading session:", error)
          Alert.alert("Error", "Failed to load session data")
          router.back()
          setLoading(false)
          return
        }
      }

      if (sessionToLoad) {
        setSession(sessionToLoad)

        // Pre-populate with existing data if session is already completed
        if (sessionToLoad.completed) {
          setCompletionStatus("yes")
          setConfidence(sessionToLoad.confidence || 3)
          setIntensity(sessionToLoad.intensity || 3)
          setGoalAchievement(
            (sessionToLoad.goal_achievement as GoalAchievement) || null
          )
          setReflectionTags(
            (sessionToLoad.reflection_tags as ReflectionTag[]) || []
          )
        }
      }

      setLoading(false)
    }

    loadSession()
  }, [sessionId])

  const handleSave = async () => {
    if (!session) {
      Alert.alert("Error", "No session data available")
      return
    }

    // Validate required fields
    if (!completionStatus) {
      Alert.alert(
        "Missing Information",
        "Please indicate if you completed the session"
      )
      return
    }

    try {
      // Prepare update data
      const updateData: Partial<Session> = {
        completed: completionStatus === "yes",
        confidence,
        intensity,
        goal_achievement: goalAchievement || undefined,
        reflection_tags: reflectionTags,
      }

      // Update session in database
      await sessionService.updateSession(session.id, updateData)

      Alert.alert("Success", "Your post-play session has been saved!", [
        {
          text: "OK",
          onPress: () => {
            // Navigate back to sessions tab
            router.push("/(tabs)/sessions")
          },
        },
      ])
    } catch (error) {
      console.error("Error saving post-play session:", error)
      // Error handling is already done in the service
    }
  }

  const handleCancel = () => {
    router.back()
  }

  if (loading) {
    return (
      <View
        style={[styles.container, { backgroundColor: "rgba(0, 128, 192, 1)" }]}
      >
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading session...</Text>
        </View>
      </View>
    )
  }

  if (!session) {
    return (
      <View
        style={[styles.container, { backgroundColor: "rgba(0, 128, 192, 1)" }]}
      >
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Session not found</Text>
        </View>
      </View>
    )
  }

  return (
    <View style={{ flex: 1 }}>
      <ScrollView
        style={[styles.container, { backgroundColor: "rgba(0, 128, 192, 1)" }]}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* Row 1: Title */}
        <View style={[styles.headerRow, { backgroundColor: "transparent" }]}>
          <Ionicons name="calendar-outline" size={24} color="white" />
          <Text style={styles.headerText}>Reflect on Your Session</Text>
        </View>

        {/* Session Info Display */}
        <View
          style={[styles.sessionInfoRow, { backgroundColor: "transparent" }]}
        >
          <Text style={styles.sessionInfoText}>
            {session.session_type
              ? session.session_type.charAt(0).toUpperCase() +
                session.session_type.slice(1)
              : session.name || "Session"}{" "}
            - {new Date(session.date).toLocaleDateString()}
          </Text>
          {session.location && (
            <Text style={styles.sessionInfoText}>📍 {session.location}</Text>
          )}
        </View>

        {/* Row 2: Session Completion */}
        <View style={[styles.row, { backgroundColor: "transparent" }]}>
          <RadioCard
            title="Did you complete this session?"
            options={completionOptions}
            selectedValue={completionStatus}
            onSelectionChange={setCompletionStatus}
          />
        </View>

        {/* Row 3: Confidence Slider */}
        <View style={[styles.row, { backgroundColor: "transparent" }]}>
          <SliderCard
            title="Confidence after session?"
            value={confidence}
            onValueChange={setConfidence}
            minValue={1}
            maxValue={5}
            step={1}
            showTicks={true}
          />
        </View>

        {/* Row 4: Intensity Slider */}
        <View style={[styles.row, { backgroundColor: "transparent" }]}>
          <SliderCard
            title="Intensity"
            value={intensity}
            onValueChange={setIntensity}
            minValue={1}
            maxValue={5}
            step={1}
            showTicks={true}
          />
        </View>

        {/* Row 5: Goal Achievement */}
        <View style={[styles.row, { backgroundColor: "transparent" }]}>
          <RadioCard
            title="Goal achievement"
            options={goalOptions}
            selectedValue={goalAchievement}
            onSelectionChange={setGoalAchievement}
          />
        </View>

        {/* Row 6: Reflection Tags */}
        <View style={[styles.row, { backgroundColor: "transparent" }]}>
          <CheckboxCard
            title="Reflection tags"
            options={reflectionOptions}
            selectedValues={reflectionTags}
            onSelectionChange={setReflectionTags}
          />
        </View>

        {/* Action Buttons */}
        <ActionButtons onCancel={handleCancel} onSave={handleSave} />
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentContainer: {
    padding: 20,
    paddingBottom: 40,
    backgroundColor: "transparent",
  },
  row: {
    marginBottom: 16,
    flexDirection: "row",
    gap: 12,
    backgroundColor: "transparent",
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
  sessionInfoRow: {
    marginBottom: 20,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  sessionInfoText: {
    fontSize: 16,
    color: "white",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    fontSize: 18,
    fontWeight: "bold",
    color: "white",
  },
})
