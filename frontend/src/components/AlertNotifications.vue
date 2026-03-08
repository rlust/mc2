<template>
  <div class="alert-notifications">
    <div class="alerts-header">
      <div class="alerts-count">
        {{ alerts.length }} {{ alerts.length === 1 ? 'Alert' : 'Alerts' }}
      </div>
      <button
        v-if="alerts.length > 0"
        @click="$emit('clearAll')"
        class="btn-clear"
      >
        Clear All
      </button>
    </div>

    <div v-if="alerts.length === 0" class="empty-state">
      <div class="empty-icon">✨</div>
      <div class="empty-text">All clear!</div>
      <div class="empty-help">No active alerts</div>
    </div>

    <div v-else class="alerts-list">
      <div
        v-for="alert in alerts"
        :key="alert.id"
        class="alert-item"
        :class="`alert-${alert.severity}`"
      >
        <div class="alert-icon">{{ getSeverityIcon(alert.severity) }}</div>
        <div class="alert-content">
          <div class="alert-title">{{ alert.type }}</div>
          <div class="alert-message">{{ alert.message }}</div>
          <div class="alert-time">
            {{ formatTime(alert.timestamp) }}
          </div>
        </div>
        <button
          @click="removeAlert(alert.id)"
          class="btn-close"
          title="Dismiss alert"
        >
          ✕
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'

interface Alert {
  id: string
  type: string
  message: string
  timestamp: number
  severity: 'info' | 'warning' | 'error'
}

const props = defineProps<{
  alerts: Alert[]
}>()

const emit = defineEmits<{
  clearAll: []
}>()

const localAlerts = ref(props.alerts)

const getSeverityIcon = (severity: string) => {
  const icons: Record<string, string> = {
    info: 'ℹ️',
    warning: '⚠️',
    error: '❌',
  }
  return icons[severity] || '📌'
}

const formatTime = (timestamp: number) => {
  const date = new Date(timestamp)
  const now = new Date()
  const diff = now.getTime() - timestamp

  if (diff < 5000) {
    return 'just now'
  } else if (diff < 60000) {
    return `${Math.floor(diff / 1000)}s ago`
  } else if (diff < 3600000) {
    return `${Math.floor(diff / 60000)}m ago`
  } else {
    return date.toLocaleTimeString()
  }
}

const removeAlert = (id: string) => {
  // In a real app, this would call the store to remove the alert
  console.log('Removing alert:', id)
}
</script>

<style scoped>
.alert-notifications {
  min-height: 200px;
}

.alerts-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
  padding-bottom: 8px;
  border-bottom: 1px solid #3b4a6f;
}

.alerts-count {
  font-size: 11px;
  color: #94a3b8;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  font-weight: bold;
}

.btn-clear {
  padding: 4px 8px;
  background: #3b4a6f;
  border: 1px solid #4f6095;
  border-radius: 3px;
  color: #e0e7ff;
  font-size: 10px;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-clear:hover {
  background: #4f6095;
}

.empty-state {
  text-align: center;
  padding: 40px 20px;
  color: #94a3b8;
}

.empty-icon {
  font-size: 32px;
  margin-bottom: 12px;
  opacity: 0.6;
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

.alerts-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
  max-height: 400px;
  overflow-y: auto;
}

.alert-item {
  display: grid;
  grid-template-columns: 32px 1fr 32px;
  gap: 12px;
  align-items: start;
  padding: 12px;
  border-left: 4px solid #3b4a6f;
  border-radius: 4px;
  background: #0f172a;
  transition: all 0.2s;
}

.alert-item:hover {
  background: #1e293b;
}

.alert-icon {
  font-size: 18px;
  display: flex;
  align-items: center;
  justify-content: center;
  height: 32px;
}

.alert-info {
  border-left-color: #06b6d4;
  background: linear-gradient(135deg, #0f172a 0%, rgba(6, 182, 212, 0.05) 100%);
}

.alert-warning {
  border-left-color: #f59e0b;
  background: linear-gradient(135deg, #0f172a 0%, rgba(245, 158, 11, 0.05) 100%);
}

.alert-error {
  border-left-color: #ef4444;
  background: linear-gradient(135deg, #0f172a 0%, rgba(239, 68, 68, 0.05) 100%);
}

.alert-content {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.alert-title {
  font-size: 12px;
  font-weight: bold;
  color: #e0e7ff;
  text-transform: uppercase;
  letter-spacing: 0.3px;
}

.alert-message {
  font-size: 12px;
  color: #cbd5e1;
  line-height: 1.4;
}

.alert-time {
  font-size: 10px;
  color: #64748b;
}

.btn-close {
  background: none;
  border: none;
  color: #64748b;
  cursor: pointer;
  font-size: 16px;
  padding: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  height: 32px;
  width: 32px;
  transition: all 0.2s;
}

.btn-close:hover {
  color: #e0e7ff;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 3px;
}
</style>
