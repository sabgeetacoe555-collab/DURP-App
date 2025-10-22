/**
 * LLM Integration Service
 * Handles communication with external LLM APIs and context management
 */

import axios, { AxiosInstance } from 'axios';
import { API_CONFIG } from '../utils/apiConfig';

export interface ExternalAPIConfig {
  name: string;
  baseUrl: string;
  apiKey: string;
  type: 'news' | 'products' | 'events' | 'weather' | 'search';
  timeout: number;
}

export interface APIResponse {
  success: boolean;
  data: any;
  source: string;
  timestamp: string;
  liveLinks: LinkData[];
}

export interface LinkData {
  title: string;
  url: string;
  type: 'product' | 'article' | 'event' | 'resource';
  description?: string;
  image?: string;
}

export interface ConversationContext {
  userId: string;
  sessionId: string;
  messages: Message[];
  metadata: {
    userLocation?: string;
    userPreferences?: Record<string, any>;
    recentActivity?: ActivitySummary[];
  };
}

export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  metadata?: {
    sentiment?: string;
    topics?: string[];
    entities?: string[];
    apiSourcesUsed?: string[];
  };
}

export interface ActivitySummary {
  type: string;
  timestamp: string;
  description: string;
  relevanceScore?: number;
}

class LLMIntegrationService {
  private axiosInstance: AxiosInstance;
  private externalAPIs: Map<string, AxiosInstance> = new Map();
  private conversationContexts: Map<string, ConversationContext> = new Map();
  private modelContextWindow = 8192; // Tokens
  private recentTokens = 0;

