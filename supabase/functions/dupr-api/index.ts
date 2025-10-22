// supabase/functions/dupr-api/index.ts

import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.7";

// CORS headers
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, GET, OPTIONS, PUT, DELETE",
};

// Types
interface DuprConfig {
  baseUrl: string
  version: string
  clientName: string
  clientId: string
  clientKey: string
  clientSecret: string
}

interface UserActivity {
  user_id: string
  action_type: string
  screen: string
  timestamp: string
  details: Record<string, any>
  session_id?: string
  duration_ms?: number
}

interface ActivityInsightParams {
  user_id?: string
  date_from?: string
  date_to?: string
  action_type?: string
  limit?: number
}

interface AuthTokenResponse {
  access_token: string
  token_type: string
  expires_in: number
  refresh_token?: string
}

interface DuprAuthResponse {
  status: string
  result: {
    token: string
    expiry: string
  }
}

interface DuprApiResponse<T> {
  success: boolean
  data?: T
  error?: string
  statusCode?: number
}

interface DuprContext {
  config: DuprConfig
  supabase: any
}

// Initialize Supabase client for token storage
const createSupabaseClient = () => {
  return createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
  )
}

// Token storage functions
const getStoredToken = async (
  supabase: any
): Promise<{ token: string | null; expiry: number | null }> => {
  try {
    console.log("[DUPR Edge] Retrieving stored token from database")
    
    const { data, error } = await supabase
      .from("dupr_tokens")
      .select("access_token, expires_at")
      .eq("id", "app_token")
      .single()

    if (error || !data) {
      console.log("[DUPR Edge] No token found in database or error:", error)
      return { token: null, expiry: null }
    }

    const expiryTime = new Date(data.expires_at).getTime()
    const expiresIn = Math.floor((expiryTime - Date.now()) / 1000)
    
    console.log("[DUPR Edge] Retrieved token from database:", {
      hasToken: !!data.access_token,
      expiresAt: data.expires_at,
      expiresInSeconds: expiresIn,
      tokenLastChars: data.access_token ? "***" + data.access_token.slice(-4) : null,
      timestamp: new Date().toISOString()
    })
    
    return {
      token: data.access_token,
      expiry: expiryTime,
    }
  } catch (error) {
    console.warn("[DUPR Edge] Failed to get stored token:", error)
    return { token: null, expiry: null }
  }
}

const storeToken = async (
  supabase: any,
  token: string,
  expiresIn: number
): Promise<void> => {
  try {
    const expiresAt = new Date(Date.now() + expiresIn * 1000).toISOString()

    console.log("[DUPR Edge] Storing new token in database:", {
      tokenLastChars: token ? "***" + token.slice(-4) : "MISSING",
      expiresIn: expiresIn,
      expiresAt: expiresAt,
      timestamp: new Date().toISOString()
    })

    const { error } = await supabase.from("dupr_tokens").upsert({
      id: "app_token",
      access_token: token,
      expires_at: expiresAt,
      updated_at: new Date().toISOString(),
    })

    if (error) {
      console.error("[DUPR Edge] Failed to store token:", error)
    } else {
      console.log("[DUPR Edge] Token stored successfully")
    }
  } catch (error) {
    console.warn("[DUPR Edge] Failed to store token:", error)
  }
}

// Token validation
const isTokenValid = (expiry: number | null): boolean => {
  if (!expiry) {
    console.log("[DUPR Edge] Token validation failed: No expiry time")
    return false
  }
  
  // Check if token is expired (with 5 minute buffer)
  const isValid = Date.now() < expiry - 300000
  const remainingTimeMs = expiry - Date.now()
  
  if (isValid) {
    console.log("[DUPR Edge] Token is valid:", {
      remainingTime: `${Math.floor(remainingTimeMs / 1000 / 60)} minutes`,
      expiresAt: new Date(expiry).toISOString(),
      timestamp: new Date().toISOString()
    })
  } else {
    console.log("[DUPR Edge] Token is expired or expiring soon:", {
      remainingTime: `${Math.floor(remainingTimeMs / 1000 / 60)} minutes`,
      expiresAt: new Date(expiry).toISOString(),
      timestamp: new Date().toISOString()
    })
  }
  
  return isValid
}

// HTTP request function for DUPR API
const makeRequest = async <T>(
  endpoint: string,
  context: DuprContext,
  options: RequestInit = {},
  token?: string
): Promise<DuprApiResponse<T>> => {
  try {
    const url = `${context.config.baseUrl}${endpoint}`
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      ...options.headers,
    }

    // Add client credentials to headers
    headers["X-API-Key"] = context.config.clientKey
    headers["X-Client-ID"] = context.config.clientId
    headers["X-Client-Name"] = context.config.clientName

    // Add authorization header if we have a token
    if (token) {
      headers["Authorization"] = `Bearer ${token}`
    }

    const response = await fetch(url, {
      ...options,
      headers,
    })

    if (!response.ok) {
      const errorText = await response.text()
      return {
        success: false,
        error: `HTTP ${response.status}: ${response.statusText} - ${errorText}`,
        statusCode: response.status,
      }
    }

    const data = await response.json()
    return { success: true, data }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error occurred",
    }
  }
}

