import React, { useState } from "react"
import {
  StyleSheet,
  ScrollView,
  Pressable,
  View,
  ActivityIndicator,
  Image,
} from "react-native"
import { Text } from "@/components/Themed"
import { router } from "expo-router"
import { Ionicons, FontAwesome5 } from "@expo/vector-icons"
import { useNCPA } from "@/hooks/useNCPA"

// Helper function to format tournament date
const formatTournamentDate = (dateString: string): string => {
  const date = new Date(dateString)
  const now = new Date()
  const diffTime = date.getTime() - now.getTime()
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

  if (diffDays === 0) {
    return "Today"
  } else if (diffDays === 1) {
    return "Tomorrow"
  } else if (diffDays < 7) {
    return `In ${diffDays} days`
  } else {
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: date.getFullYear() !== now.getFullYear() ? "numeric" : undefined,
    })
  }
}

// Helper function to format event types
const formatEventTypes = (eventTypes: string): string => {
  const types = eventTypes.split("<;;>")
  if (types.length <= 2) {
    return types.join(", ")
  } else {
    return `${types.slice(0, 2).join(", ")} +${types.length - 2} more`
  }
}

export default function NCPAWidget() {
  const [isExpanded, setIsExpanded] = useState(true)
  const [activeTab, setActiveTab] = useState<
    "universities" | "players" | "events"
  >("universities")
  const {
    topPlayers,
    universities,
    players,
    tournaments,
    loading,
    error,
    tournamentsLoading,
    tournamentsError,
  } = useNCPA()

  const handleSeeMore = () => {
    router.push("/(tabs)/widgets/ncpa")
  }

  const handleSeeMorePlayers = () => {
    router.push("/(tabs)/widgets/ncpa?tab=players")
  }

  const handleSeeMoreEvents = () => {
    router.push("/(tabs)/widgets/ncpa?tab=events")
  }

  const toggleExpanded = () => {
    setIsExpanded(!isExpanded)
  }

  return (
    <View style={styles.container}>
      <Image
        source={require("@/assets/images/ncpa-logo.png")}
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
          {/* Tab Navigation */}
          <View style={styles.tabContainer}>
            <Pressable
              style={[
                styles.tab,
                activeTab === "universities" && styles.activeTab,
              ]}
              onPress={() => setActiveTab("universities")}
            >
              <FontAwesome5
                name="university"
                size={18}
                color={activeTab === "universities" ? "#FFFFFF" : "#7f8c8d"}
              />
            </Pressable>
            <Pressable
              style={[styles.tab, activeTab === "players" && styles.activeTab]}
              onPress={() => setActiveTab("players")}
            >
              <FontAwesome5
                name="users"
                size={18}
                color={activeTab === "players" ? "#FFFFFF" : "#7f8c8d"}
              />
            </Pressable>
            <Pressable
              style={[styles.tab, activeTab === "events" && styles.activeTab]}
              onPress={() => setActiveTab("events")}
            >
              <FontAwesome5
                name="calendar-alt"
                size={18}
                color={activeTab === "events" ? "#FFFFFF" : "#7f8c8d"}
              />
            </Pressable>
          </View>

          {/* Tab Content */}
          {activeTab === "universities" && (
            <View style={styles.tabContent}>
              <Text style={styles.sectionTitle}>Top Universities</Text>
              {loading ? (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator size="small" color="#007AFF" />
                  <Text style={styles.loadingText}>Loading...</Text>
                </View>
              ) : error ? (
                <Text style={styles.errorText}>Error loading data</Text>
              ) : universities.length > 0 ? (
                <>
                  {universities
                    .filter((university) => university.ranking !== null)
                    .sort((a, b) => (a.ranking || 0) - (b.ranking || 0))
                    .slice(0, 3)
                    .map((university) => (
                      <View key={university.college_id} style={styles.item}>
                        <View style={styles.rankContainer}>
                          <Text style={styles.rank}>#{university.ranking}</Text>
                        </View>
                        <View style={styles.itemContent}>
                          <Text style={styles.itemTitle}>
                            {university.name}
                          </Text>
                          {university.points && (
                            <Text style={styles.itemSubtitle}>
                              Points: {university.points.toFixed(1)}
                            </Text>
                          )}
                        </View>
                      </View>
                    ))}
                  <Pressable style={styles.seeMoreLink} onPress={handleSeeMore}>
                    <Text style={styles.seeMoreLinkText}>see more</Text>
                  </Pressable>
                </>
              ) : (
                <Text style={styles.noDataText}>No data available</Text>
              )}
            </View>
          )}

          {activeTab === "players" && (
            <View style={styles.tabContent}>
              <Text style={styles.sectionTitle}>Top Players</Text>
              {loading ? (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator size="small" color="#007AFF" />
                  <Text style={styles.loadingText}>Loading...</Text>
                </View>
              ) : error ? (
                <Text style={styles.errorText}>Error loading data</Text>
              ) : players.length > 0 ? (
                <>
                  {players
                    .filter(
                      (player) =>
                        player.gender === "Male" &&
                        player.division === 1 &&
                        player.hidden === 0
                    )
                    .map((player) => {
                      const ratings = []

                      // Add available ratings (non-null and non-zero)
                      if (player.singles_rating && player.singles_rating > 0) {
                        ratings.push(player.singles_rating)
                      }
                      if (player.doubles_rating && player.doubles_rating > 0) {
                        ratings.push(player.doubles_rating)
                      }
                      if (
                        player.mixed_doubles_rating &&
                        player.mixed_doubles_rating > 0
                      ) {
                        ratings.push(player.mixed_doubles_rating)
                      }

                      // Calculate average of available ratings
                      const overall_rating =
                        ratings.length > 0
                          ? ratings.reduce((sum, rating) => sum + rating, 0) /
                            ratings.length
                          : 0

                      return {
                        ...player,
                        overall_rating,
                      }
                    })
                    .sort(
                      (a, b) =>
                        (b.overall_rating || 0) - (a.overall_rating || 0)
                    )
                    .slice(0, 3)
                    .map((player, index) => (
                      <View key={player.profile_id} style={styles.item}>
                        <View style={styles.rankContainer}>
                          <Text style={styles.rank}>#{index + 1}</Text>
                        </View>
                        <View style={styles.itemContent}>
                          <Text style={styles.itemTitle}>
                            {player.first_name} {player.last_name}
                          </Text>
                          <Text style={styles.itemSubtitle}>
                            {player.college || "No College"} •{" "}
                            {player.overall_rating.toFixed(3)}
                          </Text>
                        </View>
                      </View>
                    ))}
                  <Pressable
                    style={styles.seeMoreLink}
                    onPress={handleSeeMorePlayers}
                  >
                    <Text style={styles.seeMoreLinkText}>see more</Text>
                  </Pressable>
                </>
              ) : (
                <Text style={styles.noDataText}>No data available</Text>
              )}
            </View>
          )}

          {activeTab === "events" && (
            <View style={styles.tabContent}>
              <Text style={styles.sectionTitle}>Upcoming Events</Text>
              {tournamentsLoading ? (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator size="small" color="#007AFF" />
                  <Text style={styles.loadingText}>Loading...</Text>
                </View>
              ) : tournamentsError ? (
                <Text style={styles.errorText}>Error loading tournaments</Text>
              ) : tournaments.length > 0 ? (
                <>
                  {tournaments.slice(0, 3).map((tournament, index) => (
                    <View key={index} style={styles.item}>
                      <View style={styles.rankContainer}>
                        <Text style={styles.rank}>#{index + 1}</Text>
                      </View>
                      <View style={styles.itemContent}>
                        <Text style={styles.itemTitle}>{tournament.name}</Text>
                        <Text style={styles.itemSubtitle}>
                          {formatTournamentDate(tournament.begin_date)} •{" "}
                          {tournament.venue}
                        </Text>
                        <Text style={styles.itemSubtitle}>
                          {tournament.bracket_event_types
                            ? formatEventTypes(tournament.bracket_event_types)
                            : "Event details TBD"}
                        </Text>
                      </View>
                    </View>
                  ))}
                  <Pressable
                    style={styles.seeMoreLink}
                    onPress={handleSeeMoreEvents}
                  >
                    <Text style={styles.seeMoreLinkText}>see more</Text>
                  </Pressable>
                </>
              ) : (
                <Text style={styles.noDataText}>No upcoming events</Text>
              )}
            </View>
          )}

          {/* See More Button */}
          {/* <Pressable style={styles.seeMoreButton} onPress={handleSeeMore}>
            <Text style={styles.seeMoreText}>See More</Text>
          </Pressable> */}
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
  section: {
    marginBottom: 20,
  },
  tabContainer: {
    flexDirection: "row",
    backgroundColor: "#ffffff",
    borderRadius: 8,
    padding: 4,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  tab: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 6,
  },
  activeTab: {
    backgroundColor: "#007AFF",
  },
  tabContent: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 12,
    color: "#34495e",
  },
  item: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#e9ecef",
  },
  rankContainer: {
    width: 30,
    alignItems: "center",
    marginRight: 12,
  },
  rank: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#007AFF",
  },
  itemContent: {
    flex: 1,
  },
  itemTitle: {
    fontSize: 14,
    fontWeight: "500",
    color: "#2c3e50",
  },
  itemSubtitle: {
    fontSize: 12,
    color: "#7f8c8d",
    marginTop: 2,
  },
  seeMoreButton: {
    backgroundColor: "#007AFF",
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 8,
  },
  seeMoreText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
  seeMoreLink: {
    alignSelf: "flex-end",
    marginTop: 8,
  },
  seeMoreLinkText: {
    color: "#007AFF",
    fontSize: 14,
    fontWeight: "500",
  },
  loadingContainer: {
    alignItems: "center",
    paddingVertical: 12,
  },
  loadingText: {
    marginTop: 4,
    fontSize: 12,
    color: "#7f8c8d",
  },
  errorText: {
    fontSize: 12,
    color: "#e74c3c",
    textAlign: "center",
    paddingVertical: 8,
  },
  noDataText: {
    fontSize: 12,
    color: "#7f8c8d",
    textAlign: "center",
    paddingVertical: 8,
  },
})
