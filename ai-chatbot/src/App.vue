<template>
  <div class="chat-app">
    <div class="chat-container">
      
      <!-- 极简头部 -->
      <div class="chat-header">
        <div class="header-content">
          <div class="app-logo">AI</div>
          <div class="header-info">
            <h1>智能助手</h1>
            <span class="status-dot" :class="statusClass"></span>
            <span class="status-text">{{ statusText }}</span>
          </div>
        </div>
        <button 
          @click="clearConversation" 
          class="clear-btn"
          :disabled="isLoading"
        >
          <span class="btn-icon">↻</span>
          清空
        </button>
      </div>

      <!-- 消息区域 -->
      <div class="chat-messages" ref="messagesContainer">
        <!-- 欢迎消息 -->
        <div v-if="messages.length === 0" class="welcome-message">
          <div class="welcome-content">
            <div class="welcome-icon">💬</div>
            <h3>欢迎使用</h3>
            <p>我是您的AI助手，随时为您提供帮助</p>
          </div>
        </div>
        
        <!-- 消息列表 -->
        <Message
          v-for="message in messages"
          :key="message.id"
          :message="message"
        />
        
        <!-- 极简输入指示器 -->
        <div v-if="isTyping" class="typing-indicator-minimal">
          <div class="typing-dots-minimal">
            <span></span>
            <span></span>
            <span></span>
          </div>
        </div>
      </div>

      <!-- 极简输入区域 -->
      <div class="input-area-minimal">
        <div class="input-container-minimal">
          <textarea
            v-model="inputText"
            @keydown="handleKeydown"
            placeholder="输入消息..."
            rows="1"
            ref="textInput"
            :disabled="isLoading"
            class="minimal-textarea"
          ></textarea>
          <button
            @click="sendMessage"
            :disabled="!canSend"
            class="send-btn-minimal"
          >
            <span v-if="!isLoading">↑</span>
            <div v-else class="minimal-spinner"></div>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import Message from './components/Message.vue'
import { DeepSeekService } from './services/deepseek'

export default {
  name: 'App',
  components: {
    Message
  },
  data() {
    return {
      messages: [],
      inputText: '',
      isTyping: false,
      isLoading: false,
      statusText: '在线',
      conversationHistory: [] // 存储对话历史用于上下文
    }
  },
  computed: {
    canSend() {
      return this.inputText.trim() && !this.isLoading
    },
    statusClass() {
      return {
        'status-online': !this.isLoading,
        'status-typing': this.isLoading
      }
    }
  },
  methods: {
    async sendMessage() {
      if (!this.canSend) return

      const content = this.inputText.trim()
      
      // 添加用户消息
      this.addMessage(content, 'user')
      
      // 清空输入框
      const userMessage = this.inputText
      this.inputText = ''
      
      // 更新状态
      this.isTyping = true
      this.isLoading = true
      this.statusText = '思考中'

      try {
        // 调用真实的DeepSeek API
        const response = await DeepSeekService.sendMessage(userMessage, this.conversationHistory)
        
        // 添加AI回复
        this.addMessage(response, 'bot')
        
        // 更新对话历史（保持最近的10轮对话）
        this.updateConversationHistory(userMessage, response)
        
      } catch (error) {
        this.addMessage(`抱歉，出现了错误：${error.message}`, 'bot')
        console.error('API调用失败:', error)
      } finally {
        this.isTyping = false
        this.isLoading = false
        this.statusText = '在线'
      }
    },

    addMessage(content, sender) {
      const message = {
        id: Date.now() + Math.random().toString(36).substr(2, 9),
        content,
        sender,
        timestamp: new Date()
      }
      
      this.messages.push(message)
      
      // 滚动到底部
      this.$nextTick(() => {
        this.scrollToBottom()
      })
    },

    updateConversationHistory(userMessage, botResponse) {
      // 添加用户消息到历史
      this.conversationHistory.push({
        role: 'user',
        content: userMessage
      })
      
      // 添加AI回复到历史
      this.conversationHistory.push({
        role: 'assistant',
        content: botResponse
      })
      
      // 保持最近10轮对话（20条消息）
      if (this.conversationHistory.length > 20) {
        this.conversationHistory = this.conversationHistory.slice(-20)
      }
    },

    // 其他方法保持不变...
    handleKeydown(event) {
      if (event.key === 'Enter' && !event.shiftKey) {
        event.preventDefault()
        this.sendMessage()
      }
    },

    clearConversation() {
      this.messages = []
      this.conversationHistory = []
      this.statusText = '对话已清空'
      setTimeout(() => {
        this.statusText = '在线'
      }, 2000)
    },

    scrollToBottom() {
      const container = this.$refs.messagesContainer
      if (container) {
        container.scrollTop = container.scrollHeight
      }
    }
  },

  mounted() {
    this.$refs.textInput?.focus()
  }
}
</script>

