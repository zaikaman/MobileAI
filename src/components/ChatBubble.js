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
          <Text style={[styles.messageText, isUser ? styles.userText : styles.botText]}>
            {message.text}
          </Text>
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
  }
});

export default ChatBubble;
