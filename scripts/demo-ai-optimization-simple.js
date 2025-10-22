/**
 * Simple demo of AI optimization strategies
 * For demonstration purposes only
 */

// Simulate AI service cache
class AIServiceCache {
  constructor() {
    this.cache = new Map();
    console.log('AI Service Cache initialized');
  }

  async get(key) {
    const cachedItem = this.cache.get(key);
    
    if (!cachedItem) {
      return null;
    }
    
    if (Date.now() > cachedItem.expiresAt) {
      this.cache.delete(key);
      return null;
    }
    
    return cachedItem.value;
  }

  async set(key, value, ttl = 3600000) {
    this.cache.set(key, {
      value,
      expiresAt: Date.now() + ttl
    });
    return true;
  }

  async clear() {
    this.cache.clear();
    return true;
  }
}

// Simulate request optimizer
class AIRequestOptimizer {
  constructor() {
    this.requestQueue = [];
    this.inProgress = false;
    this.requestCount = {};
    console.log('AI Request Optimizer initialized');
  }
  
  async executeRequest(options) {
    const { requestType, priority, execute } = options;
    
    // Track request count
    if (!this.requestCount[requestType]) {
      this.requestCount[requestType] = 0;
    }
    this.requestCount[requestType]++;
    
    // Simple priority handling - in real implementation this would queue
    // but for demo we'll execute immediately
    console.log(`Executing ${requestType} request with ${priority} priority...`);
    
    // Add artificial delay to simulate network latency
    await new Promise(resolve => setTimeout(resolve, 500));
    
    return execute();
  }
  
  async batchRequests(requests, batchProcessor) {
    console.log(`Batching ${requests.length} requests together`);
    
    // Add artificial delay to simulate network latency
    await new Promise(resolve => setTimeout(resolve, 800));
    
    return batchProcessor(requests);
  }
}

// Demo usage statistics tracker
class AIUsageTracker {
  constructor() {
    this.requestCount = {};
    this.cacheHits = 0;
    this.totalRequests = 0;
    console.log('AI Usage Tracker initialized');
  }
  
  trackRequest(requestType, isCacheHit = false) {
    if (!this.requestCount[requestType]) {
      this.requestCount[requestType] = 0;
    }
    this.requestCount[requestType]++;
    this.totalRequests++;
    
    if (isCacheHit) {
      this.cacheHits++;
    }
    
    return {
      requestCount: this.requestCount,
      cacheHitRatio: this.cacheHits / this.totalRequests,
      monthlyCostEstimate: this.calculateCost()
    };
  }
  
  calculateCost() {
    const costMultipliers = {
      playerRecommendations: 0.02,
      skillAnalysis: 0.05,
      challengeGeneration: 0.01
    };
    
    let cost = 0;
    for (const [type, count] of Object.entries(this.requestCount)) {
      const multiplier = costMultipliers[type] || 0.01;
      cost += count * multiplier;
    }
    
    // Extrapolate to monthly cost (30 days)
    return cost * 30;
  }
}

// Initialize services
const aiCache = new AIServiceCache();
const aiRequestOptimizer = new AIRequestOptimizer();
const usageTracker = new AIUsageTracker();

// Run the demo
async function runOptimizationDemo() {
  console.log('\n===== AI SERVICE OPTIMIZATION DEMO =====\n');
  
  // Example request parameters
  const requestParams = {
    playerId: '123456',
    skillLevel: 4.2,
    preferredPlayTime: 'evening'
  };
  
  console.log('1. Making first AI recommendation request (no cache)...');
  
  // Check cache first
  const cacheKey = `player_recommendations:${requestParams.playerId}:${requestParams.skillLevel}`;
  let recommendations = await aiCache.get(cacheKey);
  
  if (!recommendations) {
    console.log('  > Cache miss, calling AI service...');
    
    // Use request optimizer to handle the API call
    recommendations = await aiRequestOptimizer.executeRequest({
      requestType: 'playerRecommendations',
      priority: 'HIGH',
      execute: async () => {
        // This would be the actual API call in production
        // Simulating API response for demo
        return [
          { id: 'p1', name: 'John Smith', matchScore: 0.95, skillLevel: 4.3 },
          { id: 'p2', name: 'Sarah Johnson', matchScore: 0.87, skillLevel: 4.1 },
          { id: 'p3', name: 'Mike Wilson', matchScore: 0.82, skillLevel: 4.4 }
        ];
      }
    });
    
    // Store in cache
    await aiCache.set(cacheKey, recommendations, 14400000); // 4 hours TTL
    
    // Track API request (not cache hit)
    const stats = usageTracker.trackRequest('playerRecommendations', false);
    
    console.log(`  > Got ${recommendations.length} recommendations from AI service`);
  } else {
    console.log(`  > Cache hit! Got ${recommendations.length} recommendations from cache`);
    // Track cache hit
    const stats = usageTracker.trackRequest('playerRecommendations', true);
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
    const stats = usageTracker.trackRequest('playerRecommendations', true);
  } else {
    console.log('  > Unexpected cache miss on second request');
  }
  
  console.log('\n3. Making batch requests for multiple players...');
  
  // Example of batch processing multiple requests
  const playerIds = ['123', '456', '789'];
  const batchResults = await aiRequestOptimizer.batchRequests(
    playerIds,
    async (ids) => {
      console.log(`  > Processing batch of ${ids.length} players in a single API call...`);
      
      // Return simulated results
      return ids.map(id => ({
        playerId: id,
        strengths: ['serve', 'backhand'],
        weaknesses: ['forehand'],
        skillScore: 4.0 + Math.random() * 1.0
      }));
    }
  );
  
  console.log(`  > Batch processing complete. Got ${batchResults.length} results`);
  
  // Track batch requests (counts as 1 API call instead of 3)
  const stats = usageTracker.trackRequest('skillAnalysis', false);
  
  console.log('\n4. Making some challenge generation requests...');
  for (let i = 0; i < 3; i++) {
    await aiRequestOptimizer.executeRequest({
      requestType: 'challengeGeneration',
      priority: 'NORMAL',
      execute: async () => {
        // Simulating API response for demo
        return { 
          challenge: `Challenge #${i+1}`, 
          difficulty: 'Medium' 
        };
      }
    });
    usageTracker.trackRequest('challengeGeneration', false);
  }
  
  // Calculate final statistics
  const finalStats = {
    requestCount: usageTracker.requestCount,
    cacheHitRatio: usageTracker.cacheHits / usageTracker.totalRequests,
    monthlyCostEstimate: usageTracker.calculateCost(),
    savingsAmount: usageTracker.cacheHits * 0.02 * 30 // Assuming $0.02 per request saved
  };
  
  console.log('\n5. Displaying optimization statistics:');
  console.log(`  > Cache hit ratio: ${(finalStats.cacheHitRatio * 100).toFixed(1)}%`);
  console.log(`  > Estimated monthly cost: $${finalStats.monthlyCostEstimate.toFixed(2)}`);
  console.log(`  > Estimated monthly savings: $${finalStats.savingsAmount.toFixed(2)}`);
  console.log(`  > Requests by type: ${JSON.stringify(finalStats.requestCount)}`);
  
  console.log('\n===== OPTIMIZATION DEMO COMPLETE =====');
}

// Execute the demo
runOptimizationDemo().catch(console.error);