<template>
  <div class="transcript-viewer">
    <h4>💬 Conversation Transcript</h4>
    
    <div class="transcript-stats">
      <span>📊 {{ totalMessages }} messages</span>
      <span>🔤 {{ totalTokens }} tokens</span>
      <span>📤 {{ inputTokens }} in / 📥 {{ outputTokens }} out</span>
    </div>

    <div v-if="transcript.length === 0" class="empty">
      <p>No transcript available</p>
    </div>

    <div v-else class="transcript-list">
      <div v-for="msg in transcript" :key="msg.id" class="transcript-item" :class="msg.role">
        <div class="message-header">
          <span class="role-badge" :class="msg.role">
            {{ msg.role === 'user' ? '👤 User' : msg.role === 'assistant' ? '🤖 Agent' : '⚙️ System' }}
          </span>
          <span class="timestamp">{{ formatTime(msg.timestamp) }}</span>
          <span v-if="msg.tokens > 0" class="tokens">{{ msg.tokens }} tokens</span>
        </div>
        <div class="message-content">{{ msg.text }}</div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'

const props = defineProps({
  sessionKey: String,
  transcript: {
    type: Array,
    default: () => []
  },
  totalMessages: {
    type: Number,
    default: 0
  },
  totalTokens: {
    type: Number,
    default: 0
  },
  inputTokens: {
    type: Number,
    default: 0
  },
  outputTokens: {
    type: Number,
    default: 0
  }
})

const formatTime = (timestamp) => {
  const date = new Date(timestamp)
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
}
</script>

<style scoped>
.transcript-viewer {
  margin-top: 1rem;
  border-top: 1px solid #3b4a6f;
  padding-top: 1rem;
}

h4 {
  margin: 0 0 0.75rem 0;
  color: #e0e7ff;
  font-size: 0.95rem;
}

.transcript-stats {
  display: flex;
  gap: 1rem;
  flex-wrap: wrap;
  margin-bottom: 1rem;
  font-size: 0.8rem;
  color: #94a3b8;
  padding: 0.5rem;
  background: #0f172a;
  border-radius: 4px;
}

.transcript-stats span {
  display: flex;
  align-items: center;
  gap: 0.25rem;
}

.empty {
  text-align: center;
  padding: 1rem;
  color: #64748b;
  font-size: 0.85rem;
}

.transcript-list {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  max-height: 400px;
  overflow-y: auto;
}

.transcript-item {
  background: #0f172a;
  border-left: 3px solid #3b4a6f;
  border-radius: 4px;
  padding: 0.75rem;
  font-size: 0.85rem;
}

.transcript-item.user {
  border-left-color: #06b6d4;
  background: rgba(6, 182, 212, 0.1);
}

.transcript-item.assistant {
  border-left-color: #10b981;
  background: rgba(16, 185, 129, 0.1);
}

.transcript-item.system {
  border-left-color: #64748b;
  color: #94a3b8;
}

.message-header {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.5rem;
  font-size: 0.75rem;
  flex-wrap: wrap;
}

.role-badge {
  padding: 0.2rem 0.4rem;
  border-radius: 3px;
  font-weight: bold;
  background: #1a1f3a;
}

.role-badge.user {
  color: #06b6d4;
}

.role-badge.assistant {
  color: #10b981;
}

.role-badge.system {
  color: #64748b;
}

.timestamp {
  color: #64748b;
  font-family: monospace;
}

.tokens {
  color: #f59e0b;
  font-weight: bold;
  padding: 0.2rem 0.4rem;
  background: rgba(245, 158, 11, 0.2);
  border-radius: 2px;
}

.message-content {
  color: #cbd5e1;
  line-height: 1.4;
  word-wrap: break-word;
}
</style>
