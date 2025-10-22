/**
 * API Configuration for External Services
 * This file contains configuration for all external APIs used in the app
 */

import { env } from './environmentService';

export const API_CONFIG = {
  // Weather API configuration
  weather: {
    baseUrl: "https://api.weatherapi.com/v1",
    endpoints: {
      forecast: "/forecast.json",
      current: "/current.json"
    },
    apiKey: env('WEATHER_API_KEY', "YOUR_WEATHER_API_KEY")
  },
  
  // DUPR API configuration
  dupr: {
    baseUrl: "https://api.dupr.com/v1", 
    endpoints: {
      playerProfile: "/players/profile",
      playerRating: "/players/rating",
      playerHistory: "/players/history"
    },
    apiKey: env('DUPR_API_KEY', "YOUR_DUPR_API_KEY")
  },
  
  // Google Maps API for location services
  maps: {
    baseUrl: "https://maps.googleapis.com/maps/api",
    endpoints: {
      geocode: "/geocode/json",
      directions: "/directions/json",
      distanceMatrix: "/distanceMatrix/json",
      places: "/place/nearbysearch/json"
    },
    apiKey: env('GOOGLE_MAPS_API_KEY', "YOUR_GOOGLE_MAPS_API_KEY")
  },
  
  // AI Service for recommendations and matchmaking
  aiService: {
    baseUrl: "https://netgains-ai-service.com/api/v1",
    endpoints: {
      playerRecommendations: "/recommendations/players",
      matchQuality: "/analysis/match-quality",
      skillAnalysis: "/analysis/skill-profile",
      challengeGeneration: "/gamification/challenges",
      scheduleOptimization: "/scheduling/optimize"
    },
    apiKey: env('AI_SERVICE_API_KEY', "YOUR_AI_SERVICE_API_KEY")
  },
  
  // Calendar integration services
  calendar: {
    google: {
      baseUrl: "https://www.googleapis.com/calendar/v3",
      endpoints: {
        events: "/events",
        calendars: "/calendars"
      },
      scopes: ["https://www.googleapis.com/auth/calendar.readonly", 
               "https://www.googleapis.com/auth/calendar.events"]
    },
    microsoft: {
      baseUrl: "https://graph.microsoft.com/v1.0/me",
      endpoints: {
        events: "/events",
        calendars: "/calendars"
      },
      scopes: ["Calendars.Read", "Calendars.ReadWrite"]
    },
    apple: {
      // Using Apple's private API via app-specific implementation
      // See appleCalendarService.ts for implementation details
    }
  }
};

// Timeout configuration for API requests
export const API_TIMEOUTS = {
  weather: 5000, // 5 seconds
  dupr: 8000,    // 8 seconds
  maps: 10000,   // 10 seconds
  aiService: 15000, // 15 seconds
  calendar: 12000   // 12 seconds
};

// Retry configuration
export const API_RETRY_CONFIG = {
  maxRetries: 3,
  baseDelayMs: 1000, // Start with 1 second delay
  maxDelayMs: 8000   // Maximum 8 second delay
};