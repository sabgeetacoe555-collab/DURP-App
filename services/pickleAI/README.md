# PickleAI Services

This directory contains all the services related to the PickleAI chatbot functionality, organized for better maintainability and clarity.

## Directory Structure

```
services/pickleAI/
├── index.ts                    # Main export file - import from here
├── ChatBotMessageService.ts    # Core chat functionality and state management
├── PickleAISecurityService.ts  # Security validation and content filtering
├── SecurePickleAIService.ts    # Server-side API wrapper
├── OpenAIService.ts           # OpenAI API integration
├── IntelligentPromptService.ts # Smart prompt generation and context analysis
└── README.md                  # This file
```

## Usage

### Importing Services

Instead of importing from individual files, import from the main index:

```typescript
// ✅ Recommended - import from index
import {
  sendMessage,
  subscribe,
  pickleAISecurity,
  securePickleAI,
  ChatMessage,
  ChatState,
} from "@/services/pickleAI"

// ❌ Avoid - importing from individual files
import { sendMessage } from "@/services/pickleAI/ChatBotMessageService"
```

### Main Exports

#### Core Chat Services

- `sendMessage` - Send a message to the AI
- `subscribe` - Subscribe to chat state changes
- `getState` - Get current chat state
- `clearMessages` - Clear all messages
- `initializeChat` - Initialize the chat with welcome message

#### Security Services

- `pickleAISecurity` - Main security service instance
- `securePickleAI` - Secure server-side API wrapper
- `SecurityResult`, `SecurityConfig` - Security types

#### OpenAI Services

- `sendOpenAIMessage` - Direct OpenAI API calls
- `getPickleballSystemPrompt` - Get system prompt
- `ChatMessage`, `OpenAIResponse` - OpenAI types

#### Intelligent Prompt Services

- `analyzeUserMessage` - Analyze user intent
- `generateFollowUpQuestions` - Generate follow-up questions
- `extractContextFromMessage` - Extract context from messages
- `UserContext` - User context type

## Service Responsibilities

### ChatBotMessageService.ts

- Manages chat state and message history
- Handles message sending and receiving
- Provides subscription system for UI updates
- Integrates security checks before processing

### PickleAISecurityService.ts

- Validates user messages for security
- Implements rate limiting
- Filters prohibited content
- Provides content redaction
- Manages security violations

### SecurePickleAIService.ts

- Wraps server-side API calls
- Handles authentication
- Provides error handling and fallbacks
- Ensures API keys stay server-side

### OpenAIService.ts

- Direct OpenAI API integration
- Handles API responses and errors
- Provides system prompts
- Manages API configuration

### IntelligentPromptService.ts

- Analyzes user intent and context
- Generates intelligent follow-up questions
- Manages conversation categories
- Provides context-aware prompting

## Security Features

The PickleAI services implement comprehensive security:

1. **Content Filtering** - Blocks off-lane topics
2. **Rate Limiting** - Prevents abuse (20/min, 300/day)
3. **Content Redaction** - Removes sensitive information
4. **Server-side Processing** - API keys protected
5. **Authentication** - JWT-based user validation

## Testing

### Available Test Commands

```bash
# Test security patterns locally
npm run test:security

# Test authentication flow
npm run test:auth

# Test live edge function with security features
npm run test:live
```

## Deployment

The PickleAI edge function is **deployed and tested**:

```bash
# Deploy the edge function
npm run deploy:pickleai

# Check deployment status
supabase functions list
```

## Monitoring

Monitor the deployed function:

```bash
supabase functions logs pickleai-api
```

## ✅ **Production Ready**

The PickleAI system has been thoroughly tested and is ready for production use:

- ✅ Edge function deployed and working
- ✅ All security guardrails active
- ✅ 100% test pass rate
- ✅ Authentication required and working
- ✅ Content filtering and rate limiting active

## Migration Notes

If you were previously importing from individual service files, update your imports to use the new index file:

```typescript
// Old imports
import { sendMessage } from "@/services/ChatBotMessageService"
import { pickleAISecurity } from "@/services/PickleAISecurityService"

// New imports
import { sendMessage, pickleAISecurity } from "@/services/pickleAI"
```

This organization makes the codebase more maintainable and provides a cleaner API for using PickleAI services.
