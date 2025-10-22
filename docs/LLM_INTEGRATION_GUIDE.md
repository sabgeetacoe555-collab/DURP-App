# LLM Integration System Documentation

## Overview

This comprehensive LLM integration system extends the Net Gains app with advanced AI capabilities, including:
- External API connections (news, products, events)
- Live URL delivery in conversations
- Intelligent context management
- User activity analysis
- Web content retrieval
- Performance optimization
- Complete monitoring dashboard

## Architecture

### Core Services

#### 1. LLM Integration Service (`llmIntegrationService.ts`)
Main orchestration service handling:
- **External API Connections**
  - OpenAI for intelligent responses
  - NewsAPI for real-time news
  - ProductHunt for product recommendations
  - EventBrite for event discovery
- **Intent Detection**: Analyzes user queries to determine which APIs to call
- **Dynamic API Calling**: Orchestrates parallel API requests
- **Response Enhancement**: Enriches LLM responses with live links
- **Context Tracking**: Maintains conversation history per user

**Key Methods:**
```typescript
processMessage(userId: string, message: string, sessionId: string)
// Processes user message with external API integration

analyzeAndPlanAPICalls(message: string, context: ConversationContext)
// Determines which APIs to query based on user intent

fetchExternalData(apiQueries: APIQuery[])
// Fetches data from multiple external APIs in parallel

buildEnrichedPrompt(message: string, context: ConversationContext, externalData: Map)
// Creates context-aware prompt with external data

extractLiveLinks(llmResponse: any, externalData: Map)
// Extracts live links from response and external APIs

addUserActivity(userId: string, activity: Activity)
// Tracks user interactions for personalization
```

#### 2. Context Management Service (`contextManagementService.ts`)
Manages conversation history and user context:
- **Semantic Storage**: Stores contexts with embeddings for similarity search
- **User Profiles**: Maintains preferences, activity logs, and insights
- **Context Retrieval**: Finds relevant past conversations using cosine similarity
- **Token Management**: Ensures context fits within LLM token limits
- **Preference Learning**: Adapts responses based on user history

**Key Methods:**
```typescript
storeContext(userId: string, context: ContextEntry)
// Stores new conversation context with embedding

retrieveRelevantContext(userId: string, query: string, limit?: number)
// Retrieves relevant past contexts using semantic similarity

buildContextAwarePrompt(userId: string, userMessage: string)
// Builds prompt with relevant historical context

getUserProfile(userId: string)
// Gets complete user profile with preferences

updateUserPreferences(userId: string, preferences: Record<string, any>)
// Updates user preferences for personalization

generateInsight(userId: string, insightType: string, data: Record<string, any>)
// Generates insights from user behavior
```

#### 3. Activity Analysis Engine (`activityAnalysisEngine.ts`)
Analyzes user behavior for personalization:
- **Activity Recording**: Tracks all user interactions
- **Pattern Detection**: Identifies activity trends and preferences
- **Insight Generation**: Creates actionable insights
- **Heatmap Analysis**: Shows activity patterns by day/time
- **Recommendation Engine**: Provides personalized suggestions

**Key Methods:**
```typescript
recordActivity(userId: string, activity: UserActivity)
// Records user activity with engagement scoring

analyzePatterns(userId: string)
// Analyzes activity patterns for trends

generateInsights(userId: string, patterns: ActivityPattern[])
// Generates insights from patterns

getUserAnalytics(userId: string)
// Returns comprehensive analytics for user

getPersonalizedRecommendations(userId: string)
// Provides personalized content recommendations

getActivityHeatmap(userId: string, startDate: Date, endDate: Date)
// Returns activity distribution by time

getActivitySummary(userId: string, days?: number)
// Summarizes activity for time period
```

#### 4. Web Content Retrieval Service (`webContentRetrievalService.ts`)
Retrieves and processes external web content:
- **Content Fetching**: Retrieves HTML from URLs
- **Extractive Summarization**: Generates summaries from content
- **Link Extraction**: Identifies all links with categorization
- **Metadata Extraction**: Gets title, description, author, date
- **Sentiment Analysis**: Analyzes content tone
- **URL Validation**: Checks link accessibility

**Key Methods:**
```typescript
retrieveContent(url: string)
// Retrieves and processes web content

generateSummary(content: string)
// Creates extractive summary

extractLinks(html: string)
// Extracts all links with types

validateUrls(urls: string[])
// Batch validates URL accessibility

getContentSummary(url: string)
// Returns comprehensive content summary with metadata

clearCache()
// Clears URL cache
```

