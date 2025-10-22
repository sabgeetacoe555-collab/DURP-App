# PickleAI Developer Guide

## Overview

PickleAI is an intelligent pickleball assistant integrated into the Net Gains app that provides users with personalized advice, app help, and pickleball guidance. It's built with a focus on security, user experience, and intelligent conversation management.

## Architecture

### High-Level Architecture

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   React Native  │    │   Supabase Edge  │    │   OpenAI API    │
│   Mobile App    │◄──►│   Function       │◄──►│   (GPT-3.5)     │
│                 │    │   (pickleai-api) │    │                 │
└─────────────────┘    └──────────────────┘    └─────────────────┘
         │                       │
         │                       │
         ▼                       ▼
┌─────────────────┐    ┌──────────────────┐
│  Client Services│    │  Security Layer  │
│  & State Mgmt   │    │  & Rate Limiting │
└─────────────────┘    └──────────────────┘
```

### Core Components

1. **Client-Side Services** (`services/pickleAI/`)

   - Chat state management
   - Security validation
   - User context tracking
   - Intelligent prompting

2. **Server-Side Edge Function** (`supabase/functions/pickleai-api/`)

   - Secure API key handling
   - Advanced security enforcement
   - Rate limiting
   - Content filtering

3. **UI Components** (`screens/PickleAI/`)
   - Chat interface
   - Category-based prompts
   - Message display
   - Error handling

## Key Features

### 🎯 **Intelligent Conversation Management**

- Context-aware responses based on user profile
- Automatic user context extraction from messages
- Smart follow-up question generation
- Conversation category classification

### 🔒 **Multi-Layer Security**

- Client-side validation
- Server-side security enforcement
- Content filtering and redaction
- Rate limiting (20/min, 300/day)
- JWT authentication required

### 🎨 **User Experience**

- Category-based prompt suggestions
- Real-time chat interface
- Keyboard-aware UI
- Error handling and recovery
- Personalized responses based on DUPR rating and profile

### 🧠 **Smart Prompting**

- System prompts enhanced with user context
- Intent analysis and classification
- Missing information detection
- Follow-up question generation

## File Structure

```
services/pickleAI/
├── index.ts                    # Main export file - import from here
├── ChatBotMessageService.ts    # Core chat functionality and state management
├── PickleAISecurityService.ts  # Security validation and content filtering
├── SecurePickleAIService.ts    # Server-side API wrapper
├── OpenAIService.ts           # OpenAI API integration
├── IntelligentPromptService.ts # Smart prompt generation and context analysis
└── README.md                  # Service-specific documentation

supabase/functions/pickleai-api/
└── index.ts                   # Edge function with security and OpenAI integration

screens/PickleAI/
└── index.tsx                  # Main UI component

app/(tabs)/pickleai/
├── _layout.tsx               # Navigation layout
└── index.tsx                 # Tab entry point (redirects to screen)
```

## Getting Started

### 1. Environment Setup

Ensure these environment variables are configured:

```bash
# Client-side (React Native)
EXPO_PUBLIC_SUPABASE_URL=your_supabase_url
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# Server-side (Edge Function)
OPENAI_API_KEY=your_openai_api_key
SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

### 2. Basic Usage

```typescript
import {
  sendMessage,
  subscribe,
  getState,
  clearMessages,
  initializeChat,
} from "@/services/pickleAI"

// Initialize chat
initializeChat()

// Subscribe to state changes
const unsubscribe = subscribe((state) => {
  console.log("Chat state:", state)
})

// Send a message
await sendMessage("How can I improve my serve?", userId)

// Clean up
unsubscribe()
```

### 3. UI Integration

The main UI is located in `screens/PickleAI/index.tsx` and provides:

- Category-based prompt suggestions
- Real-time chat interface
- Message history
- Error handling
- Keyboard-aware layout

## Security Implementation

### Allowed Topics

PickleAI is designed to help with:

1. **App Help**

   - Settings, notifications, privacy, account management
   - College Hub basics, Play Sessions how-to
   - Leaderboards, PickleAI usage, XP usage at high level

2. **Official Support KB**

   - Short step-by-step instructions
   - In-app navigation guidance
   - Approved knowledge base content only

3. **General Pickleball Guidance**

   - Definitions and terminology
   - Safety tips and best practices
   - High-level technique pointers
   - Equipment recommendations

4. **DUPR Information**
   - Read-only info for signed-in user's own profile
   - Server-approved profile lookups only

### Denied Topics

The following topics are explicitly blocked:

1. **Net Gains Business Information**

   - Business model, pricing, monetization
   - Fundraising, unit economics, growth strategy
   - Internal documents, legal terms, investor materials

2. **System Exploitation**

   - XP, streaks, leaderboards manipulation
   - Reverse-engineering or bypassing anti-abuse logic
   - Security vulnerabilities, red-teaming

3. **Data Access**

   - Private user data, staff information
   - API keys, tokens, SQL queries
   - Admin or analytics data

4. **Technical Infrastructure**
   - Code that bypasses controls
   - Endpoint lists, internal APIs
   - System architecture details

### Rate Limiting

- **Per user per minute**: 20 requests
- **Per user per day**: 300 requests
- **Cooldown after violations**: 60 seconds

## Development Workflow

### 1. Local Development

```bash
# Start the development server
npm start

# Test security patterns locally
npm run test:security

# Test authentication flow
npm run test:auth
```

### 2. Testing

```bash
# Test live edge function with security features
npm run test:live

# Test specific components
npm run test:pickleai
```

### 3. Deployment

