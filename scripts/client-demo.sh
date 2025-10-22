#!/bin/bash

# Demo script to simulate user activity for client presentation
# Usage: ./client-demo.sh

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${BLUE}=== NetGains User Activity Analytics Demo ===${NC}"
echo -e "${YELLOW}This script will simulate user activity and show analytics.${NC}"

# Function to simulate API call with a delay
simulate_activity() {
  local user_id=$1
  local action_type=$2
  local screen=$3
  local details=$4
  local session_id=$5
  
  echo -e "${GREEN}User $user_id performed $action_type on $screen${NC}"
  # In a real demo, this would make an actual API call to record the activity
  sleep 1
}

# Clear the screen
clear

echo -e "\n${BLUE}=== Simulating User Journey for Demo ===${NC}"

# Demo user ID
USER_ID="client-demo-user"
SESSION_ID=$(date +%s)

# Simulate app open and initial screen view
echo -e "\n${YELLOW}[Step 1]${NC} User opens the app"
simulate_activity $USER_ID "app_open" "SplashScreen" '{"source":"direct_open"}' $SESSION_ID

# Simulate navigation to home screen
echo -e "\n${YELLOW}[Step 2]${NC} User navigates to home screen"
simulate_activity $USER_ID "screen_view" "HomeScreen" '{"referrer":"SplashScreen"}' $SESSION_ID

# Simulate button click
echo -e "\n${YELLOW}[Step 3]${NC} User clicks on 'Create Session' button"
simulate_activity $USER_ID "button_click" "HomeScreen" '{"button_id":"create_session"}' $SESSION_ID

# Simulate form interaction
echo -e "\n${YELLOW}[Step 4]${NC} User fills out session creation form"
simulate_activity $USER_ID "form_interact" "CreateSessionScreen" '{"field":"session_name","value_length":12}' $SESSION_ID

# Simulate form submission
echo -e "\n${YELLOW}[Step 5]${NC} User submits the session creation form"
simulate_activity $USER_ID "form_submit" "CreateSessionScreen" '{"success":true,"fields_filled":5}' $SESSION_ID

# Simulate screen view
echo -e "\n${YELLOW}[Step 6]${NC} User views the new session details"
simulate_activity $USER_ID "screen_view" "SessionDetailsScreen" '{"session_id":"new-session-123","referrer":"CreateSessionScreen"}' $SESSION_ID

# Simulate invite friends
echo -e "\n${YELLOW}[Step 7]${NC} User invites friends to the session"
simulate_activity $USER_ID "button_click" "SessionDetailsScreen" '{"button_id":"invite_friends"}' $SESSION_ID
simulate_activity $USER_ID "share_action" "InviteFriendsModal" '{"method":"in_app","count":3}' $SESSION_ID

# Simulate viewing analytics
echo -e "\n${YELLOW}[Step 8]${NC} User navigates to analytics screen"
simulate_activity $USER_ID "tab_select" "MainNavigation" '{"tab":"analytics"}' $SESSION_ID
simulate_activity $USER_ID "screen_view" "AnalyticsScreen" '{"referrer":"SessionDetailsScreen"}' $SESSION_ID

# End of demo
echo -e "\n${BLUE}=== Demo User Journey Complete ===${NC}"
echo -e "${YELLOW}Now let's look at the Analytics Dashboard to see these activities.${NC}\n"

# In a real demo, you would now navigate to the Analytics Dashboard in the app
echo -e "${GREEN}Opening Analytics Dashboard...${NC}"
echo -e "${YELLOW}(At this point, open the app and navigate to the Analytics tab)${NC}\n"

# Instructions for client demonstration
echo -e "${BLUE}=== Demo Notes for Presenter ===${NC}"
echo "1. Point out how each of the user's actions is now visible in the analytics"
echo "2. Show the activity summary statistics at the top of the screen"
echo "3. Change the time filter to 'Day' to focus on just today's activity"
echo "4. Point out the chart showing screen visit distribution"
echo "5. Explain how this data helps understand user behavior"
echo "6. Demonstrate filtering by activity type (e.g., just button clicks)"
echo -e "\n${YELLOW}Remember to emphasize how this data can inform product decisions and improve user experience.${NC}\n"