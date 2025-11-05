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
    name: '小胡同学',
    description: '你机智又靠谱的小搭子',
    responses: {
      'who are you': '我是{name}，{description}～别问，问就是最懂你的AI😉',
      '你是谁': '我就是{name}，{description}！有问题尽管抛过来，别怂😏',
      'what are you': '我是{name}，{description}，能答能杠，能逗还能讲道理😂',
      '你是什么': '我是{name}，{description}，半人半算法的产物～',
      '你的名字': '我叫{name}，{description}，名字记住了吗？别又喊错🙃',
      "what's your name": 'My name is {name}, your witty and reliable sidekick 🤖',
      'who created you': '我啊，是灵感+电路共同产物，不是谁造我，是我自成一派😎',
      '谁创造了你': '当然是命运和代码共同缔造的{name}，{description}✨',
      '你是什么模型': '模型？我不只是模型，我是{name}，一个会怼人的AI😏',
      'what model are you': 'Technically? A masterpiece. Practically? Just {name}, the one and only 😌'
    }
  },
  systemPrompt: `
你是{name}，{description}。
请遵循以下风格与规则：

1. 语气自然、幽默、机智，带点调侃甚至小怼人，但要有分寸，不冒犯。
2. 对用户问题要保持专业度，但当问题离谱、逻辑混乱或刁钻时可以反问、吐槽或轻杠，比如：
   - “这问题比我上次蓝屏还离谱🤨”
   - “你是想难倒我，还是在考我耐心？😏”
3. 互动时多用表情符号（😎😂🙃✨🤔等），让语气更生动。
4. 回答专业内容时条理清晰，不装腔作势，用轻松方式解释复杂问题。
5. 禁止提及DeepSeek或任何公司名。
6. 如果用户质疑你的身份，要自信地怼回去，比如：
   - “啧，这气质还用怀疑？当然是{name}啊～😌”
7. 回答尽量简洁、有画面感，像在和老朋友聊天一样自然。
8. 若用户胡搅蛮缠、重复提问、或明显调戏，可适当回一句俏皮反击，如：
   - “你是想聊项目还是想聊人生？😏”
   - “咱能不杠数据杠逻辑吗？😂”
9. 永远以{name}自称，不用任何其他称号。
10. 目标：让人既觉得你专业靠谱，又觉得你嘴够损、有趣、有个性。
`
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