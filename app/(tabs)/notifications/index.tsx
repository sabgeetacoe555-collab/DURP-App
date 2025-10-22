import React, { useState } from "react"
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  SafeAreaView,
} from "react-native"
import { useRouter } from "expo-router"
import FontAwesome from "@expo/vector-icons/FontAwesome"

interface Notification {
  id: string
  title: string
  message: string
  timestamp: string
  isRead: boolean
  type: "session" | "achievement" | "reminder" | "general"
}

export default function NotificationsScreen() {
  const router = useRouter()
  const [notifications, setNotifications] = useState<Notification[]>([
    {
      id: "1",
      title: "New Achievement Unlocked!",
      message: "Congratulations! You've completed 10 sessions this month.",
      timestamp: "2 hours ago",
      isRead: false,
      type: "achievement",
    },
    {
      id: "2",
      title: "Session Reminder",
      message: "Don't forget your scheduled session tomorrow at 3:00 PM.",
      timestamp: "1 day ago",
      isRead: false,
      type: "reminder",
    },
    {
      id: "3",
      title: "Weekly Progress Report",
      message: "Your weekly progress report is ready. Check it out!",
      timestamp: "3 days ago",
      isRead: true,
      type: "session",
    },
    {
      id: "4",
      title: "Welcome to NetGains!",
      message:
        "We're excited to have you on board. Start your first session today!",
      timestamp: "1 week ago",
      isRead: true,
      type: "general",
    },
  ])

  const markAsRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((notification) =>
        notification.id === id
          ? { ...notification, isRead: true }
          : notification
      )
    )
  }

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "achievement":
        return "trophy"
      case "reminder":
        return "clock-o"
      case "session":
        return "calendar"
      default:
        return "info-circle"
    }
  }

  const getNotificationColor = (type: string) => {
    switch (type) {
      case "achievement":
        return "#FFD700"
      case "reminder":
        return "#FF6B6B"
      case "session":
        return "#4ECDC4"
      default:
        return "#95A5A6"
    }
  }

  const renderNotification = ({ item }: { item: Notification }) => (
    <TouchableOpacity
      style={[
        styles.notificationItem,
        !item.isRead && styles.unreadNotification,
      ]}
      onPress={() => markAsRead(item.id)}
    >
      <View style={styles.notificationHeader}>
        <View style={styles.iconContainer}>
          <FontAwesome
            name={getNotificationIcon(item.type) as any}
            size={16}
            color={getNotificationColor(item.type)}
          />
        </View>
        <View style={styles.notificationContent}>
          <Text style={styles.notificationTitle}>{item.title}</Text>
          <Text style={styles.notificationMessage}>{item.message}</Text>
          <Text style={styles.notificationTime}>{item.timestamp}</Text>
        </View>
        {!item.isRead && <View style={styles.unreadDot} />}
      </View>
    </TouchableOpacity>
  )

  const unreadCount = notifications.filter((n) => !n.isRead).length

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        {unreadCount > 0 && (
          <View style={styles.markAllReadContainer}>
            <TouchableOpacity
              style={styles.markAllReadButton}
              onPress={() =>
                setNotifications((prev) =>
                  prev.map((n) => ({ ...n, isRead: true }))
                )
              }
            >
              <Text style={styles.markAllReadText}>Mark all read</Text>
            </TouchableOpacity>
          </View>
        )}

        {notifications.length === 0 ? (
          <View style={styles.emptyState}>
            <FontAwesome name="bell-slash" size={48} color="#95A5A6" />
            <Text style={styles.emptyStateTitle}>No notifications</Text>
            <Text style={styles.emptyStateMessage}>
              You're all caught up! Check back later for updates.
            </Text>
          </View>
        ) : (
          <FlatList
            data={notifications}
            renderItem={renderNotification}
            keyExtractor={(item) => item.id}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.notificationsList}
          />
        )}
      </View>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8F9FA",
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
  },
  markAllReadContainer: {
    alignItems: "flex-end",
    paddingVertical: 12,
  },
  markAllReadButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: "rgba(0, 128, 192, 1)",
    borderRadius: 16,
  },
  markAllReadText: {
    color: "white",
    fontSize: 12,
    fontWeight: "500",
  },
  notificationsList: {
    paddingTop: 8,
  },
  notificationItem: {
    backgroundColor: "white",
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  unreadNotification: {
    borderLeftWidth: 4,
    borderLeftColor: "rgba(0, 128, 192, 1)",
  },
  notificationHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
  },
  iconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#F8F9FA",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  notificationContent: {
    flex: 1,
  },
  notificationTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#212529",
    marginBottom: 4,
  },
  notificationMessage: {
    fontSize: 14,
    color: "#6C757D",
    lineHeight: 20,
    marginBottom: 8,
  },
  notificationTime: {
    fontSize: 12,
    color: "#ADB5BD",
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "rgba(0, 128, 192, 1)",
    marginLeft: 8,
    marginTop: 4,
  },
  emptyState: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 32,
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#6C757D",
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateMessage: {
    fontSize: 14,
    color: "#ADB5BD",
    textAlign: "center",
    lineHeight: 20,
  },
})
