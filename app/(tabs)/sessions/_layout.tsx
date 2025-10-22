import { Stack } from "expo-router"

export default function SessionsLayout() {
  // Note: Deep link listener and notification navigation are now set up at the app root level

  return (
    <Stack
      initialRouteName="index"
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name="index" />
      <Stack.Screen
        name="CreateSession"
        options={
          {
            // headerShown: false,
            // presentation: "modal",
          }
        }
      />
      <Stack.Screen
        name="PrePlaySession"
        options={
          {
            // headerShown: false,
            // presentation: "modal",
          }
        }
      />
      <Stack.Screen
        name="PostPlaySession"
        options={
          {
            // headerShown: false,
            // presentation: "modal",
          }
        }
      />
      <Stack.Screen
        name="SessionDetails"
        options={
          {
            // headerShown: false,
            // presentation: "modal",
          }
        }
      />
      <Stack.Screen
        name="InviteFriends"
        options={
          {
            // headerShown: false,
            // presentation: "modal",
          }
        }
      />

      <Stack.Screen
        name="thread/[threadId]"
        options={
          {
            // headerShown: true,
            // title: "Thread",
            // headerBackTitle: "Back",
          }
        }
      />
    </Stack>
  )
}
