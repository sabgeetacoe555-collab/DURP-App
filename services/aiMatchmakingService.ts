/**
 * AI Matchmaking Service
 * 
 * Service for AI-powered player matchmaking and recommendations
 * with optimized caching, throttling, and cost management
 */

import { apiService } from '../utils/apiService';
import { API_CONFIG, API_TIMEOUTS } from '../utils/apiConfig';
import aiCache from '../utils/aiServiceCache';
import aiRequestOptimizer, { AiRequestPriority } from '../utils/aiRequestOptimizer';

// Player profile interface
export interface PlayerProfile {
  id: string;
  name: string;
  duprRating?: number;
  playingStyle?: string;
  preferredSide?: 'left' | 'right' | 'both';
  strengths?: string[];
  weaknesses?: string[];
  availability?: {
    preferredDays: string[];
    preferredTimes: string[];
  };
  recentMatches?: Array<{
    date: string;
    outcome: 'win' | 'loss';
    score: string;
    partners?: string[];
    opponents?: string[];
  }>;
}

// Match recommendation interface
export interface PlayerRecommendation {
  playerId: string;
  playerName: string;
  duprRating?: number;
  playingStyle?: string;
  matchScore: number; // 0-100 score indicating match quality
  reasonCodes: string[]; // e.g., "SKILL_MATCH", "STYLE_COMPLEMENT"
  reasons: string[]; // Human-readable reasons for the recommendation
  availableTimeSlots?: string[]; // Common available time slots
}

// Parameters for player recommendations
export interface RecommendationParams {
  playerId: string;
  matchType?: 'singles' | 'doubles';
  skillRange?: number; // How far from player's skill level to search
  locationId?: string;
  maxResults?: number;
  includeReasons?: boolean;
  includeTimeSlots?: boolean;
}

// Challenge interface for gamification
export interface Challenge {
  id: string;
  title: string;
  description: string;
  type: 'skill' | 'social' | 'consistency' | 'achievement';
  difficulty: 'beginner' | 'intermediate' | 'advanced' | 'expert';
  requirements: Array<{
    type: string;
    target: number;
    current: number;
  }>;
  rewards: Array<{
    type: string;
    amount: number;
  }>;
  expiresAt?: string;
  progress: number; // 0-100
}

// Parameters for challenge generation
export interface ChallengeParams {
  playerId: string;
  focusArea?: 'skill' | 'social' | 'consistency';
  difficulty?: 'beginner' | 'intermediate' | 'advanced' | 'expert';
  count?: number;
}

// Smart scheduling interface
export interface ScheduleRecommendation {
  date: string;
  startTime: string;
  endTime: string;
  location: {
    id: string;
    name: string;
    address: string;
    indoor: boolean;
  };
  weather?: {
    condition: string;
    temperature: number;
    precipitationChance: number;
    windSpeed: number;
    suitable: boolean;
  };
  playerAvailability: Array<{
    playerId: string;
    availabilityScore: number; // 0-100
  }>;
  overallScore: number; // 0-100
}

// Parameters for schedule optimization
export interface ScheduleParams {
  playerIds: string[];
  earliestDate?: string;
  latestDate?: string;
  locationIds?: string[];
  durationHours?: number;
  indoor?: boolean;
  maxResults?: number;
}

class AIMatchmakingService {
  private baseUrl: string;
  private apiKey: string;
  private endpoints: {
    playerRecommendations: string;
    matchQuality: string;
    skillAnalysis: string;
    challengeGeneration: string;
    scheduleOptimization: string;
  };
  
  constructor() {
    this.baseUrl = API_CONFIG.aiService.baseUrl;
    this.apiKey = API_CONFIG.aiService.apiKey;
    this.endpoints = API_CONFIG.aiService.endpoints;
  }
  
  /**
   * Build a URL for API requests
   * @param endpoint API endpoint
   * @returns Full URL
   */
  private buildUrl(endpoint: string): string {
    return `${this.baseUrl}${endpoint}`;
  }
  
