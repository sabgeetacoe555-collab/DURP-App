# User Activity Tracking and Analytics

This document describes the implementation of the user activity tracking and analytics feature in the NetGains application.

## Overview

The user activity tracking feature allows the application to collect data on how users interact with the app, which screens they visit, how long they stay on each screen, and what actions they take. This data is then analyzed to provide insights into user behavior, which can be used to improve the user experience.

## Implementation

### 1. Backend API (DUPR API Edge Function)

The DUPR API Edge Function has been extended to include endpoints for tracking user activity and generating insights:

#### New Endpoints

- **`trackActivity`**: Records a single user activity event
- **`getActivityInsights`**: Retrieves analytics and insights based on user activity data

#### Data Model

Each activity record includes:
- `user_id`: The ID of the user performing the action
- `action_type`: The type of action (e.g., "screen_view", "button_click")
- `screen`: The screen where the action occurred
- `timestamp`: When the action occurred
- `details`: Additional context about the action (JSON)
- `session_id`: Identifier for the user's session
- `duration_ms`: Duration of the action (for timed events like screen views)

### 2. Frontend Hook (useActivityTracking)

A custom React hook called `useActivityTracking` has been created to simplify tracking user activity from any component:

```typescript
// Example usage:
const { trackScreenView, trackInteraction } = useActivityTracking();

// When a screen loads:
useEffect(() => {
  trackScreenView('HomeScreen', { referrer: 'DeepLink' });
  
  return () => {
    // Track when user leaves the screen
    trackScreenExit('HomeScreen');
  };
}, []);

// When a user interacts with an element:
const handleButtonPress = () => {
  trackInteraction('button_click', { 
    screen: 'HomeScreen', 
    details: { buttonId: 'join_session' } 
  });
  
  // Perform the actual action...
};
```

The hook provides these main functions:
- `trackScreenView`: Records when a user enters a screen
- `trackScreenExit`: Records when a user leaves a screen (with duration)
- `trackInteraction`: Records user interactions with UI elements
- `trackActivity`: General-purpose tracking for custom events

### 3. Analytics Dashboard

The Analytics screen displays insights derived from the collected data:

- Activity summary statistics
- Charts showing top activities, most visited screens, and session activity
- Time-based filtering (day, week, month)
- Different view types (activities, screens, sessions)

### 4. Offline Support and Batch Sync

The tracking system includes offline support:
- Activity events are stored locally if the network is unavailable
- Pending events are synced when the app comes online
- Only the most recent 100 events are kept in local storage to prevent storage issues

## Database Setup

A new table `user_activities` has been created with the following structure:

```sql
CREATE TABLE IF NOT EXISTS user_activities (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL,
  action_type TEXT NOT NULL,
  screen TEXT,
  timestamp TIMESTAMPTZ NOT NULL DEFAULT now(),
  details JSONB,
  session_id TEXT,
  duration_ms INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes for faster queries
CREATE INDEX idx_user_activities_user_id ON user_activities(user_id);
CREATE INDEX idx_user_activities_action_type ON user_activities(action_type);
CREATE INDEX idx_user_activities_timestamp ON user_activities(timestamp);
```

## Security and Privacy

- Row-Level Security (RLS) policies ensure users can only access their own activity data
- The `service_role` can access all data for administrative and analytics purposes
- Sensitive information should not be included in the `details` field

## Usage Guidelines

### Standard Action Types

Use these standard action types for consistency:

- `screen_view`: User visited a screen
- `screen_exit`: User left a screen
- `button_click`: User clicked a button
- `form_submit`: User submitted a form
- `toggle_change`: User toggled a setting
- `item_select`: User selected an item from a list
- `session_start`: Beginning of a user session
- `session_end`: End of a user session
- `error`: An error occurred

### Best Practices

1. Always include the current screen name
2. Use consistent action types across the app
3. Include only relevant information in the details field
4. Don't track personally identifiable information (PII)
5. Consider the performance impact of tracking frequency

## Future Enhancements

Potential future improvements:

1. Real-time analytics with WebSockets
2. Custom event tracking for specific features
3. Heatmaps for user interaction visualization 
4. A/B testing integration
5. Export functionality for data analysis
6. User journey mapping
7. Advanced machine learning insights