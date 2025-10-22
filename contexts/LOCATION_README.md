# Location Context & Hook

A centralized location management system that provides both current location and home location with intelligent fallback logic.

## **Features**

✅ **Smart Location Logic**: Current location (if permission granted) → Home location (fallback)  
✅ **Permission Management**: Handles location permissions centrally  
✅ **Automatic Updates**: Refreshes location when needed  
✅ **Performance**: Caches location data to avoid repeated requests  
✅ **Consistent API**: Same location logic across all components

## **How It Works**

### **Location Priority:**

1. **Current Location**: If user grants permission and location is available
2. **Home Location**: Fallback to user's saved home location from database
3. **No Location**: If neither is available

### **Permission Flow:**

1. **App Start**: Checks existing permissions
2. **No Permission**: Requests location access with helpful guidance
3. **Permission Granted**: Gets current location
4. **Permission Denied**: Falls back to home location

## **Usage Examples**

### **1. Basic Usage in Component**

```tsx
import { useLocation } from "@/contexts/LocationContext"

function MyComponent() {
  const {
    effectiveLocation,
    currentLocation,
    homeLocation,
    isLoading,
    hasPermission,
  } = useLocation()

  if (isLoading) {
    return <Text>Getting your location...</Text>
  }

  if (effectiveLocation) {
    return (
      <Text>
        Weather for: {effectiveLocation.latitude}, {effectiveLocation.longitude}
      </Text>
    )
  }

  return <Text>No location available</Text>
}
```

### **2. Weather Component (Auto-refresh)**

```tsx
import { useLocation } from "@/contexts/LocationContext"
import { useWeather } from "@/hooks/useWeather"

function WeatherHeader() {
  const { effectiveLocation, hasPermission } = useLocation()
  const { weather, loading } = useWeather()

  if (!effectiveLocation) {
    return <Text>Location needed for weather</Text>
  }

  return (
    <View>
      <Text>{weather?.temperature}°F</Text>
      <Text>{weather?.description}</Text>
      {!hasPermission && (
        <Text style={{ fontSize: 12, color: "gray" }}>Using home location</Text>
      )}
    </View>
  )
}
```

### **3. Find Games Component**

```tsx
import { useLocation } from "@/contexts/LocationContext"

function FindGames() {
  const { effectiveLocation, requestLocationPermission, hasPermission } =
    useLocation()

  const handleFindGames = async () => {
    if (!hasPermission) {
      await requestLocationPermission()
    }

    if (effectiveLocation) {
      // Search for games near effectiveLocation
      searchGamesNearby(effectiveLocation)
    }
  }

  return (
    <Button
      title="Find Games in Your Area"
      onPress={handleFindGames}
      disabled={!effectiveLocation}
    />
  )
}
```

### **4. Update Home Location**

```tsx
import { useLocation } from "@/contexts/LocationContext"

function ProfileScreen() {
  const { updateHomeLocation, effectiveLocation } = useLocation()

  const handleSetHomeLocation = async () => {
    if (effectiveLocation) {
      try {
        await updateHomeLocation(effectiveLocation)
        Alert.alert("Success", "Home location updated!")
      } catch (error) {
        Alert.alert("Error", "Failed to update home location")
      }
    }
  }

  return (
    <Button
      title="Set Current Location as Home"
      onPress={handleSetHomeLocation}
    />
  )
}
```

## **API Reference**

### **LocationContext Values**

| Property            | Type                       | Description                                   |
| ------------------- | -------------------------- | --------------------------------------------- |
| `effectiveLocation` | `LocationData \| null`     | **Primary location to use** - current or home |
| `currentLocation`   | `LocationData \| null`     | User's current GPS location                   |
| `homeLocation`      | `LocationData \| null`     | User's saved home location                    |
| `isLoading`         | `boolean`                  | Whether location is being fetched             |
| `hasPermission`     | `boolean`                  | Whether location permission is granted        |
| `permissionStatus`  | `PermissionStatus \| null` | Detailed permission status                    |

### **Methods**

| Method                         | Description                             |
| ------------------------------ | --------------------------------------- |
| `requestLocationPermission()`  | Request location access from user       |
| `updateCurrentLocation()`      | Manually refresh current location       |
| `updateHomeLocation(location)` | Save new home location to database      |
| `refreshLocation()`            | Refresh both current and home locations |

### **LocationData Interface**

```typescript
interface LocationData {
  latitude: number
  longitude: number
  accuracy: number
  timestamp: number
}
```

## **Integration Points**

### **Components That Use This:**

1. **Weather Header**: Shows weather for effective location
2. **Find Games**: Searches for sessions near effective location
3. **Session Creation**: Pre-fills location fields
4. **Profile**: Manages home location settings
5. **Maps**: Centers on effective location

### **Automatic Triggers:**

- **App Start**: Initializes location and permissions
- **Permission Changes**: Automatically updates when permissions change
- **User Login**: Loads home location from database
- **Location Updates**: Refreshes current location periodically

## **Benefits**

✅ **No Duplicate Logic**: Single location management across app  
✅ **Better UX**: Consistent location behavior everywhere  
✅ **Performance**: Cached location data, smart refresh  
✅ **Reliability**: Graceful fallback from current to home location  
✅ **Maintainability**: Centralized location logic

## **Best Practices**

1. **Always use `effectiveLocation`** for location-dependent features
2. **Check `isLoading`** before using location data
3. **Handle permission states** gracefully in UI
4. **Use `refreshLocation()`** when you need fresh data
5. **Update home location** when user explicitly sets it
