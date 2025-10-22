import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3"

serve(async (req) => {
  const supabase = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
  )

  // Find sessions starting in 30 minutes
  const now = new Date()
  const reminderTime = new Date(now.getTime() + 30 * 60000) // 30 minutes from now

  const { data: upcomingSessions } = await supabase
    .from("sessions")
    .select("id")
    .eq("session_status", "planned")
    .eq("date", reminderTime.toISOString().split("T")[0])
    .gte("start_time", reminderTime.toTimeString().split(" ")[0])
    .lt(
      "start_time",
      new Date(reminderTime.getTime() + 5 * 60000).toTimeString().split(" ")[0]
    ) // 5 minute window

  // Trigger reminders for each session
  for (const session of upcomingSessions || []) {
    await supabase.functions.invoke("send-notifications", {
      body: {
        type: "session_reminder",
        sessionId: session.id,
      },
    })
  }

  return new Response("OK")
})
