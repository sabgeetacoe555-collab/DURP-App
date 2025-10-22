import type {
  NCPAPlayer,
  NCPAUniversity,
  NCPATournament,
  NCPATournamentsResponse,
  NCPAApiResponse,
  NCPAServiceConfig,
} from "../types/ncpa"
import { supabase } from "../lib/supabase"

// const DEFAULT_CONFIG: NCPAServiceConfig = {
//   baseUrl: "https://tournaments.ncpaofficial.com/api",
//   timeout: 10000,
// }

// Helper function to make API calls (kept for fallback)
// const makeApiCall = async <T>(
//   endpoint: string,
//   config: NCPAServiceConfig = {}
// ): Promise<NCPAApiResponse<T>> => {
//   const { baseUrl, timeout } = { ...DEFAULT_CONFIG, ...config }
//   const url = `${baseUrl}${endpoint}`

//   try {
//     const controller = new AbortController()
//     const timeoutId = setTimeout(() => controller.abort(), timeout)

//     const response = await fetch(url, {
//       method: "GET",
//       headers: {
//         "Content-Type": "application/json",
//       },
//       signal: controller.signal,
//     })

//     clearTimeout(timeoutId)

//     if (!response.ok) {
//       return {
//         success: false,
//         error: `HTTP ${response.status}: ${response.statusText}`,
//         statusCode: response.status,
//       }
//     }

//     const data = await response.json()

//     return {
//       success: true,
//       data: data as T,
//       statusCode: response.status,
//     }
//   } catch (error) {
//     if (error instanceof Error && error.name === "AbortError") {
//       return {
//         success: false,
//         error: "Request timeout",
//         statusCode: 408,
//       }
//     }

//     return {
//       success: false,
//       error: error instanceof Error ? error.message : "Unknown error occurred",
//     }
//   }
// }

/**
 * Get top players from our cached NCPA data
 * @param config Optional configuration (kept for compatibility)
 * @returns Promise with NCPA players data
 */
export const getPublicTopPlayers = async (
  config?: NCPAServiceConfig
): Promise<NCPAApiResponse<NCPAPlayer[]>> => {
  try {
    const { data, error } = await supabase
      .from("ncpa_players")
      .select("*")
      .eq("hidden", 0)
      .order("overall_rating", { ascending: false })

    if (error) {
      console.error("Error fetching NCPA players from database:", error)
      return {
        success: false,
        error: error.message,
      }
    }

    // Transform database data to match the original API response format
    const players: NCPAPlayer[] = data.map((player) => ({
      hidden: player.hidden,
      profile_id: player.profile_id,
      first_name: player.first_name,
      last_name: player.last_name,
      college: player.college,
      gender: player.gender,
      division: player.division,
      singles_games_played: player.singles_games_played,
      doubles_games_played: player.doubles_games_played,
      mixed_doubles_games_played: player.mixed_doubles_games_played,
      wins: player.wins,
      losses: player.losses,
      singles_rating: player.singles_rating,
      doubles_rating: player.doubles_rating,
      mixed_doubles_rating: player.mixed_doubles_rating,
      overall_rating: player.overall_rating,
      last_overall: player.last_overall,
      last_singles_game: player.last_singles_game,
      last_doubles_game: player.last_doubles_game,
      last_mixed_doubles_game: player.last_mixed_doubles_game,
    }))

    return {
      success: true,
      data: players,
      statusCode: 200,
    }
  } catch (error) {
    console.error("Error in getPublicTopPlayers:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error occurred",
    }
  }
}

/**
 * Get top universities from our cached NCPA data
 * @param config Optional configuration (kept for compatibility)
 * @returns Promise with NCPA universities data
 */
