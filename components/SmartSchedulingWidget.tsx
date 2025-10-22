import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, FlatList, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useAIMatchmaking } from '../hooks/useAIMatchmaking';
import { useWeatherConditions } from '../hooks/useWeatherConditions';
import { Card } from './Card';
import { Ionicons } from '@expo/vector-icons';
import Colors from '../constants/Colors';
import { format } from 'date-fns';

export function SmartSchedulingWidget({ onSessionSelect, courtIds }) {
  const { 
    scheduleRecommendations, 
    loadingSchedules,
    loadScheduleRecommendations 
  } = useAIMatchmaking();
  
  const { courtWeather, isCourtPlayable } = useWeatherConditions(courtIds);
  const [showWeather, setShowWeather] = useState(false);
  
  useEffect(() => {
    // Load schedule recommendations on mount
    loadScheduleRecommendations({
      earliestDate: new Date().toISOString(),
      latestDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      locationIds: courtIds
    });
  }, [loadScheduleRecommendations, courtIds]);
  
  const renderWeatherIcon = (recommendation) => {
    if (!showWeather || !recommendation.weather) return null;
    
    const { condition, temperature, suitable } = recommendation.weather;
    
    let iconName = 'sunny';
    let iconColor = '#FFD700';
    
    if (condition.toLowerCase().includes('rain')) {
      iconName = 'rainy';
      iconColor = '#4682B4';
    } else if (condition.toLowerCase().includes('cloud')) {
      iconName = 'cloudy';
      iconColor = '#708090';
    }
    
    return (
      <View style={styles.weatherContainer}>
        <Ionicons name={iconName} size={16} color={iconColor} />
        <Text style={styles.weatherText}>{Math.round(temperature)}°F</Text>
        {suitable ? (
          <View style={styles.suitableTag}>
            <Text style={styles.suitableText}>Good</Text>
          </View>
        ) : (
          <View style={[styles.suitableTag, styles.unsuitableTag]}>
            <Text style={styles.suitableText}>Poor</Text>
          </View>
        )}
      </View>
    );
  };
  
  const renderItem = ({ item }) => {
    const startTime = new Date(item.startTime);
    const endTime = new Date(item.endTime);
    
    const formattedDate = format(startTime, 'EEE, MMM d');
    const formattedStartTime = format(startTime, 'h:mm a');
    const formattedEndTime = format(endTime, 'h:mm a');
    
    return (
      <Card style={styles.card}>
        <View style={styles.dateTimeContainer}>
          <View style={styles.dateContainer}>
            <Text style={styles.dayText}>{format(startTime, 'd')}</Text>
            <Text style={styles.monthText}>{format(startTime, 'MMM')}</Text>
          </View>
          
          <View style={styles.sessionInfoContainer}>
            <Text style={styles.sessionTime}>
              {formattedStartTime} - {formattedEndTime}
            </Text>
            <Text style={styles.venueName}>{item.location.name}</Text>
            <Text style={styles.venueAddress} numberOfLines={1}>
              {item.location.indoor ? 'Indoor' : 'Outdoor'} • {item.playerAvailability.length} players
            </Text>
          </View>
          
          {renderWeatherIcon(item)}
        </View>
        
        <View style={styles.scoreContainer}>
          <View style={styles.scoreBar}>
            <View 
              style={[
                styles.scoreBarFill, 
                { width: `${item.overallScore}%` }
              ]} 
            />
          </View>
          <Text style={styles.scoreText}>{item.overallScore}% Match</Text>
        </View>
        
        <View style={styles.buttonsContainer}>
          <TouchableOpacity 
            style={styles.detailsButton}
            onPress={() => {}}
          >
            <Text style={styles.detailsButtonText}>Details</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.scheduleButton}
            onPress={() => onSessionSelect(item)}
          >
            <Text style={styles.scheduleButtonText}>Schedule</Text>
          </TouchableOpacity>
        </View>
      </Card>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Smart Scheduling</Text>
        
        <TouchableOpacity 
          style={styles.weatherToggle}
          onPress={() => setShowWeather(prev => !prev)}
        >
          <Ionicons 
            name={showWeather ? 'partly-sunny' : 'partly-sunny-outline'} 
            size={20} 
            color={Colors.primary} 
          />
          <Text style={styles.weatherToggleText}>
            {showWeather ? 'Hide Weather' : 'Show Weather'}
          </Text>
        </TouchableOpacity>
      </View>
      
      {loadingSchedules ? (
        <ActivityIndicator size="large" color={Colors.primary} style={styles.loader} />
      ) : scheduleRecommendations.length > 0 ? (
        <FlatList
          data={scheduleRecommendations}
          renderItem={renderItem}
          keyExtractor={(item, index) => `schedule-${index}`}
          showsVerticalScrollIndicator={false}
        />
      ) : (
        <View style={styles.emptyState}>
          <Ionicons name="calendar-outline" size={48} color={Colors.gray} />
          <Text style={styles.emptyStateText}>
            No schedule recommendations available
          </Text>
          <TouchableOpacity 
            style={styles.refreshButton}
            onPress={() => loadScheduleRecommendations({
              locationIds: courtIds
            })}
          >
            <Text style={styles.refreshButtonText}>Refresh</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.text,
  },
  weatherToggle: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  weatherToggleText: {
    marginLeft: 4,
    color: Colors.primary,
    fontSize: 14,
  },
  card: {
    marginBottom: 12,
    padding: 16,
  },
  dateTimeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dateContainer: {
    width: 50,
    height: 50,
    backgroundColor: Colors.lightBackground,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dayText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.primary,
  },
  monthText: {
    fontSize: 12,
    color: Colors.gray,
  },
  sessionInfoContainer: {
    marginLeft: 12,
    flex: 1,
  },
  sessionTime: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
  },
  venueName: {
    fontSize: 14,
    color: Colors.text,
    marginTop: 2,
  },
  venueAddress: {
    fontSize: 12,
    color: Colors.gray,
    marginTop: 2,
  },
  weatherContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.lightBackground,
    padding: 6,
    borderRadius: 12,
  },
  weatherText: {
    marginLeft: 4,
    fontSize: 12,
    color: Colors.text,
  },
  suitableTag: {
    marginLeft: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
    backgroundColor: '#4CAF50',
  },
  unsuitableTag: {
    backgroundColor: '#F44336',
  },
  suitableText: {
    color: 'white',
    fontSize: 10,
    fontWeight: '600',
  },
  scoreContainer: {
    marginTop: 12,
  },
  scoreBar: {
    height: 6,
    backgroundColor: Colors.lightBackground,
    borderRadius: 3,
    marginBottom: 4,
  },
  scoreBarFill: {
    height: '100%',
    backgroundColor: Colors.primary,
    borderRadius: 3,
  },
  scoreText: {
    fontSize: 12,
    color: Colors.gray,
    textAlign: 'right',
  },
  buttonsContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 12,
  },
  detailsButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: Colors.lightBackground,
  },
  detailsButtonText: {
    color: Colors.text,
    fontSize: 14,
    fontWeight: '500',
  },
  scheduleButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: Colors.primary,
    marginLeft: 8,
  },
  scheduleButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '500',
  },
  loader: {
    marginTop: 40,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyStateText: {
    color: Colors.gray,
    fontSize: 16,
    marginTop: 12,
    textAlign: 'center',
  },
  refreshButton: {
    marginTop: 16,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: Colors.primary,
  },
  refreshButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '500',
  },
});