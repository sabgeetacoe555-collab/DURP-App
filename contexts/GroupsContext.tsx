import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  ReactNode,
} from "react"
import { groupsService } from "@/services/groupsService"
import { useAuth } from "@/contexts/AuthContext"
import { Group, GroupMember } from "@/types"

// Extended group type with DUPR data
interface GroupWithDUPR extends Group {
  averageSinglesRating?: number | null
  averageDoublesRating?: number | null
  memberCount?: number
  college_hub?: boolean
}

// Types for the context
interface GroupsContextType {
  // State
  groups: GroupWithDUPR[]
  loading: boolean
  error: string | null

  // Actions
  refreshGroups: () => Promise<void>
  addGroup: (group: Group) => void
  updateGroup: (groupId: string, updates: Partial<Group>) => void
  removeGroup: (groupId: string) => void

  // Utility functions
  getGroupById: (groupId: string) => GroupWithDUPR | undefined
  getUserGroups: () => GroupWithDUPR[]
}

// Create the context
const GroupsContext = createContext<GroupsContextType | undefined>(undefined)

// Provider component
interface GroupsProviderProps {
  children: ReactNode
}

export const GroupsProvider: React.FC<GroupsProviderProps> = ({ children }) => {
  const [groups, setGroups] = useState<GroupWithDUPR[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { user, isStartupComplete } = useAuth()

  // Load groups from the service
  const refreshGroups = useCallback(async () => {
    console.log(
      "GroupsContext refreshGroups - user:",
      !!user,
      "isStartupComplete:",
      isStartupComplete
    )
    if (!user || !isStartupComplete) {
      console.log(
        "GroupsContext refreshGroups - Not loading groups, user or startup not ready"
      )
      setGroups([])
      return
    }

    try {
      console.log("GroupsContext refreshGroups - Starting to load groups")
      setLoading(true)
      setError(null)

      // Double-check authentication before making the service call
      if (!user || !isStartupComplete) {
        console.log(
          "GroupsContext refreshGroups - Authentication check failed, aborting"
        )
        setGroups([])
        setLoading(false)
        return
      }

      // Use the user from context instead of letting groupsService check auth
      const groupsData = await groupsService.getGroupsForUser(user.id)
      console.log("GroupsContext refreshGroups - Raw groups data:", groupsData)

      // Enhance groups with DUPR data
      const groupsWithDUPR = await Promise.all(
        groupsData.map(async (group) => {
          try {
            // For now, just return the group with basic member count
            // TODO: Add DUPR calculation when we have proper user data in members
            return {
              ...group,
              averageSinglesRating: null,
              averageDoublesRating: null,
              memberCount: 0, // Will be calculated when we have proper member data
            }
          } catch (error) {
            console.log(`Could not fetch DUPR data for group ${group.id}`)
            return {
              ...group,
              averageSinglesRating: null,
              averageDoublesRating: null,
              memberCount: 0,
            }
          }
        })
      )

      // Add a fake college hub group for testing
      const fakeCollegeHubGroup: GroupWithDUPR = {
        id: "fake-college-hub-1",
        name: "University of Colorado Pickleball Club",
        description:
          "Official pickleball club for CU students, faculty, and alumni. Join us for competitive play and social events!",
        user_id: "fake-user-id",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        averageSinglesRating: 3.8,
        averageDoublesRating: 4.2,
        memberCount: 24,
        // This will be a real field in the future
        college_hub: true,
      }

      const finalGroups = [...groupsWithDUPR, fakeCollegeHubGroup]
      console.log(
        "GroupsContext refreshGroups - Final groups with fake data:",
        finalGroups
      )
      setGroups(finalGroups)
    } catch (err) {
      console.error("GroupsContext refreshGroups - Error loading groups:", err)
      setError(err instanceof Error ? err.message : "Failed to load groups")
    } finally {
      setLoading(false)
    }
  }, [user, isStartupComplete])

  // Add a new group to the state
  const addGroup = (group: Group) => {
    setGroups((prev) => {
      // Check if group already exists to avoid duplicates
      const exists = prev.some((g) => g.id === group.id)
      if (exists) {
        return prev.map((g) => (g.id === group.id ? group : g))
      }
      return [...prev, group]
    })
  }

  // Update an existing group
  const updateGroup = (groupId: string, updates: Partial<Group>) => {
    setGroups((prev) =>
      prev.map((group) =>
        group.id === groupId ? { ...group, ...updates } : group
      )
    )
  }

  // Remove a group from the state
  const removeGroup = (groupId: string) => {
    setGroups((prev) => prev.filter((group) => group.id !== groupId))
  }

  // Get a specific group by ID
  const getGroupById = (groupId: string): Group | undefined => {
    return groups.find((group) => group.id === groupId)
  }

  // Get groups for the current user
  const getUserGroups = (): Group[] => {
    return groups
  }

  // Load groups when user changes and startup is complete
  useEffect(() => {
    console.log(
      "GroupsContext useEffect - user:",
      !!user,
      "isStartupComplete:",
      isStartupComplete
    )

    // Only proceed if startup is complete
    if (!isStartupComplete) {
      console.log("GroupsContext - Startup not complete, waiting...")
      return
    }

    if (user) {
      console.log("GroupsContext - Loading groups for authenticated user")
      // Add a small delay to ensure auth is fully settled
      const timer = setTimeout(() => {
        refreshGroups()
      }, 100)
      return () => clearTimeout(timer)
    } else {
      console.log("GroupsContext - No user, clearing groups")
      setGroups([])
    }
  }, [user, isStartupComplete, refreshGroups])

  const value: GroupsContextType = {
    groups,
    loading,
    error,
    refreshGroups,
    addGroup,
    updateGroup,
    removeGroup,
    getGroupById,
    getUserGroups,
  }

  return (
    <GroupsContext.Provider value={value}>{children}</GroupsContext.Provider>
  )
}

// Hook to use the groups context
export const useGroups = (): GroupsContextType => {
  const context = useContext(GroupsContext)
  if (context === undefined) {
    throw new Error("useGroups must be used within a GroupsProvider")
  }
  return context
}
