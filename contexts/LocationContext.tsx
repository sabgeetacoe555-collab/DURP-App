import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react"
import { Alert, Platform, Linking } from "react-native"
import * as Location from "expo-location"
import { locationService, LocationData } from "@/services/locationService"
import { authService } from "@/services/authService"
import { useAuth } from "@/hooks/useAuth"

interface LocationContextType {
  // Location data
  currentLocation: LocationData | null
  homeLocation: LocationData | null
  effectiveLocation: LocationData | null // Current or home location

  // State
  isLoading: boolean
  hasPermission: boolean
  permissionStatus: Location.PermissionStatus | null

  // Methods
  requestLocationPermission: () => Promise<void>
  updateCurrentLocation: () => Promise<void>
  updateHomeLocation: (location: LocationData) => Promise<void>
  refreshLocation: () => Promise<void>
}

const LocationContext = createContext<LocationContextType | undefined>(
  undefined
)

interface LocationProviderProps {
  children: ReactNode
}

export const LocationProvider: React.FC<LocationProviderProps> = ({
  children,
}) => {
  const { user } = useAuth()

  // Location state
  const [currentLocation, setCurrentLocation] = useState<LocationData | null>(
    null
  )
  const [homeLocation, setHomeLocation] = useState<LocationData | null>(null)
  const [effectiveLocation, setEffectiveLocation] =
    useState<LocationData | null>(null)

  // Permission and loading state
  const [isLoading, setIsLoading] = useState(true)
  const [hasPermission, setHasPermission] = useState(false)
  const [permissionStatus, setPermissionStatus] =
    useState<Location.PermissionStatus | null>(null)

  // Determine effective location (current if available, otherwise home)
  useEffect(() => {
    if (currentLocation) {
      console.log(
        "📍 Setting effective location to current location:",
        currentLocation
      )
      setEffectiveLocation(currentLocation)
    } else if (homeLocation) {
      console.log(
        "📍 Setting effective location to home location:",
        homeLocation
      )
      setEffectiveLocation(homeLocation)
    } else {
      console.log("📍 No location available")
      setEffectiveLocation(null)
    }
  }, [currentLocation, homeLocation])

  // Load home location from database on mount
  useEffect(() => {
    if (user?.id) {
      loadHomeLocation()
    }
  }, [user?.id])

  // Check location permissions and get current location on mount
  useEffect(() => {
    initializeLocation()
  }, [])

  const loadHomeLocation = async () => {
    try {
      if (user?.id) {
        const userProfile = await authService.getUserLocation(user.id)
        if (userProfile) {
          setHomeLocation(userProfile)
        }
      }
    } catch (error) {
      console.error("Error loading home location:", error)
    }
  }

  const initializeLocation = async () => {
    try {
      setIsLoading(true)

      // Check current permission status
      const { status } = await Location.getForegroundPermissionsAsync()
      setPermissionStatus(status)
      setHasPermission(status === Location.PermissionStatus.GRANTED)

      if (status === Location.PermissionStatus.GRANTED) {
        // Try to get current location
        await updateCurrentLocation()
      } else if (status === Location.PermissionStatus.UNDETERMINED) {
        // Request permission
        await requestLocationPermission()
      }
    } catch (error) {
      console.error("Error initializing location:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const requestLocationPermission = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync()
      setPermissionStatus(status)
      setHasPermission(status === Location.PermissionStatus.GRANTED)

      if (status === Location.PermissionStatus.GRANTED) {
        await updateCurrentLocation()
      } else {
        // Show explanation for denied permission
        if (Platform.OS === "ios") {
          Alert.alert(
            "Location Permission Required",
            "To find games and weather near you, please enable location access in Settings > Privacy & Security > Location Services > Net Gains > While Using App",
            [
              { text: "Cancel", style: "cancel" },
              { text: "Open Settings", onPress: () => Linking.openSettings() },
            ]
          )
        } else {
          Alert.alert(
            "Location Permission Required",
            "To find games and weather near you, please enable location access in your device settings.",
            [{ text: "OK" }]
          )
        }
      }
    } catch (error) {
      console.error("Error requesting location permission:", error)
    }
  }

  const updateCurrentLocation = async () => {
    try {
      // Check permission status directly instead of relying on state
      const { status } = await Location.getForegroundPermissionsAsync()
      if (status !== Location.PermissionStatus.GRANTED) return

      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
        timeInterval: 10000, // 10 seconds
        distanceInterval: 100, // 100 meters
      })

      const locationData: LocationData = {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      }

      console.log("📍 Got current location:", locationData)
      setCurrentLocation(locationData)
    } catch (error) {
      console.error("Error getting current location:", error)
      // If current location fails, effective location will fall back to home location
    }
  }

  const updateHomeLocation = async (location: LocationData) => {
    try {
      if (user?.id) {
        await authService.updateLocation(location)
        setHomeLocation(location)
      }
    } catch (error) {
      console.error("Error updating home location:", error)
      throw error
    }
  }

  const refreshLocation = async () => {
    try {
      setIsLoading(true)

      if (hasPermission) {
        await updateCurrentLocation()
      }

      if (user?.id) {
        await loadHomeLocation()
      }
    } catch (error) {
      console.error("Error refreshing location:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const value: LocationContextType = {
    currentLocation,
    homeLocation,
    effectiveLocation,
    isLoading,
    hasPermission,
    permissionStatus,
    requestLocationPermission,
    updateCurrentLocation,
    updateHomeLocation,
    refreshLocation,
  }

  return (
    <LocationContext.Provider value={value}>
      {children}
    </LocationContext.Provider>
  )
}

export const useLocation = (): LocationContextType => {
  const context = useContext(LocationContext)
  if (context === undefined) {
    throw new Error("useLocation must be used within a LocationProvider")
  }
  return context
}