  constructor() {
    this.axiosInstance = axios.create({
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${API_CONFIG.aiService.apiKey}`
      }
    });

    this.initializeExternalAPIs();
  }

  /**
   * Initialize connections to external APIs
   */
  private initializeExternalAPIs() {
    const externalAPIs: ExternalAPIConfig[] = [
      {
        name: 'openai',
        baseUrl: process.env.OPENAI_API_URL || 'https://api.openai.com/v1',
        apiKey: process.env.OPENAI_API_KEY || '',
        type: 'search',
        timeout: 30000
      },
      {
        name: 'newsapi',
        baseUrl: 'https://newsapi.org/v2',
        apiKey: process.env.NEWS_API_KEY || '',
        type: 'news',
        timeout: 10000
      },
      {
        name: 'producthunt',
        baseUrl: 'https://api.producthunt.com/v2',
        apiKey: process.env.PRODUCT_HUNT_API_KEY || '',
        type: 'products',
        timeout: 10000
      },
      {
        name: 'eventbrite',
        baseUrl: 'https://www.eventbriteapi.com/v3',
        apiKey: process.env.EVENTBRITE_API_KEY || '',
        type: 'events',
        timeout: 10000
      }
    ];

    externalAPIs.forEach(config => {
      if (config.apiKey) {
        const instance = axios.create({
          baseURL: config.baseUrl,
          timeout: config.timeout,
          headers: {
            'Authorization': `Bearer ${config.apiKey}`
          }
        });
        this.externalAPIs.set(config.name, instance);
      }
    });
  }

  /**
   * Process user message with LLM and external APIs
   */
  async processMessage(
    userId: string,
    message: string,
    sessionId: string
  ): Promise<{
    response: string;
    liveLinks: LinkData[];
    contextUsed: string[];
  }> {
    try {
      // Get or create conversation context
      const context = this.getOrCreateContext(userId, sessionId);

      // Analyze user input to determine what external APIs to query
      const apiQueries = await this.analyzeAndPlanAPICalls(message, context);

      // Fetch data from external APIs
      const externalData = await this.fetchExternalData(apiQueries);

      // Build enriched prompt with context and external data
      const enrichedPrompt = this.buildEnrichedPrompt(message, context, externalData);

      // Call LLM with enriched context
      const llmResponse = await this.callLLM(enrichedPrompt);

      // Extract live links from response and external data
      const liveLinks = this.extractLiveLinks(llmResponse, externalData);

      // Update conversation context
      this.updateContext(context, message, llmResponse.text, apiQueries, externalData);

      return {
        response: llmResponse.text,
        liveLinks,
        contextUsed: apiQueries.map(q => q.source)
      };
    } catch (error) {
      console.error('Error processing LLM message:', error);
      throw error;
    }
  }

  /**
   * Analyze user input to determine which APIs to query
   */
  private async analyzeAndPlanAPICalls(
    message: string,
    context: ConversationContext
  ): Promise<Array<{
    source: string;
    query: string;
    type: string;
  }>> {
    const queries = [];

    // Detect intent from message
    if (this.containsIntent(message, ['news', 'latest', 'events', 'happening'])) {
      queries.push({
        source: 'newsapi',
        query: this.extractSearchQuery(message),
        type: 'news'
      });
    }

    if (this.containsIntent(message, ['product', 'recommendation', 'tool', 'software'])) {
      queries.push({
        source: 'producthunt',
        query: this.extractSearchQuery(message),
        type: 'products'
      });
    }

    if (this.containsIntent(message, ['event', 'conference', 'meetup', 'tournament'])) {
      queries.push({
        source: 'eventbrite',
        query: this.extractSearchQuery(message),
        type: 'events'
      });
    }

    // Always include general search context
    if (queries.length === 0) {
      queries.push({
        source: 'openai',
        query: message,
        type: 'search'
      });
    }

    return queries;
  }

  /**
   * Fetch data from external APIs
   */
  private async fetchExternalData(
    apiQueries: Array<{ source: string; query: string; type: string }>
  ): Promise<Map<string, APIResponse>> {
    const results = new Map<string, APIResponse>();

    const promises = apiQueries.map(async (query) => {
      try {
        const axiosInstance = this.externalAPIs.get(query.source);
        if (!axiosInstance) {
          console.warn(`No API client for ${query.source}`);
          return;
        }

        let response;
        switch (query.source) {
          case 'newsapi':
            response = await axiosInstance.get('/top-headlines', {
              params: {
                q: query.query,
                sortBy: 'publishedAt',
                language: 'en',
                pageSize: 5
              }
            });
            results.set(query.source, {
              success: true,
              data: response.data.articles,
              source: query.source,
              timestamp: new Date().toISOString(),
              liveLinks: (response.data.articles || []).map((article: any) => ({
                title: article.title,
                url: article.url,
                type: 'article',
                description: article.description,
                image: article.urlToImage
              }))
            });
            break;

          case 'producthunt':
            response = await axiosInstance.get('/posts/all/newest', {
              params: {
                search: query.query,
                per_page: 5
              }
            });
            results.set(query.source, {
              success: true,
              data: response.data.data,
              source: query.source,
              timestamp: new Date().toISOString(),
              liveLinks: (response.data.data || []).map((product: any) => ({
                title: product.name,
                url: product.url,
                type: 'product',
                description: product.tagline,
                image: product.thumbnail?.image_url
              }))
            });
            break;

          case 'eventbrite':
            response = await axiosInstance.get('/events/search', {
              params: {
                q: query.query,
                'sort_by': 'date',
                'max-results': 5
              }
            });
            results.set(query.source, {
              success: true,
              data: response.data.events,
              source: query.source,
              timestamp: new Date().toISOString(),
              liveLinks: (response.data.events || []).map((event: any) => ({
                title: event.name.text,
                url: `https://www.eventbrite.com/e/${event.id}`,
                type: 'event',
                description: event.description?.text?.substring(0, 100),
                image: event.logo?.url
              }))
            });
            break;
        }
      } catch (error) {
        console.error(`Error fetching from ${query.source}:`, error);
      }
    });

    await Promise.all(promises);
    return results;
  }

  /**
   * Build enriched prompt with context and external data
   */
  private buildEnrichedPrompt(
    userMessage: string,
    context: ConversationContext,
    externalData: Map<string, APIResponse>
  ): string {
    let prompt = `Context Information:
- User: ${context.userId}
- Conversation History (last 3 messages):\n`;

    // Add recent messages for context
    const recentMessages = context.messages.slice(-3);
    recentMessages.forEach(msg => {
      prompt += `${msg.role === 'user' ? 'User' : 'Assistant'}: ${msg.content}\n`;
    });

    // Add user activity summary
    if (context.metadata.recentActivity && context.metadata.recentActivity.length > 0) {
      prompt += `\nRecent User Activity:\n`;
      context.metadata.recentActivity.forEach(activity => {
        prompt += `- ${activity.description}\n`;
      });
    }

    // Add external data context
    if (externalData.size > 0) {
      prompt += `\nExternal Data Available:\n`;
      externalData.forEach((apiResponse, source) => {
        prompt += `From ${source}: ${apiResponse.data.length || 0} items found\n`;
      });
    }

    prompt += `\nUser Message: ${userMessage}`;

    return prompt;
  }

  /**
   * Call LLM with enriched context
   */
  private async callLLM(prompt: string): Promise<{ text: string }> {
    try {
      const response = await this.axiosInstance.post('/chat/completions', {
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content: 'You are a helpful assistant that provides accurate information with live links when relevant.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.7,
        max_tokens: 1000
      });

      return {
        text: response.data.choices[0].message.content
      };
    } catch (error) {
      console.error('Error calling LLM:', error);
      throw error;
    }
  }

  /**
   * Extract live links from LLM response and external data
   */
  private extractLiveLinks(
    llmResponse: { text: string },
    externalData: Map<string, APIResponse>
  ): LinkData[] {
    const links: LinkData[] = [];

    // Extract links from external data
    externalData.forEach(apiResponse => {
      links.push(...apiResponse.liveLinks);
    });

    // Extract URLs from LLM response text
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    const matches = llmResponse.text.match(urlRegex);
    if (matches) {
      matches.forEach(url => {
        links.push({
          title: this.extractTitleFromURL(url),
          url,
          type: 'resource'
        });
      });
    }

    return links;
  }

  /**
   * Update conversation context with new message
   */
  private updateContext(
    context: ConversationContext,
    userMessage: string,
    assistantResponse: string,
    apiSourcesUsed: Array<{ source: string; query: string; type: string }>,
    externalData: Map<string, APIResponse>
  ): void {
    // Add user message
    context.messages.push({
      id: `msg_${Date.now()}`,
      role: 'user',
      content: userMessage,
      timestamp: new Date().toISOString(),
      metadata: {
        topics: this.extractTopics(userMessage),
        entities: this.extractEntities(userMessage)
      }
    });

    // Add assistant response
    context.messages.push({
      id: `msg_${Date.now() + 1}`,
      role: 'assistant',
      content: assistantResponse,
      timestamp: new Date().toISOString(),
      metadata: {
        apiSourcesUsed: apiSourcesUsed.map(s => s.source)
      }
    });

    // Keep only last 20 messages to manage token count
    if (context.messages.length > 20) {
      context.messages = context.messages.slice(-20);
    }
  }

  /**
   * Get or create conversation context
   */
  private getOrCreateContext(userId: string, sessionId: string): ConversationContext {
    const contextKey = `${userId}:${sessionId}`;
    
    if (!this.conversationContexts.has(contextKey)) {
      this.conversationContexts.set(contextKey, {
        userId,
        sessionId,
        messages: [],
        metadata: {
          userPreferences: {},
          recentActivity: []
        }
      });
    }

    return this.conversationContexts.get(contextKey)!;
  }

  /**
   * Utility functions
   */

  private containsIntent(text: string, keywords: string[]): boolean {
    const lowerText = text.toLowerCase();
    return keywords.some(keyword => lowerText.includes(keyword));
  }

  private extractSearchQuery(text: string): string {
    // Simple extraction - in production, use NLP
    return text.length > 100 ? text.substring(0, 100) : text;
  }

  private extractTopics(text: string): string[] {
    // Simple topic extraction - in production, use NLP library
    return [];
  }

  private extractEntities(text: string): string[] {
    // Simple entity extraction - in production, use NLP library
    return [];
  }

  private extractTitleFromURL(url: string): string {
    try {
      const urlObj = new URL(url);
      return urlObj.hostname;
    } catch {
      return 'External Link';
    }
  }

  /**
   * Add activity to user context for personalization
   */
  async addUserActivity(
    userId: string,
    activity: {
      type: string;
      description: string;
      timestamp?: string;
    }
  ): Promise<void> {
    // Find all contexts for this user
    for (const [key, context] of this.conversationContexts) {
      if (context.userId === userId) {
        if (!context.metadata.recentActivity) {
          context.metadata.recentActivity = [];
        }
        context.metadata.recentActivity.push({
          ...activity,
          timestamp: activity.timestamp || new Date().toISOString(),
          relevanceScore: 1.0
        });

        // Keep only last 10 activities
        if (context.metadata.recentActivity.length > 10) {
          context.metadata.recentActivity = context.metadata.recentActivity.slice(-10);
        }
      }
    }
  }

  /**
   * Summarize user activity
   */
  async summarizeUserActivity(userId: string): Promise<string> {
    let summary = `User ${userId} activity summary:\n`;

    for (const [key, context] of this.conversationContexts) {
      if (context.userId === userId && context.metadata.recentActivity) {
        const activities = context.metadata.recentActivity;
        summary += `Recent actions: ${activities.length} activities\n`;
        activities.slice(-5).forEach(activity => {
          summary += `- ${activity.description}\n`;
        });
      }
    }

    return summary;
  }
}

export const llmIntegrationService = new LLMIntegrationService();
