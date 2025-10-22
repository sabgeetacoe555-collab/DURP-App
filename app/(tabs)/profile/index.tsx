import React, { useState, useEffect } from "react"
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  Alert,
  ActivityIndicator,
  TextInput,
  ScrollView,
} from "react-native"
import { useRouter } from "expo-router"
import { useAuth } from "@/hooks/useAuth"
import { authService } from "@/services/authService"
import { locationService, LocationData } from "@/services/locationService"
import Colors from "@/constants/Colors"
import { useColorScheme } from "@/components/useColorScheme"
import { supabase } from "@/lib/supabase"
import DuprConnectionModal from "@/components/DuprConnectionModal"
import LocationAutocomplete from "@/components/LocationAutocomplete"
import FontAwesome5 from "@expo/vector-icons/FontAwesome5"
import CustomHeader from "@/components/CustomHeader"

export default function ProfileScreen() {
  const router = useRouter()
  const { user, loading, getUserDisplayName } = useAuth()
  const colors = useColorScheme()

  const [birthday, setBirthday] = useState("")
  const [gender, setGender] = useState("")
  const [name, setName] = useState("")
  const [phone, setPhone] = useState("")
  const [duprId, setDuprId] = useState("")
  const [location, setLocation] = useState<LocationData | null>(null)
  const [locationAddress, setLocationAddress] = useState("")
  const [isSaving, setIsSaving] = useState(false)
  const [showDuprModal, setShowDuprModal] = useState(false)
  const [locationLoading, setLocationLoading] = useState(false)
  const [originalData, setOriginalData] = useState({
    name: "",
    birthday: "",
    gender: "",
    phone: "",
    locationAddress: "",
    location: null as LocationData | null,
  })

  // Load user data on component mount
  useEffect(() => {
    if (user && !isSaving) {
      loadUserData()
    }
  }, [user?.id]) // Only reload when user ID changes, not when user metadata changes

  const loadUserData = async () => {
    if (user?.user_metadata) {
      const userData = {
        name: user.user_metadata.full_name || "",
        birthday: user.user_metadata.birthday || "",
        gender: user.user_metadata.gender || "",
        phone: "",
        duprRatingMin: "",
        duprRatingMax: "",
        locationAddress: "",
      }
      setName(userData.name)
      setBirthday(userData.birthday)
      setGender(userData.gender)

      // Load DUPR rating and location from users table
      console.log("🔍 PROFILE LOAD - Loading user profile for user:", user.id)
      try {
        let { data: userProfile, error } = await supabase
          .from("users")
          .select(
            "dupr_rating_singles, dupr_rating_doubles, dupr_id, location_address, location_display_address, location_point, phone"
          )
          .eq("id", user.id)
          .single()

        console.log("🔍 PROFILE LOAD - User profile query result:", {
          hasData: !!userProfile,
          hasError: !!error,
          error: error?.message,
        })

        // If user profile doesn't exist, create it
        if (!userProfile && !error) {
          const { data: newUserProfile, error: createError } = await supabase
            .from("users")
            .insert({
              id: user.id,
              email: user.email,
            })
            .select()
            .single()

          if (newUserProfile && !createError) {
            // Use the newly created profile
            userProfile = newUserProfile
          }
        }

        const duprSinglesValue =
          userProfile?.dupr_rating_singles !== null &&
          userProfile?.dupr_rating_singles !== undefined
            ? userProfile.dupr_rating_singles.toFixed(3)
            : ""
        const duprDoublesValue =
          userProfile?.dupr_rating_doubles !== null &&
          userProfile?.dupr_rating_doubles !== undefined
            ? userProfile.dupr_rating_doubles.toFixed(3)
            : ""

        setDuprId(userProfile?.dupr_id || "")
        setPhone(userProfile?.phone || "")
        userData.phone = userProfile?.phone || ""

        // Set location data if available
        console.log("🔍 PROFILE LOAD - Location data from database:", {
          hasLocationPoint: !!userProfile?.location_point,
          locationAddress: userProfile?.location_address,
          locationDisplayAddress: userProfile?.location_display_address,
        })

        if (userProfile?.location_display_address) {
          setLocationAddress(userProfile.location_display_address)
          userData.locationAddress = userProfile.location_display_address
          console.log(
            "🔍 PROFILE LOAD - Set location address:",
            userProfile.location_display_address
          )

          // Note: We can't easily reconstruct the full LocationData from PostGIS point
          // without additional database queries. For now, we'll just use the display address.
          // The location coordinates will be re-acquired when the user updates their location.
        } else {
          console.log("🔍 PROFILE LOAD - No location display address found")
        }
      } catch (error) {
        console.error("Error loading user profile:", error)
        // Only clear DUPR data if there's a database error, not location parsing errors
        const errorMessage =
          error instanceof Error ? error.message : String(error)
        if (
          errorMessage.includes("location") ||
          errorMessage.includes("parse")
        ) {
          // Location parsing error - don't clear DUPR data
          setLocation(null)
          setLocationAddress("")
          userData.locationAddress = ""
        } else {
          // Database error - clear all data
          userData.locationAddress = ""
        }
      }

      setOriginalData({
        ...userData,
        phone: userData.phone || "",
        locationAddress: userData.locationAddress || "",
        location: location,
      })
    }
  }

  // Check if there are any changes
  const hasChanges = () => {
    return (
      name !== originalData.name ||
      birthday !== originalData.birthday ||
      gender !== originalData.gender ||
      phone !== originalData.phone ||
      locationAddress !== originalData.locationAddress
    )
  }

  // Date input mask function
  const formatDateInput = (text: string) => {
    // Remove all non-digits
    const cleaned = text.replace(/\D/g, "")

    // Apply mask MM/DD/YYYY
    if (cleaned.length <= 2) {
      return cleaned
    } else if (cleaned.length <= 4) {
      return `${cleaned.slice(0, 2)}/${cleaned.slice(2)}`
    } else if (cleaned.length <= 8) {
      return `${cleaned.slice(0, 2)}/${cleaned.slice(2, 4)}/${cleaned.slice(4)}`
    } else {
      return `${cleaned.slice(0, 2)}/${cleaned.slice(2, 4)}/${cleaned.slice(
        4,
        8
      )}`
    }
  }

  const handleBirthdayChange = (text: string) => {
    const formatted = formatDateInput(text)
    setBirthday(formatted)
  }

  const handleGenderSelect = (selectedGender: string) => {
    setGender(selectedGender)
  }

  const handleLocationChange = (
    address: string,
    locationData: LocationData | null
  ) => {
    setLocationAddress(address)
    setLocation(locationData)
  }

  const handleGetCurrentLocation = async () => {
    setLocationLoading(true)
    try {
      const locationData = await locationService.getCurrentLocation()
      if (locationData) {
        setLocation(locationData)
        setLocationAddress(
          locationData.displayAddress || locationData.address || ""
        )
      }
    } catch (error) {
      console.error("Error getting location:", error)
    } finally {
      setLocationLoading(false)
    }
  }

  const handleSavePress = async () => {
    if (!user) return

    console.log("🔍 PROFILE - Starting save process for user:", user.id)
    console.log("🔍 PROFILE - Current form data:", {
      name,
      birthday,
      gender,
      phone,
      locationAddress,
      hasLocation: !!location,
    })

    setIsSaving(true)
    try {
      // Update user metadata - TEMPORARILY SKIPPED FOR DEBUGGING
      console.log("🔍 PROFILE - SKIPPING user metadata update for debugging...")
      /*
      console.log("🔍 PROFILE - Updating user metadata...")
      console.log("🔍 PROFILE - Metadata to update:", {
        full_name: name,
        birthday: birthday,
        gender: gender,
      })
      
      try {
        const { data: updateData, error } = await supabase.auth.updateUser({
          data: {
            full_name: name,
            birthday: birthday,
            gender: gender,
          },
        })

        console.log("🔍 PROFILE - Auth update response:", { updateData, error })

        if (error) {
          console.error("❌ PROFILE - Error updating user metadata:", error)
          Alert.alert("Error", "Failed to save profile data")
          throw error
        }
        console.log("✅ PROFILE - User metadata updated successfully")
      } catch (authError) {
        console.error("❌ PROFILE - Exception updating user metadata:", authError)
        Alert.alert("Error", "Failed to save profile data")
        throw authError
      }
      */

      // Update phone and location in users table
      console.log("🔍 PROFILE - Starting users table update...")
      const updateData: any = {
        phone: phone || null,
      }

      // Add location data if available - save to PostGIS geometry
      if (location) {
        console.log("🔍 PROFILE - Location data available:", {
          latitude: location.latitude,
          longitude: location.longitude,
          address: location.address,
          displayAddress: location.displayAddress,
        })

        const locationPoint = `POINT(${location.longitude} ${location.latitude})`
        console.log("🔍 PROFILE - PostGIS point string:", locationPoint)

        // Create PostGIS POINT geometry: ST_Point(longitude, latitude)
        updateData.location_point = locationPoint
        updateData.location_address = location.address
        updateData.location_display_address = location.displayAddress
        updateData.location_updated_at = new Date().toISOString()
      } else {
        console.log("🔍 PROFILE - No location data to save")
      }

      console.log("🔍 PROFILE - Final update data:", updateData)
      console.log("🔍 PROFILE - Updating users table...")

      const { data: updateResult, error: updateError } = await supabase
        .from("users")
        .update(updateData)
        .eq("id", user.id)
        .select()

      console.log("🔍 PROFILE - Update result:", updateResult)

      if (updateError) {
        console.error("❌ PROFILE - Error updating profile:", updateError)
        console.error("❌ PROFILE - Error details:", {
          message: updateError.message,
          details: updateError.details,
          hint: updateError.hint,
        })
        Alert.alert(
          "Warning",
          `Profile updated but location data failed to save: ${updateError.message}`
        )
      } else {
        console.log("✅ PROFILE - Profile updated successfully")
        Alert.alert("Success", "Profile updated successfully")
      }

      // Update original data to reflect saved state
      setOriginalData({
        name,
        birthday,
        gender,
        phone,
        locationAddress,
        location,
      })
    } catch (error) {
      console.error("❌ PROFILE - Save profile error:", error)
    } finally {
      console.log(
        "🔍 PROFILE - Save process completed, setting isSaving to false"
      )
      setIsSaving(false)
    }
  }

  const handleCancelPress = () => {
    // Reset to original values
    setName(originalData.name)
    setBirthday(originalData.birthday)
    setGender(originalData.gender)
    setPhone(originalData.phone)
    setLocationAddress(originalData.locationAddress)
    setLocation(originalData.location)
  }

  const handleDuprConnectionSuccess = (rating: number) => {
    // Just show a success message - the modal dismissal will trigger a refetch
    Alert.alert(
      "Success",
      `Your DUPR connection is complete! Rating: ${rating.toFixed(3)}`
    )
  }

  const handleSignOut = async () => {
    Alert.alert("Sign Out", "Are you sure you want to sign out?", [
      {
        text: "Cancel",
        style: "cancel",
      },
      {
        text: "Sign Out",
        style: "destructive",
        onPress: async () => {
          try {
            await authService.signOut()
            router.replace("/auth/login")
          } catch (error) {
            console.error("Sign out error:", error)
          }
        },
      },
    ])
  }

  // Show loading indicator while auth state is being determined
  if (loading) {
    return (
      <SafeAreaView
        style={[styles.container, { backgroundColor: colors.background }]}
      >
        <View
          style={[
            styles.loadingContainer,
            { backgroundColor: colors.background },
          ]}
        >
          <ActivityIndicator size="large" color={colors.tint} />
        </View>
      </SafeAreaView>
    )
  }

  // Redirect to login if no user
  if (!user) {
    // Use setTimeout to avoid state updates during render
    setTimeout(() => {
      router.replace("/auth/login")
    }, 0)
    return null
  }

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
    >
      <CustomHeader title="Profile" showBackButton={false} />
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.content}>
          <View style={styles.profileSection}>
            <View
              style={[styles.avatarContainer, { backgroundColor: colors.tint }]}
            >
              <Text style={[styles.avatarText, { color: colors.background }]}>
                {user.email?.charAt(0).toUpperCase() || "U"}
              </Text>
            </View>

            <Text style={[styles.emailText, { color: colors.text }]}>
              {user.email}
            </Text>
          </View>

          {/* Name Section */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>
                Name
              </Text>
              {hasChanges() && (
                <TouchableOpacity
                  style={[
                    styles.saveButton,
                    {
                      backgroundColor: isSaving
                        ? colors.tabIconDefault
                        : colors.tint,
                      opacity: isSaving ? 0.7 : 1,
                    },
                  ]}
                  onPress={handleSavePress}
                  disabled={isSaving}
                >
                  <Text
                    style={[
                      styles.saveButtonText,
                      { color: colors.background },
                    ]}
                  >
                    {isSaving ? "Saving..." : "Save"}
                  </Text>
                </TouchableOpacity>
              )}
            </View>
            <TextInput
              style={[
                styles.input,
                {
                  color: colors.text,
                  borderColor: colors.tabIconDefault,
                  backgroundColor: colors.isDark ? "#1a1a1a" : "#f5f5f5",
                },
              ]}
              placeholder="Enter your full name"
              placeholderTextColor={colors.tabIconDefault}
              value={name}
              onChangeText={setName}
              autoCapitalize="words"
            />
          </View>

          {/* Phone Section */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>
                Phone Number
              </Text>
            </View>
            <TextInput
              style={[
                styles.input,
                {
                  color: colors.text,
                  borderColor: colors.tabIconDefault,
                  backgroundColor: colors.isDark ? "#1a1a1a" : "#f5f5f5",
                },
              ]}
              placeholder="(123) 456-7890 or +1 123 456-7890"
              placeholderTextColor={colors.tabIconDefault}
              value={
                phone
                  ? (() => {
                      // If it's +1, parse it as US number
                      if (phone.startsWith("+1")) {
                        const digits = phone.replace(/\D/g, "").slice(1) // Remove +1 and non-digits
                        if (digits.length <= 3) {
                          return `(${digits}`
                        } else if (digits.length <= 6) {
                          return `(${digits.slice(0, 3)}) ${digits.slice(3)}`
                        } else {
                          return `(${digits.slice(0, 3)}) ${digits.slice(
                            3,
                            6
                          )}-${digits.slice(6, 10)}`
                        }
                      }

                      // If it's other international number (starts with +), display as-is
                      if (phone.startsWith("+")) {
                        return phone
                      }

                      // Format US numbers
                      if (phone.length <= 3) {
                        return `(${phone}`
                      } else if (phone.length <= 6) {
                        return `(${phone.slice(0, 3)}) ${phone.slice(3)}`
                      } else {
                        return `(${phone.slice(0, 3)}) ${phone.slice(
                          3,
                          6
                        )}-${phone.slice(6, 10)}`
                      }
                    })()
                  : ""
              }
              onChangeText={(text) => {
                // Handle international format if it starts with +
                if (text.startsWith("+")) {
                  // For international numbers, store the full formatted string
                  setPhone(text)
                  return
                }

                // Remove all non-digits for US numbers
                const cleaned = text.replace(/\D/g, "")

                // Apply phone number mask: (XXX) XXX-XXXX for US numbers
                let formatted = ""
                if (cleaned.length > 0) {
                  if (cleaned.length <= 3) {
                    formatted = `(${cleaned}`
                  } else if (cleaned.length <= 6) {
                    formatted = `(${cleaned.slice(0, 3)}) ${cleaned.slice(3)}`
                  } else {
                    formatted = `(${cleaned.slice(0, 3)}) ${cleaned.slice(
                      3,
                      6
                    )}-${cleaned.slice(6, 10)}`
                  }
                }

                setPhone(cleaned) // Store cleaned digits for US numbers
              }}
              keyboardType="phone-pad"
              autoCapitalize="none"
              autoCorrect={false}
              maxLength={20}
            />
            {phone.length > 0 && (
              <Text
                style={[styles.helperText, { color: colors.tabIconDefault }]}
              >
                Phone number will be used for session invites and notifications
              </Text>
            )}
          </View>

          {/* DUPR Rating Section */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>
                DUPR Rating
              </Text>
            </View>
            {duprId ? (
              <View>
                <View
                  style={[
                    styles.duprIdContainer,
                    { backgroundColor: colors.tabIconDefault },
                  ]}
                >
                  <Text style={[styles.duprIdText, { color: colors.text }]}>
                    DUPR ID
                  </Text>
                  <Text style={[styles.duprIdText, { color: colors.text }]}>
                    {duprId}
                  </Text>
                </View>
                <Text style={[styles.duprRatingText, { color: colors.text }]}>
                  Connected to DUPR - ratings will appear here
                </Text>
              </View>
            ) : (
              <TouchableOpacity
                style={[styles.duprButton, { backgroundColor: colors.tint }]}
                onPress={() => setShowDuprModal(true)}
              >
                <Text
                  style={[styles.duprButtonText, { color: colors.background }]}
                >
                  Get my DUPR score
                </Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Location Section with Google Places Autocomplete */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>
                Location
              </Text>
            </View>
            <LocationAutocomplete
              value={locationAddress}
              onLocationChange={handleLocationChange}
              onGetCurrentLocation={handleGetCurrentLocation}
              locationLoading={locationLoading}
              placeholder="Enter your city"
              searchType="cities"
            />
          </View>

          {/* Birthday Section */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>
                Birthday
              </Text>
            </View>
            <TextInput
              style={[
                styles.input,
                {
                  color: colors.text,
                  borderColor: colors.tabIconDefault,
                  backgroundColor: colors.isDark ? "#1a1a1a" : "#f5f5f5",
                },
              ]}
              placeholder="MM/DD/YYYY"
              placeholderTextColor={colors.tabIconDefault}
              value={birthday}
              onChangeText={handleBirthdayChange}
              keyboardType="numeric"
              maxLength={10}
            />
          </View>

          {/* Gender Section */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>
                Gender
              </Text>
            </View>
            <View style={styles.radioContainer}>
              <TouchableOpacity
                style={[
                  styles.radioButton,
                  {
                    borderColor: colors.tabIconDefault,
                    backgroundColor:
                      gender === "male" ? colors.tint : "transparent",
                  },
                ]}
                onPress={() => handleGenderSelect("male")}
              >
                <Text
                  style={[
                    styles.radioText,
                    {
                      color:
                        gender === "male" ? colors.background : colors.text,
                    },
                  ]}
                >
                  Male
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.radioButton,
                  {
                    borderColor: colors.tabIconDefault,
                    backgroundColor:
                      gender === "female" ? colors.tint : "transparent",
                  },
                ]}
                onPress={() => handleGenderSelect("female")}
              >
                <Text
                  style={[
                    styles.radioText,
                    {
                      color:
                        gender === "female" ? colors.background : colors.text,
                    },
                  ]}
                >
                  Female
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Cancel Button - only show when there are changes */}
          {hasChanges() && (
            <View style={styles.cancelSection}>
              <TouchableOpacity
                style={[
                  styles.cancelButton,
                  { borderColor: colors.tabIconDefault },
                ]}
                onPress={handleCancelPress}
                disabled={isSaving}
              >
                <Text style={[styles.cancelButtonText, { color: colors.text }]}>
                  Cancel Changes
                </Text>
              </TouchableOpacity>
            </View>
          )}

          <View style={styles.actionsSection}>
            {/* Admin Dashboard Button - only show for admin users */}
            {user?.email?.includes("admin") && (
              <TouchableOpacity
                style={[styles.adminButton, { backgroundColor: colors.tint }]}
                onPress={() => router.push("/admin")}
              >
                <Text
                  style={[styles.adminButtonText, { color: colors.background }]}
                >
                  Admin Dashboard
                </Text>
              </TouchableOpacity>
            )}
            
            <TouchableOpacity
              style={[styles.signOutButton, { backgroundColor: "#ff4444" }]}
              onPress={handleSignOut}
            >
              <Text
                style={[styles.signOutButtonText, { color: colors.background }]}
              >
                Sign Out
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>

      {/* DUPR Connection Modal */}
      <DuprConnectionModal
        visible={showDuprModal}
        onClose={async () => {
          setShowDuprModal(false)
          // Refetch user data when modal is dismissed
          if (user) {
            await loadUserData()
          }
        }}
        onSuccess={handleDuprConnectionSuccess}
      />
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  content: {
    flex: 1,
    padding: 20,
  },
  profileSection: {
    alignItems: "center",
    // marginBottom: 40,
    // paddingTop: 20,
  },
  avatarContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  avatarText: {
    fontSize: 32,
    fontWeight: "bold",
  },
  emailText: {
    fontSize: 18,
    fontWeight: "500",
    textAlign: "center",
    marginBottom: 8,
  },
  nameText: {
    fontSize: 16,
    fontWeight: "400",
    textAlign: "center",
    opacity: 0.8,
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
  },
  input: {
    height: 50,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 16,
    fontSize: 16,
  },
  helperText: {
    fontSize: 12,
    marginTop: 8,
    marginLeft: 4,
    fontStyle: "italic",
  },
  radioContainer: {
    flexDirection: "row",
    gap: 12,
  },
  radioButton: {
    flex: 1,
    height: 44,
    borderWidth: 1,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
  },
  radioText: {
    fontSize: 16,
    fontWeight: "500",
  },
  cancelSection: {
    marginBottom: 24,
  },
  cancelButton: {
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: "center",
    borderWidth: 1,
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: "600",
  },
  saveButton: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 6,
  },
  saveButtonText: {
    fontSize: 14,
    fontWeight: "500",
  },
  actionsSection: {
    marginTop: 40,
    paddingBottom: 20,
  },
  adminButton: {
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: "center",
    marginBottom: 16,
  },
  adminButtonText: {
    fontSize: 16,
    fontWeight: "600",
  },
  signOutButton: {
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: "center",
  },
  signOutButtonText: {
    fontSize: 16,
    fontWeight: "600",
  },
  connectButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  connectButtonText: {
    fontSize: 12,
    fontWeight: "500",
  },
  duprContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  duprInputContainer: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderRadius: 8,
    backgroundColor: "transparent",
    paddingHorizontal: 12,
  },
  duprIcon: {
    marginRight: 8,
  },
  duprInput: {
    flex: 1,
    height: 50,
    fontSize: 16,
    minWidth: 80,
  },
  duprButton: {
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
    width: "100%",
    height: 50,
  },
  duprButtonText: {
    fontSize: 14,
    fontWeight: "600",
  },
  duprIdContainer: {
    // flexDirection: "row",
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
    minWidth: 80,
    height: 50,
  },
  duprIdText: {
    fontSize: 12,
    fontWeight: "500",
  },
  duprRatingText: {
    fontSize: 14,
    textAlign: "center",
    marginTop: 8,
    opacity: 0.8,
  },
  header: {
    paddingVertical: 16,
    paddingHorizontal: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "bold",
  },
  locationContainer: {
    flexDirection: "row",
    // alignItems: "center",
    // gap: 8,
  },
  locationInput: {
    // flex: 1,
    height: 50,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 16,
    fontSize: 16,
    marginRight: 8,
    width: "85%",
  },
  locationButton: {
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
    minWidth: 44,
    height: 50,
  },
  locationButtonText: {
    fontSize: 16,
    fontWeight: "600",
  },
  groupButton: {
    height: 50,
    borderWidth: 1,
    borderRadius: 8,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    backgroundColor: "transparent",
  },
  groupButtonContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  groupButtonText: {
    fontSize: 16,
    fontWeight: "500",
  },
})
