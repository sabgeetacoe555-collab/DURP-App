/**
 * AI Matchmaking Demo Script
 * 
 * Run this script to test the AI matchmaking service.
 */

import { aiMatchmakingService, PlayerRecommendation } from '../services/aiMatchmakingService';

// Mock user ID
const userId = 'test-user-123';

// Demo function to show player recommendations
async function demoPlayerRecommendations() {
  console.log('--- AI Player Recommendations ---\n');
  
  try {
    const params = {
      playerId: userId,
      matchType: 'doubles' as 'doubles',
      skillRange: 0.5,
      maxResults: 5,
      includeReasons: true
    };
    
    console.log('Requesting recommendations with params:', params);
    const recommendations = await aiMatchmakingService.getPlayerRecommendations(params);
    
    console.log(`\nReceived ${recommendations.length} player recommendations:\n`);
    recommendations.forEach((rec: PlayerRecommendation, index: number) => {
      console.log(`Player #${index + 1}: ${rec.playerName}`);
      console.log(`  DUPR Rating: ${rec.duprRating || 'Not available'}`);
      console.log(`  Match Score: ${rec.matchScore}%`);
      console.log('  Why this match:');
      rec.reasons?.forEach((reason: string) => {
        console.log(`    - ${reason}`);
      });
      console.log('');
    });
  } catch (error) {
    console.error('Error in demo:', error);
  }
}

// Demo function to show schedule recommendations
async function demoScheduleRecommendations() {
  console.log('--- AI Schedule Recommendations ---\n');
  
  try {
    // Using the getMockRecommendations method since getMatchTimeRecommendations isn't implemented yet
    console.log(`This feature would show optimal play times and schedule recommendations`);
    console.log(`based on weather conditions, player availability, and court usage data.`);
    console.log('');
    
    // Simulated data
    const schedules = [
      { day: 'Saturday', time: '9:00 AM', score: 95 },
      { day: 'Wednesday', time: '6:00 PM', score: 88 },
      { day: 'Sunday', time: '10:00 AM', score: 82 }
    ];
    
    console.log(`Example schedule recommendations:\n`);
    schedules.forEach((slot: any, index: number) => {
      console.log(`Option #${index + 1}: ${slot.day} at ${slot.time}`);
      console.log(`  Confidence Score: ${slot.score}%`);
      console.log('');
    });
  } catch (error) {
    console.error('Error in schedule demo:', error);
  }
}

// Demo function to show skill improvement suggestions
async function demoSkillImprovements() {
  console.log('--- AI Skill Improvement Suggestions ---\n');
  
  try {
    // Using simulated data since getSkillImprovementSuggestions isn't implemented yet
    console.log(`This feature would analyze player performance and suggest`);
    console.log(`focused skill improvements based on playing history and patterns.`);
    console.log('');
    
    // Simulated data
    const skills = [
      { skill: 'Third Shot Drop', priority: 'High', description: 'Work on consistency and placement' },
      { skill: 'Serve Accuracy', priority: 'Medium', description: 'Focus on deep serves to the backhand' },
      { skill: 'Dinking', priority: 'Medium', description: 'Practice soft game control at the kitchen line' }
    ];
    
    console.log(`Example skill improvement suggestions:\n`);
    skills.forEach((skill: any, index: number) => {
      console.log(`Suggestion #${index + 1}: ${skill.skill}`);
      console.log(`  Priority: ${skill.priority}`);
      console.log(`  Description: ${skill.description}`);
      console.log('');
    });
  } catch (error) {
    console.error('Error in skill demo:', error);
  }
}

// Run all demos
async function runAllDemos() {
  console.log('Running AI Matchmaking Service Demos...\n');
  
  await demoPlayerRecommendations();
  console.log('----------------------------------------\n');
  
  await demoScheduleRecommendations();
  console.log('----------------------------------------\n');
  
  await demoSkillImprovements();
  
  console.log('\nAll demos completed!');
}

// Execute the demo
runAllDemos().catch(console.error);