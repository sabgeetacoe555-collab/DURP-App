import React from "react"
import { View, Text, StyleSheet, ScrollView } from "react-native"
import { useColorScheme } from "@/components/useColorScheme"
import DUPRRatingPill from "./DUPRRatingPill"
import UserWithDUPRRating from "./UserWithDUPRRating"

export default function DUPRRatingPillExamples() {
  const colors = useColorScheme()

  // Example user data
  const exampleUser = {
    name: "John Smith",
    singlesRating: 3.75,
    doublesRating: 4.2,
  }

  const exampleUser2 = {
    name: "Sarah Johnson",
    singlesRating: 4.5,
    doublesRating: null,
  }

  const exampleUser3 = {
    name: "Mike Wilson",
    singlesRating: null,
    doublesRating: 3.9,
  }

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
    >
      <Text style={[styles.title, { color: colors.text }]}>
        DUPR Rating Pill Examples
      </Text>

      {/* Basic Usage */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>
          Basic Usage
        </Text>

        <View style={styles.example}>
          <Text style={[styles.exampleLabel, { color: colors.text }]}>
            Default (doubles preferred):
          </Text>
          <DUPRRatingPill
            singlesRating={exampleUser.singlesRating}
            doublesRating={exampleUser.doublesRating}
          />
        </View>

        <View style={styles.example}>
          <Text style={[styles.exampleLabel, { color: colors.text }]}>
            Singles preferred:
          </Text>
          <DUPRRatingPill
            singlesRating={exampleUser.singlesRating}
            doublesRating={exampleUser.doublesRating}
            preferredRating="singles"
          />
        </View>

        <View style={styles.example}>
          <Text style={[styles.exampleLabel, { color: colors.text }]}>
            Best rating:
          </Text>
          <DUPRRatingPill
            singlesRating={exampleUser.singlesRating}
            doublesRating={exampleUser.doublesRating}
            preferredRating="best"
          />
        </View>
      </View>

      {/* Different Sizes */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>
          Different Sizes
        </Text>

        <View style={styles.example}>
          <Text style={[styles.exampleLabel, { color: colors.text }]}>
            Small:
          </Text>
          <DUPRRatingPill
            singlesRating={exampleUser.singlesRating}
            doublesRating={exampleUser.doublesRating}
            size="small"
          />
        </View>

        <View style={styles.example}>
          <Text style={[styles.exampleLabel, { color: colors.text }]}>
            Medium:
          </Text>
          <DUPRRatingPill
            singlesRating={exampleUser.singlesRating}
            doublesRating={exampleUser.doublesRating}
            size="medium"
          />
        </View>

        <View style={styles.example}>
          <Text style={[styles.exampleLabel, { color: colors.text }]}>
            Large:
          </Text>
          <DUPRRatingPill
            singlesRating={exampleUser.singlesRating}
            doublesRating={exampleUser.doublesRating}
            size="large"
          />
        </View>
      </View>

      {/* With Labels */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>
          With Labels
        </Text>

        <View style={styles.example}>
          <Text style={[styles.exampleLabel, { color: colors.text }]}>
            With DUPR label:
          </Text>
          <DUPRRatingPill
            singlesRating={exampleUser.singlesRating}
            doublesRating={exampleUser.doublesRating}
            showLabel={true}
          />
        </View>
      </View>

      {/* Show Both Ratings */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>
          Show Both Ratings
        </Text>

        <View style={styles.example}>
          <Text style={[styles.exampleLabel, { color: colors.text }]}>
            Both ratings:
          </Text>
          <DUPRRatingPill
            singlesRating={exampleUser.singlesRating}
            doublesRating={exampleUser.doublesRating}
            showBoth={true}
          />
        </View>
      </View>

      {/* Edge Cases */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>
          Edge Cases
        </Text>

        <View style={styles.example}>
          <Text style={[styles.exampleLabel, { color: colors.text }]}>
            Only singles rating:
          </Text>
          <DUPRRatingPill
            singlesRating={exampleUser2.singlesRating}
            doublesRating={exampleUser2.doublesRating}
          />
        </View>

        <View style={styles.example}>
          <Text style={[styles.exampleLabel, { color: colors.text }]}>
            Only doubles rating:
          </Text>
          <DUPRRatingPill
            singlesRating={exampleUser3.singlesRating}
            doublesRating={exampleUser3.doublesRating}
          />
        </View>

        <View style={styles.example}>
          <Text style={[styles.exampleLabel, { color: colors.text }]}>
            No ratings (won't render):
          </Text>
          <DUPRRatingPill singlesRating={null} doublesRating={null} />
          <Text style={[styles.noRatingText, { color: colors.tabIconDefault }]}>
            (No pill shown)
          </Text>
        </View>
      </View>

      {/* With User Names */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>
          With User Names
        </Text>

        <View style={styles.example}>
          <UserWithDUPRRating
            name={exampleUser.name}
            singlesRating={exampleUser.singlesRating}
            doublesRating={exampleUser.doublesRating}
          />
        </View>

        <View style={styles.example}>
          <UserWithDUPRRating
            name={exampleUser2.name}
            singlesRating={exampleUser2.singlesRating}
            doublesRating={exampleUser2.doublesRating}
            size="small"
          />
        </View>

        <View style={styles.example}>
          <UserWithDUPRRating
            name={exampleUser3.name}
            singlesRating={exampleUser3.singlesRating}
            doublesRating={exampleUser3.doublesRating}
            showBoth={true}
          />
        </View>
      </View>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 20,
    textAlign: "center",
  },
  section: {
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 15,
  },
  example: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
    gap: 12,
  },
  exampleLabel: {
    fontSize: 14,
    minWidth: 120,
  },
  noRatingText: {
    fontSize: 12,
    fontStyle: "italic",
  },
})
