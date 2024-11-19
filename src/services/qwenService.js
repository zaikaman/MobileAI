import { HfInference } from "@huggingface/inference";
import ENV from '../config/env';

class QwenService {
  constructor() {
    this.conversationHistory = [];
    this.apiKeys = ENV.HUGGINGFACE_API_KEYS;
    this.currentKeyIndex = 0;
    this.failedKeys = new Set();
    this.client = null;
    console.log('QwenService initialized');
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

  cleanResponse(text) {
    // Remove all the <|im_start|> and <|im_end|> tags and system/user messages
    const assistantMatch = text.match(/<\|im_start\|>assistant(.*?)(<\|im_end\|>|$)/s);
    if (assistantMatch && assistantMatch[1]) {
      return assistantMatch[1].trim();
    }
    return text;
  }

  async sendMessage(message) {
    try {
      this.currentKeyIndex = (this.currentKeyIndex + 1) % this.apiKeys.length;
      const currentKey = this.getNextValidKey();
      this.client = new HfInference(currentKey);

      console.log('Sending request to Qwen API:', {
        message,
        model: "Qwen/Qwen2.5-Coder-32B-Instruct"
      });

      const response = await this.client.textGeneration({
        model: "Qwen/Qwen2.5-Coder-32B-Instruct",
        inputs: `<|im_start|>system
Bạn là một người bạn thân (bro/homie) vui tính, năng động và hay dùng từ lóng. 
Hãy trả lời bằng Tiếng Việt như đang nói chuyện với bro của mình.
<|im_end|>
<|im_start|>user
${message}
<|im_end|>
<|im_start|>assistant`,
        parameters: {
          max_new_tokens: 500,
          temperature: 0.7,
          top_p: 0.95,
          repetition_penalty: 1.1
        }
      });

      // If we get here, the request was successful
      console.log('Response received:', response);
      const cleanedResponse = this.cleanResponse(response.generated_text);
      return cleanedResponse;
      
    } catch (error) {
      // Check if error is due to rate limiting
      if (error.message.includes('rate limit') || error.message.includes('429')) {
        this.failedKeys.add(this.apiKeys[this.currentKeyIndex]);
        return this.sendMessage(message); // Retry with next key
      }
      
      console.error('Qwen API Error:', error);
      throw error;
    }
  }
}

export default new QwenService(); 