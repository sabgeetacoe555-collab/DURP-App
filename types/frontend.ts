// Frontend-specific types for the Net Gains app

// ============================================================================
// NOTIFICATION TYPES
// ============================================================================

export type NotificationType =
  | "session_invite"
  | "invite_response"
  | "session_reminder"
  | "session_update"
  | "session_cancelled"
  | "thread_reply"
  | "test"

export interface NotificationData {
  type: NotificationType
  sessionId?: string
  inviteId?: string
  inviterIds?: string[]
  sessionName?: string
  inviterName?: string
  updateType?: "cancelled" | "modified" | "reminder"
  discussionType?: "group" | "session"
  entityId?: string
  threadId?: string
}

export interface PushNotificationMessage {
  to: string
  sound: "default" | "none"
  title: string
  body: string
  data: NotificationData
}

// ============================================================================
// SESSION TYPES
// ============================================================================

export type SessionStatus = "planned" | "active" | "completed" | "cancelled"
export type FrontendSessionType = "pickleball" | "tennis" | "other"
export type InviteStatus = "pending" | "accepted" | "declined" | "maybe"

export interface SessionFormData {
  name?: string
  date: string
  start_time?: string
  end_time?: string
  location?: string
  session_type?: FrontendSessionType
  is_public?: boolean
  min_dupr_rating?: number
  max_dupr_rating?: number
  max_players?: number
  allow_friends?: boolean
  focus_type: string[]
}

export interface SessionInviteFormData {
  sessionId: string
  inviteeIds?: string[]
  inviteePhones?: string[]
  inviteeEmails?: string[]
  inviteeNames?: string[]
  message?: string
}

// ============================================================================
// USER TYPES
// ============================================================================

export interface UserProfile {
  id: string
  name?: string
  email?: string
  phone?: string
  dupr_rating_singles?: number
  dupr_rating_doubles?: number
  expo_push_token?: string
  created_at: string
  updated_at: string
}

export interface UserPreferences {
  notifications_enabled: boolean
  email_notifications: boolean
  sms_notifications: boolean
  push_notifications: boolean
  default_session_type?: FrontendSessionType
  preferred_locations?: string[]
}

// ============================================================================
// AUTH TYPES
// ============================================================================

export interface AuthState {
  user: UserProfile | null
  loading: boolean
  error: string | null
}

export interface LoginCredentials {
  email: string
  password: string
}

export interface SignupCredentials {
  email: string
  password: string
  name: string
  phone?: string
}

export interface PasswordResetData {
  email: string
}

// ============================================================================
// MODAL TYPES
// ============================================================================

export interface ModalState {
  isVisible: boolean
  type: ModalType | null
  data?: any
}

export type ModalType =
  | "create_session"
  | "edit_session"
  | "session_details"
  | "invite_players"
  | "session_reminder"
  | "error"
  | "success"
  | "confirm"

export interface ModalData {
  sessionId?: string
  message?: string
  title?: string
  onConfirm?: () => void
  onCancel?: () => void
}

// ============================================================================
// NAVIGATION TYPES
// ============================================================================

export interface NavigationParams {
  sessionId?: string
  inviteId?: string
  tab?: string
  refresh?: boolean
}

export interface TabNavigationState {
  activeTab:
    | "sessions"
    | "invites"
    | "widgets"
    | "leaders"
    | "profile"
    | "notifications"
}

// ============================================================================
// API RESPONSE TYPES
// ============================================================================

export interface ApiResponse<T = any> {
  data: T | null
  error: string | null
  success: boolean
}

export interface PaginatedResponse<T> {
  data: T[]
  count: number
  page: number
  limit: number
  hasMore: boolean
}

// ============================================================================
// FORM TYPES
// ============================================================================

export interface FormField {
  name: string
  label: string
  type:
    | "text"
    | "email"
    | "password"
    | "number"
    | "select"
    | "multiselect"
    | "date"
    | "time"
    | "textarea"
  required?: boolean
  placeholder?: string
  options?: Array<{ label: string; value: any }>
  validation?: (value: any) => string | null
}

export interface FormState {
  values: Record<string, any>
  errors: Record<string, string>
  touched: Record<string, boolean>
  isValid: boolean
  isSubmitting: boolean
}

// ============================================================================
// UI TYPES
// ============================================================================

export type ColorScheme = "light" | "dark" | "system"

export interface ThemeColors {
  primary: string
  secondary: string
  background: string
  surface: string
  text: string
  textSecondary: string
  border: string
  error: string
  success: string
  warning: string
  info: string
}

export type ButtonVariant =
  | "primary"
  | "secondary"
  | "outline"
  | "ghost"
  | "danger"
  | "success"

export type ButtonSize = "small" | "medium" | "large"

// ============================================================================
// ERROR TYPES
// ============================================================================

export interface AppError {
  code: string
  message: string
  details?: any
  timestamp: Date
}

export type ErrorType =
  | "network"
  | "auth"
  | "validation"
  | "permission"
  | "not_found"
  | "server"
  | "unknown"

// ============================================================================
// GLOBAL STATE TYPES
// ============================================================================

export interface GlobalState {
  auth: AuthState
  modal: ModalState
  notifications: {
    pendingSessionId: string | null
    pendingType: string | null
  }
  sessions: {
    shouldReset: boolean
    lastUpdated: Date | null
  }
}

