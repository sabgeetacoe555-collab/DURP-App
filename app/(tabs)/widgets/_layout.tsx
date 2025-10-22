import { Stack } from "expo-router"

export default function WidgetsLayout() {
  return (
    <Stack
      initialRouteName="index"
      screenOptions={{
        headerShown: true,
        headerStyle: {
          backgroundColor: "#ffffff",
        },
        headerTintColor: "#007AFF",
        headerTitleStyle: {
          fontWeight: "600",
        },
      }}
    >
      <Stack.Screen
        name="index"
        options={{
          title: "Widgets",
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="CreateSession"
        options={{
          headerShown: false,
          // presentation: "modal",
        }}
      />
      <Stack.Screen
        name="SessionDetails"
        options={{
          headerShown: false,
          // presentation: "modal",
        }}
      />
      <Stack.Screen
        name="ncpa"
        options={{
          title: "NCPA",
          headerShown: false,
        }}
      />
    </Stack>
  )
}
