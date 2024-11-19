import axios from 'axios';
import ENV from '../config/env';

class StableDiffusionService {
  constructor() {
    this.API_URL = "https://api-inference.huggingface.co/models/stabilityai/stable-diffusion-3.5-large-turbo";
    this.apiKeys = ENV.HUGGINGFACE_API_KEYS;
    this.currentKeyIndex = 0;
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

  async sendMessage(message) {
    try {
      this.currentKeyIndex = (this.currentKeyIndex + 1) % this.apiKeys.length;
      const currentKey = this.getNextValidKey();
      
      const response = await fetch(this.API_URL, {
        headers: {
          Authorization: `Bearer ${currentKey}`,
          "Content-Type": "application/json",
        },
        method: "POST",
        body: JSON.stringify({
          inputs: message,
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