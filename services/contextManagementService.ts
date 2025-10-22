/**
 * Context Management Service
 * Manages conversation history, semantic understanding, and user-specific memory
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

export interface ContextEntry {
  id: string;
  userId: string;
  type: 'conversation' | 'preference' | 'activity' | 'insight';
  content: string;
  embedding?: number[];
  timestamp: string;
  relevanceScore?: number;
  tags: string[];
  metadata: Record<string, any>;
}

export interface UserProfile {
  userId: string;
  preferences: Map<string, any>;
  activityLog: ContextEntry[];
  conversationHistory: ContextEntry[];
  insights: Map<string, string>;
  lastUpdated: string;
}

export interface SemanticMatch {
  entry: ContextEntry;
  similarityScore: number;
}

class ContextManagementService {
  private userProfiles: Map<string, UserProfile> = new Map();
  private contextMemory: Map<string, ContextEntry[]> = new Map();
  private maxContextTokens = 4000;
  private embeddingCache: Map<string, number[]> = new Map();

  constructor() {
    this.initializeService();
  }

  private async initializeService(): Promise<void> {
    try {
      // Load persisted contexts from AsyncStorage
      const savedContexts = await AsyncStorage.getItem('contextMemory');
      if (savedContexts) {
        const parsed = JSON.parse(savedContexts);
        this.contextMemory = new Map(Object.entries(parsed));
      }
    } catch (error) {
      console.error('Error initializing context management:', error);
    }
  }

  /**
   * Store a new context entry
   */
  async storeContext(
    userId: string,
    context: {
      type: 'conversation' | 'preference' | 'activity' | 'insight';
      content: string;
      tags: string[];
      metadata?: Record<string, any>;
    }
  ): Promise<ContextEntry> {
    const entry: ContextEntry = {
      id: `ctx_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      userId,
      type: context.type,
      content: context.content,
      timestamp: new Date().toISOString(),
      tags: context.tags,
      metadata: context.metadata || {},
      relevanceScore: 1.0
    };

    // Generate embedding for semantic search
    entry.embedding = await this.generateEmbedding(context.content);

    // Store in memory
    if (!this.contextMemory.has(userId)) {
      this.contextMemory.set(userId, []);
    }
    this.contextMemory.get(userId)!.push(entry);

    // Persist to storage
    await this.persistContext(userId, entry);

    return entry;
  }

  /**
   * Retrieve relevant context using semantic similarity
   */
  async retrieveRelevantContext(
    userId: string,
    query: string,
    limit: number = 5,
    filters?: {
      type?: string;
      tags?: string[];
      timeRange?: { start: string; end: string };
    }
  ): Promise<SemanticMatch[]> {
    const userContexts = this.contextMemory.get(userId) || [];

    // Generate embedding for query
    const queryEmbedding = await this.generateEmbedding(query);

    // Filter contexts based on criteria
    let filteredContexts = userContexts;
    if (filters) {
      if (filters.type) {
        filteredContexts = filteredContexts.filter(c => c.type === filters.type);
      }
      if (filters.tags && filters.tags.length > 0) {
        filteredContexts = filteredContexts.filter(c =>
          filters.tags!.some(tag => c.tags.includes(tag))
        );
      }
      if (filters.timeRange) {
        filteredContexts = filteredContexts.filter(c => {
          const time = new Date(c.timestamp).getTime();
          return (
            time >= new Date(filters.timeRange!.start).getTime() &&
            time <= new Date(filters.timeRange!.end).getTime()
          );
        });
      }
    }

    // Calculate similarity scores
    const matches = filteredContexts.map(context => ({
      entry: context,
      similarityScore: this.cosineSimilarity(
        queryEmbedding,
        context.embedding || []
      )
    }));

    // Sort by relevance and return top N
    return matches
      .sort((a, b) => b.similarityScore - a.similarityScore)
      .slice(0, limit);
  }

  /**
   * Build context-aware response based on user history
   */
  async buildContextAwarePrompt(
    userId: string,
    userMessage: string,
    maxTokens: number = this.maxContextTokens
  ): Promise<string> {
    // Retrieve relevant context
    const relevantContexts = await this.retrieveRelevantContext(userId, userMessage, 10);

    // Build prompt
    let prompt = `User: ${userMessage}\n\nRelevant context:\n`;

    let tokenCount = userMessage.length / 4; // Rough token estimate
    const contextItems: string[] = [];

    for (const match of relevantContexts) {
      if (tokenCount + match.entry.content.length / 4 > maxTokens) {
        break;
      }

      contextItems.push(
        `[${match.entry.type}] ${match.entry.content} (relevance: ${match.similarityScore.toFixed(2)})`
      );
      tokenCount += match.entry.content.length / 4;
    }

    if (contextItems.length > 0) {
      prompt += contextItems.join('\n') + '\n';
    } else {
      prompt += 'No relevant context found.\n';
    }

    return prompt;
  }

  /**
   * Get user profile with preferences and insights
   */
  async getUserProfile(userId: string): Promise<UserProfile> {
    if (!this.userProfiles.has(userId)) {
      this.userProfiles.set(userId, {
        userId,
        preferences: new Map(),
        activityLog: [],
        conversationHistory: [],
        insights: new Map(),
        lastUpdated: new Date().toISOString()
      });
    }

    const profile = this.userProfiles.get(userId)!;

    // Populate from contextMemory
    const userContexts = this.contextMemory.get(userId) || [];
    profile.activityLog = userContexts.filter(c => c.type === 'activity');
    profile.conversationHistory = userContexts.filter(c => c.type === 'conversation');

    return profile;
  }

  /**
   * Update user preferences
   */
  async updateUserPreferences(
    userId: string,
    preferences: Record<string, any>
  ): Promise<void> {
    const profile = await this.getUserProfile(userId);

    Object.entries(preferences).forEach(([key, value]) => {
      profile.preferences.set(key, value);
    });

    profile.lastUpdated = new Date().toISOString();
  }

  /**
   * Generate insight from user activity
   */
  async generateInsight(
    userId: string,
    insightType: string,
    data: Record<string, any>
  ): Promise<void> {
    const profile = await this.getUserProfile(userId);

    // Store insight
    const insightText = this.formatInsight(insightType, data);
    profile.insights.set(insightType, insightText);

    // Store as context entry
    await this.storeContext(userId, {
      type: 'insight',
      content: insightText,
      tags: [insightType],
      metadata: data
    });
  }

  /**
   * Clear old context entries
   */
  async pruneOldContext(userId: string, daysOld: number = 30): Promise<void> {
    const userContexts = this.contextMemory.get(userId) || [];
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysOld);

    const filtered = userContexts.filter(c => new Date(c.timestamp) > cutoffDate);
    this.contextMemory.set(userId, filtered);

    // Persist update
    await AsyncStorage.setItem(
      `context_${userId}`,
      JSON.stringify(filtered)
    );
  }

  /**
   * Generate embedding for text (simplified - use real embedding service in production)
   */
  private async generateEmbedding(text: string): Promise<number[]> {
    // Check cache first
    if (this.embeddingCache.has(text)) {
      return this.embeddingCache.get(text)!;
    }

    // Simple embedding: hash-based vector (production should use OpenAI embeddings API)
    const embedding = this.hashToVector(text);
    this.embeddingCache.set(text, embedding);

    return embedding;
  }

  /**
   * Simple hash-to-vector conversion (mock embedding)
   */
  private hashToVector(text: string): number[] {
    const dimension = 384; // Standard embedding dimension
    const vector = new Array(dimension).fill(0);

    // Simple hash-based approach for demo
    for (let i = 0; i < text.length; i++) {
      const charCode = text.charCodeAt(i);
      vector[i % dimension] += Math.sin(charCode * i) * 0.1;
    }

    // Normalize
    const magnitude = Math.sqrt(
      vector.reduce((sum, v) => sum + v * v, 0)
    );
    return magnitude > 0 ? vector.map(v => v / magnitude) : vector;
  }

  /**
   * Calculate cosine similarity between two vectors
   */
  private cosineSimilarity(vec1: number[], vec2: number[]): number {
    if (vec1.length === 0 || vec2.length === 0) return 0;

    const minLength = Math.min(vec1.length, vec2.length);
    let dotProduct = 0;
    let mag1 = 0;
    let mag2 = 0;

    for (let i = 0; i < minLength; i++) {
      dotProduct += vec1[i] * vec2[i];
      mag1 += vec1[i] * vec1[i];
      mag2 += vec2[i] * vec2[i];
    }

    const magnitude = Math.sqrt(mag1) * Math.sqrt(mag2);
    return magnitude > 0 ? dotProduct / magnitude : 0;
  }

  /**
   * Format insight as human-readable text
   */
  private formatInsight(insightType: string, data: Record<string, any>): string {
    switch (insightType) {
      case 'activity_summary':
        return `User completed ${data.count || 0} activities in the last ${data.period || 'day'}`;
      case 'preference_pattern':
        return `Detected preference: ${data.preference || 'unknown'}`;
      case 'usage_pattern':
        return `Peak usage time: ${data.peakTime || 'unknown'}, Activity: ${data.activity || 'unknown'}`;
      default:
        return `Insight: ${JSON.stringify(data)}`;
    }
  }

  /**
   * Persist context to storage
   */
  private async persistContext(userId: string, entry: ContextEntry): Promise<void> {
    try {
      const userContexts = this.contextMemory.get(userId) || [];
      await AsyncStorage.setItem(
        `context_${userId}`,
        JSON.stringify(userContexts)
      );
    } catch (error) {
      console.error('Error persisting context:', error);
    }
  }

  /**
   * Export context for user
   */
  async exportUserContext(userId: string): Promise<string> {
    const profile = await this.getUserProfile(userId);
    const userContexts = this.contextMemory.get(userId) || [];

    return JSON.stringify({
      profile,
      contexts: userContexts,
      exportDate: new Date().toISOString()
    }, null, 2);
  }

  /**
   * Clear all user data
   */
  async clearUserContext(userId: string): Promise<void> {
    this.contextMemory.delete(userId);
    this.userProfiles.delete(userId);
    await AsyncStorage.removeItem(`context_${userId}`);
  }
}

export const contextManagementService = new ContextManagementService();
