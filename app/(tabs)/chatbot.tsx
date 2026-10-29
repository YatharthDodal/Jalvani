import React, { useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MessageCircle, Send, Bot, User, Lightbulb } from 'lucide-react-native';

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'bot';
  timestamp: Date;
}

export default function ChatbotScreen() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      text: 'Hello! I\'m your Water Management Assistant. I can help you with groundwater data analysis, water budget calculations, and sustainability recommendations. What would you like to know?',
      sender: 'bot',
      timestamp: new Date(),
    }
  ]);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);

  const quickActions = [
    'Current water levels',
    'Water budget analysis',
    'Sustainability tips',
    'Alert thresholds',
    'Rainfall forecast',
    'Conservation methods',
  ];

  const sendMessage = async () => {
    if (!inputText.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      text: inputText.trim(),
      sender: 'user',
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInputText('');
    setIsTyping(true);

    // Simulate bot response
    setTimeout(() => {
      const botResponse = generateBotResponse(userMessage.text);
      const botMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: botResponse,
        sender: 'bot',
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, botMessage]);
      setIsTyping(false);
    }, 1500);
  };

  const generateBotResponse = (userInput: string): string => {
    const input = userInput.toLowerCase();
    
    if (input.includes('water level') || input.includes('current')) {
      return 'Based on the latest DWLR readings:\n\n• DWLR-North-01: 8.2m (Critical - below threshold)\n• DWLR-Central-05: 12.5m (Good)\n• DWLR-South-03: 9.8m (Warning)\n• DWLR-East-02: 15.2m (Good)\n\nWould you like detailed analysis for any specific station?';
    }
    
    if (input.includes('budget') || input.includes('calculation')) {
      return 'For water budget analysis, I need some information:\n\n• Regional population\n• Agricultural area (hectares)\n• Industrial water usage\n• Current groundwater recharge rates\n\nYou can use the Budget Calculator tab for detailed calculations, or I can help you interpret existing results. What specific aspect interests you?';
    }
    
    if (input.includes('sustain') || input.includes('tip') || input.includes('conserv')) {
      return 'Here are key sustainability recommendations:\n\n🌊 Water Conservation:\n• Implement drip irrigation\n• Fix leakages promptly\n• Use native, drought-resistant crops\n\n♻️ Recharge Enhancement:\n• Rainwater harvesting systems\n• Percolation tanks\n• Contour bunding\n\n📊 Monitoring:\n• Regular groundwater level checks\n• Soil moisture monitoring\n• Usage pattern analysis\n\nWould you like details on any specific method?';
    }
    
    if (input.includes('alert') || input.includes('threshold')) {
      return 'Current alert thresholds:\n\n🚨 Critical: < 8.5 meters\n⚠️ Warning: < 10.0 meters\n✅ Good: > 10.0 meters\n\nRainfall alerts:\n• No rain for 7+ days triggers drought alert\n• Heavy rainfall (>50mm/day) triggers flood watch\n\nYou can customize these thresholds in the Alerts tab. Would you like to know about setting up custom alerts for your region?';
    }
    
    if (input.includes('rain') || input.includes('weather') || input.includes('forecast')) {
      return 'Current weather data:\n\n🌧️ Last 24h rainfall: 5.2mm\n📅 7-day forecast: Light showers expected\n☁️ Monsoon status: Pre-monsoon phase\n\nFor detailed weather forecasts and their impact on groundwater recharge, I recommend checking with local meteorological services. Would you like tips on interpreting rainfall data for water management?';
    }
    
    if (input.includes('help') || input.includes('what can you do')) {
      return 'I can assist you with:\n\n📊 Real-time Data Analysis\n• Current water levels\n• Trend interpretation\n• Comparative analysis\n\n💧 Water Management\n• Budget calculations\n• Conservation strategies\n• Sustainability planning\n\n🚨 Alert Management\n• Threshold explanations\n• Custom alert setup\n• Risk assessment\n\n🌾 Agricultural Guidance\n• Crop water requirements\n• Irrigation optimization\n• Seasonal planning\n\nJust ask me anything about water management!';
    }
    
    // Default response
    return 'I understand you\'re asking about water management. I can help with:\n\n• Current groundwater levels and trends\n• Water budget calculations and analysis\n• Conservation and sustainability strategies\n• Alert thresholds and monitoring\n• Agricultural water management\n\nCould you be more specific about what you\'d like to know? You can also try one of the quick actions below.';
  };

  const sendQuickAction = (action: string) => {
    setInputText(action);
    sendMessage();
  };

  useEffect(() => {
    scrollViewRef.current?.scrollToEnd({ animated: true });
  }, [messages]);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <MessageCircle size={24} color="#FFFFFF" />
          <View style={styles.headerText}>
            <Text style={styles.title}>Water Assistant</Text>
            <Text style={styles.subtitle}>AI-powered water management help</Text>
          </View>
        </View>
      </View>

      <KeyboardAvoidingView 
        style={styles.chatContainer}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView 
          ref={scrollViewRef}
          style={styles.messagesContainer}
          contentContainerStyle={styles.messagesContent}
        >
          {messages.map((message) => (
            <View
              key={message.id}
              style={[
                styles.messageContainer,
                message.sender === 'user' ? styles.userMessage : styles.botMessage
              ]}
            >
              <View style={styles.messageHeader}>
                <View style={[
                  styles.avatar,
                  message.sender === 'user' ? styles.userAvatar : styles.botAvatar
                ]}>
                  {message.sender === 'user' ? (
                    <User size={16} color="#FFFFFF" />
                  ) : (
                    <Bot size={16} color="#FFFFFF" />
                  )}
                </View>
                <Text style={styles.senderName}>
                  {message.sender === 'user' ? 'You' : 'Assistant'}
                </Text>
                <Text style={styles.timestamp}>
                  {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </Text>
              </View>
              <View style={[
                styles.messageBubble,
                message.sender === 'user' ? styles.userBubble : styles.botBubble
              ]}>
                <Text style={[
                  styles.messageText,
                  message.sender === 'user' ? styles.userText : styles.botText
                ]}>
                  {message.text}
                </Text>
              </View>
            </View>
          ))}

          {isTyping && (
            <View style={[styles.messageContainer, styles.botMessage]}>
              <View style={styles.messageHeader}>
                <View style={[styles.avatar, styles.botAvatar]}>
                  <Bot size={16} color="#FFFFFF" />
                </View>
                <Text style={styles.senderName}>Assistant</Text>
              </View>
              <View style={[styles.messageBubble, styles.botBubble, styles.typingBubble]}>
                <Text style={[styles.messageText, styles.botText]}>
                  Analyzing data...
                </Text>
              </View>
            </View>
          )}
        </ScrollView>

        <View style={styles.quickActionsContainer}>
          <View style={styles.quickActionsHeader}>
            <Lightbulb size={16} color="#6B7280" />
            <Text style={styles.quickActionsTitle}>Quick Questions</Text>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {quickActions.map((action, index) => (
              <TouchableOpacity
                key={index}
                style={styles.quickAction}
                onPress={() => sendQuickAction(action)}
              >
                <Text style={styles.quickActionText}>{action}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        <View style={styles.inputContainer}>
          <View style={styles.inputWrapper}>
            <TextInput
              style={styles.textInput}
              value={inputText}
              onChangeText={setInputText}
              placeholder="Ask about water levels, budgets, sustainability..."
              multiline
              maxLength={500}
            />
            <TouchableOpacity
              style={[styles.sendButton, !inputText.trim() && styles.sendButtonDisabled]}
              onPress={sendMessage}
              disabled={!inputText.trim() || isTyping}
            >
              <Send size={20} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    backgroundColor: '#8B5CF6',
    padding: 20,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  headerText: {
    flex: 1,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: '#E9D5FF',
  },
  chatContainer: {
    flex: 1,
  },
  messagesContainer: {
    flex: 1,
  },
  messagesContent: {
    padding: 16,
    paddingBottom: 20,
  },
  messageContainer: {
    marginBottom: 16,
  },
  userMessage: {
    alignItems: 'flex-end',
  },
  botMessage: {
    alignItems: 'flex-start',
  },
  messageHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 8,
  },
  avatar: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  userAvatar: {
    backgroundColor: '#0EA5E9',
  },
  botAvatar: {
    backgroundColor: '#8B5CF6',
  },
  senderName: {
    fontSize: 12,
    fontWeight: '600',
    color: '#374151',
  },
  timestamp: {
    fontSize: 10,
    color: '#9CA3AF',
    marginLeft: 'auto',
  },
  messageBubble: {
    maxWidth: '80%',
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  userBubble: {
    backgroundColor: '#0EA5E9',
    borderBottomRightRadius: 4,
  },
  botBubble: {
    backgroundColor: '#FFFFFF',
    borderBottomLeftRadius: 4,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  typingBubble: {
    opacity: 0.8,
  },
  messageText: {
    fontSize: 15,
    lineHeight: 20,
  },
  userText: {
    color: '#FFFFFF',
  },
  botText: {
    color: '#374151',
  },
  quickActionsContainer: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  quickActionsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 10,
  },
  quickActionsTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6B7280',
  },
  quickAction: {
    backgroundColor: '#F3F4F6',
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginRight: 8,
  },
  quickActionText: {
    fontSize: 12,
    color: '#4B5563',
    fontWeight: '500',
  },
  inputContainer: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 12,
    backgroundColor: '#F9FAFB',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  textInput: {
    flex: 1,
    fontSize: 16,
    color: '#374151',
    maxHeight: 100,
    paddingVertical: 8,
  },
  sendButton: {
    backgroundColor: '#8B5CF6',
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: '#D1D5DB',
  },
});