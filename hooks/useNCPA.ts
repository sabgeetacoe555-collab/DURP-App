import { useState, useEffect, useCallback } from "react"
import {
  getPublicTopPlayers,
  getPublicTopUniversities,
  getTopPlayersByRating,
  getFilteredPlayers,
  getCurrentTournaments,
  getDataFreshness,
  type NCPAPlayer,
  type NCPAUniversity,
  type NCPATournament,
  type NCPAApiResponse,
} from "../services/NCPAService"
import { useAuth } from "@/contexts/AuthContext"

interface NCPAData {
  players: NCPAPlayer[]
  universities: NCPAUniversity[]
  topPlayers: NCPAPlayer[]
  tournaments: NCPATournament[]
  loading: boolean
  error: string | null
  tournamentsLoading: boolean
  tournamentsError: string | null
  dataFreshness: {
    players_last_updated: string | null
    universities_last_updated: string | null
    tournaments_last_updated: string | null
  }
}

interface UseNCPAReturn extends NCPAData {
  refreshData: () => Promise<void>
  refreshPlayers: () => Promise<void>
  refreshUniversities: () => Promise<void>
  getPlayersByCollege: (collegeName: string) => Promise<NCPAPlayer[]>
  getFilteredPlayers: (filters?: {
    division?: number
    gender?: string
    minRating?: number
    maxRating?: number
    college?: string
  }) => Promise<NCPAPlayer[]>
}

