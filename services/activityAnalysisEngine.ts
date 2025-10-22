/**
 * Activity Analysis Engine
 * Analyzes user behavior and generates insights for personalization
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

export interface UserActivity {
  id: string;
  userId: string;
  type: 'session' | 'match' | 'invite' | 'chat' | 'recommendation' | 'gameplay';
  action: string;
  timestamp: string;
  duration?: number; // in seconds
  metadata: Record<string, any>;
  engagementScore?: number;
}

export interface ActivityPattern {
  userId: string;
  type: string;
  frequency: number;
  avgDuration: number;
  trend: 'increasing' | 'decreasing' | 'stable';
  lastOccurrence: string;
}

export interface UserInsight {
  userId: string;
  insightType: string;
  description: string;
  confidence: number; // 0-1
  actionable: boolean;
  recommendation?: string;
  timestamp: string;
}

export interface ActivityAnalytics {
  userId: string;
  totalActivities: number;
  activeMinutes: number;
  engagementScore: number;
  topActivity: string;
  patterns: ActivityPattern[];
  insights: UserInsight[];
  generatedAt: string;
}

class ActivityAnalysisEngine {
  private activities: Map<string, UserActivity[]> = new Map();
  private patterns: Map<string, ActivityPattern[]> = new Map();
  private insights: Map<string, UserInsight[]> = new Map();

  constructor() {
    this.initializeEngine();
  }

  private async initializeEngine(): Promise<void> {
    try {
      const savedActivities = await AsyncStorage.getItem('userActivities');
      if (savedActivities) {
        const parsed = JSON.parse(savedActivities);
        this.activities = new Map(Object.entries(parsed));
      }
    } catch (error) {
      console.error('Error initializing activity analysis engine:', error);
    }
  }

  /**
   * Record user activity
   */
  async recordActivity(
    userId: string,
    activity: {
      type: 'session' | 'match' | 'invite' | 'chat' | 'recommendation' | 'gameplay';
      action: string;
      duration?: number;
      metadata?: Record<string, any>;
    }
  ): Promise<UserActivity> {
    const userActivity: UserActivity = {
      id: `act_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      userId,
      type: activity.type,
      action: activity.action,
      timestamp: new Date().toISOString(),
      duration: activity.duration,
      metadata: activity.metadata || {},
      engagementScore: this.calculateEngagementScore(activity)
    };

    if (!this.activities.has(userId)) {
      this.activities.set(userId, []);
    }
    this.activities.get(userId)!.push(userActivity);

    // Analyze patterns after recording
    await this.analyzePatterns(userId);

    // Persist
    await this.persistActivities(userId);

    return userActivity;
  }

  /**
   * Analyze user activity patterns
   */
  private async analyzePatterns(userId: string): Promise<void> {
    const userActivities = this.activities.get(userId) || [];
    if (userActivities.length === 0) return;

    const activityTypes = new Map<string, UserActivity[]>();

    // Group activities by type
    userActivities.forEach(activity => {
      if (!activityTypes.has(activity.type)) {
        activityTypes.set(activity.type, []);
      }
      activityTypes.get(activity.type)!.push(activity);
    });

    const patterns: ActivityPattern[] = [];

    // Analyze each activity type
    activityTypes.forEach((activities, type) => {
      const frequency = activities.length;
      const avgDuration = activities.reduce((sum, a) => sum + (a.duration || 0), 0) / frequency;
      
      // Determine trend (compare last 7 days with previous 7 days)
      const now = new Date();
      const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      const fourteenDaysAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);

      const recentCount = activities.filter(a => new Date(a.timestamp) > sevenDaysAgo).length;
      const previousCount = activities.filter(a => {
        const time = new Date(a.timestamp);
        return time > fourteenDaysAgo && time <= sevenDaysAgo;
      }).length;

      let trend: 'increasing' | 'decreasing' | 'stable' = 'stable';
      if (recentCount > previousCount * 1.2) trend = 'increasing';
      if (recentCount < previousCount * 0.8) trend = 'decreasing';

      patterns.push({
        userId,
        type,
        frequency,
        avgDuration,
        trend,
        lastOccurrence: activities[activities.length - 1].timestamp
      });
    });

    this.patterns.set(userId, patterns);

    // Generate insights from patterns
    await this.generateInsights(userId, patterns, userActivities);
  }

  /**
   * Generate insights from activity patterns
   */
  private async generateInsights(
    userId: string,
    patterns: ActivityPattern[],
    activities: UserActivity[]
  ): Promise<void> {
    const insights: UserInsight[] = [];

    // Insight 1: High engagement detection
    const totalEngagement = activities.reduce((sum, a) => sum + (a.engagementScore || 0), 0);
    if (totalEngagement / activities.length > 0.7) {
      insights.push({
        userId,
        insightType: 'high_engagement',
        description: 'User shows high engagement with the app',
        confidence: Math.min(1, totalEngagement / activities.length),
        actionable: true,
        recommendation: 'Recommend premium features or tournaments',
        timestamp: new Date().toISOString()
      });
    }

    // Insight 2: Activity trend detection
    const increasingActivities = patterns.filter(p => p.trend === 'increasing');
    if (increasingActivities.length > 0) {
      insights.push({
        userId,
        insightType: 'increasing_activity',
        description: `User activity is increasing in ${increasingActivities.map(p => p.type).join(', ')}`,
        confidence: 0.8,
        actionable: true,
        recommendation: 'Send engagement content related to their growing interests',
        timestamp: new Date().toISOString()
      });
    }

    // Insight 3: Activity preferences
    const topActivity = patterns.reduce((prev, current) =>
      current.frequency > prev.frequency ? current : prev
    );
    if (topActivity) {
      insights.push({
        userId,
        insightType: 'activity_preference',
        description: `User's primary activity is ${topActivity.type} (${topActivity.frequency} times)`,
        confidence: 0.9,
        actionable: true,
        recommendation: `Create personalized content for ${topActivity.type}`,
        timestamp: new Date().toISOString()
      });
    }

    // Insight 4: Inactivity detection
    const daysSinceLastActivity = this.daysSinceLastActivity(activities);
    if (daysSinceLastActivity > 7) {
      insights.push({
        userId,
        insightType: 'user_inactivity',
        description: `User inactive for ${daysSinceLastActivity} days`,
        confidence: 1.0,
        actionable: true,
        recommendation: 'Send re-engagement notifications or special offers',
        timestamp: new Date().toISOString()
      });
    }

    // Insight 5: Session quality analysis
    const sessionActivities = activities.filter(a => a.type === 'session');
    if (sessionActivities.length > 0) {
      const avgSessionDuration = sessionActivities.reduce((sum, a) => sum + (a.duration || 0), 0) / sessionActivities.length;
      if (avgSessionDuration > 3600) { // More than 1 hour
        insights.push({
          userId,
          insightType: 'long_sessions',
          description: 'User engages in long gaming sessions',
          confidence: 0.85,
          actionable: true,
          recommendation: 'Recommend breaks or hydration reminders',
          timestamp: new Date().toISOString()
        });
      }
    }

    this.insights.set(userId, insights);
  }

  /**
   * Calculate engagement score for an activity
   */
  private calculateEngagementScore(activity: {
    type: string;
    action: string;
    duration?: number;
    metadata?: Record<string, any>;
  }): number {
    let score = 0.5; // Base score

    // Activity type scoring
    const typeScores: Record<string, number> = {
      'match': 0.9,
      'session': 0.8,
      'chat': 0.7,
      'recommendation': 0.6,
      'invite': 0.7,
      'gameplay': 0.85
    };
    score += typeScores[activity.type] || 0;
    score /= 2;

    // Duration bonus
    if (activity.duration && activity.duration > 600) { // More than 10 minutes
      score += 0.15;
    }

    // Metadata bonuses
    if (activity.metadata) {
      if (activity.metadata.multiplayer) score += 0.1;
      if (activity.metadata.competitive) score += 0.05;
      if (activity.metadata.social) score += 0.1;
    }

    return Math.min(1, score);
  }

  /**
   * Get analytics for a user
   */
  async getUserAnalytics(userId: string): Promise<ActivityAnalytics> {
    const userActivities = this.activities.get(userId) || [];
    const userPatterns = this.patterns.get(userId) || [];
    const userInsights = this.insights.get(userId) || [];

    const totalActivities = userActivities.length;
    const activeMinutes = userActivities.reduce((sum, a) => sum + (a.duration || 0), 0) / 60;
    const engagementScore = userActivities.length > 0
      ? userActivities.reduce((sum, a) => sum + (a.engagementScore || 0), 0) / userActivities.length
      : 0;

    const topActivity = userPatterns.length > 0
      ? userPatterns.reduce((prev, current) =>
          current.frequency > prev.frequency ? current : prev
        ).type
      : 'none';

    return {
      userId,
      totalActivities,
      activeMinutes: Math.round(activeMinutes),
      engagementScore: Math.round(engagementScore * 100) / 100,
      topActivity,
      patterns: userPatterns,
      insights: userInsights,
      generatedAt: new Date().toISOString()
    };
  }

  /**
   * Get personalized recommendations based on activity
   */
  async getPersonalizedRecommendations(userId: string): Promise<Array<{
    recommendation: string;
    reasoning: string;
    priority: 'high' | 'medium' | 'low';
  }>> {
    const insights = this.insights.get(userId) || [];
    const recommendations: Array<{
      recommendation: string;
      reasoning: string;
      priority: 'high' | 'medium' | 'low';
    }> = [];

    for (const insight of insights) {
      if (insight.actionable && insight.recommendation) {
        recommendations.push({
          recommendation: insight.recommendation,
          reasoning: insight.description,
          priority: insight.confidence > 0.8 ? 'high' : 'medium'
        });
      }
    }

    return recommendations;
  }

  /**
   * Get activity heatmap for specific period
   */
  async getActivityHeatmap(
    userId: string,
    startDate: Date,
    endDate: Date
  ): Promise<Record<string, number>> {
    const userActivities = this.activities.get(userId) || [];
    const heatmap: Record<string, number> = {};

    userActivities.forEach(activity => {
      const activityDate = new Date(activity.timestamp);
      if (activityDate >= startDate && activityDate <= endDate) {
        const hour = activityDate.getHours();
        const dayOfWeek = activityDate.toLocaleDateString('en-US', { weekday: 'short' });
        const key = `${dayOfWeek}_${hour}`;

        heatmap[key] = (heatmap[key] || 0) + 1;
      }
    });

    return heatmap;
  }

  /**
   * Calculate days since last activity
   */
  private daysSinceLastActivity(activities: UserActivity[]): number {
    if (activities.length === 0) return Infinity;

    const lastActivity = activities[activities.length - 1];
    const now = new Date();
    const lastDate = new Date(lastActivity.timestamp);
    const diff = now.getTime() - lastDate.getTime();

    return Math.floor(diff / (1000 * 60 * 60 * 24));
  }

  /**
   * Persist activities to storage
   */
  private async persistActivities(userId: string): Promise<void> {
    try {
      const userActivities = this.activities.get(userId) || [];
      await AsyncStorage.setItem(
        `activities_${userId}`,
        JSON.stringify(userActivities)
      );
    } catch (error) {
      console.error('Error persisting activities:', error);
    }
  }

  /**
   * Get activity summary for time period
   */
  async getActivitySummary(
    userId: string,
    days: number = 7
  ): Promise<{
    period: string;
    totalActivities: number;
    activeHours: number;
    avgEngagement: number;
    mostActiveDay: string;
  }> {
    const userActivities = this.activities.get(userId) || [];
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);

    const recentActivities = userActivities.filter(a => new Date(a.timestamp) > cutoffDate);

    // Calculate metrics
    const totalActivities = recentActivities.length;
    const activeHours = Math.round(
      recentActivities.reduce((sum, a) => sum + (a.duration || 0), 0) / 3600
    );
    const avgEngagement = recentActivities.length > 0
      ? recentActivities.reduce((sum, a) => sum + (a.engagementScore || 0), 0) / recentActivities.length
      : 0;

    // Find most active day
    const dayActivity = new Map<string, number>();
    recentActivities.forEach(a => {
      const day = new Date(a.timestamp).toLocaleDateString('en-US', { weekday: 'long' });
      dayActivity.set(day, (dayActivity.get(day) || 0) + 1);
    });

    let mostActiveDay = 'N/A';
    let maxActivities = 0;
    dayActivity.forEach((count, day) => {
      if (count > maxActivities) {
        maxActivities = count;
        mostActiveDay = day;
      }
    });

    return {
      period: `Last ${days} days`,
      totalActivities,
      activeHours,
      avgEngagement: Math.round(avgEngagement * 100) / 100,
      mostActiveDay
    };
  }
}

export const activityAnalysisEngine = new ActivityAnalysisEngine();
