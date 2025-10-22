import React, { useState, useEffect } from "react"
import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  ScrollView,
} from "react-native"
import { Ionicons } from "@expo/vector-icons"
import { useColorScheme } from "@/components/useColorScheme"
import Colors from "@/constants/Colors"

interface LocationSuggestion {
  place_id: string
  description: string
  structured_formatting: {
    main_text: string
    secondary_text: string
  }
}

interface SimpleLocationAutocompleteProps {
  value: string
  onChangeText: (text: string) => void
  onLocationSelect: (location: string) => void
  placeholder?: string
  style?: any
}

export default function SimpleLocationAutocomplete({
  value,
  onChangeText,
  onLocationSelect,
  placeholder = "Enter city or location",
  style,
}: SimpleLocationAutocompleteProps) {
  const [suggestions, setSuggestions] = useState<LocationSuggestion[]>([])
  const [loading, setLoading] = useState(false)
  const [showSuggestions, setShowSuggestions] = useState(false)
  const colorScheme = useColorScheme()
  const colors = useColorScheme()

  const searchPlaces = async (input: string) => {
    if (!input.trim() || input.length < 2) {
      setSuggestions([])
      setShowSuggestions(false)
      return
    }

    setLoading(true)
    try {
      const GOOGLE_PLACES_API_KEY =
        process.env.EXPO_PUBLIC_GOOGLE_PLACES_API_KEY
      if (!GOOGLE_PLACES_API_KEY) {
        console.error("Google Places API key not found")
        return
      }

      const response = await fetch(
        `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${encodeURIComponent(
          input
        )}&types=(cities)&key=${GOOGLE_PLACES_API_KEY}`
      )

      const data = await response.json()

      if (data.predictions) {
        setSuggestions(data.predictions.slice(0, 5)) // Limit to 5 suggestions
        setShowSuggestions(true)
      }
    } catch (error) {
      console.error("Error fetching place suggestions:", error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      searchPlaces(value)
    }, 300) // Debounce API calls

    return () => clearTimeout(timeoutId)
  }, [value])

  const handleSuggestionPress = (suggestion: LocationSuggestion) => {
    const selectedText = suggestion.description
    onChangeText(selectedText)
    onLocationSelect(selectedText)
    setShowSuggestions(false)
    setSuggestions([])
  }

  const handleTextChange = (text: string) => {
    onChangeText(text)
    if (!text.trim()) {
      setShowSuggestions(false)
      setSuggestions([])
    }
  }

  return (
    <View style={[styles.container, style]}>
      <TextInput
        style={[
          styles.textInput,
          {
            color: colors.text,
            borderColor: colors.text + "20",
            backgroundColor: colors.background,
          },
        ]}
        value={value}
        onChangeText={handleTextChange}
        placeholder={placeholder}
        placeholderTextColor={colors.text + "60"}
        autoCapitalize="words"
        autoCorrect={false}
        returnKeyType="search"
        autoFocus={true}
      />

      {loading && (
        <View style={styles.loadingContainer}>
          <Text style={[styles.loadingText, { color: colors.text }]}>
            Searching...
          </Text>
        </View>
      )}

      {showSuggestions && suggestions.length > 0 && (
        <View style={styles.suggestionsContainer}>
          <ScrollView style={styles.suggestionsScroll} nestedScrollEnabled>
            {suggestions.map((suggestion) => (
              <Pressable
                key={suggestion.place_id}
                style={styles.suggestionItem}
                onPress={() => handleSuggestionPress(suggestion)}
              >
                <Ionicons name="location-outline" size={16} color="#666" />
                <View style={styles.suggestionText}>
                  <Text
                    style={{
                      fontSize: 14,
                      fontWeight: "500",
                      color: "#000000",
                    }}
                  >
                    {suggestion.structured_formatting?.main_text ||
                      suggestion.description}
                  </Text>
                  <Text
                    style={{
                      fontSize: 12,
                      marginTop: 2,
                      color: "#666666",
                    }}
                  >
                    {suggestion.structured_formatting?.secondary_text}
                  </Text>
                </View>
              </Pressable>
            ))}
          </ScrollView>
        </View>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    position: "relative",
  },
  textInput: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    minHeight: 50,
  },
  loadingContainer: {
    padding: 8,
    alignItems: "center",
  },
  loadingText: {
    fontSize: 12,
    opacity: 0.7,
  },
  suggestionsContainer: {
    position: "absolute",
    top: 60, // Position below input
    left: 0,
    right: 0,
    borderWidth: 1,
    borderColor: "#e0e0e0",
    borderRadius: 8,
    maxHeight: 200,
    zIndex: 1000,
    backgroundColor: "#ffffff",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
  },
  suggestionsScroll: {
    maxHeight: 200,
  },
  suggestionItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
    gap: 10,
  },
  suggestionText: {
    flex: 1,
  },
  mainText: {
    fontSize: 14,
    fontWeight: "500",
  },
  secondaryText: {
    fontSize: 12,
    marginTop: 2,
  },
})
