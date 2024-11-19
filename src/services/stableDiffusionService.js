import axios from 'axios';
import ENV from '../config/env';

class StableDiffusionService {
  constructor() {
    this.API_URL = "https://api-inference.huggingface.co/models/stabilityai/stable-diffusion-3.5-large-turbo";
    this.apiKeys = ENV.HUGGINGFACE_API_KEYS;
    this.chatApiKeys = ENV.CHAT_API_KEYS;
    this.currentKeyIndex = 0;
    this.currentChatKeyIndex = 0;
    this.failedKeys = new Set();
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

  async translateToEnglish(message) {
    try {
      const response = await axios.post(
        `${ENV.CHAT_API_URL}/chat/completions`,
        {
          model: 'gpt-4o',
          messages: [
            {
              role: "system",
              content: "You are a translator. If the input is not in English, translate it to English. If it's already in English, return it as is. Only return the translation/original text, nothing else."
            },
            { role: "user", content: message }
          ],
          temperature: 0.3,
          max_tokens: 200,
        },
        {
          headers: {
            'api-key': this.chatApiKeys[this.currentChatKeyIndex],
            'Content-Type': 'application/json'
          }
        }
      );

      return response.data.choices[0].message.content;
    } catch (error) {
      console.error('Translation error:', error);
      this.currentChatKeyIndex = (this.currentChatKeyIndex + 1) % this.chatApiKeys.length;
      return message; // Return original message if translation fails
    }
  }

  async sendMessage(message) {
    try {
      const translatedMessage = await this.translateToEnglish(message);
      const currentKey = this.getNextValidKey();
      
      const response = await fetch(this.API_URL, {
        headers: {
          Authorization: `Bearer ${currentKey}`,
          "Content-Type": "application/json",
        },
        method: "POST",
        body: JSON.stringify({
          inputs: translatedMessage,
        }),
      });

      if (response.status === 429) {
        this.failedKeys.add(currentKey);
        return this.sendMessage(message);
      }

      const blob = await response.blob();
      const reader = new FileReader();
      
      return new Promise((resolve, reject) => {
        reader.onloadend = () => {
          const base64data = reader.result.split(',')[1];
          resolve({
            text: "Đây là ảnh được tạo từ prompt của bro! 🎨",
            image: base64data
          });
        };
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });
    } catch (error) {
      console.error('Stable Diffusion API Error:', error);
      throw error;
    }
  }
}

export default new StableDiffusionService();