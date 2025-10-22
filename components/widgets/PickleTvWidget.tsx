import React, { useState } from "react"
import { StyleSheet, Pressable, View, Image } from "react-native"
import { Text } from "@/components/Themed"
import { Ionicons } from "@expo/vector-icons"

// Temporary data for PickleTv headlines
const TEMP_HEADLINES = [
  {
    id: 1,
    title: "Ben Johns Wins Third Consecutive PPA Championship",
    category: "Tournament",
    readTime: "3 min read",
    publishedAt: "2 hours ago",
  },
  {
    id: 2,
    title: "New Pickleball Rules Announced for 2024 Season",
    category: "News",
    readTime: "5 min read",
    publishedAt: "5 hours ago",
  },
  {
    id: 3,
    title: "Pickleball Equipment Sales Surge 40% This Year",
    category: "Industry",
    readTime: "4 min read",
    publishedAt: "1 day ago",
  },
]

export default function PickleTvWidget() {
  const [isExpanded, setIsExpanded] = useState(true)

  const handleHeadlinePress = (headlineId: number) => {
    console.log(`Headline ${headlineId} pressed`)
    // TODO: Navigate to article detail page
  }

  const handleSeeMore = () => {
    console.log("See more PickleTv pressed")
    // TODO: Navigate to PickleTv full page
  }

  const toggleExpanded = () => {
    setIsExpanded(!isExpanded)
  }

  return (
    <View style={styles.container}>
      <Image
        source={require("@/assets/images/PickleTv-logo.png")}
        style={styles.logo}
      />
      <Pressable style={styles.chevronButton} onPress={toggleExpanded}>
        <Ionicons
          name={isExpanded ? "chevron-up" : "chevron-down"}
          size={20}
          color="#2c3e50"
        />
      </Pressable>

      {isExpanded && (
        <>
          <View style={styles.headlinesContainer}>
            {TEMP_HEADLINES.map((headline, index) => (
              <Pressable
                key={headline.id}
                style={[
                  styles.headlineItem,
                  index < TEMP_HEADLINES.length - 1 && styles.headlineBorder,
                ]}
                onPress={() => handleHeadlinePress(headline.id)}
              >
                <View style={styles.headlineContent}>
                  <View style={styles.headlineHeader}>
                    <Text style={styles.category}>{headline.category}</Text>
                    <Text style={styles.readTime}>{headline.readTime}</Text>
                  </View>
                  <Text style={styles.headlineTitle}>{headline.title}</Text>
                  <Text style={styles.publishedAt}>{headline.publishedAt}</Text>
                </View>
              </Pressable>
            ))}
          </View>

          <Pressable style={styles.seeMoreButton} onPress={handleSeeMore}>
            <Text style={styles.seeMoreText}>See More</Text>
          </Pressable>
        </>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#f8f9fa",
    borderRadius: 12,
    padding: 16,
    marginVertical: 8,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  chevronButton: {
    position: "absolute",
    top: 16,
    right: 16,
    padding: 8,
    zIndex: 1,
  },
  logo: {
    width: 120,
    height: 50,
    alignSelf: "center",
    marginBottom: 16,
    resizeMode: "contain",
  },
  headlinesContainer: {
    gap: 0,
  },
  headlineItem: {
    paddingVertical: 12,
  },
  headlineBorder: {
    borderBottomWidth: 1,
    borderBottomColor: "#e9ecef",
  },
  headlineContent: {
    gap: 4,
  },
  headlineHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  category: {
    fontSize: 12,
    fontWeight: "600",
    color: "#007AFF",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  readTime: {
    fontSize: 12,
    color: "#7f8c8d",
  },
  headlineTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#2c3e50",
    lineHeight: 22,
    marginTop: 2,
  },
  publishedAt: {
    fontSize: 12,
    color: "#95a5a6",
    marginTop: 4,
  },
  seeMoreButton: {
    backgroundColor: "#007AFF",
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 16,
  },
  seeMoreText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
})
