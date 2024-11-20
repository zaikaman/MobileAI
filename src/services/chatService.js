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
    this.keyLastUsedTime = new Map();
    this.RATE_LIMIT_RESET = 60 * 1000; // 60 seconds in milliseconds
    console.log('ChatService initialized with', {
      totalKeys: this.apiKeys.length,
      currentModel: this.currentModel
    });
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
      console.log('Sending message to ChatGPT:', {
        messageLength: message.length,
        hasImage: !!imageBase64,
        model: this.currentModel,
        historyLength: this.conversationHistory.length
      });

      const key = await this.getValidKey();
      
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

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);

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
            'Authorization': `Bearer ${key}`,
            'Content-Type': 'application/json',
            'x-ms-model-mesh-model-name': this.currentModel
          },
          signal: controller.signal
        }
      );

      clearTimeout(timeoutId);

      const botResponse = response.data.choices[0].message.content;
      this.conversationHistory.push({ role: "assistant", content: botResponse });
      this.keyLastUsedTime.set(key, Date.now());
      this.failedKeys.delete(key);
      return botResponse;

    } catch (error) {
      if (error.name === 'AbortError' || error.response?.status === 429) {
        console.log('Request failed for key:', this.apiKeys[this.currentKeyIndex].slice(0, 8));
        this.failedKeys.add(this.apiKeys[this.currentKeyIndex]);
        this.currentKeyIndex = (this.currentKeyIndex + 1) % this.apiKeys.length;
        
        if (this.failedKeys.size === this.apiKeys.length) {
          throw new Error('All API keys are rate limited');
        }
        
        return this.sendMessage(message, imageBase64);
      }
      console.error('Chat API Error:', {
        status: error.response?.status,
        message: error.message,
        key: this.apiKeys[this.currentKeyIndex].slice(0, 8) + '...'
      });
      throw error;
    }
  }

  async getValidKey() {
    const now = Date.now();
    console.log('Getting valid key...', {
      totalKeys: this.apiKeys.length,
      failedKeys: this.failedKeys.size,
      currentKeyIndex: this.currentKeyIndex
    });

    // Thử tất cả các key
    const startIndex = this.currentKeyIndex;
    do {
      const currentKey = this.apiKeys[this.currentKeyIndex];
      console.log('Checking key:', {
        keyPrefix: currentKey.slice(0, 8) + '...',
        isFailedKey: this.failedKeys.has(currentKey),
        timeSinceLastUse: this.keyLastUsedTime.get(currentKey) 
          ? Math.floor((now - this.keyLastUsedTime.get(currentKey)) / 1000) + 's'
          : 'never'
      });

      if (!this.failedKeys.has(currentKey)) {
        return currentKey;
      }

      // Move to next key
      this.currentKeyIndex = (this.currentKeyIndex + 1) % this.apiKeys.length;
    } while (this.currentKeyIndex !== startIndex);

    // Nếu tất cả key đều failed
    console.log('All keys failed, waiting for cooldown...');
    await new Promise(resolve => setTimeout(resolve, 5000)); // Đợi 5s
    this.failedKeys.clear();
    return this.apiKeys[0];
  }
}

export default new ChatService(); 