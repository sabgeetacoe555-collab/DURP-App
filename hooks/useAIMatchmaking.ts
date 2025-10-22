/**
 * useAIMatchmaking Hook
 * 
 * React hook for AI matchmaking and gamification features
 */

import { useState, useEffect, useCallback } from 'react';
import { aiMatchmakingService, PlayerRecommendation, Challenge, ScheduleRecommendation, RecommendationParams, ChallengeParams, ScheduleParams } from '../services/aiMatchmakingService';
import { useAuth } from './useAuth';

interface UseAIMatchmakingState {
  playerRecommendations: PlayerRecommendation[];
  challenges: Challenge[];
  scheduleRecommendations: ScheduleRecommendation[];
  loadingRecommendations: boolean;
  loadingChallenges: boolean;
  loadingSchedules: boolean;
  error: Error | null;
}

export function useAIMatchmaking() {
  const { user } = useAuth();
  const [state, setState] = useState<UseAIMatchmakingState>({
    playerRecommendations: [],
    challenges: [],
    scheduleRecommendations: [],
    loadingRecommendations: false,
    loadingChallenges: false,
    loadingSchedules: false,
    error: null,
  });
  
  /**
   * Load player recommendations
   */
  const loadPlayerRecommendations = useCallback(async (params: Partial<RecommendationParams> = {}) => {
    if (!user) return;
    
    try {
      setState(prev => ({ ...prev, loadingRecommendations: true, error: null }));
      
      const recommendations = await aiMatchmakingService.getPlayerRecommendations({
        playerId: user.id,
        matchType: 'doubles',
        skillRange: 0.5,
        maxResults: 10,
        includeReasons: true,
        ...params
      });
      
      setState(prev => ({ 
        ...prev, 
        playerRecommendations: recommendations, 
        loadingRecommendations: false 
      }));
    } catch (error) {
      console.error('Error loading player recommendations:', error);
      
      // Fall back to mock data in development
      if (__DEV__) {
        const mockRecommendations = aiMatchmakingService.mockPlayerRecommendations({
          playerId: user.id,
          ...params
        });
        
        setState(prev => ({ 
          ...prev, 
          playerRecommendations: mockRecommendations, 
          loadingRecommendations: false,
          error: null
        }));
      } else {
        setState(prev => ({ 
          ...prev, 
          error: error as Error, 
          loadingRecommendations: false 
        }));
      }
    }
  }, [user]);
  
  /**
   * Load personalized challenges
   */
  const loadChallenges = useCallback(async (params: Partial<ChallengeParams> = {}) => {
    if (!user) return;
    
    try {
      setState(prev => ({ ...prev, loadingChallenges: true, error: null }));
      
      const challenges = await aiMatchmakingService.generateChallenges({
        playerId: user.id,
        count: 3,
        ...params
      });
      
      setState(prev => ({ 
        ...prev, 
        challenges, 
        loadingChallenges: false 
      }));
    } catch (error) {
      console.error('Error loading challenges:', error);
      
      // Fall back to mock data in development
      if (__DEV__) {
        const mockChallenges = aiMatchmakingService.mockChallenges({
          playerId: user.id,
          ...params
        });
        
        setState(prev => ({ 
          ...prev, 
          challenges: mockChallenges, 
          loadingChallenges: false,
          error: null
        }));
      } else {
        setState(prev => ({ 
          ...prev, 
          error: error as Error, 
          loadingChallenges: false 
        }));
      }
    }
  }, [user]);
  
  /**
   * Load schedule recommendations
   */
  const loadScheduleRecommendations = useCallback(async (params: Partial<ScheduleParams>) => {
    if (!user) return;
    
    try {
      setState(prev => ({ ...prev, loadingSchedules: true, error: null }));
      
      // Default to scheduling with current user and their recommendations if playerIds not provided
      const playerIds = params.playerIds || [
        user.id,
        ...(state.playerRecommendations.slice(0, 3).map(rec => rec.playerId))
      ];
      
      const schedules = await aiMatchmakingService.getScheduleRecommendations({
        playerIds,
        durationHours: 2,
        maxResults: 5,
        ...params
      });
      
      setState(prev => ({ 
        ...prev, 
        scheduleRecommendations: schedules, 
        loadingSchedules: false 
      }));
    } catch (error) {
      console.error('Error loading schedule recommendations:', error);
      setState(prev => ({ 
        ...prev, 
        error: error as Error, 
        loadingSchedules: false 
      }));
    }
  }, [user, state.playerRecommendations]);
  
  /**
   * Load initial data when component mounts
   */
  useEffect(() => {
    if (user) {
      loadPlayerRecommendations();
      loadChallenges();
    }
  }, [user, loadPlayerRecommendations, loadChallenges]);
  
  return {
    ...state,
    loadPlayerRecommendations,
    loadChallenges,
    loadScheduleRecommendations,
  };
}