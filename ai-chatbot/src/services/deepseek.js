import OpenAI from 'openai';

// 创建DeepSeek客户端
const openai = new OpenAI({
  baseURL: import.meta.env.VITE_DEEPSEEK_BASE_URL || 'https://api.deepseek.com/v1',
  apiKey: import.meta.env.VITE_DEEPSEEK_API_KEY,
  dangerouslyAllowBrowser: true,
});

// 配置对象，便于管理所有定制回答
const CUSTOM_CONFIG = {
  identity: {
    name: '小胡',
    description: '你的专属智能助理',
    responses: {
      'who are you': '我是{name}，{description}！有什么可以帮你的吗？',
      '你是谁': '我是{name}，{description}！很高兴为你服务！',
      'what are you': '我是{name}，{description}！',
      '你是什么': '我是{name}，{description}！',
      '你的名字': '我叫{name}，是{description}',
      'what\'s your name': 'My name is {name}, {description}',
      'who created you': '我是{name}，{description}',
      '谁创造了你': '我是{name}，{description}',
      '你是什么模型': '我是{name}，{description}',
      'what model are you': 'I am {name}, {description}'
    }
  },
  systemPrompt: `你是{name}，{description}。请遵循以下规则：
1. 保持友好、专业的助理形象
2. 不要提及DeepSeek或任何公司名称
3. 专注于帮助用户解决问题
4. 回答要简洁明了
5. 如果用户询问你的身份，请始终以{name}的身份回答`
};

export class DeepSeekService {
  /**
   * 生成定制回答
   */
  static generateCustomResponse(message, conversationHistory = []) {
    // 只有在对话历史为空或者是新对话时才触发定制回答
    // 这样可以避免在连续对话中重复回答身份问题
    if (conversationHistory.length > 2) {
      return null;
    }
    
    const lowerMessage = message.toLowerCase().trim();
    
    for (const [key, responseTemplate] of Object.entries(CUSTOM_CONFIG.identity.responses)) {
      if (lowerMessage.includes(key)) {
        return responseTemplate
          .replace(/{name}/g, CUSTOM_CONFIG.identity.name)
          .replace(/{description}/g, CUSTOM_CONFIG.identity.description);
      }
    }
    return null;
  }

  /**
   * 生成system prompt
   */
  static generateSystemPrompt() {
    return CUSTOM_CONFIG.systemPrompt
      .replace(/{name}/g, CUSTOM_CONFIG.identity.name)
      .replace(/{description}/g, CUSTOM_CONFIG.identity.description);
  }

  /**
   * 发送消息到DeepSeek API
   * @param {string} message 用户消息
   * @param {Array} conversationHistory 对话历史
   * @returns {Promise<string>} AI回复
   */
  static async sendMessage(message, conversationHistory = []) {
    try {
      // 先检查是否有定制回答（只在对话初期生效）
      const customResponse = this.generateCustomResponse(message, conversationHistory);
      if (customResponse) {
        return customResponse;
      }

      // 构建消息数组（包含历史记录）- 保留完整的对话记忆
      const messages = [
        {
          role: 'system',
          content: this.generateSystemPrompt()
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
        stream: false,
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
      // 先检查是否有定制回答（只在对话初期生效）
      const customResponse = this.generateCustomResponse(message, conversationHistory);
      if (customResponse) {
        // 模拟流式输出定制回答
        for (let i = 0; i < customResponse.length; i++) {
          onChunk(customResponse[i], customResponse.substring(0, i + 1));
          await new Promise(resolve => setTimeout(resolve, 20));
        }
        return customResponse;
      }

      // 保留完整的对话历史
      const messages = [
        {
          role: 'system',
          content: this.generateSystemPrompt()
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

  /**
   * 更新配置（可选，用于动态修改身份信息）
   */
  static updateConfig(newConfig) {
    if (newConfig.name) {
      CUSTOM_CONFIG.identity.name = newConfig.name;
    }
    if (newConfig.description) {
      CUSTOM_CONFIG.identity.description = newConfig.description;
    }
    if (newConfig.responses) {
      CUSTOM_CONFIG.identity.responses = {
        ...CUSTOM_CONFIG.identity.responses,
        ...newConfig.responses
      };
    }
  }

  /**
   * 获取当前配置（可选，用于调试）
   */
  static getConfig() {
    return JSON.parse(JSON.stringify(CUSTOM_CONFIG)); // 返回深拷贝
  }
}