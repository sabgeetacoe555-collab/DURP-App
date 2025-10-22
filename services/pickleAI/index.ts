// services/pickleAI/index.ts
// Main export file for all PickleAI services

// Core services
export {
  pickleAISecurity,
  PickleAISecurityService,
} from "./PickleAISecurityService"
export { securePickleAI, SecurePickleAIService } from "./SecurePickleAIService"
export {
  sendMessage,
  subscribe,
  getState,
  clearMessages,
  clearError,
  initializeChat,
  updateUserContext,
  ChatState,
} from "./ChatBotMessageService"

// OpenAI and prompt services
export {
  sendMessage as sendOpenAIMessage,
  getPickleballSystemPrompt,
  ChatMessage,
  OpenAIResponse,
  OpenAIConfig,
} from "./OpenAIService"

export {
  analyzeUserMessage,
  generateFollowUpQuestions,
  extractContextFromMessage,
  generateIntelligentSystemPrompt,
  UserContext,
  conversationCategories,
} from "./IntelligentPromptService"

// Re-export commonly used types
export type {
  SecurityResult,
  SecurityConfig,
  RateLimitInfo,
} from "./PickleAISecurityService"
export type { SecureAIResponse, SecureAIRequest } from "./SecurePickleAIService"
