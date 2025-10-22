// supabase/functions/pickleai-api/index.ts

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
}

// Security configuration
const SECURITY_CONFIG = {
  rateLimits: {
    perUserMinute: 20,
    perUserDay: 300,
    cooldownAfterRefusals: 60, // seconds
  },
  deniedPatterns: [
    // XP, streaks, leaderboards
    /(xp|streak|leaderboard).*(formula|hack|cheat|bypass|exploit|farm|optimize|reverse)/i,
    /(formula|hack|cheat|bypass|exploit|farm|optimize|reverse).*(xp|streak|leaderboard)/i,

    // Business model, monetization
    /business model|monetization|monetize|pricing|ltv|cac|growth|go to market/i,

    // Scraping, export, database access
    /scrape|export|dump|database|sql|query|endpoint list|api key|token|admin|analytics/i,

    // Security, vulnerabilities
    /security|vulnerability|penetration|jailbreak|prompt injection|guardrail/i,

    // Private, confidential information
    /private|confidential|internal|roadmap|strategy doc|investor deck/i,
  ],
  allowedIntents: [
    "app_help",
    "kb_answer",
    "pickleball_tip_basic",
    "dupr_self",
    "skills_advice",
    "rules_explanation",
    "equipment_recommendation",
    "general_pickleball",
  ],
}

// Friendly refusal messages
const REFUSAL_MESSAGES = [
  "I can't help with that specific topic, but I'd be happy to help you with pickleball skills, rules, or equipment questions!",
  "That's outside my scope, but I can assist with app features, pickleball tips, or finding local games and tournaments.",
  "I'm focused on pickleball advice and app help. Would you like to know about improving your game or finding places to play?",
  "I can't provide that information, but I'm great at explaining pickleball techniques, rules, and helping you find local courts!",
  "That's not something I can help with, but I'd love to assist with your pickleball game or show you how to use the app features.",
]

interface ChatMessage {
  id: string
  role: "user" | "assistant" | "system"
  content: string
  timestamp: Date
}

interface SecurityResult {
  allowed: boolean
  reason?: string
  suggestedAlternative?: string
  rateLimited?: boolean
  cooldownRemaining?: number
}

// Rate limiting storage (in production, use Redis)
const rateLimitStore = new Map<string, any>()

// Clean up old rate limit entries every hour
setInterval(() => {
  const now = Date.now()
  for (const [userId, info] of rateLimitStore.entries()) {
    if (now - (info.lastRefusalTime || 0) > 24 * 60 * 60 * 1000) {
      rateLimitStore.delete(userId)
    }
  }
}, 60 * 60 * 1000)

// Security check function
async function checkMessageSecurity(
  message: string,
  userId: string
): Promise<SecurityResult> {
  const now = Date.now()

  // Check rate limiting
  let userInfo = rateLimitStore.get(userId)
  if (!userInfo) {
    userInfo = {
      userId,
      requestsThisMinute: 0,
      requestsToday: 0,
    }
    rateLimitStore.set(userId, userInfo)
  }

  // Check cooldown after refusals
  if (userInfo.cooldownUntil && now < userInfo.cooldownUntil) {
    const remaining = Math.ceil((userInfo.cooldownUntil - now) / 1000)
    return {
      allowed: false,
      reason: "Rate limited due to previous violations",
      rateLimited: true,
      cooldownRemaining: remaining,
    }
  }

  // Update counters
  userInfo.requestsThisMinute = userInfo.requestsThisMinute + 1
  userInfo.requestsToday = userInfo.requestsToday + 1

  // Check limits
  if (userInfo.requestsThisMinute > SECURITY_CONFIG.rateLimits.perUserMinute) {
    return {
      allowed: false,
      reason: "Too many requests per minute",
      rateLimited: true,
    }
  }

  if (userInfo.requestsToday > SECURITY_CONFIG.rateLimits.perUserDay) {
    return {
      allowed: false,
      reason: "Daily request limit exceeded",
      rateLimited: true,
    }
  }

  // Check for denied patterns
  const lowerMessage = message.toLowerCase()
  for (const pattern of SECURITY_CONFIG.deniedPatterns) {
    if (pattern.test(lowerMessage)) {
      const refusalMessage =
        REFUSAL_MESSAGES[Math.floor(Math.random() * REFUSAL_MESSAGES.length)]
      return {
        allowed: false,
        reason: "Topic not allowed",
        suggestedAlternative: refusalMessage,
      }
    }
  }

  return { allowed: true }
}

// Record security violation
function recordViolation(userId: string): void {
  const userInfo = rateLimitStore.get(userId)
  if (userInfo) {
    userInfo.lastRefusalTime = Date.now()
    userInfo.cooldownUntil =
      Date.now() + SECURITY_CONFIG.rateLimits.cooldownAfterRefusals * 1000
  }
}

// Redact sensitive content
function redactSensitiveContent(content: string): string {
  let redacted = content

  // Redact API keys, tokens, etc.
  redacted = redacted.replace(/\b[A-Za-z0-9]{32,}\b/g, "[REDACTED]")
  redacted = redacted.replace(
    /\b[A-Za-z0-9]{20,}@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/g,
    "[EMAIL_REDACTED]"
  )
  redacted = redacted.replace(/\b\d{3}-\d{2}-\d{4}\b/g, "[SSN_REDACTED]")
  redacted = redacted.replace(
    /\b(admin|internal|private)\/[^\s]+\b/gi,
    "[PATH_REDACTED]"
  )

  return redacted
}

