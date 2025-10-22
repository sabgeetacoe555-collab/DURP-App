/**
 * Enhanced LLM Chat Component
 * Displays AI responses with structured results and live links
 */

import React, { useState, useCallback, useRef, useEffect } from 'react';
import {
  View,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Text,
  ActivityIndicator,
  Linking,
  StyleSheet,
} from 'react-native';

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  liveLinks?: LinkData[];
  metadata?: {
    apiSourcesUsed?: string[];
    sentiment?: string;
    topics?: string[];
  };
}

export interface LinkData {
  title: string;
  url: string;
  type: 'product' | 'article' | 'event' | 'resource';
  description?: string;
  image?: string;
}

interface Props {
  userId: string;
  sessionId: string;
  onSendMessage?: (message: string) => Promise<{
    response: string;
    liveLinks: LinkData[];
    contextUsed: string[];
  }>;
  theme?: 'light' | 'dark';
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  messagesContainer: {
    flex: 1,
    paddingVertical: 10,
  },
  messageGroup: {
    marginBottom: 15,
    paddingHorizontal: 15,
  },
  userMessage: {
    alignItems: 'flex-end',
  },
  assistantMessage: {
    alignItems: 'flex-start',
  },
  messageBubble: {
    maxWidth: '85%',
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderRadius: 15,
  },
  userBubble: {
    backgroundColor: '#007AFF',
  },
  assistantBubble: {
    backgroundColor: '#E5E5EA',
  },
  messageText: {
    fontSize: 16,
    lineHeight: 22,
  },
  userText: {
    color: '#fff',
  },
  assistantText: {
    color: '#000',
  },
  timestamp: {
    fontSize: 12,
    marginTop: 5,
    color: '#999',
  },
  linksContainer: {
    marginTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#ddd',
    paddingTop: 10,
  },
  linkTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#666',
    marginBottom: 8,
  },
  linkItem: {
    marginBottom: 10,
    paddingHorizontal: 10,
    paddingVertical: 8,
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
    borderLeftWidth: 3,
    borderLeftColor: '#007AFF',
  },
  linkItemTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#007AFF',
    marginBottom: 4,
  },
  linkItemDescription: {
    fontSize: 12,
    color: '#666',
    marginBottom: 6,
  },
  linkItemBadge: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  badge: {
    fontSize: 10,
    backgroundColor: '#007AFF',
    color: '#fff',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginRight: 6,
  },
  inputContainer: {
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    paddingHorizontal: 15,
    paddingVertical: 10,
    backgroundColor: '#fff',
    flexDirection: 'row',
    alignItems: 'center',
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 20,
    paddingHorizontal: 15,
    paddingVertical: 10,
    marginRight: 10,
    fontSize: 16,
    maxHeight: 100,
  },
  sendButton: {
    backgroundColor: '#007AFF',
    borderRadius: 20,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: '#ccc',
  },
  loadingContainer: {
    padding: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  metadataContainer: {
    marginTop: 8,
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  metadataBadge: {
    backgroundColor: '#f0f0f0',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    marginRight: 6,
    marginBottom: 4,
  },
  metadataText: {
    fontSize: 11,
    color: '#666',
  },
});

