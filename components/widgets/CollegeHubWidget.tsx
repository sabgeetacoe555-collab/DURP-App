import React from "react"
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Image,
  ScrollView,
} from "react-native"
import { Ionicons } from "@expo/vector-icons"
import { useColorScheme } from "@/components/useColorScheme"
import Colors from "@/constants/Colors"
import { useGroups } from "@/contexts/GroupsContext"
import DUPRRatingPill from "@/components/DUPRRatingPill"

interface CollegeHubWidgetProps {
  onExpand?: () => void
}

export default function CollegeHubWidget({ onExpand }: CollegeHubWidgetProps) {
  const colors = useColorScheme()
  const { groups } = useGroups()

  // Filter for college hub groups
  const collegeHubGroups = groups.filter((group) => {
    return group.college_hub === true
  })

  // Debug logging
  console.log("CollegeHubWidget - Total groups:", groups.length)
  console.log("CollegeHubWidget - College hub groups:", collegeHubGroups.length)
  console.log(
    "CollegeHubWidget - Groups:",
    groups.map((g) => ({ name: g.name, college_hub: g.college_hub }))
  )

  // If no college hub groups, don't render the widget
  if (collegeHubGroups.length === 0) {
    console.log("CollegeHubWidget - No college hub groups found, not rendering")
    // Temporarily always render for testing
    // return null
  }

  const handleExpand = () => {
    if (onExpand) {
      onExpand()
    }
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={styles.headerContainer}>
        <View style={styles.headerLeft}>
          <Image
            source={{
              uri: "https://www.cu.edu/sites/default/files/cu-standalone.png",
            }}
            style={styles.logo}
            resizeMode="contain"
          />
          <View style={styles.headerText}>
            <Text style={[styles.title, { color: colors.text }]}>
              College Hub
            </Text>
            <Text style={[styles.subtitle, { color: colors.text + "80" }]}>
              {collegeHubGroups.length} group
              {collegeHubGroups.length !== 1 ? "s" : ""}
            </Text>
          </View>
        </View>
        <View style={styles.headerRight}>
          <Pressable style={styles.expandButton} onPress={handleExpand}>
            <Ionicons
              name="open-outline"
              size={20}
              color={colors.text + "60"}
            />
          </Pressable>
        </View>
      </View>

      {/* Content */}
      <View style={styles.content}>
        <ScrollView showsVerticalScrollIndicator={false}>
          {collegeHubGroups.length > 0 ? (
            collegeHubGroups.map((group) => (
              <View key={group.id} style={styles.groupCard}>
                <View style={styles.groupHeader}>
                  <Text style={[styles.groupName, { color: colors.text }]}>
                    {group.name}
                  </Text>
                  <View style={styles.groupStats}>
                    <Text
                      style={[
                        styles.memberCount,
                        { color: colors.text + "60" },
                      ]}
                    >
                      {group.memberCount || 0} members
                    </Text>
                  </View>
                </View>

                {group.description && (
                  <Text
                    style={[
                      styles.groupDescription,
                      { color: colors.text + "80" },
                    ]}
                  >
                    {group.description}
                  </Text>
                )}

                <View style={styles.duprSection}>
                  <Text
                    style={[styles.duprLabel, { color: colors.text + "60" }]}
                  >
                    Average DUPR
                  </Text>
                  <View style={styles.duprPills}>
                    <DUPRRatingPill
                      singlesRating={group.averageSinglesRating}
                      doublesRating={group.averageDoublesRating}
                      size="small"
                      showLabel={true}
                      showBoth={true}
                    />
                  </View>
                </View>
              </View>
            ))
          ) : (
            <View style={styles.emptyState}>
              <Text style={[styles.emptyText, { color: colors.text + "60" }]}>
                No college hub groups found
              </Text>
            </View>
          )}
        </ScrollView>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    marginVertical: 8,
    borderRadius: 16,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  headerContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  logo: {
    width: 40,
    height: 40,
    marginRight: 12,
  },
  headerText: {
    flex: 1,
  },
  title: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 2,
  },
  subtitle: {
    fontSize: 14,
  },
  headerRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  expandButton: {
    padding: 8,
  },
  content: {
    marginTop: 16,
    maxHeight: 300,
  },
  groupCard: {
    backgroundColor: "#f8f9fa",
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#e8eaed",
  },
  groupHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 8,
  },
  groupName: {
    fontSize: 16,
    fontWeight: "600",
    flex: 1,
    marginRight: 8,
  },
  groupStats: {
    alignItems: "flex-end",
  },
  memberCount: {
    fontSize: 12,
  },
  groupDescription: {
    fontSize: 14,
    marginBottom: 8,
    lineHeight: 20,
  },
  duprSection: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  duprLabel: {
    fontSize: 12,
  },
  duprPills: {
    flexDirection: "row",
    alignItems: "center",
  },
  emptyState: {
    padding: 20,
    alignItems: "center",
  },
  emptyText: {
    fontSize: 14,
    textAlign: "center",
  },
})
