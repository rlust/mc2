<template>
  <div class="agent-hooks-monitor">
    <div v-if="events.length === 0" class="empty-state">
      <div class="empty-icon">🤖</div>
      <div class="empty-text">No agent events yet</div>
      <div class="empty-help">Spawn an agent to see events here</div>
    </div>

    <div v-else class="events-list">
      <div class="events-info">
        {{ events.length }} event{{ events.length !== 1 ? 's' : '' }} in last minute
      </div>
      <div class="events-timeline">
        <div v-for="event in displayEvents" :key="event.id" class="event-item">
          <div class="event-time">
            {{ formatTime(event.timestamp) }}
          </div>
          <div class="event-badge" :class="`event-${event.type}`">
            {{ event.type }}
          </div>
          <div class="event-details">
            <div class="event-agent">
              <span class="label">Agent:</span> {{ event.agentId }}
            </div>
            <div v-if="event.metadata" class="event-metadata">
              <span class="label">Tokens:</span>
              {{ event.metadata.inputTokens }} → {{ event.metadata.outputTokens }}
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

interface AgentEvent {
  id: string
  timestamp: number
  type: string
  agentId: string
  metadata?: Record<string, any>
}

const props = defineProps<{
  events: AgentEvent[]
}>()

const displayEvents = computed(() => {
  return props.events.slice(0, 20)
})

const formatTime = (timestamp: number) => {
  const date = new Date(timestamp)
  const now = new Date()
  const diff = now.getTime() - timestamp

  if (diff < 60000) {
    return 'just now'
  } else if (diff < 3600000) {
    return `${Math.floor(diff / 60000)}m ago`
  } else {
    return date.toLocaleTimeString()
  }
}
</script>

<style scoped>
.agent-hooks-monitor {
  min-height: 200px;
}

.empty-state {
  text-align: center;
  padding: 40px 20px;
  color: #94a3b8;
}

.empty-icon {
  font-size: 32px;
  margin-bottom: 12px;
  opacity: 0.5;
}

.empty-text {
  font-size: 14px;
  font-weight: bold;
  margin-bottom: 6px;
}

.empty-help {
  font-size: 11px;
  color: #64748b;
}

.events-info {
  font-size: 11px;
  color: #94a3b8;
  margin-bottom: 12px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.events-timeline {
  space-y: 8px;
}

.event-item {
  display: grid;
  grid-template-columns: 80px 120px 1fr;
  gap: 12px;
  align-items: start;
  padding: 10px;
  background: #0f172a;
  border-left: 3px solid #3b4a6f;
  border-radius: 4px;
  margin-bottom: 8px;
  font-size: 12px;
}

.event-time {
  color: #64748b;
  font-weight: 600;
}

.event-badge {
  padding: 4px 8px;
  border-radius: 3px;
  font-size: 10px;
  font-weight: bold;
  text-transform: uppercase;
  letter-spacing: 0.3px;
}

.event-agent {
  color: #10b981;
}

.event-spawn {
  background: #164e63;
  color: #06b6d4;
  border-left-color: #06b6d4;
}

.event-turn {
  background: #312e81;
  color: #818cf8;
  border-left-color: #818cf8;
}

.event-transcript {
  background: #5b2c5f;
  color: #d946ef;
  border-left-color: #d946ef;
}

.event-complete {
  background: #064e3b;
  color: #10b981;
  border-left-color: #10b981;
}

.label {
  color: #64748b;
  font-weight: bold;
}

.event-details {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.event-metadata {
  color: #94a3b8;
  font-size: 11px;
}
</style>
