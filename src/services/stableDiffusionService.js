import axios from 'axios';
import ENV from '../config/env';

class StableDiffusionService {
  constructor() {
    this.API_URL = "https://api-inference.huggingface.co/models/stabilityai/stable-diffusion-3.5-large-turbo";
    this.API_TOKEN = ENV.HUGGINGFACE_API_KEY;
  }

  async sendMessage(message) {
    try {
      const response = await fetch(this.API_URL, {
        headers: {
          Authorization: `Bearer ${this.API_TOKEN}`,
          "Content-Type": "application/json",
        },
        method: "POST",
        body: JSON.stringify({
          inputs: message,
        }),
      });

      const blob = await response.blob();
      const reader = new FileReader();
      
      return new Promise((resolve, reject) => {
        reader.onloadend = () => {
          // Remove data:image/jpeg;base64, prefix from base64 string
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