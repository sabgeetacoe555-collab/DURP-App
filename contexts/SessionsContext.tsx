import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react"
import { sessionService } from "@/services/sessionService"
import { spatialService, SessionWithDistance } from "@/services/spatialService"
import { supabase } from "@/lib/supabase"
import { Session } from "@/types"

// Database session type that matches the actual database schema
interface DatabaseSession {
  id: string
  user_id: string
  name?: string
  session_type: string
  session_datetime: string
  end_datetime: string
  location?: string
  location_address?: string
  location_display_address?: string
  max_players?: number
  allow_guests?: boolean
  dupr_min?: number
  dupr_max?: number
  visibility?: string
  session_info?: string
  completed?: boolean
  created_at: string
  updated_at: string
}
import { useAuth } from "@/contexts/AuthContext"
import { useLocation } from "@/contexts/LocationContext"

interface SessionsContextType {
  // User sessions
  sessions: Session[]
  pastSessions: Session[]
  loading: boolean

  // Nearby sessions
  nearbySessions: SessionWithDistance[]
  nearbyLoading: boolean

  // Group sessions (for specific group)
  groupSessions: Record<string, Session[]>
  pastGroupSessions: Record<string, Session[]>
  groupSessionsLoading: Record<string, boolean>

  // Actions
  refreshSessions: () => Promise<void>
  refreshNearbySessions: (radiusMiles?: number) => Promise<void>
  refreshGroupSessions: (groupId: string, memberIds: string[]) => Promise<void>
  addSession: (session: Session) => void
  updateSession: (sessionId: string, updates: Partial<Session>) => void
  removeSession: (sessionId: string) => void

  // Utility functions
  getUpcomingSessions: (limit?: number) => Session[]
  getSessionsByDateRange: (startDate: Date, endDate: Date) => Session[]
  getSessionById: (sessionId: string) => Session | undefined
}

const SessionsContext = createContext<SessionsContextType | undefined>(
  undefined
)

export const useSessions = () => {
  const context = useContext(SessionsContext)
  if (!context) {
    throw new Error("useSessions must be used within a SessionsProvider")
  }
  return context
}

interface SessionsProviderProps {
  children: React.ReactNode
}

