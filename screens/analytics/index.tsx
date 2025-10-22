// screens/analytics/index.tsx
import React, { useEffect, useState } from 'react';
import { View, StyleSheet, ScrollView, ActivityIndicator, Text } from 'react-native';
import { useAuth } from '../../hooks/useAuth';
import { supabase } from '../../lib/supabase';
import { Card } from '../../components/Card';
import { BarChart, LineChart, PieChart } from 'react-native-chart-kit';
import { Dimensions } from 'react-native';
import { CustomHeader } from '../../components/CustomHeader';
import { useNavigation } from '@react-navigation/native';

const screenWidth = Dimensions.get('window').width;

// Common chart configuration
const chartConfig = {
  backgroundGradientFrom: '#fff',
  backgroundGradientTo: '#fff',
  decimalPlaces: 0,
  color: (opacity = 1) => `rgba(69, 95, 161, ${opacity})`,
  labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
  style: {
    borderRadius: 16,
  },
};

export default function AnalyticsScreen() {
  const { user } = useAuth();
  const navigation = useNavigation();
  const [loading, setLoading] = useState(true);
  const [insights, setInsights] = useState<any>(null);
  const [dateRange, setDateRange] = useState('week'); // 'day', 'week', 'month'
  const [viewType, setViewType] = useState('activity'); // 'activity', 'screens', 'sessions'

  useEffect(() => {
    if (user) {
      fetchInsights();
    }
  }, [user, dateRange, viewType]);

  const fetchInsights = async () => {
    setLoading(true);
    
    try {
      // Calculate date range
      const endDate = new Date();
      let startDate = new Date();
      
      if (dateRange === 'day') {
        startDate.setHours(0, 0, 0, 0);
      } else if (dateRange === 'week') {
        startDate.setDate(startDate.getDate() - 7);
      } else if (dateRange === 'month') {
        startDate.setMonth(startDate.getMonth() - 1);
      }
      
      // Get insights from our edge function
      const { data, error } = await supabase.functions.invoke('dupr-api', {
        body: {
          action: 'getActivityInsights',
          user_id: user?.id,
          date_from: startDate.toISOString(),
          date_to: endDate.toISOString(),
          limit: 1000 // Get a good amount of data
        }
      });
      
      if (error) {
        console.error('Error fetching insights:', error);
        setInsights(null);
      } else {
        setInsights(data);
        console.log('Insights fetched:', data);
      }
    } catch (error) {
      console.error('Error in fetchInsights:', error);
      setInsights(null);
    } finally {
      setLoading(false);
    }
  };
  
  const prepareChartData = () => {
    if (!insights) return null;

    if (viewType === 'activity') {
      // Activity type chart
      const activities = insights.activities_by_type;
      const labels = Object.keys(activities).slice(0, 6); // Limit to top 6 
      
      return {
        labels,
        datasets: [
          {
            data: labels.map((key) => activities[key]),
            color: (opacity = 1) => `rgba(69, 95, 161, ${opacity})`,
          },
        ],
      };
    } else if (viewType === 'screens') {
      // Screens chart
      const screens = insights.activities_by_screen;
      const labels = Object.keys(screens).slice(0, 6); // Limit to top 6
      
      return {
        labels,
        datasets: [
          {
            data: labels.map((key) => screens[key]),
            color: (opacity = 1) => `rgba(69, 95, 161, ${opacity})`,
          },
        ],
      };
    }
    
    // Sessions data (using raw data to calculate)
    const rawData = insights.raw_data || [];
    const sessions = {};
    
    rawData.forEach(activity => {
      if (activity.session_id) {
        if (!sessions[activity.session_id]) {
          sessions[activity.session_id] = 0;
        }
        sessions[activity.session_id]++;
      }
    });
    
    // Top 6 sessions by activity count
    const sessionEntries = Object.entries(sessions)
      .sort((a, b) => (b[1] as number) - (a[1] as number))
      .slice(0, 6);
    
    return {
      labels: sessionEntries.map(([id]) => id.slice(-4)), // Last 4 chars of session ID
      datasets: [
        {
          data: sessionEntries.map(([_, count]) => count),
          color: (opacity = 1) => `rgba(69, 95, 161, ${opacity})`,
        },
      ],
    };
  };
  
  const chartData = prepareChartData();

  return (
    <View style={styles.container}>
      <CustomHeader
        title="Activity Analytics"
        showBackButton
        onBackPress={() => navigation.goBack()}
      />
      
      <View style={styles.filterContainer}>
        <View style={styles.filterGroup}>
          <Text style={styles.filterLabel}>Time Range:</Text>
          <View style={styles.buttonGroup}>
            <Text 
              style={[styles.filterButton, dateRange === 'day' && styles.activeFilter]}
              onPress={() => setDateRange('day')}
            >
              Day
            </Text>
            <Text 
              style={[styles.filterButton, dateRange === 'week' && styles.activeFilter]}
              onPress={() => setDateRange('week')}
            >
              Week
            </Text>
            <Text 
              style={[styles.filterButton, dateRange === 'month' && styles.activeFilter]}
              onPress={() => setDateRange('month')}
            >
              Month
            </Text>
          </View>
        </View>
        
        <View style={styles.filterGroup}>
          <Text style={styles.filterLabel}>View:</Text>
          <View style={styles.buttonGroup}>
            <Text 
              style={[styles.filterButton, viewType === 'activity' && styles.activeFilter]}
              onPress={() => setViewType('activity')}
            >
              Activities
            </Text>
            <Text 
              style={[styles.filterButton, viewType === 'screens' && styles.activeFilter]}
              onPress={() => setViewType('screens')}
            >
              Screens
            </Text>
            <Text 
              style={[styles.filterButton, viewType === 'sessions' && styles.activeFilter]}
              onPress={() => setViewType('sessions')}
            >
              Sessions
            </Text>
          </View>
        </View>
      </View>
      
      <ScrollView style={styles.content}>
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#455FA1" />
            <Text style={styles.loadingText}>Loading analytics data...</Text>
          </View>
        ) : !insights ? (
          <View style={styles.noDataContainer}>
            <Text style={styles.noDataText}>No activity data available</Text>
            <Text style={styles.noDataSubtext}>
              Activity data will appear here as you use the app
            </Text>
          </View>
        ) : (
          <>
            <Card style={styles.summaryCard}>
              <Text style={styles.summaryTitle}>Activity Summary</Text>
              <View style={styles.summaryStats}>
                <View style={styles.statItem}>
                  <Text style={styles.statValue}>{insights.total_activities || 0}</Text>
                  <Text style={styles.statLabel}>Total Activities</Text>
                </View>
                
                <View style={styles.statItem}>
                  <Text style={styles.statValue}>
                    {Object.keys(insights.activities_by_type || {}).length}
                  </Text>
                  <Text style={styles.statLabel}>Activity Types</Text>
                </View>
                
                <View style={styles.statItem}>
                  <Text style={styles.statValue}>
                    {Object.keys(insights.activities_by_screen || {}).length}
                  </Text>
                  <Text style={styles.statLabel}>Screens Visited</Text>
                </View>
              </View>
            </Card>
            
            {chartData && chartData.labels.length > 0 ? (
              <Card style={styles.chartCard}>
                <Text style={styles.chartTitle}>
                  {viewType === 'activity' 
                    ? 'Top Activities' 
                    : viewType === 'screens'
                      ? 'Most Visited Screens'
                      : 'Session Activity'}
                </Text>
                <BarChart
                  data={chartData}
                  width={screenWidth - 40}
                  height={220}
                  chartConfig={chartConfig}
                  verticalLabelRotation={30}
                  fromZero={true}
                  style={styles.chart}
                />
              </Card>
            ) : (
              <Card style={styles.chartCard}>
                <Text style={styles.noDataText}>Not enough data for charts</Text>
              </Card>
            )}
            
            {insights.average_duration > 0 && (
              <Card style={styles.insightCard}>
                <Text style={styles.insightTitle}>Session Insights</Text>
                <View style={styles.insightItem}>
                  <Text style={styles.insightLabel}>Average Screen Time:</Text>
                  <Text style={styles.insightValue}>
                    {Math.round(insights.average_duration / 1000)} seconds
                  </Text>
                </View>
              </Card>
            )}
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  filterContainer: {
    backgroundColor: '#fff',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  filterGroup: {
    marginBottom: 12,
  },
  filterLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
    color: '#333',
  },
  buttonGroup: {
    flexDirection: 'row',
  },
  filterButton: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    marginRight: 8,
    borderRadius: 16,
    backgroundColor: '#f0f0f0',
    fontSize: 14,
    color: '#444',
  },
  activeFilter: {
    backgroundColor: '#455FA1',
    color: '#fff',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
  noDataContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 30,
  },
  noDataText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#666',
    textAlign: 'center',
  },
  noDataSubtext: {
    fontSize: 14,
    color: '#888',
    textAlign: 'center',
    marginTop: 10,
  },
  summaryCard: {
    padding: 16,
    marginBottom: 16,
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 16,
  },
  summaryStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700',
    color: '#455FA1',
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  chartCard: {
    padding: 16,
    marginBottom: 16,
    alignItems: 'center',
  },
  chartTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 16,
    alignSelf: 'flex-start',
  },
  chart: {
    marginVertical: 8,
    borderRadius: 16,
  },
  insightCard: {
    padding: 16,
    marginBottom: 16,
  },
  insightTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  insightItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  insightLabel: {
    fontSize: 14,
    color: '#666',
  },
  insightValue: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
  },
});