import { useEffect } from "react"
import { useRouter } from "expo-router"

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

export const useNotificationNavigation = () => {
  const router = useRouter()

  useEffect(() => {
    // Check for pending deep link invites (from SMS) when the hook mounts
    const checkPendingInvites = async () => {
      // Check if there's a pending session invite from a deep link
      if (global.pendingInviteData) {
        try {
          const { sessionId, phone } = global.pendingInviteData

          // Navigate directly to the session invite page
          router.push(`/${sessionId}?invite=true&phone=${phone}`)

          // Clear the pending data
          global.pendingInviteData = null
        } catch (error) {
          console.error("Error handling pending session invite:", error)
        }
      }

      // Check if there's a pending group invite from a deep link
      if (global.pendingGroupInviteData) {
        try {
          const { groupId } = global.pendingGroupInviteData

          // Navigate directly to the group invite page
          router.push(`/g-${groupId}?invite=true`)

          // Clear the pending data
          global.pendingGroupInviteData = null
        } catch (error) {
          console.error("Error handling pending group invite:", error)
        }
      }
    }

    checkPendingInvites()
  }, [router])

  return null
}