export const SessionsProvider: React.FC<SessionsProviderProps> = ({
  children,
}) => {
  const { user, isStartupComplete } = useAuth()
  const { effectiveLocation, hasPermission } = useLocation()

  // User sessions state
  const [sessions, setSessions] = useState<Session[]>([])
  const [pastSessions, setPastSessions] = useState<Session[]>([])
  const [loading, setLoading] = useState(false)

  // Nearby sessions state
  const [nearbySessions, setNearbySessions] = useState<SessionWithDistance[]>(
    []
  )
  const [nearbyLoading, setNearbyLoading] = useState(false)

  // Group sessions state
  const [groupSessions, setGroupSessions] = useState<Record<string, Session[]>>(
    {}
  )
  const [pastGroupSessions, setPastGroupSessions] = useState<
    Record<string, Session[]>
  >({})
  const [groupSessionsLoading, setGroupSessionsLoading] = useState<
    Record<string, boolean>
  >({})

  // Helper function to convert database session to Session type
  const convertDatabaseSession = useCallback(
    (dbSession: DatabaseSession): Session => {
      return {
        id: dbSession.id,
        user_id: dbSession.user_id,
        name: dbSession.name || dbSession.session_type,
        session_type: dbSession.session_type,
        date: dbSession.session_datetime, // Convert session_datetime to date
        start_time: dbSession.session_datetime,
        end_time: dbSession.end_datetime,
        location: dbSession.location,
        location_address: dbSession.location_address,
        location_display_address: dbSession.location_display_address,
        max_players: dbSession.max_players,
        allow_guests: dbSession.allow_guests,
        dupr_min: dbSession.dupr_min,
        dupr_max: dbSession.dupr_max,
        visibility:
          (dbSession.visibility as "public" | "friends" | "private") ||
          "public",
        session_info: dbSession.session_info,
        completed: dbSession.completed,
        created_at: dbSession.created_at,
        updated_at: dbSession.updated_at,
      }
    },
    []
  )

  // Helper function to filter sessions by date
  const filterSessionsByDate = useCallback((allSessions: Session[]) => {
    const now = new Date()
    const future = allSessions.filter((session) => new Date(session.date) > now)
    const past = allSessions.filter((session) => new Date(session.date) <= now)
    return { future, past }
  }, [])

  // Load user sessions
  const refreshSessions = useCallback(async () => {
    if (!user || !isStartupComplete) {
      setSessions([])
      setPastSessions([])
      return
    }

    try {
      setLoading(true)
      const userSessions = await sessionService.getSessions()
      // Convert database sessions to Session type
      const convertedSessions = userSessions.map(convertDatabaseSession)
      const { future, past } = filterSessionsByDate(convertedSessions)

      setSessions(future)
      setPastSessions(past)
    } catch (error) {
      console.error("Error loading sessions:", error)
      setSessions([])
      setPastSessions([])
    } finally {
      setLoading(false)
    }
  }, [user, isStartupComplete, filterSessionsByDate, convertDatabaseSession])

  // Load nearby sessions
  const refreshNearbySessions = useCallback(
    async (radiusMiles: number = 20) => {
      if (!effectiveLocation || !hasPermission) {
        setNearbySessions([])
        return
      }

      try {
        setNearbyLoading(true)
        const nearby = await spatialService.getSessionsNearLocation(
          effectiveLocation.latitude,
          effectiveLocation.longitude,
          {
            radiusMiles,
            excludeUserId: user?.id,
          }
        )
        setNearbySessions(nearby)
      } catch (error) {
        console.error("Error loading nearby sessions:", error)
        setNearbySessions([])
      } finally {
        setNearbyLoading(false)
      }
    },
    [effectiveLocation, hasPermission, user?.id]
  )

  // Load group sessions
  const refreshGroupSessions = useCallback(
    async (groupId: string, memberIds: string[]) => {
      if (!groupId || memberIds.length === 0) {
        setGroupSessions((prev) => ({ ...prev, [groupId]: [] }))
        setPastGroupSessions((prev) => ({ ...prev, [groupId]: [] }))
        return
      }

      try {
        setGroupSessionsLoading((prev) => ({ ...prev, [groupId]: true }))

        const { data: groupSessionsData, error } = await supabase
          .from("sessions")
          .select("*")
          .in("user_id", memberIds)
          .order("session_datetime", { ascending: true })

        if (error) {
          console.error("Error loading group sessions:", error)
          setGroupSessions((prev) => ({ ...prev, [groupId]: [] }))
          setPastGroupSessions((prev) => ({ ...prev, [groupId]: [] }))
          return
        }

        // Convert database sessions to Session type
        const convertedSessions = (groupSessionsData || []).map(
          convertDatabaseSession
        )
        const { future, past } = filterSessionsByDate(convertedSessions)

        setGroupSessions((prev) => ({ ...prev, [groupId]: future }))
        setPastGroupSessions((prev) => ({ ...prev, [groupId]: past }))
      } catch (error) {
        console.error("Error loading group sessions:", error)
        setGroupSessions((prev) => ({ ...prev, [groupId]: [] }))
        setPastGroupSessions((prev) => ({ ...prev, [groupId]: [] }))
      } finally {
        setGroupSessionsLoading((prev) => ({ ...prev, [groupId]: false }))
      }
    },
    [filterSessionsByDate, convertDatabaseSession]
  )

  // Add a new session
  const addSession = useCallback(
    (session: Session) => {
      const { future, past } = filterSessionsByDate([session])

      if (future.length > 0) {
        setSessions((prev) =>
          [...prev, ...future].sort(
            (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
          )
        )
      }
      if (past.length > 0) {
        setPastSessions((prev) =>
          [...prev, ...past].sort(
            (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
          )
        )
      }
    },
    [filterSessionsByDate]
  )

  // Update an existing session
  const updateSession = useCallback(
    (sessionId: string, updates: Partial<Session>) => {
      setSessions((prev) =>
        prev.map((session) =>
          session.id === sessionId ? { ...session, ...updates } : session
        )
      )
      setPastSessions((prev) =>
        prev.map((session) =>
          session.id === sessionId ? { ...session, ...updates } : session
        )
      )

      // Also update group sessions if they exist
      setGroupSessions((prev) => {
        const updated = { ...prev }
        Object.keys(updated).forEach((groupId) => {
          updated[groupId] = updated[groupId].map((session) =>
            session.id === sessionId ? { ...session, ...updates } : session
          )
        })
        return updated
      })

      setPastGroupSessions((prev) => {
        const updated = { ...prev }
        Object.keys(updated).forEach((groupId) => {
          updated[groupId] = updated[groupId].map((session) =>
            session.id === sessionId ? { ...session, ...updates } : session
          )
        })
        return updated
      })
    },
    []
  )

  // Remove a session
  const removeSession = useCallback((sessionId: string) => {
    setSessions((prev) => prev.filter((session) => session.id !== sessionId))
    setPastSessions((prev) =>
      prev.filter((session) => session.id !== sessionId)
    )

    // Also remove from group sessions if they exist
    setGroupSessions((prev) => {
      const updated = { ...prev }
      Object.keys(updated).forEach((groupId) => {
        updated[groupId] = updated[groupId].filter(
          (session) => session.id !== sessionId
        )
      })
      return updated
    })

    setPastGroupSessions((prev) => {
      const updated = { ...prev }
      Object.keys(updated).forEach((groupId) => {
        updated[groupId] = updated[groupId].filter(
          (session) => session.id !== sessionId
        )
      })
      return updated
    })
  }, [])

  // Utility functions
  const getUpcomingSessions = useCallback(
    (limit: number = 3) => {
      return sessions
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
        .slice(0, limit)
    },
    [sessions]
  )

  const getSessionsByDateRange = useCallback(
    (startDate: Date, endDate: Date) => {
      return sessions.filter((session) => {
        const sessionDate = new Date(session.date)
        return sessionDate >= startDate && sessionDate <= endDate
      })
    },
    [sessions]
  )

  const getSessionById = useCallback(
    (sessionId: string) => {
      return [...sessions, ...pastSessions].find(
        (session) => session.id === sessionId
      )
    },
    [sessions, pastSessions]
  )

  // Load sessions when user changes
  useEffect(() => {
    refreshSessions()
  }, [refreshSessions])

  // Load nearby sessions when location changes
  useEffect(() => {
    if (effectiveLocation && hasPermission) {
      refreshNearbySessions()
    }
  }, [effectiveLocation, hasPermission, refreshNearbySessions])

  const value: SessionsContextType = {
    // User sessions
    sessions,
    pastSessions,
    loading,

    // Nearby sessions
    nearbySessions,
    nearbyLoading,

    // Group sessions
    groupSessions,
    pastGroupSessions,
    groupSessionsLoading,

    // Actions
    refreshSessions,
    refreshNearbySessions,
    refreshGroupSessions,
    addSession,
    updateSession,
    removeSession,

    // Utility functions
    getUpcomingSessions,
    getSessionsByDateRange,
    getSessionById,
  }

  return (
    <SessionsContext.Provider value={value}>
      {children}
    </SessionsContext.Provider>
  )
}
