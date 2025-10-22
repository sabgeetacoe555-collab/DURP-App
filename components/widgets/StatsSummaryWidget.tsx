import React, { useEffect, useState } from "react"
import { StyleSheet, Pressable, View, ActivityIndicator } from "react-native"
import { Text } from "@/components/Themed"
import { useAuth } from "@/contexts/AuthContext"
import { sessionService } from "@/services/sessionService"
import { supabase } from "@/lib/supabase"
import { Ionicons } from "@expo/vector-icons"
import { useRouter } from "expo-router"

interface StatItem {
  id: string
  title: string
  value: string | number
  icon: string
  loading: boolean
}

export default function StatsSummaryWidget() {
  const { user } = useAuth()
  const router = useRouter()
  const [stats, setStats] = useState<StatItem[]>([
    {
      id: "total_sessions",
      title: "Total Sessions",
      value: 0,
      icon: "🏓",
      loading: true,
    },
    {
      id: "current_streak",
      title: "Current Streak",
      value: 0,
      icon: "🔥",
      loading: true,
    },
    {
      id: "avg_sessions_per_week",
      title: "Avg/Week",
      value: 0,
      icon: "📊",
      loading: true,
    },
  ])

  useEffect(() => {
    if (user) {
      loadStats()
    }
  }, [user])

  const loadStats = async () => {
    try {
      await Promise.all([
        loadTotalSessions(),
        loadCurrentStreak(),
        loadAverageSessionsPerWeek(),
      ])
    } catch (error) {
      console.error("Error loading stats:", error)
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
        const weekStart = getWeekStart(new Date(session.session_datetime))
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
        const weekStart = getWeekStart(new Date(session.session_datetime))
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
    setStats((prev) =>
      prev.map((stat) =>
        stat.id === id ? { ...stat, value, loading: false } : stat
      )
    )
  }

  const handleViewAll = () => {
    router.push("/leaders")
  }

  if (!user) {
    return null
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Your Stats</Text>
        <Pressable style={styles.viewAllButton} onPress={handleViewAll}>
          <Text style={styles.viewAllText}>View All</Text>
        </Pressable>
      </View>

      <View style={styles.statsRow}>
        {stats.map((stat) => (
          <View key={stat.id} style={styles.statItem}>
            <Text style={styles.statIcon}>{stat.icon}</Text>
            {stat.loading ? (
              <ActivityIndicator size="small" color="#4CAF50" />
            ) : (
              <Text style={styles.statValue}>{stat.value}</Text>
            )}
            <Text style={styles.statTitle}>{stat.title}</Text>
          </View>
        ))}
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: "rgba(255, 255, 255, 0.9)",
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#000",
  },
  viewAllButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: "#4CAF50",
    borderRadius: 8,
  },
  viewAllText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "600",
  },
  statsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  statItem: {
    flex: 1,
    alignItems: "center",
    paddingHorizontal: 8,
  },
  statIcon: {
    fontSize: 24,
    marginBottom: 8,
  },
  statValue: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#4CAF50",
    marginBottom: 4,
  },
  statTitle: {
    fontSize: 12,
    color: "#666",
    textAlign: "center",
    fontWeight: "500",
  },
})
