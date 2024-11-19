import React, { useState, useRef, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TextInput, 
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Image,
  AppState,
  Alert
} from 'react-native';
import ChatBubble from '../components/ChatBubble';
import chatService from '../services/chatService';
import geminiService from '../services/geminiService';
import ModelSelector from '../components/ModelSelector';
import TypingIndicator from '../components/TypingIndicator';
import { Ionicons } from '@expo/vector-icons';
import ModelMenu from '../components/ModelMenu';
import midjourneyService from '../services/midjourneyService';
import notificationService from '../services/notificationService';
import * as Notifications from 'expo-notifications';
import backgroundTaskManager from '../services/backgroundTaskService';
import AsyncStorage from '@react-native-async-storage/async-storage';
import stableDiffusionService from '../services/stableDiffusionService';
import qwenService from '../services/qwenService';
import * as ImagePicker from 'expo-image-picker';

export default function ChatScreen() {
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const scrollViewRef = useRef();
  const [showModelSelector, setShowModelSelector] = useState(true);
  const [currentService, setCurrentService] = useState(null);
  const [isTyping, setIsTyping] = useState(false);
  const [showModelMenu, setShowModelMenu] = useState(false);
  const [currentModel, setCurrentModel] = useState('gpt-4o');
  const appState = useRef(AppState.currentState);
  const [appStateVisible, setAppStateVisible] = useState(appState.current);
  const [selectedImage, setSelectedImage] = useState(null);

  useEffect(() => {
    // Configure notifications
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: false,
      }),
    });

    // Monitor app state changes
    const subscription = AppState.addEventListener('change', async (nextAppState) => {
      if (appState.current === 'background' && nextAppState === 'active') {
        // App vừa active trở lại
        const pendingMessageStr = await AsyncStorage.getItem('pendingMessage');
        if (pendingMessageStr) {
          const pendingMessage = JSON.parse(pendingMessageStr);
          setIsTyping(true);
          
          try {
            const service = {
              'ChatService': chatService,
              'GeminiService': geminiService,
              'MidjourneyService': midjourneyService,
              'StableDiffusionService': stableDiffusionService
            }[pendingMessage.service];

            const response = await service.sendMessage(pendingMessage.text);
            setMessages(prev => [...prev, { text: response, isUser: false }]);
            await AsyncStorage.removeItem('pendingMessage');
          } catch (error) {
            console.error('Failed to process pending message:', error);
            setMessages(prev => [...prev, { 
              text: "Sorry bro, không thể xử lý tin nhắn trước đó 😢", 
              isUser: false 
            }]);
          } finally {
            setIsTyping(false);
          }
        }
      }
      appState.current = nextAppState;
      setAppStateVisible(nextAppState);
    });

    const initBackgroundTask = async () => {
      await backgroundTaskManager.init();
    };
    initBackgroundTask();

    return () => {
      subscription.remove();
    };
  }, []);

  const handleModelSelect = ({ type, model }) => {
    console.log('Model selected:', { type, model });
    
    if (type === 'gpt') {
      console.log('Initializing GPT service with model:', model);
      chatService.setModel(model);
      setCurrentService(chatService);
      setCurrentModel('gpt-4o');
    } else if (type === 'gemini') {
      console.log('Initializing Gemini service');
      setCurrentService(geminiService);
      setCurrentModel('gemini-exp-1114');
    } else if (type === 'qwen') {
      console.log('Initializing Qwen service');
      setCurrentService(qwenService);
      setCurrentModel('qwen-coder');
    } else if (type === 'image') {
      console.log('Initializing Stable Diffusion service');
      setCurrentService(stableDiffusionService);
      setCurrentModel('stable-diffusion-3.5');
    } 
    setShowModelSelector(false);
    setShowModelMenu(false);
  };

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    
    if (status !== 'granted') {
      Alert.alert('Sorry bro', 'Cần quyền truy cập thư viện ảnh để thực hiện tính năng này!');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      base64: true,
      quality: 0.8,
    });

    if (!result.canceled) {
      setSelectedImage(result.assets[0].base64);
    }
  };

  const sendMessage = async () => {
    if (!inputText.trim() && !selectedImage || !currentService) return;

    const messageText = inputText.trim();
    const messageObj = {
      text: messageText,
      image: selectedImage,
      isUser: true
    };

    setMessages(prev => [...prev, messageObj]);
    setInputText('');
    setSelectedImage(null);
    setIsTyping(true);

    try {
      if (appState.current === 'active') {
        if (currentService.constructor.name === 'StableDiffusionService') {
          // Nếu là Stable Diffusion, chỉ gửi text prompt
          const response = await currentService.sendMessage(messageText);
          setMessages(prev => [...prev, { 
            text: response.text,
            image: response.image,
            isUser: false 
          }]);
        } else {
          // Các service khác vẫn giữ nguyên logic cũ
          const response = await currentService.sendMessage(messageText, selectedImage);
          setMessages(prev => [...prev, { 
            text: response,
            isUser: false 
          }]);
        }
      } else {
        await AsyncStorage.setItem('pendingMessage', JSON.stringify({
          text: messageText,
          image: selectedImage,
          service: currentService.constructor.name
        }));
        setIsTyping(false);
        notificationService.scheduleNotification(
          'Cool Bro Chat',
          'Tin nhắn sẽ được xử lý khi bạn mở lại app nhé! 🔄'
        );
      }
    } catch (error) {
      console.error('Message handling error:', error);
      setMessages(prev => [...prev, { 
        text: "Sorry bro, tôi đang gặp chút vấn đề. Thử lại sau nhé!",
        isUser: false 
      }]);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={styles.container}
    >
      <ModelSelector 
        visible={showModelSelector}
        onSelect={handleModelSelect}
      />
      
      <View style={styles.header}>
        <Image 
          source={{ 
            uri: 'https://i.pravatar.cc/100'  // Avatar ngẫu nhiên từ pravatar.cc
          }} 
          style={styles.avatar}
        />
        <Text style={styles.headerText}>Cool Homie</Text>
        <TouchableOpacity 
          style={styles.menuButton}
          onPress={() => setShowModelMenu(true)}
        >
          <Ionicons name="menu" size={24} color="#fff" />
        </TouchableOpacity>
      </View>

      <ModelMenu 
        visible={showModelMenu}
        onClose={() => setShowModelMenu(false)}
        onSelect={handleModelSelect}
        currentModel={currentModel}
      />

      <ScrollView 
        ref={scrollViewRef}
        style={styles.chatContainer}
        contentContainerStyle={styles.chatContent}
        onContentSizeChange={() => scrollViewRef.current.scrollToEnd({ animated: true })}
      >
        {messages.map((msg, index) => (
          <ChatBubble 
            key={index}
            message={msg}
            isUser={msg.isUser}
          />
        ))}
        {isTyping && <TypingIndicator />}
      </ScrollView>
      
      <View style={styles.inputContainer}>
        {selectedImage && (
          <View style={styles.selectedImageContainer}>
            <Image 
              source={{ uri: `data:image/jpeg;base64,${selectedImage}` }}
              style={styles.selectedImagePreview}
            />
            <TouchableOpacity 
              onPress={() => setSelectedImage(null)}
              style={styles.removeImageButton}
            >
              <Ionicons name="close-circle" size={24} color="#ff4444" />
            </TouchableOpacity>
          </View>
        )}
        
        <View style={styles.inputRow}>
          <TouchableOpacity 
            style={styles.imageButton} 
            onPress={pickImage}
          >
            <Ionicons name="image" size={24} color="#007AFF" />
          </TouchableOpacity>

          <TextInput
            style={styles.input}
            value={inputText}
            onChangeText={setInputText}
            placeholder="Nhắn gì đó đi bro..."
            placeholderTextColor="#666"
            multiline
          />

          <TouchableOpacity 
            style={styles.sendButton} 
            onPress={sendMessage}
          >
            <Ionicons name="send" size={24} color="#007AFF" />
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a1a',
    paddingTop: Platform.OS === 'ios' ? 44 : 0, // Safe area for iOS
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#222',
    borderBottomWidth: 1,
    borderBottomColor: '#333',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
    borderWidth: 2,
    borderColor: '#0084ff',
  },
  headerText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  chatContainer: {
    flex: 1,
  },
  chatContent: {
    padding: 16,
    paddingBottom: 32,
  },
  inputContainer: {
    padding: 10,
    backgroundColor: '#1c1c1e',
    borderTopWidth: 1,
    borderTopColor: '#333',
  },
  input: {
    flex: 1,
    marginHorizontal: 10,
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: '#2c2c2e',
    borderRadius: 20,
    color: '#fff',
    maxHeight: 100,
  },
  sendButton: {
    padding: 10,
  },
  sendButtonDisabled: {
    backgroundColor: '#333',
  },
  sendButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  menuButton: {
    marginLeft: 'auto',
    padding: 8,
  },
  imageResponse: {
    width: 300,
    height: 300,
    borderRadius: 10,
  },
  selectedImageContainer: {
    marginBottom: 10,
    position: 'relative',
  },
  selectedImagePreview: {
    width: 100,
    height: 100,
    borderRadius: 8,
  },
  removeImageButton: {
    position: 'absolute',
    top: -10,
    right: -10,
    backgroundColor: '#000',
    borderRadius: 12,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  imageButton: {
    padding: 10,
  },
});
