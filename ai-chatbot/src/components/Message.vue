<template>
  <div :class="['message', messageClass]">
    <div class="message-content">
      <div 
        class="message-text" 
        :class="{ 'bot-text': message.sender === 'bot' }"
        v-html="formattedContent"
      ></div>
      <div class="message-time">{{ formattedTime }}</div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'Message',
  props: {
    message: {
      type: Object,
      required: true
    }
  },
  computed: {
    messageClass() {
      return `${this.message.sender}-message`
    },
    formattedTime() {
      return this.message.timestamp.toLocaleTimeString('zh-CN', {
        hour: '2-digit',
        minute: '2-digit'
      })
    },
    formattedContent() {
      return this.formatText(this.message.content)
    }
  },
  methods: {
    formatText(content) {
      if (!content) return ''
      
      let formatted = this.escapeHtml(content)
      
      // 处理顺序很重要！
      
      // 1. 先处理代码块 ```code``` - 修复版本
      formatted = this.formatCodeBlocks(formatted)
      
      // 2. 处理列表
      formatted = this.formatLists(formatted)
      
      // 3. 处理引用 >
      formatted = this.formatQuotes(formatted)
      
      // 4. 处理内联代码 `code`
      formatted = this.formatInlineCode(formatted)
      
      // 5. 处理加粗 **bold**
      formatted = this.formatBold(formatted)
      
      // 6. 处理换行和段落
      formatted = this.formatParagraphs(formatted)
      
      return formatted
    },
    
    formatCodeBlocks(text) {
      // 处理 ```语言\ncode\n``` 格式的代码块 - 修复版本
      return text.replace(/```(\w+)?\n([\s\S]*?)```/g, (match, language, code) => {
        const lang = language || 'text'
        // 保留代码中的换行符，但转义HTML
        const formattedCode = this.escapeHtml(code)
          .replace(/\n/g, '<br>')  // 保留换行
          .replace(/ /g, '&nbsp;') // 保留空格
          .replace(/\t/g, '&nbsp;&nbsp;&nbsp;&nbsp;') // 保留制表符
        
        return `<pre class="code-block"><code class="language-${lang}">${formattedCode}</code></pre>`
      })
    },
    
    formatInlineCode(text) {
      // 处理 `inline code`
      return text.replace(/`([^`]+)`/g, '<code class="inline-code">$1</code>')
    },
    
    formatLists(text) {
      // 处理无序列表 - item
      let formatted = text.replace(/^-\s+(.+)$/gm, '<li class="list-item">$1</li>')
      // 处理数字列表 1. item
      formatted = formatted.replace(/^(\d+)\.\s+(.+)$/gm, '<li class="list-item ordered">$2</li>')
      
      // 将连续的列表项分组
      formatted = formatted.replace(/(<li class="list-item">[\s\S]*?)<\/li>(?=\s*<li class="list-item">)/g, '$1</li>')
      formatted = formatted.replace(/(<li class="list-item ordered">[\s\S]*?)<\/li>(?=\s*<li class="list-item ordered">)/g, '$1</li>')
      
      // 添加列表容器
      formatted = formatted.replace(/(<li class="list-item">[\s\S]*?<\/li>)+/g, '<ul class="custom-list">$&</ul>')
      formatted = formatted.replace(/(<li class="list-item ordered">[\s\S]*?<\/li>)+/g, '<ol class="custom-list ordered">$&</ol>')
      
      return formatted
    },
    
    formatQuotes(text) {
      // 处理引用 > quote text
      return text.replace(/^>\s+(.+)$/gm, '<blockquote class="quote-block">$1</blockquote>')
    },
    
    formatBold(text) {
      // 处理加粗 **bold text**
      return text.replace(/\*\*([^*]+)\*\*/g, '<strong class="bold-text">$1</strong>')
    },
    
    formatParagraphs(text) {
        // 先分割成行
        const lines = text.split('\n')
        const paragraphs = []
        let currentParagraph = []
        let inCodeBlock = false
        
        lines.forEach(line => {
          // 检测代码块开始和结束
          if (line.trim().startsWith('```')) {
            inCodeBlock = !inCodeBlock
            if (currentParagraph.length > 0 && !inCodeBlock) {
              paragraphs.push(currentParagraph.join(''))
              currentParagraph = []
            }
            return
          }
        
        // 如果是已经格式化的HTML元素（代码块、列表、引用等），直接添加
        if (line.startsWith('<') && (line.includes('class="') || line.includes('<pre') || line.includes('<ul') || line.includes('<ol') || line.includes('<blockquote'))) {
          if (currentParagraph.length > 0) {
            paragraphs.push(currentParagraph.join(''))
            currentParagraph = []
          }
          paragraphs.push(line)
          return
        }
        
        // 普通文本行
        currentParagraph.push(line + ' ')
      })
      
      // 添加最后一个段落
      if (currentParagraph.length > 0) {
        paragraphs.push(currentParagraph.join(''))
      }
      
      // 包装段落
      return paragraphs.map(p => {
        if (p.startsWith('<') && (p.includes('class="') || p.includes('<pre') || p.includes('<ul') || p.includes('<ol') || p.includes('<blockquote'))) {
          return p
        }
        return `<p class="text-paragraph">${p.trim()}</p>`
      }).join('')
    },
    
    escapeHtml(text) {
      const div = document.createElement('div')
      div.textContent = text
      return div.innerHTML
    }
  }
}
</script>

