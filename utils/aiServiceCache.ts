/**
 * AI Service Cache
 * 
 * Specialized caching mechanism for AI API calls to reduce costs and improve performance
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { env } from './environmentService';

const CACHE_PREFIX = 'ai_cache:';
const DEFAULT_TTL = 3600000; // Default TTL: 1 hour

// Cache settings from environment or defaults
const CACHE_CONFIG = {
  enabled: env('AI_CACHE_ENABLED', 'true') === 'true',
  defaultTtl: parseInt(env('AI_CACHE_DEFAULT_TTL', '3600000')),
  playerRecommendationsTtl: parseInt(env('AI_PLAYER_RECOMMENDATIONS_TTL', '14400000')), // 4 hours
  challengesTtl: parseInt(env('AI_CHALLENGES_TTL', '86400000')), // 24 hours
  scheduleRecommendationsTtl: parseInt(env('AI_SCHEDULE_RECOMMENDATIONS_TTL', '7200000')), // 2 hours
  skillAnalysisTtl: parseInt(env('AI_SKILL_ANALYSIS_TTL', '259200000')), // 3 days
};

// Cache entry type
interface CacheEntry<T> {
  data: T;
  timestamp: number;
  expiresAt: number;
}

class AiServiceCache {
  /**
   * Get cached data for a specific key
   * @param key The cache key
   * @returns Cached data or null if not found or expired
   */
  async get<T>(key: string): Promise<T | null> {
    if (!CACHE_CONFIG.enabled) return null;

    try {
      const cacheKey = this.formatCacheKey(key);
      const cachedData = await AsyncStorage.getItem(cacheKey);
      
      if (!cachedData) return null;
      
      const entry: CacheEntry<T> = JSON.parse(cachedData);
      
      // Check if entry has expired
      if (Date.now() > entry.expiresAt) {
        await this.remove(key);
        return null;
      }
      
      console.log(`[AI Cache] Cache hit for key: ${key}`);
      return entry.data;
    } catch (error) {
      console.error('[AI Cache] Error retrieving cached data:', error);
      return null;
    }
  }
  
  /**
   * Save data to cache
   * @param key The cache key
   * @param data The data to cache
   * @param ttl Time to live in milliseconds
   */
  async set<T>(key: string, data: T, ttl = DEFAULT_TTL): Promise<void> {
    if (!CACHE_CONFIG.enabled) return;

    try {
      const cacheKey = this.formatCacheKey(key);
      const entry: CacheEntry<T> = {
        data,
        timestamp: Date.now(),
        expiresAt: Date.now() + ttl
      };
      
      await AsyncStorage.setItem(cacheKey, JSON.stringify(entry));
      console.log(`[AI Cache] Saved data for key: ${key}, expires in ${ttl/1000}s`);
    } catch (error) {
      console.error('[AI Cache] Error saving data to cache:', error);
    }
  }
  
  /**
   * Remove a specific cache entry
   * @param key The cache key
   */
  async remove(key: string): Promise<void> {
    try {
      const cacheKey = this.formatCacheKey(key);
      await AsyncStorage.removeItem(cacheKey);
    } catch (error) {
      console.error('[AI Cache] Error removing cache entry:', error);
    }
  }
  
  /**
   * Clear all AI service cache entries
   */
  async clearAll(): Promise<void> {
    try {
      // Get all keys from AsyncStorage
      const allKeys = await AsyncStorage.getAllKeys();
      
      // Filter only AI cache keys
      const aiCacheKeys = allKeys.filter(key => key.startsWith(CACHE_PREFIX));
      
      if (aiCacheKeys.length > 0) {
        await AsyncStorage.multiRemove(aiCacheKeys);
        console.log(`[AI Cache] Cleared ${aiCacheKeys.length} cache entries`);
      }
    } catch (error) {
      console.error('[AI Cache] Error clearing cache:', error);
    }
  }
  
  /**
   * Generate a standardized cache key
   * @param key Base key
   * @returns Formatted cache key
   */
  private formatCacheKey(key: string): string {
    return `${CACHE_PREFIX}${key}`;
  }
  
  /**
   * Get the appropriate TTL for a specific AI endpoint
   * @param endpoint The AI service endpoint
   * @returns TTL in milliseconds
   */
  getTtlForEndpoint(endpoint: string): number {
    if (endpoint.includes('playerRecommendations')) {
      return CACHE_CONFIG.playerRecommendationsTtl;
    } else if (endpoint.includes('challenges')) {
      return CACHE_CONFIG.challengesTtl;
    } else if (endpoint.includes('schedule')) {
      return CACHE_CONFIG.scheduleRecommendationsTtl;
    } else if (endpoint.includes('skill')) {
      return CACHE_CONFIG.skillAnalysisTtl;
    }
    
    return CACHE_CONFIG.defaultTtl;
  }
}

export const aiCache = new AiServiceCache();
export default aiCache;