<template>
  <div class="simple-dashboard">
    <!-- Header -->
    <div class="header">
      <h1>🔴 OpenClaw Control-UI</h1>
      <div class="header-actions">
        <button @click="refreshData" class="btn-header">🔄 Refresh</button>
        <button @click="openDiagnostics" class="btn-header btn-diagnostics">🔧 Diagnostics</button>
        <div class="status-badge" :class="isConnected ? 'connected' : 'disconnected'">
          {{ isConnected ? '● Connected' : '○ Disconnected' }}
        </div>
      </div>
    </div>

    <!-- Stats Grid -->
    <div class="stats-grid">
      <div class="stat-card">
        <div class="stat-icon">📊</div>
        <div class="stat-label">Context Usage</div>
        <div class="stat-value">{{ contextUsage }}%</div>
        <div class="stat-bar">
          <div class="stat-fill" :style="{ width: contextUsage + '%' }"></div>
        </div>
      </div>

      <div class="stat-card">
        <div class="stat-icon">🤖</div>
        <div class="stat-label">Agent Events</div>
        <div class="stat-value">{{ agentEvents }}</div>
        <div class="stat-detail">last minute</div>
      </div>

      <div class="stat-card">
        <div class="stat-icon">🚨</div>
        <div class="stat-label">Alerts</div>
        <div class="stat-value" :class="alertClass">{{ alerts }}</div>
        <div class="stat-detail">{{ alertStatus }}</div>
      </div>

      <div class="stat-card">
        <div class="stat-icon">📦</div>
        <div class="stat-label">Compaction</div>
        <div class="stat-value">{{ compactionState }}</div>
        <div class="stat-detail">state</div>
      </div>
    </div>

    <!-- Tabs -->
    <div class="tabs">
      <button
        v-for="tab in tabs"
        :key="tab"
        @click="activeTab = tab"
        class="tab-button"
        :class="{ active: activeTab === tab }"
      >
        {{ tab }}
      </button>
    </div>

    <!-- Tab Content -->
    <div class="tab-content">
      <!-- Real-Time Events Tab -->
      <div v-if="activeTab === 'Events'" class="events-panel">
        <h2>🤖 Agent Events</h2>
        <div v-if="eventsList.length === 0" class="empty">
          <p>No events yet. Spawn an agent to see activity here.</p>
        </div>
        <div v-else class="events-list">
          <div v-for="(event, idx) in eventsList" :key="idx" class="event-item">
            <span class="event-time">{{ event.time }}</span>
            <span class="event-badge" :class="event.type">{{ event.type }}</span>
            <span class="event-text">{{ event.text }}</span>
          </div>
        </div>
      </div>

      <!-- Context Metrics Tab -->
      <div v-if="activeTab === 'Context'" class="context-panel">
        <h2>📊 Context Metrics</h2>
        <div class="metric-grid">
          <div class="metric">
            <div class="metric-label">Budget</div>
            <div class="metric-value">200,000 tokens</div>
          </div>
          <div class="metric">
            <div class="metric-label">Usage</div>
            <div class="metric-value">{{ contextUsage }}%</div>
          </div>
          <div class="metric">
            <div class="metric-label">Last Compaction</div>
            <div class="metric-value">5 min ago</div>
          </div>
          <div class="metric">
            <div class="metric-label">Tokens Recovered</div>
            <div class="metric-value">45,000</div>
          </div>
        </div>
        <div class="timeline">
          <h3>Compaction Timeline</h3>
          <div class="timeline-stages">
            <div class="stage" v-for="stage in ['Bootstrap', 'Ingest', 'Assemble', 'Compact', 'Complete']" :key="stage">
              <div class="stage-dot"></div>
              <div class="stage-label">{{ stage }}</div>
            </div>
          </div>
        </div>
      </div>

      <!-- Alerts Tab -->
      <div v-if="activeTab === 'Alerts'" class="alerts-panel">
        <h2>🚨 Alerts</h2>
        <div v-if="alertsList.length === 0" class="empty">
          <p>✨ All clear! No active alerts.</p>
        </div>
        <div v-else class="alerts-list">
          <div v-for="(alert, idx) in alertsList" :key="idx" class="alert-item" :class="alert.severity">
            <span class="alert-icon">{{ alert.icon }}</span>
            <div class="alert-content">
              <div class="alert-title">{{ alert.type }}</div>
              <div class="alert-message">{{ alert.message }}</div>
            </div>
            <span class="alert-time">{{ alert.time }}</span>
          </div>
        </div>
      </div>

      <!-- HVAC Tab -->
      <div v-if="activeTab === 'HVAC'" class="hvac-panel">
        <h2>🌡️ HVAC Control</h2>
        <div class="hvac-status">
          <div class="temp-display">
            <div class="temp-label">Current</div>
            <div class="temp-value">{{ currentTemp }}°F</div>
          </div>
          <div class="temp-display">
            <div class="temp-label">Target</div>
            <div class="temp-value">{{ targetTemp }}°F</div>
          </div>
        </div>

        <div class="hvac-controls">
          <div class="control-group">
            <label>Set Temperature (50-90°F)</label>
            <div class="temp-input-group">
              <button @click="targetTemp = Math.max(50, targetTemp - 1)" class="btn-small">−</button>
              <input v-model.number="targetTemp" type="number" min="50" max="90" class="temp-input">
              <button @click="targetTemp = Math.min(90, targetTemp + 1)" class="btn-small">+</button>
            </div>
          </div>

          <div class="control-group">
            <label>Mode</label>
            <div class="mode-buttons">
              <button
                v-for="mode in ['Off', 'Heat', 'Cool', 'Auto']"
                :key="mode"
                @click="hvacMode = mode"
                class="mode-btn"
                :class="{ active: hvacMode === mode }"
              >
                {{ mode }}
              </button>
            </div>
          </div>

          <button @click="sendCommand" class="btn-primary">📤 Send Command</button>

          <div v-if="lastCommand" class="last-command">
            <strong>Last Command:</strong> {{ lastCommand }}
          </div>
        </div>
      </div>
    </div>

    <!-- Footer -->
    <div class="footer">
      <small>Real-time OpenClaw monitoring • Last update: {{ lastUpdate }}</small>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'

