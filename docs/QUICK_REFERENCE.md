# LLM Integration Quick Reference

## 🚀 Quick Start

### 1. Install Dependencies
```bash
npm install axios @react-native-async-storage/async-storage
```

### 2. Configure Environment
```env
OPENAI_API_KEY=your_key
NEWS_API_KEY=your_key
PRODUCT_HUNT_API_KEY=your_key
EVENTBRITE_API_KEY=your_key
```

### 3. Import Services
```typescript
import { llmIntegrationService } from '@/services/llmIntegrationService';
import { contextManagementService } from '@/services/contextManagementService';
import { activityAnalysisEngine } from '@/services/activityAnalysisEngine';
import { webContentRetrievalService } from '@/services/webContentRetrievalService';
```

### 4. Add Chat to Your App
```typescript
<EnhancedLLMChatComponent
  userId="user123"
  sessionId="session456"
  onSendMessage={async (msg) => 
    await llmIntegrationService.processMessage('user123', msg, 'session456')
  }
/>
```

### 5. Add Dashboard
```typescript
<ExtendedLLMDashboard metrics={metrics} onRefresh={loadMetrics} />
```

---

## 📚 Files Overview

### Services (what they do)
| Service | Purpose | Key Method |
|---------|---------|-----------|
| `llmIntegrationService` | Main orchestration + external APIs | `processMessage()` |
| `contextManagementService` | Memory + context | `retrieveRelevantContext()` |
| `activityAnalysisEngine` | Analytics + insights | `getUserAnalytics()` |
| `webContentRetrievalService` | Web scraping + summarization | `retrieveContent()` |

### Components (what they display)
| Component | Purpose | Props |
|-----------|---------|-------|
| `EnhancedLLMChat` | Chat UI with links | userId, sessionId, onSendMessage |
| `ExtendedLLMDashboard` | Analytics dashboard | metrics, onRefresh |

### Documentation
| Doc | For | Length |
|-----|-----|--------|
| `LLM_INTEGRATION_GUIDE.md` | Developers | 600 lines |
| `CLIENT_DEMO_GUIDE.md` | Demos | 300 lines |
| `IMPLEMENTATION_CHECKLIST.md` | Project managers | 400 lines |
| `LLM_INTEGRATION_SUMMARY.md` | Executives | 500 lines |

---

## 🔑 Key Methods Cheat Sheet

### LLM Integration
```typescript
// Send message with external APIs
const result = await llmIntegrationService.processMessage(
  userId,
  'What tournaments are happening?',
  sessionId
);
// Returns: { response: string, liveLinks, contextUsed }

// Track activity
await llmIntegrationService.addUserActivity(userId, {
  type: 'session',
  description: 'joined tournament'
});
```

### Context Management
```typescript
// Store context entry
await contextManagementService.storeContext(userId, {
  type: 'conversation',
  content: 'User prefers tournaments',
  tags: ['preference']
});

// Build prompt with context
const prompt = await contextManagementService.buildContextAwarePrompt(
  userId,
  'What should I do?'
);

// Get user insights
const insights = await contextManagementService.generateInsight(
  userId,
  'high_engagement',
  { score: 0.9 }
);
```

### Activity Analysis
```typescript
// Record activity
await activityAnalysisEngine.recordActivity(userId, {
  type: 'match',
  action: 'completed_match',
  duration: 3600,
  metadata: { matchId: 'abc123' }
});

// Get analytics
const analytics = await activityAnalysisEngine.getUserAnalytics(userId);

// Get recommendations
const recommendations = 
  await activityAnalysisEngine.getPersonalizedRecommendations(userId);

// Get activity summary
const summary = await activityAnalysisEngine.getActivitySummary(userId, 7);
```

### Web Content Retrieval
```typescript
// Get webpage content
const content = await webContentRetrievalService.retrieveContent(
  'https://example.com'
);

// Get summary with metadata
const summary = await webContentRetrievalService.getContentSummary(
  'https://example.com'
);

// Validate URLs
const results = await webContentRetrievalService.validateUrls(
  ['url1', 'url2', 'url3']
);
```