<style scoped>
.message {
  display: flex;
  max-width: 70%;
  animation: messageAppear 0.3s ease-out;
}

@keyframes messageAppear {
  from {
    opacity: 0;
    transform: translateY(8px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.user-message {
  align-self: flex-end;
}

.bot-message {
  align-self: flex-start;
}

.message-content {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.user-message .message-content {
  align-items: flex-end;
}

.bot-message .message-content {
  align-items: flex-start;
}

.message-text {
  padding: 12px 16px;
  border-radius: 12px;
  word-wrap: break-word;
  font-size: 14px;
}

.user-message .message-text {
  background: #2c3e50;
  color: white;
}

.bot-message .message-text {
  background: white;
  color: #2c3e50;
  border: 1px solid #f0f0f0;
}

/* 机器人文本的特殊样式 */
.bot-text {
  line-height: 1.6 !important;
}

.message-time {
  font-size: 11px;
  color: #95a5a6;
  padding: 0 4px;
}

/* 深度选择器用于格式化文本的样式 */
:deep(.text-paragraph) {
  margin: 0;
  margin-bottom: 8px;
  line-height: 1.6;
}

:deep(.text-paragraph:last-child) {
  margin-bottom: 0;
}

:deep(.inline-code) {
  background: #f1f3f4;
  padding: 2px 6px;
  border-radius: 4px;
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  font-size: 0.9em;
  color: #e74c3c;
  border: 1px solid #e1e4e8;
}

:deep(.code-block) {
  background: #2c3e50;
  color: #ecf0f1;
  padding: 16px;
  border-radius: 8px;
  margin: 12px 0;
  overflow-x: auto;
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', 'Courier New', monospace;
  font-size: 0.85em;
  line-height: 1.4;
  border: 1px solid #34495e;
  white-space: pre; /* 关键：保留所有空格和换行 */
  tab-size: 2; /* 减小制表符宽度，从4改为2 */
}

:deep(.code-block code) {
  background: transparent;
  color: inherit;
  padding: 0;
  border: none;
  font-family: inherit;
  display: block;
  white-space: pre;
}

:deep(.custom-list) {
  margin: 8px 0;
  padding-left: 20px;
  line-height: 1.6;
}

:deep(.list-item) {
  margin-bottom: 4px;
  position: relative;
}

:deep(.custom-list:not(.ordered) .list-item::before) {
  content: "•";
  color: #3498db;
  font-weight: bold;
  position: absolute;
  left: -15px;
}

:deep(.custom-list.ordered) {
  list-style-type: decimal;
}

:deep(.quote-block) {
  border-left: 4px solid #3498db;
  background: #f8f9fa;
  padding: 8px 12px;
  margin: 8px 0;
  border-radius: 0 8px 8px 0;
  font-style: italic;
  color: #7f8c8d;
}

:deep(.bold-text) {
  font-weight: 600;
  color: #2c3e50;
}

:deep(br) {
  content: '';
  display: block;
  margin-bottom: 4px;
}
</style>