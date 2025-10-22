import React, { useState } from 'react';
import { StyleSheet, ScrollView, TouchableOpacity, View } from 'react-native';
import { Text } from '@/components/Themed';
import { BarChart, LineChart, PieChart } from 'react-native-chart-kit';
import { useAIOptimizer } from '@/hooks/useAIOptimizer';
import { Dimensions } from 'react-native';
import Colors from '@/constants/Colors';

const screenWidth = Dimensions.get("window").width;

export function AIUsageDashboard() {
  const { usageStats, clearCache } = useAIOptimizer();
  const [activeTab, setActiveTab] = useState('overview');
  
  // Process data for charts
  const requestCounts = Object.entries(usageStats.requestCount || {});
  const totalRequests = requestCounts.reduce((sum, [_, count]) => sum + count, 0);
  
  const requestData = {
    labels: requestCounts.map(([type]) => type.substring(0, 8)),
    datasets: [{
      data: requestCounts.map(([_, count]) => count)
    }]
  };
  
  const costData = {
    labels: ["Recommendations", "Challenges", "Scheduling", "Analysis"],
    datasets: [{
      data: [
        usageStats.monthlyCostEstimate * 0.4,
        usageStats.monthlyCostEstimate * 0.2,
        usageStats.monthlyCostEstimate * 0.3,
        usageStats.monthlyCostEstimate * 0.1,
      ]
    }]
  };
  
  const cacheData = {
    labels: ["Cache Hits", "API Calls"],
    data: [
      usageStats.cacheHitRatio * 100, 
      (1 - usageStats.cacheHitRatio) * 100
    ],
    colors: ['#4CAF50', '#F44336']
  };
  
  const savingsAmount = usageStats.monthlyCostEstimate * usageStats.cacheHitRatio;
  const potentialSavings = savingsAmount * 0.5; // Additional potential savings
  
  const handleClearCache = () => {
    clearCache();
  };
  
  const renderOverviewTab = () => (
    <View style={styles.tabContent}>
      <View style={styles.statsRow}>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>${usageStats.monthlyCostEstimate.toFixed(2)}</Text>
          <Text style={styles.statLabel}>Monthly Estimate</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{totalRequests}</Text>
          <Text style={styles.statLabel}>Total Requests</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{(usageStats.cacheHitRatio * 100).toFixed(0)}%</Text>
          <Text style={styles.statLabel}>Cache Efficiency</Text>
        </View>
      </View>
      
      <View style={styles.chartContainer}>
        <Text style={styles.chartTitle}>Request Distribution</Text>
        {requestCounts.length > 0 ? (
          <BarChart
            data={requestData}
            width={screenWidth - 40}
            height={220}
            chartConfig={{
              backgroundColor: Colors.light.tint,
              backgroundGradientFrom: Colors.light.tint,
              backgroundGradientTo: '#4a6ede',
              decimalPlaces: 0,
              color: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
            }}
            style={styles.chart}
          />
        ) : (
          <Text style={styles.noDataText}>No request data available</Text>
        )}
      </View>
      
      <View style={styles.savingsCard}>
        <Text style={styles.savingsTitle}>Cost Savings</Text>
        <Text style={styles.savingsValue}>
          ${savingsAmount.toFixed(2)} saved this month
        </Text>
        <Text style={styles.savingsPotential}>
          Potential additional savings: ${potentialSavings.toFixed(2)}
        </Text>
      </View>
      
      <TouchableOpacity 
        style={styles.clearCacheButton} 
        onPress={handleClearCache}
      >
        <Text style={styles.clearCacheButtonText}>Clear AI Cache</Text>
      </TouchableOpacity>
    </View>
  );
  
  const renderCostsTab = () => (
    <View style={styles.tabContent}>
      <View style={styles.chartContainer}>
        <Text style={styles.chartTitle}>Cost Breakdown</Text>
        <PieChart
          data={[
            { name: 'Recommendations', cost: usageStats.monthlyCostEstimate * 0.4, color: '#FF6384' },
            { name: 'Challenges', cost: usageStats.monthlyCostEstimate * 0.2, color: '#36A2EB' },
            { name: 'Scheduling', cost: usageStats.monthlyCostEstimate * 0.3, color: '#FFCE56' },
            { name: 'Analysis', cost: usageStats.monthlyCostEstimate * 0.1, color: '#4BC0C0' },
          ]}
          width={screenWidth - 40}
          height={220}
          chartConfig={{
            color: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
          }}
          accessor="cost"
          backgroundColor="transparent"
          paddingLeft="15"
          absolute
        />
      </View>
      
      <View style={styles.costTable}>
        <View style={styles.costTableHeader}>
          <Text style={styles.costTableHeaderText}>Service</Text>
          <Text style={styles.costTableHeaderText}>Requests</Text>
          <Text style={styles.costTableHeaderText}>Cost</Text>
        </View>
        {requestCounts.map(([type, count]) => {
          const costPerRequest = type === 'playerRecommendations' ? 0.02 : 
            type === 'skillAnalysis' ? 0.05 : 
            type === 'challengeGeneration' ? 0.01 : 0.03;
          const totalCost = count * costPerRequest;
          
          return (
            <View style={styles.costTableRow} key={type}>
              <Text style={styles.costTableCell}>{type}</Text>
              <Text style={styles.costTableCell}>{count}</Text>
              <Text style={styles.costTableCell}>${totalCost.toFixed(2)}</Text>
            </View>
          );
        })}
      </View>
    </View>
  );
  
  const renderCachingTab = () => (
    <View style={styles.tabContent}>
      <View style={styles.chartContainer}>
        <Text style={styles.chartTitle}>Cache Performance</Text>
        <PieChart
          data={[
            { name: 'Cache Hits', percentage: usageStats.cacheHitRatio * 100, color: '#4CAF50' },
            { name: 'API Calls', percentage: (1 - usageStats.cacheHitRatio) * 100, color: '#F44336' },
          ]}
          width={screenWidth - 40}
          height={220}
          chartConfig={{
            color: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
          }}
          accessor="percentage"
          backgroundColor="transparent"
          paddingLeft="15"
          absolute
        />
      </View>
      
      <View style={styles.cacheStats}>
        <Text style={styles.cacheStatsTitle}>Cache Statistics</Text>
        <View style={styles.cacheStatRow}>
          <Text style={styles.cacheStatLabel}>Cache Hit Ratio:</Text>
          <Text style={styles.cacheStatValue}>{(usageStats.cacheHitRatio * 100).toFixed(1)}%</Text>
        </View>
        <View style={styles.cacheStatRow}>
          <Text style={styles.cacheStatLabel}>Requests Saved:</Text>
          <Text style={styles.cacheStatValue}>{Math.round(totalRequests * usageStats.cacheHitRatio)}</Text>
        </View>
        <View style={styles.cacheStatRow}>
          <Text style={styles.cacheStatLabel}>Cost Saved:</Text>
          <Text style={styles.cacheStatValue}>${savingsAmount.toFixed(2)}</Text>
        </View>
      </View>
      
      <TouchableOpacity 
        style={styles.clearCacheButton} 
        onPress={handleClearCache}
      >
        <Text style={styles.clearCacheButtonText}>Clear AI Cache</Text>
      </TouchableOpacity>
    </View>
  );
  
  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>AI Usage Dashboard</Text>
      <Text style={styles.subtitle}>Monitor and optimize AI service usage</Text>
      
      <View style={styles.tabBar}>
        <TouchableOpacity 
          style={[styles.tabButton, activeTab === 'overview' && styles.activeTabButton]} 
          onPress={() => setActiveTab('overview')}
        >
          <Text style={[styles.tabButtonText, activeTab === 'overview' && styles.activeTabButtonText]}>
            Overview
          </Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.tabButton, activeTab === 'costs' && styles.activeTabButton]}
          onPress={() => setActiveTab('costs')}
        >
          <Text style={[styles.tabButtonText, activeTab === 'costs' && styles.activeTabButtonText]}>
            Costs
          </Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.tabButton, activeTab === 'caching' && styles.activeTabButton]}
          onPress={() => setActiveTab('caching')}
        >
          <Text style={[styles.tabButtonText, activeTab === 'caching' && styles.activeTabButtonText]}>
            Caching
          </Text>
        </TouchableOpacity>
      </View>
      
      {activeTab === 'overview' && renderOverviewTab()}
      {activeTab === 'costs' && renderCostsTab()}
      {activeTab === 'caching' && renderCachingTab()}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 24,
  },
  tabBar: {
    flexDirection: 'row',
    marginBottom: 24,
    borderRadius: 8,
    backgroundColor: '#f0f0f0',
    padding: 4,
  },
  tabButton: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 6,
  },
  activeTabButton: {
    backgroundColor: Colors.light.tint,
  },
  tabButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#666',
  },
  activeTabButtonText: {
    color: '#fff',
  },
  tabContent: {
    flex: 1,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  statCard: {
    flex: 1,
    padding: 16,
    backgroundColor: '#fff',
    borderRadius: 8,
    marginHorizontal: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.light.tint,
    marginBottom: 8,
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
  },
  chartContainer: {
    marginBottom: 24,
    padding: 16,
    backgroundColor: '#fff',
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  chartTitle: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 12,
  },
  chart: {
    borderRadius: 8,
  },
  noDataText: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    marginVertical: 20,
  },
  savingsCard: {
    padding: 16,
    backgroundColor: '#e8f5e9',
    borderRadius: 8,
    marginBottom: 24,
  },
  savingsTitle: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 8,
    color: '#2e7d32',
  },
  savingsValue: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#2e7d32',
  },
  savingsPotential: {
    fontSize: 14,
    color: '#2e7d32',
  },
  clearCacheButton: {
    backgroundColor: '#f5f5f5',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 24,
  },
  clearCacheButtonText: {
    color: '#d32f2f',
    fontWeight: '500',
  },
  costTable: {
    backgroundColor: '#fff',
    borderRadius: 8,
    overflow: 'hidden',
    marginBottom: 24,
  },
  costTableHeader: {
    flexDirection: 'row',
    backgroundColor: '#f5f5f5',
    padding: 12,
  },
  costTableHeaderText: {
    flex: 1,
    fontWeight: '500',
    fontSize: 14,
  },
  costTableRow: {
    flexDirection: 'row',
    padding: 12,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  costTableCell: {
    flex: 1,
    fontSize: 14,
  },
  cacheStats: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
    marginBottom: 24,
  },
  cacheStatsTitle: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 12,
  },
  cacheStatRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  cacheStatLabel: {
    fontSize: 14,
    color: '#666',
  },
  cacheStatValue: {
    fontSize: 14,
    fontWeight: '500',
  },
});