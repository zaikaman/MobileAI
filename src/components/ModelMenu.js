import React from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  StyleSheet,
  Modal
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';

const ModelMenu = ({ visible, onClose, onSelect, currentModel }) => {
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
      name: 'Stable Diffusion 3.5',
      description: 'Tạo ảnh với Stable Diffusion 3.5 🎨',
      model: 'stable-diffusion-3.5'
    }
  ];

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.modalContainer}>
        <View style={styles.menuContent}>
          <View style={styles.header}>
            <Text style={styles.title}>Chọn model</Text>
            <TouchableOpacity 
              onPress={onClose}
              style={styles.closeButton}
            >
              <Ionicons name="close-circle" size={32} color="#ff4444" />
            </TouchableOpacity>
          </View>
          
          {models.map((item, index) => (
            <TouchableOpacity
              key={index}
              style={[
                styles.modelItem,
                currentModel === item.model && styles.selectedModel
              ]}
              onPress={() => {
                onSelect(item);
                onClose();
              }}
            >
              <Text style={styles.modelName}>{item.name}</Text>
              <Text style={styles.modelDescription}>{item.description}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  menuContent: {
    backgroundColor: '#222',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  closeButton: {
    position: 'absolute',
    right: 10,
    top: 10,
    zIndex: 1,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    flex: 1,
    textAlign: 'center',
    color: '#fff'
  },
  modelItem: {
    padding: 16,
    borderRadius: 10,
    marginBottom: 8,
    backgroundColor: '#333',
  },
  selectedModel: {
    backgroundColor: '#0084ff',
  },
  modelName: {
    color: '#fff',
    fontSize: 16,
  },
  modelDescription: {
    color: '#ccc',
    fontSize: 14,
  }
});

export default ModelMenu; 