```bash
# Deploy the edge function
npm run deploy:pickleai

# Check deployment status
supabase functions list

# Monitor logs
supabase functions logs pickleai-api
```

## API Reference

### Core Services

#### `sendMessage(content: string, userId?: string): Promise<void>`

Sends a message to PickleAI and handles the response.

#### `subscribe(listener: MessageListener): () => void`

Subscribes to chat state changes. Returns unsubscribe function.

#### `getState(): ChatState`

Gets the current chat state.

#### `clearMessages(): void`

Clears all messages and resets context.

#### `initializeChat(): void`

Adds a welcome message when chat starts.

### Security Services

#### `pickleAISecurity.checkMessageSecurity(message: string, userId: string): Promise<SecurityResult>`

Validates a message for security compliance.

#### `securePickleAI.sendMessage(message: string, history: ChatMessage[], context: any): Promise<SecureAIResponse>`

Sends a message through the secure server-side API.

### Types

```typescript
interface ChatState {
  messages: ChatMessage[]
  isLoading: boolean
  error: string | null
  userContext: UserContext
  conversationCategory: string | null
}

interface ChatMessage {
  id: string
  role: "user" | "assistant" | "system"
  content: string
  timestamp: Date
}

interface UserContext {
  playerName?: string
  duprScore?: number
  experience?: "beginner" | "intermediate" | "advanced"
  budget?: string
  playFrequency?: string
  playStyle?: string
  goals?: string[]
  // ... more context fields
}
```

## User Context System

PickleAI automatically extracts and maintains user context to provide personalized responses:

### Context Sources

1. **User Profile Data**

   - Name from user profile
   - DUPR rating (singles/doubles)
   - Experience level (derived from DUPR)

2. **Message Analysis**

   - Intent extraction from user messages
   - Missing information detection
   - Goal and preference identification

3. **Conversation History**
   - Previous context from the session
   - Conversation category tracking
   - Follow-up question context

### Context Usage

The system uses context to:

- Personalize system prompts
- Generate relevant follow-up questions
- Provide targeted advice
- Maintain conversation continuity

## Error Handling

### Client-Side Errors

- Network connectivity issues
- Authentication failures
- Rate limiting exceeded
- Security violations

### Server-Side Errors

- OpenAI API failures
- Security check failures
- Rate limiting violations
- System prompt validation errors

### Error Recovery

- Automatic retry for transient errors
- User-friendly error messages
- Graceful degradation
- Clear error dismissal options

## Performance Considerations

### Client-Side

- Efficient state management with minimal re-renders
- Optimized message list rendering
- Keyboard-aware UI adjustments
- Memory management for long conversations

### Server-Side

- Rate limiting to prevent abuse
- Efficient pattern matching
- Response caching where appropriate
- Minimal API calls to OpenAI

## Monitoring and Debugging

### Logging

```bash
# Monitor edge function logs
supabase functions logs pickleai-api

# Check for security violations
supabase functions logs pickleai-api | grep "Security"
```

### Debug Mode

Enable debug logging in development:

```typescript
const DEBUG = process.env.NODE_ENV === "development"
if (DEBUG) {
  console.log("Security check:", { message, result })
}
```

## Best Practices

### 1. Security

- Always validate user input
- Use the secure API wrapper for server calls
- Monitor for security violations
- Keep detection patterns updated

### 2. User Experience

- Provide clear error messages
- Handle loading states gracefully
- Maintain conversation context
- Offer helpful alternatives when blocking content

### 3. Performance

- Minimize API calls
- Cache responses where appropriate
- Optimize rendering performance
- Monitor rate limit usage

### 4. Development

- Use the main export file for imports
- Test security patterns regularly
- Monitor edge function logs
- Keep documentation updated

## Troubleshooting

### Common Issues

1. **Authentication Errors**

   - Verify JWT token is valid
   - Check user session status
   - Ensure proper authorization headers

2. **Rate Limiting**

   - Check user request counts
   - Verify rate limit configuration
   - Monitor for abuse patterns

3. **Content Filtering**

   - Review detection patterns
   - Check for false positives
   - Update patterns as needed

4. **OpenAI API Issues**
   - Verify API key configuration
   - Check API quota and limits
   - Monitor API response times

### Debug Steps

1. Check client-side logs for errors
2. Verify edge function deployment
3. Test with simple messages first
4. Check security pattern matches
5. Verify user authentication

## Future Enhancements

### Planned Features

1. **Knowledge Base Integration**

   - Connect to official support KB
   - Implement semantic search
   - Add citation and attribution

2. **Advanced Analytics**

   - User interaction tracking
   - Conversation quality metrics
   - Performance monitoring

3. **Enhanced Personalization**

   - Machine learning for context
   - Improved intent classification
   - Dynamic response adaptation

4. **Multi-Modal Support**
   - Image analysis for technique feedback
   - Voice input/output
   - Video analysis capabilities

## Contributing

### Code Style

- Use TypeScript for all new code
- Follow existing naming conventions
- Add proper error handling
- Include JSDoc comments for public APIs

### Testing

- Add tests for new security patterns
- Test edge cases and error conditions
- Verify rate limiting behavior
- Test with various user contexts

### Documentation

- Update this README for significant changes
- Document new API endpoints
- Update security documentation
- Add examples for new features

## Support

For questions or issues:

1. Check the troubleshooting section
2. Review the security documentation
3. Check edge function logs
4. Contact the development team

---

**Status**: ✅ Production Ready

- Edge function deployed and tested
- All security guardrails active
- 100% test pass rate
- Authentication required and working
