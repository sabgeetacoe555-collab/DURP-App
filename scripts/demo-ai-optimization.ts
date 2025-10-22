/**
 * This script demonstrates the optimization strategies for AI service calls
 * including caching, throttling, batching, and monitoring.
 */

import { aiCache } from '../utils/aiServiceCache';
import { aiRequestOptimizer } from '../utils/aiRequestOptimizer';
import { useAIOptimizer } from '../hooks/useAIOptimizer';
import { getEnvironmentVariable } from '../utils/environmentService';

// Example function to demonstrate optimized AI service calls
async function runOptimizationDemo() {
  console.log('===== AI SERVICE OPTIMIZATION DEMO =====');
  
  // Initialize the AI optimizer for tracking
  const { trackRequest, usageStats } = useAIOptimizer();
  
  // Example request parameters
  const requestParams = {
    playerId: '123456',
    skillLevel: 4.2,
    preferredPlayTime: 'evening',
    location: {
      latitude: 37.7749,
      longitude: -122.4194
    }
  };
  
  console.log('1. Making first AI recommendation request (no cache)...');
  
  // Check cache first
  const cacheKey = `player_recommendations:${requestParams.playerId}:${requestParams.skillLevel}`;
  let recommendations = await aiCache.get(cacheKey);
  
  if (!recommendations) {
    console.log('  > Cache miss, calling AI service...');
    
    // Use request optimizer to handle the API call with throttling
    recommendations = await aiRequestOptimizer.executeRequest({
      requestType: 'playerRecommendations',
      priority: 'HIGH',
      execute: async () => {
        // This would be the actual API call in production
        // Simulating API response for demo
        await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate API delay
        
        return [
          { id: 'p1', name: 'John Smith', matchScore: 0.95, skillLevel: 4.3 },
          { id: 'p2', name: 'Sarah Johnson', matchScore: 0.87, skillLevel: 4.1 },
          { id: 'p3', name: 'Mike Wilson', matchScore: 0.82, skillLevel: 4.4 }
        ];
      }
    });
    
    // Store in cache
    const cacheTTL = parseInt(getEnvironmentVariable('AI_PLAYER_RECOMMENDATIONS_TTL', '14400000'));
    await aiCache.set(cacheKey, recommendations, cacheTTL);
    
    // Track API request (not cache hit)
    await trackRequest('playerRecommendations', false);
    
    console.log(`  > Got ${recommendations.length} recommendations from AI service`);
  } else {
    console.log(`  > Cache hit! Got ${recommendations.length} recommendations from cache`);
    // Track cache hit
    await trackRequest('playerRecommendations', true);
  }
  
  // Display the recommendations
  console.log('\nRecommended players:');
  recommendations.forEach((rec, i) => {
    console.log(`  ${i+1}. ${rec.name} (Skill: ${rec.skillLevel}, Match: ${rec.matchScore * 100}%)`);
  });
  
  console.log('\n2. Making second request (should use cache)...');
  
  // Second request - should use cache
  recommendations = await aiCache.get(cacheKey);
  if (recommendations) {
    console.log('  > Cache hit on second request!');
    await trackRequest('playerRecommendations', true);
  } else {
    console.log('  > Unexpected cache miss on second request');
  }
  
  console.log('\n3. Making batch requests for multiple players...');
  
  // Example of batch processing multiple requests
  const playerIds = ['123', '456', '789'];
  const batchResults = await aiRequestOptimizer.executeBatchRequests({
    requestType: 'skillAnalysis',
    priority: 'NORMAL',
    items: playerIds,
    executeBatch: async (ids) => {
      console.log(`  > Processing batch of ${ids.length} players...`);
      
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Return simulated results
      return ids.map(id => ({
        playerId: id,
        strengths: ['serve', 'backhand'],
        weaknesses: ['forehand'],
        skillScore: 4.0 + Math.random() * 1.0
      }));
    }
  });
  
  console.log(`  > Batch processing complete. Got ${batchResults.length} results`);
  
  // Track batch requests (counts as 1 API call instead of 3)
  await trackRequest('skillAnalysis', false);
  
  console.log('\n4. Displaying optimization statistics:');
  console.log(`  > Cache hit ratio: ${(usageStats.cacheHitRatio * 100).toFixed(1)}%`);
  console.log(`  > Estimated monthly cost: $${usageStats.monthlyCostEstimate.toFixed(2)}`);
  console.log(`  > Requests made: ${JSON.stringify(usageStats.requestCount)}`);
  
  console.log('\n===== OPTIMIZATION DEMO COMPLETE =====');
}

// Run the demo
runOptimizationDemo().catch(console.error);

export {};