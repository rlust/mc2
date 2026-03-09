<template>
  <div class="session-logs">
    <h3>📋 Session Logs</h3>
    
    <div class="logs-container">
      <div v-if="logs.length === 0" class="empty-logs">
        <p>No logs available</p>
      </div>
      
      <div v-else class="logs-list">
        <div v-for="(log, idx) in logs" :key="idx" class="log-entry" :class="log.type">
          <span class="log-time">{{ formatTime(log.time) }}</span>
          <span class="log-type-badge">{{ log.type }}</span>
          <span class="log-text">{{ log.text }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'

const props = defineProps({
  sessionKey: String
})

const logs = ref([])

const fetchLogs = async () => {
  if (!props.sessionKey) return
  
  try {
    const response = await fetch(`/api/session/${props.sessionKey}/logs?limit=50`)
    const data = await response.json()
    logs.value = data.logs || []
  } catch (e) {
    console.error('Failed to fetch logs:', e)
  }
}

const formatTime = (time) => {
  const date = new Date(time)
  return date.toLocaleTimeString()
}

watch(() => props.sessionKey, fetchLogs, { immediate: true })
</script>

<style scoped>
.session-logs {
  padding: 1rem 0;
}

h3 {
  margin-bottom: 0.75rem;
  color: #e0e7ff;
  font-size: 0.95rem;
}

.logs-container {
  background: #0f172a;
  border: 1px solid #3b4a6f;
  border-radius: 6px;
  max-height: 300px;
  overflow-y: auto;
}

.empty-logs {
  padding: 1rem;
  text-align: center;
  color: #64748b;
  font-size: 0.85rem;
}

.logs-list {
  display: flex;
  flex-direction: column;
  gap: 0;
}

.log-entry {
  padding: 0.5rem;
  border-bottom: 1px solid #1a1f3a;
  font-size: 0.8rem;
  display: grid;
  grid-template-columns: 70px 70px 1fr;
  gap: 0.5rem;
  align-items: center;
}

.log-entry:last-child {
  border-bottom: none;
}

.log-entry.spawn {
  background: rgba(16, 185, 129, 0.1);
  color: #10b981;
}

.log-entry.message {
  color: #cbd5e1;
}

.log-entry.turn {
  background: rgba(6, 182, 212, 0.1);
  color: #06b6d4;
}

.log-entry.error {
  background: rgba(239, 68, 68, 0.1);
  color: #fca5a5;
}

.log-time {
  color: #64748b;
  font-weight: bold;
  font-family: monospace;
}

.log-type-badge {
  background: #1a1f3a;
  padding: 0.25rem 0.5rem;
  border-radius: 3px;
  font-weight: bold;
  text-transform: uppercase;
  font-size: 0.7rem;
}

.log-text {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
</style>
