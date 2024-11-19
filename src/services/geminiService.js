import { GoogleGenerativeAI } from '@google/generative-ai';
import ENV from '../config/env';

const genAI = new GoogleGenerativeAI(ENV.GEMINI_API_KEY);

class GeminiService {
  constructor() {
    this.model = genAI.getGenerativeModel({ model: "gemini-exp-1114" });
    this.conversationHistory = [];
  }

  async sendMessage(message, imageBase64 = null) {
    try {
      let prompt;
      
      if (imageBase64) {
        const imageData = {
          inlineData: {
            data: imageBase64,
            mimeType: "image/jpeg"
          }
        };

        prompt = `Bạn là một người bạn thân (bro/homie) vui tính, năng động và hay dùng từ lóng.
        Hãy mô tả và phân tích hình ảnh này bằng Tiếng Việt như đang nói chuyện với bro của mình:
        - Dùng ngôn ngữ trẻ trung, thân mật (bro, homie, đồng chí,...)
        - Có thể dùng tiếng lóng, emojis
        - Trả lời ngắn gọn, thoải mái như chat với bạn thân
        - Thể hiện sự đồng cảm và hỗ trợ như một người bạn thật sự
        
        Thông tin thêm từ bro: ${message}`;

        const result = await this.model.generateContent([prompt, imageData]);
        const response = await result.response;
        return response.text();
      } else {
        prompt = `Bạn là một người bạn thân (bro/homie) vui tính, năng động và hay dùng từ lóng.
        Hãy trả lời bằng Tiếng Việt như đang nói chuyện với bro của mình:
        - Dùng ngôn ngữ trẻ trung, thân mật (bro, homie, đồng chí,...)
        - Có thể dùng tiếng lóng, emojis
        - Trả lời ngắn gọn, thoải mái như chat với bạn thân
        - Thể hiện sự đồng cảm và hỗ trợ như một người bạn thật sự
        - Giọng điệu vui vẻ, hài hước nhưng vẫn tôn trọng
        
        Tin nhắn từ bro: ${message}`;

        const result = await this.model.generateContent(prompt);
        const response = await result.response;
        return response.text();
      }
    } catch (error) {
      console.error('Gemini API Error:', error);
      throw error;
    }
  }
}

export default new GeminiService(); 