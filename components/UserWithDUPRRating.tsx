import React from "react"
import { View, Text, StyleSheet } from "react-native"
import { useColorScheme } from "@/components/useColorScheme"
import DUPRRatingPill from "./DUPRRatingPill"

interface UserWithDUPRRatingProps {
  name: string
  singlesRating?: number | null
  doublesRating?: number | null
  size?: "small" | "medium" | "large"
  showLabel?: boolean
  showBoth?: boolean
  preferredRating?: "singles" | "doubles" | "best"
  textStyle?: any
}

export default function UserWithDUPRRating({
  name,
  singlesRating,
  doublesRating,
  size = "medium",
  showLabel = false,
  showBoth = false,
  preferredRating = "doubles",
  textStyle,
}: UserWithDUPRRatingProps) {
  const colors = useColorScheme()

  return (
    <View style={styles.container}>
      <Text style={[styles.name, { color: colors.text }, textStyle]}>
        {name}
      </Text>
      <DUPRRatingPill
        singlesRating={singlesRating}
        doublesRating={doublesRating}
        size={size}
        showLabel={showLabel}
        showBoth={showBoth}
        preferredRating={preferredRating}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    flexWrap: "wrap",
  },
  name: {
    fontSize: 16,
    fontWeight: "500",
  },
})