#### 5. Enhanced Chat Component (`EnhancedLLMChat.tsx`)
React Native UI for LLM conversations:
- **Message Display**: Shows user and AI messages
- **Live Link Rendering**: Displays clickable links with metadata
- **Metadata Display**: Shows API sources and topics
- **Real-time Streaming**: Displays responses as they arrive
- **Error Handling**: Graceful error messages
- **Accessibility**: Full keyboard and screen reader support

**Features:**
- Message threading with timestamps
- Live link cards with images and descriptions
- API source attribution
- Topic and sentiment metadata
- Automatic scrolling
- Loading states

#### 6. Extended LLM Dashboard (`ExtendedLLMDashboard.tsx`)
Comprehensive monitoring dashboard:
- **Overview Tab**: Key metrics and system status
- **APIs Tab**: Individual API performance breakdown
- **Content Tab**: Web content retrieval analytics
- **Activity Tab**: User engagement and activity trends
- **Real-time Metrics**: Live cost and token tracking
- **Status Indicators**: System health monitoring

## Integration Guide

### Setup

1. **Install Dependencies:**
```bash
npm install axios  # For HTTP requests
npm install @react-native-async-storage/async-storage  # For caching
```

2. **Environment Configuration:**
Create `.env` file:
```env
OPENAI_API_KEY=your_openai_key
NEWS_API_KEY=your_newsapi_key
PRODUCT_HUNT_API_KEY=your_producthunt_key
EVENTBRITE_API_KEY=your_eventbrite_key
OPENAI_API_URL=https://api.openai.com/v1
```

3. **Initialize Services in Your App:**
```typescript
import { llmIntegrationService } from './services/llmIntegrationService';
import { contextManagementService } from './services/contextManagementService';
import { activityAnalysisEngine } from './services/activityAnalysisEngine';
import { webContentRetrievalService } from './services/webContentRetrievalService';

// Services are singleton instances - just import where needed
```

### Usage Examples

#### Example 1: Basic Chat with External APIs
```typescript
import { llmIntegrationService } from './services/llmIntegrationService';
import { EnhancedLLMChatComponent } from './components/EnhancedLLMChat';

export function ChatScreen() {
  const handleSendMessage = async (message: string) => {
    return await llmIntegrationService.processMessage(
      'user123',
      message,
      'session456'
    );
  };

  return (
    <EnhancedLLMChatComponent
      userId="user123"
      sessionId="session456"
      onSendMessage={handleSendMessage}
    />
  );
}
```

#### Example 2: Activity Tracking and Personalization
```typescript
import { activityAnalysisEngine } from './services/activityAnalysisEngine';
import { contextManagementService } from './services/contextManagementService';

// Track user activity
await activityAnalysisEngine.recordActivity('user123', {
  type: 'session',
  action: 'joined_game',
  duration: 1800, // 30 minutes
  metadata: { matchId: 'match456' }
});

// Get analytics
const analytics = await activityAnalysisEngine.getUserAnalytics('user123');
console.log(`Engagement: ${analytics.engagementScore}`);

// Get recommendations
const recommendations = await activityAnalysisEngine.getPersonalizedRecommendations('user123');

// Store insight in context
await contextManagementService.generateInsight('user123', 'high_engagement', {
  score: 0.85,
  activities: 50
});
```

#### Example 3: Web Content Analysis
```typescript
import { webContentRetrievalService } from './services/webContentRetrievalService';

// Retrieve and analyze webpage
const content = await webContentRetrievalService.retrieveContent('https://example.com');

// Get content summary with metadata
const summary = await webContentRetrievalService.getContentSummary('https://example.com');
console.log(`Key points: ${summary.keyPoints.join(', ')}`);

// Validate multiple URLs
const urlsToCheck = ['https://link1.com', 'https://link2.com'];
const validation = await webContentRetrievalService.validateUrls(urlsToCheck);
```

#### Example 4: Context-Aware Responses
```typescript
import { contextManagementService } from './services/contextManagementService';

// Store user preference
await contextManagementService.updateUserPreferences('user123', {
  preferredTopics: ['tournaments', 'strategy'],
  location: 'San Francisco'
});

// Build context-aware prompt
const prompt = await contextManagementService.buildContextAwarePrompt(
  'user123',
  'What tournaments are happening?'
);

// Retrieve relevant past conversations
const relevant = await contextManagementService.retrieveRelevantContext(
  'user123',
  'tournaments',
  5
);
```

#### Example 5: Dashboard Integration
```typescript
import { ExtendedLLMDashboard } from './components/ExtendedLLMDashboard';

export function AdminScreen() {
  const [metrics, setMetrics] = useState(null);

  const handleRefresh = async () => {
    // Fetch latest metrics from your backend
    const data = await fetchLLMMetrics();
    setMetrics(data);
  };

  return (
    <ExtendedLLMDashboard
      metrics={metrics}
      onRefresh={handleRefresh}
    />
  );
}
```

