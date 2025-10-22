// services/MessageService.ts
import { ChatMessage, getPickleballSystemPrompt } from "./OpenAIService"
import {
  analyzeUserMessage,
  generateFollowUpQuestions,
  extractContextFromMessage,
  generateIntelligentSystemPrompt,
  UserContext,
} from "./IntelligentPromptService"
import { pickleAISecurity, SecurityResult } from "./PickleAISecurityService"
import { securePickleAI } from "./SecurePickleAIService"

export interface ChatState {
  messages: ChatMessage[]
  isLoading: boolean
  error: string | null
  userContext: UserContext
  conversationCategory: string | null
}

export type MessageListener = (state: ChatState) => void

// Module-level state
let state: ChatState = {
  messages: [],
  isLoading: false,
  error: null,
  userContext: {},
  conversationCategory: null,
}

let listeners: MessageListener[] = []
let messageIdCounter = 0

// Subscribe to state changes
export const subscribe = (listener: MessageListener): (() => void) => {
  listeners.push(listener)

  // Return unsubscribe function
  return () => {
    const index = listeners.indexOf(listener)
    if (index > -1) {
      listeners.splice(index, 1)
    }
  }
}

// Notify all listeners of state changes
const notifyListeners = (): void => {
  listeners.forEach((listener) => listener(state))
}

// Generate unique message ID
const generateMessageId = (): string => {
  return `msg_${Date.now()}_${++messageIdCounter}`
}

// Get current state
export const getState = (): ChatState => {
  return { ...state }
}

// Update state and notify listeners
const updateState = (updates: Partial<ChatState>): void => {
  state = { ...state, ...updates }
  notifyListeners()
}

// Add a message to the chat
const addMessage = (
  role: "user" | "assistant",
  content: string
): ChatMessage => {
  const message: ChatMessage = {
    id: generateMessageId(),
    role,
    content,
    timestamp: new Date(),
  }

  updateState({
    messages: [...state.messages, message],
    error: null,
  })

  return message
}

// Send a user message and get AI response
export const sendMessage = async (
  content: string,
  userId?: string
): Promise<void> => {
  if (!content.trim()) return

  // Add user message
  addMessage("user", content.trim())

  // Set loading state
  updateState({
    isLoading: true,
    error: null,
  })

  try {
    // SECURITY CHECK: Validate message before processing
    if (userId) {
      const securityResult = await pickleAISecurity.checkMessageSecurity(
        content,
        userId
      )

      if (!securityResult.allowed) {
        // Record violation for rate limiting
        pickleAISecurity.recordViolation(userId)

        // Add security refusal message
        const refusalMessage =
          securityResult.suggestedAlternative ||
          "I can't help with that topic, but I'd be happy to assist with pickleball questions!"

        addMessage("assistant", refusalMessage)
        return
      }
    }

    // Extract context from the user's message
    const newContext = extractContextFromMessage(content)
    const updatedContext = { ...state.userContext, ...newContext }

    // Analyze the message for intelligent prompting
    const analysis = analyzeUserMessage(content, updatedContext)

    // Update context and category
    updateState({
      userContext: updatedContext,
      conversationCategory: analysis.category || state.conversationCategory,
    })

    let systemPrompt: string

    // If we have missing information and high confidence, ask follow-up questions
    if (
      analysis.category &&
      analysis.missingInfo.length > 0 &&
      analysis.confidence > 0.3
    ) {
      const followUpQuestions = generateFollowUpQuestions(
        analysis.category,
        analysis.missingInfo,
        updatedContext
      )

      if (followUpQuestions.length > 0) {
        systemPrompt = generateIntelligentSystemPrompt(
          analysis.category,
          analysis.missingInfo,
          updatedContext,
          followUpQuestions
        )
      } else {
        // Fallback to regular prompt if no follow-up questions
        systemPrompt = getEnhancedSystemPrompt(updatedContext)
      }
    } else {
      // Use enhanced prompt with context
      systemPrompt = getEnhancedSystemPrompt(updatedContext)
    }

    // SECURITY CHECK: Validate system prompt
    if (!pickleAISecurity.validateSystemPrompt(systemPrompt)) {
      throw new Error("System prompt validation failed")
    }

    // Get AI response using secure service
    const secureResponse = await securePickleAI.sendMessage(
      content,
      state.messages,
      updatedContext
    )

    // Add AI response
    addMessage("assistant", secureResponse.response)
  } catch (error) {
    updateState({
      error: error instanceof Error ? error.message : "Something went wrong",
    })
  } finally {
    // Clear loading state
    updateState({
      isLoading: false,
    })
  }
}

// Generate enhanced system prompt with user context
const getEnhancedSystemPrompt = (context: UserContext): string => {
  const basePrompt = getPickleballSystemPrompt()

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
        case "duprGoals":
          return `DUPR Goals: ${
            Array.isArray(value) ? value.join(", ") : value
          }`
        case "duprIntent":
          return `DUPR Intent: ${value}`
        case "playerName":
          return `Player: ${value}`
        case "location": {
          if (typeof value === "object" && value !== null) {
            const loc = value as {
              city?: string
              state?: string
              zipCode?: string
            }
            return `Location: ${loc.city || ""}${
              loc.city && loc.state ? ", " : ""
            }${loc.state || ""}${loc.zipCode || ""}`
          }
          return `Location: ${value}`
        }
        case "travelDistance":
          return `Travel: ${value.replace("_", " ")}`
        case "skillLevel":
          return `Skill: ${value}`
        case "tournamentPreference":
          return `Tournament: ${value}`
        case "datePreference":
          return `Date: ${value.replace("_", " ")}`
        case "currentPaddle":
          return `Current Paddle: ${value}`
        case "comparisonCriteria":
          return `Criteria: ${Array.isArray(value) ? value.join(", ") : value}`
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

// Clear all messages and reset context
export const clearMessages = (): void => {
  updateState({
    messages: [],
    isLoading: false,
    error: null,
    userContext: {},
    conversationCategory: null,
  })
}

// Clear error state
export const clearError = (): void => {
  updateState({
    error: null,
  })
}

// Add a welcome message when chat starts
export const initializeChat = (): void => {
  if (state.messages.length === 0) {
    addMessage(
      "assistant",
      "Hi! I'm PickleAI, your pickleball assistant. Choose a topic above or ask me anything about pickleball!"
    )
  }
}

// Reset the entire service (useful for testing)
export const reset = (): void => {
  state = {
    messages: [],
    isLoading: false,
    error: null,
    userContext: {},
    conversationCategory: null,
  }
  listeners = []
  messageIdCounter = 0
}

// Get message count
export const getMessageCount = (): number => {
  return state.messages.length
}

// Get last message
export const getLastMessage = (): ChatMessage | null => {
  return state.messages.length > 0
    ? state.messages[state.messages.length - 1]
    : null
}

// Check if currently loading
export const isLoading = (): boolean => {
  return state.isLoading
}

// Check if there's an error
export const hasError = (): boolean => {
  return state.error !== null
}

// Get specific message by ID
export const getMessageById = (id: string): ChatMessage | null => {
  return state.messages.find((msg) => msg.id === id) || null
}

// Get current user context
export const getUserContext = (): UserContext => {
  return { ...state.userContext }
}

// Get current conversation category
export const getConversationCategory = (): string | null => {
  return state.conversationCategory
}

// Manually update user context (useful for forms or structured input)
export const updateUserContext = (newContext: Partial<UserContext>): void => {
  updateState({
    userContext: { ...state.userContext, ...newContext },
  })
}
