import React, { useState, useCallback, useRef } from "react"
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Keyboard,
  Modal, // Add Modal import
  Pressable,
} from "react-native"
import { useColorScheme } from "@/components/useColorScheme"
import Colors from "@/constants/Colors"
import { locationService, LocationData } from "@/services/locationService"

interface LocationAutocompleteProps {
  value: string
  onLocationChange: (address: string, locationData: LocationData | null) => void
  onGetCurrentLocation?: () => void
  locationLoading?: boolean
  placeholder?: string
  containerStyle?: any
  showCurrentLocationButton?: boolean
  searchType?: "cities" | "full" // 'cities' for profile, 'full' for sessions
}

interface GooglePlacePrediction {
  place_id: string
  description: string
  structured_formatting: {
    main_text: string
    secondary_text: string
  }
}

interface GooglePlaceDetails {
  geometry: {
    location: {
      lat: number
      lng: number
    }
  }
  formatted_address: string
  name: string
  address_components?: Array<{
    long_name: string
    short_name: string
    types: string[]
  }>
}

export default function LocationAutocomplete({
  value,
  onLocationChange,
  onGetCurrentLocation,
  locationLoading = false,
  placeholder = "Enter your location (optional)",
  containerStyle,
  showCurrentLocationButton = true,
  searchType = "full",
}: LocationAutocompleteProps) {
  const [predictions, setPredictions] = useState<GooglePlacePrediction[]>([])
  const [showPredictions, setShowPredictions] = useState(false)
  const [isSearching, setIsSearching] = useState(false)
  const [useGooglePlaces, setUseGooglePlaces] = useState(true)
  const [inputLayout, setInputLayout] = useState({
    x: 0,
    y: 0,
    width: 0,
    height: 0,
  })
  const searchTimeoutRef = useRef<ReturnType<typeof setTimeout>>(null)
  const inputRef = useRef<View>(null)

  const colorScheme = useColorScheme()
  const colors = useColorScheme()

  // Add method to measure input position
  const measureInput = useCallback(() => {
    if (inputRef.current) {
      inputRef.current.measure((x, y, width, height, pageX, pageY) => {
        setInputLayout({ x: pageX, y: pageY, width, height })
      })
    }
  }, [])

  // Search for place predictions using Google Places Web API
  const searchPlaces = useCallback(async (query: string) => {
    if (!query || query.length < 3) {
      setPredictions([])
      setShowPredictions(false)
      return
    }

    setIsSearching(true)
    try {
      // Build API URL based on search type
      let apiUrl = `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${encodeURIComponent(
        query
      )}&key=${
        process.env.EXPO_PUBLIC_GOOGLE_PLACES_API_KEY
      }&components=country:us`

      // For cities only, restrict to locality (city) results
      if (searchType === "cities") {
        apiUrl += "&types=(cities)"
      }

      const response = await fetch(apiUrl)

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()

      if (data.status === "OK") {
        setPredictions(data.predictions || [])
        setShowPredictions(true)
      } else {
        console.warn(
          "Google Places API error:",
          data.status,
          data.error_message
        )
        // Fall back to basic geocoding
        setUseGooglePlaces(false)
        await handleBasicGeocoding(query)
      }
    } catch (error) {
      console.error("Google Places search failed:", error)
      // Fall back to basic geocoding
      setUseGooglePlaces(false)
      await handleBasicGeocoding(query)
    } finally {
      setIsSearching(false)
    }
  }, [])

  // Get place details from place_id
  const getPlaceDetails = useCallback(
    async (placeId: string): Promise<LocationData | null> => {
      try {
        // Request address_components for cities mode to extract city, state
        const fields =
          searchType === "cities"
            ? "geometry,formatted_address,name,address_components"
            : "geometry,formatted_address,name"

        const response = await fetch(
          `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&key=${process.env.EXPO_PUBLIC_GOOGLE_PLACES_API_KEY}&fields=${fields}`
        )

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`)
        }

        const data = await response.json()

        if (data.status === "OK" && data.result) {
          const place: GooglePlaceDetails = data.result

          let displayAddress = place.formatted_address

          // For cities mode, extract city, state from address components
          if (searchType === "cities" && place.address_components) {
            const cityComponent = place.address_components.find(
              (component) =>
                component.types.includes("locality") ||
                component.types.includes("administrative_area_level_1")
            )
            const stateComponent = place.address_components.find((component) =>
              component.types.includes("administrative_area_level_1")
            )

            if (cityComponent && stateComponent) {
              displayAddress = `${cityComponent.long_name}, ${stateComponent.short_name}`
            } else if (cityComponent) {
              displayAddress = cityComponent.long_name
            }
          }

          return {
            latitude: place.geometry.location.lat,
            longitude: place.geometry.location.lng,
            address: place.formatted_address,
            displayAddress: displayAddress,
          }
        }
      } catch (error) {
        console.error("Failed to get place details:", error)
      }
      return null
    },
    [searchType]
  )

  // Fallback to basic Expo geocoding
  const handleBasicGeocoding = useCallback(
    async (query: string) => {
      try {
        const locationData = await locationService.getLocationFromAddress(query)
        if (locationData) {
          onLocationChange(query, locationData)
        }
      } catch (error) {
        console.warn("Basic geocoding failed:", error)
      }
    },
    [onLocationChange]
  )

  // Handle text input changes with debouncing
  // Enhanced text change handler
  const handleTextChange = useCallback(
    (text: string) => {
      onLocationChange(text, null)

      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current)
      }

      if (!text.trim()) {
        setPredictions([])
        setShowPredictions(false)
        return
      }

      if (useGooglePlaces) {
        searchTimeoutRef.current = setTimeout(() => {
          searchPlaces(text)
        }, 300)
      } else {
        if (text.length > 3) {
          handleBasicGeocoding(text)
        }
      }
    },
    [useGooglePlaces, searchPlaces, onLocationChange, handleBasicGeocoding]
  )

  // Enhanced prediction selection
  const handlePredictionSelect = useCallback(
    async (prediction: GooglePlacePrediction) => {
      setShowPredictions(false)
      setPredictions([])
      Keyboard.dismiss()

      const locationData = await getPlaceDetails(prediction.place_id)
      if (locationData) {
        onLocationChange(prediction.description, locationData)
      } else {
        // Fallback to the description text
        onLocationChange(prediction.description, null)
      }
    },
    [getPlaceDetails, onLocationChange]
  )

  const inputStyle = [
    styles.input,
    {
      color: colors.text,
      borderColor: colors.tabIconDefault,
      backgroundColor: colors.isDark ? "#1a1a1a" : "#f5f5f5",
    },
  ]

  const buttonStyle = [
    styles.locationButton,
    {
      backgroundColor: locationLoading ? colors.tabIconDefault : colors.tint,
      opacity: locationLoading ? 0.7 : 1,
    },
  ]

  return (
    <>
      <View style={[styles.container, containerStyle]}>
        <View style={styles.locationContainer}>
          <View
            ref={inputRef}
            style={styles.inputContainer}
            onLayout={measureInput}
          >
            <TextInput
              style={[inputStyle, { flex: 1, marginBottom: 0 }]}
              placeholder={placeholder}
              placeholderTextColor={colors.tabIconDefault}
              value={value}
              onChangeText={handleTextChange}
              autoCapitalize="words"
              onFocus={() => {
                measureInput()
                if (predictions.length > 0) {
                  setShowPredictions(true)
                }
              }}
              onBlur={() => {
                // Delay hiding to allow for prediction selection
                setTimeout(() => {
                  setShowPredictions(false)
                }, 200)
              }}
            />

            {isSearching && (
              <View style={styles.searchingIndicator}>
                <ActivityIndicator size="small" color={colors.tabIconDefault} />
              </View>
            )}
          </View>

          {showCurrentLocationButton && onGetCurrentLocation && (
            <TouchableOpacity
              style={buttonStyle}
              onPress={onGetCurrentLocation}
              disabled={locationLoading}
            >
              <Text
                style={[
                  styles.locationButtonText,
                  { color: colors.background },
                ]}
              >
                {locationLoading ? "Getting..." : "📍 Use Current"}
              </Text>
            </TouchableOpacity>
          )}
        </View>

        {!useGooglePlaces && (
          <Text style={[styles.fallbackText, { color: colors.tabIconDefault }]}>
            Using basic location search (Google Places unavailable)
          </Text>
        )}
      </View>

      {/* Modal overlay for predictions - renders above everything */}
      <Modal
        visible={useGooglePlaces && showPredictions && predictions.length > 0}
        transparent={true}
        animationType="none"
        onRequestClose={() => setShowPredictions(false)}
      >
        <Pressable
          style={styles.modalOverlay}
          onPress={() => setShowPredictions(false)}
        >
          <View
            style={[
              styles.modalPredictionsContainer,
              {
                top: inputLayout.y + inputLayout.height + 2,
                left: inputLayout.x,
                width:
                  inputLayout.width - (showCurrentLocationButton ? 120 : 0),
                backgroundColor: colors.isDark
                  ? "rgba(26, 26, 26, 0.98)"
                  : "rgba(255, 255, 255, 0.98)",
                borderColor: colors.isDark
                  ? "rgba(255,255,255,0.3)"
                  : "rgba(0,0,0,0.2)",
              },
            ]}
            onStartShouldSetResponder={() => true}
          >
            {predictions.map((item, index) => (
              <TouchableOpacity
                key={item.place_id}
                style={[
                  styles.predictionItem,
                  {
                    backgroundColor: colors.isDark
                      ? "rgba(26, 26, 26, 1)"
                      : "rgba(255, 255, 255, 1)",
                    borderBottomColor: colors.tabIconDefault,
                    borderBottomWidth: index === predictions.length - 1 ? 0 : 1,
                  },
                ]}
                onPress={() => handlePredictionSelect(item)}
                activeOpacity={0.7}
              >
                <Text
                  style={[styles.predictionMainText, { color: colors.text }]}
                  numberOfLines={1}
                  ellipsizeMode="tail"
                >
                  {item.structured_formatting.main_text}
                </Text>
                {item.structured_formatting.secondary_text && (
                  <Text
                    style={[
                      styles.predictionSecondaryText,
                      { color: colors.tabIconDefault },
                    ]}
                    numberOfLines={1}
                    ellipsizeMode="tail"
                  >
                    {item.structured_formatting.secondary_text}
                  </Text>
                )}
              </TouchableOpacity>
            ))}
          </View>
        </Pressable>
      </Modal>
    </>
  )
}

const styles = StyleSheet.create({
  container: {
    position: "relative",
  },
  locationContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  inputContainer: {
    flex: 1,
    position: "relative",
  },
  input: {
    height: 50,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 16,
    fontSize: 16,
  },
  searchingIndicator: {
    position: "absolute",
    right: 12,
    top: 15,
  },
  locationButton: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
    minWidth: 100,
    height: 50,
  },
  locationButtonText: {
    fontSize: 14,
    fontWeight: "600",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "transparent",
  },
  modalPredictionsContainer: {
    position: "absolute",
    borderWidth: 2,
    borderRadius: 8,
    maxHeight: 200,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 50, // Very high elevation for Android
  },
  predictionItem: {
    paddingVertical: 14,
    paddingHorizontal: 16,
    minHeight: 48,
    justifyContent: "center",
  },
  predictionMainText: {
    fontSize: 16,
    fontWeight: "500",
  },
  predictionSecondaryText: {
    fontSize: 14,
    marginTop: 2,
  },
  fallbackText: {
    fontSize: 12,
    marginTop: 4,
    fontStyle: "italic",
  },
})
