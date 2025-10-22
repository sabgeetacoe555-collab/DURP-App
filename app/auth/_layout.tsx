import { Stack } from "expo-router"
import { View } from "react-native"

export default function AuthLayout() {
  return (
    <View style={{ flex: 1, backgroundColor: "rgba(0, 128, 192, 1)" }}>
      <Stack
        screenOptions={{
          headerShown: false,
          header: () => null,
        }}
      >
        <Stack.Screen name="login" />
        <Stack.Screen name="signup" />
        <Stack.Screen name="forgot-password" />
      </Stack>
    </View>
  )
}

export const unstable_settings = {
  initialRouteName: "login",
}
