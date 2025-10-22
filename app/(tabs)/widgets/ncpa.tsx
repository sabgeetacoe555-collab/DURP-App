import React, { useState, useEffect } from "react"
import {
  StyleSheet,
  ScrollView,
  View,
  Pressable,
  ActivityIndicator,
  RefreshControl,
} from "react-native"
import { Text } from "@/components/Themed"
import { Stack, useLocalSearchParams } from "expo-router"
import { useNCPA } from "@/hooks/useNCPA"
import { Ionicons } from "@expo/vector-icons"

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

export default function NCPAScreen() {
  const params = useLocalSearchParams()
  const [activeTab, setActiveTab] = useState<"schools" | "players" | "events">(
    "schools"
  )
  const [genderFilter, setGenderFilter] = useState<"Male" | "Female">("Male")
  const [divisionFilter, setDivisionFilter] = useState<1 | 2>(1)

  // Handle URL parameters to set initial tab
  useEffect(() => {
    if (params.tab === "players") {
      setActiveTab("players")
    } else if (params.tab === "events") {
      setActiveTab("events")
    }
  }, [params.tab])

  const {
    players,
    universities,
    topPlayers,
    tournaments,
    tournamentsLoading,
    tournamentsError,
    loading,
    error,
    refreshData,
    getFilteredPlayers,
  } = useNCPA()

  // Filter players based on selected criteria
  const filteredPlayers = React.useMemo(() => {
    if (!players.length) return []

    let filtered = players.filter((player) => player.hidden === 0)

    // Filter by gender
    filtered = filtered.filter((player) => player.gender === genderFilter)

    // Filter by division
    filtered = filtered.filter((player) => player.division === divisionFilter)

    // Calculate overall rating and sort by it
    const playersWithOverall = filtered.map((player) => {
      const ratings = []

      // Add available ratings (non-null and non-zero)
      if (player.singles_rating && player.singles_rating > 0) {
        ratings.push(player.singles_rating)
      }
      if (player.doubles_rating && player.doubles_rating > 0) {
        ratings.push(player.doubles_rating)
      }
      if (player.mixed_doubles_rating && player.mixed_doubles_rating > 0) {
        ratings.push(player.mixed_doubles_rating)
      }

      // Calculate average of available ratings
      const overall_rating =
        ratings.length > 0
          ? ratings.reduce((sum, rating) => sum + rating, 0) / ratings.length
          : 0

      return {
        ...player,
        overall_rating,
      }
    })

    return playersWithOverall
      .sort((a, b) => (b.overall_rating || 0) - (a.overall_rating || 0))
      .slice(0, 20)
  }, [players, genderFilter, divisionFilter])

  const renderSchoolsTab = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Top Universities</Text>
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={styles.loadingText}>Loading universities...</Text>
        </View>
      ) : error ? (
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle" size={24} color="#e74c3c" />
          <Text style={styles.errorText}>{error}</Text>
          <Pressable style={styles.retryButton} onPress={refreshData}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </Pressable>
        </View>
      ) : universities.length > 0 ? (
        universities
          .filter((university) => university.ranking !== null)
          .sort((a, b) => (a.ranking || 0) - (b.ranking || 0))
          .slice(0, 25)
          .map((university, index) => (
            <View key={university.college_id} style={styles.item}>
              <View style={styles.rankContainer}>
                <Text style={styles.rank}>#{university.ranking}</Text>
              </View>
              <View style={styles.itemContent}>
                <Text style={styles.itemTitle}>{university.name}</Text>
                {university.points && (
                  <Text style={styles.itemStats}>
                    Points: {university.points.toFixed(1)}
                  </Text>
                )}
              </View>
            </View>
          ))
      ) : (
        <Text style={styles.noDataText}>No universities data available</Text>
      )}
    </View>
  )

  const renderPlayersTab = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Top Players Rankings</Text>

      {/* Filter Controls */}
      <View style={styles.filterContainer}>
        <View style={styles.filterRow}>
          {/* Gender Filter - Left Aligned */}
          <View style={styles.segmentedControl}>
            <Pressable
              style={[
                styles.segment,
                genderFilter === "Male" && styles.segmentActive,
              ]}
              onPress={() => setGenderFilter("Male")}
            >
              <Text
                style={[
                  styles.segmentText,
                  genderFilter === "Male" && styles.segmentTextActive,
                ]}
              >
                Male
              </Text>
            </Pressable>
            <Pressable
              style={[
                styles.segment,
                genderFilter === "Female" && styles.segmentActive,
              ]}
              onPress={() => setGenderFilter("Female")}
            >
              <Text
                style={[
                  styles.segmentText,
                  genderFilter === "Female" && styles.segmentTextActive,
                ]}
              >
                Female
              </Text>
            </Pressable>
          </View>

          {/* Division Filter - Right Aligned */}
          <View style={styles.segmentedControl}>
            <Pressable
              style={[
                styles.segment,
                divisionFilter === 1 && styles.segmentActive,
              ]}
              onPress={() => setDivisionFilter(1)}
            >
              <Text
                style={[
                  styles.segmentText,
                  divisionFilter === 1 && styles.segmentTextActive,
                ]}
              >
                DI
              </Text>
            </Pressable>
            <Pressable
              style={[
                styles.segment,
                divisionFilter === 2 && styles.segmentActive,
              ]}
              onPress={() => setDivisionFilter(2)}
            >
              <Text
                style={[
                  styles.segmentText,
                  divisionFilter === 2 && styles.segmentTextActive,
                ]}
              >
                DII
              </Text>
            </Pressable>
          </View>
        </View>
      </View>

      {/* Players List */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={styles.loadingText}>Loading players...</Text>
        </View>
      ) : error ? (
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle" size={24} color="#e74c3c" />
          <Text style={styles.errorText}>{error}</Text>
          <Pressable style={styles.retryButton} onPress={refreshData}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </Pressable>
        </View>
      ) : filteredPlayers.length > 0 ? (
        filteredPlayers.map((player, index) => (
          <View key={player.profile_id} style={styles.item}>
            <View style={styles.rankContainer}>
              <Text style={styles.rank}>#{index + 1}</Text>
            </View>
            <View style={styles.itemContent}>
              <Text style={styles.itemTitle}>
                {player.first_name} {player.last_name}
              </Text>
              <Text style={styles.itemSubtitle}>
                {player.college || "No College"} • Rating:{" "}
                {player.overall_rating.toFixed(3)}
              </Text>
              <Text style={styles.itemStats}>
                Record: {player.wins}-{player.losses} • Division:{" "}
                {player.division}
              </Text>
            </View>
          </View>
        ))
      ) : (
        <Text style={styles.noDataText}>
          No players found with selected filters
        </Text>
      )}
    </View>
  )

  const renderEventsTab = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Upcoming Events</Text>
      {tournamentsLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={styles.loadingText}>Loading tournaments...</Text>
        </View>
      ) : tournamentsError ? (
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle" size={24} color="#e74c3c" />
          <Text style={styles.errorText}>{tournamentsError}</Text>
        </View>
      ) : tournaments.length > 0 ? (
        tournaments.map((tournament, index) => (
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
                {tournament.venue_address}
              </Text>
              <Text style={styles.itemSubtitle}>
                {tournament.bracket_event_types
                  ? formatEventTypes(tournament.bracket_event_types)
                  : "Event details TBD"}
              </Text>
              <Text style={styles.itemStats}>
                Teams: {tournament.num_teams} • Registration:{" "}
                {tournament.registration_open} - {tournament.registration_close}
              </Text>
            </View>
          </View>
        ))
      ) : (
        <Text style={styles.noDataText}>No upcoming events</Text>
      )}
    </View>
  )

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ title: "NCPA" }} />

      {/* Tab Navigation */}
      <View style={styles.tabContainer}>
        <Pressable
          style={[styles.tab, activeTab === "schools" && styles.activeTab]}
          onPress={() => setActiveTab("schools")}
        >
          <Text
            style={[
              styles.tabText,
              activeTab === "schools" && styles.activeTabText,
            ]}
          >
            Schools
          </Text>
        </Pressable>
        <Pressable
          style={[styles.tab, activeTab === "players" && styles.activeTab]}
          onPress={() => setActiveTab("players")}
        >
          <Text
            style={[
              styles.tabText,
              activeTab === "players" && styles.activeTabText,
            ]}
          >
            Players
          </Text>
        </Pressable>
        <Pressable
          style={[styles.tab, activeTab === "events" && styles.activeTab]}
          onPress={() => setActiveTab("events")}
        >
          <Text
            style={[
              styles.tabText,
              activeTab === "events" && styles.activeTabText,
            ]}
          >
            Events
          </Text>
        </Pressable>
      </View>

      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={loading}
            onRefresh={refreshData}
            colors={["#007AFF"]}
            tintColor="#007AFF"
          />
        }
      >
        {/* About Section - Always visible */}

        {/* Tab Content */}
        {activeTab === "schools" && renderSchoolsTab()}
        {activeTab === "players" && renderPlayersTab()}
        {activeTab === "events" && renderEventsTab()}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>About NCPA</Text>
          <Text style={styles.description}>
            The National Collegiate Pickleball Association (NCPA) is the premier
            organization for collegiate pickleball competition in the United
            States. We promote the sport of pickleball at the collegiate level
            through organized tournaments, rankings, and educational programs.
          </Text>
          <Text style={styles.mission}>
            Mission: To grow and develop collegiate pickleball by providing
            competitive opportunities, fostering sportsmanship, and building a
            community of student-athletes.
          </Text>

          <View style={styles.statsContainer}>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>2020</Text>
              <Text style={styles.statLabel}>Founded</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>150+</Text>
              <Text style={styles.statLabel}>Member Schools</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>2,500+</Text>
              <Text style={styles.statLabel}>Active Players</Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8f9fa",
  },
  content: {
    flex: 1,
    padding: 20,
  },
  tabContainer: {
    flexDirection: "row",
    backgroundColor: "#ffffff",
    borderBottomWidth: 1,
    borderBottomColor: "#e9ecef",
  },
  tab: {
    flex: 1,
    paddingVertical: 6,
    alignItems: "center",
    borderBottomWidth: 2,
    borderBottomColor: "transparent",
  },
  activeTab: {
    borderBottomColor: "#007AFF",
  },
  tabText: {
    fontSize: 16,
    fontWeight: "500",
    color: "#7f8c8d",
  },
  activeTabText: {
    color: "#007AFF",
    fontWeight: "600",
  },
  section: {
    marginBottom: 30,
    backgroundColor: "#ffffff",
    borderRadius: 12,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 16,
    color: "#2c3e50",
  },
  description: {
    fontSize: 16,
    lineHeight: 24,
    marginBottom: 12,
    color: "#34495e",
  },
  mission: {
    fontSize: 14,
    fontStyle: "italic",
    marginBottom: 16,
    color: "#7f8c8d",
  },
  statsContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginTop: 16,
  },
  statItem: {
    alignItems: "center",
  },
  statNumber: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#007AFF",
  },
  statLabel: {
    fontSize: 12,
    color: "#7f8c8d",
    marginTop: 4,
  },
  item: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#e9ecef",
  },
  rankContainer: {
    width: 40,
    alignItems: "center",
    marginRight: 16,
  },
  rank: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#007AFF",
  },
  itemContent: {
    flex: 1,
  },
  itemTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#2c3e50",
  },
  itemSubtitle: {
    fontSize: 14,
    color: "#7f8c8d",
    marginTop: 2,
  },
  itemStats: {
    fontSize: 12,
    color: "#95a5a6",
    marginTop: 4,
  },
  eventItem: {
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#e9ecef",
  },
  eventTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#2c3e50",
    marginBottom: 4,
  },
  eventDate: {
    fontSize: 14,
    color: "#007AFF",
    fontWeight: "500",
    marginBottom: 2,
  },
  eventLocation: {
    fontSize: 14,
    color: "#7f8c8d",
    marginBottom: 8,
  },
  eventDetails: {
    marginTop: 8,
  },
  eventDetail: {
    fontSize: 12,
    color: "#95a5a6",
    marginBottom: 2,
  },
  loadingContainer: {
    alignItems: "center",
    paddingVertical: 20,
  },
  loadingText: {
    marginTop: 8,
    fontSize: 14,
    color: "#7f8c8d",
  },
  errorContainer: {
    alignItems: "center",
    paddingVertical: 20,
  },
  errorText: {
    marginTop: 8,
    fontSize: 14,
    color: "#e74c3c",
    textAlign: "center",
    marginBottom: 12,
  },
  retryButton: {
    backgroundColor: "#007AFF",
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 6,
  },
  retryButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "600",
  },
  noDataText: {
    fontSize: 14,
    color: "#7f8c8d",
    textAlign: "center",
    paddingVertical: 20,
  },
  filterContainer: {
    marginBottom: 20,
  },
  filterRow: {
    flex: 1,
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 10,
  },
  segmentedControl: {
    flex: 1,
    flexDirection: "row",
    backgroundColor: "#f8f9fa",
    borderRadius: 8,
    padding: 2,
    borderWidth: 1,
    borderColor: "#e9ecef",
  },
  segment: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 4,
    alignItems: "center",
    borderRadius: 6,
  },
  segmentActive: {
    backgroundColor: "#007AFF",
  },
  segmentText: {
    fontSize: 14,
    fontWeight: "500",
    color: "#7f8c8d",
  },
  segmentTextActive: {
    color: "#FFFFFF",
    fontWeight: "600",
  },
})
