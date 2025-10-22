// DUPR API Types

export interface DuprEvent {
  eventId: string
  name: string
  description?: string
  startDate: string
  endDate: string
  location?: string
  organizerId: string
  eventType: string
  registrationOpen: boolean
}

export interface DuprUser {
  duprId: string
  firstName: string
  lastName: string
  provisionalRating?: number
  doublesRating?: number
  singlesRating?: number
  isVerified?: boolean
  email?: string
}

export interface InviteUserRequest {
  email: string
  firstName?: string
  lastName?: string
  clubId?: string
}

export interface DuprApiResponse<T> {
  success: boolean
  data?: T
  error?: string
  statusCode?: number
}

export interface DuprClientConfig {
  edgeFunctionName?: string
}
