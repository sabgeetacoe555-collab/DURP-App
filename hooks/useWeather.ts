import { useState, useEffect } from "react"
import { getCurrentWeather, WeatherInfo } from "@/services/localWeatherService"
import { useLocation } from "@/contexts/LocationContext"

export const useWeather = () => {
  const [weather, setWeather] = useState<WeatherInfo | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { effectiveLocation, isLoading: locationLoading } = useLocation()

  const fetchWeather = async () => {
    try {
      setLoading(true)
      setError(null)

      if (!effectiveLocation) {
        setError("No location available")
        return
      }

      // Get weather for the effective location (current or home)
      const weatherData = await getCurrentWeather({
        latitude: effectiveLocation.latitude,
        longitude: effectiveLocation.longitude,
      })

      if (weatherData) {
        setWeather(weatherData)
      }
    } catch (err) {
      setError("Failed to fetch weather data")
      console.error("Weather fetch error:", err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (effectiveLocation && !locationLoading) {
      fetchWeather()
    }
  }, [effectiveLocation, locationLoading])

  useEffect(() => {
    if (effectiveLocation && !locationLoading) {
      // Refresh weather every 30 minutes
      const interval = setInterval(fetchWeather, 30 * 60 * 1000)
      return () => clearInterval(interval)
    }
  }, [effectiveLocation, locationLoading])

  return {
    weather,
    loading,
    error,
    refetch: fetchWeather,
  }
}
