import {
  StyleSheet,
  FlatList,
  Pressable,
  Alert,
  Text,
  View,
  ScrollView,
  Image,
} from "react-native"
import { useFocusEffect } from "@react-navigation/native"
import React, { useState, useEffect } from "react"
import { useModal } from "@/components/ModalContext"
import { useSessions } from "@/contexts/SessionsContext"
import { locationService } from "@/services/locationService"
import { Session } from "@/types"
import { SessionWithDistance } from "@/services/spatialService"
import LocationInputModal from "@/components/LocationInputModal"
import { Ionicons } from "@expo/vector-icons"
import { useColorScheme } from "@/components/useColorScheme"
import Colors from "@/constants/Colors"
import { useRouter } from "expo-router"
import { TabNavigationState, NotificationType } from "@/types"
import { useAuth } from "@/hooks/useAuth"
import { useLocation } from "@/contexts/LocationContext"
import { ScreenTabs, TabItem } from "@/components/ScreenTabs"
import CustomHeader from "@/components/CustomHeader"
import CreateSessionModal from "@/components/CreateSession"

export default function SessionsScreen() {
  const { shouldResetSessions, setShouldResetSessions, showModal } = useModal()
  const {
    sessions,
    pastSessions,
    nearbySessions,
    loading,
    nearbyLoading,
    refreshSessions,
    refreshNearbySessions,
  } = useSessions()
  const [activeTab, setActiveTab] = useState<"sessions" | "find">("sessions")

  // Filter states
  const [radiusMiles, setRadiusMiles] = useState(20)
  const [filtersExpanded, setFiltersExpanded] = useState(false)
  const [locationError, setLocationError] = useState<string | null>(null)
  const [showLocationModal, setShowLocationModal] = useState(false)
  const [manualLocationInput, setManualLocationInput] = useState<string | null>(
    null
  )
  const [currentSearchLocation, setCurrentSearchLocation] = useState<
    string | null
  >(null)
  const [hasLocationPermission, setHasLocationPermission] = useState(false)
  const [pastSessionsExpanded, setPastSessionsExpanded] = useState(true)
  const [showCreateSessionModal, setShowCreateSessionModal] = useState(false)
  const colors = useColorScheme()
  const router = useRouter()
  const { getUserDisplayName, user } = useAuth()
  const {
    effectiveLocation,
    hasPermission,
    isLoading: locationLoading,
  } = useLocation()

  // Tab configuration
  const tabs: TabItem[] = [
    { key: "sessions", label: "Sessions" },
    { key: "find", label: "Find" },
  ]

  const handleTabPress = (tabKey: string) => {
    setActiveTab(tabKey as "sessions" | "find")
  }

  // Helper functions for UTC datetime handling
  const formatLocalTime = (utcTimestamp: string): string => {
    return new Date(utcTimestamp).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    })
  }

  const formatLocalDate = (utcTimestamp: string): string => {
    return new Date(utcTimestamp).toLocaleDateString([], {
      weekday: "short",
      month: "short",
      day: "numeric",
    })
  }

  const formatLocalDateTime = (utcTimestamp: string): string => {
    const date = new Date(utcTimestamp)
    return `${formatLocalDate(utcTimestamp)} • ${formatLocalTime(utcTimestamp)}`
  }

  const loadNearbyGames = async () => {
    try {
      setLocationError(null)
      await refreshNearbySessions(radiusMiles)
    } catch (error) {
      console.error("Error loading nearby games:", error)
      setLocationError("Unable to load games in your area")
    }
  }

  // Load sessions when screen is focused
  useFocusEffect(
    React.useCallback(() => {
      refreshSessions()
      loadNearbyGames()

      if (shouldResetSessions) {
        setShouldResetSessions(false)
      }
    }, [
      shouldResetSessions,
      setShouldResetSessions,
      radiusMiles,
      manualLocationInput,
    ])
  )

  const handleSessionPress = (session: Session) => {
    router.push({
      pathname: "/(tabs)/sessions/SessionDetails" as any,
      params: { sessionId: session.id },
    })
  }

  const handleCreateSession = () => {
    setShowCreateSessionModal(true)
  }

  const handleSessionCreated = () => {
    // Refresh sessions when a new session is created
    refreshSessions()
  }

  const handleLocationSubmit = async (location: string) => {
    setManualLocationInput(location)
    setShowLocationModal(false)
    // loadNearbyGames will be called automatically due to manualLocationInput change
  }

  const handleLocationCancel = () => {
    setShowLocationModal(false)
    setLocationError("Location needed to find nearby games")
  }

  const handleEnableLocation = async () => {
    setShowLocationModal(false)
    // Reset manual input so GPS takes priority
    setManualLocationInput(null)

    try {
      const location = await locationService.getCurrentLocation()
      if (location) {
        // Location was granted, reload nearby games
        loadNearbyGames()
      } else {
        // Still no location, show modal again
        setShowLocationModal(true)
      }
    } catch (error) {
      console.log("Location permission denied, keeping modal")
      setShowLocationModal(true)
    }
  }

  const handleChangeLocation = async () => {
    // Check current permission status before showing modal
    const hasPermission = await locationService.checkLocationPermissions()
    setHasLocationPermission(hasPermission)
    setShowLocationModal(true)
  }

  const extractLocationDisplay = async (
    searchLocation: any,
    manualInput: string | null
  ): Promise<string> => {
    if (searchLocation?.source === "manual" && manualInput) {
      return manualInput
    }

    if (searchLocation?.latitude && searchLocation?.longitude) {
      try {
        // Try to get city/state from coordinates
        const address = await locationService.getAddressFromCoordinates(
          searchLocation.latitude,
          searchLocation.longitude
        )
        if (address) {
          // Extract city and state from the full address
          const parts = address.split(", ")
          const city =
            parts.find((p) => !p.match(/^\d/) && !p.match(/^[A-Z]{2}$/)) ||
            parts[0]
          const state = parts.find((p) => p.match(/^[A-Z]{2}$/))
          return state ? `${city}, ${state}` : city
        }
      } catch (error) {
        console.warn("Failed to get address from coordinates:", error)
      }

      // Fallback to coordinates
      return `${searchLocation.latitude.toFixed(
        1
      )}, ${searchLocation.longitude.toFixed(1)}`
    }

    return "Unknown location"
  }

  const handlePublicGamePress = (session: SessionWithDistance) => {
    router.push({
      pathname: "/(tabs)/sessions/SessionDetails" as any,
      params: { sessionId: session.id },
    })
  }

  const renderSessionItem = ({ item }: { item: Session }) => (
    <Pressable style={styles.gameCard} onPress={() => handleSessionPress(item)}>
      <View style={styles.gameHeader}>
        <Text style={styles.gameTitle}>
          {item.name ||
            (typeof item.session_type === "string" &&
            item.session_type.length > 0
              ? item.session_type.charAt(0).toUpperCase() +
                item.session_type.slice(1)
              : "Unknown")}
        </Text>
        <View style={styles.headerBadges}>
          {/* Visibility Badge */}
          <View style={styles.visibilityBadge}>
            <Ionicons
              name={
                item.visibility === "private" ? "lock-closed" : "globe-outline"
              }
              size={12}
              color={item.visibility === "private" ? "#666" : "#4CAF50"}
            />
            <Text
              style={[
                styles.visibilityText,
                {
                  color: item.visibility === "private" ? "#666" : "#4CAF50",
                },
              ]}
            >
              {item.visibility === "private" ? "Private" : "Public"}
            </Text>
          </View>

          {/* DUPR Badge */}
          {(item.dupr_min || item.dupr_max) && (
            <View style={styles.duprBadge}>
              <Text style={styles.duprText}>
                DUPR{" "}
                {item.dupr_min && item.dupr_max
                  ? `${item.dupr_min}-${item.dupr_max}`
                  : item.dupr_min
                  ? `>${item.dupr_min}`
                  : `<${item.dupr_max}`}
              </Text>
            </View>
          )}
        </View>
      </View>

      {item.location && (
        <View style={styles.gameDetail}>
          <Ionicons name="location-outline" size={16} color="#666" />
          <Text style={styles.gameDetailText}>{item.location}</Text>
        </View>
      )}

      <View style={styles.gameDetail}>
        <Ionicons name="time-outline" size={16} color="#666" />
        <Text style={styles.gameDetailText}>
          {`${formatLocalDateTime(
            item.session_datetime || ""
          )} - ${formatLocalTime(item.end_datetime || "")}`}
        </Text>
      </View>

      {/* Invite Status */}
      {item.invite_stats && (
        <View style={styles.gameDetail}>
          <Ionicons name="people-outline" size={16} color="#666" />
          <Text style={styles.gameDetailText}>
            {item.invite_stats.total_accepted}/{item.invite_stats.total_invited}{" "}
            accepted
          </Text>
        </View>
      )}

      {/* Hosted by Section */}
      <View style={styles.gameHost}>
        <View style={styles.hostAvatarPlaceholder}>
          <Ionicons name="person" size={16} color="#666" />
        </View>
        <Text style={styles.hostText}>Hosted by {getUserDisplayName()}</Text>
      </View>
    </Pressable>
  )

  const renderPublicGameCard = ({ item }: { item: SessionWithDistance }) => (
    <Pressable
      style={styles.gameCard}
      onPress={() => handlePublicGamePress(item)}
    >
      <View style={styles.gameHeader}>
        <Text style={styles.gameTitle}>
          {typeof item.session_type === "string" && item.session_type.length > 0
            ? item.session_type.charAt(0).toUpperCase() +
              item.session_type.slice(1)
            : "Pickleball Session"}
        </Text>
        <View style={styles.headerBadges}>
          {/* Distance Badge */}
          {item.distance_miles !== undefined && (
            <View style={styles.distanceBadge}>
              <Ionicons name="location" size={12} color="#FF6B35" />
              <Text style={styles.distanceText}>
                {item.distance_miles.toFixed(1)} mi
              </Text>
            </View>
          )}

          {/* Visibility Badge */}
          <View style={styles.visibilityBadge}>
            <Ionicons
              name={
                item.visibility === "private" ? "lock-closed" : "globe-outline"
              }
              size={12}
              color={item.visibility === "private" ? "#666" : "#4CAF50"}
            />
            <Text
              style={[
                styles.visibilityText,
                {
                  color: item.visibility === "private" ? "#666" : "#4CAF50",
                },
              ]}
            >
              {item.visibility === "private" ? "Private" : "Public"}
            </Text>
          </View>

          {/* DUPR Badge */}
          {(item.dupr_min || item.dupr_max) && (
            <View style={styles.duprBadge}>
              <Text style={styles.duprText}>
                DUPR{" "}
                {item.dupr_min && item.dupr_max
                  ? `${item.dupr_min}-${item.dupr_max}`
                  : item.dupr_min
                  ? `>${item.dupr_min}`
                  : `<${item.dupr_max}`}
              </Text>
            </View>
          )}
        </View>
      </View>

      {/* Location */}
      {(item.location_display_address || item.location_address) && (
        <View style={styles.gameDetail}>
          <Ionicons name="location-outline" size={16} color="#666" />
          <Text style={styles.gameDetailText}>
            {item.location_display_address || item.location_address}
          </Text>
        </View>
      )}

      {/* Date and Time */}
      <View style={styles.gameDetail}>
        <Ionicons name="time-outline" size={16} color="#666" />
        <Text style={styles.gameDetailText}>
          {`${formatLocalDateTime(
            item.session_datetime || ""
          )} - ${formatLocalTime(item.end_datetime || "")}`}
        </Text>
      </View>

      {/* Invite Status */}
      {item.invite_stats && (
        <View style={styles.gameDetail}>
          <Ionicons name="people-outline" size={16} color="#666" />
          <Text style={styles.gameDetailText}>
            {item.invite_stats.total_accepted}/{item.invite_stats.total_invited}{" "}
            accepted
          </Text>
        </View>
      )}

      {/* Host Section - simplified since we don't have host name in session data */}
      <View style={styles.gameHost}>
        <View style={styles.hostAvatarPlaceholder}>
          <Ionicons name="person" size={16} color="#666" />
        </View>
        <Text style={styles.hostText}>Public Session</Text>
      </View>
    </Pressable>
  )

  const renderSessionsTab = () => {
    if (loading) {
      return (
        <View style={styles.loadingContainer}>
          <Text style={[styles.loadingText, { color: "#666" }]}>
            Loading sessions...
          </Text>
        </View>
      )
    }

    return (
      <ScrollView
        style={[styles.scrollView, { backgroundColor: "white" }]}
        contentContainerStyle={styles.scrollViewContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: "#333" }]}>
            Your Upcoming Sessions
          </Text>

          {sessions.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Ionicons name="calendar-outline" size={48} color="#666" />
              <Text style={[styles.emptyTitle, { color: "#333" }]}>
                No upcoming sessions
              </Text>
              <Text style={[styles.emptyDescription, { color: "#666" }]}>
                Create a session to get started!
              </Text>
            </View>
          ) : (
            <View style={styles.sessionsList}>
              {sessions.map((session) => (
                <View key={session.id}>
                  {renderSessionItem({ item: session })}
                </View>
              ))}
            </View>
          )}
        </View>

        {/* Past Sessions Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text
              style={[styles.sectionTitle, { color: "#333", marginBottom: 0 }]}
            >
              Past Sessions
            </Text>
            {pastSessions.length > 0 && (
              <Pressable
                style={styles.expandButton}
                onPress={() => setPastSessionsExpanded(!pastSessionsExpanded)}
              >
                <Ionicons
                  name={pastSessionsExpanded ? "chevron-up" : "chevron-down"}
                  size={20}
                  color="#666"
                />
              </Pressable>
            )}
          </View>

          {pastSessions.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Ionicons name="time-outline" size={48} color="#666" />
              <Text style={[styles.emptyTitle, { color: "#333" }]}>
                No past sessions
              </Text>
              <Text style={[styles.emptyDescription, { color: "#666" }]}>
                Your completed sessions will appear here
              </Text>
            </View>
          ) : pastSessionsExpanded ? (
            <View style={styles.sessionsList}>
              {pastSessions.map((session) => (
                <View key={session.id}>
                  {renderSessionItem({ item: session })}
                </View>
              ))}
            </View>
          ) : (
            <View style={styles.collapsedContainer}>
              <Text style={styles.collapsedText}>
                {pastSessions.length} past session
                {pastSessions.length !== 1 ? "s" : ""}
              </Text>
            </View>
          )}
        </View>
      </ScrollView>
    )
  }

  const renderFindTab = () => {
    return (
      <ScrollView
        style={[styles.scrollView, { backgroundColor: "white" }]}
        contentContainerStyle={styles.scrollViewContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: "#1a1a1a" }]}>
              Games in Your Area
            </Text>
            <View style={styles.sectionActions}>
              <Pressable
                style={styles.filterButton}
                onPress={() => setFiltersExpanded(!filtersExpanded)}
              >
                <Ionicons name="filter-outline" size={20} color="#666" />
              </Pressable>
            </View>
          </View>

          {/* Location Indicator */}
          {currentSearchLocation && (
            <Pressable
              style={styles.locationIndicator}
              onPress={handleChangeLocation}
            >
              <View style={styles.locationInfo}>
                <Ionicons name="location" size={16} color="#007AFF" />
                <Text style={styles.locationText}>
                  Searching in {currentSearchLocation}
                </Text>
              </View>
              <Ionicons name="pencil" size={14} color="#007AFF" />
            </Pressable>
          )}

          {/* Filter Controls */}
          {filtersExpanded && (
            <View style={styles.filtersContainer}>
              <View style={styles.filterRow}>
                <Text style={styles.filterLabel}>Distance</Text>
                <View style={styles.radiusControls}>
                  <Pressable
                    style={styles.radiusButton}
                    onPress={() => setRadiusMiles(Math.max(5, radiusMiles - 5))}
                  >
                    <Ionicons name="remove" size={16} color="#007AFF" />
                  </Pressable>
                  <Text style={styles.radiusValue}>{radiusMiles} mi</Text>
                  <Pressable
                    style={styles.radiusButton}
                    onPress={() =>
                      setRadiusMiles(Math.min(50, radiusMiles + 5))
                    }
                  >
                    <Ionicons name="add" size={16} color="#007AFF" />
                  </Pressable>
                </View>
              </View>

              <View style={[styles.filterRow, { marginBottom: 0 }]}>
                <Text style={styles.filterLabel}>Quick Options</Text>
                <View style={styles.quickFilters}>
                  {[10, 20, 35].map((miles) => (
                    <Pressable
                      key={miles}
                      style={[
                        styles.quickFilterButton,
                        radiusMiles === miles && styles.quickFilterButtonActive,
                      ]}
                      onPress={() => setRadiusMiles(miles)}
                    >
                      <Text
                        style={[
                          styles.quickFilterText,
                          radiusMiles === miles && styles.quickFilterTextActive,
                        ]}
                      >
                        {miles}mi
                      </Text>
                    </Pressable>
                  ))}
                </View>
              </View>
            </View>
          )}

          {/* Games List or Loading/Empty States */}
          {nearbyLoading ? (
            <View style={styles.loadingContainer}>
              <Text style={[styles.loadingText, { color: "#666" }]}>
                Finding games near you...
              </Text>
            </View>
          ) : locationError ? (
            <View style={styles.emptyContainer}>
              <Ionicons name="alert-circle-outline" size={48} color="#FF6B35" />
              <Text style={[styles.emptyTitle, { color: "#333" }]}>
                Location Error
              </Text>
              <Text style={[styles.emptyDescription, { color: "#666" }]}>
                {locationError}
              </Text>
              <Pressable style={styles.retryButton} onPress={loadNearbyGames}>
                <Text style={styles.retryButtonText}>Retry</Text>
              </Pressable>
            </View>
          ) : nearbySessions.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Ionicons name="search-outline" size={48} color="#666" />
              <Text style={[styles.emptyTitle, { color: "#333" }]}>
                No games found
              </Text>
              <Text style={[styles.emptyDescription, { color: "#666" }]}>
                No public games within {radiusMiles} miles. Be the first to
                host!
              </Text>
              {!showCreateSessionModal && (
                <Pressable
                  style={styles.createGameButton}
                  onPress={handleCreateSession}
                >
                  <Text style={styles.createGameButtonText}>
                    Create Session
                  </Text>
                </Pressable>
              )}
            </View>
          ) : (
            <View style={styles.gamesList}>
              {nearbySessions.map((game) => (
                <View key={game.id}>
                  {renderPublicGameCard({ item: game })}
                </View>
              ))}
            </View>
          )}
        </View>
      </ScrollView>
    )
  }

  return (
    <View style={styles.container}>
      <CustomHeader title="Sessions" showBackButton={false} />

      {/* Tab Bar */}
      <ScreenTabs
        tabs={tabs}
        activeTab={activeTab}
        onTabPress={handleTabPress}
        colors={colors}
      />

      {/* Tab Content */}
      {activeTab === "sessions" ? renderSessionsTab() : renderFindTab()}

      {/* Fixed Create Session Button - Hide when modal is open */}
      {!showCreateSessionModal && (
        <View style={styles.stickyButtonContainer}>
          <Pressable
            style={styles.createSessionButton}
            onPress={handleCreateSession}
          >
            <Ionicons name="add" size={24} color="white" />
            <Text style={styles.createSessionButtonText}>Create Session</Text>
          </Pressable>
        </View>
      )}

      <LocationInputModal
        visible={showLocationModal}
        onLocationSubmit={handleLocationSubmit}
        onCancel={handleLocationCancel}
        onEnableLocation={handleEnableLocation}
        title={
          currentSearchLocation ? "Change Search Location" : "Location Needed"
        }
        message={
          currentSearchLocation
            ? "Enter a different city to search for games there."
            : "To find games near you, please enter your city or enable location access."
        }
        hasLocationPermission={hasLocationPermission}
      />

      {/* Create Session Modal */}
      <CreateSessionModal
        visible={showCreateSessionModal}
        onClose={() => setShowCreateSessionModal(false)}
        onSessionCreated={handleSessionCreated}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "white",
    position: "relative",
  },

  scrollView: {
    flex: 1,
  },
  scrollViewContent: {
    paddingBottom: 120, // Extra padding for better scroll experience
  },
  section: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: "700",
    marginBottom: 20,
    lineHeight: 32,
    letterSpacing: -0.5,
  },
  sectionActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    height: 32, // Ensure consistent height for alignment
  },
  expandButton: {
    padding: 8,
    borderRadius: 10,
    backgroundColor: "#f8f9fb",
    width: 44,
    height: 36,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#e8eaed",
  },
  viewAllButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    height: 36,
    paddingHorizontal: 12,
    borderRadius: 10,
    backgroundColor: "#f8f9fb",
    borderWidth: 1,
    borderColor: "#e8eaed",
  },
  viewAllText: {
    fontSize: 15,
    color: "#555",
    fontWeight: "500",
  },
  filterButton: {
    padding: 8,
    borderRadius: 10,
    backgroundColor: "#f8f9fb",
    width: 44,
    height: 36,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#e8eaed",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 10,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 60,
  },
  loadingText: {
    fontSize: 16,
    opacity: 0.7,
  },
  emptyContainer: {
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 60,
    paddingHorizontal: 24,
    backgroundColor: "#fafbfc",
    borderRadius: 20,
    marginTop: 12,
    borderWidth: 1,
    borderColor: "#e8eaed",
    borderStyle: "dashed",
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: "700",
    marginTop: 16,
    marginBottom: 8,
    letterSpacing: -0.3,
  },
  emptyDescription: {
    fontSize: 15,
    textAlign: "center",
    opacity: 0.65,
    lineHeight: 22,
    marginBottom: 24,
  },
  sessionsList: {
    gap: 12,
  },
  gamesList: {
    gap: 12,
  },
  gameCard: {
    backgroundColor: "white",
    borderRadius: 20,
    padding: 20,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
    borderWidth: 1,
    borderColor: "#f0f0f0",
  },
  gameHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  gameTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#333",
    flex: 1,
    marginRight: 8,
  },
  duprBadge: {
    backgroundColor: "#e3f2fd",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  duprText: {
    fontSize: 12,
    fontWeight: "500",
    color: "#1976d2",
  },
  gameDetail: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
    gap: 8,
  },
  gameDetailText: {
    fontSize: 14,
    color: "#666",
  },
  gameHost: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#f0f0f0",
    gap: 8,
  },
  hostAvatar: {
    width: 24,
    height: 24,
    borderRadius: 12,
  },
  hostText: {
    fontSize: 14,
    color: "#333",
    fontWeight: "500",
  },
  stickyButtonContainer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "white",
    paddingHorizontal: 24,
    paddingVertical: 20,
    borderTopWidth: 1,
    borderTopColor: "#e8eaed",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: -4,
    },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 8,
    zIndex: 1000,
  },
  createSessionButton: {
    backgroundColor: "#007AFF",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 18,
    paddingHorizontal: 32,
    borderRadius: 16,
    shadowColor: "#007AFF",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 6,
  },
  createSessionButtonText: {
    color: "white",
    fontSize: 18,
    fontWeight: "600",
    marginLeft: 8,
  },
  headerBadges: {
    flexDirection: "row",
    gap: 8,
  },
  visibilityBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#f0f0f0",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  visibilityText: {
    fontSize: 12,
    fontWeight: "500",
  },
  hostAvatarPlaceholder: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "#e0e0e0",
    justifyContent: "center",
    alignItems: "center",
  },
  distanceBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#FFF3E0",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  distanceText: {
    fontSize: 12,
    fontWeight: "500",
    color: "#FF6B35",
  },
  filtersContainer: {
    backgroundColor: "#f8f9fa",
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  filterRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  filterLabel: {
    fontSize: 16,
    fontWeight: "500",
    color: "#333",
  },
  retryButton: {
    backgroundColor: "#FF6B35",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    marginTop: 12,
  },
  retryButtonText: {
    color: "white",
    fontSize: 14,
    fontWeight: "500",
  },
  createGameButton: {
    backgroundColor: "#007AFF",
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 12,
    marginTop: 0,
    shadowColor: "#007AFF",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 3,
  },
  createGameButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
    letterSpacing: -0.2,
  },
  showMoreButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    gap: 4,
  },
  showMoreText: {
    fontSize: 16,
    color: "#007AFF",
    fontWeight: "500",
  },
  radiusControls: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  radiusButton: {
    backgroundColor: "#e3f2fd",
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
  },
  radiusValue: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    minWidth: 50,
    textAlign: "center",
  },
  quickFilters: {
    flexDirection: "row",
    gap: 8,
  },
  quickFilterButton: {
    backgroundColor: "#f0f0f0",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "transparent",
  },
  quickFilterButtonActive: {
    backgroundColor: "#e3f2fd",
    borderColor: "#007AFF",
  },
  quickFilterText: {
    fontSize: 14,
    fontWeight: "500",
    color: "#666",
  },
  quickFilterTextActive: {
    color: "#007AFF",
  },
  locationIndicator: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#f8f9fb",
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginHorizontal: -20,
    marginBottom: 16,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: "#e8eaed",
  },
  locationInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  locationText: {
    fontSize: 14,
    color: "#333",
    fontWeight: "500",
  },
  collapsedContainer: {
    backgroundColor: "#f8f9fb",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#e8eaed",
    marginTop: 12,
  },
  collapsedText: {
    fontSize: 14,
    color: "#666",
    fontWeight: "500",
  },
})
