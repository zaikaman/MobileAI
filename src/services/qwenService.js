import { HfInference } from "@huggingface/inference";
import ENV from '../config/env';

const client = new HfInference(ENV.HUGGINGFACE_API_KEY);

class QwenService {
  constructor() {
    this.conversationHistory = [];
    console.log('QwenService initialized');
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
      console.log('Sending request to Qwen API:', {
        message,
        model: "Qwen/Qwen2.5-Coder-32B-Instruct"
      });

      const response = await client.textGeneration({
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

      console.log('Response received:', response);
      const cleanedResponse = this.cleanResponse(response.generated_text);
      return cleanedResponse;
      
    } catch (error) {
      console.error('Qwen API Error:', error);
      throw error;
    }
  }
}

export default new QwenService(); 