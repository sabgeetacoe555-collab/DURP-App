/**
 * useAIOptimizer Hook
 * 
 * A utility hook for tracking and optimizing AI API usage in the application
 */

import { useState, useEffect } from 'react';
import aiRequestOptimizer from '../utils/aiRequestOptimizer';
import aiCache from '../utils/aiServiceCache';

interface UsageStats {
  requestCount: Record<string, number>;
  monthlyCostEstimate: number;
  cacheHitRatio: number;
}

export function useAIOptimizer() {
  const [usageStats, setUsageStats] = useState<UsageStats>({
    requestCount: {},
    monthlyCostEstimate: 0,
    cacheHitRatio: 0
  });
  
  // Update stats periodically
  useEffect(() => {
    const updateStats = () => {
      // Get cost estimates from optimizer
      const costStats = aiRequestOptimizer.getCostEstimates();
      
      // Calculate cache hit ratio (to be implemented in aiCache)
      const cacheStats = { hitRatio: 0.65 }; // Mock value for now
      
      setUsageStats({
        requestCount: costStats.requestCount,
        monthlyCostEstimate: costStats.monthlyCostEstimate,
        cacheHitRatio: cacheStats.hitRatio
      });
    };
    
    // Update immediately
    updateStats();
    
    // Then update every minute
    const interval = setInterval(updateStats, 60 * 1000);
    
    return () => clearInterval(interval);
  }, []);
  
  // Clear cache
  const clearCache = async () => {
    await aiCache.clearAll();
  };
  
  return {
    usageStats,
    clearCache,
    // Expose raw optimizer and cache for advanced use cases
    aiRequestOptimizer,
    aiCache
  };
}