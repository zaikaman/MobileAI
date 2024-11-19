import axios from 'axios';

const API_URL = "https://api-inference.huggingface.co/models/Jovie/Midjourney";
const API_TOKEN = "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";

class MidjourneyService {
  constructor() {
    this.headers = {
      "Authorization": `Bearer ${API_TOKEN}`,
      "Content-Type": "application/json"
    };
    console.log('MidjourneyService initialized');
  }

  async sendMessage(prompt) {
    try {
      console.log('Sending request to Midjourney API:', {
        url: API_URL,
        prompt,
        headers: { ...this.headers, Authorization: 'Bearer [HIDDEN]' }
      });

      const startTime = Date.now();
      const response = await axios.post(API_URL, 
        { inputs: prompt },
        { 
          headers: this.headers,
          responseType: 'arraybuffer'
        }
      );
      const endTime = Date.now();

      console.log('Received response from Midjourney API:', {
        status: response.status,
        dataLength: response.data?.length,
        headers: response.headers,
        responseTime: `${endTime - startTime}ms`
      });

      // Convert image buffer to base64
      console.log('Converting response to base64...');
      const base64Image = Buffer.from(response.data, 'binary').toString('base64');
      console.log('Base64 conversion successful, length:', base64Image.length);

      return `data:image/jpeg;base64,${base64Image}`;
      
    } catch (error) {
      console.error('Midjourney API Error Details:', {
        message: error.message,
        code: error.code,
        response: {
          status: error.response?.status,
          statusText: error.response?.statusText,
          headers: error.response?.headers,
          data: error.response?.data
        },
        request: {
          url: API_URL,
          method: 'POST',
          headers: { ...this.headers, Authorization: 'Bearer [HIDDEN]' }
        }
      });
      throw error;
    }
  }
}

export default new MidjourneyService(); 