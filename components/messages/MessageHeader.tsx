import React from "react"
import { View, Text, StyleSheet, Pressable } from "react-native"
import { Ionicons } from "@expo/vector-icons"

interface MessageHeaderProps {
  showSearch: boolean
  showArchived: boolean
  onSearchToggle: () => void
  onArchiveToggle: () => void
  colors: any
  compact?: boolean
}

export const MessageHeader: React.FC<MessageHeaderProps> = ({
  showSearch,
  showArchived,
  onSearchToggle,
  onArchiveToggle,
  colors,
  compact = false,
}) => {
  if (compact) {
    return (
      <View
        style={[
          styles.headerContainer,
          {
            borderBottomColor: colors.border,
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
          },
        ]}
      >
        <View style={styles.headerTitle}>
          <Text style={[styles.headerTitleText, { color: colors.text }]}>
            Session Message Board
          </Text>
        </View>
        <Pressable
          style={{ ...styles.headerButton, width: 50, flex: 0 }}
          onPress={onSearchToggle}
        >
          <Ionicons name="search" size={20} color={colors.text} />

          {/* <Text
            style={[
              styles.headerButtonText,
              { color: showSearch ? "white" : colors.text },
            ]}
          >
            Search
          </Text> */}
        </Pressable>
      </View>
    )
  }

  return (
    <View
      style={[styles.headerContainer, { borderBottomColor: colors.border }]}
    >
      <View style={styles.headerButtons}>
        <Pressable
          style={[
            styles.headerButton,
            {
              borderColor: colors.border,
              backgroundColor: showSearch ? colors.tint : "transparent",
            },
          ]}
          onPress={onSearchToggle}
        >
          <Ionicons
            name="search"
            size={20}
            color={showSearch ? "white" : colors.text}
          />
          <Text
            style={[
              styles.headerButtonText,
              { color: showSearch ? "white" : colors.text },
            ]}
          >
            Search
          </Text>
        </Pressable>

        <Pressable
          style={[
            styles.headerButton,
            {
              borderColor: colors.border,
              backgroundColor: showArchived ? colors.tint : "transparent",
            },
          ]}
          onPress={onArchiveToggle}
        >
          <Ionicons
            name="archive"
            size={20}
            color={showArchived ? "white" : colors.text}
          />
          <Text
            style={[
              styles.headerButtonText,
              { color: showArchived ? "white" : colors.text },
            ]}
          >
            {showArchived ? "Active" : "Archived"}
          </Text>
        </Pressable>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  headerContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  headerTitle: {
    flex: 1,
  },
  headerTitleText: {
    fontSize: 16,
    fontWeight: "600",
  },
  headerButtons: {
    flexDirection: "row",
    gap: 12,
  },
  headerButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    gap: 6,
  },
  headerButtonText: {
    fontSize: 14,
    fontWeight: "500",
  },
})