// State
const isConnected = ref(true)
const activeTab = ref('Events')
const contextUsage = ref(45)
const agentEvents = ref(12)
const alerts = ref(0)
const compactionState = ref('idle')
const currentTemp = ref(68)
const targetTemp = ref(72)
const hvacMode = ref('Heat')
const lastCommand = ref('')
const lastUpdate = ref(new Date().toLocaleTimeString())
const showDiagnostics = ref(false)

const tabs = ['Events', 'Context', 'Alerts', 'HVAC']

// Sample data
const eventsList = ref([
  { time: '12:10', type: 'spawn', text: 'Agent session started' },
  { time: '12:09', type: 'turn', text: 'Agent completed turn 3' },
  { time: '12:08', type: 'transcript', text: 'Transcript updated' },
  { time: '12:07', type: 'complete', text: 'Session completed' },
])

const alertsList = ref([])

// Computed
const alertClass = ref(alerts.value > 0 ? 'warning' : 'ok')
const alertStatus = ref(alerts.value > 0 ? 'active' : 'no alerts')

// Emit events
const emit = defineEmits(['show-diagnostics'])

// Methods
const refreshData = () => {
  console.log('Refreshing data...')
  lastUpdate.value = new Date().toLocaleTimeString()
}

const openDiagnostics = () => {
  emit('show-diagnostics')
}

const sendCommand = () => {
  lastCommand.value = `Set to ${targetTemp.value}°F (${hvacMode.value})`
  alert(`Command sent: ${lastCommand.value}`)
}

// Simulate real-time updates
onMounted(() => {
  setInterval(() => {
    contextUsage.value = Math.min(95, contextUsage.value + Math.random() * 5)
    lastUpdate.value = new Date().toLocaleTimeString()
    
    // Random events
    if (Math.random() > 0.7) {
      agentEvents.value++
    }
  }, 2000)
})
</script>

<style scoped>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

.simple-dashboard {
  background: #0f1419;
  color: #e0e7ff;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Monaco, sans-serif;
  display: flex;
  flex-direction: column;
  height: 100vh;
  overflow: hidden;
}

