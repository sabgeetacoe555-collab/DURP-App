import { supabase } from "../lib/supabase"
import { Alert } from "react-native"
import {
  Group,
  GroupMember,
  GroupWithMembers,
  CreateGroupData,
  GroupInvitation,
} from "../types"

export const groupsService = {
  // Get all groups for a specific user (groups they created or are members of)
  getGroupsForUser: async (userId: string): Promise<Group[]> => {
    // Get groups where user is creator
    const { data: createdGroups, error: createdError } = await supabase
      .from("groups")
      .select("*")
      .eq("user_id", userId)
      .order("name")

    if (createdError) {
      console.error("Error fetching created groups:", createdError)
      throw createdError
    }

    // Get groups where user is a member
    const { data: memberGroups, error: memberError } = await supabase
      .from("group_members")
      .select(
        `
        group_id,
        groups(*)
      `
      )
      .eq("user_id", userId)

    if (memberError) {
      console.error("Error fetching member groups:", memberError)
      throw memberError
    }

    // Combine and deduplicate groups
    const allGroups = [
      ...(createdGroups || []),
      ...(memberGroups?.map((mg) => mg.groups).filter(Boolean) || []),
    ]

    // Remove duplicates based on group ID
    const uniqueGroups = allGroups.reduce((acc, group) => {
      if (!acc.find((g: Group) => g.id === group.id)) {
        acc.push(group)
      }
      return acc
    }, [] as Group[])

    return uniqueGroups
  },

  // Get all groups for the current user (groups they created or are members of)
  getGroups: async (): Promise<Group[]> => {
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      throw new Error("User not authenticated")
    }

    return groupsService.getGroupsForUser(user.id)
  },

  // Get all groups with their members for the current user
  getGroupsWithMembers: async (): Promise<GroupWithMembers[]> => {
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      throw new Error("User not authenticated")
    }

    // Get groups
    const { data: groups, error: groupsError } = (await supabase
      .from("groups")
      .select("*")
      .eq("user_id", user.id)
      .order("name")) as { data: Group[] | null; error: any }

    if (groupsError) {
      console.error("Error fetching groups:", groupsError)
      throw groupsError
    }

    if (!groups || groups.length === 0) {
      return []
    }

    // Cast groups to the correct type
    const typedGroups = groups as unknown as Group[]

    // Get user information for the creator
    const { data: userData, error: userError } = await supabase
      .from("users")
      .select("name")
      .eq("id", user.id)
      .single()

    if (userError) {
      console.error("Error fetching user data:", userError)
      // Continue without user data
    }

    // Get members for all groups
    const { data: allMembers, error: membersError } = await supabase
      .from("group_members")
      .select("*")
      .in(
        "group_id",
        groups.map((g) => g.id)
      )
      .order("contact_name")

    if (membersError) {
      console.error("Error fetching group members:", membersError)
      throw membersError
    }

    // Group members by group_id
    const membersByGroup = (allMembers || []).reduce((acc, member) => {
      if (!acc[member.group_id]) {
        acc[member.group_id] = []
      }
      acc[member.group_id].push(member)
      return acc
    }, {} as Record<string, GroupMember[]>)

    // Combine groups with their members and creator info
    return typedGroups.map((group) => ({
      id: group.id,
      user_id: group.user_id,
      name: group.name,
      description: group.description,
      created_at: group.created_at,
      updated_at: group.updated_at,
      members: membersByGroup[group.id] || [],
      member_count: membersByGroup[group.id]?.length || 0,
      creator: {
        name: userData?.name,
      },
    }))
  },

  // Get a single group by ID (for current user's groups or groups they're members of)
  getGroupById: async (groupId: string): Promise<Group | null> => {
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      throw new Error("User not authenticated")
    }

    // Get the group - now allows access for group creators and members
    const { data: group, error: groupError } = await supabase
      .from("groups")
      .select("*")
      .eq("id", groupId)
      .single()

    if (groupError || !group) {
      return null
    }

    return group
  },

  // Get a single group by ID for invites (no user restriction)
  getGroupByIdForInvite: async (groupId: string): Promise<Group | null> => {
    console.log(
      "🔍 groupsService.getGroupByIdForInvite - Called with groupId:",
      groupId
    )

    // Get the group without user restriction (for invites)
    const { data: group, error: groupError } = await supabase
      .from("groups")
      .select("*")
      .eq("id", groupId)
      .single()

    console.log("🔍 groupsService.getGroupByIdForInvite - Query result:")
    console.log("  data:", group)
    console.log("  error:", groupError)

    if (groupError || !group) {
      console.error(
        "❌ groupsService.getGroupByIdForInvite - Error fetching group for invite:",
        groupError
      )
      return null
    }

    console.log(
      "✅ groupsService.getGroupByIdForInvite - Successfully fetched group:",
      group
    )
    return group
  },

  // Get a single group with its members
  getGroupWithMembers: async (
    groupId: string
  ): Promise<GroupWithMembers | null> => {
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      throw new Error("User not authenticated")
    }

    // Get the group - now allows access for group creators and members
    const { data: group, error: groupError } = await supabase
      .from("groups")
      .select("*")
      .eq("id", groupId)
      .single()

    if (groupError || !group) {
      return null
    }

    // Get the group members
    const { data: members, error: membersError } = await supabase
      .from("group_members")
      .select("*")
      .eq("group_id", groupId)
      .order("contact_name")

    if (membersError) {
      console.error("Error fetching group members:", membersError)
      throw membersError
    }

    return {
      ...group,
      members: members || [],
      member_count: members?.length || 0,
    }
  },

  // Get pending invites (people who have not accepted the invite)
  getInvitedMembers: async (groupId: string): Promise<any[]> => {
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      throw new Error("User not authenticated")
    }

    // Get group members who have not accepted the invite
    const { data: groupMembers, error: membersError } = await supabase
      .from("group_members")
      .select("*")
      .eq("group_id", groupId)
      .eq("accepted_invite", false)

    if (membersError) {
      console.error("Error fetching group members:", membersError)
      throw membersError
    }

    // Return members who have not accepted the invite
    return groupMembers || []
  },

  // Create a new group with members
  createGroup: async (groupData: CreateGroupData): Promise<Group> => {
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      Alert.alert("Authentication Error", "Please sign in to create groups")
      throw new Error("User not authenticated")
    }

    // Start a transaction
    const { data: group, error: groupError } = await supabase
      .from("groups")
      .insert({
        user_id: user.id,
        name: groupData.name,
        description: groupData.description,
      })
      .select()
      .single()

    if (groupError) {
      console.error("Error creating group:", groupError)
      throw groupError
    }

    // Add the group creator as a member with admin privileges
    const { data: userData } = await supabase
      .from("users")
      .select("name, phone, email")
      .eq("id", user.id)
      .single()

    const creatorMember = {
      group_id: group.id,
      user_id: user.id, // Add the user_id so isGroupAdmin can find the creator
      contact_name:
        userData?.name || user.email?.split("@")[0] || "Group Creator",
      contact_phone: userData?.phone || null,
      contact_email: userData?.email || null,
      is_admin: true,
      accepted_invite: true,
      approval_status: "approved", // Creator is automatically approved
    }

    const { error: creatorError } = await supabase
      .from("group_members")
      .insert(creatorMember)

    if (creatorError) {
      console.error("Error adding group creator as member:", creatorError)
      // Note: We don't throw here as the group was created successfully
    }

    // Add other members if provided
    if (groupData.members && groupData.members.length > 0) {
      const membersToInsert = groupData.members.map((member) => ({
        group_id: group.id,
        contact_name: member.contact_name,
        contact_phone: member.contact_phone,
        contact_email: member.contact_email,
        is_admin: false,
        accepted_invite: false, // They need to accept the invitation
      }))

      const { error: membersError } = await supabase
        .from("group_members")
        .insert(membersToInsert)

      if (membersError) {
        console.error("Error adding group members:", membersError)
        // Note: We don't throw here as the group was created successfully
        // The members can be added later
      }
    }

    return group
  },

  // Update a group
  updateGroup: async (
    groupId: string,
    updates: Partial<Pick<Group, "name" | "description">>
  ): Promise<Group> => {
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      throw new Error("User not authenticated")
    }

    const { data, error } = await supabase
      .from("groups")
      .update(updates)
      .eq("id", groupId)
      .eq("user_id", user.id)
      .select()
      .single()

    if (error) {
      console.error("Error updating group:", error)
      throw error
    }

    return data
  },

  // Delete a group
  deleteGroup: async (groupId: string): Promise<void> => {
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      throw new Error("User not authenticated")
    }

    const { error } = await supabase
      .from("groups")
      .delete()
      .eq("id", groupId)
      .eq("user_id", user.id)

    if (error) {
      console.error("Error deleting group:", error)
      throw error
    }
  },

  // Add multiple members to a group
  addMembersToGroup: async (
    groupId: string,
    members: Array<{
      contact_name: string
      contact_phone?: string
      contact_email?: string
      user_id?: string
    }>
  ): Promise<void> => {
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      throw new Error("User not authenticated")
    }

    // Verify the group belongs to the user
    const { data: group, error: groupError } = await supabase
      .from("groups")
      .select("id")
      .eq("id", groupId)
      .eq("user_id", user.id)
      .single()

    if (groupError || !group) {
      throw new Error("Group not found or access denied")
    }

    // Prepare members data for insertion
    const membersToInsert = members.map((member) => ({
      group_id: groupId,
      contact_name: member.contact_name,
      contact_phone: member.contact_phone,
      contact_email: member.contact_email,
      user_id: member.user_id,
      is_admin: false,
      accepted_invite: member.user_id ? true : false, // If they have a user_id, they're already in the app
    }))

    const { error } = await supabase
      .from("group_members")
      .insert(membersToInsert)

    if (error) {
      console.error("Error adding group members:", error)
      throw error
    }
  },

  // Add a member to a group
  addGroupMember: async (
    groupId: string,
    member: {
      contact_name: string
      contact_phone?: string
      contact_email?: string
      user_id?: string
    }
  ): Promise<GroupMember> => {
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      throw new Error("User not authenticated")
    }

    // For group invites (when user_id is provided), allow joining any group
    // For regular group management, verify the group belongs to the user
    if (!member.user_id) {
      const { data: group, error: groupError } = await supabase
        .from("groups")
        .select("id")
        .eq("id", groupId)
        .eq("user_id", user.id)
        .single()

      if (groupError || !group) {
        throw new Error("Group not found or access denied")
      }
    }

    // Determine approval status based on how the member is being added
    // If user_id is provided (group invite), set to pending for admin approval
    // If no user_id (admin adding member), set to approved
    const approvalStatus = member.user_id ? "pending" : "approved"
    const acceptedInvite = member.user_id ? true : false

    const { data, error } = await supabase
      .from("group_members")
      .insert({
        group_id: groupId,
        contact_name: member.contact_name,
        contact_phone: member.contact_phone,
        contact_email: member.contact_email,
        user_id: member.user_id,
        accepted_invite: acceptedInvite,
        approval_status: approvalStatus,
      })
      .select()
      .single()

    if (error) {
      console.error("Error adding group member:", error)
      throw error
    }

    return data
  },

  // Remove a member from a group
  removeGroupMember: async (memberId: string): Promise<void> => {
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      throw new Error("User not authenticated")
    }

    // Verify the member belongs to a group owned by the user
    const { data: member, error: memberError } = await supabase
      .from("group_members")
      .select("group_id")
      .eq("id", memberId)
      .single()

    if (memberError || !member) {
      throw new Error("Group member not found")
    }

    const { data: group, error: groupError } = await supabase
      .from("groups")
      .select("id")
      .eq("id", member.group_id)
      .eq("user_id", user.id)
      .single()

    if (groupError || !group) {
      throw new Error("Access denied")
    }

    const { error } = await supabase
      .from("group_members")
      .delete()
      .eq("id", memberId)

    if (error) {
      console.error("Error removing group member:", error)
      throw error
    }
  },

  // Invite a group to a session
  inviteGroupToSession: async (
    sessionId: string,
    groupId: string
  ): Promise<GroupInvitation> => {
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      throw new Error("User not authenticated")
    }

    // Verify the session belongs to the user
    const { data: session, error: sessionError } = await supabase
      .from("sessions")
      .select("id")
      .eq("id", sessionId)
      .eq("user_id", user.id)
      .single()

    if (sessionError || !session) {
      throw new Error("Session not found or access denied")
    }

    // Verify the group belongs to the user
    const { data: group, error: groupError } = await supabase
      .from("groups")
      .select("id")
      .eq("id", groupId)
      .eq("user_id", user.id)
      .single()

    if (groupError || !group) {
      throw new Error("Group not found or access denied")
    }

    const { data, error } = await supabase
      .from("group_invitations")
      .insert({
        session_id: sessionId,
        group_id: groupId,
      })
      .select()
      .single()

    if (error) {
      console.error("Error inviting group to session:", error)
      throw error
    }

    return data
  },

  // Get groups invited to a session
  getGroupsInvitedToSession: async (sessionId: string): Promise<Group[]> => {
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      throw new Error("User not authenticated")
    }

    const { data, error } = await supabase
      .from("group_invitations")
      .select(
        `
        group_id,
        groups (
          id,
          name,
          description,
          created_at,
          updated_at
        )
      `
      )
      .eq("session_id", sessionId)
      .eq("groups.user_id", user.id)

    if (error) {
      console.error("Error fetching groups invited to session:", error)
      throw error
    }

    return data?.map((item) => item.groups as unknown as Group) || []
  },

  // Check if user is admin of a group
  isGroupAdmin: async (groupId: string): Promise<boolean> => {
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return false
    }

    // Check if user is admin by user_id in group_members
    const { data, error } = await supabase
      .from("group_members")
      .select("is_admin")
      .eq("group_id", groupId)
      .eq("user_id", user.id)
      .single()

    if (error) {
      console.error("Error checking if user is group admin:", error)
      return false
    }

    // Return true if user is admin, false otherwise
    return data?.is_admin === true
  },

  // Check if user is creator of a group
  isGroupCreator: async (groupId: string): Promise<boolean> => {
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return false
    }

    // Check if user is the creator of the group
    const { data, error } = await supabase
      .from("groups")
      .select("user_id")
      .eq("id", groupId)
      .single()

    if (error) {
      console.error("Error checking if user is group creator:", error)
      return false
    }

    // Return true if user is the creator, false otherwise
    return data?.user_id === user.id
  },

  // Check if user can manage a group (creator or admin)
  canManageGroup: async (groupId: string): Promise<boolean> => {
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return false
    }

    // Check if user is creator
    const isCreator = await groupsService.isGroupCreator(groupId)
    if (isCreator) {
      return true
    }

    // Check if user is admin
    const isAdmin = await groupsService.isGroupAdmin(groupId)
    return isAdmin
  },

  // Assign admin role to a group member
  assignAdminRole: async (
    memberId: string,
    isAdmin: boolean
  ): Promise<void> => {
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      throw new Error("User not authenticated")
    }

    // Get the member to find the group_id
    const { data: member, error: memberError } = await supabase
      .from("group_members")
      .select("group_id")
      .eq("id", memberId)
      .single()

    if (memberError || !member) {
      throw new Error("Member not found")
    }

    // Check if user can manage this group
    const canManage = await groupsService.canManageGroup(member.group_id)
    if (!canManage) {
      throw new Error("You don't have permission to manage this group")
    }

    const { error } = await supabase
      .from("group_members")
      .update({ is_admin: isAdmin })
      .eq("id", memberId)

    if (error) {
      console.error("Error assigning admin role:", error)
      throw error
    }
  },

  // Get pending group approvals for admin review
  getPendingApprovals: async (groupId: string): Promise<GroupMember[]> => {
    console.log("🔍 getPendingApprovals called for groupId:", groupId)

    const { data, error } = await supabase.rpc("get_pending_group_approvals", {
      group_id_param: groupId,
    })

    if (error) {
      console.error("Error fetching pending approvals:", error)
      throw error
    }

    console.log("📋 getPendingApprovals result:", data)
    return data || []
  },

  // Approve a group invite
  approveGroupInvite: async (memberId: string): Promise<void> => {
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      throw new Error("User not authenticated")
    }

    // Get the member to check permissions
    const { data: member, error: memberError } = await supabase
      .from("group_members")
      .select("group_id")
      .eq("id", memberId)
      .single()

    if (memberError || !member) {
      throw new Error("Member not found")
    }

    // Check if user can manage this group
    const canManage = await groupsService.canManageGroup(member.group_id)
    if (!canManage) {
      throw new Error("You don't have permission to manage this group")
    }

    const { error } = await supabase
      .from("group_members")
      .update({ approval_status: "approved" })
      .eq("id", memberId)

    if (error) {
      console.error("Error approving group invite:", error)
      throw error
    }
  },

  // Deny a group invite
  denyGroupInvite: async (memberId: string): Promise<void> => {
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      throw new Error("User not authenticated")
    }

    // Get the member to check permissions
    const { data: member, error: memberError } = await supabase
      .from("group_members")
      .select("group_id")
      .eq("id", memberId)
      .single()

    if (memberError || !member) {
      throw new Error("Member not found")
    }

    // Check if user can manage this group
    const canManage = await groupsService.canManageGroup(member.group_id)
    if (!canManage) {
      throw new Error("You don't have permission to manage this group")
    }

    const { error } = await supabase
      .from("group_members")
      .update({ approval_status: "denied" })
      .eq("id", memberId)

    if (error) {
      console.error("Error denying group invite:", error)
      throw error
    }
  },
}
