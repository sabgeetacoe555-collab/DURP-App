import React, { useState } from "react"
import { StyleSheet, Pressable } from "react-native"
import { Text, View } from "@/components/Themed"
import { Ionicons } from "@expo/vector-icons"
import { useColorScheme } from "@/components/useColorScheme"
import Colors from "@/constants/Colors"

interface CardProps {
  title: string
  children?: React.ReactNode
  expandable?: boolean
  expanded?: boolean
  onToggleExpanded?: () => void
  style?: any
}

export default function Card({
  title,
  children,
  expandable = false,
  expanded = false,
  onToggleExpanded,
  style,
}: CardProps) {
  const colors = useColorScheme()
  const [isExpanded, setIsExpanded] = useState(false)

  // Define border color based on color scheme
  const borderColor = colors.isDark ? "#444" : "#ddd"

  const handleToggle = () => {
    if (expandable) {
      if (onToggleExpanded) {
        onToggleExpanded()
      } else {
        setIsExpanded(!isExpanded)
      }
    }
  }

  const isCurrentlyExpanded = expandable
    ? onToggleExpanded
      ? expanded
      : isExpanded
    : false

  return (
    <View
      style={[
        styles.card,
        { backgroundColor: "rgba(255, 255, 255, 0.6)", borderColor },
        style,
      ]}
    >
      <Pressable
        style={styles.cardHeader}
        onPress={expandable ? handleToggle : undefined}
        disabled={!expandable}
      >
        <Text style={[styles.cardTitle, { color: colors.text }]}>{title}</Text>
        {expandable && (
          <Ionicons
            name={isCurrentlyExpanded ? "chevron-up" : "chevron-down"}
            size={20}
            color={colors.tint}
          />
        )}
      </Pressable>

      {children && (!expandable || isCurrentlyExpanded) && (
        <View style={[styles.cardContent, { backgroundColor: "transparent" }]}>
          {children}
        </View>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: "600",
  },
  cardContent: {
    marginTop: 16,
  },
})
