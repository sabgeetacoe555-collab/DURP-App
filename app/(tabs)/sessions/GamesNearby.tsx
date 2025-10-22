import {
  StyleSheet,
  FlatList,
  Pressable,
  Text,
  View,
  ScrollView,
} from "react-native"
import React, { useState, useEffect } from "react"
import { spatialService, SessionWithDistance } from "@/services/spatialService"
import { locationService } from "@/services/locationService"
import LocationInputModal from "@/components/LocationInputModal"
import { Ionicons } from "@expo/vector-icons"
import { useColorScheme } from "@/components/useColorScheme"
import Colors from "@/constants/Colors"
import { useRouter } from "expo-router"
import { useAuth } from "@/hooks/useAuth"

export default function GamesNearbyScreen() {
  const [nearbyGames, setNearbyGames] = useState<SessionWithDistance[]>([])
  const [loading, setLoading] = useState(true)
  const [locationError, setLocationError] = useState<string | null>(null)

  // Filter states
  const [radiusMiles, setRadiusMiles] = useState(20)
  const [showFilters, setShowFilters] = useState(false)
  const [showLocationModal, setShowLocationModal] = useState(false)
  const [manualLocationInput, setManualLocationInput] = useState<string | null>(
    null
  )
  const [currentSearchLocation, setCurrentSearchLocation] = useState<
    string | null
  >(null)
  const [hasLocationPermission, setHasLocationPermission] = useState(false)

  const colors = useColorScheme()
  const router = useRouter()
  const { user } = useAuth()

  const loadNearbyGames = async () => {
    try {
      setLoading(true)
      setLocationError(null)

      const result = await spatialService.findSessionsNearUser({
        radiusMiles: radiusMiles,
        excludeUserId: user?.id,
        manualLocationInput: manualLocationInput || undefined,
      })

      // Check if manual location input is required
      if (result.requiresManualLocation) {
        // Check permission status before showing modal
        const hasPermission = await locationService.checkLocationPermissions()
        setHasLocationPermission(hasPermission)
        setShowLocationModal(true)
        setLocationError(result.locationError || null)
        setNearbyGames([])
        setCurrentSearchLocation(null)
      } else {
        setNearbyGames(result.sessions || [])

        // Extract and set current search location for display
        if (result.searchLocation) {
          extractLocationDisplay(
            result.searchLocation,
            manualLocationInput
          ).then((locationDisplay) => {
            setCurrentSearchLocation(locationDisplay)
          })
        }
      }
    } catch (error) {
      console.error("Error loading nearby games:", error)
      setLocationError("Unable to load games in your area")
      setNearbyGames([])
    } finally {
      setLoading(false)
    }
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

  useEffect(() => {
    loadNearbyGames()
  }, [radiusMiles, manualLocationInput])

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
    })
  }

  const formatTime = (timeString: string) => {
    const [hours, minutes] = timeString.split(":")
    const date = new Date()
    date.setHours(parseInt(hours, 10), parseInt(minutes, 10))
    return date.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    })
  }

  const handleGamePress = (session: SessionWithDistance) => {
    router.push({
      pathname: "/(tabs)/sessions/SessionDetails" as any,
      params: { sessionId: session.id },
    })
  }

  const renderGameCard = ({ item }: { item: SessionWithDistance }) => (
    <Pressable style={styles.gameCard} onPress={() => handleGamePress(item)}>
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
          {formatDate(item.date)} •{" "}
          {item.start_time ? formatTime(item.start_time) : ""}
          {item.end_time && ` - ${formatTime(item.end_time)}`}
        </Text>
      </View>

      {/* Player Capacity */}
      {item.max_players && (
        <View style={styles.gameDetail}>
          <Ionicons name="people-outline" size={16} color="#666" />
          <Text style={styles.gameDetailText}>
            1/{item.max_players} players
          </Text>
        </View>
      )}

      {/* Host Section */}
      <View style={styles.gameHost}>
        <View style={styles.hostAvatarPlaceholder}>
          <Ionicons name="person" size={16} color="#666" />
        </View>
        <Text style={styles.hostText}>Public Session</Text>
      </View>
    </Pressable>
  )

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={24} color="#007AFF" />
        </Pressable>
        <Text style={[styles.headerTitle, { color: colors.text }]}>
          Games Near You
        </Text>
        <Pressable
          style={styles.filterToggle}
          onPress={() => setShowFilters(!showFilters)}
        >
          <Ionicons name="filter-outline" size={24} color="#007AFF" />
        </Pressable>
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
      {showFilters && (
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
                onPress={() => setRadiusMiles(Math.min(50, radiusMiles + 5))}
              >
                <Ionicons name="add" size={16} color="#007AFF" />
              </Pressable>
            </View>
          </View>

          <View style={styles.filterRow}>
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

      {/* Results Count */}
      {!loading && !locationError && (
        <View style={styles.resultsHeader}>
          <Text style={[styles.resultsText, { color: colors.text }]}>
            {nearbyGames.length} games within {radiusMiles} miles
          </Text>
        </View>
      )}

      {/* Games List or Loading/Empty States */}
      {loading ? (
        <View style={styles.centerContainer}>
          <Text style={[styles.loadingText, { color: "#666" }]}>
            Finding games near you...
          </Text>
        </View>
      ) : locationError ? (
        <View style={styles.centerContainer}>
          <Ionicons name="alert-circle-outline" size={48} color="#FF6B35" />
          <Text style={[styles.emptyTitle, { color: colors.text }]}>
            Location Error
          </Text>
          <Text style={[styles.emptyDescription, { color: "#666" }]}>
            {locationError}
          </Text>
          <Pressable style={styles.retryButton} onPress={loadNearbyGames}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </Pressable>
        </View>
      ) : nearbyGames.length === 0 ? (
        <View style={styles.centerContainer}>
          <Ionicons name="search-outline" size={48} color="#666" />
          <Text style={[styles.emptyTitle, { color: colors.text }]}>
            No games found
          </Text>
          <Text style={[styles.emptyDescription, { color: "#666" }]}>
            No public games within {radiusMiles} miles. Try expanding your
            search radius!
          </Text>
          <Pressable
            style={styles.expandButton}
            onPress={() => setRadiusMiles(Math.min(50, radiusMiles + 10))}
          >
            <Text style={styles.expandButtonText}>
              Expand to {Math.min(50, radiusMiles + 10)} miles
            </Text>
          </Pressable>
        </View>
      ) : (
        <FlatList
          data={nearbyGames}
          renderItem={renderGameCard}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
        />
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
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "600",
    flex: 1,
    textAlign: "center",
    marginHorizontal: 16,
  },
  filterToggle: {
    padding: 4,
  },
  filtersContainer: {
    backgroundColor: "#f8f9fa",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  filterRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  filterLabel: {
    fontSize: 16,
    fontWeight: "500",
    color: "#333",
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
  resultsHeader: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: "#f8f9fa",
  },
  resultsText: {
    fontSize: 14,
    color: "#666",
  },
  listContainer: {
    padding: 20,
    gap: 16,
  },
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 40,
  },
  loadingText: {
    fontSize: 16,
    opacity: 0.7,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginTop: 12,
    marginBottom: 6,
  },
  emptyDescription: {
    fontSize: 14,
    textAlign: "center",
    opacity: 0.7,
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  retryButton: {
    backgroundColor: "#FF6B35",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  retryButtonText: {
    color: "white",
    fontSize: 14,
    fontWeight: "500",
  },
  expandButton: {
    backgroundColor: "#007AFF",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  expandButtonText: {
    color: "white",
    fontSize: 14,
    fontWeight: "500",
  },
  gameCard: {
    backgroundColor: "white",
    borderRadius: 16,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
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
  headerBadges: {
    flexDirection: "row",
    gap: 8,
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
    flex: 1,
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
  hostAvatarPlaceholder: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "#e0e0e0",
    justifyContent: "center",
    alignItems: "center",
  },
  hostText: {
    fontSize: 14,
    color: "#333",
    fontWeight: "500",
  },
  locationIndicator: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#f8f9fa",
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
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
})
