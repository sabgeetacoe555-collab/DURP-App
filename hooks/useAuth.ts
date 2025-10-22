// hooks/useAuth.ts
import { useEffect, useState } from "react"
import { Session, User } from "@supabase/supabase-js"
import { supabase } from "../lib/supabase"
import { authService } from "../services/authService"
import { LocationData } from "../services/locationService"

export function useAuth() {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setUser(session?.user ?? null)
      setLoading(false)
    })

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
      setUser(session?.user ?? null)
      setLoading(false)
    })

    return () => subscription.unsubscribe()
  }, [])

  // Helper function to get user's display name
  const getUserDisplayName = (): string => {
    if (!user) return "Player"

    // Try to get name from user metadata
    const fullName = user.user_metadata?.full_name
    if (fullName && typeof fullName === "string" && fullName.trim()) {
      // Parse full name and return only the first name
      const firstName = fullName.trim().split(" ")[0]
      return firstName
    }

    // Fallback to first part of email
    if (user.email) {
      const emailPrefix = user.email.split("@")[0]
      return emailPrefix.charAt(0).toUpperCase() + emailPrefix.slice(1)
    }

    return "Player"
  }

  // Helper function to update user profile
  const updateProfile = async (name?: string, phone?: string) => {
    try {
      await authService.updateProfile(name, phone)
      return { success: true }
    } catch (error) {
      console.error("Error updating profile:", error)
      return { success: false, error }
    }
  }

  // Helper function to update user location
  const updateLocation = async (location: LocationData) => {
    try {
      await authService.updateLocation(location)
      return { success: true }
    } catch (error) {
      console.error("Error updating location:", error)
      return { success: false, error }
    }
  }

  return {
    user,
    session,
    loading,
    getUserDisplayName,
    updateProfile,
    updateLocation,
  }
}
