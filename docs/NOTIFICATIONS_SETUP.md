# Expo Notifications Integration

This document explains how Expo push notifications are integrated into the Net Gains app.

## Overview

The app uses Expo's push notification service to send notifications for:

- Session invites
- Session updates (cancelled, modified, reminders)
- General app notifications

## Setup

### 1. Dependencies

The following packages are already installed:

- `expo-notifications` - Core notification functionality
- `expo-device` - Device detection for notifications

### 2. Database Schema

The `users` table includes an `expo_push_token` field to store each user's push token:

```sql
CREATE TABLE users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  phone TEXT UNIQUE,
  email TEXT,
  name TEXT,
  dupr_rating DECIMAL(3,2),
  expo_push_token TEXT, -- stored when user logs in
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### 3. App Configuration

The `app.json` file includes:

- `expo-notifications` plugin
- Project ID: `8fa76822-327a-42dd-97fb-f0e1c5f1399a`

## Implementation

### 1. Notification Service (`services/notificationService.ts`)

The service provides the following functionality:

#### Token Registration

```typescript
registerForPushNotifications(): Promise<string | null>
```

- Requests notification permissions
- Gets the Expo push token
- Handles Android notification channels

#### Token Management

```typescript
savePushToken(token: string): Promise<boolean>
```

- Saves the push token to the user's profile in the database

#### Notification Sending

```typescript
sendNotificationToUser(userId: string, title: string, body: string, data?: any): Promise<boolean>
```

- Sends notifications to specific users via Expo's push service

#### Specialized Notifications

```typescript
sendSessionInviteNotification(inviteeId: string, sessionName: string, inviterName: string, sessionId: string): Promise<boolean>
sendSessionUpdateNotification(userId: string, sessionName: string, updateType: 'cancelled' | 'modified' | 'reminder', sessionId: string): Promise<boolean>
```

### 2. Notification Hook (`hooks/useNotifications.ts`)

Manages notification lifecycle:

- Initializes notifications when the app starts
- Sets up notification listeners
- Handles cleanup on unmount

### 3. Integration with Session Service

When creating sessions with invites:

1. Session is created in the database
2. Invites are created in the `session_invites` table
3. Push notifications are sent to internal users (those with `invitee_id`)
4. The `notification_sent` field is updated to `true`

## Usage

### Automatic Initialization

Notifications are automatically initialized when the app starts via the `useNotifications` hook in `app/_layout.tsx`.

### Manual Testing

Use the `NotificationTest` component to test notification functionality:

```typescript
import { NotificationTest } from "@/components/NotificationTest"

// Add to any screen for testing
;<NotificationTest />
```

### Sending Notifications

#### Session Invites

Notifications are automatically sent when creating sessions with invites:

```typescript
// This happens automatically in sessionService.createPlannedSession()
await notificationService.sendSessionInviteNotification(
  inviteeId,
  sessionName,
  inviterName,
  sessionId
)
```

#### Manual Notifications

Send notifications to specific users:

```typescript
await notificationService.sendNotificationToUser(
  userId,
  "Title",
  "Message body",
  { customData: "value" }
)
```

## Notification Types

### 1. Session Invites

- **Type**: `session_invite`
- **Data**: `{ sessionId, inviterName, sessionName }`
- **Trigger**: When a user creates a session with invites

### 2. Session Updates

- **Type**: `session_update`
- **Data**: `{ sessionId, updateType, sessionName }`
- **Trigger**: When sessions are cancelled, modified, or reminders are sent

### 3. Test Notifications

- **Type**: `test`
- **Data**: `{ type: 'test' }`
- **Trigger**: Manual testing

## Notification Handling

### Foreground Notifications

Notifications received while the app is in the foreground are logged to the console.

### Background/Quit Notifications

When users tap on notifications:

- `session_invite` notifications should navigate to the sessions tab
- `session_update` notifications should navigate to the session details
- Custom navigation logic can be added in `setupNotificationListeners()`

## Permissions

The app requests notification permissions on first launch. Users can:

- Grant permissions: Notifications will be received
- Deny permissions: Users will see an alert explaining the importance of notifications
- Change permissions later in device settings

## Testing

### Development

1. Use a physical device (notifications don't work in simulators)
2. Ensure the device has internet connectivity
3. Use the `NotificationTest` component to verify functionality

### Production

1. Build the app with EAS Build
2. Test on production devices
3. Verify notifications are received correctly

## Troubleshooting

### Common Issues

1. **Notifications not received**

   - Check if permissions are granted
   - Verify the device has internet connectivity
   - Ensure the push token is saved in the database

2. **Token registration fails**

   - Check if the project ID is correct
   - Verify the device is physical (not simulator)
   - Check Expo's push service status

3. **Database errors**
   - Verify the user is authenticated
   - Check if the `users` table has the `expo_push_token` field
   - Ensure RLS policies allow token updates

### Debugging

- Check console logs for error messages
- Use the `NotificationTest` component to isolate issues
- Verify push tokens in the database

## Future Enhancements

1. **SMS/Email Integration**: Send notifications to external users via SMS or email
2. **Scheduled Notifications**: Send session reminders at specific times
3. **Rich Notifications**: Include images and action buttons
4. **Notification Preferences**: Allow users to customize notification types
5. **Analytics**: Track notification delivery and engagement rates