// Authentication function
const authenticate = async (
  context: DuprContext
): Promise<DuprApiResponse<AuthTokenResponse>> => {
  console.log("[DUPR Edge] Starting authentication process", {
    baseUrl: context.config.baseUrl,
    version: context.config.version,
    clientName: context.config.clientName,
    clientId: context.config.clientId
      ? "***" + context.config.clientId.slice(-4)
      : "MISSING",
    hasClientKey: !!context.config.clientKey,
    hasClientSecret: !!context.config.clientSecret,
    timestamp: new Date().toISOString(),
  })

  try {
    // Use the fixed endpoint from DUPR documentation: /auth/v1.0/token
    const endpoint = `/auth/v1.0/token`
    const url = `${context.config.baseUrl}${endpoint}`

    console.log("[DUPR Edge] Authentication URL:", url)

    // Base64 encode the credentials as per DUPR RaaS documentation
    // Format: base64(key + ":" + secret)
    const encodedCredentials = btoa(
      `${context.config.clientKey}:${context.config.clientSecret}`
    )

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      "x-authorization": encodedCredentials,
    }

    console.log("[DUPR Edge] Request headers:", {
      "Content-Type": headers["Content-Type"],
      "x-authorization": headers["x-authorization"]
        ? "***" + headers["x-authorization"].slice(-4)
        : "MISSING",
    })

    // Empty body as per DUPR RaaS documentation
    const response = await fetch(url, {
      method: "POST",
      headers,
      body: JSON.stringify({}),
    })

    console.log("[DUPR Edge] Authentication response:", {
      status: response.status,
      statusText: response.statusText,
      ok: response.ok,
      headers: Object.fromEntries(response.headers.entries()),
    })

    if (response.ok) {
      const duprResponse: DuprAuthResponse = await response.json()

      console.log("[DUPR Edge] Authentication successful:", {
        status: duprResponse.status,
        hasToken: !!duprResponse.result?.token,
        expiry: duprResponse.result?.expiry,
        timestamp: new Date().toISOString(),
      })

      // Convert DUPR response to our expected format
      const tokenData: AuthTokenResponse = {
        access_token: duprResponse.result.token,
        token_type: "Bearer",
        expires_in: Math.floor(
          (new Date(duprResponse.result.expiry).getTime() - Date.now()) / 1000
        ),
      }

      // Store the token in Supabase
      await storeToken(
        context.supabase,
        tokenData.access_token,
        tokenData.expires_in
      )

      return { success: true, data: tokenData }
    } else {
      const errorText = await response.text()
      console.error("[DUPR Edge] Authentication failed:", {
        status: response.status,
        statusText: response.statusText,
        errorText,
        timestamp: new Date().toISOString(),
      })
      return {
        success: false,
        error: `Authentication failed: ${response.status} ${response.statusText} - ${errorText}`,
        statusCode: response.status,
      }
    }
  } catch (error) {
    console.error("[DUPR Edge] Authentication error:", {
      error: error instanceof Error ? error.message : error,
      stack: error instanceof Error ? error.stack : undefined,
      timestamp: new Date().toISOString(),
    })
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Authentication error occurred",
    }
  }
}

// Get valid token (authenticate if needed)
const getValidToken = async (context: DuprContext): Promise<string | null> => {
  console.log("[DUPR Edge] Getting valid token")
  
  // Check if we have a valid stored token
  const { token, expiry } = await getStoredToken(context.supabase)

  if (token && isTokenValid(expiry)) {
    console.log("[DUPR Edge] Using existing valid token:", {
      tokenLastChars: token ? "***" + token.slice(-4) : null,
      timestamp: new Date().toISOString()
    })
    return token
  }

  console.log("[DUPR Edge] No valid token found, authenticating...")
  
  // Need to authenticate
  const authResult = await authenticate(context)
  if (authResult.success && authResult.data) {
    console.log("[DUPR Edge] Successfully authenticated and got new token:", {
      tokenLastChars: authResult.data.access_token ? "***" + authResult.data.access_token.slice(-4) : null,
      expiresIn: authResult.data.expires_in,
      timestamp: new Date().toISOString()
    })
    return authResult.data.access_token
  }

  console.error("[DUPR Edge] Failed to get valid token:", {
    error: authResult.error,
    timestamp: new Date().toISOString()
  })
  return null
}

