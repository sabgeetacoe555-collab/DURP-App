import React, { createContext, useContext, useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"
import { User } from "@supabase/supabase-js"
import { startupService, StartupProgress } from "@/services/startupService"
import { deepLinkHandler } from "@/utils/deepLinkHandler"

interface UserData {
  id: string
  email?: string
  dupr_id?: string
  dupr_rating_singles?: number
  dupr_rating_doubles?: number
  location_address?: string
  location_display_address?: string
  location_point?: unknown | null
  location_updated_at?: string | null
  created_at: string
  updated_at: string
}

interface AuthContextType {
  user: User | null
  userData: UserData | null
  isLoading: boolean
  isStartupComplete: boolean
  startupProgress: StartupProgress | null
  signOut: () => Promise<void>
  refreshUserData: () => Promise<void>
  // DUPR specific data
  duprId: string | null
  singlesRating: number | null
  doublesRating: number | null
  isDuprConnected: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}

interface AuthProviderProps {
  children: React.ReactNode
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null)
  const [userData, setUserData] = useState<UserData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isStartupComplete, setIsStartupComplete] = useState(false)
  const [startupProgress, setStartupProgress] =
    useState<StartupProgress | null>(null)
  const [isStartupRunning, setIsStartupRunning] = useState(false)

  const loadUserData = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from("users")
        .select("*")
        .eq("id", userId)
        .single()

      if (error) {
        console.error("AuthContext: Error loading user data:", error)
        // Create user profile if it doesn't exist
        if (error.code === "PGRST116") {
          const { data: newUserData, error: createError } = await supabase
            .from("users")
            .insert({
              id: userId,
              email: user?.email,
            })
            .select()
            .single()

          if (newUserData && !createError) {
            setUserData(newUserData)
          } else if (createError) {
            console.error(
              "AuthContext: Error creating user profile:",
              createError
            )
          }
        }
      } else {
        setUserData(data)
      }
    } catch (err) {
      console.error("AuthContext: Error in loadUserData:", err)
    }
  }

  const refreshUserData = async () => {
    if (user) {
      await loadUserData(user.id)
    }
  }

  const signOut = async () => {
    try {
      await supabase.auth.signOut()
    } catch (error) {
      console.error("Error signing out:", error)
    }
  }

  // Startup function to coordinate all data loading
  const performStartup = async (sessionUser: User) => {
    // Prevent duplicate startup calls
    if (isStartupRunning) {
      console.log(
        "AuthContext: Startup already running, skipping duplicate call"
      )
      return
    }

    setIsStartupRunning(true)
    const authStartupStart = Date.now()
    let warningTimer: ReturnType<typeof setTimeout> | undefined

    try {
      console.log(
        "AuthContext: Starting app initialization for user:",
        sessionUser.id
      )

      // Set up progress callback
      startupService.setProgressCallback((progress) => {
        setStartupProgress(progress)
      })

      // Add warning timer
      warningTimer = setTimeout(() => {
        console.warn(
          "[AuthContext] Startup is taking longer than expected (5s+)"
        )
      }, 5000)

      // Add timeout protection
      const startupPromise = Promise.race([
        startupService.initializeApp(sessionUser.id),
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error("Startup timeout")), 10000)
        ),
      ])

      // Use startup service to coordinate initialization
      const startupServiceDuration = Date.now() - authStartupStart
      console.log(
        `[AuthContext] Startup service completed in ${startupServiceDuration}ms`
      )
      await startupPromise

      // Clear warning timer since startup completed
      clearTimeout(warningTimer)

      // Load user data
      const userDataStart = Date.now()
      await loadUserData(sessionUser.id)
      const userDataDuration = Date.now() - userDataStart
      console.log(`[AuthContext] User data loaded in ${userDataDuration}ms`)

      setIsStartupComplete(true)
      const totalAuthDuration = Date.now() - authStartupStart
      console.log(
        `[AuthContext] Total startup completed in ${totalAuthDuration}ms`
      )

      // Check for pending invites from deep links
      try {
        const pendingInviteResult = await deepLinkHandler.checkPendingInvites()
        if (pendingInviteResult && pendingInviteResult.success) {
          console.log("Pending invite processed:", pendingInviteResult)
          // The navigation will be handled by the useNotificationNavigation hook
        }
      } catch (error) {
        console.error("Error checking pending invites:", error)
      }
    } catch (error) {
      const totalAuthDuration = Date.now() - authStartupStart
      console.error(
        `[AuthContext] Error during startup (${totalAuthDuration}ms):`,
        error
      )
      // Even if there's an error, mark startup as complete to prevent infinite loading
      setIsStartupComplete(true)
    } finally {
      setIsStartupRunning(false)
      // Clear warning timer in case of error
      if (warningTimer) {
        clearTimeout(warningTimer)
      }
    }
  }

  useEffect(() => {
    // Get initial session
    const getInitialSession = async () => {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession()
        setUser(session?.user ?? null)

        if (session?.user) {
          await performStartup(session.user)
        } else {
          setIsStartupComplete(true)
        }
      } catch (error) {
        console.error("Error getting initial session:", error)
        setIsStartupComplete(true)
      } finally {
        setIsLoading(false)
      }
    }

    getInitialSession()

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      setUser(session?.user ?? null)

      if (session?.user) {
        await performStartup(session.user)
      } else {
        setUserData(null)
        setIsStartupComplete(true)
      }

      setIsLoading(false)
    })

    return () => subscription.unsubscribe()
  }, [])

  // Compute DUPR-related values
  const duprId = userData?.dupr_id || null
  const singlesRating = userData?.dupr_rating_singles || null
  const doublesRating = userData?.dupr_rating_doubles || null
  const isDuprConnected = !!duprId

  const value: AuthContextType = {
    user,
    userData,
    isLoading,
    isStartupComplete,
    startupProgress,
    signOut,
    refreshUserData,
    duprId,
    singlesRating,
    doublesRating,
    isDuprConnected,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
