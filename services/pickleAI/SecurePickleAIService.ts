// services/SecurePickleAIService.ts

import { supabase } from "@/lib/supabase"
import { ChatMessage } from "./OpenAIService"

export interface SecureAIResponse {
  response: string
  security: {
    blocked: boolean
    reason?: string
    rateLimited?: boolean
    cooldownRemaining?: number
  }
}

export interface SecureAIRequest {
  message: string
  conversationHistory: ChatMessage[]
  userContext: any
}

/**
 * Secure PickleAI Service that uses server-side API calls
 * This ensures API keys are kept server-side and all security checks are enforced
 */
export class SecurePickleAIService {
  private baseUrl: string

  constructor() {
    // Get Supabase URL from environment
    const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL
    if (!supabaseUrl) {
      throw new Error("SUPABASE_URL not configured")
    }
    this.baseUrl = `${supabaseUrl}/functions/v1/pickleai-api`
  }

  /**
   * Send a message to the secure PickleAI API
   */
  async sendMessage(
    message: string,
    conversationHistory: ChatMessage[] = [],
    userContext: any = {}
  ): Promise<SecureAIResponse> {
    try {
      // Get current session
      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession()

      if (sessionError || !session) {
        throw new Error("Authentication required")
      }

      // Prepare request
      const request: SecureAIRequest = {
        message,
        conversationHistory,
        userContext,
      }

      // Make API call to server-side function
      const response = await fetch(this.baseUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify(request),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(
          errorData.error || `HTTP ${response.status}: ${response.statusText}`
        )
      }

      const data: SecureAIResponse = await response.json()
      return data
    } catch (error) {
      console.error("Secure PickleAI Service Error:", error)

      // Return a friendly error response
      return {
        response:
          "I'm having trouble connecting right now. Please try again in a moment.",
        security: {
          blocked: false,
        },
      }
    }
  }

  /**
   * Check if the service is available
   */
  async isAvailable(): Promise<boolean> {
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession()
      if (!session) return false

      const response = await fetch(this.baseUrl, {
        method: "OPTIONS",
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      })

      return response.ok
    } catch {
      return false
    }
  }
}

// Export singleton instance
export const securePickleAI = new SecurePickleAIService()
