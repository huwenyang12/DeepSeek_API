<template>
  <div :class="['message', messageClass]">
    <div class="message-content">
      <div class="message-text">{{ message.content }}</div>
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
  line-height: 1.4;
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

.message-time {
  font-size: 11px;
  color: #95a5a6;
  padding: 0 4px;
}
</style>