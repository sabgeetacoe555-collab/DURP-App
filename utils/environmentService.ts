/**
 * Environment Service
 * 
 * A service for accessing environment variables and configuration across
 * the application, handling both Expo and React Native environments.
 */

import Constants from 'expo-constants';

// Type definitions for environment variables
interface EnvironmentVariables {
  WEATHER_API_KEY: string;
  DUPR_API_KEY: string;
  GOOGLE_MAPS_API_KEY: string;
  AI_SERVICE_API_KEY: string;
  API_BASE_URL: string;
  SUPABASE_URL: string;
  SUPABASE_ANON_KEY: string;
  
  // AI optimization config
  AI_CACHE_ENABLED: string;
  AI_CACHE_DEFAULT_TTL: string;
  AI_PLAYER_RECOMMENDATIONS_TTL: string;
  AI_CHALLENGES_TTL: string;
  AI_SCHEDULE_RECOMMENDATIONS_TTL: string;
  AI_SKILL_ANALYSIS_TTL: string;
  AI_REQUEST_THROTTLE: string;
  AI_BATCH_ENABLED: string;
  AI_BATCH_DELAY: string;
  AI_COST_TRACKING_ENABLED: string;
  // Add other environment variables as needed
}

class EnvironmentService {
  private variables: Partial<EnvironmentVariables>;

  constructor() {
    // Initialize with default empty values
    this.variables = {};
    
    // Load environment variables from Expo Constants
    if (Constants.expoConfig?.extra) {
      this.variables = {
        ...this.variables,
        ...Constants.expoConfig.extra
      };
    }
    
    // For development, you may want to add some defaults
    if (__DEV__) {
      this.loadDevDefaults();
    }
  }

  /**
   * Get an environment variable
   * @param key The environment variable key
   * @param defaultValue Optional default value if not found
   * @returns The environment variable value or default
   */
  get<K extends keyof EnvironmentVariables>(key: K, defaultValue?: string): string {
    return (this.variables[key] as string) || defaultValue || '';
  }

  /**
   * Load development default values
   */
  private loadDevDefaults(): void {
    // These are only used in development
    const devDefaults: Partial<EnvironmentVariables> = {
      WEATHER_API_KEY: 'dev_weather_key',
      DUPR_API_KEY: 'dev_dupr_key',
      GOOGLE_MAPS_API_KEY: 'dev_maps_key',
      AI_SERVICE_API_KEY: 'dev_ai_service_key',
      API_BASE_URL: 'http://localhost:8000',
    };

    // Only set values that are not already set
    for (const [key, value] of Object.entries(devDefaults)) {
      if (!this.variables[key as keyof EnvironmentVariables]) {
        this.variables[key as keyof EnvironmentVariables] = value as string;
      }
    }
  }
}

// Export a singleton instance
export const Environment = new EnvironmentService();

// Helper function to get an environment variable
export function env<K extends keyof EnvironmentVariables>(key: K, defaultValue?: string): string {
  return Environment.get(key, defaultValue);
}