---

## 🎯 Common Use Cases

### 1. Personalized Tournament Recommendations
```typescript
// Step 1: Record activity
await activityAnalysisEngine.recordActivity(userId, {
  type: 'session',
  action: 'browsed_tournaments'
});

// Step 2: Get user insights
const analytics = await activityAnalysisEngine.getUserAnalytics(userId);

// Step 3: Build context-aware request
const prompt = await contextManagementService.buildContextAwarePrompt(
  userId,
  'What tournaments match my skill level?'
);

// Step 4: Get AI response with links
const response = await llmIntegrationService.processMessage(
  userId,
  'What tournaments match my skill level?',
  sessionId
);

// Step 4: Display with links
// Response contains live tournament registration links
```

### 2. Analyzing User Engagement
```typescript
// Get comprehensive analytics
const analytics = await activityAnalysisEngine.getUserAnalytics(userId);
console.log(analytics.engagementScore); // 0-1
console.log(analytics.patterns); // Activity patterns
console.log(analytics.insights); // Generated insights

// Get heatmap
const heatmap = await activityAnalysisEngine.getActivityHeatmap(
  userId,
  new Date('2024-01-01'),
  new Date('2024-01-31')
);

// Get personalized recommendations
const recommendations = 
  await activityAnalysisEngine.getPersonalizedRecommendations(userId);
```

### 3. Contextual Conversations
```typescript
// Store user preference
await contextManagementService.updateUserPreferences(userId, {
  skill_level: '3.5',
  play_style: 'competitive',
  location: 'San Francisco'
});

// Later: AI remembers preferences
const response = await llmIntegrationService.processMessage(
  userId,
  'Find me a match',
  sessionId
);
// AI filters results based on stored preferences
```

### 4. Content-Enhanced Responses
```typescript
// Fetch external content
const content = await webContentRetrievalService.retrieveContent(
  'https://www.ppatour.com/news'
);

// Summarize it
const summary = content.summary;

// Get links from it
const links = content.liveLinks;

// Use in AI context
const prompt = `Here's today's pickleball news: ${summary}. 
                Based on this, what tournaments should I recommend?`;
```

---

## 🔧 Configuration

### Environment Variables
```bash
# Required
OPENAI_API_KEY=sk-...
NEWS_API_KEY=...
PRODUCT_HUNT_API_KEY=...
EVENTBRITE_API_KEY=...

# Optional - defaults work fine
OPENAI_API_URL=https://api.openai.com/v1
```

### Service Options
```typescript
// Context Management
const maxContextTokens = 4000; // Adjust based on needs
const embeddingCacheSize = 1000; // Number of embeddings to cache

// Activity Analysis
const activityRetentionDays = 90; // How long to keep activity data
const insightConfidenceThreshold = 0.8; // Min confidence for insights

// Web Content Retrieval
const contentCacheTTL = 24 * 60 * 60 * 1000; // 24 hours
const requestTimeout = 10000; // 10 seconds
```

---

## 🎨 UI Customization

### Chat Component Theme
```typescript
<EnhancedLLMChatComponent
  userId="user123"
  sessionId="session456"
  onSendMessage={handleSend}
  theme="dark" // or "light"
/>
```

### Dashboard Customization
```typescript
// Provide your own metrics
const metrics = {
  totalRequests: 10000,
  totalTokensUsed: 5000000,
  totalCost: 75.50,
  // ... full metrics object
};

<ExtendedLLMDashboard metrics={metrics} />
```

---

## 📊 Monitoring Dashboard

### Key Metrics to Watch
- **Total Requests**: How many LLM calls
- **Total Cost**: Exact API spending
- **Average Latency**: Response time (target <500ms)
- **Active Users**: Real-time activity
- **Engagement Score**: 0-1 scale
- **API Breakdown**: Per-service metrics

