import React from "react"
import { View, TextInput, Pressable } from "react-native"
import { Ionicons } from "@expo/vector-icons"
import { useColorScheme } from "../../components/useColorScheme"

interface SearchBarProps {
  searchQuery: string
  setSearchQuery: (query: string) => void
}

export default function SearchBar({
  searchQuery,
  setSearchQuery,
}: SearchBarProps) {
  const colors = useColorScheme()

  return (
    <View style={styles.searchSection}>
      <View
        style={[styles.searchContainer, { borderColor: colors.text + "20" }]}
      >
        <Ionicons
          name="search"
          size={20}
          color={colors.text + "60"}
          style={styles.searchIcon}
        />
        <TextInput
          style={[styles.searchInput, { color: colors.text }]}
          placeholder="Search groups, friends, or contacts..."
          placeholderTextColor={colors.text + "60"}
          value={searchQuery}
          onChangeText={setSearchQuery}
          autoCapitalize="none"
          autoCorrect={false}
          returnKeyType="search"
          onSubmitEditing={() => {}} // No action on submit for now
        />
        {searchQuery.length > 0 && (
          <Pressable
            onPress={() => setSearchQuery("")}
            style={styles.clearButton}
          >
            <Ionicons
              name="close-circle"
              size={20}
              color={colors.text + "60"}
            />
          </Pressable>
        )}
      </View>
    </View>
  )
}

const styles = {
  searchSection: {
    marginBottom: 20,
  },
  searchContainer: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    backgroundColor: "white",
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    paddingVertical: 8,
  },
  clearButton: {
    marginLeft: 8,
    padding: 4,
  },
}
