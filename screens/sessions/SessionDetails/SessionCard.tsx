import React from "react"
import { View, Text, StyleSheet, Pressable, Alert, Linking } from "react-native"
import { Ionicons } from "@expo/vector-icons"
import MapView, { Marker, PROVIDER_GOOGLE } from "react-native-maps"
import { Session } from "@/types"

interface SessionCardProps {
  sessionData: Session
}

export function SessionCard({ sessionData }: SessionCardProps) {
  // EXTRACT COORDINATES FROM SESSION DATA
  const getSessionCoordinates = () => {
    if (!sessionData) {
      console.log("SessionCard - No session data available")
      return null
    }

    // Try to get coordinates from location_point first
    const lat =
      sessionData.location_lat ||
      (sessionData as any)?.location_point?.coordinates?.[1]
    const lng =
      sessionData.location_lng ||
      (sessionData as any)?.location_point?.coordinates?.[0]

    if (lat && lng) {
      const coords = { latitude: lat, longitude: lng }
      console.log("SessionCard - Extracted coordinates from session:", coords)
      return coords
    }

    console.log("SessionCard - No coordinates found in session data")
    return null
  }

  const getMapRegion = () => {
    const coords = getSessionCoordinates()
    if (!coords) {
      // Fallback to hardcoded coordinates if none found
      const fallbackCoords = {
        latitude: 43.6357763,
        longitude: -116.397774,
      }
      console.log("SessionCard - Using fallback coordinates:", fallbackCoords)
      return {
        ...fallbackCoords,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      }
    }

    const region = {
      ...coords,
      latitudeDelta: 0.01,
      longitudeDelta: 0.01,
    }
    console.log("SessionCard - Map region:", region)
    return region
  }

  const openInMaps = async () => {
    if (!sessionData) {
      Alert.alert("Error", "No session data available")
      return
    }

    const coords = getSessionCoordinates()
    if (!coords) {
      Alert.alert("Error", "No location coordinates available")
      return
    }

    const { latitude, longitude } = coords
    const address =
      sessionData.location_display_address || sessionData.location || ""

    // Create URL for maps app
    const url = `https://maps.apple.com/?q=${encodeURIComponent(
      address
    )}&ll=${latitude},${longitude}`

    try {
      const supported = await Linking.canOpenURL(url)
      if (supported) {
        await Linking.openURL(url)
      } else {
        // Fallback to Google Maps
        const googleMapsUrl = `https://maps.google.com/?q=${encodeURIComponent(
          address
        )}`
        await Linking.openURL(googleMapsUrl)
      }
    } catch (error) {
      console.error("Error opening maps:", error)
      Alert.alert("Error", "Unable to open maps app")
    }
  }

  const addToCalendar = async () => {
    if (!sessionData) {
      Alert.alert("Error", "No session data available")
      return
    }

    if (!sessionData.session_datetime) {
      Alert.alert("Error", "No session date/time available")
      return
    }

    const startDate = new Date(sessionData.session_datetime)
    const endDate = sessionData.end_datetime
      ? new Date(sessionData.end_datetime)
      : new Date(startDate.getTime() + 60 * 60 * 1000) // Default to 1 hour if no end time

    const title = sessionData.name || `${sessionData.session_type} Session`
    const location =
      sessionData.location_display_address || sessionData.location || ""
    const description = `Join us for ${sessionData.session_type} at ${location}`

    // Create calendar URL with all the details
    const calendarUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(
      title
    )}&dates=${startDate.toISOString().replace(/[-:]/g, "").split(".")[0]}Z/${
      endDate.toISOString().replace(/[-:]/g, "").split(".")[0]
    }Z&details=${encodeURIComponent(description)}&location=${encodeURIComponent(
      location
    )}`

    try {
      const supported = await Linking.canOpenURL(calendarUrl)
      if (supported) {
        await Linking.openURL(calendarUrl)
      } else {
        // Fallback to a simpler calendar URL
        const fallbackUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(
          title
        )}&dates=${
          startDate.toISOString().replace(/[-:]/g, "").split(".")[0]
        }Z/${endDate.toISOString().replace(/[-:]/g, "").split(".")[0]}Z`
        await Linking.openURL(fallbackUrl)
      }
    } catch (error) {
      console.error("Error opening calendar:", error)
      Alert.alert("Error", "Unable to open calendar app")
    }
  }

  return (
    <View style={styles.sessionCard}>
      {/* Title, Date, and Time on one line */}
      <View style={styles.sessionHeader}>
        {/* <View style={styles.sessionTitleRow}>
          <Ionicons name="tennisball-outline" size={20} color="#4A90E2" />
          <Text style={styles.sessionTitle}>
            {sessionData.name || sessionData.session_type}
          </Text>
        </View> */}

        <Pressable style={styles.sessionDateTimeRow} onPress={addToCalendar}>
          <Ionicons name="calendar-outline" size={16} color="#666" />
          <Text style={styles.sessionDateTime}>
            {sessionData.session_datetime
              ? new Date(sessionData.session_datetime).toLocaleDateString(
                  "en-US",
                  {
                    weekday: "short",
                    month: "short",
                    day: "numeric",
                  }
                )
              : "Date TBD"}{" "}
            •{" "}
            {sessionData.session_datetime
              ? new Date(sessionData.session_datetime).toLocaleTimeString(
                  "en-US",
                  {
                    hour: "numeric",
                    minute: "2-digit",
                    hour12: true,
                  }
                )
              : "Time TBD"}{" "}
            -{" "}
            {sessionData.end_datetime
              ? new Date(sessionData.end_datetime).toLocaleTimeString("en-US", {
                  hour: "numeric",
                  minute: "2-digit",
                  hour12: true,
                })
              : "Time TBD"}
          </Text>
          <Ionicons
            name="add-circle-outline"
            size={16}
            color="#4A90E2"
            style={styles.calendarIcon}
          />
        </Pressable>
      </View>

      {/* Session Info */}
      {sessionData.session_info && (
        <View style={styles.sessionInfoSection}>
          <View style={styles.sessionInfoHeader}>
            <Ionicons
              name="information-circle-outline"
              size={16}
              color="#666"
            />
            <Text style={styles.sessionInfoLabel}>Additional Info</Text>
          </View>
          <Text style={styles.sessionInfoText}>{sessionData.session_info}</Text>
        </View>
      )}

      {/* Address above map */}
      <Pressable style={styles.locationSection} onPress={openInMaps}>
        <View style={styles.locationInfo}>
          <Ionicons name="location-outline" size={20} color="#4A90E2" />
          <View style={styles.locationTextContainer}>
            <Text style={styles.locationText}>
              {sessionData.location || "Location not specified"}
            </Text>
            {sessionData.location_display_address && (
              <Text style={styles.locationSubtext}>
                {sessionData.location_display_address}
              </Text>
            )}
          </View>
          <Ionicons
            name="open-outline"
            size={16}
            color="#4A90E2"
            style={styles.openIcon}
          />
        </View>
      </Pressable>

      <View style={styles.sessionTitleRow}>
        <View style={styles.sessionDetailItem}>
          <Ionicons name="eye-outline" size={16} color="#666" />
          <Text style={styles.sessionDetailText}>
            {sessionData.visibility === "public" ? "Public" : "Private"}
          </Text>
        </View>
        {sessionData.allow_guests && (
          <View style={styles.sessionDetailItem}>
            <Ionicons name="person-add-outline" size={16} color="#666" />
            <Text style={styles.sessionDetailText}>Guests allowed</Text>
          </View>
        )}
        {/* DUPR Rating Range */}
        {sessionData.dupr_min && sessionData.dupr_max && (
          <View style={styles.duprSection}>
            <Ionicons name="trophy-outline" size={16} color="#666" />
            <Text style={styles.duprText}>
              DUPR Rating: {sessionData.dupr_min}-{sessionData.dupr_max}
            </Text>
          </View>
        )}
      </View>

      {/* Map Section */}
      <View style={styles.mapContainer}>
        <MapView
          style={styles.map}
          provider={PROVIDER_GOOGLE}
          region={getMapRegion()}
          onMapReady={() => console.log("SessionCard - Map is ready!")}
          showsUserLocation={false}
          showsMyLocationButton={false}
          scrollEnabled={true}
          zoomEnabled={true}
        >
          <Marker
            coordinate={
              getSessionCoordinates() || {
                latitude: 43.6357763,
                longitude: -116.397774,
              }
            }
            title={sessionData.location || "Session Location"}
            description={sessionData.location_display_address || ""}
          />
        </MapView>
      </View>

      {/* Consolidated session details */}
      <View style={styles.sessionDetailsRow}>
        <View style={styles.sessionDetailItem}>
          <Ionicons name="people-outline" size={16} color="#666" />
          <Text style={styles.sessionDetailText}>
            {sessionData.max_players
              ? `Max ${sessionData.max_players} players`
              : "No player limit"}
          </Text>
        </View>
        {/* <View style={styles.sessionDetailItem}>
          <Ionicons name="eye-outline" size={16} color="#666" />
          <Text style={styles.sessionDetailText}>
            {sessionData.visibility === "public" ? "Public" : "Private"}
          </Text>
        </View>
        {sessionData.allow_guests && (
          <View style={styles.sessionDetailItem}>
            <Ionicons name="person-add-outline" size={16} color="#666" />
            <Text style={styles.sessionDetailText}>Guests allowed</Text>
          </View>
        )} */}
      </View>

      {/* DUPR Rating Range
      {sessionData.dupr_min && sessionData.dupr_max && (
        <View style={styles.duprSection}>
          <Ionicons name="trophy-outline" size={16} color="#666" />
          <Text style={styles.duprText}>
            DUPR Rating: {sessionData.dupr_min}-{sessionData.dupr_max}
          </Text>
        </View>
      )} */}
    </View>
  )
}

