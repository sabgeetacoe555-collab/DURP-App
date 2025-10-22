import { Linking } from "react-native"
import { supabase } from "@/lib/supabase"
import { sessionService } from "@/services/sessionService"

// Type declarations for global variables
declare global {
  var pendingInviteData: {
    sessionId: string
    phone: string
    timestamp: string
  } | null
  var pendingGroupInviteData: {
    groupId: string
    timestamp: string
  } | null
}

export interface DeepLinkData {
  type:
    | "session_invite"
    | "session_details"
    | "group_invite"
    | "group_details"
    | "other"
  sessionId?: string
  groupId?: string
  phone?: string
  invite?: boolean
  [key: string]: any
}

export const deepLinkHandler = {
  // Parse deep link URL and extract relevant data
  parseDeepLink: (url: string): DeepLinkData => {
    try {
      const urlObj = new URL(url)
      const pathParts = urlObj.pathname.split("/")

      console.log("Parsing deep link URL:", url)
      console.log("URL host:", urlObj.host)
      console.log("URL pathname:", urlObj.pathname)
      console.log("Path parts:", pathParts)
      console.log("Search params:", urlObj.searchParams.toString())

      // Check if this is a group-related deep link
      // The URL structure can be:
      // 1. https://netgains.app/g-{groupId}?invite=true (web links)
      // 2. netgains://g-{groupId}?invite=true (custom scheme)

      // Check pathname for web links
      if (pathParts[1] && pathParts[1].startsWith("g-")) {
        const groupId = pathParts[1].substring(2) // Remove "g-" prefix
        const invite = urlObj.searchParams.get("invite") === "true"

        console.log("Group ID (from pathname):", groupId)
        console.log("Invite:", invite)

        if (invite) {
          console.log("Returning group_invite type")
          return {
            type: "group_invite",
            groupId,
            invite: true,
          }
        } else {
          console.log("Returning group_details type")
          return {
            type: "group_details",
            groupId,
          }
        }
      }

      // Check host for custom scheme links
      if (urlObj.host && urlObj.host.startsWith("g-")) {
        const groupId = urlObj.host.substring(2) // Remove "g-" prefix
        const invite = urlObj.searchParams.get("invite") === "true"

        console.log("Group ID (from host):", groupId)
        console.log("Invite:", invite)

        if (invite) {
          console.log("Returning group_invite type")
          return {
            type: "group_invite",
            groupId,
            invite: true,
          }
        } else {
          console.log("Returning group_details type")
          return {
            type: "group_details",
            groupId,
          }
        }
      }

      // Check if this is a session-related deep link
      // The URL structure is: netgains://{sessionId}?phone={phone}&invite=true
      // Where the sessionId is in the host (since there's no pathname for custom schemes)
      if (urlObj.host && pathParts.length >= 1) {
        const sessionId = urlObj.host // The sessionId is now the host
        const phone = urlObj.searchParams.get("phone")
        const invite = urlObj.searchParams.get("invite") === "true"

        console.log("Session ID:", sessionId)
        console.log("Phone:", phone)
        console.log("Invite:", invite)

        if (invite && phone) {
          console.log("Returning session_invite type")
          return {
            type: "session_invite",
            sessionId,
            phone,
            invite: true,
          }
        } else {
          console.log("Returning session_details type")
          return {
            type: "session_details",
            sessionId,
          }
        }
      }

      console.log("Returning other type")
      return { type: "other" }
    } catch (error) {
      console.error("Error parsing deep link:", error)
      return { type: "other" }
    }
  },

  // Handle group invite deep links
  handleGroupInvite: async (groupId: string) => {
    try {
      // Check if user is authenticated
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser()

      if (authError || !user) {
        // User not logged in - store the group invite data for later
        await deepLinkHandler.storePendingGroupInvite(groupId)
        return {
          success: false,
          message: "Please log in to join the group",
          requiresAuth: true,
        }
      }

      // User is logged in - check if they're already a member by user_id
      const { data: existingMember, error: memberError } = await supabase
        .from("group_members")
        .select("*")
        .eq("group_id", groupId)
        .eq("user_id", user.id)
        .single()

      if (memberError && memberError.code !== "PGRST116") {
        // PGRST116 is "not found" error, which is expected if user isn't a member
        console.error("Error checking group membership:", memberError)
        return {
          success: false,
          message: "Error checking group membership",
          requiresAuth: false,
        }
      }

      if (existingMember) {
        return {
          success: true,
          message: "You are already a member of this group",
          groupId,
          isAlreadyMember: true,
        }
      }

      // User is not a member - they can join the group
      return {
        success: true,
        message: "Group invite found",
        groupId,
        canJoin: true,
      }
    } catch (error) {
      console.error("Error handling group invite:", error)
      return {
        success: false,
        message: "Error processing group invitation",
        requiresAuth: false,
      }
    }
  },

  // Handle session invite deep links
  handleSessionInvite: async (sessionId: string, phone: string) => {
    try {
      // Check if user is authenticated
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser()

      if (authError || !user) {
        // User not logged in - store the invite data for later
        await deepLinkHandler.storePendingInvite(sessionId, phone)
        return {
          success: false,
          message: "Please log in to respond to the invitation",
          requiresAuth: true,
        }
      }

      // User is logged in - try to associate phone number with account
      await deepLinkHandler.associatePhoneWithUser(user.id, phone)

      // Find the pending invite for this session and phone
      const invite = await deepLinkHandler.findInviteBySessionAndPhone(
        sessionId,
        phone
      )

      if (invite) {
        return {
          success: true,
          message: "Invitation found",
          inviteId: invite.id,
          sessionId,
        }
      } else {
        return {
          success: false,
          message: "Invitation not found",
          requiresAuth: false,
        }
      }
    } catch (error) {
      console.error("Error handling session invite:", error)
      return {
        success: false,
        message: "Error processing invitation",
        requiresAuth: false,
      }
    }
  },

  // Store pending group invite data for unauthenticated users
  storePendingGroupInvite: async (groupId: string) => {
    try {
      // Store in AsyncStorage or similar for later retrieval
      const pendingGroupInvite = {
        groupId,
        timestamp: new Date().toISOString(),
      }

      // You can use AsyncStorage here or store in a global variable
      global.pendingGroupInviteData = pendingGroupInvite

      console.log("Stored pending group invite:", pendingGroupInvite)
    } catch (error) {
      console.error("Error storing pending group invite:", error)
    }
  },

  // Store pending invite data for unauthenticated users
  storePendingInvite: async (sessionId: string, phone: string) => {
    try {
      // Store in AsyncStorage or similar for later retrieval
      const pendingInvite = {
        sessionId,
        phone,
        timestamp: new Date().toISOString(),
      }

      // You can use AsyncStorage here or store in a global variable
      global.pendingInviteData = pendingInvite

      console.log("Stored pending invite:", pendingInvite)
    } catch (error) {
      console.error("Error storing pending invite:", error)
    }
  },

  // Associate phone number with user account
  associatePhoneWithUser: async (userId: string, phone: string) => {
    try {
      // Update user's phone number if not already set
      const { data: user, error: fetchError } = await supabase
        .from("users")
        .select("phone")
        .eq("id", userId)
        .single()

      if (fetchError) {
        console.error("Error fetching user:", fetchError)
        return
      }

      // Only update if phone is not already set or is different
      if (!user.phone || user.phone !== phone) {
        const { error: updateError } = await supabase
          .from("users")
          .update({ phone })
          .eq("id", userId)

        if (updateError) {
          console.error("Error updating user phone:", updateError)
        } else {
          console.log("Associated phone number with user account:", phone)
        }
      }
    } catch (error) {
      console.error("Error associating phone with user:", error)
    }
  },

  // Find invite by session ID and phone number
  findInviteBySessionAndPhone: async (sessionId: string, phone: string) => {
    try {
      const { data, error } = await supabase
        .from("session_invites")
        .select("*")
        .eq("session_id", sessionId)
        .eq("invitee_phone", phone)
        .eq("status", "pending")
        .single()

      if (error) {
        console.error("Error finding invite:", error)
        return null
      }

      return data
    } catch (error) {
      console.error("Error in findInviteBySessionAndPhone:", error)
      return null
    }
  },

  // Check for pending invites when user logs in
  checkPendingInvites: async () => {
    try {
      if (global.pendingInviteData) {
        const { sessionId, phone } = global.pendingInviteData

        // Clear the pending data
        global.pendingInviteData = null

        // Process the pending invite
        return await deepLinkHandler.handleSessionInvite(sessionId, phone)
      }

      return null
    } catch (error) {
      console.error("Error checking pending invites:", error)
      return null
    }
  },

  // Handle incoming deep links
  handleIncomingLink: async (url: string) => {
    try {
      const linkData = deepLinkHandler.parseDeepLink(url)

      if (
        linkData.type === "session_invite" &&
        linkData.sessionId &&
        linkData.phone
      ) {
        return await deepLinkHandler.handleSessionInvite(
          linkData.sessionId,
          linkData.phone
        )
      }

      if (linkData.type === "group_invite" && linkData.groupId) {
        return await deepLinkHandler.handleGroupInvite(linkData.groupId)
      }

      return {
        success: false,
        message: "Unsupported deep link type",
        requiresAuth: false,
      }
    } catch (error) {
      console.error("Error handling incoming link:", error)
      return {
        success: false,
        message: "Error processing deep link",
        requiresAuth: false,
      }
    }
  },
}

