/** @jsx jsx */
// Use the JSX pragma above to address the JSX compilation issue
import React, { useEffect } from 'react';
import { StyleSheet, FlatList, TouchableOpacity, Image, ActivityIndicator } from 'react-native';
import { Text, View } from '@/components/Themed';
import { useAIMatchmaking } from '../hooks/useAIMatchmaking';
import Card from '@/components/Card';
import Colors from '@/constants/Colors';
import DUPRRatingPill from '@/components/DUPRRatingPill';

interface PlayerRecommendation {
  playerId: string;
  playerName: string;
  duprRating?: number;
  singlesRating?: number;
  doublesRating?: number;
  playingStyle?: string;
  matchScore: number;
  reasons?: string[];
}

interface PlayerRecommendationsWidgetProps {
  onPlayerSelect: (player: PlayerRecommendation) => void;
  maxResults?: number;
}

export function PlayerRecommendationsWidget({ onPlayerSelect, maxResults = 5 }: PlayerRecommendationsWidgetProps) {
  const { 
    playerRecommendations, 
    loadingRecommendations,
    loadPlayerRecommendations
  } = useAIMatchmaking();
  
  // Get access to the colors based on theme
  const colors = Colors.light; // In production, this would use useColorScheme()
  
  useEffect(() => {
    loadPlayerRecommendations({ maxResults });
  }, [loadPlayerRecommendations, maxResults]);
  
  const renderPlayerItem = ({ item }: { item: PlayerRecommendation }) => {
    // Get initials for avatar placeholder
    const getInitials = (name: string): string => {
      return name
        .split(' ')
        .map((n: string) => n[0])
        .join('')
        .toUpperCase();
    };
    
    const initials = getInitials(item.playerName);
    
    return (
      <Card title="" style={styles.playerCard}>
        <View style={styles.playerContent}>
          <View style={styles.avatarContainer}>
            {/* Use placeholder with initials since we don't have actual photos */}
            <View style={styles.avatarPlaceholder}>
              <Text style={styles.avatarText}>{initials}</Text>
            </View>
          </View>
          
          <View style={styles.playerInfo}>
            <Text style={styles.playerName}>{item.playerName}</Text>
            <View style={styles.playerStatsRow}>
              {item.duprRating && (
                <DUPRRatingPill 
                  doublesRating={item.duprRating} 
                  size="small" 
                  showLabel={false} 
                />
              )}
              {item.playingStyle && (
                <Text style={styles.playerStyle}>{item.playingStyle}</Text>
              )}
            </View>
          </View>
          
          <View style={styles.matchScoreContainer}>
            <View style={styles.matchScore}>
              <Text style={styles.matchScoreText}>{item.matchScore}%</Text>
            </View>
          </View>
        </View>
        
        {item.reasons && item.reasons.length > 0 && (
          <View style={styles.reasonsContainer}>
            {item.reasons.map((reason, index) => (
              <View key={index} style={styles.reasonTag}>
                <Text style={styles.reasonText}>{reason}</Text>
              </View>
            ))}
          </View>
        )}
        
        <View style={styles.buttonsContainer}>
          <TouchableOpacity 
            style={styles.inviteButton}
            onPress={() => onPlayerSelect(item)}
          >
            <Text style={styles.inviteButtonText}>Invite to Play</Text>
          </TouchableOpacity>
        </View>
      </Card>
    );
  };
  
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Player Recommendations</Text>
        <TouchableOpacity 
          style={styles.refreshButton}
          onPress={() => loadPlayerRecommendations({ maxResults })}
        >
          <Text style={styles.refreshButtonText}>Refresh</Text>
        </TouchableOpacity>
      </View>
      
      {loadingRecommendations ? (
        <ActivityIndicator size="large" color={colors.tint} style={styles.loader} />
      ) : playerRecommendations.length > 0 ? (
        <FlatList
          data={playerRecommendations}
          renderItem={renderPlayerItem}
          keyExtractor={(item: PlayerRecommendation) => item.playerId}
          showsVerticalScrollIndicator={false}
        />
      ) : (
        <View style={styles.emptyState}>
          <Text style={styles.emptyStateText}>No player recommendations available</Text>
          <TouchableOpacity 
            style={styles.emptyStateButton}
            onPress={() => loadPlayerRecommendations({ maxResults })}
          >
            <Text style={styles.emptyStateButtonText}>Find Players</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

// Get the colors for styling
const colors = Colors.light;

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
    color: colors.text,
  },
  refreshButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#f0f0f0', // light background
  },
  refreshButtonText: {
    color: colors.tint,
    fontSize: 14,
    fontWeight: '500',
  },
  playerCard: {
    marginBottom: 12,
    padding: 16,
  },
  playerContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarContainer: {
    marginRight: 12,
  },
  avatarPlaceholder: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#f0f0f0', // light background
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.tint,
  },
  playerInfo: {
    flex: 1,
  },
  playerName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  playerStatsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  ratingPill: {
    marginRight: 8,
  },
  playerStyle: {
    fontSize: 13,
    color: '#777', // gray
  },
  matchScoreContainer: {
    marginLeft: 8,
  },
  matchScore: {
    backgroundColor: colors.tint,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  matchScoreText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 12,
  },
  reasonsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0', // light background
  },
  reasonTag: {
    backgroundColor: '#f0f0f0', // light background
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginRight: 8,
    marginBottom: 8,
  },
  reasonText: {
    fontSize: 12,
    color: '#777', // gray
  },
  buttonsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 12,
  },
  inviteButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: colors.tint,
    width: '80%',
    alignItems: 'center',
  },
  inviteButtonText: {
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
    color: '#777', // gray
    fontSize: 16,
    marginBottom: 16,
  },
  emptyStateButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: colors.tint,
  },
  emptyStateButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '500',
  },
});