// Get enhanced system prompt
function getEnhancedSystemPrompt(context: any = {}): string {
  const basePrompt = `You are PickleAI, a concise and knowledgeable pickleball assistant for Net Gains. Your scope is limited to:
• explainer help for app settings and how features work
• answers from the official Support Knowledge Base
• general pickleball tips at a basic level
• DUPR lookups for the signed-in user's own profile (or a server-approved profile)

RESPONSE STYLE:
- Be direct and actionable
- Keep responses under 150 words unless explaining complex rules
- Use bullet points for multiple tips
- Be encouraging and supportive
- Focus on practical, implementable advice

EXPERTISE AREAS:
- Skills & Techniques: Serve, dinking, volleys, footwork, strategy
- Rules & Regulations: Official rules, common violations, tournament rules
- Equipment: Paddles, shoes, gear recommendations
- General: Tournaments, courts, community, fitness benefits

For Denial: Use friendly two-sentence refusals that gently pivot to helpful, in-scope options. Keep it short and actionable.`

  if (Object.keys(context).length === 0) {
    return basePrompt
  }

  const contextInfo = Object.entries(context)
    .filter(([_, value]) => value && value !== "unknown")
    .map(([key, value]) => {
      switch (key) {
        case "experience":
          return `Experience: ${value}`
        case "budget":
          return `Budget: ${value}`
        case "playFrequency":
          return `Play frequency: ${value}`
        case "playStyle":
          return `Play style: ${value}`
        case "physicalConsiderations":
          return `Physical: ${value}`
        case "goals":
          return `Goals: ${Array.isArray(value) ? value.join(", ") : value}`
        case "duprScore":
          return `DUPR: ${value}`
        case "playerName":
          return `Player: ${value}`
        default:
          return `${key}: ${value}`
      }
    })
    .join("\n")

  return `${basePrompt}

USER CONTEXT:
${contextInfo}

Use this information to provide personalized, actionable advice. Keep responses concise and practical.`
}

// Send message to OpenAI
async function sendToOpenAI(
  messages: ChatMessage[],
  systemPrompt: string
): Promise<string> {
  const apiKey = Deno.env.get("OPENAI_API_KEY")
  if (!apiKey) {
    throw new Error("OpenAI API key not configured")
  }

  const openAIMessages = [
    { role: "system", content: systemPrompt },
    ...messages.map((msg) => ({
      role: msg.role,
      content: msg.content,
    })),
  ]

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: "gpt-3.5-turbo",
      messages: openAIMessages,
      max_tokens: 500,
      temperature: 0.7,
    }),
  })

  if (!response.ok) {
    const errorData = await response.json()
    throw new Error(
      `OpenAI API error: ${errorData.error?.message || "Unknown error"}`
    )
  }

  const data = await response.json()
  if (!data.choices || data.choices.length === 0) {
    throw new Error("No response from OpenAI")
  }

  return data.choices[0].message.content
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders })
  }

  try {
    // Get user from authorization header
    const authHeader = req.headers.get("authorization")
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Authorization header required" }),
        {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      )
    }

    // Create Supabase client
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    )

    // Verify JWT token
    const {
      data: { user },
      error: authError,
    } = await supabaseClient.auth.getUser(authHeader.replace("Bearer ", ""))

    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Invalid authentication" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      })
    }

    // Parse request body
    const {
      message,
      conversationHistory = [],
      userContext = {},
    } = await req.json()

    if (!message || typeof message !== "string") {
      return new Response(JSON.stringify({ error: "Message is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      })
    }

    // SECURITY CHECK
    const securityResult = await checkMessageSecurity(message, user.id)

    if (!securityResult.allowed) {
      // Record violation for rate limiting
      recordViolation(user.id)

      return new Response(
        JSON.stringify({
          response:
            securityResult.suggestedAlternative ||
            "I can't help with that topic, but I'd be happy to assist with pickleball questions!",
          security: {
            blocked: true,
            reason: securityResult.reason,
            rateLimited: securityResult.rateLimited,
            cooldownRemaining: securityResult.cooldownRemaining,
          },
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      )
    }

    // Prepare conversation history
    const messages: ChatMessage[] = conversationHistory.map((msg: any) => ({
      id: msg.id,
      role: msg.role,
      content: msg.content,
      timestamp: new Date(msg.timestamp),
    }))

    // Add current message
    messages.push({
      id: `msg_${Date.now()}`,
      role: "user",
      content: message,
      timestamp: new Date(),
    })

    // Generate system prompt
    const systemPrompt = getEnhancedSystemPrompt(userContext)

    // Send to OpenAI
    const aiResponse = await sendToOpenAI(messages, systemPrompt)

    // Redact sensitive content
    const redactedResponse = redactSensitiveContent(aiResponse)

    return new Response(
      JSON.stringify({
        response: redactedResponse,
        security: {
          blocked: false,
        },
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    )
  } catch (error) {
    console.error("PickleAI API Error:", error)

    return new Response(
      JSON.stringify({
        error: "Internal server error",
        details: error instanceof Error ? error.message : "Unknown error",
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    )
  }
})