// Set up deep link listener
export const setupDeepLinkListener = () => {
  const handleDeepLink = async (url: string) => {
    console.log("Deep link received:", url)

    try {
      const linkData = deepLinkHandler.parseDeepLink(url)

      if (
        linkData.type === "session_invite" &&
        linkData.sessionId &&
        linkData.phone
      ) {
        console.log("Processing session invite deep link:", linkData)

        // Store the pending invite data for the navigation hook to process
        global.pendingInviteData = {
          sessionId: linkData.sessionId,
          phone: linkData.phone,
          timestamp: new Date().toISOString(),
        }

        console.log("Stored pending invite data:", global.pendingInviteData)
      } else if (linkData.type === "group_invite" && linkData.groupId) {
        console.log("Processing group invite deep link:", linkData)

        // Store the pending group invite data for the navigation hook to process
        global.pendingGroupInviteData = {
          groupId: linkData.groupId,
          timestamp: new Date().toISOString(),
        }

        console.log(
          "Stored pending group invite data:",
          global.pendingGroupInviteData
        )
      } else {
        console.log("Deep link not a session or group invite:", linkData)
      }
    } catch (error) {
      console.error("Error processing deep link:", error)
    }
  }

  // Handle deep links when app is already running
  const subscription = Linking.addEventListener("url", (event) => {
    handleDeepLink(event.url)
  })

  // Handle deep links that opened the app
  Linking.getInitialURL().then((url) => {
    if (url) {
      console.log("App opened with deep link:", url)
      handleDeepLink(url)
    }
  })

  return subscription
}
