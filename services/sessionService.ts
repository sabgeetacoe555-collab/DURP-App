import { supabase } from "../lib/supabase"
import { Alert } from "react-native"
import {
  Session,
  User,
  CreateSessionData,
  CreateSessionInviteData,
  SessionInvite,
} from "../types"
import { LocationData } from "./locationService"

export const sessionService = {
  // Create a new session (pre-play)
  createSession: async (
    sessionData: Omit<Session, "id" | "user_id" | "created_at" | "updated_at">
  ) => {
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      Alert.alert("Authentication Error", "Please sign in to save sessions")
      throw new Error("User not authenticated")
    }

    const { data, error } = await supabase
      .from("sessions")
      .insert({
        user_id: user.id,
        // UTC timestamp fields (required)
        session_datetime: sessionData.session_datetime,
        end_datetime: sessionData.end_datetime,
        location: sessionData.location,
        session_type: sessionData.session_type,
        focus_type: sessionData.focus_type,
        mood: sessionData.mood,
        body_readiness: sessionData.body_readiness,
        completed: sessionData.completed,
        confidence: sessionData.confidence,
        intensity: sessionData.intensity,
        goal_achievement: sessionData.goal_achievement,
        reflection_tags: sessionData.reflection_tags,
        // New fields for planned sessions
        name: sessionData.name,
        is_public: sessionData.is_public,
        min_dupr_rating: sessionData.min_dupr_rating,
        max_dupr_rating: sessionData.max_dupr_rating,
        max_players: sessionData.max_players,
        allow_friends: sessionData.allow_friends,
        session_status: sessionData.session_status || "planned",
      })
      .select()
      .single()

    if (error) {
      Alert.alert("Save Error", error.message)
      throw error
    }

    return data
  },

  // Create a new social session (Phase 1 enhanced session creation)
  createSocialSession: async (socialSessionData: {
    session_datetime: string // ISO 8601 UTC timestamp
    end_datetime: string // ISO 8601 UTC timestamp
    location: string
    session_type: string
    session_info?: string // Additional session information
    visibility: string
    max_players: number
    allow_guests: boolean
    dupr_min?: number | null
    dupr_max?: number | null
    locationData?: LocationData | null
    invites?: CreateSessionInviteData[]
  }) => {
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      Alert.alert("Authentication Error", "Please sign in to save sessions")
      throw new Error("User not authenticated")
    }

    // Prepare session data for database
    const sessionInsertData: any = {
      user_id: user.id,
      // UTC timestamp fields (required)
      session_datetime: socialSessionData.session_datetime,
      end_datetime: socialSessionData.end_datetime,
      location: socialSessionData.location,
      session_type: socialSessionData.session_type,
      session_info: socialSessionData.session_info, // Additional session information
      visibility: socialSessionData.visibility,
      max_players: socialSessionData.max_players,
      allow_guests: socialSessionData.allow_guests,
      dupr_min: socialSessionData.dupr_min,
      dupr_max: socialSessionData.dupr_max,
      status: "scheduled",
      completed: false,
      focus_type: [], // Default empty array for social sessions
    }

    // Add PostGIS location data if available
    if (socialSessionData.locationData) {
      sessionInsertData.location_point = `POINT(${socialSessionData.locationData.longitude} ${socialSessionData.locationData.latitude})`
      sessionInsertData.location_address =
        socialSessionData.locationData.address
      sessionInsertData.location_display_address =
        socialSessionData.locationData.displayAddress
      sessionInsertData.location_updated_at = new Date().toISOString()
    }

    const { data, error } = await supabase
      .from("sessions")
      .insert(sessionInsertData)
      .select()
      .single()

    if (error) {
      Alert.alert("Save Error", error.message)
      throw error
    }

    // Create invites if provided
    if (socialSessionData.invites && socialSessionData.invites.length > 0) {
      const invitePromises = socialSessionData.invites.map((invite) =>
        supabase.from("session_invites").insert({
          session_id: data.id,
          inviter_id: user.id,
          invitee_name: invite.invitee_name,
          invitee_phone: invite.invitee_phone,
          invitee_email: invite.invitee_email,
          status: "pending",
          notification_sent: false,
          sms_sent: false,
        })
      )

      try {
        await Promise.all(invitePromises)
      } catch (inviteError) {
        console.error("Error creating invites:", inviteError)
        // Don't throw here - session was created successfully, invites are optional
      }
    }

    return data
  },

  // Get all sessions for the current user
  getSessions: async () => {
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      Alert.alert("Authentication Error", "Please sign in to view sessions")
      throw new Error("User not authenticated")
    }

    try {
      // Get user's phone number for matching external invites
      const { data: userData, error: userError } = await supabase
        .from("users")
        .select("phone")
        .eq("id", user.id)
        .single()

      if (userError) {
        console.error("Error fetching user data:", userError)
        // Continue without phone - will only show created sessions
      }

      const userPhone = userData?.phone

      // Get sessions created by the user with invite counts
      const { data: createdSessions, error: createdError } = await supabase
        .from("sessions")
        .select(
          `
            *,
            session_invites(count)
          `
        )
        .eq("user_id", user.id)

      if (createdError) {
        console.error("Error fetching created sessions:", createdError)
        throw createdError
      }

      // Get sessions where user has accepted invites (using direct session access)
      // We'll try to fetch invited sessions directly by querying sessions table
      // with a list of session IDs from accepted invites

      let invitedSessions = []
      // Process invited sessions if we have user phone (which we should)
      if (userPhone) {
        try {
          // First get the session IDs from accepted invites
          const { data: acceptedInvites, error: invitesError } = await supabase
            .from("session_invites")
            .select("session_id")
            .eq("status", "accepted")
            .or(`invitee_id.eq.${user.id},invitee_phone.eq.${userPhone}`)

          if (!invitesError && acceptedInvites && acceptedInvites.length > 0) {
            const sessionIds = acceptedInvites.map(
              (invite) => invite.session_id
            )

            // Try to fetch these sessions directly - this will work if RLS allows it
            const { data: sessionData, error: sessionsError } = await supabase
              .from("sessions")
              .select("*")
              .in("id", sessionIds)

            if (!sessionsError && sessionData && sessionData.length > 0) {
              invitedSessions = sessionData
              console.log(
                `✅ Successfully fetched ${sessionData.length} real session data`
              )
            } else {
              if (sessionsError) {
                console.log(
                  "Direct session access failed (expected due to RLS):",
                  sessionsError?.message
                )
              } else {
                console.log(
                  "Direct session access returned empty array (RLS blocking)"
                )
              }

              // Fallback: create placeholder sessions with the correct IDs
              console.log(
                `📝 Creating ${sessionIds.length} placeholder sessions`
              )
              invitedSessions = sessionIds.map((sessionId) => ({
                id: sessionId,
                name: "Session (Joined via Invite)",
                session_type: "social",
                location: "Location from invite",
                session_datetime: new Date(
                  Date.now() + 24 * 60 * 60 * 1000
                ).toISOString(), // Tomorrow
                end_datetime: new Date(
                  Date.now() + 25 * 60 * 60 * 1000
                ).toISOString(), // Tomorrow + 1 hour
                max_players: 4,
                allow_guests: true,
                dupr_min: null,
                dupr_max: null,
                visibility: "private",
                user_id: "invited-session",
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
                session_status: "planned",
                status: "scheduled",
              }))
            }
          }
        } catch (error) {
          console.error("Error fetching invited sessions:", error)
        }
      }

      // Combine and deduplicate sessions
      const allSessions = [...(createdSessions || [])]

      if (invitedSessions.length > 0) {
        const filteredInvitedSessions = invitedSessions.filter(
          (session) =>
            !allSessions.some((existing) => existing.id === session.id)
        )
        console.log(
          `➕ Adding ${filteredInvitedSessions.length} invited sessions to list`
        )
        allSessions.push(...filteredInvitedSessions)
      }

      // Add invite statistics to all sessions
      const sessionsWithStats = await Promise.all(
        allSessions.map(async (session) => {
          try {
            // Get total invite count for this session
            const { count: inviteCount } = await supabase
              .from("session_invites")
              .select("*", { count: "exact" })
              .eq("session_id", session.id)

            // Calculate stats
            const totalInvited = (inviteCount || 0) + 1 // +1 for creator
            const totalAccepted =
              (session.accepted_participants?.length || 0) + 1 // +1 for creator

            return {
              ...session,
              invite_stats: {
                total_invited: totalInvited,
                total_accepted: totalAccepted,
              },
            }
          } catch (error) {
            console.error(
              "Error calculating invite stats for session:",
              session.id,
              error
            )
            // Fallback stats
            return {
              ...session,
              invite_stats: {
                total_invited: 1, // Just creator
                total_accepted: 1, // Just creator
              },
            }
          }
        })
      )

      // Sort by session datetime (closest to now first for upcoming sessions)
      sessionsWithStats.sort(
        (a, b) =>
          new Date(a.session_datetime).getTime() -
          new Date(b.session_datetime).getTime()
      )

      console.log(
        `Found ${sessionsWithStats.length} sessions (${
          createdSessions?.length || 0
        } created, ${invitedSessions?.length || 0} invited)`
      )

      return sessionsWithStats
    } catch (error) {
      console.error("Error in getSessions:", error)
      Alert.alert("Fetch Error", "Failed to load sessions")
      throw error
    }
  },

  // Get a single session by ID
  getSessionById: async (sessionId: string) => {
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      Alert.alert("Authentication Error", "Please sign in to view sessions")
      throw new Error("User not authenticated")
    }

    const { data, error } = await supabase
      .from("sessions")
      .select("*")
      .eq("id", sessionId)
      .single()

    if (error) {
      Alert.alert("Fetch Error", error.message)
      throw error
    }

    return data
  },

  // Get session invites where current user is the inviter
  getSessionInvites: async () => {
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      throw new Error("User not authenticated")
    }

    const { data, error } = await supabase
      .from("session_invites")
      .select("*")
      .eq("inviter_id", user.id)
      .order("created_at", { ascending: false })

    if (error) {
      console.error("Error fetching session invites:", error)
      throw error
    }

    return data || []
  },

  // Get unique invitees from session invites (deduplicated by phone number)
  getUniqueInvitees: async () => {
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      throw new Error("User not authenticated")
    }

    const { data, error } = await supabase
      .from("session_invites")
      .select("invitee_name, invitee_phone, invitee_email")
      .eq("inviter_id", user.id)
      .not("invitee_phone", "is", null)
      .order("created_at", { ascending: false })

    if (error) {
      console.error("Error fetching unique invitees:", error)
      throw error
    }

    // Deduplicate by phone number
    const uniqueInvitees =
      data?.reduce((acc, invite) => {
        if (
          invite.invitee_phone &&
          !acc.some(
            (existing) => existing.invitee_phone === invite.invitee_phone
          )
        ) {
          acc.push(invite)
        }
        return acc
      }, [] as typeof data) || []

    return uniqueInvitees
  },

  // Get friends: app users who have accepted session invites from current user
  getFriends: async () => {
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      throw new Error("User not authenticated")
    }

    try {
      // Get accepted invites where invitee has an account (invitee_id is not null)
      const { data: acceptedInvites, error: invitesError } = await supabase
        .from("session_invites")
        .select("invitee_id")
        .eq("inviter_id", user.id)
        .eq("status", "accepted")
        .not("invitee_id", "is", null)

      if (invitesError) {
        console.error("Error fetching accepted invites:", invitesError)
        throw invitesError
      }

      if (!acceptedInvites || acceptedInvites.length === 0) {
        console.log("No accepted invites found")
        return []
      }

      // Extract unique invitee IDs
      const inviteeIds = [
        ...new Set(acceptedInvites.map((invite) => invite.invitee_id)),
      ]

      // Fetch user data for these invitees
      const { data: userData, error: userError } = await supabase
        .from("users")
        .select("id, name, email, phone")
        .in("id", inviteeIds)

      if (userError) {
        console.error("Error fetching user data:", userError)
        throw userError
      }

      // Map to the expected format
      const uniqueFriends =
        userData?.map((user) => ({
          id: user.id,
          name: user.name,
          email: user.email,
          phone: user.phone,
          is_app_user: true,
        })) || []

      console.log(
        `Found ${uniqueFriends.length} friends (app users who accepted invites)`
      )
      return uniqueFriends
    } catch (error) {
      console.error("Error in getFriends:", error)
      throw error
    }
  },

  // Update a session
  updateSession: async (id: string, updates: Partial<Session>) => {
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      Alert.alert("Authentication Error", "Please sign in to update sessions")
      throw new Error("User not authenticated")
    }

    const { data, error } = await supabase
      .from("sessions")
      .update(updates)
      .eq("id", id)
      .eq("user_id", user.id) // SECURITY: Only update sessions owned by current user
      .select()
      .single()

    if (error) {
      Alert.alert("Update Error", error.message)
      throw error
    }

    return data
  },

  // Delete a session
  deleteSession: async (id: string) => {
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      Alert.alert("Authentication Error", "Please sign in to delete sessions")
      throw new Error("User not authenticated")
    }

    const { error } = await supabase
      .from("sessions")
      .delete()
      .eq("id", id)
      .eq("user_id", user.id) // SECURITY: Only delete sessions owned by current user

    if (error) {
      Alert.alert("Delete Error", error.message)
      throw error
    }
  },

  // Get the last incomplete session for the current user
  getLastIncompleteSession: async () => {
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      Alert.alert("Authentication Error", "Please sign in to access sessions")
      throw new Error("User not authenticated")
    }

    const { data, error } = await supabase
      .from("sessions")
      .select("*")
      .eq("user_id", user.id)
      .eq("completed", false)
      .order("created_at", { ascending: false })
      .limit(1)
      .single()

    if (error) {
      if (error.code === "PGRST116") {
        // No incomplete sessions found
        return null
      }
      Alert.alert("Fetch Error", error.message)
      throw error
    }

    return data
  },

  // Get public sessions for discovery (Phase 2)
  getPublicSessions: async () => {
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      Alert.alert("Authentication Error", "Please sign in to access sessions")
      throw new Error("User not authenticated")
    }

    const { data, error } = await supabase
      .from("sessions")
      .select("*")
      .eq("visibility", "public")
      .eq("status", "scheduled")
      .neq("user_id", user.id) // Exclude user's own sessions
      .order("date", { ascending: true })
      .order("start_time", { ascending: true })

    if (error) {
      Alert.alert("Fetch Error", error.message)
      throw error
    }

    return data
  },

  // Leaderboard functions
  getMostSessionsLeaderboard: async () => {
    const { data, error } = await supabase
      .from("sessions")
      .select(
        `
        user_id,
        completed,
        users!sessions_user_id_fkey(name, dupr_rating_singles, dupr_rating_doubles)
      `
      )
      .eq("completed", true)

    if (error) throw error

    const sessionCounts =
      data?.reduce((acc, session) => {
        const userId = session.user_id
        acc[userId] = (acc[userId] || 0) + 1
        return acc
      }, {} as Record<string, number>) || {}

    return Object.entries(sessionCounts)
      .map(([userId, count]) => {
        const userData = data?.find((s) => s.user_id === userId)?.users as any
        return {
          userId,
          name: userData?.name || "Anonymous",
          dupr_rating_singles: userData?.dupr_rating_singles,
          dupr_rating_doubles: userData?.dupr_rating_doubles,
          score: count,
        }
      })
      .sort((a, b) => b.score - a.score)
      .slice(0, 10)
  },

  getAverageMoodLeaderboard: async () => {
    const { data, error } = await supabase
      .from("sessions")
      .select(
        `
        user_id,
        mood,
        users!sessions_user_id_fkey(name, dupr_rating_singles, dupr_rating_doubles)
      `
      )
      .not("mood", "is", null)
      .eq("completed", true)

    if (error) throw error

    const moodSums =
      data?.reduce((acc, session) => {
        const userId = session.user_id
        if (!acc[userId]) acc[userId] = { sum: 0, count: 0 }
        acc[userId].sum += session.mood || 0
        acc[userId].count += 1
        return acc
      }, {} as Record<string, { sum: number; count: number }>) || {}

    return Object.entries(moodSums)
      .map(([userId, { sum, count }]) => {
        const userData = data?.find((s) => s.user_id === userId)?.users as any
        return {
          userId,
          name: userData?.name || "Anonymous",
          dupr_rating_singles: userData?.dupr_rating_singles,
          dupr_rating_doubles: userData?.dupr_rating_doubles,
          score: Math.round((sum / count) * 10) / 10,
        }
      })
      .sort((a, b) => b.score - a.score)
      .slice(0, 10)
  },

  getAverageConfidenceLeaderboard: async () => {
    const { data, error } = await supabase
      .from("sessions")
      .select(
        `
        user_id,
        confidence,
        users!sessions_user_id_fkey(name, dupr_rating_singles, dupr_rating_doubles)
      `
      )
      .not("confidence", "is", null)
      .eq("completed", true)

    if (error) throw error

    const confidenceSums =
      data?.reduce((acc, session) => {
        const userId = session.user_id
        if (!acc[userId]) acc[userId] = { sum: 0, count: 0 }
        acc[userId].sum += session.confidence || 0
        acc[userId].count += 1
        return acc
      }, {} as Record<string, { sum: number; count: number }>) || {}

    return Object.entries(confidenceSums)
      .map(([userId, { sum, count }]) => {
        const userData = data?.find((s) => s.user_id === userId)?.users as any
        return {
          userId,
          name: userData?.name || "Anonymous",
          dupr_rating_singles: userData?.dupr_rating_singles,
          dupr_rating_doubles: userData?.dupr_rating_doubles,
          score: Math.round((sum / count) * 10) / 10,
        }
      })
      .sort((a, b) => b.score - a.score)
      .slice(0, 10)
  },

  getDuprRatingsLeaderboard: async () => {
    const { data, error } = await supabase
      .from("users")
      .select("id, name, dupr_rating_singles, dupr_rating_doubles")
      .not("dupr_rating_singles", "is", null)
      .order("dupr_rating_singles", { ascending: false })
      .limit(10)

    if (error) throw error

    return (
      data?.map((user) => ({
        userId: user.id,
        name: user.name || "Anonymous",
        dupr_rating_singles: user.dupr_rating_singles,
        dupr_rating_doubles: user.dupr_rating_doubles,
        score: user.dupr_rating_singles || 0,
      })) || []
    )
  },

  // Add invites to an existing session
  addInvitesToSession: async (
    sessionId: string,
    invites: CreateSessionInviteData[]
  ) => {
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      Alert.alert("Authentication Error", "Please sign in to add invites")
      throw new Error("User not authenticated")
    }

    // Get session details for notifications
    const { data: session, error: sessionError } = await supabase
      .from("sessions")
      .select("session_type, location, session_datetime, max_players")
      .eq("id", sessionId)
      .single()

    if (sessionError) {
      throw new Error("Failed to fetch session details")
    }

    // Create invites for the session
    const invitePromises = invites.map(async (invite) => {
      const inviteData = {
        session_id: sessionId,
        inviter_id: user.id,
        invitee_name: invite.invitee_name,
        invitee_phone: invite.invitee_phone,
        invitee_email: invite.invitee_email,
        status: "pending",
        notification_sent: false,
        sms_sent: false,
      }

      const { data: createdInvite, error: inviteError } = await supabase
        .from("session_invites")
        .insert(inviteData)
        .select()
        .single()

      if (inviteError) {
        throw inviteError
      }

      // If this is an internal invite (has invitee_id), send push notification
      if (invite.invitee_id) {
        try {
          // TODO: Implement push notification service
          console.log("Would send push notification to:", invite.invitee_id)

          // Update notification_sent status
          await supabase
            .from("session_invites")
            .update({ notification_sent: true })
            .eq("id", createdInvite.id)
        } catch (notificationError) {
          console.error("Failed to send notification:", notificationError)
        }
      } else if (invite.invitee_phone) {
        // External invite via SMS - mark as SMS sent
        await supabase
          .from("session_invites")
          .update({ sms_sent: true })
          .eq("id", createdInvite.id)
      }

      return createdInvite
    })

    try {
      await Promise.all(invitePromises)
    } catch (inviteError) {
      console.error("Error creating invites:", inviteError)
      throw new Error("Failed to create invites")
    }
  },

  // Get session invites where current user is the invitee
  getReceivedSessionInvites: async () => {
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      throw new Error("User not authenticated")
    }

    const { data, error } = await supabase
      .from("session_invites")
      .select(
        `
        *,
        sessions (
          id,
          session_type,
          location,
          session_datetime,
          end_datetime,
          max_players,
          allow_guests,
          dupr_min,
          dupr_max,
          visibility
        ),
        users!session_invites_inviter_id_fkey (
          id,
          name,
          email
        )
      `
      )
      .eq("invitee_id", user.id)
      .eq("status", "pending")
      .order("created_at", { ascending: false })

    if (error) {
      console.error("Error fetching received session invites:", error)
      throw error
    }

    return data || []
  },

  // Get a specific session invite by ID (for deep link responses)
  getSessionInviteById: async (inviteId: string) => {
    try {
      // First get the basic invite data
      const { data: invite, error: inviteError } = await supabase
        .from("session_invites")
        .select("*")
        .eq("id", inviteId)
        .single()

      if (inviteError) {
        console.error("Error fetching session invite:", inviteError)
        throw inviteError
      }

      // Try to get session data with regular client first
      let session = null
      let sessionError = null

      const { data: sessionData, error: sessionErr } = await supabase
        .from("sessions")
        .select(
          `
          id,
          name,
          session_type,
          location,
          session_datetime,
          end_datetime,
          max_players,
          allow_guests,
          dupr_min,
          dupr_max,
          visibility
        `
        )
        .eq("id", invite.session_id)
        .single()

      if (sessionErr) {
        console.log(
          "Regular session query failed, this is expected for external invites:",
          sessionErr.message
        )

        // For external invites, we need to provide basic session info
        // Since we can't access the full session due to RLS, provide minimal data
        session = {
          id: invite.session_id,
          name: "Session Details", // Generic name since we can't fetch real name
          session_type: "social", // Default type
          location: "Location provided in invite", // Generic location
          session_datetime: new Date().toISOString(), // Placeholder
          end_datetime: new Date().toISOString(), // Placeholder
          max_players: 4, // Default
          allow_guests: true, // Default
          dupr_min: null,
          dupr_max: null,
          visibility: "private", // Default for invites
        }

        console.log("Using placeholder session data for external invite")
      } else {
        session = sessionData
      }

      // Get the inviter user data
      const { data: user, error: userError } = await supabase
        .from("users")
        .select("id, name, email")
        .eq("id", invite.inviter_id)
        .single()

      if (userError) {
        console.error("Error fetching inviter data:", userError)
        // Don't throw here, user data is not critical
      }

      // Combine the data in the expected format
      return {
        ...invite,
        sessions: session,
        users: user || { id: invite.inviter_id, name: "Unknown", email: "" },
      }
    } catch (error) {
      console.error("Error in getSessionInviteById:", error)
      throw error
    }
  },

  // Respond to a session invite
  respondToSessionInvite: async (
    inviteId: string,
    response: "accepted" | "declined" | "maybe"
  ) => {
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      throw new Error("User not authenticated")
    }

    // First, get the user's phone number to handle external invites
    const { data: userData, error: userError } = await supabase
      .from("users")
      .select("phone")
      .eq("id", user.id)
      .single()

    if (userError) {
      console.error("Error fetching user data:", userError)
      // Continue without phone - will only work for internal invites
    }

    const userPhone = userData?.phone

    // Try to update the invite - handle both internal and external invites
    const { data, error } = await supabase
      .from("session_invites")
      .update({
        status: response,
        responded_at: new Date().toISOString(),
        // For external invites, set the invitee_id now that we know who responded
        invitee_id: user.id,
      })
      .eq("id", inviteId)
      .or(
        `invitee_id.eq.${user.id}${
          userPhone ? `,invitee_phone.eq.${userPhone}` : ""
        }`
      )
      .select()
      .single()

    if (error) {
      console.error("Error responding to invite:", error)
      throw error
    }

    // If user accepted, add them to the session's accepted_participants array
    if (response === "accepted") {
      try {
        const { error: sessionUpdateError } = await supabase.rpc(
          "add_user_to_accepted_participants",
          {
            user_id: user.id,
            session_id: data.session_id,
          }
        )

        if (sessionUpdateError) {
          console.error(
            "Error adding user to accepted participants:",
            sessionUpdateError
          )
          // Don't throw here - the invite response was successful
          console.log(
            "Invite response succeeded but failed to update session participants"
          )
        } else {
          console.log(
            `Added user ${user.id} to session ${data.session_id} accepted participants`
          )
        }
      } catch (sessionError) {
        console.error("Error updating session participants:", sessionError)
        // Don't throw - invite response was successful
      }
    }

    return data
  },

  // Add user to group when they accept a session invite
  addUserToGroupFromSessionInvite: async (
    groupId: string,
    userId: string,
    userName: string,
    userEmail?: string
  ) => {
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      throw new Error("User not authenticated")
    }

    try {
      // Get user's phone number
      const { data: userData, error: userError } = await supabase
        .from("users")
        .select("phone, name")
        .eq("id", userId)
        .single()

      if (userError) {
        console.error("Error fetching user data:", userError)
        throw userError
      }

      if (!userData?.phone) {
        throw new Error(
          "User does not have a phone number associated with their account"
        )
      }

      // Use the phone number from the database result
      const userPhone = userData.phone

      // Check if user is already a member of the group
      const { data: existingMember, error: checkError } = await supabase
        .from("group_members")
        .select("id")
        .eq("group_id", groupId)
        .eq("contact_phone", userPhone)
        .single()

      if (checkError && checkError.code !== "PGRST116") {
        // PGRST116 is "not found" - that's expected if user isn't a member yet
        console.error("Error checking existing membership:", checkError)
        throw checkError
      }

      if (existingMember) {
        // User is already a member, just update accepted_invite to true
        const { error: updateError } = await supabase
          .from("group_members")
          .update({ accepted_invite: true })
          .eq("id", existingMember.id)

        if (updateError) {
          console.error("Error updating group member:", updateError)
          throw updateError
        }

        console.log(`Updated group member ${userId} to accepted_invite: true`)
      } else {
        // User is not a member, add them to the group
        const { error: insertError } = await supabase
          .from("group_members")
          .insert({
            group_id: groupId,
            contact_name: userName,
            contact_phone: userPhone,
            contact_email: userEmail,
            is_admin: false,
            accepted_invite: true,
          })

        if (insertError) {
          console.error("Error adding user to group:", insertError)
          throw insertError
        }

        console.log(`Added user ${userId} to group ${groupId}`)
      }
    } catch (error) {
      console.error("Error in addUserToGroupFromSessionInvite:", error)
      throw error
    }
  },

  // Associate a group with session invites for a given session
  associateGroupWithSessionInvites: async (
    sessionId: string,
    groupId: string
  ) => {
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      throw new Error("User not authenticated")
    }

    try {
      // Update all session invites for this session to include the group_id
      const { error: updateError } = await supabase
        .from("session_invites")
        .update({ group_id: groupId })
        .eq("session_id", sessionId)

      if (updateError) {
        console.error(
          "Error associating group with session invites:",
          updateError
        )
        throw updateError
      }

      console.log(
        `Associated group ${groupId} with session ${sessionId} invites`
      )
    } catch (error) {
      console.error("Error in associateGroupWithSessionInvites:", error)
      throw error
    }
  },
}
