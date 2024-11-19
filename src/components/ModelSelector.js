import React from 'react';
import { 
  Modal, 
  View, 
  Text, 
  TouchableOpacity, 
  StyleSheet 
} from 'react-native';

const ModelSelector = ({ visible, onSelect }) => {
  const models = [
    {
      type: 'gpt',
      name: 'GPT-4',
      description: 'Trò chuyện với bro GPT-4 🤖',
      model: 'gpt-4o'
    },
    {
      type: 'gemini',
      name: 'Gemini',
      description: 'Trò chuyện với bro Gemini 🧠',
      model: 'gemini-exp-1114'
    },
    {
      type: 'qwen',
      name: 'Qwen Coder',
      description: 'Chat với bro Qwen Coder 👨‍💻',
      model: 'qwen-coder'
    },
    {
      type: 'image',
      name: 'Stable Diffusion',
      description: 'Tạo ảnh với Stable Diffusion 3.5 🎨',
      model: 'stable-diffusion-3.5'
    }
  ];

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
    >
      <View style={styles.container}>
        <View style={styles.content}>
          <Text style={styles.title}>Chọn model AI</Text>
          
          {models.map(model => (
            <TouchableOpacity 
              key={model.model}
              style={styles.button}
              onPress={() => onSelect(model)}
            >
              <Text style={styles.buttonText}>{model.name}</Text>
              <Text style={styles.buttonDescription}>
                {model.description}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    backgroundColor: '#222',
    borderRadius: 12,
    padding: 20,
    width: '80%',
  },
  title: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  description: {
    color: '#ccc',
    marginBottom: 20,
  },
  button: {
    backgroundColor: '#333',
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  buttonDescription: {
    color: '#999',
    fontSize: 14,
  }
});

export default ModelSelector; 