/**
 * AI Request Optimizer
 * 
 * Handles throttling, batching, and prioritization of AI API requests
 * to optimize performance and reduce costs.
 */

import { env } from './environmentService';

// Configuration from environment or defaults
const OPTIMIZER_CONFIG = {
  throttleEnabled: true,
  throttleDelayMs: parseInt(env('AI_REQUEST_THROTTLE', '500')), // Minimum time between requests
  batchingEnabled: env('AI_BATCH_ENABLED', 'true') === 'true',
  batchDelayMs: parseInt(env('AI_BATCH_DELAY', '100')), // Time to wait before processing batch
  costTrackingEnabled: env('AI_COST_TRACKING_ENABLED', 'true') === 'true',
};

// Request priority levels
export enum AiRequestPriority {
  LOW = 'low',       // Background tasks, non-critical
  NORMAL = 'normal', // Default priority
  HIGH = 'high',     // User-initiated actions
  URGENT = 'urgent'  // Critical operations
}

// Request interface
export interface AiRequestTask<T> {
  id: string;
  execute: () => Promise<T>;
  priority: AiRequestPriority;
  createdAt: number;
  onComplete: (result: T) => void;
  onError: (error: Error) => void;
}

class AiRequestOptimizer {
  private requestQueue: AiRequestTask<any>[] = [];
  private isProcessing: boolean = false;
  private lastRequestTime: number = 0;
  private batchTimeoutId: NodeJS.Timeout | null = null;
  
  // Cost tracking
  private monthlyCostEstimate: number = 0;
  private requestCount: { [key: string]: number } = {};
  private costPerRequestType: { [key: string]: number } = {
    playerRecommendations: 0.02, // $0.02 per request
    skillAnalysis: 0.05,         // $0.05 per request
    challengeGeneration: 0.01,   // $0.01 per request
    scheduleOptimization: 0.03,  // $0.03 per request
    default: 0.01                // Default cost
  };
  
  constructor() {
    // Initialize monthly tracking
    this.resetMonthlyTracking();
    
    // Set up periodic cost logging if enabled
    if (OPTIMIZER_CONFIG.costTrackingEnabled) {
      // Log cost estimate every 6 hours
      setInterval(() => this.logCostEstimates(), 6 * 60 * 60 * 1000);
    }
  }
  
