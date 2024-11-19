import React from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity, Alert, Clipboard, ScrollView, Platform } from 'react-native';
import * as MediaLibrary from 'expo-media-library';
import * as FileSystem from 'expo-file-system';
import { MaterialIcons } from '@expo/vector-icons';

const ChatBubble = ({ message, isUser }) => {
  const isImage = typeof message === 'object' && message.image;
  const isCode = message.text && message.text.includes('```');

  const copyToClipboard = async (textToCopy) => {
    try {
      await Clipboard.setString(textToCopy);
      Alert.alert('Thành công', 'Đã copy tin nhắn vào clipboard! 📋');
    } catch (error) {
      console.error('Copy error:', error);
      Alert.alert('Error', 'Không thể copy tin nhắn');
    }
  };

  const formatAndCopyCode = (text) => {
    // Extract code between ``` markers
    const codeMatch = text.match(/```(?:\w+)?\s*([\s\S]*?)```/);
    if (codeMatch) {
      const code = codeMatch[1].trim();
      copyToClipboard(code);
    }
  };

  const renderText = (text) => {
    if (isCode) {
      // Split text into parts before, during and after code block
      const parts = text.split(/(```[\s\S]*?```)/);
      return parts.map((part, index) => {
        if (part.startsWith('```')) {
          // Format code block
          const code = part.replace(/```(\w+)?\s*([\s\S]*?)```/, '$2').trim();
          return (
            <TouchableOpacity 
              key={index}
              style={styles.codeBlock}
              onLongPress={() => formatAndCopyCode(part)}
              delayLongPress={500}
            >
              <Text style={styles.codeText}>{code}</Text>
              <Text style={styles.copyHint}>Giữ để copy code</Text>
            </TouchableOpacity>
          );
        }
        return <Text key={index} style={[styles.messageText, isUser ? styles.userText : styles.botText]}>{part}</Text>;
      });
    }
    return (
      <Text style={[styles.messageText, isUser ? styles.userText : styles.botText]}>
        {text}
      </Text>
    );
  };

  const saveImage = async () => {
    try {
      const { status } = await MediaLibrary.requestPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission needed', 'Please grant permission to save images');
        return;
      }

      const base64Data = message.image;
      const filename = `coolbrochat_${Date.now()}.jpg`;
      const fileUri = `${FileSystem.documentDirectory}${filename}`;
      
      await FileSystem.writeAsStringAsync(fileUri, base64Data, {
        encoding: FileSystem.EncodingType.Base64,
      });

      const asset = await MediaLibrary.createAssetAsync(fileUri);
      const album = await MediaLibrary.getAlbumAsync('Cool Bro Chat');
      
      if (album === null) {
        await MediaLibrary.createAlbumAsync('Cool Bro Chat', asset, false);
      } else {
        await MediaLibrary.addAssetsToAlbumAsync([asset], album, false);
      }
      
      await FileSystem.deleteAsync(fileUri);
      Alert.alert('Thành công', 'Đã lưu ảnh vào thư viện!');
    } catch (error) {
      console.error('Error saving image:', error);
      Alert.alert('Error', 'Failed to save image');
    }
  };

  return (
    <View style={[styles.bubbleContainer, isUser ? styles.userBubble : styles.botBubble]}>
      {isImage ? (
        <View>
          {message.text && (
            <Text style={[styles.messageText, isUser ? styles.userText : styles.botText]}>
              {message.text}
            </Text>
          )}
          <TouchableOpacity onLongPress={saveImage} delayLongPress={500}>
            <Image 
              source={{ uri: `data:image/jpeg;base64,${message.image}` }} 
              style={styles.image} 
              resizeMode="contain" 
            />
            <Text style={styles.saveHint}>Giữ để lưu ảnh</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <TouchableOpacity onLongPress={() => copyToClipboard(message.text)} delayLongPress={500}>
          {renderText(message.text)}
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  bubbleContainer: {
    maxWidth: '80%',
    padding: 12,
    borderRadius: 20,
    marginVertical: 5,
  },
  userBubble: {
    backgroundColor: '#007AFF',
    alignSelf: 'flex-end',
    marginRight: 10,
  },
  botBubble: {
    backgroundColor: '#333',
    alignSelf: 'flex-start',
    marginLeft: 10,
  },
  messageText: {
    fontSize: 16,
    marginBottom: 5,
  },
  userText: {
    color: '#fff',
  },
  botText: {
    color: '#fff',
  },
  image: {
    width: 200,
    height: 200,
    borderRadius: 10,
    marginTop: 5,
  },
  saveHint: {
    color: '#999',
    fontSize: 12,
    textAlign: 'center',
    marginTop: 5,
  },
  codeBlock: {
    backgroundColor: '#1e1e1e',
    padding: 10,
    borderRadius: 8,
    marginVertical: 5,
  },
  codeText: {
    color: '#fff',
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    fontSize: 14,
  },
  copyHint: {
    color: '#666',
    fontSize: 12,
    textAlign: 'center',
    marginTop: 5,
  },
});

export default ChatBubble;