  /**
   * Get player recommendations based on compatibility
   * Optimized with caching, request throttling and cost management
   * @param params Recommendation parameters
   * @returns List of recommended players
   */
  async getPlayerRecommendations(params: RecommendationParams): Promise<PlayerRecommendation[]> {
    // Generate cache key based on parameters
    const cacheKey = `player-recommendations:${params.playerId}:${params.matchType || 'any'}:${params.skillRange || 'default'}:${params.locationId || 'any'}`;
    
    // Try to get from cache first
    const cachedData = await aiCache.get<PlayerRecommendation[]>(cacheKey);
    if (cachedData) {
      console.log("[AI Service] Using cached player recommendations");
      return cachedData;
    }
    
    // Use request optimizer to manage API calls
    const result = await aiRequestOptimizer.scheduleRequest<PlayerRecommendation[]>(
      async () => {
        const url = this.buildUrl(this.endpoints.playerRecommendations);
        
        return await apiService.post<PlayerRecommendation[]>(url, params, {
          timeout: API_TIMEOUTS.aiService,
          headers: {
            'Authorization': `Bearer ${this.apiKey}`
          }
        });
      },
      {
        requestType: 'playerRecommendations',
        priority: AiRequestPriority.NORMAL,
        // Urgent requests can bypass throttling if user is actively waiting
        bypassThrottle: false
      }
    );
    
    // Cache the result
    const endpoint = this.endpoints.playerRecommendations;
    const ttl = aiCache.getTtlForEndpoint(endpoint);
    await aiCache.set(cacheKey, result, ttl);
    
    return result;
  }
  
  /**
   * Generate personalized challenges for a player
   * Optimized with caching and request management
   * @param params Challenge generation parameters
   * @returns List of personalized challenges
   */
  async generateChallenges(params: ChallengeParams): Promise<Challenge[]> {
    // Create cache key
    const cacheKey = `challenges:${params.playerId}:${params.focusArea || 'all'}:${params.difficulty || 'all'}`;
    
    // Try to get from cache - challenges can be cached longer since they change less frequently
    const cachedData = await aiCache.get<Challenge[]>(cacheKey);
    if (cachedData) {
      console.log("[AI Service] Using cached challenges");
      return cachedData;
    }
    
    // Use request optimizer with lower priority since challenges are less time-sensitive
    const result = await aiRequestOptimizer.scheduleRequest<Challenge[]>(
      async () => {
        const url = this.buildUrl(this.endpoints.challengeGeneration);
        
        return await apiService.post<Challenge[]>(url, params, {
          timeout: API_TIMEOUTS.aiService,
          headers: {
            'Authorization': `Bearer ${this.apiKey}`
          }
        });
      },
      {
        requestType: 'challengeGeneration',
        priority: AiRequestPriority.LOW, // Lower priority as it's not as time-sensitive
        bypassThrottle: false
      }
    );
    
    // Cache the result for longer since challenges don't need to update as frequently
    const endpoint = this.endpoints.challengeGeneration;
    const ttl = aiCache.getTtlForEndpoint(endpoint);
    await aiCache.set(cacheKey, result, ttl);
    
    return result;
  }
  
  /**
   * Get optimized schedule recommendations
   * With optimized caching and cost management
   * @param params Schedule parameters
   * @returns List of schedule recommendations
   */
  async getScheduleRecommendations(params: ScheduleParams): Promise<ScheduleRecommendation[]> {
    // Create a date-sensitive cache key - schedules are more time-dependent
    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format
    const playerIdParam = Array.isArray(params.playerIds) ? params.playerIds[0] : 'unknown';
    const locationIdParam = Array.isArray(params.locationIds) && params.locationIds.length > 0 ? params.locationIds[0] : 'any';
    const cacheKey = `schedule:${playerIdParam}:${locationIdParam}:${today}`;
    
    // Try cache first, but with shorter TTL since schedules are more time-sensitive
    const cachedData = await aiCache.get<ScheduleRecommendation[]>(cacheKey);
    if (cachedData) {
      console.log("[AI Service] Using cached schedule recommendations");
      return cachedData;
    }
    
    // Higher priority since schedule recommendations are more time-sensitive
    const result = await aiRequestOptimizer.scheduleRequest<ScheduleRecommendation[]>(
      async () => {
        const url = this.buildUrl(this.endpoints.scheduleOptimization);
        
        return await apiService.post<ScheduleRecommendation[]>(url, params, {
          timeout: API_TIMEOUTS.aiService,
          headers: {
            'Authorization': `Bearer ${this.apiKey}`
          }
        });
      },
      {
        requestType: 'scheduleOptimization',
        priority: AiRequestPriority.HIGH, // Higher priority as it's more time-sensitive
        bypassThrottle: false // Could be parameterized in the future
      }
    );
    
    // Cache with appropriate TTL
    const endpoint = this.endpoints.scheduleOptimization;
    const ttl = aiCache.getTtlForEndpoint(endpoint);
    await aiCache.set(cacheKey, result, ttl);
    
    return result;
  }
  