### Alerts to Configure
```typescript
// High cost alert
if (totalCost > monthlyBudget * 0.9) {
  sendAlert('Approaching budget limit');
}

// High latency alert
if (avgLatency > 1000) {
  sendAlert('Response latency high');
}

// API failure alert
if (apiErrorRate > 0.05) {
  sendAlert('API error rate >5%');
}

// Engagement alert
if (avgEngagement < 0.3) {
  sendAlert('Engagement declining');
}
```

---

## 🐛 Troubleshooting

### Issue: No external APIs responding
**Fix**: 
1. Check API keys in .env
2. Verify API service status
3. Check rate limits
4. Review error logs

### Issue: Slow responses
**Fix**:
1. Check internet connection
2. Review API latency
3. Increase request timeout
4. Implement batching

### Issue: High costs
**Fix**:
1. Enable aggressive caching
2. Implement usage limits
3. Reduce token count
4. Use cheaper models

### Issue: Links not working
**Fix**:
1. Validate URLs
2. Check link format
3. Verify API responses
4. Review URL extraction regex

---

## 📈 Performance Tips

### Optimization Checklist
- ✅ Cache aggressively (24h TTL)
- ✅ Batch API calls in parallel
- ✅ Limit context to 20 messages
- ✅ Prune old activity data
- ✅ Monitor and alert on costs
- ✅ Set request timeouts
- ✅ Use fallback chains
- ✅ Track metrics continuously

### Expected Performance
| Metric | Target |
|--------|--------|
| API Response Latency | <500ms |
| Chat Response Time | <2s |
| Cache Hit Rate | >70% |
| Success Rate | >95% |
| Uptime | 99.9% |

---

## 🔐 Security Checklist

- ✅ API keys in environment variables (never committed)
- ✅ Input validation on all user messages
- ✅ Output encoding to prevent XSS
- ✅ URL validation before opening
- ✅ HTML sanitization
- ✅ Rate limiting per user
- ✅ Activity data encrypted at rest
- ✅ Logs don't contain sensitive data

---

## 📞 Support

### Documentation
- **Technical**: `LLM_INTEGRATION_GUIDE.md`
- **Client Demo**: `CLIENT_DEMO_GUIDE.md`
- **Project Plan**: `IMPLEMENTATION_CHECKLIST.md`
- **Overview**: `LLM_INTEGRATION_SUMMARY.md` (this doc)

### Getting Help
1. Check the relevant documentation
2. Review method documentation in code
3. Check troubleshooting section
4. Review example implementations
5. Check error logs

### Resources
- OpenAI: https://platform.openai.com/docs
- NewsAPI: https://newsapi.org/docs
- ProductHunt: https://api.producthunt.com
- EventBrite: https://www.eventbriteapi.com

---

## ✅ Launch Checklist

Quick pre-launch verification:

- [ ] All API keys configured
- [ ] Services tested independently
- [ ] Components rendering correctly
- [ ] Dashboard showing data
- [ ] Links clickable and valid
- [ ] Error handling working
- [ ] Offline fallbacks ready
- [ ] Performance benchmarks met
- [ ] Security scan passed
- [ ] Documentation reviewed
- [ ] Support team trained

**Ready to ship!** 🚀

---

## 💡 Pro Tips

1. **Test in stages**: Start with 1 API, add others gradually
2. **Monitor costs**: Check dashboard daily first week
3. **Gather feedback**: Ask users what they think
4. **Iterate quickly**: Update based on usage patterns
5. **Track ROI**: Measure engagement improvements
6. **Plan scaling**: Design for 10x growth
7. **Document decisions**: Keep notes on changes
8. **Celebrate wins**: Share successes with team

---

## 🎯 Success Metrics

Track these post-launch:
- ✅ 40%+ users trying AI Chat
- ✅ 2-5 messages/user/day
- ✅ 40%+ link click-through rate
- ✅ 30%+ engagement increase
- ✅ <$0.02 cost per chat
- ✅ <500ms response latency
- ✅ 95%+ success rate
- ✅ >99% uptime

---

**Questions?** Refer to full documentation or review service code. All methods have detailed comments! 📖

Good luck! 🎉
