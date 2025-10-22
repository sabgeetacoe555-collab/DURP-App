import React, { useState } from "react"
import { View, StyleSheet } from "react-native"
import { ConversationList } from "../../components/messaging/ConversationList"
import { ChatScreen } from "../../components/messaging/ChatScreen"
import { ConversationWithParticipants } from "../../services/messagingService"
import Colors from "../../constants/Colors"

export default function MessagesScreen() {
  const [selectedConversation, setSelectedConversation] =
    useState<ConversationWithParticipants | null>(null)

  const handleConversationPress = (
    conversation: ConversationWithParticipants
  ) => {
    setSelectedConversation(conversation)
  }

  const handleBack = () => {
    setSelectedConversation(null)
  }

  const handleNewConversation = () => {
    // TODO: Implement new conversation creation
    // This could open a modal to select users or create a group
    console.log("New conversation pressed")
  }

  if (selectedConversation) {
    return (
      <ChatScreen conversation={selectedConversation} onBack={handleBack} />
    )
  }

  return (
    <View style={styles.container}>
      <ConversationList
        onConversationPress={handleConversationPress}
        onNewConversationPress={handleNewConversation}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
})