export const useNCPA = (): UseNCPAReturn => {
  const { isStartupComplete } = useAuth()
  const [data, setData] = useState<NCPAData>({
    players: [],
    universities: [],
    topPlayers: [],
    tournaments: [],
    loading: false,
    error: null,
    tournamentsLoading: false,
    tournamentsError: null,
    dataFreshness: {
      players_last_updated: null,
      universities_last_updated: null,
      tournaments_last_updated: null,
    },
  })

  const fetchPlayers = useCallback(async () => {
    try {
      setData((prev) => ({ ...prev, loading: true, error: null }))

      const response: NCPAApiResponse<NCPAPlayer[]> =
        await getPublicTopPlayers()

      if (response.success && response.data) {
        setData((prev) => ({
          ...prev,
          players: response.data!,
          loading: false,
        }))
      } else {
        setData((prev) => ({
          ...prev,
          error: response.error || "Failed to fetch players",
          loading: false,
        }))
      }
    } catch (error) {
      setData((prev) => ({
        ...prev,
        error:
          error instanceof Error ? error.message : "Unknown error occurred",
        loading: false,
      }))
    }
  }, [])

  const fetchUniversities = useCallback(async () => {
    try {
      setData((prev) => ({ ...prev, loading: true, error: null }))

      // Try to get universities from database first
      const response: NCPAApiResponse<NCPAUniversity[]> =
        await getPublicTopUniversities()

      if (response.success && response.data && response.data.length > 0) {
        setData((prev) => ({
          ...prev,
          universities: response.data!,
          loading: false,
        }))
      } else {
        // Fallback to hardcoded university data if database is empty
        const hardcodedUniversities: NCPAUniversity[] = [
          {
            college_id: 1,
            name: "University of Michigan",
            ranking: 1,
            points: 95.5,
            color: "#00274C",
            picture: null,
          },
          {
            college_id: 2,
            name: "University of Florida",
            ranking: 2,
            points: 92.3,
            color: "#0021A5",
            picture: null,
          },
          {
            college_id: 3,
            name: "University of Texas",
            ranking: 3,
            points: 89.7,
            color: "#BF5700",
            picture: null,
          },
          {
            college_id: 4,
            name: "University of California, Berkeley",
            ranking: 4,
            points: 87.2,
            color: "#003262",
            picture: null,
          },
          {
            college_id: 5,
            name: "University of Virginia",
            ranking: 5,
            points: 85.8,
            color: "#232D4B",
            picture: null,
          },
          {
            college_id: 6,
            name: "University of North Carolina",
            ranking: 6,
            points: 83.4,
            color: "#4B9CD3",
            picture: null,
          },
          {
            college_id: 7,
            name: "University of Wisconsin",
            ranking: 7,
            points: 81.9,
            color: "#C5050C",
            picture: null,
          },
          {
            college_id: 8,
            name: "University of Washington",
            ranking: 8,
            points: 80.1,
            color: "#4B2E83",
            picture: null,
          },
          {
            college_id: 9,
            name: "University of Illinois",
            ranking: 9,
            points: 78.7,
            color: "#E84A27",
            picture: null,
          },
          {
            college_id: 10,
            name: "University of Minnesota",
            ranking: 10,
            points: 77.3,
            color: "#7A0019",
            picture: null,
          },
        ]

        setData((prev) => ({
          ...prev,
          universities: hardcodedUniversities,
          loading: false,
        }))
      }
    } catch (error) {
      setData((prev) => ({
        ...prev,
        error:
          error instanceof Error ? error.message : "Unknown error occurred",
        loading: false,
      }))
    }
  }, [])

  const fetchTopPlayers = useCallback(async () => {
    try {
      setData((prev) => ({ ...prev, loading: true, error: null }))

      const response: NCPAApiResponse<NCPAPlayer[]> =
        await getTopPlayersByRating(10)

      if (response.success && response.data) {
        setData((prev) => ({
          ...prev,
          topPlayers: response.data!,
          loading: false,
        }))
      } else {
        setData((prev) => ({
          ...prev,
          error: response.error || "Failed to fetch top players",
          loading: false,
        }))
      }
    } catch (error) {
      setData((prev) => ({
        ...prev,
        error:
          error instanceof Error ? error.message : "Unknown error occurred",
        loading: false,
      }))
    }
  }, [])

  const fetchTournaments = useCallback(async () => {
    try {
      setData((prev) => ({
        ...prev,
        tournamentsLoading: true,
        tournamentsError: null,
      }))

      // Use hardcoded tournament data instead of API
      const hardcodedTournaments: NCPATournament[] = [
        {
          name: "Collegiate Pickleball Fundraiser - Samford University",
          venue: "TBD",
          venue_address: "TBD",
          registration_open: "2025-06-01",
          registration_close: "2025-09-20",
          begin_date: "2025-09-20",
          end_date: "2025-09-20",
          university: 0,
          number_of_bids: null,
          nationals: 0,
          num_teams: 0,
          num_players: 0,
          player_event_types: null,
          bracket_event_types:
            "Mens Doubles<;;>Mens Singles<;;>Mixed Doubles<;;>Womens Doubles<;;>Womens Singles",
          team_hosts: "15<::>Samford University",
        },
        {
          name: "INDIANA - NCPA Regional Championship",
          venue: "The Picklr - Noblesville",
          venue_address: "9847 Cumberland Pointe Blvd, Noblesville, IN 46060",
          registration_open: "2025-07-31",
          registration_close: "2025-10-04",
          begin_date: "2025-10-04",
          end_date: "2025-10-05",
          university: 1,
          number_of_bids: 8,
          nationals: 0,
          num_teams: 36,
          num_players: 0,
          player_event_types: null,
          bracket_event_types:
            "Mens Doubles<;;>Mens Singles<;;>Mixed Doubles<;;>Nationals<;;>Womens Doubles<;;>Womens Singles",
          team_hosts: null,
        },
        {
          name: "TEXAS - NCPA Regional Championship",
          venue: "Oasis Pickleball Club",
          venue_address: "5757 State Hwy 205, Rockwall, TX 75032",
          registration_open: "2025-07-31",
          registration_close: "2025-11-08",
          begin_date: "2025-11-08",
          end_date: "2025-11-09",
          university: 1,
          number_of_bids: 8,
          nationals: 0,
          num_teams: 16,
          num_players: 0,
          player_event_types: null,
          bracket_event_types:
            "Mens Doubles<;;>Mens Singles<;;>Mixed Doubles<;;>Nationals<;;>Womens Doubles<;;>Womens Singles",
          team_hosts: null,
        },
        {
          name: "FLORIDA - NCPA Regional Championship",
          venue: "The Hub Jacksonville",
          venue_address: "2525 Country Club Blvd. Orange Park, Fl 32073",
          registration_open: "2025-07-31",
          registration_close: "2025-11-15",
          begin_date: "2025-11-15",
          end_date: "2025-11-16",
          university: 1,
          number_of_bids: 8,
          nationals: 0,
          num_teams: 28,
          num_players: 0,
          player_event_types: null,
          bracket_event_types:
            "Mens Doubles<;;>Mens Singles<;;>Mixed Doubles<;;>Nationals<;;>Womens Doubles<;;>Womens Singles",
          team_hosts: null,
        },
        {
          name: "2026 NCPA National Collegiate Pickleball Championship",
          venue: "Arch Pickleball and Badminton",
          venue_address: "11333 Blake Dr, Bridgeton, MO 63044",
          registration_open: "2025-07-31",
          registration_close: "2026-02-28",
          begin_date: "2026-02-27",
          end_date: "2026-03-01",
          university: 1,
          number_of_bids: null,
          nationals: 1,
          num_teams: 0,
          num_players: 0,
          player_event_types: null,
          bracket_event_types: null,
          team_hosts: null,
        },
        {
          name: "UTAH - NCPA Regional Championship",
          venue: "Club Pickleball USA - OREM",
          venue_address: "1330 Sandhill Rd, Orem, UT 84058",
          registration_open: "2025-07-31",
          registration_close: "2025-10-11",
          begin_date: "2025-10-11",
          end_date: "2025-10-12",
          university: 1,
          number_of_bids: 8,
          nationals: 0,
          num_teams: 11,
          num_players: 0,
          player_event_types: null,
          bracket_event_types:
            "Mens Doubles<;;>Mens Singles<;;>Mixed Doubles<;;>Nationals<;;>Womens Doubles<;;>Womens Singles",
          team_hosts: null,
        },
        {
          name: "CALIFORNIA - NCPA Regional Championship",
          venue: "Barnes Tennis Center",
          venue_address: "4490 W Point Loma Blvd, San Diego, CA 92107",
          registration_open: "2025-07-31",
          registration_close: "2025-10-18",
          begin_date: "2025-10-18",
          end_date: "2025-10-19",
          university: 1,
          number_of_bids: 8,
          nationals: 0,
          num_teams: 33,
          num_players: 0,
          player_event_types: null,
          bracket_event_types:
            "Mens Doubles<;;>Mens Singles<;;>Mixed Doubles<;;>Nationals<;;>Womens Doubles<;;>Womens Singles",
          team_hosts: null,
        },
        {
          name: "VIRGINIA - NCPA Regional Championship",
          venue: "Pickleball Virginia Beach",
          venue_address: "928 S Birdneck Rd, Virginia",
          registration_open: "2025-07-31",
          registration_close: "2025-10-25",
          begin_date: "2025-10-25",
          end_date: "2025-10-26",
          university: 1,
          number_of_bids: 8,
          nationals: 0,
          num_teams: 34,
          num_players: 0,
          player_event_types: null,
          bracket_event_types:
            "Mens Doubles<;;>Mens Singles<;;>Mixed Doubles<;;>Nationals<;;>Womens Doubles<;;>Womens Singles",
          team_hosts: null,
        },
      ]

      // Filter tournaments to only show future events and sort by date (soonest first)
      const today = new Date()
      today.setHours(0, 0, 0, 0) // Reset time to start of day for accurate comparison

      const futureTournaments = hardcodedTournaments.filter((tournament) => {
        const tournamentDate = new Date(tournament.begin_date)
        return tournamentDate >= today
      })

      const sortedTournaments = futureTournaments.sort((a, b) => {
        const dateA = new Date(a.begin_date)
        const dateB = new Date(b.begin_date)
        return dateA.getTime() - dateB.getTime()
      })

      setData((prev) => ({
        ...prev,
        tournaments: sortedTournaments,
        tournamentsLoading: false,
      }))
    } catch (error) {
      setData((prev) => ({
        ...prev,
        tournamentsError:
          error instanceof Error ? error.message : "Unknown error occurred",
        tournamentsLoading: false,
      }))
    }
  }, [])

  const fetchDataFreshness = useCallback(async () => {
    try {
      const freshness = await getDataFreshness()
      setData((prev) => ({
        ...prev,
        dataFreshness: freshness,
      }))
    } catch (error) {
      console.error("Error fetching data freshness:", error)
    }
  }, [])

  const refreshData = useCallback(async () => {
    // Fetch core data (players, universities, top players)
    await Promise.all([fetchPlayers(), fetchUniversities(), fetchTopPlayers()])

    // Fetch tournaments and data freshness
    try {
      await Promise.all([fetchTournaments(), fetchDataFreshness()])
    } catch (error) {
      console.warn(
        "Failed to fetch tournaments or freshness, but continuing with other data:",
        error
      )
    }
  }, [
    fetchPlayers,
    fetchUniversities,
    fetchTopPlayers,
    fetchTournaments,
    fetchDataFreshness,
  ])

  const refreshPlayers = useCallback(async () => {
    await Promise.all([fetchPlayers(), fetchTopPlayers()])
  }, [fetchPlayers, fetchTopPlayers])

  const refreshUniversities = useCallback(async () => {
    await fetchUniversities()
  }, [fetchUniversities])

  const getPlayersByCollege = useCallback(
    async (collegeName: string): Promise<NCPAPlayer[]> => {
      try {
        const response = await getFilteredPlayers({ college: collegeName })
        return response.success && response.data ? response.data : []
      } catch (error) {
        console.error("Error fetching players by college:", error)
        return []
      }
    },
    []
  )

  const getFilteredPlayersData = useCallback(
    async (filters?: {
      division?: number
      gender?: string
      minRating?: number
      maxRating?: number
      college?: string
    }): Promise<NCPAPlayer[]> => {
      try {
        const response = await getFilteredPlayers(filters)
        return response.success && response.data ? response.data : []
      } catch (error) {
        console.error("Error fetching filtered players:", error)
        return []
      }
    },
    []
  )

  // Load initial data only after startup is complete
  useEffect(() => {
    if (isStartupComplete) {
      refreshData()
    }
  }, [refreshData, isStartupComplete])

  return {
    ...data,
    players: data.players,
    tournaments: data.tournaments,
    tournamentsLoading: data.tournamentsLoading,
    tournamentsError: data.tournamentsError,
    dataFreshness: data.dataFreshness,
    refreshData,
    refreshPlayers,
    refreshUniversities,
    getPlayersByCollege,
    getFilteredPlayers: getFilteredPlayersData,
  }
}
