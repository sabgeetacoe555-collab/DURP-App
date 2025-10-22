// NCPA API Types

export interface NCPAPlayer {
  hidden: number
  profile_id: number
  first_name: string
  last_name: string
  college?: string
  gender: string
  division: number
  singles_games_played: number
  doubles_games_played: number
  mixed_doubles_games_played: number
  wins: number
  losses: number
  singles_rating: number
  doubles_rating: number
  mixed_doubles_rating: number
  overall_rating?: number
  last_overall?: number
  last_singles_game?: string | null
  last_doubles_game?: string | null
  last_mixed_doubles_game?: string | null
}

export interface NCPAUniversity {
  college_id: number
  name: string
  ranking?: number | null
  alias?: string | null
  points?: number | null
  color?: string | null
  picture?: string | null
}

export interface NCPATournament {
  name: string
  venue: string
  venue_address: string
  registration_open: string
  registration_close: string
  begin_date: string
  end_date: string
  university: number
  number_of_bids: number | null
  nationals: number
  num_teams: number
  num_players: number
  player_event_types: string | null
  bracket_event_types: string | null
  team_hosts: string | null
}

export interface NCPATournamentsResponse {
  current: NCPATournament[]
  upcoming: NCPATournament[]
}

export interface NCPAApiResponse<T> {
  success: boolean
  data?: T
  error?: string
  statusCode?: number
}

export interface NCPAServiceConfig {
  baseUrl?: string
  timeout?: number
}