## API Specifications

### External API Integrations

#### NewsAPI
**Purpose:** Real-time news and articles
**Use Cases:**
- "What's happening in pickleball?"
- "Latest tournament news"
- "Recent developments in the sport"

**Integration:**
```typescript
GET https://newsapi.org/v2/top-headlines
Query: { q: search_term, sortBy: 'publishedAt', language: 'en' }
```

#### ProductHunt
**Purpose:** Product recommendations and tools
**Use Cases:**
- "What pickleball tools are available?"
- "Recommended apps"
- "New products in sports"

**Integration:**
```typescript
GET https://api.producthunt.com/v2/posts/all/newest
Query: { search: search_term, per_page: 5 }
```

#### EventBrite
**Purpose:** Event discovery
**Use Cases:**
- "Find tournaments near me"
- "Upcoming pickleball events"
- "Local meetups"

**Integration:**
```typescript
GET https://www.eventbriteapi.com/v3/events/search
Query: { q: search_term, sort_by: 'date', max-results: 5 }
```

#### OpenAI
**Purpose:** Intelligent response generation
**Use Cases:**
- All conversational queries
- Context-aware recommendations
- Personalized advice

**Integration:**
```typescript
POST https://api.openai.com/v1/chat/completions
Body: {
  model: 'gpt-4',
  messages: [...],
  temperature: 0.7,
  max_tokens: 1000
}
```

## Performance Optimization

### Caching Strategy
- **API Responses**: 24-hour TTL for external API calls
- **Embeddings**: Cache text embeddings for semantic search
- **Content**: Cache retrieved web content
- **Contexts**: Keep 20 most recent messages in memory

### Batching
- Multiple API calls execute in parallel
- URL validations batch processed
- Context retrievals optimized with vector similarity

### Token Management
- Context limited to 4000 tokens max
- Old messages pruned automatically
- Summaries used instead of full content

### Latency Optimization
- Async/parallel API calls
- Request timeouts (10-30s depending on service)
- Local caching reduces redundant requests

## Security Considerations

### API Key Management
- All keys stored in environment variables
- Keys never logged or exposed
- Separate keys per environment (dev/prod)

### User Data Privacy
- Activity data stored locally first
- Optional sync to backend with user consent
- Clear data retention policies

### Rate Limiting
- External API rate limits respected
- Exponential backoff on failures
- User-level throttling to prevent abuse

### Content Validation
- URL validation before opening
- HTML sanitization to prevent XSS
- Input validation on all user messages

## Monitoring and Analytics

### Metrics Tracked
- **Cost Metrics**: Total spend, per-API cost, cost per user
- **Performance Metrics**: Latency, token usage, success rates
- **Usage Metrics**: API calls, content retrievals, active users
- **Engagement Metrics**: User engagement scores, trends, patterns

### Dashboard Features
- Real-time metric updates
- Historical trend analysis
- Per-API performance breakdown
- User activity heatmaps
- Cost forecasting

### Alerts
- High latency detection
- Cost threshold alerts
- API failure notifications
- Rate limit warnings

## Troubleshooting

### Common Issues

**Issue: APIs returning 401 errors**
- Check API keys in environment variables
- Verify keys haven't expired
- Check API service status page

**Issue: High latency**
- Check network connectivity
- Review current API rate limits
- Consider increasing batch sizes

**Issue: Missing links in responses**
- Verify external API connection
- Check URL extraction regex
- Review HTML structure of pages

**Issue: Inaccurate activity insights**
- Ensure activities are being recorded
- Check activity analysis thresholds
- Review pattern detection logic

## Future Enhancements

1. **Vector Database Integration**: Replace mock embeddings with real vector DB (Pinecone, Weaviate)
2. **Streaming Responses**: Implement SSE for real-time response streaming
3. **Multi-modal Support**: Add image and voice input/output
4. **Offline Support**: Cache responses for offline functionality
5. **Advanced NLP**: Use advanced NLP libraries for entity extraction
6. **A/B Testing**: Framework for testing different LLM models
7. **Custom Models**: Support for fine-tuned models
8. **Fallback Chains**: Implement fallback APIs if primary fails

## Support and Resources

- **OpenAI Docs**: https://platform.openai.com/docs
- **NewsAPI Docs**: https://newsapi.org/docs
- **ProductHunt API**: https://api.producthunt.com/docs
- **EventBrite API**: https://www.eventbrite.com/platform/api/
