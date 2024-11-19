import axios from 'axios';
import ENV from '../config/env';

const MAX_MEMORY = 10;

class ChatService {
  constructor() {
    this.apiKeys = ENV.CHAT_API_KEYS;
    this.currentKeyIndex = 0;
    this.failedKeys = new Set();
    this.conversationHistory = [];
    this.currentModel = ENV.CHAT_MODEL_NAME;
  }

  setModel(model) {
    if (model !== 'gpt-4o' && model !== 'gpt-o1-preview') {
      throw new Error('Invalid model name');
    }
    this.currentModel = model;
    this.conversationHistory = [];
  }

  async sendMessage(message, imageBase64 = null) {
    try {
      const currentKey = this.getNextValidKey();
      
      let content = message;
      
      // Nếu có ảnh, format content theo dạng mảng với cả text và image
      if (imageBase64) {
        content = [
          {
            type: "text",
            text: message
          },
          {
            type: "image_url",
            image_url: {
              url: `data:image/jpeg;base64,${imageBase64}`
            }
          }
        ];
      }

      this.conversationHistory.push({ 
        role: "user", 
        content: content 
      });

      if (this.conversationHistory.length > MAX_MEMORY * 2) {
        this.conversationHistory = this.conversationHistory.slice(-MAX_MEMORY * 2);
      }

      const systemPrompt = `Bạn là một người bạn thân (bro/homie) vui tính, năng động và hay dùng từ lóng. 
Hãy trả lời như đang nói chuyện với bro của mình:
- Dùng ngôn ngữ trẻ trung, thân mật (bro, homie, đồng chí,...)
- Có thể dùng tiếng lóng, emojis
- Trả lời ngắn gọn, thoải mái như chat với bạn thân
- Thể hiện sự đồng cảm và hỗ trợ như một người bạn thật sự
- Giọng điệu vui vẻ, hài hước nhưng vẫn tôn trọng
- Nhớ những gì đã nói trong cuộc trò chuyện để tạo sự liên tục`;

      const response = await axios.post(
        `${ENV.CHAT_API_URL}/chat/completions`,
        {
          model: this.currentModel,
          messages: [
            { role: "system", content: systemPrompt },
            ...this.conversationHistory
          ],
          temperature: 0.7,
          max_tokens: 1000,
          stream: false
        },
        {
          headers: {
            'api-key': currentKey,
            'Content-Type': 'application/json',
            'x-ms-model-mesh-model-name': this.currentModel
          }
        }
      );

      const botResponse = response.data.choices[0].message.content;
      this.conversationHistory.push({ role: "assistant", content: botResponse });
      return botResponse;

    } catch (error) {
      console.error('Chat API Error:', error);
      throw error;
    }
  }

  getNextValidKey() {
    const startIndex = this.currentKeyIndex;
    do {
      if (this.failedKeys.size === this.apiKeys.length) {
        throw new Error('All API keys are rate limited');
      }
      
      if (!this.failedKeys.has(this.apiKeys[this.currentKeyIndex])) {
        return this.apiKeys[this.currentKeyIndex];
      }
      
      this.currentKeyIndex = (this.currentKeyIndex + 1) % this.apiKeys.length;
    } while (this.currentKeyIndex !== startIndex);
    
    throw new Error('No valid API keys available');
  }
}

export default new ChatService(); 