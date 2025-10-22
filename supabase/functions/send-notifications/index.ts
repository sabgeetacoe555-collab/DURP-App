import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3"

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
}

interface NotificationRequest {
  type: "session_invite" | "invite_response" | "session_reminder"
  sessionId?: string
  inviteId?: string
  inviterIds?: string[] // for session reminders
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders })
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    )

    const { type, sessionId, inviteId, inviterIds }: NotificationRequest =
      await req.json()

    switch (type) {
      case "session_invite":
        await handleSessionInvite(supabase, sessionId!)
        break

      case "invite_response":
        await handleInviteResponse(supabase, inviteId!)
        break

      case "session_reminder":
        await handleSessionReminder(supabase, sessionId!, inviterIds)
        break
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    })
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    })
  }
})

async function handleSessionInvite(supabase: any, sessionId: string) {
  // Get session and invite details
  const { data: session } = await supabase
    .from("sessions")
    .select("name, date, start_time, location")
    .eq("id", sessionId)
    .single()

  const { data: invites } = await supabase
    .from("session_invites")
    .select(
      `
      *,
      users!invitee_id(expo_push_token, name)
    `
    )
    .eq("session_id", sessionId)
    .eq("notification_sent", false)

  // Send push notifications to app users
  const pushMessages = invites
    .filter((invite) => invite.users?.expo_push_token)
    .map((invite) => ({
      to: invite.users.expo_push_token,
      sound: "default",
      title: "Pickleball Invite! 🏓",
      body: `You're invited to ${session.name || "a pickleball session"}`,
      data: {
        type: "session_invite",
        sessionId,
        inviteId: invite.id,
      },
    }))

  if (pushMessages.length > 0) {
    await sendExpoPushNotifications(pushMessages)

    // Mark notifications as sent
    const appUserInviteIds = invites
      .filter((invite) => invite.users?.expo_push_token)
      .map((invite) => invite.id)

    await supabase
      .from("session_invites")
      .update({ notification_sent: true })
      .in("id", appUserInviteIds)
  }

  // Send SMS to external users
  const externalInvites = invites.filter(
    (invite) => !invite.invitee_id && !invite.sms_sent
  )

  for (const invite of externalInvites) {
    if (invite.invitee_phone) {
      const deepLink = `https://yourapp.com/session/${sessionId}/invite/${invite.id}`
      const sessionDate = new Date(session.session_datetime).toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short', 
        day: 'numeric'
      })
      await sendSMS(
        invite.invitee_phone,
        `You're invited to ${session.name || "a pickleball session"} on ${sessionDate}! ${deepLink}`
      )

      await supabase
        .from("session_invites")
        .update({ sms_sent: true })
        .eq("id", invite.id)
    }
  }
}

async function handleInviteResponse(supabase: any, inviteId: string) {
  // Get invite details with session and responder info
  const { data: invite } = await supabase
    .from("session_invites")
    .select(
      `
      *,
      sessions(name, date, start_time),
      users!invitee_id(name),
      creator:users!inviter_id(expo_push_token, name)
    `
    )
    .eq("id", inviteId)
    .single()

  if (!invite || !invite.creator?.expo_push_token) return

  const responderName = invite.users?.name || invite.invitee_name || "Someone"
  const statusEmoji = {
    accepted: "✅",
    declined: "❌",
    maybe: "🤔",
  }

  const message = {
    to: invite.creator.expo_push_token,
    sound: "default",
    title: `${statusEmoji[invite.status]} Invite Response`,
    body: `${responderName} ${invite.status} your invite to ${invite.sessions.name}`,
    data: {
      type: "invite_response",
      sessionId: invite.session_id,
      inviteId: invite.id,
    },
  }

  await sendExpoPushNotifications([message])
}

async function handleSessionReminder(
  supabase: any,
  sessionId: string,
  inviterIds?: string[]
) {
  // Get accepted invites for upcoming session
  const { data: acceptedInvites } = await supabase
    .from("session_invites")
    .select(
      `
      *,
      users!invitee_id(expo_push_token, name),
      sessions(name, date, start_time, location)
    `
    )
    .eq("session_id", sessionId)
    .eq("status", "accepted")

  if (!acceptedInvites?.length) return

  const session = acceptedInvites[0].sessions
  const messages = acceptedInvites
    .filter((invite) => invite.users?.expo_push_token)
    .map((invite) => ({
      to: invite.users.expo_push_token,
      sound: "default",
      title: "🏓 Session Starting Soon!",
      body: `${session.name} starts in 30 minutes at ${session.location}`,
      data: {
        type: "session_reminder",
        sessionId,
      },
    }))

  if (messages.length > 0) {
    await sendExpoPushNotifications(messages)
  }
}

async function sendExpoPushNotifications(messages: any[]) {
  const response = await fetch("https://exp.host/--/api/v2/push/send", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${Deno.env.get("EXPO_ACCESS_TOKEN")}`,
    },
    body: JSON.stringify(messages),
  })

  if (!response.ok) {
    throw new Error(`Expo push failed: ${response.statusText}`)
  }
}

async function sendSMS(phone: string, message: string) {
  // Using Twilio
  const accountSid = Deno.env.get("TWILIO_ACCOUNT_SID")
  const authToken = Deno.env.get("TWILIO_AUTH_TOKEN")
  const fromPhone = Deno.env.get("TWILIO_PHONE_NUMBER")

  const response = await fetch(
    `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`,
    {
      method: "POST",
      headers: {
        Authorization: `Basic ${btoa(`${accountSid}:${authToken}`)}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        From: fromPhone!,
        To: phone,
        Body: message,
      }),
    }
  )

  if (!response.ok) {
    throw new Error(`SMS failed: ${response.statusText}`)
  }
}
