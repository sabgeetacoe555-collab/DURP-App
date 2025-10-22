import { Stack } from "expo-router"

export default function GroupsLayout() {
  return (
    <Stack
      initialRouteName="index"
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name="index" />
      <Stack.Screen
        name="[groupId]"
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="thread/[threadId]"
        options={{
          headerShown: false,
        }}
      />
    </Stack>
  )
}