// API endpoint functions
const getEvents = async (
  context: DuprContext,
  filters?: any
): Promise<DuprApiResponse<any>> => {
  const token = await getValidToken(context)
  if (!token) {
    return { success: false, error: "Failed to authenticate" }
  }

  const endpoint = `/events/${context.config.version}/get`

  // Add query parameters if filters are provided
  const params = new URLSearchParams()
  if (filters) {
    Object.entries(filters).forEach(([key, value]) => {
      if (value) params.append(key, String(value))
    })
  }

  const queryString = params.toString()
  const fullEndpoint = queryString ? `${endpoint}?${queryString}` : endpoint

  return makeRequest(fullEndpoint, context, { method: "GET" }, token)
}

const getUserProvisionalRating = async (
  context: DuprContext,
  userId?: string
): Promise<DuprApiResponse<any>> => {
  const token = await getValidToken(context)
  if (!token) {
    return { success: false, error: "Failed to authenticate" }
  }

  const endpoint = `/user/${context.config.version}/provisional_rating`

  // Add userId as query parameter if provided
  const queryString = userId ? `?userId=${userId}` : ""
  const fullEndpoint = `${endpoint}${queryString}`

  return makeRequest(fullEndpoint, context, { method: "GET" }, token)
}

const inviteUser = async (
  context: DuprContext,
  inviteData: any
): Promise<DuprApiResponse<any>> => {
  const token = await getValidToken(context)
  if (!token) {
    return { success: false, error: "Failed to authenticate" }
  }

  const endpoint = `/user/${context.config.version}/invite`

  return makeRequest(
    endpoint,
    context,
    {
      method: "POST",
      body: JSON.stringify(inviteData),
    },
    token
  )
}

// User authentication function
const authenticateUser = async (
  context: DuprContext,
  duprEmail: string,
  currentUserEmail: string,
  password?: string
): Promise<DuprApiResponse<any>> => {
  console.log("[DUPR Edge] Starting user authentication process", {
    duprEmail: duprEmail ? "***" + duprEmail.slice(-10) : "MISSING",
    currentUserEmail: currentUserEmail
      ? "***" + currentUserEmail.slice(-10)
      : "MISSING",
    hasPassword: !!password,
    timestamp: new Date().toISOString(),
  })

  try {
    // First, get a client token
    const clientAuthResult = await authenticate(context)
    if (!clientAuthResult.success || !clientAuthResult.data) {
      console.error(
        "[DUPR Edge] Failed to get client token for user authentication"
      )
      return {
        success: false,
        error: "Failed to authenticate client credentials",
      }
    }

    const clientToken = clientAuthResult.data.access_token
    console.log("[DUPR Edge] Got client token for user authentication")

    // Step 1: Get DUPR User ID by email
    const duprIdEndpoint = `/${context.config.version}/player/duprid-by-email`
    const duprIdUrl = `${context.config.baseUrl}${duprIdEndpoint}`

    console.log("[DUPR Edge] Getting DUPR ID by email URL:", duprIdUrl)

    const duprIdHeaders: Record<string, string> = {
      "Content-Type": "application/json",
      Authorization: `Bearer ${clientToken}`,
    }

    const duprIdBody = {
      email: duprEmail,
    }

    const duprIdResponse = await fetch(duprIdUrl, {
      method: "POST",
      headers: duprIdHeaders,
      body: JSON.stringify(duprIdBody),
    })

    console.log("[DUPR Edge] DUPR ID response:", {
      status: duprIdResponse.status,
      statusText: duprIdResponse.statusText,
      ok: duprIdResponse.ok,
    })

    if (!duprIdResponse.ok) {
      const errorText = await duprIdResponse.text()
      console.error("[DUPR Edge] Failed to get DUPR ID:", {
        status: duprIdResponse.status,
        statusText: duprIdResponse.statusText,
        errorText,
      })
      return {
        success: false,
        error: `Failed to get DUPR ID: ${duprIdResponse.status} ${duprIdResponse.statusText} - ${errorText}`,
        statusCode: duprIdResponse.status,
      }
    }

    const duprIdData = await duprIdResponse.json()
    console.log("[DUPR Edge] DUPR ID data:", duprIdData)

    if (!duprIdData.result) {
      console.error("[DUPR Edge] No DUPR ID found in response")
      return {
        success: false,
        error: "No DUPR ID found for this email",
      }
    }

    const duprId = duprIdData.result
    console.log("[DUPR Edge] Got DUPR ID:", duprId)

    // Store DUPR ID in user table
    try {
      const { error: updateError } = await context.supabase
        .from("users")
        .update({ dupr_id: duprId })
        .eq("email", currentUserEmail)

      if (updateError) {
        console.error(
          "[DUPR Edge] Failed to update user with DUPR ID:",
          updateError
        )
        // Don't fail the request, just log the error
      } else {
        console.log("[DUPR Edge] Successfully stored DUPR ID in user table")
      }
    } catch (error) {
      console.error("[DUPR Edge] Error storing DUPR ID:", error)
      // Don't fail the request, just log the error
    }

    // Step 2: Get user details by DUPR ID
    const userEndpoint = `/user/${context.config.version}/${duprId}`
    const userUrl = `${context.config.baseUrl}${userEndpoint}`

    console.log("[DUPR Edge] Getting user details URL:", userUrl)

    const userHeaders: Record<string, string> = {
      "Content-Type": "application/json",
      Authorization: `Bearer ${clientToken}`,
    }

    const userResponse = await fetch(userUrl, {
      method: "GET",
      headers: userHeaders,
    })

    console.log("[DUPR Edge] User details response:", {
      status: userResponse.status,
      statusText: userResponse.statusText,
      ok: userResponse.ok,
    })

    if (!userResponse.ok) {
      const errorText = await userResponse.text()
      console.error("[DUPR Edge] Failed to get user details:", {
        status: userResponse.status,
        statusText: userResponse.statusText,
        errorText,
      })
      return {
        success: false,
        error: `Failed to get user details: ${userResponse.status} ${userResponse.statusText} - ${errorText}`,
        statusCode: userResponse.status,
      }
    }

    const userData = await userResponse.json()
    console.log("[DUPR Edge] User details successful:", {
      hasData: !!userData,
      timestamp: new Date().toISOString(),
    })

    // Store DUPR ID and ratings in user table
    try {
      const userResult = userData.result
      const singlesRating = userResult?.ratings?.singles
      const doublesRating = userResult?.ratings?.doubles

      const updateData: any = { dupr_id: duprId }
      // Save 0 if rating is null, otherwise save the actual rating
      updateData.dupr_rating_singles =
        singlesRating !== null && singlesRating !== undefined
          ? singlesRating
          : 0
      updateData.dupr_rating_doubles =
        doublesRating !== null && doublesRating !== undefined
          ? doublesRating
          : 0

      const { error: updateError } = await context.supabase
        .from("users")
        .update(updateData)
        .eq("email", currentUserEmail)
      if (updateError) {
        console.error(
          "[DUPR Edge] Failed to update user with DUPR data:",
          updateError
        )
        // Don't fail the request, just log the error
      } else {
        console.log("[DUPR Edge] Successfully stored DUPR data:", {
          dupr_id: duprId,
          singles_rating: singlesRating,
          doubles_rating: doublesRating,
        })
      }
    } catch (error) {
      console.error("[DUPR Edge] Error storing DUPR data:", error)
      // Don't fail the request, just log the error
    }

    return { success: true, data: userData }
  } catch (error) {
    console.error("[DUPR Edge] User authentication error:", {
      error: error instanceof Error ? error.message : error,
      stack: error instanceof Error ? error.stack : undefined,
      timestamp: new Date().toISOString(),
    })
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "User authentication error occurred",
    }
  }
}

