# DUPR API Integration Setup Guide

## Overview

This guide will help you set up DUPR API integration for your Net Gains app, allowing users to connect their DUPR accounts and access their pickleball data.

## Prerequisites

1. DUPR API access (you'll need to register as a developer)
2. Supabase project with Edge Functions enabled
3. Basic understanding of API authentication

## Step 1: Get DUPR API Credentials

### 1.1 Register for DUPR API Access

1. Visit the DUPR API documentation: https://uat.mydupr.com/api/swagger-ui/index.html
2. Contact DUPR to register as a developer and get API credentials
3. You'll receive:
   - Client ID
   - Client Key (API Key)
   - Client Secret
   - Client Name

### 1.2 Understanding DUPR Authentication

DUPR uses OAuth 2.0 with client credentials flow for application-level access. For user-specific data, you'll need to implement user authentication.

## Step 2: Environment Variables Setup

### 2.1 Add DUPR Credentials to .env

Add the following variables to your `.env` file:

```bash
# DUPR API Configuration
DUPR_BASE_URL=https://uat.mydupr.com/api
DUPR_VERSION=v3.0
DUPR_CLIENT_NAME=your_client_name
DUPR_CLIENT_ID=your_client_id
DUPR_CLIENT_KEY=your_client_key
DUPR_CLIENT_SECRET=your_client_secret
```

### 2.2 Deploy Environment Variables to Supabase

```bash
# Deploy secrets to Supabase
supabase secrets set --env-file .env

# Verify secrets are set
supabase secrets list
```

## Step 3: Database Setup

### 3.1 DUPR Tokens Table

The migration `20250716000000_create_dupr_tokens_table.sql` creates a table to store authentication tokens.

### 3.2 User DUPR Connection Table (Optional)

You may want to create a table to store user DUPR connections:

```sql
-- Create table for user DUPR connections
CREATE TABLE user_dupr_connections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  dupr_user_id TEXT,
  dupr_email TEXT,
  access_token TEXT,
  refresh_token TEXT,
  expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE user_dupr_connections ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view own connections" ON user_dupr_connections
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own connections" ON user_dupr_connections
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own connections" ON user_dupr_connections
  FOR UPDATE USING (auth.uid() = user_id);
```

## Step 4: Edge Function Deployment

### 4.1 Deploy the DUPR API Edge Function

```bash
# Deploy the edge function
supabase functions deploy dupr-api

# Check function status
supabase functions list
```

### 4.2 Test the Edge Function

```bash
# Test the function directly
curl -X POST https://your-project.supabase.co/functions/v1/dupr-api \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{"action": "authenticate"}'
```

## Step 5: Frontend Integration

### 5.1 Test Connection

Use the updated `DuprTest` component to test the connection:

1. Navigate to the Widgets tab in your app
2. Tap "Test Connection" to verify basic connectivity
3. Tap "Refresh Token" to test authentication
4. Check the test results for detailed feedback

### 5.2 User Connection Flow

The current implementation supports:

- **Client Credentials Flow**: For application-level API access
- **User Invitation**: Send invitations to users via email
- **Event Fetching**: Get DUPR events
- **Rating Lookup**: Get user provisional ratings

## Step 6: User Authentication (Future Enhancement)

For full user integration, you'll need to implement:

### 6.1 OAuth Flow for Users

```typescript
// Example user authentication flow
const connectUserToDupr = async (userEmail: string, userPassword: string) => {
  // 1. Authenticate user with DUPR
  const authResult = await duprApi.authenticateUser({
    email: userEmail,
    password: userPassword,
  })

  // 2. Store user connection in database
  if (authResult.success) {
    await supabase.from("user_dupr_connections").upsert({
      user_id: currentUser.id,
      dupr_user_id: authResult.data.userId,
      dupr_email: userEmail,
      access_token: authResult.data.accessToken,
      refresh_token: authResult.data.refreshToken,
      expires_at: authResult.data.expiresAt,
    })
  }
}
```

### 6.2 User-Specific Data Access

```typescript
// Get user's personal data
const getUserData = async (userId: string) => {
  const connection = await supabase
    .from("user_dupr_connections")
    .select("*")
    .eq("user_id", userId)
    .single()

  if (connection.data) {
    return await duprApi.getUserData(connection.data.dupr_user_id)
  }
}
```

## Step 7: Testing and Debugging

### 7.1 Check Environment Variables

```bash
# Run the environment check script
node scripts/check-dupr-env.js
```

### 7.2 Monitor Edge Function Logs

```bash
# View real-time logs
supabase functions logs dupr-api --follow

# View recent logs
supabase functions logs dupr-api
```

### 7.3 Common Issues and Solutions

#### Issue: "Missing required DUPR credentials"

**Solution**: Ensure all environment variables are set and deployed to Supabase

#### Issue: "Authentication failed"

**Solution**: Verify your DUPR credentials are correct and active

#### Issue: "Token expired"

**Solution**: The system should automatically refresh tokens, but you can manually trigger a refresh

#### Issue: "Permission denied"

**Solution**: Check that your DUPR API access includes the required endpoints

## Step 8: Production Considerations

### 8.1 Security

- Never expose DUPR credentials in client-side code
- Use environment variables for all sensitive data
- Implement proper token refresh mechanisms
- Add rate limiting to prevent abuse

### 8.2 Error Handling

- Implement comprehensive error handling
- Log errors for debugging
- Provide user-friendly error messages
- Add retry mechanisms for transient failures

### 8.3 Monitoring

- Set up alerts for authentication failures
- Monitor API usage and rate limits
- Track user connection success rates
- Monitor token refresh patterns

## Next Steps

1. **Get DUPR API Credentials**: Contact DUPR to register as a developer
2. **Set Environment Variables**: Add the credentials to your `.env` file
3. **Deploy to Supabase**: Update secrets and redeploy the edge function
4. **Test Integration**: Use the DuprTest component to verify everything works
5. **Implement User Flow**: Add user authentication and connection management
6. **Add Features**: Implement specific features like session creation with DUPR data

## Support

- DUPR API Documentation: https://uat.mydupr.com/api/swagger-ui/index.html
- Supabase Edge Functions: https://supabase.com/docs/guides/functions
- Net Gains Development Team
