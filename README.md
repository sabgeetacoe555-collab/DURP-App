# Net Gains - Pickleball Session Tracker

A React Native app built with Expo for tracking pickleball sessions, including pre-play planning and post-play reflection.

## Features

- 🏓 **Session Planning**: Pre-play session setup with focus areas and goals
- 📊 **Session Tracking**: Record session details, mood, and body readiness
- 🔄 **Post-Play Reflection**: Track completion, confidence, and learning outcomes
- 👤 **User Authentication**: Secure login and signup with Supabase
- 📱 **Cross-Platform**: Works on iOS and Android

## Prerequisites

- [Node.js](https://nodejs.org/) (v18 or higher)
- [npm](https://www.npmjs.com/) or [yarn](https://yarnpkg.com/)
- [Expo CLI](https://docs.expo.dev/get-started/installation/)
- [Expo Go](https://expo.dev/client) app on your mobile device (for testing)

## Quick Start

### 1. Clone the repository

```bash
git clone <repository-url>
cd net-gains
```

### 2. Install dependencies

```bash
npm install
```

### 3. Set up environment variables

Create a `.env` file in the root directory:

```bash
EXPO_PUBLIC_SUPABASE_URL=your_supabase_url
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
EXPO_PUBLIC_OPENAI_API_KEY=your_openai_key
```

### 4. Start the development server

```bash
npx expo start
```

### 5. Run on device/simulator

- **iOS Simulator**: Press `i` in the terminal or scan the QR code with your camera
- **Android Emulator**: Press `a` in the terminal
- **Physical Device**: Scan the QR code with the Expo Go app

## Development

### Project Structure

```
net-gains/
├── app/                    # Expo Router screens
├── components/             # Reusable UI components
├── screens/               # Session-specific screens
├── services/              # API and business logic
├── hooks/                 # Custom React hooks
├── types/                 # TypeScript type definitions
└── supabase/              # Database migrations and config
```

### Key Commands

```bash
# Start development server
npx expo start

# Start with tunnel (contact dev team for setup)
npx expo start --tunnel

# Build for production
eas build --profile production --platform all

# Build preview version
eas build --profile preview --platform ios
```

### Database Setup

The app uses Supabase for authentication and data storage. To set up the database:

1. Create a Supabase project
2. Link your local project: `npx supabase link --project-ref YOUR_PROJECT_REF`
3. Push migrations: `npx supabase db push`
4. Push the local config: `npx supabase config push`

## Testing

### Local Testing

- Use Expo Go app to test on physical devices
- Use iOS Simulator or Android Emulator for development

### Remote Testing

- Contact the development team for remote testing setup
- Testers need Expo Go app installed

## Deployment

### EAS Build

```bash
# Install EAS CLI
npm install -g eas-cli

# Login to Expo
eas login

# Build for iOS
eas build --profile preview --platform ios

# Build for Android
eas build --profile preview --platform android
```

### App Store Deployment

1. Update bundle identifier in `app.json`
2. Build production version: `eas build --profile production`
3. Submit to stores: `eas submit --profile production`

## Environment Variables

| Variable                        | Description               | Required |
| ------------------------------- | ------------------------- | -------- |
| `EXPO_PUBLIC_SUPABASE_URL`      | Your Supabase project URL | Yes      |
| `EXPO_PUBLIC_SUPABASE_ANON_KEY` | Your Supabase anon key    | Yes      |
| `EXPO_PUBLIC_OPENAI_API_KEY`    | Your OpenAI API key       | Yes      |

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is proprietary software. All rights reserved.

## Support

For support or questions, please contact the development team.