export const getPublicTopUniversities = async (
  config?: NCPAServiceConfig
): Promise<NCPAApiResponse<NCPAUniversity[]>> => {
  try {
    const { data, error } = await supabase
      .from("ncpa_universities")
      .select("*")
      .order("ranking", { ascending: true })

    if (error) {
      console.error("Error fetching NCPA universities from database:", error)
      return {
        success: false,
        error: error.message,
      }
    }

    // Transform database data to match the original API response format
    const universities: NCPAUniversity[] = data.map((university) => ({
      college_id: university.college_id,
      name: university.name,
      ranking: university.ranking,
      alias: university.alias,
      points: university.points,
      color: university.color,
      picture: university.picture,
    }))

    return {
      success: true,
      data: universities,
      statusCode: 200,
    }
  } catch (error) {
    console.error("Error in getPublicTopUniversities:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error occurred",
    }
  }
}

/**
 * Get filtered players by various criteria from our cached data
 * @param filters Optional filters for the players
 * @param config Optional configuration (kept for compatibility)
 * @returns Promise with filtered NCPA players data
 */
export const getFilteredPlayers = async (
  filters?: {
    division?: number
    gender?: string
    minRating?: number
    maxRating?: number
    college?: string
  },
  config?: NCPAServiceConfig
): Promise<NCPAApiResponse<NCPAPlayer[]>> => {
  try {
    let query = supabase.from("ncpa_players").select("*").eq("hidden", 0)

    // Apply filters
    if (filters?.division) {
      query = query.eq("division", filters.division)
    }

    if (filters?.gender) {
      query = query.eq("gender", filters.gender.toLowerCase())
    }

    if (filters?.minRating) {
      query = query.gte("overall_rating", filters.minRating)
    }

    if (filters?.maxRating) {
      query = query.lte("overall_rating", filters.maxRating)
    }

    if (filters?.college) {
      query = query.ilike("college", `%${filters.college}%`)
    }

    const { data, error } = await query.order("overall_rating", {
      ascending: false,
    })

    if (error) {
      console.error(
        "Error fetching filtered NCPA players from database:",
        error
      )
      return {
        success: false,
        error: error.message,
      }
    }

    // Transform database data to match the original API response format
    const players: NCPAPlayer[] = data.map((player) => ({
      hidden: player.hidden,
      profile_id: player.profile_id,
      first_name: player.first_name,
      last_name: player.last_name,
      college: player.college,
      gender: player.gender,
      division: player.division,
      singles_games_played: player.singles_games_played,
      doubles_games_played: player.doubles_games_played,
      mixed_doubles_games_played: player.mixed_doubles_games_played,
      wins: player.wins,
      losses: player.losses,
      singles_rating: player.singles_rating,
      doubles_rating: player.doubles_rating,
      mixed_doubles_rating: player.mixed_doubles_rating,
      overall_rating: player.overall_rating,
      last_overall: player.last_overall,
      last_singles_game: player.last_singles_game,
      last_doubles_game: player.last_doubles_game,
      last_mixed_doubles_game: player.last_mixed_doubles_game,
    }))

    return {
      success: true,
      data: players,
      statusCode: 200,
    }
  } catch (error) {
    console.error("Error in getFilteredPlayers:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error occurred",
    }
  }
}

/**
 * Get top players by rating from our cached data
 * @param limit Number of top players to return
 * @param config Optional configuration (kept for compatibility)
 * @returns Promise with top NCPA players data
 */
export const getTopPlayersByRating = async (
  limit: number = 10,
  config?: NCPAServiceConfig
): Promise<NCPAApiResponse<NCPAPlayer[]>> => {
  try {
    const { data, error } = await supabase
      .from("ncpa_players")
      .select("*")
      .eq("hidden", 0)
      .not("overall_rating", "is", null)
      .gt("overall_rating", 0)
      .order("overall_rating", { ascending: false })
      .limit(limit)

    if (error) {
      console.error("Error fetching top NCPA players from database:", error)
      return {
        success: false,
        error: error.message,
      }
    }

    // Transform database data to match the original API response format
    const players: NCPAPlayer[] = data.map((player) => ({
      hidden: player.hidden,
      profile_id: player.profile_id,
      first_name: player.first_name,
      last_name: player.last_name,
      college: player.college,
      gender: player.gender,
      division: player.division,
      singles_games_played: player.singles_games_played,
      doubles_games_played: player.doubles_games_played,
      mixed_doubles_games_played: player.mixed_doubles_games_played,
      wins: player.wins,
      losses: player.losses,
      singles_rating: player.singles_rating,
      doubles_rating: player.doubles_rating,
      mixed_doubles_rating: player.mixed_doubles_rating,
      overall_rating: player.overall_rating,
      last_overall: player.last_overall,
      last_singles_game: player.last_singles_game,
      last_doubles_game: player.last_doubles_game,
      last_mixed_doubles_game: player.last_mixed_doubles_game,
    }))

    return {
      success: true,
      data: players,
      statusCode: 200,
    }
  } catch (error) {
    console.error("Error in getTopPlayersByRating:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error occurred",
    }
  }
}

