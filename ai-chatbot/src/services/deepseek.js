import OpenAI from 'openai';

// 创建DeepSeek客户端
const openai = new OpenAI({
  baseURL: import.meta.env.VITE_DEEPSEEK_BASE_URL || 'https://api.deepseek.com/v1',
  apiKey: import.meta.env.VITE_DEEPSEEK_API_KEY,
  dangerouslyAllowBrowser: true,
});

export class DeepSeekService {
  /**
   * 发送消息到DeepSeek API
   * @param {string} message 用户消息
   * @param {Array} conversationHistory 对话历史
   * @returns {Promise<string>} AI回复
   */
  static async sendMessage(message, conversationHistory = []) {
    try {
      // 构建消息数组（包含历史记录）
      const messages = [
        {
          role: 'system',
          content: '你是一个有帮助的AI助手，请用简洁清晰的语言回答用户问题。'
        },
        ...conversationHistory,
        {
          role: 'user',
          content: message
        }
      ];

      const completion = await openai.chat.completions.create({
        model: 'deepseek-chat',
        messages: messages,
        stream: false, // 先使用非流式，稳定后再考虑流式
        max_tokens: 1000,
        temperature: 0.7,
      });

      return completion.choices[0].message.content;
    } catch (error) {
      console.error('DeepSeek API调用错误:', error);
      throw new Error(this.handleError(error));
    }
  }

  /**
   * 流式传输消息（高级功能）
   * @param {string} message 用户消息
   * @param {Function} onChunk 处理每个数据块的函数
   * @param {Array} conversationHistory 对话历史
   */
  static async sendMessageStream(message, onChunk, conversationHistory = []) {
    try {
      const messages = [
        {
          role: 'system',
          content: '你是一个有帮助的AI助手'
        },
        ...conversationHistory,
        {
          role: 'user',
          content: message
        }
      ];

      const stream = await openai.chat.completions.create({
        model: 'deepseek-chat',
        messages: messages,
        stream: true,
        max_tokens: 1000,
        temperature: 0.7,
      });

      let fullResponse = '';
      for await (const chunk of stream) {
        const content = chunk.choices[0]?.delta?.content || '';
        fullResponse += content;
        onChunk(content, fullResponse);
      }

      return fullResponse;
    } catch (error) {
      console.error('DeepSeek流式API错误:', error);
      throw new Error(this.handleError(error));
    }
  }

  /**
   * 错误处理
   */
  static handleError(error) {
    if (error.status === 401) {
      return 'API密钥错误，请检查是否正确配置';
    } else if (error.status === 429) {
      return '请求过于频繁，请稍后重试';
    } else if (error.status === 500) {
      return '服务器内部错误，请稍后重试';
    } else {
      return `网络错误: ${error.message}`;
    }
  }
}