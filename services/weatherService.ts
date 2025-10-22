/**
 * Weather Service
 * 
 * Service for interacting with weather APIs
 */

import { apiService } from './apiService';
import { API_CONFIG, API_TIMEOUTS } from './apiConfig';

// Weather forecast response interface
export interface WeatherForecast {
  location: {
    name: string;
    region: string;
    country: string;
    lat: number;
    lon: number;
    tz_id: string;
    localtime: string;
  };
  current: {
    last_updated: string;
    temp_c: number;
    temp_f: number;
    condition: {
      text: string;
      icon: string;
      code: number;
    };
    wind_mph: number;
    wind_kph: number;
    wind_degree: number;
    wind_dir: string;
    precip_mm: number;
    precip_in: number;
    humidity: number;
    cloud: number;
    feelslike_c: number;
    feelslike_f: number;
    uv: number;
  };
  forecast?: {
    forecastday: Array<{
      date: string;
      day: {
        maxtemp_c: number;
        maxtemp_f: number;
        mintemp_c: number;
        mintemp_f: number;
        avgtemp_c: number;
        avgtemp_f: number;
        condition: {
          text: string;
          icon: string;
          code: number;
        };
        daily_chance_of_rain: number;
        daily_chance_of_snow: number;
      };
      hour: Array<{
        time: string;
        temp_c: number;
        temp_f: number;
        condition: {
          text: string;
          icon: string;
          code: number;
        };
        chance_of_rain: number;
        chance_of_snow: number;
      }>;
    }>;
  };
}

// Weather request parameters interface
export interface WeatherParams {
  q: string;       // Location query (e.g., "Paris", "48.8567,2.3508", "90201")
  days?: number;   // Number of days of forecast (1-10)
  dt?: string;     // Date in yyyy-MM-dd format (for historical data)
  lang?: string;   // Language code
}

class WeatherService {
  private baseUrl: string;
  private apiKey: string;
  private endpoints: {
    forecast: string;
    current: string;
  };
  
  constructor() {
    this.baseUrl = API_CONFIG.weather.baseUrl;
    this.apiKey = API_CONFIG.weather.apiKey;
    this.endpoints = API_CONFIG.weather.endpoints;
  }
  
  /**
   * Build a URL with API key and parameters
   * @param endpoint API endpoint
   * @param params Request parameters
   * @returns Full URL
   */
  private buildUrl(endpoint: string, params: WeatherParams): string {
    const url = new URL(`${this.baseUrl}${endpoint}`);
    
    // Add API key
    url.searchParams.append('key', this.apiKey);
    
    // Add other parameters
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined) {
        url.searchParams.append(key, String(value));
      }
    });
    
    return url.toString();
  }
  
  /**
   * Get current weather for a location
   * @param params Weather parameters
   * @returns Current weather data
   */
  async getCurrent(params: WeatherParams): Promise<WeatherForecast> {
    const url = this.buildUrl(this.endpoints.current, params);
    
    return await apiService.get<WeatherForecast>(url, {
      timeout: API_TIMEOUTS.weather,
      cache: {
        enabled: true,
        ttl: 30 * 60 * 1000, // Cache for 30 minutes
      }
    });
  }
  
  /**
   * Get weather forecast for a location
   * @param params Weather parameters
   * @returns Weather forecast data
   */
  async getForecast(params: WeatherParams): Promise<WeatherForecast> {
    const url = this.buildUrl(this.endpoints.forecast, {
      ...params,
      days: params.days || 3 // Default to 3 days
    });
    
    return await apiService.get<WeatherForecast>(url, {
      timeout: API_TIMEOUTS.weather,
      cache: {
        enabled: true,
        ttl: 60 * 60 * 1000, // Cache for 1 hour
      }
    });
  }
  
  /**
   * Get weather conditions for outdoor courts
   * @param courtLocations Array of court locations (lat,lon or address)
   * @returns Weather conditions for each court
   */
  async getCourtConditions(courtLocations: string[]): Promise<Record<string, WeatherForecast>> {
    const results: Record<string, WeatherForecast> = {};
    
    // Get weather for each location
    const promises = courtLocations.map(async (location) => {
      try {
        const forecast = await this.getForecast({ q: location });
        results[location] = forecast;
      } catch (error) {
        console.error(`Failed to get weather for ${location}:`, error);
        // Return null for this location but don't fail the whole operation
        results[location] = null as any;
      }
    });
    
    await Promise.all(promises);
    return results;
  }
  
  /**
   * Check if weather is suitable for outdoor play
   * @param forecast Weather forecast
   * @returns Boolean indicating if conditions are suitable
   */
  isPlayableCourt(forecast: WeatherForecast): boolean {
    if (!forecast || !forecast.current) {
      return false;
    }
    
    const current = forecast.current;
    
    // Check for rain
    if (current.precip_mm > 1.0) {
      return false;
    }
    
    // Check for extreme temperatures
    if (current.temp_c < 5 || current.temp_c > 38) {
      return false;
    }
    
    // Check for high winds
    if (current.wind_kph > 30) {
      return false;
    }
    
    return true;
  }
}

// Export a singleton instance
export const weatherService = new WeatherService();