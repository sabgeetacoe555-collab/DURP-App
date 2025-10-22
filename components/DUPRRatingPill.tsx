import React from "react"
import { View, Text, StyleSheet } from "react-native"
import { useColorScheme } from "@/components/useColorScheme"
import Colors from "@/constants/Colors"

interface DUPRRatingPillProps {
  singlesRating?: number | null
  doublesRating?: number | null
  size?: "small" | "medium" | "large"
  showLabel?: boolean
  showBoth?: boolean
  preferredRating?: "singles" | "doubles" | "best"
  className?: string
}

export default function DUPRRatingPill({
  singlesRating,
  doublesRating,
  size = "medium",
  showLabel = false,
  showBoth = false,
  preferredRating = "doubles",
  className,
}: DUPRRatingPillProps) {
  const colors = useColorScheme()

  // Determine which rating to show
  let displayRating: number | null = null
  let ratingType: string = ""

  if (showBoth && singlesRating && doublesRating) {
    // Show both ratings in format "S:3.50 D:4.20"
    return (
      <View
        style={[
          styles.container,
          styles[size],
          { backgroundColor: colors.tint },
        ]}
      >
        {showLabel && (
          <Text
            style={[
              styles.label,
              { color: colors.background, fontSize: styles[size].fontSize - 2 },
            ]}
          >
            DUPR
          </Text>
        )}
        <View style={styles.bothRatings}>
          <Text
            style={[
              styles.rating,
              { color: colors.background, fontSize: styles[size].fontSize },
            ]}
          >
            S:{singlesRating.toFixed(2)}
          </Text>
          <Text
            style={[
              styles.separator,
              { color: colors.background, fontSize: styles[size].fontSize - 2 },
            ]}
          >
            •
          </Text>
          <Text
            style={[
              styles.rating,
              { color: colors.background, fontSize: styles[size].fontSize },
            ]}
          >
            D:{doublesRating.toFixed(2)}
          </Text>
        </View>
      </View>
    )
  } else {
    // Show single rating based on preference
    if (preferredRating === "singles" && singlesRating) {
      displayRating = singlesRating
      ratingType = "S"
    } else if (preferredRating === "doubles" && doublesRating) {
      displayRating = doublesRating
      ratingType = "D"
    } else if (preferredRating === "best") {
      // Show the higher rating, preferring doubles if equal
      if (singlesRating && doublesRating) {
        displayRating =
          doublesRating >= singlesRating ? doublesRating : singlesRating
        ratingType = doublesRating >= singlesRating ? "D" : "S"
      } else if (doublesRating) {
        displayRating = doublesRating
        ratingType = "D"
      } else if (singlesRating) {
        displayRating = singlesRating
        ratingType = "S"
      }
    } else {
      // Fallback: show whichever rating is available
      if (doublesRating) {
        displayRating = doublesRating
        ratingType = "D"
      } else if (singlesRating) {
        displayRating = singlesRating
        ratingType = "S"
      }
    }
  }

  // If no rating to display, show a hard-coded test rating for now
  if (displayRating === null) {
    displayRating = 2.34 // Hard-coded test rating
    ratingType = "D" // Default to doubles
  }

  // Format rating to 2 decimal places
  const formattedRating = displayRating.toFixed(2)

  return (
    <View
      style={[styles.container, styles[size], { backgroundColor: colors.tint }]}
    >
      {showLabel && (
        <Text
          style={[
            styles.label,
            { color: colors.background, fontSize: styles[size].fontSize - 2 },
          ]}
        >
          DUPR
        </Text>
      )}
      <View style={styles.singleRating}>
        <Text
          style={[
            styles.ratingType,
            { color: colors.background, fontSize: styles[size].fontSize - 2 },
          ]}
        >
          {ratingType}:
        </Text>
        <Text
          style={[
            styles.rating,
            { color: colors.background, fontSize: styles[size].fontSize },
          ]}
        >
          {formattedRating}
        </Text>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
    alignSelf: "flex-start",
  },
  small: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    fontSize: 10,
    minWidth: 32,
  },
  medium: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
    fontSize: 12,
    minWidth: 40,
  },
  large: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    fontSize: 14,
    minWidth: 48,
  },
  label: {
    fontWeight: "600",
    opacity: 0.9,
  },
  singleRating: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
  },
  bothRatings: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  ratingType: {
    fontWeight: "600",
    opacity: 0.9,
  },
  rating: {
    fontWeight: "700",
    fontFamily: "monospace",
  },
  separator: {
    fontWeight: "600",
    opacity: 0.7,
  },
})
