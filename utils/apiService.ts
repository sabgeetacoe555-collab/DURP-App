/**
 * API Service
 * 
 * A service for making API requests with error handling, retry logic, and caching
 */

import { API_CONFIG, API_TIMEOUTS, API_RETRY_CONFIG } from './apiConfig';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Default fetch options
const DEFAULT_OPTIONS: RequestInit = {
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  }
};

// Error types
export enum ApiErrorType {
  NETWORK = 'NETWORK',
  SERVER = 'SERVER',
  TIMEOUT = 'TIMEOUT',
  AUTH = 'AUTH',
  CLIENT = 'CLIENT',
  UNKNOWN = 'UNKNOWN'
}

export class ApiError extends Error {
  type: ApiErrorType;
  status?: number;
  response?: any;

  constructor(message: string, type: ApiErrorType, status?: number, response?: any) {
    super(message);
    this.name = 'ApiError';
    this.type = type;
    this.status = status;
    this.response = response;
  }
}

interface CacheOptions {
  enabled: boolean;
  ttl: number; // Time to live in milliseconds
  key?: string; // Custom cache key
}

interface RequestOptions extends RequestInit {
  timeout?: number;
  retry?: {
    maxRetries: number;
    baseDelayMs: number;
    maxDelayMs: number;
  };
  cache?: CacheOptions;
}

interface ApiResponse<T> {
  data: T;
  status: number;
  headers: Headers;
  fromCache: boolean;
}