/**
 * Get players by college from our cached data
 * @param collegeName Name of the college to filter by
 * @param config Optional configuration (kept for compatibility)
 * @returns Promise with college players data
 */
export const getPlayersByCollege = async (
  collegeName: string,
  config?: NCPAServiceConfig
): Promise<NCPAApiResponse<NCPAPlayer[]>> => {
  return getFilteredPlayers({ college: collegeName }, config)
}

/**
 * Get current tournaments from our cached data
 * @param config Optional configuration (kept for compatibility)
 * @returns Promise with current NCPA tournaments data
 */
export const getCurrentTournaments = async (
  config?: NCPAServiceConfig
): Promise<NCPAApiResponse<NCPATournament[]>> => {
  try {
    const { data, error } = await supabase
      .from("ncpa_tournaments")
      .select("*")
      .gte("begin_date", new Date().toISOString().split("T")[0]) // Today or future
      .in("status", ["current", "upcoming"])
      .order("begin_date", { ascending: true })

    if (error) {
      console.error("Error fetching NCPA tournaments from database:", error)
      return {
        success: false,
        error: error.message,
      }
    }

    // Transform database data to match the original API response format
    const tournaments: NCPATournament[] = data.map((tournament) => ({
      name: tournament.name,
      venue: tournament.venue,
      venue_address: tournament.venue_address,
      registration_open: tournament.registration_open,
      registration_close: tournament.registration_close,
      begin_date: tournament.begin_date,
      end_date: tournament.end_date,
      university: tournament.university,
      number_of_bids: tournament.number_of_bids,
      nationals: tournament.nationals,
      num_teams: tournament.num_teams,
      num_players: tournament.num_players,
      player_event_types: tournament.player_event_types,
      bracket_event_types: tournament.bracket_event_types,
      team_hosts: tournament.team_hosts,
    }))

    return {
      success: true,
      data: tournaments,
      statusCode: 200,
    }
  } catch (error) {
    console.error("Error in getCurrentTournaments:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error occurred",
    }
  }
}

/**
 * Get data freshness information
 * @returns Promise with last update timestamps
 */
export const getDataFreshness = async (): Promise<{
  players_last_updated: string | null
  universities_last_updated: string | null
  tournaments_last_updated: string | null
}> => {
  try {
    const [playersResult, universitiesResult, tournamentsResult] =
      await Promise.all([
        supabase
          .from("ncpa_players")
          .select("last_updated")
          .order("last_updated", { ascending: false })
          .limit(1)
          .single(),
        supabase
          .from("ncpa_universities")
          .select("last_updated")
          .order("last_updated", { ascending: false })
          .limit(1)
          .single(),
        supabase
          .from("ncpa_tournaments")
          .select("last_updated")
          .order("last_updated", { ascending: false })
          .limit(1)
          .single(),
      ])

    return {
      players_last_updated: playersResult.data?.last_updated || null,
      universities_last_updated: universitiesResult.data?.last_updated || null,
      tournaments_last_updated: tournamentsResult.data?.last_updated || null,
    }
  } catch (error) {
    console.error("Error getting data freshness:", error)
    return {
      players_last_updated: null,
      universities_last_updated: null,
      tournaments_last_updated: null,
    }
  }
}

// Export types for convenience
export type {
  NCPAPlayer,
  NCPAUniversity,
  NCPATournament,
  NCPATournamentsResponse,
  NCPAApiResponse,
  NCPAServiceConfig,
}
