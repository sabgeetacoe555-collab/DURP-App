# Messaging System Documentation

## Overview

The NetGains app now includes a comprehensive messaging system that supports:

- **Direct Messages**: One-on-one conversations between users
- **Group Messages**: Multi-user conversations for groups
- **Session Messages**: Conversations in the context of pickleball sessions
- **Message Reactions**: Emoji reactions on messages
- **Real-time Updates**: Live message delivery using Supabase real-time subscriptions

## Database Schema

### Tables

1. **conversations**: Groups of messages

   - `id`: Unique identifier
   - `conversation_type`: 'direct', 'group', or 'session'
   - `name`: Display name for group/session conversations
   - `created_at`, `updated_at`: Timestamps

2. **conversation_participants**: Users in conversations

   - `conversation_id`: References conversations table
   - `user_id`: References auth.users table
   - `joined_at`, `last_read_at`: Timestamps
   - `is_admin`: Boolean for group admins

3. **messages**: Individual messages

   - `conversation_id`: References conversations table
   - `sender_id`: References auth.users table
   - `content`: Message text
   - `message_type`: 'text', 'image', 'location', or 'system'
   - `metadata`: JSONB for additional data
   - `is_edited`, `edited_at`: Edit tracking
   - `created_at`, `updated_at`: Timestamps

4. **message_reactions**: Emoji reactions on messages
   - `message_id`: References messages table
   - `user_id`: References auth.users table
   - `reaction_type`: Emoji or reaction identifier
   - `created_at`: Timestamp

### Database Functions

- `get_or_create_direct_conversation(user1_id, user2_id)`: Creates or retrieves direct conversation
- `create_group_conversation(group_name, participant_ids[])`: Creates group conversation
- `create_session_conversation(session_id, session_name)`: Creates session conversation
- `mark_conversation_read(conversation_id)`: Marks conversation as read for current user

## Frontend Components

### Services

**messagingService.ts**: Core messaging functionality

```typescript
// Get all conversations
const conversations = await messagingService.getConversations()

// Get specific conversation with messages
const { conversation, messages } = await messagingService.getConversation(
  conversationId
)

// Send a message
await messagingService.sendMessage({
  conversation_id: conversationId,
  content: "Hello!",
  message_type: "text",
})

// Create direct conversation
const conversationId = await messagingService.getOrCreateDirectConversation(
  otherUserId
)

// Create group conversation
const conversationId = await messagingService.createGroupConversation({
  name: "Pickleball Group",
  participant_ids: [user1Id, user2Id, user3Id],
})
```

### React Hook

**useMessaging.ts**: React hook for managing messaging state

```typescript
const {
  conversations,
  currentConversation,
  messages,
  loading,
  error,
  sendMessage,
  startDirectConversation,
  createGroupConversation,
  // ... more methods
} = useMessaging()
```

### UI Components

1. **ConversationList.tsx**: Displays list of conversations with unread counts
2. **ChatScreen.tsx**: Individual conversation view with message input
3. **MessagesScreen.tsx**: Main messaging tab that combines list and chat

## Usage Examples

### Starting a Direct Conversation

```typescript
import { useMessaging } from "../hooks/useMessaging"

const { startDirectConversation } = useMessaging()

const handleStartChat = async (otherUserId: string) => {
  try {
    const conversationId = await startDirectConversation(otherUserId)
    // Navigate to chat or update UI
  } catch (error) {
    console.error("Failed to start conversation:", error)
  }
}
```

### Creating a Group Conversation

```typescript
import { useMessaging } from "../hooks/useMessaging"

const { createGroupConversation } = useMessaging()

const handleCreateGroup = async (name: string, participantIds: string[]) => {
  try {
    const conversationId = await createGroupConversation(name, participantIds)
    // Navigate to group chat
  } catch (error) {
    console.error("Failed to create group:", error)
  }
}
```

### Sending Messages

```typescript
import { useMessaging } from "../hooks/useMessaging"

const { sendMessage } = useMessaging()

const handleSendMessage = async (conversationId: string, content: string) => {
  try {
    await sendMessage(conversationId, content)
    // Message will be added to UI automatically via real-time updates
  } catch (error) {
    console.error("Failed to send message:", error)
  }
}
```

### Adding Reactions

```typescript
import { useMessaging } from "../hooks/useMessaging"

const { addReaction, removeReaction } = useMessaging()

const handleReaction = async (messageId: string, reactionType: string) => {
  try {
    await addReaction(messageId, reactionType)
  } catch (error) {
    console.error("Failed to add reaction:", error)
  }
}
```

## Real-time Features

The messaging system uses Supabase real-time subscriptions to provide:

- **Live message delivery**: New messages appear instantly
- **Typing indicators**: (Future feature)
- **Online status**: (Future feature)
- **Read receipts**: Automatic marking of messages as read

## Security

### Row Level Security (RLS)

All messaging tables have RLS policies that ensure:

- Users can only see conversations they participate in
- Users can only send messages to conversations they're part of
- Users can only edit/delete their own messages
- Users can only add reactions to messages in their conversations

### Data Privacy

- Direct conversations are private between participants
- Group conversations are visible to all participants
- Session conversations are visible to session participants
- Message content is encrypted in transit

## Integration with Existing Features

### Groups Integration

The messaging system integrates with the existing groups feature:

- Group conversations can be created from existing groups
- Group members are automatically added to conversations
- Group admins can manage conversation participants

### Sessions Integration

Session conversations are automatically created when sessions are created:

- Session participants can chat about the upcoming game
- Location sharing for meetup coordination
- Session-specific announcements and updates

## Future Enhancements

1. **File/Image Sharing**: Support for sending images and files
2. **Voice Messages**: Audio message support
3. **Video Calls**: Integration with video calling
4. **Message Search**: Search through conversation history
5. **Message Threading**: Reply to specific messages
6. **Push Notifications**: Notify users of new messages
7. **Message Encryption**: End-to-end encryption for sensitive conversations

## Testing

Run the messaging system tests:

```bash
# Basic connectivity test
node scripts/test-messaging-simple.js

# Full functionality test (requires service role key)
node scripts/test-messaging.js
```

## Troubleshooting

### Common Issues

1. **Infinite recursion in RLS policies**: Fixed in migration 20250822000001
2. **Missing conversation participants**: Ensure users are added to conversations before sending messages
3. **Real-time not working**: Check Supabase real-time configuration
4. **Permission denied**: Verify RLS policies and user authentication

### Debug Tips

1. Check browser console for JavaScript errors
2. Verify Supabase connection in network tab
3. Test RLS policies with direct database queries
4. Check real-time subscription status

## API Reference

For detailed API documentation, see the TypeScript types in:

- `services/messagingService.ts`
- `hooks/useMessaging.ts`
- `types/database.ts`
