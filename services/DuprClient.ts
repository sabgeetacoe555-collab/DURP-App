import { supabase } from "../lib/supabase"
import type {
  DuprEvent,
  DuprUser,
  InviteUserRequest,
  DuprApiResponse,
  DuprClientConfig,
} from "../types/dupr"

// Re-export types for backward compatibility
export type {
  DuprEvent,
  DuprUser,
  InviteUserRequest,
  DuprApiResponse,
  DuprClientConfig,
}

// Core function to call edge function
const callEdgeFunction = async <T>(
  action: string,
  params: any = {},
  functionName: string = "dupr-api"
): Promise<DuprApiResponse<T>> => {
  console.log(`[DuprClient] Calling edge function: ${functionName}`, {
    action,
    params,
    timestamp: new Date().toISOString(),
  })

  try {
    const { data, error } = await supabase.functions.invoke(functionName, {
      body: { action, ...params },
    })

    if (error) {
      console.error(`[DuprClient] Edge function error for ${action}:`, {
        error: error.message,
        status: error.status,
        details: error,
        timestamp: new Date().toISOString(),
      })
      return {
        success: false,
        error: error.message || "Edge function error",
        statusCode: error.status,
      }
    }

    console.log(`[DuprClient] Edge function success for ${action}:`, {
      success: data?.success,
      hasData: !!data?.data,
      timestamp: new Date().toISOString(),
    })

    return data
  } catch (error) {
    console.error(`[DuprClient] Unexpected error for ${action}:`, {
      error: error instanceof Error ? error.message : error,
      stack: error instanceof Error ? error.stack : undefined,
      timestamp: new Date().toISOString(),
    })
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error occurred",
    }
  }
}

// Individual API functions
export const getEvents = async (
  filters?: {
    startDate?: string
    endDate?: string
    location?: string
    eventType?: string
  },
  functionName?: string
): Promise<DuprApiResponse<DuprEvent[]>> => {
  return callEdgeFunction<DuprEvent[]>(
    "getEvents",
    { filters },
    functionName || "dupr-api"
  )
}

export const getUserRating = async (
  userId?: string,
  functionName?: string
): Promise<DuprApiResponse<DuprUser>> => {
  return callEdgeFunction<DuprUser>(
    "getUserRating",
    { userId },
    functionName || "dupr-api"
  )
}

export const inviteUser = async (
  inviteData: InviteUserRequest,
  functionName?: string
): Promise<DuprApiResponse<any>> => {
  return callEdgeFunction(
    "inviteUser",
    { inviteData },
    functionName || "dupr-api"
  )
}

export const refreshToken = async (
  functionName?: string
): Promise<DuprApiResponse<any>> => {
  return callEdgeFunction("authenticate", {}, functionName || "dupr-api")
}

export const getUserByDuprId = async (
  duprId: string,
  functionName?: string
): Promise<DuprApiResponse<any>> => {
  return callEdgeFunction(
    "getUserByDuprId",
    { duprId },
    functionName || "dupr-api"
  )
}

export const authenticateUser = async (
  duprEmail: string,
  currentUserEmail: string,
  functionName?: string
): Promise<DuprApiResponse<any>> => {
  return callEdgeFunction(
    "authenticateUser",
    { email: duprEmail, currentUserEmail },
    functionName || "dupr-api"
  )
}

export const testConnection = async (
  functionName?: string
): Promise<DuprApiResponse<any>> => {
  return callEdgeFunction(
    "getEvents",
    { filters: { limit: 1 } },
    functionName || "dupr-api"
  )
}

// Functional API factory
export const createDuprApi = (config: DuprClientConfig = {}) => {
  const functionName = config.edgeFunctionName || "dupr-api"

  return {
    getEvents: (filters?: any) => getEvents(filters, functionName),
    getUserRating: (userId?: string) => getUserRating(userId, functionName),
    inviteUser: (inviteData: InviteUserRequest) =>
      inviteUser(inviteData, functionName),
    refreshToken: () => refreshToken(functionName),
    getUserByDuprId: (duprId: string) => getUserByDuprId(duprId, functionName),
    testConnection: () => testConnection(functionName),

    // Batch operations
    getUserData: async (userId?: string) => {
      const [events, rating] = await Promise.all([
        getEvents(undefined, functionName),
        getUserRating(userId, functionName),
      ])

      return {
        success: events.success && rating.success,
        data: {
          events: events.data,
          rating: rating.data,
        },
        error: events.error || rating.error,
      }
    },
  }
}
