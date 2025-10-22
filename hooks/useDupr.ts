import { useState, useCallback } from "react"
import {
  getEvents as getEventsApi,
  getUserRating as getUserRatingApi,
  inviteUser as inviteUserApi,
  testConnection as testConnectionApi,
  refreshToken as refreshTokenApi,
  authenticateUser as authenticateUserApi,
} from "../services/DuprClient"
import type {
  DuprEvent,
  DuprUser,
  InviteUserRequest,
  DuprClientConfig,
} from "../types/dupr"

interface UseDuprReturn {
  isLoading: boolean
  error: string | null
  getEvents: (filters?: any) => Promise<DuprEvent[] | null>
  getUserRating: (userId?: string) => Promise<DuprUser | null>
  inviteUser: (inviteData: InviteUserRequest) => Promise<boolean>
  testConnection: () => Promise<boolean>
  refreshToken: () => Promise<boolean>
  authenticateUser: (
    duprEmail: string,
    currentUserEmail: string
  ) => Promise<boolean>
  clearError: () => void
}

export const useDupr = (config: DuprClientConfig = {}): UseDuprReturn => {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const functionName = config.edgeFunctionName || "dupr-api"

  const clearError = useCallback(() => {
    setError(null)
  }, [])

  const getEvents = useCallback(
    async (filters?: any): Promise<DuprEvent[] | null> => {
      setIsLoading(true)
      setError(null)

      try {
        const result = await getEventsApi(filters, functionName)
        if (result.success && result.data) {
          return result.data
        } else {
          setError(result.error || "Failed to fetch events")
          return null
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Error fetching events")
        return null
      } finally {
        setIsLoading(false)
      }
    },
    [functionName]
  )

  const getUserRating = useCallback(
    async (userId?: string): Promise<DuprUser | null> => {
      setIsLoading(true)
      setError(null)

      try {
        const result = await getUserRatingApi(userId, functionName)
        if (result.success && result.data) {
          return result.data
        } else {
          setError(result.error || "Failed to fetch user rating")
          return null
        }
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Error fetching user rating"
        )
        return null
      } finally {
        setIsLoading(false)
      }
    },
    [functionName]
  )

  const inviteUser = useCallback(
    async (inviteData: InviteUserRequest): Promise<boolean> => {
      setIsLoading(true)
      setError(null)

      try {
        const result = await inviteUserApi(inviteData, functionName)
        if (result.success) {
          return true
        } else {
          setError(result.error || "Failed to invite user")
          return false
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Error inviting user")
        return false
      } finally {
        setIsLoading(false)
      }
    },
    [functionName]
  )

  const testConnection = useCallback(async (): Promise<boolean> => {
    setIsLoading(true)
    setError(null)

    try {
      const result = await testConnectionApi(functionName)
      if (result.success) {
        return true
      } else {
        setError(result.error || "Connection test failed")
        return false
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Connection test error")
      return false
    } finally {
      setIsLoading(false)
    }
  }, [functionName])

  const refreshToken = useCallback(async (): Promise<boolean> => {
    setIsLoading(true)
    setError(null)

    try {
      const result = await refreshTokenApi(functionName)
      if (result.success) {
        return true
      } else {
        setError(result.error || "Token refresh failed")
        return false
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Token refresh error")
      return false
    } finally {
      setIsLoading(false)
    }
  }, [functionName])

  const authenticateUser = useCallback(
    async (duprEmail: string, currentUserEmail: string): Promise<boolean> => {
      setIsLoading(true)
      setError(null)

      try {
        const result = await authenticateUserApi(
          duprEmail,
          currentUserEmail,
          functionName
        )
        if (result.success) {
          return true
        } else {
          setError(result.error || "DUPR authentication failed")
          return false
        }
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "DUPR authentication error"
        )
        return false
      } finally {
        setIsLoading(false)
      }
    },
    [functionName]
  )

  return {
    isLoading,
    error,
    getEvents,
    getUserRating,
    inviteUser,
    testConnection,
    refreshToken,
    authenticateUser,
    clearError,
  }
}
