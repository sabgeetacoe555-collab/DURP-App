# Session Service Documentation

## Overview

The session service provides functionality to save, retrieve, update, and delete pickleball sessions in the database. It's designed to work with the Supabase backend and includes proper authentication and error handling.

## Features

- **Create Sessions**: Save pre-play session data to the database
- **Retrieve Sessions**: Get all sessions for the authenticated user
- **Update Sessions**: Modify existing session data
- **Delete Sessions**: Remove sessions from the database
- **Authentication**: Automatically handles user authentication
- **Error Handling**: Provides user-friendly error messages

## Database Schema

The sessions table includes the following fields:

- `id`: Unique identifier (UUID)
- `user_id`: Reference to authenticated user
- `date`: Session date (YYYY-MM-DD format)
- `time`: Session time (HH:MM:SS format)
- `location`: Optional location string
- `session_type`: Type of session (open play, tournament, drills, etc.)
- `focus_type`: Array of focus areas (serve, return, dinking, etc.)
- `mood`: Numeric rating 1-10 (converted from UI rating)
- `body_readiness`: Numeric rating 1-10 (converted from UI rating)
- `completed`: Boolean indicating if session is completed
- `confidence`: Optional confidence rating 1-10
- `intensity`: Optional intensity rating 1-10
- `goal_achievement`: Optional text describing goal achievement
- `reflection_tags`: Array of reflection tags
- `created_at`: Timestamp when record was created
- `updated_at`: Timestamp when record was last updated

## Usage

### Saving a Pre-Play Session

```typescript
import { sessionService } from "@/services/sessionService"
import { createSessionData } from "@/types/database"

const handleSaveSession = async () => {
  try {
    const sessionData = createSessionData(
      new Date(), // date
      new Date(), // time
      "Local Court", // location
      "open play", // session type
      ["serve", "dinking"], // focus areas
      "good", // mood rating
      "great" // body readiness
    )

    const savedSession = await sessionService.createSession(sessionData)
    console.log("Session saved:", savedSession)
  } catch (error) {
    console.error("Error saving session:", error)
  }
}
```

### Retrieving Sessions

```typescript
const getSessions = async () => {
  try {
    const sessions = await sessionService.getSessions()
    console.log("User sessions:", sessions)
  } catch (error) {
    console.error("Error retrieving sessions:", error)
  }
}
```

### Updating a Session

```typescript
const updateSession = async (sessionId: string) => {
  try {
    const updatedSession = await sessionService.updateSession(sessionId, {
      completed: true,
      goal_achievement: "Improved serve accuracy",
    })
    console.log("Session updated:", updatedSession)
  } catch (error) {
    console.error("Error updating session:", error)
  }
}
```

### Deleting a Session

```typescript
const deleteSession = async (sessionId: string) => {
  try {
    await sessionService.deleteSession(sessionId)
    console.log("Session deleted successfully")
  } catch (error) {
    console.error("Error deleting session:", error)
  }
}
```

## Data Conversion

The service automatically converts UI-friendly data types to database-compatible formats:

- **Rating Conversion**: "bad" → 3, "ok" → 6, "good" → 9
- **Body Readiness**: "tired" → 3, "average" → 6, "great" → 9
- **Date Formatting**: Date object → "YYYY-MM-DD" string
- **Time Formatting**: Date object → "HH:MM:SS" string

## Error Handling

The service includes comprehensive error handling:

- **Authentication Errors**: Prompts user to sign in
- **Validation Errors**: Shows specific field requirements
- **Database Errors**: Displays user-friendly error messages
- **Network Errors**: Handles connectivity issues

## Security

- **Row Level Security**: Users can only access their own sessions
- **Authentication Required**: All operations require valid user session
- **Input Validation**: Data is validated before database operations

## Integration with Pre-Play Session Screen

The Pre-Play Session screen (`screens/sessions/PrePlaySession/index.tsx`) has been updated to use this service. The `handleSave` function now:

1. Validates required fields (session type, focus areas)
2. Creates session data using `createSessionData` helper
3. Saves to database using `sessionService.createSession`
4. Shows success/error messages to user
5. Navigates back on successful save

## Environment Setup

Ensure your Supabase environment variables are configured:

```env
EXPO_PUBLIC_SUPABASE_URL=your_supabase_url
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## Testing

See `examples/sessionExample.ts` for usage examples and testing patterns.
