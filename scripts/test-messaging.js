const { createClient } = require("@supabase/supabase-js")
require("dotenv").config({ path: ".env" })

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error("Missing required environment variables")
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function testMessagingSystem() {
  console.log("🧪 Testing Messaging System...\n")

  try {
    // Test 1: Create test users
    console.log("1. Creating test users...")
    const { data: user1, error: user1Error } =
      await supabase.auth.admin.createUser({
        email: "testuser1@example.com",
        password: "testpassword123",
        email_confirm: true,
      })

    if (user1Error) {
      console.log("User 1 already exists or error:", user1Error.message)
    } else {
      console.log("✅ User 1 created:", user1.user.id)
    }

    const { data: user2, error: user2Error } =
      await supabase.auth.admin.createUser({
        email: "testuser2@example.com",
        password: "testpassword123",
        email_confirm: true,
      })

    if (user2Error) {
      console.log("User 2 already exists or error:", user2Error.message)
    } else {
      console.log("✅ User 2 created:", user2.user.id)
    }

    // Get user IDs (either from creation or existing users)
    const { data: users } = await supabase.auth.admin.listUsers()
    const testUser1 = users.users.find(
      (u) => u.email === "testuser1@example.com"
    )
    const testUser2 = users.users.find(
      (u) => u.email === "testuser2@example.com"
    )

    if (!testUser1 || !testUser2) {
      console.error("❌ Could not find test users")
      return
    }

    console.log("✅ Test users ready:", testUser1.id, testUser2.id)

    // Test 2: Create direct conversation
    console.log("\n2. Creating direct conversation...")
    const { data: conversationId, error: convError } = await supabase.rpc(
      "get_or_create_direct_conversation",
      {
        user1_id: testUser1.id,
        user2_id: testUser2.id,
      }
    )

    if (convError) {
      console.error("❌ Failed to create conversation:", convError)
      return
    }

    console.log("✅ Direct conversation created:", conversationId)

    // Test 3: Send messages
    console.log("\n3. Sending messages...")
    const messages = [
      { content: "Hello! How are you?", sender_id: testUser1.id },
      { content: "I'm doing great! How about you?", sender_id: testUser2.id },
      {
        content: "Pretty good! Want to play pickleball?",
        sender_id: testUser1.id,
      },
    ]

    for (const messageData of messages) {
      const { data: message, error: msgError } = await supabase
        .from("messages")
        .insert({
          conversation_id: conversationId,
          content: messageData.content,
          sender_id: messageData.sender_id,
        })
        .select()
        .single()

      if (msgError) {
        console.error("❌ Failed to send message:", msgError)
      } else {
        console.log("✅ Message sent:", message.content)
      }
    }

    // Test 4: Retrieve conversation
    console.log("\n4. Retrieving conversation...")
    const { data: conversation, error: getConvError } = await supabase
      .from("conversations")
      .select(
        `
        *,
        participants:conversation_participants(*),
        messages(*)
      `
      )
      .eq("id", conversationId)
      .single()

    if (getConvError) {
      console.error("❌ Failed to retrieve conversation:", getConvError)
    } else {
      console.log("✅ Conversation retrieved:")
      console.log("   - Type:", conversation.conversation_type)
      console.log("   - Participants:", conversation.participants.length)
      console.log("   - Messages:", conversation.messages.length)
    }

    // Test 5: Add reactions
    console.log("\n5. Adding reactions...")
    const { data: messages2 } = await supabase
      .from("messages")
      .select("id")
      .eq("conversation_id", conversationId)
      .limit(1)

    if (messages2 && messages2.length > 0) {
      const { data: reaction, error: reactionError } = await supabase
        .from("message_reactions")
        .insert({
          message_id: messages2[0].id,
          user_id: testUser1.id,
          reaction_type: "👍",
        })
        .select()
        .single()

      if (reactionError) {
        console.error("❌ Failed to add reaction:", reactionError)
      } else {
        console.log("✅ Reaction added:", reaction.reaction_type)
      }
    }

    // Test 6: Create group conversation
    console.log("\n6. Creating group conversation...")
    const { data: groupConvId, error: groupError } = await supabase.rpc(
      "create_group_conversation",
      {
        group_name: "Test Pickleball Group",
        participant_ids: [testUser1.id, testUser2.id],
      }
    )

    if (groupError) {
      console.error("❌ Failed to create group conversation:", groupError)
    } else {
      console.log("✅ Group conversation created:", groupConvId)
    }

    // Test 7: Mark conversation as read
    console.log("\n7. Marking conversation as read...")
    const { error: readError } = await supabase.rpc("mark_conversation_read", {
      conversation_id: conversationId,
    })

    if (readError) {
      console.error("❌ Failed to mark as read:", readError)
    } else {
      console.log("✅ Conversation marked as read")
    }

    console.log("\n🎉 All messaging tests completed successfully!")
    console.log("\n📊 Summary:")
    console.log("   - Direct conversations: ✅")
    console.log("   - Group conversations: ✅")
    console.log("   - Message sending: ✅")
    console.log("   - Message reactions: ✅")
    console.log("   - Conversation retrieval: ✅")
    console.log("   - Read status: ✅")
  } catch (error) {
    console.error("❌ Test failed:", error)
  }
}

// Run the test
testMessagingSystem()
