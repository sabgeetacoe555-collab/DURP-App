# NCPA Tournaments API Integration

This document describes the new NCPA tournaments functionality added to the NCPAService.

## Overview

The NCPA tournaments API provides access to current and upcoming pickleball tournaments organized by the National Collegiate Pickleball Association.

## API Endpoint

- **Base URL**: `https://tournaments.ncpaofficial.com/api`
- **Tournaments Endpoint**: `/get-tournaments`

## Available Functions

### 1. `getTournaments()`

Fetches all tournaments (both current and upcoming).

```typescript
import { getTournaments } from "../services/NCPAService"

const response = await getTournaments()
if (response.success) {
  console.log(`Current: ${response.data?.current.length}`)
  console.log(`Upcoming: ${response.data?.upcoming.length}`)
}
```

### 2. `getUpcomingTournaments()`

Fetches only upcoming tournaments.

```typescript
import { getUpcomingTournaments } from "../services/NCPAService"

const response = await getUpcomingTournaments()
if (response.success) {
  response.data?.forEach((tournament) => {
    console.log(`${tournament.name} - ${tournament.date}`)
  })
}
```

### 3. `getCurrentTournaments()`

Fetches only current tournaments.

```typescript
import { getCurrentTournaments } from "../services/NCPAService"

const response = await getCurrentTournaments()
if (response.success) {
  response.data?.forEach((tournament) => {
    console.log(`${tournament.name} - ${tournament.date}`)
  })
}
```

## Data Types

### NCPATournament

```typescript
interface NCPATournament {
  date: string // Tournament date (YYYY-MM-DD)
  bracket_event_types: string // Available event types (e.g., "Mens Doubles<;;>Mens Singles")
  details: string // HTML formatted tournament details
  end_date: string // Tournament end date
  name: string // Tournament name
  nationals: number // Whether it's a nationals tournament (0/1)
  number_of_bids: number | null // Number of bids available
  num_players: number // Number of registered players
  num_teams: number // Number of registered teams
  player_event_types: string | null // Player event types
  registration_close: string // Registration close date
  registration_open: string // Registration open date
  team_hosts: string // Hosting teams/universities
  university: number // University identifier
  venue: string // Tournament venue
  venue_address: string // Venue address
}
```

### NCPATournamentsResponse

```typescript
interface NCPATournamentsResponse {
  current: NCPATournament[] // Currently running tournaments
  upcoming: NCPATournament[] // Upcoming tournaments
}
```

## Example Usage

See `examples/ncpaTournamentsExample.ts` for comprehensive examples of how to use these functions.

### Basic Usage

```typescript
import { getUpcomingTournaments } from "../services/NCPAService"

// Get upcoming tournaments
const response = await getUpcomingTournaments()

if (response.success && response.data) {
  // Display tournament information
  response.data.forEach((tournament) => {
    console.log(`Tournament: ${tournament.name}`)
    console.log(`Date: ${tournament.date}`)
    console.log(`Venue: ${tournament.venue}`)
    console.log(`Events: ${tournament.bracket_event_types}`)
    console.log(
      `Registration: ${tournament.registration_open} to ${tournament.registration_close}`
    )
  })
} else {
  console.error("Failed to fetch tournaments:", response.error)
}
```

### Filtering Tournaments

```typescript
// Filter by event type
const doublesTournaments = tournaments.filter((t) =>
  t.bracket_event_types.toLowerCase().includes("doubles")
)

// Filter by date range
const upcomingThisMonth = tournaments.filter((t) => {
  const tournamentDate = new Date(t.date)
  const now = new Date()
  const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1)
  return tournamentDate >= now && tournamentDate < nextMonth
})
```

## Error Handling

All functions return a standardized response format:

```typescript
interface NCPAApiResponse<T> {
  success: boolean
  data?: T
  error?: string
  statusCode?: number
}
```

Always check the `success` property before accessing `data`:

```typescript
const response = await getTournaments()
if (response.success) {
  // Safe to access response.data
  const tournaments = response.data
} else {
  // Handle error
  console.error("Error:", response.error)
}
```

## Configuration

You can pass optional configuration to customize API calls:

```typescript
const config = {
  baseUrl: "https://tournaments.ncpaofficial.com/api",
  timeout: 15000, // 15 seconds
}

const response = await getTournaments(config)
```

## Notes

- The API returns HTML-formatted details in the `details` field
- Event types are separated by `<;;>` in the `bracket_event_types` field
- Team hosts are separated by `<::>` in the `team_hosts` field
- All dates are in YYYY-MM-DD format
- The API may return empty arrays for current/upcoming tournaments if none are available
