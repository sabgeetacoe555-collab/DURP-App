import React from "react"
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
} from "react-native"
import { useRouter } from "expo-router"
import FontAwesome5 from "@expo/vector-icons/FontAwesome5"
import { Ionicons } from "@expo/vector-icons"
import { useColorScheme } from "@/components/useColorScheme"
import Colors from "@/constants/Colors"

interface GroupHeaderProps {
  groupName: string
  canManageGroup?: boolean
  isCurrentUserAdmin?: boolean
  isCurrentUserMember?: boolean
  onEditPress?: () => void
  onDeletePress?: () => void
}

export default function GroupHeader({
  groupName,
  canManageGroup = false,
  isCurrentUserAdmin = false,
  isCurrentUserMember = false,
  onEditPress,
  onDeletePress,
}: GroupHeaderProps) {
  const router = useRouter()
  const colors = useColorScheme()

  const handleBackPress = () => {
    if (router.canGoBack()) {
      router.back()
    }
  }

  return (
    <SafeAreaView
      style={[styles.container, { borderBottomColor: colors.text + "20" }]}
    >
      <View style={styles.header}>
        {/* Left side - Back button */}
        <View style={styles.leftSection}>
          <TouchableOpacity style={styles.backButton} onPress={handleBackPress}>
            <FontAwesome5 name="chevron-left" size={20} color={colors.text} />
          </TouchableOpacity>
        </View>

        {/* Center section - Group name */}
        <View style={styles.centerSection}>
          <Text
            style={[styles.groupName, { color: colors.text }]}
            numberOfLines={1}
          >
            {groupName}
          </Text>
        </View>

        {/* Right section - Group Actions */}
        <View style={styles.rightSection}>
          {canManageGroup && (
            <TouchableOpacity style={styles.actionButton} onPress={onEditPress}>
              <Ionicons name="create-outline" size={20} color={colors.text} />
            </TouchableOpacity>
          )}
          {(isCurrentUserAdmin || isCurrentUserMember) && (
            <TouchableOpacity
              style={styles.actionButton}
              onPress={onDeletePress}
            >
              <Ionicons name="trash-outline" size={20} color="#ff4444" />
            </TouchableOpacity>
          )}
        </View>
      </View>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    borderBottomWidth: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    minHeight: 60,
  },
  leftSection: {
    width: 40,
    alignItems: "flex-start",
  },
  backButton: {
    padding: 8,
  },
  centerSection: {
    flex: 1,
    alignItems: "center",
  },
  groupName: {
    fontSize: 18,
    fontWeight: "bold",
    textAlign: "center",
  },
  rightSection: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    width: 40,
    justifyContent: "flex-end",
  },
  actionButton: {
    padding: 6,
  },
})