const styles = StyleSheet.create({
  sessionCard: {
    backgroundColor: "white",
    padding: 20,
  },
  sessionHeader: {
    marginBottom: 20,
  },
  sessionTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 16,
    gap: 8,
  },
  sessionTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: "#333",
  },
  sessionDateTimeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  sessionDateTime: {
    fontSize: 14,
    color: "#666",
  },
  locationSection: {
    marginBottom: 16,
  },
  locationInfo: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
  },
  locationTextContainer: {
    flex: 1,
  },
  locationText: {
    fontSize: 16,
    color: "#333",
    fontWeight: "500",
  },
  locationSubtext: {
    fontSize: 14,
    color: "#666",
    marginTop: 2,
  },
  openIcon: {
    marginLeft: "auto",
    marginTop: 2,
  },
  calendarIcon: {
    marginLeft: "auto",
    marginTop: 2,
  },
  mapContainer: {
    width: "100%",
    height: 200,
    borderRadius: 12,
    overflow: "hidden",
    marginBottom: 16,
  },
  map: {
    width: "100%",
    height: "100%",
  },
  sessionDetailsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 16,
    marginBottom: 12,
  },
  sessionDetailItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  sessionDetailText: {
    fontSize: 14,
    color: "#666",
  },
  duprSection: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  duprText: {
    fontSize: 14,
    color: "#666",
  },
  sessionInfoSection: {
    marginBottom: 16,
    padding: 12,
    backgroundColor: "#f8f9fa",
    borderRadius: 8,
    borderLeftWidth: 3,
    borderLeftColor: "#4A90E2",
  },
  sessionInfoHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 8,
  },
  sessionInfoLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#333",
  },
  sessionInfoText: {
    fontSize: 14,
    color: "#555",
    lineHeight: 20,
  },
})
