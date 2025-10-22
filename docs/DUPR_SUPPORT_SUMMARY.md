# DUPR API Integration Support Request

## Project Information

- **Application Name**: Net Gains
- **Client ID**: 5208543024
- **Client Key**: test-ck-424f795f-f6d1-4220-f824-ae7ba1ae62d4
- **Client Secret**: test-cs-7a5bd1125c7b4b7cfc1aeb009d3c9e57
- **Environment**: UAT (uat.mydupr.com)

## Current Issue

We are receiving a consistent `403 Forbidden` error with the message `"Authentication error. Please provide a valid API key."` for all authentication attempts.

## Authentication Methods Tested

### 1. DUPR RaaS Client Credentials Flow

- **Endpoint**: `POST /token`
- **Headers**:
  - `Content-Type: application/json`
  - `x-authorization: base64(clientKey:clientSecret)`
- **Body**: `{}`
- **Result**: 403 Forbidden - "Authentication error. Please provide a valid API key."

### 2. User Authentication Flow

- **Endpoint**: `POST /auth/v3.0/login`
- **Headers**: `Content-Type: application/json`
- **Body**: `{"email": "chris.chidgey@toptal.com", "password": "Test@123!"}`
- **Result**: 403 Forbidden - "Authentication error. Please provide a valid API key."

### 3. Additional Header Combinations Tested

- `x-api-key: test-ck-424f795f-f6d1-4220-f824-ae7ba1ae62d4`
- `x-client-id: 5208543024`
- `Authorization: Bearer test-ck-424f795f-f6d1-4220-f824-ae7ba1ae62d4`
- Various combinations of the above headers

## Test Account Information

- **Email**: chris.chidgey@toptal.com
- **Password**: Test@123!
- **Status**: Account created but email verification not received (maybe UAT environment issue?)

## Questions for DUPR Support

1. **API Key Format**: Are we using the correct API key format? Should we be using a different header name or format?

2. **UAT Environment**: Are the provided UAT credentials activated and ready for use? Do they require any additional setup?

3. **Authentication Flow**: Should we be using user authentication (`/auth/v3.0/login`) or client credentials (`/token`) for our integration?

4. **Email Verification**: The test account email verification is not being sent. Is this a known UAT environment issue?

5. **Required Headers**: Are there any additional required headers we should be including in our requests?

6. **Documentation**: Is there additional documentation specific to the UAT environment that we should reference?

## Technical Details

- **Base URL**: https://uat.mydupr.com/api
- **API Version**: v3.0
- **Integration Type**: React Native mobile app with Supabase Edge Functions backend

## Expected Behavior

We expect to be able to:

1. Authenticate using either client credentials or user credentials
2. Receive a valid access token
3. Make API calls to endpoints like `/events`, `/users/rating`, etc.

## Current Status

All authentication attempts result in 403 Forbidden errors, preventing us from proceeding with the integration.

## Contact Information

- **Developer**: Chris Chidgey
- **Email**: chris.chidgey@toptal.com
- **Project**: Net Gains Pickleball App

Thank you for your assistance!
