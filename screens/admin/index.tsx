import React from 'react';
import { StyleSheet, ScrollView, View } from 'react-native';
import { Text } from '@/components/Themed';
import { useColorScheme } from '@/components/useColorScheme';
import { AIUsageDashboard } from '@/components/AIUsageDashboard';
import CustomHeader from '@/components/CustomHeader';
import { Ionicons } from '@expo/vector-icons';

/**
 * Admin Dashboard Screen
 * Provides administration tools and analytics for app administrators
 */
export default function AdminDashboardScreen() {
  const colors = useColorScheme();

  return (
    <View style={styles.container}>
      <CustomHeader title="Admin Dashboard" showBackButton={true} />
      
      <ScrollView style={styles.scrollContainer}>
        <View style={styles.welcomeContainer}>
          <Text style={[styles.welcomeText, { color: colors.text }]}>
            Admin Dashboard
          </Text>
          <Text style={[styles.subtitleText, { color: colors.text + '80' }]}>
            Monitor and manage app features
          </Text>
        </View>
        
        <View style={[styles.sectionContainer, { backgroundColor: colors.background }]}>
          <View style={styles.sectionHeader}>
            <Ionicons name="analytics-outline" size={24} color={colors.tint} />
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              AI Usage Analytics
            </Text>
          </View>
          <Text style={[styles.sectionDescription, { color: colors.text + '80' }]}>
            Monitor AI API usage, costs, and optimization metrics
          </Text>
          
          {/* AI Usage Dashboard Component */}
          <AIUsageDashboard />
        </View>
        
        <View style={[styles.sectionContainer, { backgroundColor: colors.background }]}>
          <View style={styles.sectionHeader}>
            <Ionicons name="people-outline" size={24} color={colors.tint} />
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              User Management
            </Text>
          </View>
          <Text style={[styles.sectionDescription, { color: colors.text + '80' }]}>
            Manage user accounts and permissions
          </Text>
          
          {/* Placeholder for future user management features */}
          <View style={[styles.placeholderContainer, { backgroundColor: colors.background }]}>
            <Ionicons name="construct-outline" size={24} color={colors.text + '60'} />
            <Text style={[styles.placeholderText, { color: colors.text + '60' }]}>
              User management features coming soon
            </Text>
          </View>
        </View>
        
        <View style={[styles.sectionContainer, { backgroundColor: colors.background }]}>
          <View style={styles.sectionHeader}>
            <Ionicons name="settings-outline" size={24} color={colors.tint} />
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              System Settings
            </Text>
          </View>
          <Text style={[styles.sectionDescription, { color: colors.text + '80' }]}>
            Configure app-wide settings and features
          </Text>
          
          {/* Placeholder for future settings features */}
          <View style={[styles.placeholderContainer, { backgroundColor: colors.background }]}>
            <Ionicons name="construct-outline" size={24} color={colors.text + '60'} />
            <Text style={[styles.placeholderText, { color: colors.text + '60' }]}>
              System settings features coming soon
            </Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContainer: {
    flex: 1,
    padding: 16,
  },
  welcomeContainer: {
    marginBottom: 24,
  },
  welcomeText: {
    fontSize: 28,
    fontWeight: 'bold',
  },
  subtitleText: {
    fontSize: 16,
    marginTop: 4,
  },
  sectionContainer: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginLeft: 8,
  },
  sectionDescription: {
    fontSize: 14,
    marginBottom: 16,
  },
  placeholderContainer: {
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
    height: 100,
  },
  placeholderText: {
    marginTop: 8,
    fontStyle: 'italic',
  },
});