/**
 * useWeatherConditions Hook
 * 
 * React hook for fetching and monitoring weather conditions for courts
 */

import { useState, useEffect, useCallback } from 'react';
import { weatherService, WeatherForecast } from '../services/weatherService';
import { useLocationContext } from '../contexts/LocationContext';

interface UseWeatherState {
  courtWeather: Record<string, WeatherForecast>;
  playableCourts: string[];
  loading: boolean;
  error: Error | null;
  lastUpdated: Date | null;
}

/**
 * Hook to get and monitor weather conditions for courts
 * @param courtIds Optional array of court IDs to check
 * @param refreshInterval Refresh interval in milliseconds (default: 30 minutes)
 * @returns Weather state and methods
 */
export function useWeatherConditions(
  courtIds?: string[],
  refreshInterval = 30 * 60 * 1000
) {
  const { userLocation, courts } = useLocationContext();
  const [state, setState] = useState<UseWeatherState>({
    courtWeather: {},
    playableCourts: [],
    loading: false,
    error: null,
    lastUpdated: null
  });

  /**
   * Fetch weather data for specified courts
   */
  const fetchWeatherData = useCallback(async (specificCourtIds?: string[]) => {
    try {
      setState(prev => ({ ...prev, loading: true, error: null }));
      
      // Use specified court IDs, or fall back to context courts
      const targetCourtIds = specificCourtIds || courtIds || courts.map(court => court.id);
      
      // Get court locations from context
      const courtLocations = targetCourtIds.map(id => {
        const court = courts.find(c => c.id === id);
        return court 
          ? `${court.latitude},${court.longitude}` 
          : null;
      }).filter(Boolean) as string[];
      
      // If no court locations, add user's location
      if (courtLocations.length === 0 && userLocation) {
        courtLocations.push(`${userLocation.latitude},${userLocation.longitude}`);
      }
      
      // Fetch weather data
      if (courtLocations.length > 0) {
        const weatherData = await weatherService.getCourtConditions(courtLocations);
        
        // Determine which courts are playable
        const playableCourts: string[] = [];
        
        targetCourtIds.forEach((id, index) => {
          const court = courts.find(c => c.id === id);
          if (court) {
            const courtLocation = `${court.latitude},${court.longitude}`;
            const forecast = weatherData[courtLocation];
            
            if (forecast && weatherService.isPlayableCourt(forecast)) {
              playableCourts.push(id);
            }
          }
        });
        
        setState(prev => ({
          ...prev,
          courtWeather: weatherData,
          playableCourts,
          loading: false,
          lastUpdated: new Date()
        }));
      } else {
        setState(prev => ({ 
          ...prev, 
          loading: false,
          lastUpdated: new Date()
        }));
      }
    } catch (error) {
      console.error('Error fetching weather data:', error);
      setState(prev => ({ 
        ...prev, 
        error: error as Error, 
        loading: false 
      }));
    }
  }, [courtIds, courts, userLocation]);

  /**
   * Check if a specific court is playable
   * @param courtId Court ID to check
   * @returns Boolean indicating if court is playable
   */
  const isCourtPlayable = useCallback((courtId: string) => {
    return state.playableCourts.includes(courtId);
  }, [state.playableCourts]);

  /**
   * Get weather forecast for a specific court
   * @param courtId Court ID
   * @returns Weather forecast for the court or null if not available
   */
  const getCourtWeather = useCallback((courtId: string) => {
    const court = courts.find(c => c.id === courtId);
    if (!court) return null;
    
    const courtLocation = `${court.latitude},${court.longitude}`;
    return state.courtWeather[courtLocation] || null;
  }, [courts, state.courtWeather]);

  // Initial fetch and periodic refresh
  useEffect(() => {
    // Initial fetch
    fetchWeatherData();
    
    // Set up refresh interval
    const intervalId = setInterval(() => {
      fetchWeatherData();
    }, refreshInterval);
    
    // Clean up
    return () => {
      clearInterval(intervalId);
    };
  }, [fetchWeatherData, refreshInterval]);

  return {
    ...state,
    fetchWeatherData,
    isCourtPlayable,
    getCourtWeather
  };
}