// Get user by DUPR ID
const getUserByDuprId = async (
  context: DuprContext,
  duprId: string
): Promise<DuprApiResponse<any>> => {
  console.log("[DUPR Edge] Getting user by DUPR ID:", duprId)

  try {
    // First, get a client token
    const clientAuthResult = await authenticate(context)
    if (!clientAuthResult.success || !clientAuthResult.data) {
      console.error("[DUPR Edge] Failed to get client token for user lookup")
      return {
        success: false,
        error: "Failed to authenticate client credentials",
      }
    }

    const clientToken = clientAuthResult.data.access_token
    console.log("[DUPR Edge] Got client token for user lookup")

    // Get user details by DUPR ID
    const userEndpoint = `/user/${context.config.version}/${duprId}`
    const userUrl = `${context.config.baseUrl}${userEndpoint}`

    console.log("[DUPR Edge] Getting user details URL:", userUrl)

    const userHeaders: Record<string, string> = {
      "Content-Type": "application/json",
      Authorization: `Bearer ${clientToken}`,
    }

    const userResponse = await fetch(userUrl, {
      method: "GET",
      headers: userHeaders,
    })

    console.log("[DUPR Edge] User details response:", {
      status: userResponse.status,
      statusText: userResponse.statusText,
      ok: userResponse.ok,
    })

    if (!userResponse.ok) {
      const errorText = await userResponse.text()
      console.error("[DUPR Edge] Failed to get user details:", {
        status: userResponse.status,
        statusText: userResponse.statusText,
        errorText,
      })
      return {
        success: false,
        error: `Failed to get user details: ${userResponse.status} ${userResponse.statusText} - ${errorText}`,
        statusCode: userResponse.status,
      }
    }

    const userData = await userResponse.json()
    console.log("[DUPR Edge] User details successful:", {
      hasData: !!userData,
      timestamp: new Date().toISOString(),
    })
    return { success: true, data: userData }
  } catch (error) {
    console.error("[DUPR Edge] User lookup error:", {
      error: error instanceof Error ? error.message : error,
      stack: error instanceof Error ? error.stack : undefined,
      timestamp: new Date().toISOString(),
    })
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "User lookup error occurred",
    }
  }
}

