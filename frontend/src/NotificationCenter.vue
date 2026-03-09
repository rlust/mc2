<template>
  <div class="notification-center">
    <h3>🔔 Notification Settings</h3>
    
    <div class="notification-config">
      <div class="config-section">
        <h4>Send Test Notifications</h4>
        <div class="button-group">
          <button @click="sendNotification('telegram', 'info')" class="btn-notify">
            📱 Telegram (Info)
          </button>
          <button @click="sendNotification('telegram', 'warning')" class="btn-notify warning">
            📱 Telegram (Warning)
          </button>
          <button @click="sendNotification('discord', 'info')" class="btn-notify">
            💬 Discord (Info)
          </button>
        </div>
      </div>

      <div class="config-section">
        <h4>Automated Alerts</h4>
        <div class="alert-options">
          <label class="option">
            <input type="checkbox" v-model="alerts.budgetExceeded" />
            <span>Budget Exceeded Alert</span>
          </label>
          <label class="option">
            <input type="checkbox" v-model="alerts.serviceDown" />
            <span>Service Down Alert</span>
          </label>
          <label class="option">
            <input type="checkbox" v-model="alerts.cpuHigh" />
            <span>High CPU Alert (&gt;80%)</span>
          </label>
          <label class="option">
            <input type="checkbox" v-model="alerts.memoryHigh" />
            <span>High Memory Alert (&gt;85%)</span>
          </label>
          <label class="option">
            <input type="checkbox" v-model="alerts.dailySummary" />
            <span>Daily Cost Summary</span>
          </label>
        </div>
      </div>

      <div class="config-section">
        <h4>Preferred Channel</h4>
        <div class="radio-group">
          <label class="radio">
            <input type="radio" v-model="preferredChannel" value="telegram" />
            <span>📱 Telegram</span>
          </label>
          <label class="radio">
            <input type="radio" v-model="preferredChannel" value="discord" />
            <span>💬 Discord</span>
          </label>
          <label class="radio">
            <input type="radio" v-model="preferredChannel" value="both" />
            <span>🔔 Both</span>
          </label>
        </div>
      </div>

      <div class="config-section">
        <h4>Daily Summary Time</h4>
        <input v-model="summaryTime" type="time" class="time-input" />
        <small>Send daily cost summary at this time</small>
      </div>
    </div>

    <!-- Notification History -->
    <div v-if="notificationHistory.length > 0" class="history-section">
      <h4>📋 Recent Notifications</h4>
      <div class="history-list">
        <div v-for="(notif, idx) in notificationHistory.slice(-5)" :key="idx" class="history-item" :class="notif.severity">
          <span class="hist-time">{{ formatTime(notif.time) }}</span>
          <span class="hist-channel">{{ notif.channel }}</span>
          <span class="hist-message">{{ notif.message }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'

const alerts = ref({
  budgetExceeded: true,
  serviceDown: true,
  cpuHigh: true,
  memoryHigh: true,
  dailySummary: true
})

const preferredChannel = ref('telegram')
const summaryTime = ref('08:00')
const notificationHistory = ref([])
const backendUrl = `${location.protocol}//${location.hostname}:3001`

const sendNotification = async (channel, severity) => {
  const messages = {
    info: {
      telegram: '✅ Test notification from Mission Control Dashboard',
      discord: '✅ Test notification from Mission Control Dashboard'
    },
    warning: {
      telegram: '⚠️ Warning: Budget alert! Monthly projection exceeds threshold.',
      discord: '⚠️ Warning: Budget alert! Monthly projection exceeds threshold.'
    }
  }

  const message = messages[severity][channel]

  try {
    const response = await fetch(`${backendUrl}/api/notify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message,
        channel,
        severity
      })
    })

    const data = await response.json()

    if (data.success) {
      notificationHistory.value.push({
        time: new Date(),
        channel,
        severity,
        message
      })

      alert(`✅ Notification sent to ${channel}!`)
    }
  } catch (e) {
    console.error('Failed to send notification:', e)
    alert(`❌ Failed to send notification: ${e.message}`)
  }
}

const formatTime = (time) => {
  const date = new Date(time)
  return date.toLocaleTimeString()
}
</script>

<style scoped>
.notification-center {
  padding: 1rem;
  background: #1a1f3a;
  border: 1px solid #3b4a6f;
  border-radius: 6px;
}

h3 {
  margin: 0 0 1rem 0;
  color: #e0e7ff;
  font-size: 0.95rem;
}

h4 {
  margin: 1rem 0 0.75rem 0;
  color: #94a3b8;
  font-size: 0.9rem;
  font-weight: bold;
}

.notification-config {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.config-section {
  background: #0f172a;
  padding: 0.75rem;
  border-radius: 4px;
  border: 1px solid #3b4a6f;
}

.button-group {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.btn-notify {
  padding: 0.4rem 0.8rem;
  background: #3b4a6f;
  border: 1px solid #4f6095;
  border-radius: 3px;
  color: #e0e7ff;
  cursor: pointer;
  font-size: 0.8rem;
  font-weight: bold;
  transition: all 0.2s;
}

.btn-notify:hover {
  background: #4f6095;
}

.btn-notify.warning {
  background: #f59e0b;
  color: #0f1419;
  border-color: #d97706;
}

.btn-notify.warning:hover {
  background: #d97706;
}

.alert-options {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.option {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  cursor: pointer;
  font-size: 0.85rem;
  color: #cbd5e1;
}

.option input {
  cursor: pointer;
}

.radio-group {
  display: flex;
  gap: 1rem;
}

.radio {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  cursor: pointer;
  font-size: 0.85rem;
  color: #cbd5e1;
}

.radio input {
  cursor: pointer;
}

.time-input {
  padding: 0.4rem;
  background: #0f172a;
  border: 1px solid #3b4a6f;
  border-radius: 3px;
  color: #e0e7ff;
  font-size: 0.85rem;
}

.time-input:focus {
  outline: none;
  border-color: #10b981;
}

small {
  display: block;
  margin-top: 0.25rem;
  color: #64748b;
  font-size: 0.75rem;
}

.history-section {
  margin-top: 1rem;
  padding-top: 1rem;
  border-top: 1px solid #3b4a6f;
}

.history-list {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.history-item {
  padding: 0.5rem;
  background: #0f172a;
  border-radius: 3px;
  font-size: 0.8rem;
  display: grid;
  grid-template-columns: 70px 70px 1fr;
  gap: 0.5rem;
  border-left: 3px solid #3b4a6f;
}

.history-item.info {
  border-left-color: #10b981;
}

.history-item.warning {
  border-left-color: #f59e0b;
}

.hist-time {
  color: #64748b;
  font-family: monospace;
}

.hist-channel {
  color: #94a3b8;
  font-weight: bold;
}

.hist-message {
  color: #cbd5e1;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
</style>
