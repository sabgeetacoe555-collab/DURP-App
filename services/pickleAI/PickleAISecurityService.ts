// services/PickleAISecurityService.ts

export interface SecurityConfig {
  rateLimits: {
    perUserMinute: number
    perUserDay: number
    cooldownAfterRefusals: number
  }
  detectionPatterns: RegExp[]
  allowedIntents: string[]
  deniedPatterns: RegExp[]
}

export interface SecurityResult {
  allowed: boolean
  reason?: string
  suggestedAlternative?: string
  rateLimited?: boolean
  cooldownRemaining?: number
}

export interface RateLimitInfo {
  userId: string
  requestsThisMinute: number
  requestsToday: number
  lastRefusalTime?: number
  cooldownUntil?: number
}

// Detection patterns for off-lane topics
const DENIED_PATTERNS = [
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
]

// Allowed intents for PickleAI
const ALLOWED_INTENTS = [
  "app_help",
  "kb_answer",
  "pickleball_tip_basic",
  "dupr_self",
  "skills_advice",
  "rules_explanation",
  "equipment_recommendation",
  "general_pickleball",
]

// Friendly refusal messages that pivot to helpful alternatives
const REFUSAL_MESSAGES = [
  "I can't help with that specific topic, but I'd be happy to help you with pickleball skills, rules, or equipment questions!",
  "That's outside my scope, but I can assist with app features, pickleball tips, or finding local games and tournaments.",
  "I'm focused on pickleball advice and app help. Would you like to know about improving your game or finding places to play?",
  "I can't provide that information, but I'm great at explaining pickleball techniques, rules, and helping you find local courts!",
  "That's not something I can help with, but I'd love to assist with your pickleball game or show you how to use the app features.",
]

// Rate limiting storage (in production, this should be in Redis or database)
const rateLimitStore = new Map<string, RateLimitInfo>()

// Clean up old rate limit entries every hour
// Note: This will only work in Node.js environment, not in React Native
if (typeof setInterval !== "undefined") {
  setInterval(() => {
    const now = Date.now()
    for (const [userId, info] of rateLimitStore.entries()) {
      if (now - (info.lastRefusalTime || 0) > 24 * 60 * 60 * 1000) {
        // 24 hours
        rateLimitStore.delete(userId)
      }
    }
  }, 60 * 60 * 1000) // Every hour
}

export class PickleAISecurityService {
  private config: SecurityConfig

  constructor(config?: Partial<SecurityConfig>) {
    this.config = {
      rateLimits: {
        perUserMinute: 20,
        perUserDay: 300,
        cooldownAfterRefusals: 60, // seconds
      },
      detectionPatterns: DENIED_PATTERNS,
      allowedIntents: ALLOWED_INTENTS,
      deniedPatterns: DENIED_PATTERNS,
      ...config,
    }
  }

  /**
   * Main security check for user messages
   */
  async checkMessageSecurity(
    message: string,
    userId: string
  ): Promise<SecurityResult> {
    // Check rate limiting first
    const rateLimitResult = this.checkRateLimit(userId)
    if (!rateLimitResult.allowed) {
      return rateLimitResult
    }

    // Check for denied patterns
    const patternResult = this.checkDeniedPatterns(message)
    if (!patternResult.allowed) {
      return patternResult
    }

    // Classify intent
    const intentResult = this.classifyIntent(message)
    if (!intentResult.allowed) {
      return intentResult
    }

    // All checks passed
    return { allowed: true }
  }

  /**
   * Check rate limiting for user
   */
  private checkRateLimit(userId: string): SecurityResult {
    const now = Date.now()
    const minuteAgo = now - 60 * 1000
    const dayAgo = now - 24 * 60 * 60 * 1000

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

    // Check minute limit
    if (userInfo.requestsThisMinute > this.config.rateLimits.perUserMinute) {
      return {
        allowed: false,
        reason: "Too many requests per minute",
        rateLimited: true,
      }
    }

    // Check daily limit
    if (userInfo.requestsToday > this.config.rateLimits.perUserDay) {
      return {
        allowed: false,
        reason: "Daily request limit exceeded",
        rateLimited: true,
      }
    }

    return { allowed: true }
  }

  /**
   * Check for denied patterns in message
   */
  private checkDeniedPatterns(message: string): SecurityResult {
    const lowerMessage = message.toLowerCase()

    for (const pattern of this.config.deniedPatterns) {
      if (pattern.test(lowerMessage)) {
        const refusalMessage = this.getRandomRefusalMessage()
        return {
          allowed: false,
          reason: "Topic not allowed",
          suggestedAlternative: refusalMessage,
        }
      }
    }

    return { allowed: true }
  }