export const EnhancedLLMChatComponent: React.FC<Props> = ({
  userId,
  sessionId,
  onSendMessage,
  theme = 'light',
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);

  useEffect(() => {
    // Scroll to bottom when new messages arrive
    if (scrollViewRef.current) {
      scrollViewRef.current.scrollToEnd({ animated: true });
    }
  }, [messages]);

  const handleSendMessage = useCallback(async () => {
    if (!inputValue.trim() || isLoading) return;

    const userMessage: ChatMessage = {
      id: `msg_${Date.now()}_user`,
      role: 'user',
      content: inputValue,
      timestamp: new Date().toISOString(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);

    try {
      if (onSendMessage) {
        const response = await onSendMessage(inputValue);

        const assistantMessage: ChatMessage = {
          id: `msg_${Date.now()}_assistant`,
          role: 'assistant',
          content: response.response,
          timestamp: new Date().toISOString(),
          liveLinks: response.liveLinks,
          metadata: {
            apiSourcesUsed: response.contextUsed,
          },
        };

        setMessages(prev => [...prev, assistantMessage]);
      }
    } catch (error) {
      console.error('Error sending message:', error);
      const errorMessage: ChatMessage = {
        id: `msg_${Date.now()}_error`,
        role: 'assistant',
        content: 'Sorry, I encountered an error processing your request. Please try again.',
        timestamp: new Date().toISOString(),
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  }, [inputValue, isLoading, onSendMessage]);

  const handleLinkPress = useCallback((url: string) => {
    Linking.openURL(url).catch(err =>
      console.error('Error opening URL:', err)
    );
  }, []);

  const renderLinks = (links: LinkData[]) => {
    return (
      <View style={styles.linksContainer}>
        <Text style={styles.linkTitle}>🔗 Related Resources</Text>
        {links.map((link, index) => (
          <TouchableOpacity
            key={`${link.url}_${index}`}
            onPress={() => handleLinkPress(link.url)}
            activeOpacity={0.7}
          >
            <View style={styles.linkItem}>
              <Text style={styles.linkItemTitle}>{link.title}</Text>
              {link.description && (
                <Text style={styles.linkItemDescription}>{link.description}</Text>
              )}
              <View style={styles.linkItemBadge}>
                <Text style={styles.badge}>{link.type}</Text>
                <Text style={{ fontSize: 12, color: '#666' }}>
                  {link.url.split('/')[2]}
                </Text>
              </View>
            </View>
          </TouchableOpacity>
        ))}
      </View>
    );
  };

  const renderMetadata = (metadata?: ChatMessage['metadata']) => {
    if (!metadata) return null;

    return (
      <View style={styles.metadataContainer}>
        {metadata.apiSourcesUsed?.map((source, index) => (
          <View key={`${source}_${index}`} style={styles.metadataBadge}>
            <Text style={styles.metadataText}>📊 {source}</Text>
          </View>
        ))}
        {metadata.topics?.map((topic, index) => (
          <View key={`${topic}_${index}`} style={styles.metadataBadge}>
            <Text style={styles.metadataText}>🏷️ {topic}</Text>
          </View>
        ))}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <ScrollView
        ref={scrollViewRef}
        style={styles.messagesContainer}
        contentContainerStyle={{ flexGrow: 1 }}
        onContentSizeChange={() =>
          scrollViewRef.current?.scrollToEnd({ animated: true })
        }
      >
        {messages.length === 0 ? (
          <View style={styles.loadingContainer}>
            <Text style={{ fontSize: 16, color: '#999' }}>
              Start a conversation...
            </Text>
          </View>
        ) : (
          messages.map(message => (
            <View
              key={message.id}
              style={[
                styles.messageGroup,
                message.role === 'user'
                  ? styles.userMessage
                  : styles.assistantMessage,
              ]}
            >
              <View
                style={[
                  styles.messageBubble,
                  message.role === 'user'
                    ? styles.userBubble
                    : styles.assistantBubble,
                ]}
              >
                <Text
                  style={[
                    styles.messageText,
                    message.role === 'user'
                      ? styles.userText
                      : styles.assistantText,
                  ]}
                >
                  {message.content}
                </Text>
                {message.role === 'assistant' && renderMetadata(message.metadata)}
              </View>
              <Text style={styles.timestamp}>
                {new Date(message.timestamp).toLocaleTimeString()}
              </Text>
              {message.role === 'assistant' &&
                message.liveLinks &&
                message.liveLinks.length > 0 &&
                renderLinks(message.liveLinks)}
            </View>
          ))
        )}
        {isLoading && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#007AFF" />
            <Text style={{ marginTop: 10, color: '#666' }}>
              Thinking...
            </Text>
          </View>
        )}
      </ScrollView>

      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          placeholder="Ask anything..."
          placeholderTextColor="#999"
          value={inputValue}
          onChangeText={setInputValue}
          onSubmitEditing={handleSendMessage}
          multiline
          editable={!isLoading}
        />
        <TouchableOpacity
          style={[
            styles.sendButton,
            (isLoading || !inputValue.trim()) && styles.sendButtonDisabled,
          ]}
          onPress={handleSendMessage}
          disabled={isLoading || !inputValue.trim()}
        >
          <Text style={{ color: '#fff', fontSize: 18 }}>➤</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default EnhancedLLMChatComponent;