  /**
   * Analyze a player's skill profile based on match history
   * @param playerId Player ID
   * @returns Skill analysis data
   */
  async analyzePlayerSkill(playerId: string): Promise<any> {
    const url = this.buildUrl(this.endpoints.skillAnalysis);
    
    return await apiService.post(url, { playerId }, {
      timeout: API_TIMEOUTS.aiService,
      headers: {
        'Authorization': `Bearer ${this.apiKey}`
      },
      cache: {
        enabled: true,
        ttl: 24 * 60 * 60 * 1000, // Cache for 24 hours
      }
    });
  }
  
  /**
   * Calculate match quality between two players or teams
   * @param playerIds Array of player IDs (2 for singles, 4 for doubles)
   * @returns Match quality score and details
   */
  async calculateMatchQuality(playerIds: string[]): Promise<any> {
    const url = this.buildUrl(this.endpoints.matchQuality);
    
    return await apiService.post(url, { playerIds }, {
      timeout: API_TIMEOUTS.aiService,
      headers: {
        'Authorization': `Bearer ${this.apiKey}`
      }
    });
  }
  
  /**
   * Generate mock AI recommendations when in development mode
   * @param params Recommendation parameters
   * @returns Mock player recommendations
   */
  mockPlayerRecommendations(params: RecommendationParams): PlayerRecommendation[] {
    // Mock data for development and demo purposes
    const mockPlayers: PlayerRecommendation[] = [
      {
        playerId: 'player1',
        playerName: 'Jennifer Smith',
        duprRating: 4.2,
        playingStyle: 'Aggressive Baseliner',
        matchScore: 96,
        reasonCodes: ['SKILL_MATCH', 'STYLE_COMPLEMENT'],
        reasons: ['Similar skill level', 'Complementary playing styles']
      },
      {
        playerId: 'player2',
        playerName: 'Robert Johnson',
        duprRating: 4.0,
        playingStyle: 'Strategic Net Player',
        matchScore: 92,
        reasonCodes: ['SKILL_MATCH', 'AVAILABILITY_MATCH'],
        reasons: ['Similar skill level', 'Compatible schedules']
      },
      {
        playerId: 'player3',
        playerName: 'Amy Liu',
        duprRating: 4.3,
        playingStyle: 'All-Court Player',
        matchScore: 88,
        reasonCodes: ['PREVIOUS_MATCH_SUCCESS', 'LOCATION_PROXIMITY'],
        reasons: ['Previous successful matches', 'Lives nearby']
      }
    ];
    
    // Filter by max results
    return mockPlayers.slice(0, params.maxResults || mockPlayers.length);
  }
  
  /**
   * Generate mock challenges for development
   * @param params Challenge parameters
   * @returns Mock challenges
   */
  mockChallenges(params: ChallengeParams): Challenge[] {
    // Mock data for development and demo purposes
    const mockChallenges: Challenge[] = [
      {
        id: 'challenge1',
        title: 'Third Shot Drop Master',
        description: 'Successfully hit 15 third shot drops in your next session',
        type: 'skill',
        difficulty: 'intermediate',
        requirements: [
          {
            type: 'third_shot_drops',
            target: 15,
            current: 9
          }
        ],
        rewards: [
          {
            type: 'points',
            amount: 50
          },
          {
            type: 'badge',
            amount: 1
          }
        ],
        progress: 60
      },
      {
        id: 'challenge2',
        title: 'Win Streak',
        description: 'Win 3 games in a row against 4.0+ rated players',
        type: 'achievement',
        difficulty: 'advanced',
        requirements: [
          {
            type: 'consecutive_wins',
            target: 3,
            current: 1
          }
        ],
        rewards: [
          {
            type: 'points',
            amount: 100
          }
        ],
        progress: 33
      },
      {
        id: 'challenge3',
        title: 'Social Butterfly',
        description: 'Play with 5 new partners this month',
        type: 'social',
        difficulty: 'beginner',
        requirements: [
          {
            type: 'new_partners',
            target: 5,
            current: 4
          }
        ],
        rewards: [
          {
            type: 'points',
            amount: 75
          }
        ],
        progress: 80
      }
    ];
    
    // Filter by focus area and difficulty if specified
    let filtered = mockChallenges;
    
    if (params.focusArea) {
      filtered = filtered.filter(c => c.type === params.focusArea);
    }
    
    if (params.difficulty) {
      filtered = filtered.filter(c => c.difficulty === params.difficulty);
    }
    
    // Limit by count
    return filtered.slice(0, params.count || filtered.length);
  }
}

// Export a singleton instance
export const aiMatchmakingService = new AIMatchmakingService();