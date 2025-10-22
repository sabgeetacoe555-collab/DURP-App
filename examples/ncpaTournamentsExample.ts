import { NCPATournament } from "../types/ncpa"

/**
 * Example usage of the NCPA tournament data structure
 */

// Example hardcoded tournament data
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
]

// Example 1: Get all tournaments
export function getAllTournaments(): NCPATournament[] {
  return hardcodedTournaments
}

// Example 2: Get upcoming tournaments (sorted by date)
export function getUpcomingTournaments(): NCPATournament[] {
  const today = new Date()
  today.setHours(0, 0, 0, 0) // Reset time to start of day for accurate comparison

  return hardcodedTournaments
    .filter((tournament) => {
      const tournamentDate = new Date(tournament.begin_date)
      return tournamentDate >= today
    })
    .sort(
      (a, b) =>
        new Date(a.begin_date).getTime() - new Date(b.begin_date).getTime()
    )
}

// Example 3: Get tournaments by region
export function getTournamentsByRegion(region: string): NCPATournament[] {
  return hardcodedTournaments.filter((tournament) =>
    tournament.name.toUpperCase().includes(region.toUpperCase())
  )
}

// Example 4: Filter tournaments by event type
export function filterTournamentsByEventType(
  tournaments: NCPATournament[],
  eventType: string
): NCPATournament[] {
  return tournaments.filter(
    (tournament) =>
      tournament.bracket_event_types
        ?.toLowerCase()
        .includes(eventType.toLowerCase()) || false
  )
}

// Example 5: Filter tournaments by date range
export function filterTournamentsByDateRange(
  tournaments: NCPATournament[],
  startDate: string,
  endDate: string
): NCPATournament[] {
  const start = new Date(startDate)
  const end = new Date(endDate)

  return tournaments.filter((tournament) => {
    const tournamentDate = new Date(tournament.begin_date)
    return tournamentDate >= start && tournamentDate <= end
  })
}

// Example 6: Get tournament details for a specific tournament
export function getTournamentDetails(
  tournaments: NCPATournament[],
  tournamentName: string
): NCPATournament | undefined {
  return tournaments.find((tournament) =>
    tournament.name.toLowerCase().includes(tournamentName.toLowerCase())
  )
}

// Example 7: Format tournament date for display
export function formatTournamentDate(dateString: string): string {
  const today = new Date()
  const eventDate = new Date(dateString)
  const diffTime = eventDate.getTime() - today.getTime()
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

  if (diffDays === 0) return "Today"
  if (diffDays === 1) return "Tomorrow"
  if (diffDays > 1 && diffDays <= 7) return `In ${diffDays} days`

  return eventDate.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  })
}

// Example 8: Format event types for display
export function formatEventTypes(eventTypes: string | null): string {
  if (!eventTypes) return "Event details TBD"

  const types = eventTypes.split("<;;>")
  if (types.length <= 2) {
    return types.join(", ")
  } else {
    return `${types.slice(0, 2).join(", ")} +${types.length - 2} more`
  }
}

// Example 9: Get top 3 upcoming tournaments
export function getTopUpcomingTournaments(): NCPATournament[] {
  return getUpcomingTournaments().slice(0, 3)
}

// Example 10: Display tournament information
export function displayTournamentInfo(tournament: NCPATournament): void {
  console.log(`Tournament: ${tournament.name}`)
  console.log(`Date: ${formatTournamentDate(tournament.begin_date)}`)
  console.log(`Venue: ${tournament.venue}`)
  console.log(`Address: ${tournament.venue_address}`)
  console.log(`Events: ${formatEventTypes(tournament.bracket_event_types)}`)
  console.log(
    `Registration: ${tournament.registration_open} to ${tournament.registration_close}`
  )
  console.log(`Teams: ${tournament.num_teams}`)
  console.log(`Nationals: ${tournament.nationals ? "Yes" : "No"}`)
  console.log("---")
}
