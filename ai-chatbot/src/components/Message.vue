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
      
      // 0. 特殊处理极限表达式
      formatted = this.formatLimits(formatted)
      
      // 1. 清理 LaTeX 命令
      formatted = this.cleanLatex(formatted)
      
      // 2. 处理数学表达式
      formatted = this.formatMathExpressions(formatted)
      
      // 3. 处理数学符号
      formatted = this.formatMathSymbols(formatted)
      
      // 4. 处理数学符号（新增）
      formatted = this.formatMathNotation(formatted)
      
      // 3. 先处理代码块 ```code``` - 修复版本
      formatted = this.formatCodeBlocks(formatted)
      
      // 4. 处理列表
      formatted = this.formatLists(formatted)
      
      // 5. 处理引用 >
      formatted = this.formatQuotes(formatted)
      
      // 6. 处理内联代码 `code`
      formatted = this.formatInlineCode(formatted)
      
      // 7. 处理加粗 **bold**
      formatted = this.formatBold(formatted)
      
      // 8. 处理换行和段落
      formatted = this.formatParagraphs(formatted)
      
      return formatted
    },

    // 专门处理极限表达式
    formatLimits(text) {
      return text
        .replace(/limx → 0/g, 'lim<sub>x→0</sub>')
        .replace(/(\w+)x → 0/g, '$1<sub>x→0</sub>')
        .replace(/(\d)(\w)/g, '$1 $2') // 在数字和字母间加空格
    },

    formatMathSymbols(text) {
      // 处理 LaTeX 公式和数学符号
      return text
        // 1. 先处理简单的数学符号
        .replace(/\\lim/g, 'lim')
        .replace(/\\to/g, '→')
        .replace(/\\boxed\{([^}]+)\}/g, '答案: $1') // 处理 \boxed{}
        
        // 2. 处理分式 \frac{}{}
        .replace(/\\frac\{([^}]+)\}\{([^}]+)\}/g, '$1/$2')
        
        // 3. 处理上标 ^{}
        .replace(/\^\{([^}]+)\}/g, '<sup>$1</sup>')
        .replace(/\^(\w)/g, '<sup>$1</sup>') // 单个字符上标
        
        // 4. 处理下标 _{}
        .replace(/_\{([^}]+)\}/g, '<sub>$1</sub>')
        .replace(/_(\w)/g, '<sub>$1</sub>') // 单个字符下标
        
        // 5. 处理其他常见的 LaTeX 命令
        .replace(/\\left\(/g, '(')
        .replace(/\\right\)/g, ')')
        .replace(/\\cdots/g, '⋯')
        .replace(/\\vdots/g, '⋮')
        .replace(/\\ddots/g, '⋱')
        
        // 6. 处理简单的括号环境
        .replace(/\\\(/g, '(')
        .replace(/\\\)/g, ')')
        .replace(/\\\[/g, '[')
        .replace(/\\\]/g, ']')
        
        // 7. 处理文本模式（简化）
        .replace(/\\text\{([^}]+)\}/g, '$1')
        
        // 8. 清理多余的斜杠（针对你例子中的情况）
        .replace(/([^\\])\\([a-zA-Z])/g, '$1$2') // 处理单个字母前的斜杠
        .replace(/\\\\/g, '<br>') // 处理换行
    },

    formatMathExpressions(text) {
      return text
        // 处理你例子中的特定数学表达式
        .replace(/Lleft\(([^)]+)\)/g, 'L($1)')
        .replace(/left\(([^)]+)\)/g, '($1)')
        .replace(/right\)/g, ')')
        
        // 处理积分表达式
        .replace(/int(\d+)(\d+)/g, '∫<sub>$1</sub><sup>$2</sup>') // 处理 int06 → ∫₀⁶
        .replace(/int(\d+)/g, '∫<sub>$1</sub>') // 处理单个数字的积分限
        
        // 处理分数表达式（没有花括号的frac）
        .replace(/frac(\d+)(\d+)/g, '$1/$2') // 处理 frac13 → 1/3, frac23 → 2/3
        
        // 处理文本命令
        .replace(/textN/g, 'N')
        .replace(/text\{([^}]*)\}/g, '$1')
        
        // 处理数字格式
        .replace(/(\d)\s+(\d)/g, '$1$2')
        .replace(/(\d),(\d)/g, '$1$2')
        
        // 处理特定的数学函数
        .replace(/frac\{([^}]+)\}\{([^}]+)\}/g, '$1/$2')
        
        // 处理上标（没有花括号的）
        .replace(/(\w)\^(\d)/g, '$1<sup>$2</sup>') // 处理 x2 → x²
        .replace(/(\w)\^\{(\d+)\}/g, '$1<sup>$2</sup>')
    },

    // 在 methods 中添加这个函数
    formatMathNotation(text) {
      return text
        // 处理积分限
        .replace(/int_0\^6/g, '∫<sub>0</sub><sup>6</sup>')
        .replace(/int_(\d+)\^(\d+)/g, '∫<sub>$1</sub><sup>$2</sup>')
        
        // 处理希腊字母和其他符号
        .replace(/ρ/g, 'ρ')
        .replace(/∈/g, '∈')
        
        // 处理乘法符号
        .replace(/(\d)\s*×\s*(\d)/g, '$1×$2')
        
        // 处理分数显示
        .replace(/(\d)\/(\d)/g, '<span class="math-fraction">$1/$2</span>')
    },

    cleanLatex(text) {
      // 先处理所有已知的 LaTeX 命令
      let cleaned = text
        .replace(/\\[a-zA-Z]+/g, (match) => {
          // 定义已知的 LaTeX 命令映射
          const commandMap = {
            '\\cdot': '·', '\\times': '×', '\\div': '÷',
            '\\Rightarrow': '⇒', '\\rightarrow': '→', 
            '\\leftarrow': '←', '\\Leftrightarrow': '⇔',
            '\\infty': '∞', '\\partial': '∂', '\\nabla': '∇',
            '\\alpha': 'α', '\\beta': 'β', '\\gamma': 'γ',
            '\\delta': 'δ', '\\theta': 'θ', '\\pi': 'π',
            '\\sigma': 'σ', '\\omega': 'ω',
            '\\leq': '≤', '\\geq': '≥', '\\neq': '≠',
            '\\approx': '≈', '\\equiv': '≡', '\\propto': '∝',
            '\\in': '∈', '\\notin': '∉', '\\subset': '⊂',
            '\\subseteq': '⊆', '\\cup': '∪', '\\cap': '∩',
            '\\emptyset': '∅', '\\forall': '∀', '\\exists': '∃',
            // 添加你例子中的新命令
            '\\implies': '⇒',
            '\\text': '',
            '\\left': '',
            '\\right': '',
            '\\mathrm': '',
            '\\approx': '≈',
            '\\int': '∫',
            '\\rho': 'ρ'
          }
          return commandMap[match] || match.replace(/\\/, '')
        })
        
      // 然后清理其他格式
      cleaned = cleaned
        .replace(/\\[\(\)\[\]]/g, '') // 清理括号命令，但保留 {}
        .replace(/\\begin\{[^}]+\}/g, '')
        .replace(/\\end\{[^}]+\}/g, '')
        .replace(/\\frac\{([^}]+)\}\{([^}]+)\}/g, '$1/$2')
        .replace(/\^\{([^}]+)\}/g, '<sup>$1</sup>')
        .replace(/_\{([^}]+)\}/g, '<sub>$1</sub>')
        .replace(/\\sqrt\{([^}]+)\}/g, '√$1')
        
      // 专门处理花括号：提取花括号中的内容
      cleaned = cleaned
        .replace(/\{([^}]+)\}/g, '$1') // 提取花括号中的内容
        
      // 清理数字中间的空格
      cleaned = cleaned
        .replace(/(\d)\s+(\d)/g, '$1$2') // 删除数字间的空格
        
      // 清理所有剩余的单个反斜杠
      cleaned = cleaned
        .replace(/([^\\])\\([^\\])/g, '$1$2')
        .replace(/^\\/, '')
        .replace(/\\$/, '')
        // 清理 left 和 right 命令
        .replace(/left\[/g, '[')
        .replace(/right\]/g, ']')
        .replace(/left\(/g, '(')
        .replace(/right\)/g, ')')
        .replace(/--&gt;/g, '→')
        .replace(/&gt;/g, '>')
        // 美化递归过程的显示
        .replace(/(→)+/g, (match) => {
          const depth = match.length
          return '  '.repeat(depth - 1) + '→'})
        
      return cleaned
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