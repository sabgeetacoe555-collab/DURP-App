/**
 * Extended LLM Admin Dashboard
 * Monitors all LLM integrations and provides comprehensive analytics
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  ScrollView,
  Text,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';

export interface LLMMetrics {
  totalRequests: number;
  totalTokensUsed: number;
  totalCost: number;
  averageLatency: number;
  apiBreakdown: Record<string, {
    requests: number;
    tokensUsed: number;
    cost: number;
    avgLatency: number;
  }>;
  contextRetrievals: number;
  activityAnalysis: {
    totalUsers: number;
    activeUsers: number;
    avgEngagement: number;
  };
  webContentRetrieval: {
    totalRequests: number;
    successRate: number;
    avgContentSize: number;
  };
}

interface Props {
  metrics?: LLMMetrics;
  onRefresh?: () => Promise<void>;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 20,
    paddingVertical: 15,
    paddingTop: 40,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  headerSubtitle: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: 4,
  },
  section: {
    backgroundColor: '#fff',
    marginTop: 10,
    marginHorizontal: 10,
    borderRadius: 10,
    padding: 15,
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 15,
    color: '#000',
  },
  metricRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  metricLabel: {
    fontSize: 14,
    color: '#666',
    flex: 1,
  },
  metricValue: {
    fontSize: 18,
    fontWeight: '600',
    color: '#007AFF',
  },
  metricUnit: {
    fontSize: 12,
    color: '#999',
    marginLeft: 6,
  },
  apiCard: {
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#007AFF',
  },
  apiName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000',
    marginBottom: 8,
  },
  apiMetrics: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
  },
  apiMetricItem: {
    flex: 1,
    minWidth: '48%',
    marginBottom: 8,
  },
  apiMetricLabel: {
    fontSize: 11,
    color: '#999',
  },
  apiMetricValue: {
    fontSize: 13,
    fontWeight: '600',
    color: '#333',
    marginTop: 2,
  },
  trendPositive: {
    color: '#34C759',
  },
  trendNegative: {
    color: '#FF3B30',
  },
  statusBadge: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#34C759',
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 6,
    marginLeft: 10,
  },
  statusBadgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 6,
  },
  chartContainer: {
    marginTop: 15,
    paddingTop: 15,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  chartBar: {
    marginBottom: 12,
  },
  chartLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  chartBarContainer: {
    height: 20,
    backgroundColor: '#f0f0f0',
    borderRadius: 4,
    overflow: 'hidden',
    flexDirection: 'row',
  },
  chartBarFill: {
    backgroundColor: '#007AFF',
    height: '100%',
  },
  chartBarPercent: {
    fontSize: 11,
    color: '#666',
    marginLeft: 8,
    marginTop: 2,
  },
  refreshButton: {
    backgroundColor: '#007AFF',
    borderRadius: 8,
    paddingHorizontal: 15,
    paddingVertical: 8,
    alignSelf: 'flex-end',
    marginRight: 10,
    marginTop: 10,
  },
  refreshButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  emptyState: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyStateText: {
    fontSize: 14,
    color: '#999',
  },
});

const mockMetrics: LLMMetrics = {
  totalRequests: 15420,
  totalTokensUsed: 2850000,
  totalCost: 42.75,
  averageLatency: 450,
  apiBreakdown: {
    'OpenAI': {
      requests: 8500,
      tokensUsed: 1800000,
      cost: 27.0,
      avgLatency: 520
    },
    'NewsAPI': {
      requests: 3200,
      tokensUsed: 0,
      cost: 0,
      avgLatency: 380
    },
    'ProductHunt': {
      requests: 2100,
      tokensUsed: 0,
      cost: 0,
      avgLatency: 290
    },
    'EventBrite': {
      requests: 1620,
      tokensUsed: 0,
      cost: 15.75,
      avgLatency: 410
    }
  },
  contextRetrievals: 12500,
  activityAnalysis: {
    totalUsers: 1250,
    activeUsers: 890,
    avgEngagement: 0.78
  },
  webContentRetrieval: {
    totalRequests: 5680,
    successRate: 0.94,
    avgContentSize: 4250
  }
};

export const ExtendedLLMDashboard: React.FC<Props> = ({
  metrics = mockMetrics,
  onRefresh
}) => {
  const [refreshing, setRefreshing] = useState(false);
  const [selectedTab, setSelectedTab] = useState<'overview' | 'apis' | 'content' | 'activity'>('overview');

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      if (onRefresh) {
        await onRefresh();
      }
    } finally {
      setRefreshing(false);
    }
  };

  const formatNumber = (num: number): string => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num.toString();
  };

  const renderOverview = () => (
    <>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Key Metrics</Text>

        <View style={styles.metricRow}>
          <Text style={styles.metricLabel}>Total Requests</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Text style={styles.metricValue}>
              {formatNumber(metrics.totalRequests)}
            </Text>
            <Text style={styles.metricUnit}>requests</Text>
          </View>
        </View>

        <View style={styles.metricRow}>
          <Text style={styles.metricLabel}>Total Tokens Used</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Text style={styles.metricValue}>
              {formatNumber(metrics.totalTokensUsed)}
            </Text>
            <Text style={styles.metricUnit}>tokens</Text>
          </View>
        </View>

        <View style={styles.metricRow}>
          <Text style={styles.metricLabel}>Total Cost</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Text style={styles.metricValue}>
              ${metrics.totalCost.toFixed(2)}
            </Text>
            <Text style={styles.metricUnit}>USD</Text>
          </View>
        </View>

        <View style={styles.metricRow}>
          <Text style={styles.metricLabel}>Average Latency</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Text style={styles.metricValue}>
              {metrics.averageLatency}
            </Text>
            <Text style={styles.metricUnit}>ms</Text>
          </View>
        </View>

        <View style={styles.metricRow}>
          <Text style={styles.metricLabel}>Context Retrievals</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Text style={styles.metricValue}>
              {formatNumber(metrics.contextRetrievals)}
            </Text>
            <Text style={styles.metricUnit}>retrievals</Text>
          </View>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>System Status</Text>
        <View style={styles.metricRow}>
          <Text style={styles.metricLabel}>Active Users</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Text style={styles.metricValue}>
              {metrics.activityAnalysis.activeUsers}
            </Text>
            <Text style={styles.metricUnit}>/ {metrics.activityAnalysis.totalUsers}</Text>
            <View style={styles.statusBadge}>
              <Text>●</Text>
              <Text style={styles.statusBadgeText}>Healthy</Text>
            </View>
          </View>
        </View>

        <View style={styles.metricRow}>
          <Text style={styles.metricLabel}>Avg Engagement</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Text style={styles.metricValue}>
              {(metrics.activityAnalysis.avgEngagement * 100).toFixed(0)}%
            </Text>
            <Text style={styles.metricUnit}>score</Text>
          </View>
        </View>

        <View style={styles.metricRow}>
          <Text style={styles.metricLabel}>Content Retrieval Success</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Text style={styles.metricValue}>
              {(metrics.webContentRetrieval.successRate * 100).toFixed(1)}%
            </Text>
            <Text style={styles.metricUnit}>success</Text>
          </View>
        </View>
      </View>
    </>
  );

  const renderAPIs = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>API Breakdown</Text>
      {Object.entries(metrics.apiBreakdown).map(([apiName, data]) => (
        <View key={apiName} style={styles.apiCard}>
          <Text style={styles.apiName}>{apiName}</Text>
          <View style={styles.apiMetrics}>
            <View style={styles.apiMetricItem}>
              <Text style={styles.apiMetricLabel}>Requests</Text>
              <Text style={styles.apiMetricValue}>{formatNumber(data.requests)}</Text>
            </View>
            <View style={styles.apiMetricItem}>
              <Text style={styles.apiMetricLabel}>Tokens</Text>
              <Text style={styles.apiMetricValue}>
                {formatNumber(data.tokensUsed)}
              </Text>
            </View>
            <View style={styles.apiMetricItem}>
              <Text style={styles.apiMetricLabel}>Cost</Text>
              <Text style={styles.apiMetricValue}>${data.cost.toFixed(2)}</Text>
            </View>
            <View style={styles.apiMetricItem}>
              <Text style={styles.apiMetricLabel}>Latency</Text>
              <Text style={styles.apiMetricValue}>{data.avgLatency}ms</Text>
            </View>
          </View>
        </View>
      ))}
    </View>
  );

  const renderContent = () => (
    <>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Web Content Retrieval</Text>

        <View style={styles.metricRow}>
          <Text style={styles.metricLabel}>Total Retrievals</Text>
          <Text style={styles.metricValue}>
            {formatNumber(metrics.webContentRetrieval.totalRequests)}
          </Text>
        </View>

        <View style={styles.metricRow}>
          <Text style={styles.metricLabel}>Success Rate</Text>
          <Text style={styles.metricValue}>
            {(metrics.webContentRetrieval.successRate * 100).toFixed(1)}%
          </Text>
        </View>

        <View style={styles.metricRow}>
          <Text style={styles.metricLabel}>Avg Content Size</Text>
          <Text style={styles.metricValue}>
            {(metrics.webContentRetrieval.avgContentSize / 1024).toFixed(2)} KB
          </Text>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Live Link Distribution</Text>
        <View style={styles.chartContainer}>
          <View style={styles.chartBar}>
            <Text style={styles.chartLabel}>Product Links</Text>
            <View style={styles.chartBarContainer}>
              <View style={[styles.chartBarFill, { width: '35%' }]} />
            </View>
            <Text style={styles.chartBarPercent}>35%</Text>
          </View>

          <View style={styles.chartBar}>
            <Text style={styles.chartLabel}>Article Links</Text>
            <View style={styles.chartBarContainer}>
              <View style={[styles.chartBarFill, { width: '45%' }]} />
            </View>
            <Text style={styles.chartBarPercent}>45%</Text>
          </View>

          <View style={styles.chartBar}>
            <Text style={styles.chartLabel}>Event Links</Text>
            <View style={styles.chartBarContainer}>
              <View style={[styles.chartBarFill, { width: '20%' }]} />
            </View>
            <Text style={styles.chartBarPercent}>20%</Text>
          </View>
        </View>
      </View>
    </>
  );

  const renderActivity = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>User Activity Analysis</Text>

      <View style={styles.metricRow}>
        <Text style={styles.metricLabel}>Total Users</Text>
        <Text style={styles.metricValue}>
          {metrics.activityAnalysis.totalUsers}
        </Text>
      </View>

      <View style={styles.metricRow}>
        <Text style={styles.metricLabel}>Active Users (7d)</Text>
        <Text style={styles.metricValue}>
          {metrics.activityAnalysis.activeUsers}
        </Text>
      </View>

      <View style={styles.metricRow}>
        <Text style={styles.metricLabel}>Engagement Score</Text>
        <Text style={styles.metricValue}>
          {(metrics.activityAnalysis.avgEngagement * 100).toFixed(0)}/100
        </Text>
      </View>

      <View style={styles.chartContainer}>
        <Text style={styles.sectionTitle}>Activity Trend</Text>
        <View style={styles.chartBar}>
          <Text style={styles.chartLabel}>Mon</Text>
          <View style={styles.chartBarContainer}>
            <View style={[styles.chartBarFill, { width: '70%' }]} />
          </View>
        </View>
        <View style={styles.chartBar}>
          <Text style={styles.chartLabel}>Tue</Text>
          <View style={styles.chartBarContainer}>
            <View style={[styles.chartBarFill, { width: '82%' }]} />
          </View>
        </View>
        <View style={styles.chartBar}>
          <Text style={styles.chartLabel}>Wed</Text>
          <View style={styles.chartBarContainer}>
            <View style={[styles.chartBarFill, { width: '65%' }]} />
          </View>
        </View>
        <View style={styles.chartBar}>
          <Text style={styles.chartLabel}>Thu</Text>
          <View style={styles.chartBarContainer}>
            <View style={[styles.chartBarFill, { width: '88%' }]} />
          </View>
        </View>
        <View style={styles.chartBar}>
          <Text style={styles.chartLabel}>Fri</Text>
          <View style={styles.chartBarContainer}>
            <View style={[styles.chartBarFill, { width: '92%' }]} />
          </View>
        </View>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>LLM Dashboard</Text>
        <Text style={styles.headerSubtitle}>
          Comprehensive AI Integration Monitoring
        </Text>
        <TouchableOpacity style={styles.refreshButton} onPress={handleRefresh}>
          <Text style={styles.refreshButtonText}>
            {refreshing ? 'Refreshing...' : '🔄 Refresh'}
          </Text>
        </TouchableOpacity>
      </View>

      <View style={{ flexDirection: 'row', paddingHorizontal: 10, paddingVertical: 10 }}>
        {(['overview', 'apis', 'content', 'activity'] as const).map(tab => (
          <TouchableOpacity
            key={tab}
            onPress={() => setSelectedTab(tab)}
            style={{
              flex: 1,
              paddingVertical: 8,
              marginHorizontal: 5,
              borderBottomWidth: selectedTab === tab ? 2 : 1,
              borderBottomColor: selectedTab === tab ? '#007AFF' : '#e0e0e0',
              alignItems: 'center',
            }}
          >
            <Text
              style={{
                fontSize: 12,
                fontWeight: selectedTab === tab ? '600' : '400',
                color: selectedTab === tab ? '#007AFF' : '#666',
              }}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
      >
        {selectedTab === 'overview' && renderOverview()}
        {selectedTab === 'apis' && renderAPIs()}
        {selectedTab === 'content' && renderContent()}
        {selectedTab === 'activity' && renderActivity()}
      </ScrollView>
    </View>
  );
};

export default ExtendedLLMDashboard;