  /**
   * Schedule an AI request with optimizations
   * @param request The AI request to be executed
   * @returns Promise that resolves with the request result
   */
  async scheduleRequest<T>(
    requestFn: () => Promise<T>,
    options: {
      requestType: string;
      priority?: AiRequestPriority;
      bypassThrottle?: boolean;
      bypassBatching?: boolean;
    }
  ): Promise<T> {
    const { 
      requestType,
      priority = AiRequestPriority.NORMAL, 
      bypassThrottle = false, 
      bypassBatching = false
    } = options;
    
    // Track request for cost estimation
    if (OPTIMIZER_CONFIG.costTrackingEnabled) {
      this.trackRequest(requestType);
    }
    
    // If bypassing optimizations, execute immediately
    if ((bypassThrottle || !OPTIMIZER_CONFIG.throttleEnabled) && 
        (bypassBatching || !OPTIMIZER_CONFIG.batchingEnabled)) {
      return await requestFn();
    }
    
    return new Promise<T>((resolve, reject) => {
      const task: AiRequestTask<T> = {
        id: `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        execute: requestFn,
        priority,
        createdAt: Date.now(),
        onComplete: resolve,
        onError: reject
      };
      
      // Add to queue
      this.requestQueue.push(task);
      
      // Sort queue by priority and creation time
      this.sortQueue();
      
      // Start processing if not already
      if (!this.isProcessing) {
        this.processQueue();
      }
    });
  }
  
  /**
   * Process the request queue with throttling and batching
   */
  private async processQueue(): Promise<void> {
    if (this.requestQueue.length === 0) {
      this.isProcessing = false;
      return;
    }
    
    this.isProcessing = true;
    
    // Implement throttling - wait if needed
    const now = Date.now();
    const timeSinceLastRequest = now - this.lastRequestTime;
    
    if (OPTIMIZER_CONFIG.throttleEnabled && 
        timeSinceLastRequest < OPTIMIZER_CONFIG.throttleDelayMs) {
      const waitTime = OPTIMIZER_CONFIG.throttleDelayMs - timeSinceLastRequest;
      await this.delay(waitTime);
    }
    
    // If batching is enabled, wait a bit to collect more requests
    if (OPTIMIZER_CONFIG.batchingEnabled && this.batchTimeoutId === null) {
      await this.waitForBatch();
    }
    
    // Take the highest priority request
    const task = this.requestQueue.shift();
    
    if (!task) {
      this.isProcessing = false;
      return;
    }
    
    try {
      // Execute the request
      this.lastRequestTime = Date.now();
      const result = await task.execute();
      task.onComplete(result);
    } catch (error) {
      task.onError(error);
    }
    
    // Process next request
    this.processQueue();
  }
  
  /**
   * Sort the request queue by priority and creation time
   */
  private sortQueue(): void {
    this.requestQueue.sort((a, b) => {
      // First compare by priority
      const priorityOrder = {
        [AiRequestPriority.URGENT]: 0,
        [AiRequestPriority.HIGH]: 1,
        [AiRequestPriority.NORMAL]: 2,
        [AiRequestPriority.LOW]: 3
      };
      
      const priorityDiff = priorityOrder[a.priority] - priorityOrder[b.priority];
      if (priorityDiff !== 0) return priorityDiff;
      
      // If same priority, sort by creation time (older first)
      return a.createdAt - b.createdAt;
    });
  }
  
  /**
   * Wait for batch collection
   */
  private async waitForBatch(): Promise<void> {
    return new Promise(resolve => {
      this.batchTimeoutId = setTimeout(() => {
        this.batchTimeoutId = null;
        resolve();
      }, OPTIMIZER_CONFIG.batchDelayMs);
    });
  }
  
  /**
   * Simple delay utility
   * @param ms Milliseconds to delay
   */
  private async delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
  
  /**
   * Track a request for cost estimation
   * @param requestType Type of request being made
   */
  private trackRequest(requestType: string): void {
    this.requestCount[requestType] = (this.requestCount[requestType] || 0) + 1;
    
    // Update cost estimate
    const costPerRequest = this.costPerRequestType[requestType] || this.costPerRequestType.default;
    this.monthlyCostEstimate += costPerRequest;
  }
  
  /**
   * Reset monthly tracking at the start of each month
   */
  private resetMonthlyTracking(): void {
    const now = new Date();
    const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
    const timeUntilNextMonth = nextMonth.getTime() - now.getTime();
    
    // Reset counters
    setTimeout(() => {
      this.monthlyCostEstimate = 0;
      this.requestCount = {};
      this.resetMonthlyTracking(); // Set up for next month
    }, timeUntilNextMonth);
  }
  
  /**
   * Log current cost estimates to console
   */
  logCostEstimates(): void {
    console.log('--- AI Service Cost Estimates ---');
    console.log(`Monthly cost estimate: $${this.monthlyCostEstimate.toFixed(2)}`);
    console.log('Request counts:');
    for (const [type, count] of Object.entries(this.requestCount)) {
      console.log(`  ${type}: ${count} requests`);
    }
    console.log('-------------------------------');
  }
  
  /**
   * Get the current cost estimates
   * @returns Current cost tracking data
   */
  getCostEstimates() {
    return {
      monthlyCostEstimate: this.monthlyCostEstimate,
      requestCount: { ...this.requestCount }
    };
  }
}

export const aiRequestOptimizer = new AiRequestOptimizer();
export default aiRequestOptimizer;