// Get player profile and DUPR rating
const getPlayer = async (
  context: DuprContext,
  playerId: string
): Promise<DuprApiResponse<any>> => {
  console.log("[DUPR Edge] Getting player profile and rating:", playerId)

  try {
    // First, get a valid token
    const token = await getValidToken(context)
    if (!token) {
      console.error("[DUPR Edge] Failed to get token for player lookup")
      return {
        success: false,
        error: "Failed to authenticate with DUPR API",
      }
    }

    // Get player details by player ID
    const playerEndpoint = `/player/${context.config.version}/${playerId}`
    const playerUrl = `${context.config.baseUrl}${playerEndpoint}`

    console.log("[DUPR Edge] Getting player details URL:", playerUrl)

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    }

    const response = await fetch(playerUrl, {
      method: "GET",
      headers,
    })

    console.log("[DUPR Edge] Player details response:", {
      status: response.status,
      statusText: response.statusText,
      ok: response.ok,
    })

    // Handle 401 Unauthorized specifically
    if (response.status === 401) {
      console.error("[DUPR Edge] Unauthorized: Token may be expired or invalid")
      
      // Attempt to get a fresh token and retry
      console.log("[DUPR Edge] Attempting to refresh token and retry...")
      const authResult = await authenticate(context)
      if (!authResult.success || !authResult.data) {
        return {
          success: false,
          error: "Authentication failed while trying to refresh token",
        }
      }
      
      // Retry with new token
      const newHeaders = {
        "Content-Type": "application/json",
        Authorization: `Bearer ${authResult.data.access_token}`,
      }
      
      const retryResponse = await fetch(playerUrl, {
        method: "GET",
        headers: newHeaders,
      })
      
      if (!retryResponse.ok) {
        const errorText = await retryResponse.text()
        return {
          success: false,
          error: `Player lookup failed after token refresh: ${retryResponse.status} ${retryResponse.statusText} - ${errorText}`,
          statusCode: retryResponse.status,
        }
      }
      
      const playerData = await retryResponse.json()
      return { success: true, data: playerData }
    }

    if (!response.ok) {
      const errorText = await response.text()
      console.error("[DUPR Edge] Failed to get player details:", {
        status: response.status,
        statusText: response.statusText,
        errorText,
      })
      return {
        success: false,
        error: `Failed to get player details: ${response.status} ${response.statusText} - ${errorText}`,
        statusCode: response.status,
      }
    }

    const playerData = await response.json()
    console.log("[DUPR Edge] Player details successful:", {
      hasData: !!playerData,
      timestamp: new Date().toISOString(),
    })
    return { success: true, data: playerData }
  } catch (error) {
    console.error("[DUPR Edge] Player lookup error:", {
      error: error instanceof Error ? error.message : error,
      stack: error instanceof Error ? error.stack : undefined,
      timestamp: new Date().toISOString(),
    })
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Player lookup error occurred",
    }
  }
}

// Track user activity 
const trackUserActivity = async (
  context: DuprContext,
  activity: UserActivity
): Promise<DuprApiResponse<any>> => {
  console.log("[DUPR Edge] Tracking user activity:", {
    user_id: activity.user_id,
    action_type: activity.action_type,
    screen: activity.screen,
    timestamp: activity.timestamp
  })

  try {
    // Add server timestamp if not provided
    if (!activity.timestamp) {
      activity.timestamp = new Date().toISOString()
    }

    // Insert activity into database
    const { data, error } = await context.supabase
      .from("user_activities")
      .insert([activity])

    if (error) {
      console.error("[DUPR Edge] Failed to track user activity:", error)
      return {
        success: false,
        error: `Failed to track user activity: ${error.message}`,
        statusCode: 500
      }
    }

    return { success: true, data: { activity_recorded: true } }
  } catch (error) {
    console.error("[DUPR Edge] Error tracking user activity:", {
      error: error instanceof Error ? error.message : error,
      stack: error instanceof Error ? error.stack : undefined,
      timestamp: new Date().toISOString(),
    })
    return {
      success: false,
      error: error instanceof Error ? error.message : "Activity tracking error occurred",
    }
  }
}

