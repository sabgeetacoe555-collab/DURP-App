// Navigation types for the NetGains app
// This file defines the route types for Expo Router

export type AppRoutes =
  // Main routes
  | "/"
  | "/_sitemap"
  | "/+not-found"

  // Auth routes
  | "/auth/login"
  | "/auth/signup"
  | "/auth/forgot-password"

  // Tab routes
  | "/(tabs)/widgets"
  | "/(tabs)/groups"
  | "/(tabs)/notifications"
  | "/(tabs)/profile"
  | "/(tabs)/sessions"

  // Other routes
  | "/leaders"
  | "/groups/[groupId]"

  // Session routes (under sessions tab)
  | "/(tabs)/sessions/CreateSession"
  | "/(tabs)/sessions/PrePlaySession"
  | "/(tabs)/sessions/PostPlaySession"
  | "/(tabs)/sessions/SessionDetails"

export type RouteParams = {
  "/(tabs)/sessions/SessionDetails": { sessionId: string }
  "/(tabs)/sessions/PrePlaySession": { sessionId: string }
  "/(tabs)/sessions/PostPlaySession": { sessionId: string }
  "/(tabs)/sessions/CreateSession": undefined
  "/groups/[groupId]": { groupId: string }
}

// Helper type for router.push with params
export type RouterPushParams<T extends AppRoutes> = T extends keyof RouteParams
  ? { pathname: T; params: RouteParams[T] }
  : { pathname: T }

// Type-safe router push function
export type TypedRouter = {
  push: <T extends AppRoutes>(params: RouterPushParams<T>) => void
  replace: <T extends AppRoutes>(params: RouterPushParams<T>) => void
  back: () => void
}
