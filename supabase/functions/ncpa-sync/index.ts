import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
}

interface NCPAPlayer {
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

interface NCPAUniversity {
  college_id: number
  name: string
  ranking?: number | null
  alias?: string | null
  points?: number | null
  color?: string | null
  picture?: string | null
}

interface NCPATournament {
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

interface NCPATournamentsResponse {
  current: NCPATournament[]
  upcoming: NCPATournament[]
}

interface SyncLogEntry {
  sync_type: string
  status: string
  records_processed: number
  records_updated: number
  records_created: number
  error_message?: string
  started_at: string
  completed_at?: string
  duration_ms?: number
}

// Helper function to make API calls
const makeApiCall = async <T>(endpoint: string): Promise<T | null> => {
  const baseUrl = "https://tournaments.ncpaofficial.com/api"
  const url = `${baseUrl}${endpoint}`

  try {
    const response = await fetch(url, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    })

    if (!response.ok) {
      console.error(`HTTP ${response.status}: ${response.statusText}`)
      return null
    }

    const data = await response.json()
    return data as T
  } catch (error) {
    console.error("API call error:", error)
    return null
  }
}

// Helper function to log sync operations
const logSyncOperation = async (
  supabase: any,
  logEntry: SyncLogEntry
): Promise<void> => {
  try {
    await supabase.from("ncpa_sync_log").insert(logEntry)
  } catch (error) {
    console.error("Error logging sync operation:", error)
  }
}

// Sync NCPA Players
const syncPlayers = async (
  supabase: any
): Promise<{
  success: boolean
  processed: number
  updated: number
  created: number
  error?: string
}> => {
  const startTime = Date.now()

  try {
    console.log("🔄 Starting NCPA players sync...")

    const playersData = await makeApiCall<NCPAPlayer[]>(
      "/get-players?players_only=true"
    )

    if (!playersData) {
      const error = "Failed to fetch players data from NCPA API"
      console.error(error)
      return { success: false, processed: 0, updated: 0, created: 0, error }
    }

    console.log(`📊 Fetched ${playersData.length} players from NCPA API`)

    let updated = 0
    let created = 0

    // Process players in batches to avoid overwhelming the database
    const batchSize = 50
    for (let i = 0; i < playersData.length; i += batchSize) {
      const batch = playersData.slice(i, i + batchSize)

      for (const player of batch) {
        try {
          // Calculate overall rating
          const ratings = []
          if (player.singles_rating && player.singles_rating > 0) {
            ratings.push(player.singles_rating)
          }
          if (player.doubles_rating && player.doubles_rating > 0) {
            ratings.push(player.doubles_rating)
          }
          if (player.mixed_doubles_rating && player.mixed_doubles_rating > 0) {
            ratings.push(player.mixed_doubles_rating)
          }

          const overall_rating =
            ratings.length > 0
              ? ratings.reduce((sum, rating) => sum + rating, 0) /
                ratings.length
              : null

          // Check if player exists
          const { data: existingPlayer } = await supabase
            .from("ncpa_players")
            .select("id")
            .eq("profile_id", player.profile_id)
            .single()

          if (existingPlayer) {
            // Update existing player
            const { error } = await supabase
              .from("ncpa_players")
              .update({
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
                overall_rating: overall_rating,
                last_overall: player.last_overall,
                last_singles_game: player.last_singles_game,
                last_doubles_game: player.last_doubles_game,
                last_mixed_doubles_game: player.last_mixed_doubles_game,
                hidden: player.hidden,
                last_updated: new Date().toISOString(),
              })
              .eq("profile_id", player.profile_id)

            if (error) {
              console.error(
                `Error updating player ${player.profile_id}:`,
                error
              )
            } else {
              updated++
            }
          } else {
            // Create new player
            const { error } = await supabase.from("ncpa_players").insert({
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
              overall_rating: overall_rating,
              last_overall: player.last_overall,
              last_singles_game: player.last_singles_game,
              last_doubles_game: player.last_doubles_game,
              last_mixed_doubles_game: player.last_mixed_doubles_game,
              hidden: player.hidden,
            })

            if (error) {
              console.error(
                `Error creating player ${player.profile_id}:`,
                error
              )
            } else {
              created++
            }
          }
        } catch (error) {
          console.error(`Error processing player ${player.profile_id}:`, error)
        }
      }
    }

    const duration = Date.now() - startTime
    console.log(
      `✅ Players sync completed: ${updated} updated, ${created} created in ${duration}ms`
    )

    return {
      success: true,
      processed: playersData.length,
      updated,
      created,
    }
  } catch (error) {
    const duration = Date.now() - startTime
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error"
    console.error(`❌ Players sync failed after ${duration}ms:`, errorMessage)

    return {
      success: false,
      processed: 0,
      updated: 0,
      created: 0,
      error: errorMessage,
    }
  }
}

// Sync NCPA Universities
const syncUniversities = async (
  supabase: any
): Promise<{
  success: boolean
  processed: number
  updated: number
  created: number
  error?: string
}> => {
  const startTime = Date.now()

  try {
    console.log("🔄 Starting NCPA universities sync...")

    const universitiesData = await makeApiCall<{
      success: boolean
      colleges: NCPAUniversity[]
    }>("/colleges")

    if (!universitiesData || !universitiesData.success) {
      const error = "Failed to fetch universities data from NCPA API"
      console.error(error)
      return { success: false, processed: 0, updated: 0, created: 0, error }
    }

    const universities = universitiesData.colleges
    console.log(`📊 Fetched ${universities.length} universities from NCPA API`)

    let updated = 0
    let created = 0

    for (const university of universities) {
      try {
        // Check if university exists
        const { data: existingUniversity } = await supabase
          .from("ncpa_universities")
          .select("id")
          .eq("college_id", university.college_id)
          .single()

        if (existingUniversity) {
          // Update existing university
          const { error } = await supabase
            .from("ncpa_universities")
            .update({
              name: university.name,
              ranking: university.ranking,
              alias: university.alias,
              points: university.points,
              color: university.color,
              picture: university.picture,
              last_updated: new Date().toISOString(),
            })
            .eq("college_id", university.college_id)

          if (error) {
            console.error(
              `Error updating university ${university.college_id}:`,
              error
            )
          } else {
            updated++
          }
        } else {
          // Create new university
          const { error } = await supabase.from("ncpa_universities").insert({
            college_id: university.college_id,
            name: university.name,
            ranking: university.ranking,
            alias: university.alias,
            points: university.points,
            color: university.color,
            picture: university.picture,
          })

          if (error) {
            console.error(
              `Error creating university ${university.college_id}:`,
              error
            )
          } else {
            created++
          }
        }
      } catch (error) {
        console.error(
          `Error processing university ${university.college_id}:`,
          error
        )
      }
    }

    const duration = Date.now() - startTime
    console.log(
      `✅ Universities sync completed: ${updated} updated, ${created} created in ${duration}ms`
    )

    return {
      success: true,
      processed: universities.length,
      updated,
      created,
    }
  } catch (error) {
    const duration = Date.now() - startTime
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error"
    console.error(
      `❌ Universities sync failed after ${duration}ms:`,
      errorMessage
    )

    return {
      success: false,
      processed: 0,
      updated: 0,
      created: 0,
      error: errorMessage,
    }
  }
}

// Sync NCPA Tournaments
const syncTournaments = async (
  supabase: any
): Promise<{
  success: boolean
  processed: number
  updated: number
  created: number
  error?: string
}> => {
  const startTime = Date.now()

  try {
    console.log("🔄 Starting NCPA tournaments sync...")

    const tournamentsData = await makeApiCall<{
      success: boolean
      tournaments: NCPATournamentsResponse
    }>("/get-tournaments")

    if (!tournamentsData || !tournamentsData.success) {
      const error = "Failed to fetch tournaments data from NCPA API"
      console.error(error)
      return { success: false, processed: 0, updated: 0, created: 0, error }
    }

    const allTournaments = [
      ...tournamentsData.tournaments.current.map((t) => ({
        ...t,
        status: "current",
      })),
      ...tournamentsData.tournaments.upcoming.map((t) => ({
        ...t,
        status: "upcoming",
      })),
    ]

    console.log(`📊 Fetched ${allTournaments.length} tournaments from NCPA API`)

    let updated = 0
    let created = 0

    for (const tournament of allTournaments) {
      try {
        // Create a unique identifier for tournaments (name + begin_date)
        const tournamentKey = `${tournament.name}-${tournament.begin_date}`

        // Check if tournament exists
        const { data: existingTournament } = await supabase
          .from("ncpa_tournaments")
          .select("id")
          .eq("name", tournament.name)
          .eq("begin_date", tournament.begin_date)
          .single()

        if (existingTournament) {
          // Update existing tournament
          const { error } = await supabase
            .from("ncpa_tournaments")
            .update({
              venue: tournament.venue,
              venue_address: tournament.venue_address,
              registration_open: tournament.registration_open,
              registration_close: tournament.registration_close,
              end_date: tournament.end_date,
              university: tournament.university,
              number_of_bids: tournament.number_of_bids,
              nationals: tournament.nationals,
              num_teams: tournament.num_teams,
              num_players: tournament.num_players,
              player_event_types: tournament.player_event_types,
              bracket_event_types: tournament.bracket_event_types,
              team_hosts: tournament.team_hosts,
              status: tournament.status,
              last_updated: new Date().toISOString(),
            })
            .eq("name", tournament.name)
            .eq("begin_date", tournament.begin_date)

          if (error) {
            console.error(`Error updating tournament ${tournamentKey}:`, error)
          } else {
            updated++
          }
        } else {
          // Create new tournament
          const { error } = await supabase.from("ncpa_tournaments").insert({
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
            status: tournament.status,
          })

          if (error) {
            console.error(`Error creating tournament ${tournamentKey}:`, error)
          } else {
            created++
          }
        }
      } catch (error) {
        console.error(`Error processing tournament ${tournament.name}:`, error)
      }
    }

    const duration = Date.now() - startTime
    console.log(
      `✅ Tournaments sync completed: ${updated} updated, ${created} created in ${duration}ms`
    )

    return {
      success: true,
      processed: allTournaments.length,
      updated,
      created,
    }
  } catch (error) {
    const duration = Date.now() - startTime
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error"
    console.error(
      `❌ Tournaments sync failed after ${duration}ms:`,
      errorMessage
    )

    return {
      success: false,
      processed: 0,
      updated: 0,
      created: 0,
      error: errorMessage,
    }
  }
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders })
  }

  try {
    // Create Supabase client
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!

    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Get sync type from query parameters
    const url = new URL(req.url)
    const syncType = url.searchParams.get("type") || "all" // 'players', 'universities', 'tournaments', 'all'

    console.log(`🚀 Starting NCPA sync for type: ${syncType}`)

    const results = {
      players: null as any,
      universities: null as any,
      tournaments: null as any,
    }

    // Sync based on type (focus on universities and players, skip tournaments since we use hardcoded data)
    if (syncType === "all" || syncType === "players") {
      results.players = await syncPlayers(supabase)
      await logSyncOperation(supabase, {
        sync_type: "players",
        status: results.players.success ? "success" : "error",
        records_processed: results.players.processed,
        records_updated: results.players.updated,
        records_created: results.players.created,
        error_message: results.players.error,
        started_at: new Date().toISOString(),
        completed_at: new Date().toISOString(),
        duration_ms: Date.now() - Date.now(), // This will be calculated properly in the actual function
      })
    }

    if (syncType === "all" || syncType === "universities") {
      results.universities = await syncUniversities(supabase)
      await logSyncOperation(supabase, {
        sync_type: "universities",
        status: results.universities.success ? "success" : "error",
        records_processed: results.universities.processed,
        records_updated: results.universities.updated,
        records_created: results.universities.created,
        error_message: results.universities.error,
        started_at: new Date().toISOString(),
        completed_at: new Date().toISOString(),
        duration_ms: Date.now() - Date.now(),
      })
    }

    // Note: Tournaments sync is disabled since we use hardcoded tournament data
    // if (syncType === "all" || syncType === "tournaments") {
    //   results.tournaments = await syncTournaments(supabase)
    //   await logSyncOperation(supabase, {
    //     sync_type: "tournaments",
    //     status: results.tournaments.success ? "success" : "error",
    //     records_processed: results.tournaments.processed,
    //     records_updated: results.tournaments.updated,
    //     records_created: results.tournaments.created,
    //     error_message: results.tournaments.error,
    //     started_at: new Date().toISOString(),
    //     completed_at: new Date().toISOString(),
    //     duration_ms: Date.now() - Date.now(),
    //   })
    // }

    // Determine overall success
    const allResults = [
      results.players,
      results.universities,
      results.tournaments,
    ].filter(Boolean)
    const overallSuccess = allResults.every((result) => result?.success)
    const hasErrors = allResults.some((result) => !result?.success)

    const response = {
      success: overallSuccess,
      message: overallSuccess
        ? "NCPA sync completed successfully"
        : "NCPA sync completed with errors",
      results,
      timestamp: new Date().toISOString(),
    }

    return new Response(JSON.stringify(response), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: hasErrors ? 207 : 200, // 207 Multi-Status if some operations failed
    })
  } catch (error) {
    console.error("❌ NCPA sync function error:", error)

    return new Response(
      JSON.stringify({
        success: false,
        error:
          error instanceof Error ? error.message : "Unknown error occurred",
        timestamp: new Date().toISOString(),
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    )
  }
})
