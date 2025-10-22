import React, { useState, useEffect } from "react"
import { StyleSheet, ScrollView, ActivityIndicator } from "react-native"
import { Text, View } from "@/components/Themed"
import { sessionService } from "@/services/sessionService"
import { supabase } from "@/lib/supabase"
import { User } from "@/types"

interface UserStat {
  id: string
  title: string
  description: string
  value: string | number
  icon: string
  loading: boolean
}

export default function LeadersScreen() {
  const [userStats, setUserStats] = useState<UserStat[]>([
    {
      id: "total_sessions",
      title: "Total Sessions",
      description: "Completed pickleball sessions",
      value: 0,
      icon: "🏓",
      loading: true,
    },
    {
      id: "current_streak",
      title: "Current Streak",
      description: "Consecutive weeks with sessions",
      value: 0,
      icon: "🔥",
      loading: true,
    },
    {
      id: "avg_mood",
      title: "Average Mood",
      description: "Your overall session happiness",
      value: "N/A",
      icon: "😊",
      loading: true,
    },
    {
      id: "avg_confidence",
      title: "Body Readiness",
      description: "Your overall physical readiness",
      value: "N/A",
      icon: "💪",
      loading: true,
    },
    {
      id: "dupr_rating",
      title: "DUPR Rating",
      description: "Your current skill rating",
      value: "N/A",
      icon: "⭐",
      loading: true,
    },
    {
      id: "avg_sessions_per_week",
      title: "Avg Sessions/Week",
      description: "Average sessions per week",
      value: 0,
      icon: "📊",
      loading: true,
    },
  ])

  useEffect(() => {
    loadUserStats()
  }, [])

  const loadUserStats = async () => {
    try {
      await Promise.all([
        loadTotalSessions(),
        loadCurrentStreak(),
        loadAverageMood(),
        loadAverageConfidence(),
        loadDuprRating(),
        loadAverageSessionsPerWeek(),
      ])
    } catch (error) {
      console.error("Error loading user stats:", error)
    }
  }

  const loadTotalSessions = async () => {
    try {
      const data = await sessionService.getMostSessionsLeaderboard()
      const currentUserId = await getCurrentUserId()
      const currentUser = data.find((item) => item.userId === currentUserId)
      updateStat("total_sessions", currentUser?.score || 0)
    } catch (error) {
      console.error("Error loading total sessions:", error)
      updateStat("total_sessions", 0)
    }
  }

  const loadCurrentStreak = async () => {
    try {
      const sessions = await sessionService.getSessions()
      const currentUserId = await getCurrentUserId()
      const userSessions = sessions.filter(
        (s) => s.user_id === currentUserId && s.completed
      )

      // Group sessions by week
      const sessionsByWeek = userSessions.reduce((acc, session) => {
        const weekStart = getWeekStart(new Date(session.date))
        const weekKey = weekStart.toISOString().split("T")[0]
        if (!acc[weekKey]) acc[weekKey] = []
        acc[weekKey].push(session)
        return acc
      }, {} as Record<string, any[]>)

      // Sort weeks descending
      const weeks = Object.keys(sessionsByWeek).sort().reverse()
      let streak = 0
      let currentWeek = getWeekStart(new Date())

      for (const weekKey of weeks) {
        const weekDate = new Date(weekKey)
        const weeksDiff = getWeeksDifference(currentWeek, weekDate)

        if (weeksDiff === streak) {
          streak++
        } else {
          break
        }
      }

      updateStat("current_streak", streak)
    } catch (error) {
      console.error("Error loading current streak:", error)
      updateStat("current_streak", 0)
    }
  }

  const loadAverageMood = async () => {
    try {
      const sessions = await sessionService.getSessions()
      const currentUserId = await getCurrentUserId()
      const userSessions = sessions.filter(
        (s) => s.user_id === currentUserId && s.completed && s.mood
      )

      if (userSessions.length === 0) {
        updateStat("avg_mood", "N/A")
        return
      }

      const totalMood = userSessions.reduce(
        (sum, session) => sum + (session.mood || 0),
        0
      )
      const avgMood = totalMood / userSessions.length

      // Convert numeric rating to Bad/Ok/Good
      let moodText = "N/A"
      if (avgMood <= 3.33) {
        moodText = "Bad"
      } else if (avgMood <= 6.66) {
        moodText = "Ok"
      } else {
        moodText = "Good"
      }

      updateStat("avg_mood", moodText)
    } catch (error) {
      console.error("Error loading average mood:", error)
      updateStat("avg_mood", "N/A")
    }
  }

  const loadAverageConfidence = async () => {
    try {
      const sessions = await sessionService.getSessions()
      const currentUserId = await getCurrentUserId()
      const userSessions = sessions.filter(
        (s) => s.user_id === currentUserId && s.completed && s.body_readiness
      )

      if (userSessions.length === 0) {
        updateStat("avg_confidence", "N/A")
        return
      }

      const totalReadiness = userSessions.reduce(
        (sum, session) => sum + (session.body_readiness || 0),
        0
      )
      const avgReadiness = totalReadiness / userSessions.length

      // Convert numeric rating to tired/average/great
      let readinessText = "N/A"
      if (avgReadiness <= 3.33) {
        readinessText = "Tired"
      } else if (avgReadiness <= 6.66) {
        readinessText = "Average"
      } else {
        readinessText = "Great"
      }

      updateStat("avg_confidence", readinessText)
    } catch (error) {
      console.error("Error loading body readiness:", error)
      updateStat("avg_confidence", "N/A")
    }
  }

  const loadDuprRating = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) throw new Error("User not authenticated")

      const { data: userData } = await supabase
        .from("users")
        .select("dupr_rating_singles, dupr_rating_doubles")
        .eq("id", user.id)
        .single()

      const duprRating =
        userData?.dupr_rating_singles || userData?.dupr_rating_doubles
      const value = duprRating ? duprRating.toFixed(2) : "N/A"
      updateStat("dupr_rating", value)
    } catch (error) {
      console.error("Error loading DUPR rating:", error)
      updateStat("dupr_rating", "N/A")
    }
  }

  const loadAverageSessionsPerWeek = async () => {
    try {
      const sessions = await sessionService.getSessions()
      const currentUserId = await getCurrentUserId()
      const userSessions = sessions.filter(
        (s) => s.user_id === currentUserId && s.completed
      )

      if (userSessions.length === 0) {
        updateStat("avg_sessions_per_week", 0)
        return
      }

      // Group sessions by week
      const sessionsByWeek = userSessions.reduce((acc, session) => {
        const weekStart = getWeekStart(new Date(session.date))
        const weekKey = weekStart.toISOString().split("T")[0]
        if (!acc[weekKey]) acc[weekKey] = []
        acc[weekKey].push(session)
        return acc
      }, {} as Record<string, any[]>)

      const totalWeeks = Object.keys(sessionsByWeek).length
      const totalSessions = userSessions.length
      const avgSessionsPerWeek =
        totalWeeks > 0 ? Math.round((totalSessions / totalWeeks) * 10) / 10 : 0

      updateStat("avg_sessions_per_week", avgSessionsPerWeek)
    } catch (error) {
      console.error("Error loading average sessions per week:", error)
      updateStat("avg_sessions_per_week", 0)
    }
  }

  const getCurrentUserId = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser()
    return user?.id
  }

  const getWeekStart = (date: Date) => {
    const d = new Date(date)
    const day = d.getDay()
    const diff = d.getDate() - day + (day === 0 ? -6 : 1) // Adjust when day is Sunday
    return new Date(d.setDate(diff))
  }

  const getWeeksDifference = (date1: Date, date2: Date) => {
    const diffTime = Math.abs(date1.getTime() - date2.getTime())
    const diffWeeks = Math.ceil(diffTime / (1000 * 60 * 60 * 24 * 7))
    return diffWeeks
  }

  const updateStat = (id: string, value: string | number) => {
    setUserStats((prev) =>
      prev.map((stat) =>
        stat.id === id ? { ...stat, value, loading: false } : stat
      )
    )
  }

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Your Stats</Text>
      <Text style={styles.subtitle}>
        Track your pickleball journey and personal achievements
      </Text>

      <View style={styles.statsGrid}>
        {userStats.map((stat) => (
          <View key={stat.id} style={styles.statCard}>
            <View style={styles.statHeader}>
              <Text style={styles.statIcon}>{stat.icon}</Text>
              <Text style={styles.statTitle}>{stat.title}</Text>
            </View>

            {stat.loading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="small" color="#000" />
              </View>
            ) : (
              <Text style={styles.statValue}>{stat.value}</Text>
            )}

            <Text style={styles.statDescription}>{stat.description}</Text>
          </View>
        ))}
      </View>

      <View style={styles.achievementsSection}>
        <Text style={styles.sectionTitle}>Recent Achievements</Text>
        <View style={styles.achievementCard}>
          <Text style={styles.achievementIcon}>🎯</Text>
          <View style={styles.achievementContent}>
            <Text style={styles.achievementTitle}>First Session Complete!</Text>
            <Text style={styles.achievementDescription}>
              You completed your first pickleball session. Keep up the great
              work!
            </Text>
          </View>
        </View>
      </View>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: "#ffffff",
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    marginBottom: 8,
    textAlign: "center",
    color: "#000",
  },
  subtitle: {
    fontSize: 16,
    textAlign: "center",
    opacity: 0.7,
    marginBottom: 30,
    color: "#000",
  },
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    marginBottom: 30,
    backgroundColor: "#ffffff",
  },
  statCard: {
    width: "48%",
    backgroundColor: "rgba(255, 255, 255, 0.8)",
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
    backgroundColor: "#ffffff",
  },
  statIcon: {
    fontSize: 20,
    marginRight: 8,
  },
  statTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#000",
    flex: 1,
  },
  statValue: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#4CAF50",
    marginBottom: 4,
  },
  statDescription: {
    fontSize: 12,
    opacity: 0.7,
    color: "#000",
  },
  loadingContainer: {
    height: 30,
    justifyContent: "center",
    alignItems: "center",
  },
  achievementsSection: {
    marginTop: 20,
    paddingBottom: 100,
    backgroundColor: "#ffffff",
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 16,
    color: "#000",
  },
  achievementCard: {
    flexDirection: "row",
    backgroundColor: "rgba(255, 255, 255, 0.8)",
    borderRadius: 12,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  achievementIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  achievementContent: {
    flex: 1,
    backgroundColor: "#ffffff",
  },
  achievementTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 4,
    color: "#000",
  },
  achievementDescription: {
    fontSize: 14,
    opacity: 0.7,
    color: "#000",
  },
})
