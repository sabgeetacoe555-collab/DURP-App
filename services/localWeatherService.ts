// Local Weather Service for fetching weather data based on coordinates
import * as Location from "expo-location"

export interface WeatherData {
  current: {
    temperature_2m: number
    relative_humidity_2m: number
    wind_speed_10m: number
  }
  hourly: {
    time: string[]
    temperature_2m: number[]
    relative_humidity_2m: number[]
  }
}

export interface WeatherInfo {
  temperature: number
  humidity: number
  windSpeed: number
  condition: "sunny" | "cloudy" | "rainy" | "partly-cloudy"
  city: string
  cityAbbreviation: string
}

const getWeather = async (
  latitude: number,
  longitude: number
): Promise<WeatherData> => {
  const response = await fetch(
    `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,relative_humidity_2m,wind_speed_10m&hourly=temperature_2m,relative_humidity_2m&timezone=auto`
  )
  return response.json()
}

// Convert Celsius to Fahrenheit
const celsiusToFahrenheit = (celsius: number): number => {
  return Math.round((celsius * 9) / 5 + 32)
}

export const getCurrentWeather = async (location: {
  latitude: number
  longitude: number
}): Promise<WeatherInfo | null> => {
  try {
    const { latitude, longitude } = location
    console.log("🌤️ Getting weather for coordinates:", { latitude, longitude })

    // Get city name from coordinates
    let city = "Unknown"
    let cityAbbreviation = "U"

    try {
      const addressResults = await Location.reverseGeocodeAsync({
        latitude,
        longitude,
      })

      if (addressResults && addressResults.length > 0) {
        const address = addressResults[0]
        city = address.city || address.subregion || address.region || "Unknown"

        // Create abbreviation: multiple words = first initials, single word = first 3 letters
        if (city.includes(" ")) {
          // Multiple words: take first letter of each word
          cityAbbreviation = city
            .split(" ")
            .map((word) => word.charAt(0))
            .join("")
            .toUpperCase()
        } else {
          // Single word: take first 3 letters
          cityAbbreviation = city.substring(0, 3).toUpperCase()
        }
      }
    } catch (error) {
      console.log("Could not get city name from coordinates:", error)
    }

    // Fetch weather data
    const weatherData = await getWeather(latitude, longitude)

    if (!weatherData.current) {
      console.log("No weather data received")
      return null
    }

    // Determine weather condition based on humidity and other factors
    const humidity = weatherData.current.relative_humidity_2m
    let condition: WeatherInfo["condition"] = "sunny"

    if (humidity > 80) {
      condition = "rainy"
    } else if (humidity > 60) {
      condition = "cloudy"
    } else if (humidity > 40) {
      condition = "partly-cloudy"
    }

    return {
      temperature: celsiusToFahrenheit(weatherData.current.temperature_2m),
      humidity: weatherData.current.relative_humidity_2m,
      windSpeed: weatherData.current.wind_speed_10m,
      condition,
      city,
      cityAbbreviation,
    }
  } catch (error) {
    console.error("Error fetching weather:", error)
    return null
  }
}

export const getWeatherIcon = (condition: WeatherInfo["condition"]): string => {
  switch (condition) {
    case "sunny":
      return "sun"
    case "cloudy":
      return "cloud"
    case "rainy":
      return "cloud-rain"
    case "partly-cloudy":
      return "cloud-sun"
    default:
      return "sun"
  }
}