<style scoped>
.chat-app {
  width: 100%;
  max-width: 800px;
  height: 90vh;
}

.chat-container {
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 20px rgba(0, 0, 0, 0.08);
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow: hidden;
  border: 1px solid #f0f0f0;
}

/* 极简头部 */
.chat-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 24px;
  background: white;
  border-bottom: 1px solid #f0f0f0;
}

.header-content {
  display: flex;
  align-items: center;
  gap: 16px;
}

.app-logo {
  width: 40px;
  height: 40px;
  background: #2c3e50;
  color: white;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  font-size: 14px;
}

.header-info {
  display: flex;
  align-items: center;
  gap: 8px;
}

.header-info h1 {
  font-size: 18px;
  font-weight: 600;
  color: #2c3e50;
}

.status-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  margin-left: 12px;
}

.status-online {
  background: #27ae60;
}

.status-typing {
  background: #f39c12;
  animation: pulse-minimal 2s infinite;
}

@keyframes pulse-minimal {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}

.status-text {
  font-size: 12px;
  color: #7f8c8d;
}

.clear-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  background: none;
  border: 1px solid #e0e0e0;
  color: #7f8c8d;
  padding: 6px 12px;
  border-radius: 6px;
  cursor: pointer;
  font-size: 12px;
  transition: all 0.2s;
}

.clear-btn:hover:not(:disabled) {
  background: #f8f9fa;
  border-color: #bdc3c7;
}

.clear-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-icon {
  font-size: 14px;
}

/* 消息区域 */
.chat-messages {
  flex: 1;
  padding: 24px;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 16px;
  background: #fafafa;
}

/* 欢迎消息 */
.welcome-message {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100%;
}

.welcome-content {
  text-align: center;
  color: #7f8c8d;
}

.welcome-icon {
  font-size: 48px;
  margin-bottom: 16px;
  opacity: 0.7;
}

.welcome-content h3 {
  font-size: 18px;
  margin-bottom: 8px;
  color: #2c3e50;
}

.welcome-content p {
  font-size: 14px;
}

/* 极简输入指示器 */
.typing-indicator-minimal {
  align-self: flex-start;
  padding: 12px 16px;
  background: white;
  border-radius: 18px;
  border: 1px solid #f0f0f0;
}

.typing-dots-minimal {
  display: flex;
  gap: 3px;
}

.typing-dots-minimal span {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #bdc3c7;
  animation: typing-minimal 1.4s infinite ease-in-out;
}

.typing-dots-minimal span:nth-child(1) { animation-delay: -0.32s; }
.typing-dots-minimal span:nth-child(2) { animation-delay: -0.16s; }

@keyframes typing-minimal {
  0%, 80%, 100% { 
    transform: scale(0.8);
    opacity: 0.5;
  }
  40% { 
    transform: scale(1);
    opacity: 1;
  }
}

/* 极简输入区域 */
.input-area-minimal {
  padding: 20px 24px;
  background: white;
  border-top: 1px solid #f0f0f0;
}

.input-container-minimal {
  display: flex;
  gap: 12px;
  align-items: flex-end;
}

.minimal-textarea {
  flex: 1;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  padding: 12px 16px;
  font-family: inherit;
  font-size: 14px;
  resize: none;
  outline: none;
  transition: all 0.2s;
  max-height: 120px;
  line-height: 1.4;
  background: #fafafa;
}

.minimal-textarea:focus {
  border-color: #2c3e50;
  background: white;
}

.minimal-textarea:disabled {
  background: #f8f9fa;
  cursor: not-allowed;
}

.send-btn-minimal {
  width: 40px;
  height: 40px;
  background: #2c3e50;
  border: none;
  border-radius: 8px;
  color: white;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
  font-size: 16px;
}

.send-btn-minimal:hover:not(:disabled) {
  background: #34495e;
}

.send-btn-minimal:disabled {
  background: #bdc3c7;
  cursor: not-allowed;
}

.minimal-spinner {
  width: 16px;
  height: 16px;
  border: 2px solid transparent;
  border-top: 2px solid white;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}
</style>