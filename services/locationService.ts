import * as Location from "expo-location"
import { Alert, Linking } from "react-native"

export interface LocationData {
  latitude: number
  longitude: number
  address?: string
  displayAddress?: string
}

class LocationService {
  /**
   * Request location permissions and get current location
   */
  async getCurrentLocation(): Promise<LocationData | null> {
    try {
      // Request foreground location permissions
      const { status } = await Location.requestForegroundPermissionsAsync()

      if (status !== "granted") {
        Alert.alert(
          "Location Permission Required",
          "This app needs location access to help you find nearby pickleball sessions. Please enable location access in your device settings.",
          [
            { text: "Cancel", style: "cancel" },
            { text: "Settings", onPress: () => Linking.openSettings() },
          ]
        )
        return null
      }

      // Check if location services are enabled
      const isEnabled = await Location.hasServicesEnabledAsync()
      if (!isEnabled) {
        Alert.alert(
          "Location Services Disabled",
          "Please enable location services on your device to use this feature."
        )
        return null
      }

      // Get current position
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
        timeInterval: 5000,
        distanceInterval: 10,
      })

      // Get address from coordinates
      let address: string | undefined
      let displayAddress: string | undefined
      try {
        const addressResponse = await Location.reverseGeocodeAsync({
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
        })

        if (addressResponse.length > 0) {
          const addr = addressResponse[0]
          // Full address for routing/navigation
          address = [
            addr.street,
            addr.city,
            addr.region,
            addr.postalCode,
            addr.country,
          ]
            .filter(Boolean)
            .join(", ")

          // Display address (city, state, zip) for UI
          displayAddress = [addr.city, addr.region, addr.postalCode]
            .filter(Boolean)
            .join(", ")
        }
      } catch (error) {
        console.warn("Failed to get address from coordinates:", error)
      }

      return {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        address,
        displayAddress,
      }
    } catch (error) {
      console.error("Error getting current location:", error)
      Alert.alert(
        "Location Error",
        "Unable to get your current location. Please try again or enter your location manually."
      )
      return null
    }
  }

  /**
   * Check if location permissions are granted
   */
  async checkLocationPermissions(): Promise<boolean> {
    try {
      const { status } = await Location.getForegroundPermissionsAsync()
      return status === "granted"
    } catch (error) {
      console.error("Error checking location permissions:", error)
      return false
    }
  }

  /**
   * Get current location only if permission is already granted
   * Does NOT request permission - use this for silent location attempts
   */
  async getCurrentLocationIfPermitted(): Promise<LocationData | null> {
    try {
      // Check if permission is already granted
      const hasPermission = await this.checkLocationPermissions()
      if (!hasPermission) {
        return null
      }

      // Check if location services are enabled
      const isEnabled = await Location.hasServicesEnabledAsync()
      if (!isEnabled) {
        return null
      }

      // Get current position
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
        timeInterval: 5000,
        distanceInterval: 10,
      })

      // Get address from coordinates
      let address: string | undefined
      let displayAddress: string | undefined
      try {
        const addressResponse = await Location.reverseGeocodeAsync({
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
        })

        if (addressResponse.length > 0) {
          const addr = addressResponse[0]
          // Full address for routing/navigation
          address = [
            addr.street,
            addr.city,
            addr.region,
            addr.postalCode,
            addr.country,
          ]
            .filter(Boolean)
            .join(", ")

          // Display address (city, state, zip) for UI
          displayAddress = [addr.city, addr.region, addr.postalCode]
            .filter(Boolean)
            .join(", ")
        }
      } catch (error) {
        console.warn("Failed to get address from coordinates:", error)
      }

      return {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        address,
        displayAddress,
      }
    } catch (error) {
      console.error("Error getting current location (silent):", error)
      return null
    }
  }

  /**
   * Get address from coordinates
   */
  async getAddressFromCoordinates(
    latitude: number,
    longitude: number
  ): Promise<string | null> {
    try {
      const addressResponse = await Location.reverseGeocodeAsync({
        latitude,
        longitude,
      })

      if (addressResponse.length > 0) {
        const addr = addressResponse[0]
        return [
          addr.street,
          addr.city,
          addr.region,
          addr.postalCode,
          addr.country,
        ]
          .filter(Boolean)
          .join(", ")
      }

      return null
    } catch (error) {
      console.error("Error getting address from coordinates:", error)
      return null
    }
  }

  /**
   * Get coordinates and formatted addresses from manual input
   */
  async getLocationFromAddress(
    addressInput: string
  ): Promise<LocationData | null> {
    try {
      const geocodeResponse = await Location.geocodeAsync(addressInput)

      if (geocodeResponse.length > 0) {
        const location = geocodeResponse[0]

        // Get formatted address from coordinates
        let address: string | undefined
        let displayAddress: string | undefined

        try {
          const addressResponse = await Location.reverseGeocodeAsync({
            latitude: location.latitude,
            longitude: location.longitude,
          })

          if (addressResponse.length > 0) {
            const addr = addressResponse[0]
            // Full address for routing/navigation
            address = [
              addr.street,
              addr.city,
              addr.region,
              addr.postalCode,
              addr.country,
            ]
              .filter(Boolean)
              .join(", ")

            // Display address (city, state, zip) for UI
            displayAddress = [addr.city, addr.region, addr.postalCode]
              .filter(Boolean)
              .join(", ")
          }
        } catch (error) {
          console.warn(
            "Failed to get formatted address from coordinates:",
            error
          )
          // Fallback to original input
          address = addressInput
          displayAddress = addressInput
        }

        return {
          latitude: location.latitude,
          longitude: location.longitude,
          address,
          displayAddress,
        }
      }

      return null
    } catch (error) {
      console.error("Error getting location from address:", error)
      return null
    }
  }

  /**
   * Get coordinates from address
   */
  async getCoordinatesFromAddress(
    address: string
  ): Promise<{ latitude: number; longitude: number } | null> {
    try {
      const geocodeResponse = await Location.geocodeAsync(address)

      if (geocodeResponse.length > 0) {
        const location = geocodeResponse[0]
        return {
          latitude: location.latitude,
          longitude: location.longitude,
        }
      }

      return null
    } catch (error) {
      console.error("Error getting coordinates from address:", error)
      return null
    }
  }
}

export const locationService = new LocationService()
