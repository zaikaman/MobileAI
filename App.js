import './global.js';
import React from 'react';
import ChatScreen from './src/screens/ChatScreen';
import { LogBox } from 'react-native';

LogBox.ignoreLogs([
  "React Native's New Architecture is always enabled in Expo Go"
]);

export default function App() {
  return <ChatScreen />;
}
