import React from 'react';
import { StyleSheet, ScrollView } from 'react-native';
import { Stack } from 'expo-router';
import { Text, View } from '@/components/Themed';
import { PlayerRecommendationsWidget } from '@/components/PlayerRecommendationsWidget';
import { PlayerRecommendation } from '@/hooks/useAIMatchmaking';

export default function PlayerRecommendationsScreen() {
  const handlePlayerSelect = (player: PlayerRecommendation) => {
    console.log('Selected player:', player);
    // In production, this would navigate to a player profile or invite flow
  };

  return (
    <ScrollView style={styles.container}>
      <Stack.Screen options={{ title: 'AI Player Recommendations' }} />
      
      <View style={styles.header}>
        <Text style={styles.title}>Find Your Perfect Match</Text>
        <Text style={styles.subtitle}>
          Our AI analyzes your playing style, skill level, and availability to find
          the best players for you to connect with.
        </Text>
      </View>
      
      <PlayerRecommendationsWidget 
        onPlayerSelect={handlePlayerSelect}
        maxResults={5}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  header: {
    marginBottom: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    lineHeight: 22,
  },
});