class ApiService {
  /**
   * Make an API request
   * @param url The URL to request
   * @param options Request options
   * @returns Promise with the response data
   */
  async request<T>(url: string, options: RequestOptions = {}): Promise<ApiResponse<T>> {
    const { 
      timeout = 10000, 
      retry = API_RETRY_CONFIG,
      cache = { enabled: false, ttl: 300000 } // Default 5 minutes
    } = options;
    
    // Check cache if enabled
    if (cache.enabled) {
      const cachedResponse = await this.getFromCache<T>(url, cache.key);
      if (cachedResponse) {
        return {
          data: cachedResponse.data,
          status: cachedResponse.status,
          headers: new Headers(cachedResponse.headers),
          fromCache: true
        };
      }
    }
    
    let retries = 0;
    
    while (true) {
      try {
        // Create abort controller for timeout
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), timeout);
        
        // Add abort signal to request options
        const fetchOptions: RequestInit = {
          ...DEFAULT_OPTIONS,
          ...options,
          signal: controller.signal
        };
        
        // Make the request
        const response = await fetch(url, fetchOptions);
        clearTimeout(timeoutId);
        
        // Handle HTTP errors
        if (!response.ok) {
          const errorData = await this.parseResponseData(response);
          const errorType = this.getErrorTypeFromStatus(response.status);
          throw new ApiError(
            `API request failed with status ${response.status}`,
            errorType,
            response.status,
            errorData
          );
        }
        
        // Parse response
        const data = await this.parseResponseData<T>(response);
        
        // Cache the response if enabled
        if (cache.enabled) {
          await this.saveToCache(url, {
            data,
            status: response.status,
            headers: Object.fromEntries(response.headers.entries()),
            timestamp: Date.now()
          }, cache.ttl, cache.key);
        }
        
        // Return successful response
        return {
          data,
          status: response.status,
          headers: response.headers,
          fromCache: false
        };
      } catch (error) {
        // Handle timeout
        if (error.name === 'AbortError') {
          throw new ApiError('Request timed out', ApiErrorType.TIMEOUT);
        }
        
        // Handle network errors
        if (error instanceof TypeError && error.message.includes('Network')) {
          if (retries < retry.maxRetries) {
            // Calculate exponential backoff delay
            const delay = Math.min(
              retry.baseDelayMs * Math.pow(2, retries),
              retry.maxDelayMs
            );
            
            // Wait before retrying
            await new Promise(resolve => setTimeout(resolve, delay));
            retries++;
            continue;
          }
          
          throw new ApiError('Network request failed', ApiErrorType.NETWORK);
        }
        
        // Rethrow ApiError
        if (error instanceof ApiError) {
          throw error;
        }
        
        // Handle other errors
        throw new ApiError(
          error.message || 'Unknown error occurred',
          ApiErrorType.UNKNOWN
        );
      }
    }
  }
  
  /**
   * Make a GET request
   * @param url The URL to request
   * @param options Request options
   * @returns Promise with the response data
   */
  async get<T>(url: string, options: RequestOptions = {}): Promise<T> {
    const response = await this.request<T>(url, {
      ...options,
      method: 'GET'
    });
    return response.data;
  }
  
  /**
   * Make a POST request
   * @param url The URL to request
   * @param data The data to send
   * @param options Request options
   * @returns Promise with the response data
   */
  async post<T>(url: string, data: any, options: RequestOptions = {}): Promise<T> {
    const response = await this.request<T>(url, {
      ...options,
      method: 'POST',
      body: JSON.stringify(data)
    });
    return response.data;
  }
  
  /**
   * Make a PUT request
   * @param url The URL to request
   * @param data The data to send
   * @param options Request options
   * @returns Promise with the response data
   */
  async put<T>(url: string, data: any, options: RequestOptions = {}): Promise<T> {
    const response = await this.request<T>(url, {
      ...options,
      method: 'PUT',
      body: JSON.stringify(data)
    });
    return response.data;
  }
  
  /**
   * Make a DELETE request
   * @param url The URL to request
   * @param options Request options
   * @returns Promise with the response data
   */
  async delete<T>(url: string, options: RequestOptions = {}): Promise<T> {
    const response = await this.request<T>(url, {
      ...options,
      method: 'DELETE'
    });
    return response.data;
  }
  
  /**
   * Parse response data based on content type
   * @param response The fetch response
   * @returns Parsed response data
   */
  private async parseResponseData<T>(response: Response): Promise<T> {
    const contentType = response.headers.get('content-type') || '';
    
    if (contentType.includes('application/json')) {
      return await response.json();
    } else if (contentType.includes('text/')) {
      return await response.text() as unknown as T;
    } else {
      // For binary data or other formats, return as blob
      return await response.blob() as unknown as T;
    }
  }
  
  /**
   * Get error type from HTTP status
   * @param status HTTP status code
   * @returns ApiErrorType
   */
  private getErrorTypeFromStatus(status: number): ApiErrorType {
    if (status >= 500) {
      return ApiErrorType.SERVER;
    } else if (status === 401 || status === 403) {
      return ApiErrorType.AUTH;
    } else if (status >= 400 && status < 500) {
      return ApiErrorType.CLIENT;
    } else {
      return ApiErrorType.UNKNOWN;
    }
  }
  
  /**
   * Generate cache key
   * @param url API URL
   * @param customKey Optional custom key
   * @returns Cache key
   */
  private getCacheKey(url: string, customKey?: string): string {
    return `api_cache:${customKey || url}`;
  }
  
  /**
   * Save response to cache
   * @param url API URL
   * @param data Response data to cache
   * @param ttl Time to live in milliseconds
   * @param customKey Optional custom key
   */
  private async saveToCache(url: string, data: any, ttl: number, customKey?: string): Promise<void> {
    try {
      const cacheItem = {
        data,
        expires: Date.now() + ttl
      };
      await AsyncStorage.setItem(
        this.getCacheKey(url, customKey),
        JSON.stringify(cacheItem)
      );
    } catch (error) {
      console.warn('Failed to cache API response:', error);
    }
  }
  
  /**
   * Get response from cache
   * @param url API URL
   * @param customKey Optional custom key
   * @returns Cached response data or null if not found or expired
   */
  private async getFromCache<T>(url: string, customKey?: string): Promise<any> {
    try {
      const cached = await AsyncStorage.getItem(this.getCacheKey(url, customKey));
      
      if (!cached) {
        return null;
      }
      
      const cacheItem = JSON.parse(cached);
      
      // Check if cache has expired
      if (cacheItem.expires < Date.now()) {
        // Cache expired, remove it
        await AsyncStorage.removeItem(this.getCacheKey(url, customKey));
        return null;
      }
      
      return cacheItem.data;
    } catch (error) {
      console.warn('Failed to retrieve cached API response:', error);
      return null;
    }
  }
  
  /**
   * Clear all API cache
   */
  async clearCache(): Promise<void> {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const cacheKeys = keys.filter(key => key.startsWith('api_cache:'));
      
      if (cacheKeys.length > 0) {
        await AsyncStorage.multiRemove(cacheKeys);
      }
    } catch (error) {
      console.error('Failed to clear API cache:', error);
      throw error;
    }
  }
}

// Export a singleton instance
export const apiService = new ApiService();