// ============================================================================
// GROUP TYPES
// ============================================================================

export interface Group {
  id: string
  name: string
  description?: string
  user_id: string
  created_at: string
  updated_at: string
}

export interface GroupMember {
  id: string
  group_id: string
  contact_name: string
  contact_phone?: string
  contact_email?: string
  added_at: string
  user_id?: string
  accepted_invite?: boolean
  approval_status?: "pending" | "approved" | "denied"
  is_admin?: boolean
}

export interface GroupWithMembers extends Group {
  members: GroupMember[]
  creator?: string | { name: string }
  member_count?: number
}

// ============================================================================
// DATABASE TYPES (for compatibility)
// ============================================================================

// Session types
export interface Session {
  id: string
  user_id: string
  name: string
  session_type: string
  date: string
  start_time?: string
  end_time?: string
  location?: string
  location_address?: string
  location_display_address?: string
  max_players?: number
  dupr_min?: number
  dupr_max?: number
  visibility: "public" | "private" | "friends"
  session_datetime?: string
  end_datetime?: string
  focus_type?: string[]
  created_at: string
  updated_at: string
  // Additional properties that might be returned from database
  allow_guests?: boolean
  location_lat?: number
  location_lng?: number
  location_place_id?: string
  location_formatted_address?: string
  location_name?: string
  location_types?: string[]
  location_geometry?: any
  location_components?: any
  location_utc_offset_minutes?: number
  location_timezone_id?: string
  location_timezone_name?: string
  location_neighborhood?: string
  location_city?: string
  location_state?: string
  location_country?: string
  location_postal_code?: string
  location_street_number?: string
  location_route?: string
  location_sublocality?: string
  location_administrative_area_level_1?: string
  location_administrative_area_level_2?: string
  location_administrative_area_level_3?: string
  location_administrative_area_level_4?: string
  location_administrative_area_level_5?: string
  location_colloquial_area?: string
  location_locality?: string
  location_premise?: string
  location_subpremise?: string
  location_natural_feature?: string
  location_airport?: string
  location_park?: string
  location_point_of_interest?: string
  location_establishment?: string
  location_subway_station?: string
  location_train_station?: string
  location_transit_station?: string
  location_bus_station?: string
  location_street_address?: string
  location_intersection?: string
  location_political?: string
  // Additional session properties
  status?: string
  session_status?: string
  completed?: boolean
  mood?: string
  body_readiness?: string
  confidence?: number
  intensity?: number
  goal_achievement?: string
  reflection_tags?: string[]
  is_public?: boolean
  min_dupr_rating?: number
  max_dupr_rating?: number
  allow_friends?: boolean
  accepted_participants?: string[]
  session_info?: string
  invite_stats?: {
    total_invited: number
    total_accepted: number
  }
}

export interface CreateSessionData {
  name: string
  session_type: string
  date: string
  start_time?: string
  end_time?: string
  location?: string
  location_address?: string
  location_display_address?: string
  max_players?: number
  dupr_min?: number
  dupr_max?: number
  visibility: "public" | "private" | "friends"
  session_datetime?: string
  end_datetime?: string
  focus_type?: string[]
  allow_guests?: boolean
  session_info?: string
  locationData?: any
}

export interface CreateSessionInviteData {
  invitee_name: string
  invitee_phone?: string
  invitee_email?: string
  invitee_id?: string
  group_id?: string // Group created from session invites
}

export interface SessionInvite {
  id: string
  session_id: string
  inviter_id: string
  invitee_id?: string
  invitee_name?: string
  invitee_phone?: string
  invitee_email?: string
  status: string
  created_at: string
  updated_at: string
}

// User types
export interface User {
  id: string
  name?: string
  email?: string
  phone?: string
  dupr_rating_singles?: number
  dupr_rating_doubles?: number
  expo_push_token?: string
  created_at: string
  updated_at: string
}

// Group types
export interface CreateGroupData {
  name: string
  description?: string
  members: Array<{
    contact_name: string
    contact_phone?: string
    contact_email?: string
  }>
}

export interface GroupInvitation {
  id: string
  group_id: string
  session_id: string
  invited_at?: string
}

// Group invite types
export interface CreateGroupInviteData {
  contact_name: string
  contact_phone?: string
  contact_email?: string
  user_id?: string // If the person already has an account
}

export interface GroupInviteResponse {
  success: boolean
  message: string
  groupId?: string
  requiresAuth?: boolean
  isAlreadyMember?: boolean
  canJoin?: boolean
}

// Session types for compatibility
export type SessionType =
  | "pickleball"
  | "tennis"
  | "other"
  | "open play"
  | "tournament"
  | "drills"
  | "private lesson"
  | "ladder"
  | "solo"
export type FocusArea =
  | "warmup"
  | "drills"
  | "games"
  | "conditioning"
  | "serve"
  | "return"
  | "dinking"
  | "volleys"
  | "speed ups"
  | "communication"
export type Rating = 1 | 2 | 3 | 4 | 5
export type StringRating = "bad" | "ok" | "good"
export type BodyReadiness =
  | "great"
  | "good"
  | "okay"
  | "tired"
  | "sore"
  | "average"

// Utility function
export const createSessionData = (data: any) => data

// ============================================================================
// UTILITY TYPES
// ============================================================================

export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P]
}

export type Optional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>

export type RequiredFields<T, K extends keyof T> = T & Required<Pick<T, K>>
