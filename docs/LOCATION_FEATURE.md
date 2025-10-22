# Location Feature Documentation

## Overview

The Net Gains app now includes location functionality to help users find nearby pickleball sessions and improve the social scheduling experience. Users can set their location during signup and update it in their profile.

## Features

### Location Permissions

- **Foreground Location Access**: The app requests permission to access location when the app is in use
- **User-Friendly Permission Requests**: Clear explanations of why location access is needed
- **Graceful Fallback**: Users can manually enter their location if they don't grant permission

### Location Data Storage

- **Coordinates**: Latitude and longitude are stored for precise location tracking
- **Full Address**: Complete address stored for routing/navigation purposes
- **Display Address**: City, state, zip format for clean UI display
- **Timestamp**: When the location was last updated

### User Interface

- **Signup Screen**: Optional location field with "Use Current Location" button
- **Profile Screen**: Location field with ability to update current location
- **Visual Feedback**: Loading states and clear button labels

## Database Schema

The `users` table has been extended with location fields:

```sql
ALTER TABLE users ADD COLUMN location_latitude DECIMAL(10, 8);
ALTER TABLE users ADD COLUMN location_longitude DECIMAL(11, 8);
ALTER TABLE users ADD COLUMN location_address TEXT;
ALTER TABLE users ADD COLUMN location_display_address TEXT;
ALTER TABLE users ADD COLUMN location_updated_at TIMESTAMP WITH TIME ZONE;
```

## Implementation Details

### Location Service (`services/locationService.ts`)

The location service provides the following functionality:

- **`getCurrentLocation()`**: Requests permissions and gets current location with both full and display addresses
- **`checkLocationPermissions()`**: Checks if location permissions are granted
- **`getAddressFromCoordinates()`**: Converts coordinates to human-readable address
- **`getCoordinatesFromAddress()`**: Converts address to coordinates

### Auth Service Integration

The signup process now accepts optional location data and saves it to the user's profile:

```typescript
await authService.signUp(email, password, name, location)
```

### Profile Management

Users can update their location in the profile screen:

- Manual address entry
- "Use Current Location" button for automatic detection
- Display address (city, state, zip) shown in UI for better readability
- Full address stored for future routing/navigation features
- Location data is saved to the database when profile is updated

## Privacy & Security

- **Foreground Only**: Location access is only requested when the app is in use
- **Optional**: Users can choose not to provide location data
- **Clear Purpose**: Permission requests explain that location is used to find nearby sessions
- **User Control**: Users can update or remove their location at any time

## Future Enhancements

This location foundation enables future features:

- **Session Discovery**: Find nearby pickleball sessions
- **Distance Filtering**: Filter sessions by distance from user
- **Location-Based Notifications**: Notify users of nearby sessions
- **Friend Location**: See where friends are playing (with permission)

## Technical Requirements

- **expo-location**: For location access and geocoding
- **Database Migration**: Applied to add location fields to users table
- **App Configuration**: Location permissions configured in app.json

## Usage Examples

### Getting User Location

```typescript
import { locationService } from "@/services/locationService"

const location = await locationService.getCurrentLocation()
if (location) {
  console.log(`User is at: ${location.address}`)
  console.log(`Coordinates: ${location.latitude}, ${location.longitude}`)
}
```

### Saving Location to Profile

```typescript
const { error } = await supabase
  .from("users")
  .update({
    location_latitude: location.latitude,
    location_longitude: location.longitude,
    location_address: location.address,
    location_updated_at: new Date().toISOString(),
  })
  .eq("id", user.id)
```
