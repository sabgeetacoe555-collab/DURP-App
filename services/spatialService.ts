import { supabase } from "../lib/supabase"
import { Session } from "../types"
import { LocationData } from "./locationService"

export interface SessionWithDistance extends Session {
  distance_miles: number
}

export interface SpatialSearchOptions {
  radiusMiles?: number
  startDate?: string // ISO 8601 datetime format for UTC timestamps
  endDate?: string // ISO 8601 datetime format for UTC timestamps
  excludeUserId?: string
}

export interface LocationSearchResult {
  sessions: SessionWithDistance[]
  totalCount: number
  searchLocation: {
    latitude: number
    longitude: number
    source: "gps" | "profile" | "manual"
  } | null
  requiresManualLocation?: boolean
  locationError?: string
}

export const spatialService = {
  /**
   * Get sessions within a radius of coordinates
   */
  getSessionsNearLocation: async (
    latitude: number,
    longitude: number,
    options: SpatialSearchOptions = {}
  ): Promise<SessionWithDistance[]> => {
    const { radiusMiles = 20, startDate, endDate, excludeUserId } = options

    try {
      // Step 1: Get session IDs and distances from RPC

      const { data: spatialResults, error: rpcError } = await supabase.rpc(
        "get_sessions_within_radius",
        {
          search_lat: latitude,
          search_lng: longitude,
          radius_miles: radiusMiles,
          exclude_user_id: excludeUserId || null,
          search_start_datetime: startDate || null,
          search_end_datetime: endDate || null,
        }
      )

      if (rpcError) {
        console.error("Spatial RPC error:", rpcError)
        throw rpcError
      }

      if (!spatialResults || spatialResults.length === 0) {
        return []
      }

      // Step 2: Fetch full session data for the found IDs
      const sessionIds = spatialResults.map((r: any) => r.session_id)
      const { data: sessions, error: sessionsError } = await supabase
        .from("sessions")
        .select("*")
        .in("id", sessionIds)

      if (sessionsError) {
        console.error("Sessions fetch error:", sessionsError)
        throw sessionsError
      }

      // Step 3: Merge distance data with session data
      const sessionsWithDistance: SessionWithDistance[] = sessions.map(
        (session) => {
          const spatialData = spatialResults.find(
            (r: any) => r.session_id === session.id
          )
          return {
            ...session,
            distance_miles: spatialData?.distance_miles || 0,
          }
        }
      )

      // Sort by distance (RPC returns sorted, but just to be sure)
      return sessionsWithDistance.sort(
        (a, b) => a.distance_miles - b.distance_miles
      )
    } catch (error) {
      console.error("Error in getSessionsNearLocation:", error)
      throw error
    }
  },

  /**
   * Get sessions in a specific city/area
   */
  getSessionsInCity: async (
    cityName: string,
    options: Omit<SpatialSearchOptions, "radiusMiles"> = {}
  ): Promise<Session[]> => {
    const { startDate, endDate, excludeUserId } = options

    try {
      // Step 1: Get session IDs from city search RPC
      const { data: cityResults, error: rpcError } = await supabase.rpc(
        "get_sessions_in_city",
        {
          city_name: cityName,
          exclude_user_id: excludeUserId || null,
          search_start_datetime: startDate || null,
          search_end_datetime: endDate || null,
        }
      )

      if (rpcError) {
        console.error("City search RPC error:", rpcError)
        throw rpcError
      }

      if (!cityResults || cityResults.length === 0) {
        return []
      }

      // Step 2: Fetch full session data for the found IDs
      const sessionIds = cityResults.map((r: any) => r.session_id)
      const { data: sessions, error: sessionsError } = await supabase
        .from("sessions")
        .select("*")
        .in("id", sessionIds)

      if (sessionsError) {
        console.error("Sessions fetch error:", sessionsError)
        throw sessionsError
      }

      return sessions || []
    } catch (error) {
      console.error("Error in getSessionsInCity:", error)
      throw error
    }
  },

  /**
   * Get count of nearby sessions for quick stats/badges
   */
  getNearbySessionCount: async (
    latitude: number,
    longitude: number,
    options: SpatialSearchOptions = {}
  ): Promise<number> => {
    const { radiusMiles = 20, startDate, endDate, excludeUserId } = options

    try {
      const { data: count, error } = await supabase.rpc(
        "get_nearby_session_count",
        {
          search_lat: latitude,
          search_lng: longitude,
          radius_miles: radiusMiles,
          exclude_user_id: excludeUserId || null,
          search_start_datetime: startDate || null,
          search_end_datetime: endDate || null,
        }
      )

      if (error) {
        console.error("Session count RPC error:", error)
        throw error
      }

      return count || 0
    } catch (error) {
      console.error("Error in getNearbySessionCount:", error)
      throw error
    }
  },

  /**
   * Smart location resolution for session discovery
   * Priority: GPS location -> Profile location -> Manual search
   */
  findSessionsNearUser: async (
    options: SpatialSearchOptions & {
      excludeUserId?: string
      manualLocationInput?: string
    } = {}
  ): Promise<LocationSearchResult> => {
    const { excludeUserId, manualLocationInput, ...searchOptions } = options

    try {
      // Use proper UTC datetime ranges for future sessions only
      const now = new Date()
      const futureRange = new Date()
      futureRange.setDate(futureRange.getDate() + 30) // 30 days ahead

      const enhancedSearchOptions = {
        ...searchOptions,
        startDate: now.toISOString(), // Current time in UTC
        endDate: futureRange.toISOString(), // 30 days from now in UTC
      }

      console.log(
        "🔍 Searching for sessions within",
        searchOptions.radiusMiles || 20,
        "miles"
      )

      let searchLocation: {
        latitude: number
        longitude: number
        source: "gps" | "profile" | "manual"
      } | null = null
      let sessions: SessionWithDistance[] = []

      // Step 1: Use manual location input if provided (highest priority)
      if (manualLocationInput) {
        try {
          const { locationService } = await import("./locationService")
          const manualLocation = await locationService.getLocationFromAddress(
            manualLocationInput
          )
          if (manualLocation) {
            searchLocation = {
              latitude: manualLocation.latitude,
              longitude: manualLocation.longitude,
              source: "manual" as const,
            }
            sessions = await spatialService.getSessionsNearLocation(
              manualLocation.latitude,
              manualLocation.longitude,
              enhancedSearchOptions
            )
          }
        } catch (manualError) {
          console.error("Manual location input failed:", manualError)
          return {
            sessions: [],
            totalCount: 0,
            searchLocation: null,
            requiresManualLocation: true,
            locationError:
              "Unable to find location. Please check your input and try again.",
          }
        }
      }

      // Step 2: Fallback to GPS if no manual input and permission granted
      if (!searchLocation) {
        try {
          const { locationService } = await import("./locationService")
          const currentLocation =
            await locationService.getCurrentLocationIfPermitted()

          if (currentLocation) {
            searchLocation = {
              latitude: currentLocation.latitude,
              longitude: currentLocation.longitude,
              source: "gps" as const,
            }
            sessions = await spatialService.getSessionsNearLocation(
              currentLocation.latitude,
              currentLocation.longitude,
              enhancedSearchOptions
            )
          }
        } catch (gpsError) {
          console.log("GPS location failed, trying profile location")
        }
      }

      // Step 3: Fallback to profile location if no manual input and no GPS
      if (!searchLocation) {
        try {
          const {
            data: { user },
          } = await supabase.auth.getUser()
          if (user) {
            const { data: userProfile } = await supabase
              .from("users")
              .select("location_point")
              .eq("id", user.id)
              .single()

            if (userProfile?.location_point) {
              // Parse PostGIS point data (same logic as profile page)
              if (
                typeof userProfile.location_point === "object" &&
                "coordinates" in userProfile.location_point &&
                Array.isArray(userProfile.location_point.coordinates)
              ) {
                const coords = userProfile.location_point.coordinates
                searchLocation = {
                  latitude: coords[1],
                  longitude: coords[0],
                  source: "profile" as const,
                }
                sessions = await spatialService.getSessionsNearLocation(
                  coords[1],
                  coords[0],
                  enhancedSearchOptions
                )
              }
            }
          }
        } catch (profileError) {
          console.log("Profile location failed")
        }
      }

      // Step 4: If no location found, indicate manual input is required
      if (!searchLocation) {
        return {
          sessions: [],
          totalCount: 0,
          searchLocation: null,
          requiresManualLocation: true,
          locationError: "Location needed to find nearby games",
        }
      }

      // Return results
      return {
        sessions: sessions || [],
        totalCount: sessions?.length || 0,
        searchLocation,
      }
    } catch (error) {
      console.error("Error in findSessionsNearUser:", error)
      return {
        sessions: [],
        totalCount: 0,
        searchLocation: null,
        requiresManualLocation: true,
        locationError: "Unable to load games. Please try again.",
      }
    }
  },
}