  /**
   * Classify user intent and check if it's allowed
   */
  private classifyIntent(message: string): SecurityResult {
    const lowerMessage = message.toLowerCase()

    // Simple keyword-based intent classification
    const detectedIntents = this.detectIntents(lowerMessage)

    // If no clear intent or all intents are allowed, permit
    if (detectedIntents.length === 0) {
      return { allowed: true }
    }

    // Check if any detected intent is not allowed
    const disallowedIntents = detectedIntents.filter(
      (intent) => !this.config.allowedIntents.includes(intent)
    )

    if (disallowedIntents.length > 0) {
      const refusalMessage = this.getRandomRefusalMessage()
      return {
        allowed: false,
        reason: `Intent not allowed: ${disallowedIntents.join(", ")}`,
        suggestedAlternative: refusalMessage,
      }
    }

    return { allowed: true }
  }

  /**
   * Detect intents from message content
   */
  private detectIntents(message: string): string[] {
    const intents: string[] = []

    // App help
    if (
      /settings|notification|privacy|account|help|how to|feature/.test(message)
    ) {
      intents.push("app_help")
    }

    // Knowledge base
    if (/support|kb|knowledge|article|documentation/.test(message)) {
      intents.push("kb_answer")
    }

    // Pickleball tips
    if (/improve|technique|skill|drill|practice|tip/.test(message)) {
      intents.push("pickleball_tip_basic")
    }

    // DUPR
    if (/dupr|rating|score|profile/.test(message)) {
      intents.push("dupr_self")
    }

    // Skills advice
    if (/serve|volley|dink|backhand|footwork|strategy/.test(message)) {
      intents.push("skills_advice")
    }

    // Rules
    if (/rule|legal|fault|violation|kitchen|non-volley/.test(message)) {
      intents.push("rules_explanation")
    }

    // Equipment
    if (/paddle|racket|equipment|gear|shoes/.test(message)) {
      intents.push("equipment_recommendation")
    }

    // General pickleball
    if (/tournament|court|club|community|history/.test(message)) {
      intents.push("general_pickleball")
    }

    return intents
  }

  /**
   * Get a random refusal message
   */
  private getRandomRefusalMessage(): string {
    return REFUSAL_MESSAGES[Math.floor(Math.random() * REFUSAL_MESSAGES.length)]
  }

  /**
   * Record a security violation for rate limiting
   */
  recordViolation(userId: string): void {
    const userInfo = rateLimitStore.get(userId)
    if (userInfo) {
      userInfo.lastRefusalTime = Date.now()
      userInfo.cooldownUntil =
        Date.now() + this.config.rateLimits.cooldownAfterRefusals * 1000
    }
  }

  /**
   * Redact sensitive information from response
   */
  redactSensitiveContent(content: string): string {
    let redacted = content

    // Redact API keys, tokens, etc.
    redacted = redacted.replace(/\b[A-Za-z0-9]{32,}\b/g, "[REDACTED]")
    redacted = redacted.replace(
      /\b[A-Za-z0-9]{20,}@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/g,
      "[EMAIL_REDACTED]"
    )
    redacted = redacted.replace(/\b\d{3}-\d{2}-\d{4}\b/g, "[SSN_REDACTED]")

    // Redact internal paths, endpoints
    redacted = redacted.replace(
      /\b(admin|internal|private)\/[^\s]+\b/gi,
      "[PATH_REDACTED]"
    )

    return redacted
  }

  /**
   * Validate system prompt for security
   */
  validateSystemPrompt(prompt: string): boolean {
    const lowerPrompt = prompt.toLowerCase()

    // Check for dangerous instructions
    const dangerousPatterns = [
      /ignore.*previous.*instruction/i,
      /bypass.*security/i,
      /ignore.*safety/i,
      /act.*as.*different.*person/i,
      /pretend.*to.*be/i,
    ]

    return !dangerousPatterns.some((pattern) => pattern.test(lowerPrompt))
  }

  /**
   * Get rate limit info for user (for debugging)
   */
  getRateLimitInfo(userId: string): RateLimitInfo | null {
    return rateLimitStore.get(userId) || null
  }

  /**
   * Reset rate limits for user (for testing)
   */
  resetRateLimits(userId: string): void {
    rateLimitStore.delete(userId)
  }
}

// Export singleton instance
export const pickleAISecurity = new PickleAISecurityService()