// Generate insights from user activity
const getActivityInsights = async (
  context: DuprContext,
  params: ActivityInsightParams
): Promise<DuprApiResponse<any>> => {
  console.log("[DUPR Edge] Getting user activity insights:", params)

  try {
    // Build query based on parameters
    let query = context.supabase
      .from("user_activities")
      .select("*")

    if (params.user_id) {
      query = query.eq("user_id", params.user_id)
    }
    
    if (params.action_type) {
      query = query.eq("action_type", params.action_type)
    }
    
    if (params.date_from) {
      query = query.gte("timestamp", params.date_from)
    }
    
    if (params.date_to) {
      query = query.lte("timestamp", params.date_to)
    }
    
    // Add order by most recent
    query = query.order("timestamp", { ascending: false })
    
    // Add limit if specified
    if (params.limit) {
      query = query.limit(params.limit)
    }

    // Execute the query
    const { data, error } = await query

    if (error) {
      console.error("[DUPR Edge] Failed to get activity insights:", error)
      return {
        success: false,
        error: `Failed to get activity insights: ${error.message}`,
        statusCode: 500
      }
    }

    // Generate basic analytics from the raw data
    const analytics = {
      total_activities: data.length,
      activities_by_type: {} as Record<string, number>,
      activities_by_screen: {} as Record<string, number>,
      average_duration: 0,
      raw_data: data
    }

    // Calculate metrics
    let totalDuration = 0
    let durationDataPoints = 0

    data.forEach(activity => {
      // Count by activity type
      if (activity.action_type) {
        analytics.activities_by_type[activity.action_type] = 
          (analytics.activities_by_type[activity.action_type] || 0) + 1
      }
      
      // Count by screen
      if (activity.screen) {
        analytics.activities_by_screen[activity.screen] = 
          (analytics.activities_by_screen[activity.screen] || 0) + 1
      }
      
      // Add to duration calculation if available
      if (activity.duration_ms) {
        totalDuration += activity.duration_ms
        durationDataPoints++
      }
    })

    // Calculate average duration if we have duration data
    if (durationDataPoints > 0) {
      analytics.average_duration = totalDuration / durationDataPoints
    }

    return { success: true, data: analytics }
  } catch (error) {
    console.error("[DUPR Edge] Error generating insights:", {
      error: error instanceof Error ? error.message : error,
      stack: error instanceof Error ? error.stack : undefined,
      timestamp: new Date().toISOString(),
    })
    return {
      success: false,
      error: error instanceof Error ? error.message : "Error generating insights",
    }
  }
}

// Get player matches
const getMatches = async (
  context: DuprContext,
  playerId: string,
  params: { page?: number; pageSize?: number; startDate?: string; endDate?: string }
): Promise<DuprApiResponse<any>> => {
  console.log("[DUPR Edge] Getting matches for player:", playerId, params)

  try {
    // First, get a valid token
    const token = await getValidToken(context)
    if (!token) {
      console.error("[DUPR Edge] Failed to get token for matches lookup")
      return {
        success: false,
        error: "Failed to authenticate with DUPR API",
      }
    }

    // Build the endpoint with query parameters
    const matchesEndpoint = `/player/${context.config.version}/${playerId}/matches`
    
    // Add query parameters if provided
    const queryParams = new URLSearchParams()
    if (params.page) queryParams.append("page", params.page.toString())
    if (params.pageSize) queryParams.append("pageSize", params.pageSize.toString())
    if (params.startDate) queryParams.append("startDate", params.startDate)
    if (params.endDate) queryParams.append("endDate", params.endDate)
    
    const queryString = queryParams.toString()
    const fullEndpoint = queryString ? `${matchesEndpoint}?${queryString}` : matchesEndpoint
    const matchesUrl = `${context.config.baseUrl}${fullEndpoint}`

    console.log("[DUPR Edge] Getting player matches URL:", matchesUrl)

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    }

    const response = await fetch(matchesUrl, {
      method: "GET",
      headers,
    })

    console.log("[DUPR Edge] Player matches response:", {
      status: response.status,
      statusText: response.statusText,
      ok: response.ok,
    })

    // Handle 401 Unauthorized specifically
    if (response.status === 401) {
      console.error("[DUPR Edge] Unauthorized: Token may be expired or invalid")
      
      // Attempt to get a fresh token and retry
      console.log("[DUPR Edge] Attempting to refresh token and retry...")
      const authResult = await authenticate(context)
      if (!authResult.success || !authResult.data) {
        return {
          success: false,
          error: "Authentication failed while trying to refresh token",
        }
      }
      
      // Retry with new token
      const newHeaders = {
        "Content-Type": "application/json",
        Authorization: `Bearer ${authResult.data.access_token}`,
      }
      
      const retryResponse = await fetch(matchesUrl, {
        method: "GET",
        headers: newHeaders,
      })
      
      if (!retryResponse.ok) {
        const errorText = await retryResponse.text()
        return {
          success: false,
          error: `Player matches lookup failed after token refresh: ${retryResponse.status} ${retryResponse.statusText} - ${errorText}`,
          statusCode: retryResponse.status,
        }
      }
      
      const matchesData = await retryResponse.json()
      return { success: true, data: matchesData }
    }

    if (!response.ok) {
      const errorText = await response.text()
      console.error("[DUPR Edge] Failed to get player matches:", {
        status: response.status,
        statusText: response.statusText,
        errorText,
      })
      return {
        success: false,
        error: `Failed to get player matches: ${response.status} ${response.statusText} - ${errorText}`,
        statusCode: response.status,
      }
    }

    const matchesData = await response.json()
    console.log("[DUPR Edge] Player matches lookup successful:", {
      hasData: !!matchesData,
      timestamp: new Date().toISOString(),
    })
    return { success: true, data: matchesData }
  } catch (error) {
    console.error("[DUPR Edge] Player matches lookup error:", {
      error: error instanceof Error ? error.message : error,
      stack: error instanceof Error ? error.stack : undefined,
      timestamp: new Date().toISOString(),
    })
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Player matches lookup error occurred",
    }
  }
}

