// services/authService.ts
import { supabase } from "../lib/supabase"
import { Alert } from "react-native"
import { LocationData } from "./locationService"

export const authService = {
  // Email/Password Sign Up
  signUp: async (
    email: string,
    password: string,
    name?: string,
    phone?: string,
    location?: LocationData | null
  ) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: name,
        },
      },
    })

    if (error) {
      Alert.alert("Sign Up Error", error.message)
      throw error
    }

    // If phone number is provided, save it to the users table
    if (phone && data.user) {
      try {
        const { error: phoneError } = await supabase
          .from("users")
          .update({ phone: phone })
          .eq("id", data.user.id)

        if (phoneError) {
          console.error(
            "❌ AUTH SERVICE - Error saving phone number:",
            phoneError
          )
        } else {
          console.log("✅ AUTH SERVICE - Phone number saved successfully")
        }
      } catch (phoneError) {
        console.error(
          "❌ AUTH SERVICE - Exception saving phone number:",
          phoneError
        )
      }
    }

    // If location data is provided, save it to the users table
    if (location && data.user) {
      console.log(
        "🔍 AUTH SERVICE - Starting location save for user:",
        data.user.id
      )
      console.log("🔍 AUTH SERVICE - Location data:", {
        latitude: location.latitude,
        longitude: location.longitude,
        address: location.address,
        displayAddress: location.displayAddress,
      })

      try {
        const locationPoint = `POINT(${location.longitude} ${location.latitude})`
        console.log("🔍 AUTH SERVICE - PostGIS point string:", locationPoint)

        // Use the new database function for better reliability
        const { error: locationError } = await supabase.rpc(
          "update_user_location",
          {
            user_id: data.user.id,
            location_point: locationPoint,
            location_address: location.address,
            location_display_address: location.displayAddress,
          }
        )

        if (locationError) {
          console.error(
            "❌ AUTH SERVICE - Error saving location data:",
            locationError
          )
          console.error("❌ AUTH SERVICE - Error details:", {
            message: locationError.message,
            details: locationError.details,
            hint: locationError.hint,
          })
        } else {
          console.log("✅ AUTH SERVICE - Location data saved successfully")
        }
      } catch (locationError) {
        console.error(
          "❌ AUTH SERVICE - Exception saving location data:",
          locationError
        )
      }
    } else {
      console.log("🔍 AUTH SERVICE - No location data or user to save")
    }

    return data
  },

  // Email/Password Sign In
  signIn: async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      Alert.alert("Sign In Error", error.message)
      throw error
    }

    return data
  },

  // Google Sign In
  signInWithGoogle: async () => {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: "netgains://auth",
      },
    })

    if (error) {
      Alert.alert("Google Sign In Error", error.message)
      throw error
    }

    return data
  },

  // Apple Sign In
  signInWithApple: async () => {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: "apple",
      options: {
        redirectTo: "netgains://auth",
      },
    })

    if (error) {
      Alert.alert("Apple Sign In Error", error.message)
      throw error
    }

    return data
  },

  // Sign Out
  signOut: async () => {
    const { error } = await supabase.auth.signOut()

    if (error) {
      Alert.alert("Sign Out Error", error.message)
      throw error
    }
  },

  // Reset Password
  resetPassword: async (email: string) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: "netgains://reset-password",
    })

    if (error) {
      Alert.alert("Reset Password Error", error.message)
      throw error
    }
  },

  // Update User Profile
  updateProfile: async (name?: string, phone?: string) => {
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      throw new Error("No authenticated user")
    }

    const { error } = await supabase.rpc("update_user_profile", {
      user_id: user.id,
      name: name,
      phone: phone,
    })

    if (error) {
      console.error("Error updating profile:", error)
      throw error
    }

    return { success: true }
  },

  // Update User Location
  updateLocation: async (location: LocationData) => {
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      throw new Error("No authenticated user")
    }

    const locationPoint = `POINT(${location.longitude} ${location.latitude})`

    const { error } = await supabase.rpc("update_user_location", {
      user_id: user.id,
      location_point: locationPoint,
      location_address: location.address,
      location_display_address: location.displayAddress,
    })

    if (error) {
      console.error("Error updating location:", error)
      throw error
    }

    return { success: true }
  },

  // Get User Location
  getUserLocation: async (userId: string): Promise<LocationData | null> => {
    try {
      const { data: userProfile, error } = await supabase
        .from("users")
        .select("location_point, location_address, location_display_address")
        .eq("id", userId)
        .single()

      if (error) {
        console.error("Error fetching user location:", error)
        return null
      }

      if (!userProfile?.location_point) {
        return null
      }

      // Parse PostGIS point data
      if (
        typeof userProfile.location_point === "object" &&
        "coordinates" in userProfile.location_point &&
        Array.isArray(userProfile.location_point.coordinates)
      ) {
        const coords = userProfile.location_point.coordinates
        return {
          latitude: coords[1], // latitude is second coordinate
          longitude: coords[0], // longitude is first coordinate
          address: userProfile.location_address || undefined,
          displayAddress: userProfile.location_display_address || undefined,
        }
      }

      return null
    } catch (error) {
      console.error("Error getting user location:", error)
      return null
    }
  },
}
