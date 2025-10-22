// app/(tabs)/analytics.tsx
import { Stack } from 'expo-router';
import AnalyticsScreen from '../../screens/analytics';

export default function AnalyticsTab() {
  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <AnalyticsScreen />
    </>
  );
}