// Main server function
serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders })
  }

  // Temporary: Allow unauthenticated access for testing
  console.log("[DUPR Edge] Request received:", {
    method: req.method,
    url: req.url,
    headers: Object.fromEntries(req.headers.entries()),
    timestamp: new Date().toISOString(),
  })

  // Add more detailed logging for debugging
  console.log("[DUPR Edge] Environment check:", {
    hasBaseUrl: !!Deno.env.get("DUPR_BASE_URL"),
    hasVersion: !!Deno.env.get("DUPR_VERSION"),
    hasClientName: !!Deno.env.get("DUPR_CLIENT_NAME"),
    hasClientId: !!Deno.env.get("DUPR_CLIENT_ID"),
    hasClientKey: !!Deno.env.get("DUPR_CLIENT_KEY"),
    hasClientSecret: !!Deno.env.get("DUPR_CLIENT_SECRET"),
    baseUrl: Deno.env.get("DUPR_BASE_URL"),
    version: Deno.env.get("DUPR_VERSION"),
    clientName: Deno.env.get("DUPR_CLIENT_NAME"),
    clientId: Deno.env.get("DUPR_CLIENT_ID"),
    clientKey: Deno.env.get("DUPR_CLIENT_KEY")
      ? "***" + Deno.env.get("DUPR_CLIENT_KEY")!.slice(-4)
      : "MISSING",
    clientSecret: Deno.env.get("DUPR_CLIENT_SECRET")
      ? "***" + Deno.env.get("DUPR_CLIENT_SECRET")!.slice(-4)
      : "MISSING",
  })

  try {
    const { action, ...params } = await req.json()

    // Create DUPR context
    const context: DuprContext = {
      config: {
        baseUrl: Deno.env.get("DUPR_BASE_URL") || "https://uat.mydupr.com/api",
        version: Deno.env.get("DUPR_VERSION") || "v3.0",
        clientName: Deno.env.get("DUPR_CLIENT_NAME")!,
        clientId: Deno.env.get("DUPR_CLIENT_ID")!,
        clientKey: Deno.env.get("DUPR_CLIENT_KEY")!,
        clientSecret: Deno.env.get("DUPR_CLIENT_SECRET")!,
      },
      supabase: createSupabaseClient(),
    }

    console.log("[DUPR Edge] Environment variables check:", {
      hasBaseUrl: !!Deno.env.get("DUPR_BASE_URL"),
      hasVersion: !!Deno.env.get("DUPR_VERSION"),
      hasClientName: !!Deno.env.get("DUPR_CLIENT_NAME"),
      hasClientId: !!Deno.env.get("DUPR_CLIENT_ID"),
      hasClientKey: !!Deno.env.get("DUPR_CLIENT_KEY"),
      hasClientSecret: !!Deno.env.get("DUPR_CLIENT_SECRET"),
      action,
      timestamp: new Date().toISOString(),
    })

    // Validate required environment variables
    if (
      !context.config.clientName ||
      !context.config.clientId ||
      !context.config.clientKey ||
      !context.config.clientSecret
    ) {
      console.error("[DUPR Edge] Missing environment variables:", {
        clientName: !!context.config.clientName,
        clientId: !!context.config.clientId,
        clientKey: !!context.config.clientKey,
        clientSecret: !!context.config.clientSecret,
        action,
        timestamp: new Date().toISOString(),
      })
      return new Response(
        JSON.stringify({
          success: false,
          error: "Missing required DUPR credentials in environment variables",
        }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      )
    }

    // Add debug endpoint to check environment variables
    if (action === "debug") {
      return new Response(
        JSON.stringify({
          success: true,
          data: {
            hasClientName: !!context.config.clientName,
            hasClientId: !!context.config.clientId,
            hasClientKey: !!context.config.clientKey,
            hasClientSecret: !!context.config.clientSecret,
            clientName: context.config.clientName,
            clientId: context.config.clientId,
            clientKey: context.config.clientKey
              ? "***" + context.config.clientKey.slice(-4)
              : null,
            clientSecret: context.config.clientSecret
              ? "***" + context.config.clientSecret.slice(-4)
              : null,
            baseUrl: context.config.baseUrl,
            version: context.config.version,
          },
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      )
    }

    // Add test endpoint to verify client credentials work
    if (action === "testClientAuth") {
      const result = await authenticate(context)
      return new Response(JSON.stringify(result), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      })
    }

    // Add health check endpoint
    if (action === "health") {
      return new Response(
        JSON.stringify({
          success: true,
          data: {
            message: "DUPR API Edge Function is running",
            timestamp: new Date().toISOString(),
            environment: {
              hasBaseUrl: !!context.config.baseUrl,
              hasVersion: !!context.config.version,
              hasClientName: !!context.config.clientName,
              hasClientId: !!context.config.clientId,
              hasClientKey: !!context.config.clientKey,
              hasClientSecret: !!context.config.clientSecret,
            },
          },
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      )
    }

    // Add endpoint to check user data in database
    if (action === "checkUserData") {
      const { email } = params
      if (!email) {
        return new Response(
          JSON.stringify({
            success: false,
            error: "Email parameter is required",
          }),
          {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        )
      }

      try {
        const { data: user, error } = await context.supabase
          .from("users")
          .select(
            "id, email, dupr_id, dupr_rating_singles, dupr_rating_doubles"
          )
          .eq("email", email)
          .single()

        if (error) {
          return new Response(
            JSON.stringify({
              success: false,
              error: error.message,
            }),
            {
              status: 400,
              headers: { ...corsHeaders, "Content-Type": "application/json" },
            }
          )
        }

        return new Response(
          JSON.stringify({
            success: true,
            data: user,
          }),
          {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        )
      } catch (error) {
        return new Response(
          JSON.stringify({
            success: false,
            error: error instanceof Error ? error.message : "Unknown error",
          }),
          {
            status: 500,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        )
      }
    }

    let result

    switch (action) {
      case "getEvents":
        result = await getEvents(context, params.filters)
        break

      case "getUserRating":
        result = await getUserProvisionalRating(context, params.userId)
        break

      case "inviteUser":
        result = await inviteUser(context, params.inviteData)
        break

      case "authenticate":
        // Manual token refresh endpoint
        result = await authenticate(context)
        break

      case "authenticateUser":
        // User login endpoint
        result = await authenticateUser(
          context,
          params.email,
          params.currentUserEmail,
          params.password
        )
        break

      case "getUserByDuprId":
        // Get user by DUPR ID
        result = await getUserByDuprId(context, params.duprId)
        break
        
      case "getPlayer":
        // Get player profile and DUPR rating
        if (!params.playerId) {
          return new Response(
            JSON.stringify({
              success: false,
              error: "playerId parameter is required",
            }),
            {
              status: 400,
              headers: { ...corsHeaders, "Content-Type": "application/json" },
            }
          )
        }
        result = await getPlayer(context, params.playerId)
        break
        
      case "getMatches":
        // Get player matches
        if (!params.playerId) {
          return new Response(
            JSON.stringify({
              success: false,
              error: "playerId parameter is required",
            }),
            {
              status: 400,
              headers: { ...corsHeaders, "Content-Type": "application/json" },
            }
          )
        }
        
        // Extract optional filter parameters
        const matchParams = {
          page: params.page ? parseInt(params.page) : undefined,
          pageSize: params.pageSize ? parseInt(params.pageSize) : undefined,
          startDate: params.startDate,
          endDate: params.endDate,
        }
        
        result = await getMatches(context, params.playerId, matchParams)
        break

      case "trackActivity":
        // Track user activity
        if (!params.activity || !params.activity.user_id || !params.activity.action_type) {
          return new Response(
            JSON.stringify({
              success: false,
              error: "Invalid activity data. Required: user_id, action_type",
            }),
            {
              status: 400,
              headers: { ...corsHeaders, "Content-Type": "application/json" },
            }
          )
        }
        
        result = await trackUserActivity(context, params.activity as UserActivity)
        break
        
      case "getActivityInsights":
        // Get analytics from user activity
        const insightParams: ActivityInsightParams = {
          user_id: params.user_id,
          date_from: params.date_from,
          date_to: params.date_to,
          action_type: params.action_type,
          limit: params.limit ? parseInt(params.limit) : undefined
        }
        
        result = await getActivityInsights(context, insightParams)
        break

      default:
        return new Response(
          JSON.stringify({ success: false, error: "Invalid action" }),
          {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        )
    }

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    })
  } catch (error) {
    console.error("Edge function error:", error)
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || "Internal server error",
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    )
  }
})