.header {
  background: linear-gradient(135deg, #1a1f3a 0%, #2a2f4a 100%);
  padding: 1rem;
  border-bottom: 2px solid #10b981;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.header h1 {
  font-size: 1.5rem;
  color: #10b981;
  margin: 0;
}

.header-actions {
  display: flex;
  gap: 0.75rem;
  align-items: center;
}

.btn-header {
  padding: 0.5rem 1rem;
  background: #3b4a6f;
  border: 1px solid #4f6095;
  border-radius: 4px;
  color: #e0e7ff;
  cursor: pointer;
  font-weight: bold;
  font-size: 0.9rem;
  transition: all 0.2s;
}

.btn-header:hover {
  background: #4f6095;
  transform: scale(1.05);
}

.btn-diagnostics {
  background: #f59e0b;
  border-color: #d97706;
  color: #0f1419;
}

.btn-diagnostics:hover {
  background: #d97706;
  color: #fff;
}

.status-badge {
  padding: 0.5rem 1rem;
  border-radius: 20px;
  font-size: 0.9rem;
  font-weight: bold;
}

.status-badge.connected {
  background: #064e3b;
  color: #10b981;
}

.status-badge.disconnected {
  background: #7f1d1d;
  color: #fca5a5;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
  padding: 1rem;
  background: #0a0e27;
  border-bottom: 1px solid #3b4a6f;
}

.stat-card {
  background: #1a1f3a;
  border: 1px solid #3b4a6f;
  border-radius: 8px;
  padding: 1rem;
  text-align: center;
}

.stat-icon {
  font-size: 2rem;
  margin-bottom: 0.5rem;
}

.stat-label {
  font-size: 0.8rem;
  color: #94a3b8;
  text-transform: uppercase;
  margin-bottom: 0.5rem;
}

.stat-value {
  font-size: 1.8rem;
  font-weight: bold;
  color: #10b981;
  margin-bottom: 0.5rem;
}

.stat-value.warning {
  color: #f59e0b;
}

.stat-detail {
  font-size: 0.75rem;
  color: #64748b;
}

.stat-bar {
  height: 4px;
  background: #0f172a;
  border-radius: 2px;
  overflow: hidden;
  margin-top: 0.5rem;
}

.stat-fill {
  height: 100%;
  background: linear-gradient(90deg, #10b981, #06b6d4);
  transition: width 0.3s;
}

.tabs {
  display: flex;
  background: #1a1f3a;
  border-bottom: 1px solid #3b4a6f;
  padding: 0;
}

.tab-button {
  flex: 1;
  padding: 1rem;
  background: none;
  border: none;
  color: #94a3b8;
  cursor: pointer;
  font-weight: bold;
  text-transform: uppercase;
  font-size: 0.9rem;
  border-bottom: 3px solid transparent;
  transition: all 0.2s;
}

.tab-button:hover {
  color: #e0e7ff;
  background: rgba(255, 255, 255, 0.05);
}

.tab-button.active {
  color: #10b981;
  border-bottom-color: #10b981;
  background: rgba(16, 185, 129, 0.05);
}

.tab-content {
  flex: 1;
  overflow-y: auto;
  padding: 1.5rem;
}

.events-panel h2,
.context-panel h2,
.alerts-panel h2,
.hvac-panel h2 {
  margin-bottom: 1rem;
  color: #10b981;
  font-size: 1.2rem;
}

.empty {
  text-align: center;
  padding: 2rem;
  color: #94a3b8;
  font-size: 0.9rem;
}

.events-list {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.event-item {
  display: grid;
  grid-template-columns: 60px 100px 1fr;
  gap: 1rem;
  align-items: center;
  padding: 0.75rem;
  background: #1a1f3a;
  border-left: 3px solid #3b4a6f;
  border-radius: 4px;
  font-size: 0.9rem;
}

.event-time {
  color: #64748b;
  font-weight: bold;
}

.event-badge {
  padding: 0.25rem 0.5rem;
  border-radius: 3px;
  font-size: 0.75rem;
  text-transform: uppercase;
  font-weight: bold;
}

.event-badge.spawn {
  background: #1e3a8a;
  color: #93c5fd;
}

.event-badge.turn {
  background: #4c1d95;
  color: #d8b4fe;
}

.transcript {
  background: #5b21b6;
  color: #e9d5ff;
}

.complete {
  background: #064e3b;
  color: #6ee7b7;
}

.event-text {
  color: #cbd5e1;
}

.metric-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 1rem;
  margin-bottom: 2rem;
}

.metric {
  background: #1a1f3a;
  border: 1px solid #3b4a6f;
  border-radius: 8px;
  padding: 1rem;
  text-align: center;
}

.metric-label {
  font-size: 0.75rem;
  color: #94a3b8;
  text-transform: uppercase;
  margin-bottom: 0.5rem;
}

.metric-value {
  font-size: 1.5rem;
  font-weight: bold;
  color: #10b981;
}

.timeline {
  background: #1a1f3a;
  border: 1px solid #3b4a6f;
  border-radius: 8px;
  padding: 1rem;
}

.timeline h3 {
  font-size: 0.9rem;
  margin-bottom: 1rem;
  color: #94a3b8;
}

.timeline-stages {
  display: flex;
  justify-content: space-around;
  align-items: center;
}

.stage {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
}

.stage-dot {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background: #3b4a6f;
  transition: all 0.2s;
}

.stage-label {
  font-size: 0.75rem;
  color: #64748b;
  text-align: center;
}

.alerts-list {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.alert-item {
  display: grid;
  grid-template-columns: 32px 1fr 80px;
  gap: 1rem;
  align-items: center;
  padding: 0.75rem;
  background: #1a1f3a;
  border-left: 4px solid #3b4a6f;
  border-radius: 4px;
}

.alert-item.warning {
  border-left-color: #f59e0b;
}

.alert-item.error {
  border-left-color: #ef4444;
}

.alert-icon {
  font-size: 1.5rem;
}

.alert-content {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.alert-title {
  font-weight: bold;
  color: #e0e7ff;
  font-size: 0.9rem;
}

.alert-message {
  font-size: 0.8rem;
  color: #94a3b8;
}

.alert-time {
  font-size: 0.75rem;
  color: #64748b;
}

.hvac-status {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
  margin-bottom: 2rem;
  background: #1a1f3a;
  border: 1px solid #3b4a6f;
  border-radius: 8px;
  padding: 1.5rem;
}

.temp-display {
  text-align: center;
}

.temp-label {
  font-size: 0.8rem;
  color: #94a3b8;
  text-transform: uppercase;
  margin-bottom: 0.5rem;
}

.temp-value {
  font-size: 2.5rem;
  font-weight: bold;
  color: #10b981;
}

.hvac-controls {
  background: #1a1f3a;
  border: 1px solid #3b4a6f;
  border-radius: 8px;
  padding: 1.5rem;
}

.control-group {
  margin-bottom: 1.5rem;
}

.control-group label {
  display: block;
  font-size: 0.8rem;
  color: #94a3b8;
  text-transform: uppercase;
  margin-bottom: 0.75rem;
  font-weight: bold;
}

.temp-input-group {
  display: grid;
  grid-template-columns: 40px 1fr 40px;
  gap: 0.5rem;
}

.btn-small {
  padding: 0.5rem;
  background: #3b4a6f;
  border: 1px solid #4f6095;
  border-radius: 4px;
  color: #e0e7ff;
  font-size: 1.2rem;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-small:hover {
  background: #4f6095;
}

.temp-input {
  padding: 0.5rem;
  background: #0f172a;
  border: 1px solid #3b4a6f;
  border-radius: 4px;
  color: #10b981;
  font-size: 1.2rem;
  font-weight: bold;
  text-align: center;
}

.temp-input:focus {
  outline: none;
  border-color: #10b981;
  box-shadow: 0 0 8px rgba(16, 185, 129, 0.2);
}

.mode-buttons {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 0.5rem;
}

.mode-btn {
  padding: 0.75rem;
  background: #0f172a;
  border: 1px solid #3b4a6f;
  border-radius: 4px;
  color: #94a3b8;
  cursor: pointer;
  font-weight: bold;
  transition: all 0.2s;
}

.mode-btn:hover {
  border-color: #10b981;
  color: #10b981;
}

.mode-btn.active {
  background: #10b981;
  color: #0f172a;
  border-color: #10b981;
}

.btn-primary {
  width: 100%;
  padding: 0.75rem;
  background: #10b981;
  border: none;
  border-radius: 4px;
  color: #0f172a;
  font-weight: bold;
  font-size: 0.9rem;
  cursor: pointer;
  transition: all 0.2s;
  margin-bottom: 1rem;
}

.btn-primary:hover {
  background: #059669;
  transform: scale(1.02);
}

.last-command {
  padding: 0.75rem;
  background: #0f172a;
  border-left: 3px solid #10b981;
  border-radius: 3px;
  font-size: 0.9rem;
  color: #cbd5e1;
}

.last-command strong {
  color: #10b981;
}

.footer {
  padding: 0.75rem 1rem;
  background: #0a0e27;
  border-top: 1px solid #3b4a6f;
  color: #64748b;
  text-align: center;
}
</style>
