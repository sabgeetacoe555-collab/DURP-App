# Session Creation with Invites

This document explains how session creation with invites works in the Net Gains app.

## Overview

When a user creates a session with invites, the system needs to:

1. Create a new session record in the `sessions` table
2. Create invite records in the `session_invites` table for each invited person

## Database Schema

### Sessions Table

The `sessions` table has been updated to support both planned and completed sessions:

```sql
-- New fields for planned sessions
name TEXT,
start_time TIME,
end_time TIME,
is_public BOOLEAN DEFAULT false,
min_dupr_rating DECIMAL(3,2),
max_dupr_rating DECIMAL(3,2),
max_players INTEGER,
allow_friends BOOLEAN DEFAULT true,
creator_id UUID REFERENCES users(id),
session_status TEXT CHECK (session_status IN ('planned', 'active', 'completed', 'cancelled')) DEFAULT 'planned'
```

### Session Invites Table

The `session_invites` table stores all session invitations:

```sql
CREATE TABLE session_invites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES sessions(id) ON DELETE CASCADE,
  inviter_id UUID REFERENCES users(id) ON DELETE CASCADE,
  invitee_id UUID REFERENCES users(id) ON DELETE CASCADE, -- null for external invites
  invitee_phone TEXT,
  invitee_email TEXT,
  invitee_name TEXT,
  status TEXT CHECK (status IN ('pending', 'accepted', 'declined', 'maybe')) DEFAULT 'pending',
  notification_sent BOOLEAN DEFAULT false,
  sms_sent BOOLEAN DEFAULT false, -- for external invites
  invited_at TIMESTAMP DEFAULT NOW(),
  responded_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

## Implementation

### 1. Service Layer (`services/sessionService.ts`)

The `createPlannedSession` method handles creating sessions with invites:

```typescript
createPlannedSession: async (sessionData: CreateSessionData) => {
  // 1. Authenticate user
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // 2. Create session
  const { data: session } = await supabase
    .from("sessions")
    .insert({
      user_id: user.id,
      name: sessionData.name,
      session_datetime: sessionData.session_datetime, // UTC timestamp
      end_datetime: sessionData.end_datetime, // UTC timestamp
      location: sessionData.location,
      is_public: sessionData.is_public,
      // ... other fields
      session_status: "planned",
    })
    .select()
    .single();

  // 3. Create invites if provided
  if (sessionData.invites && sessionData.invites.length > 0) {
    const invites = sessionData.invites.map((invite) => ({
      session_id: session.id,
      inviter_id: user.id,
      invitee_id: invite.invitee_id,
      invitee_phone: invite.invitee_phone,
      invitee_email: invite.invitee_email,
      invitee_name: invite.invitee_name,
      status: "pending",
      notification_sent: false,
      sms_sent: false,
    }));

    await supabase.from("session_invites").insert(invites);
  }

  return session;
};
```

### 2. UI Layer (`app/CreateSession.tsx`)

The CreateSession component:

- Collects session details (title, date, time, location, etc.)
- Allows users to select friends to invite
- Calls the service to create the session with invites

### 3. Types (`types/database.ts`)

TypeScript interfaces ensure type safety:

```typescript
export interface CreateSessionData {
  name: string;
  date: string;
  start_time: string;
  end_time: string;
  location: string;
  is_public: boolean;
  min_dupr_rating?: number;
  max_dupr_rating?: number;
  max_players?: number;
  allow_friends: boolean;
  invites?: CreateSessionInviteData[];
}

export interface CreateSessionInviteData {
  invitee_id?: string;
  invitee_phone?: string;
  invitee_email?: string;
  invitee_name?: string;
}
```

## Invite Types

### Internal Invites

- `invitee_id` is set to a user ID
- User must be registered in the app
- Can receive in-app notifications

### External Invites

- `invitee_id` is null
- Requires `invitee_phone` or `invitee_email`
- Requires `invitee_name`
- Can receive SMS/email notifications

## Row Level Security (RLS)

The database has RLS policies to ensure users can only:

- View sessions they created or were invited to
- Create invites for sessions they own
- Update invite status for invites they received

## Error Handling

- If session creation fails, the entire operation is rolled back
- If invite creation fails, the session is still created (invites can be retried)
- Authentication errors are handled gracefully with user-friendly messages

## Future Enhancements

1. **Real-time notifications**: Use Supabase real-time features to notify users of new invites
2. **SMS/Email integration**: Send actual SMS/email notifications for external invites
3. **Invite management**: Allow users to resend, cancel, or modify invites
4. **Bulk operations**: Support importing contacts or selecting multiple users at once
