<template>
  <div class="control-ui-panel">
    <!-- Header with connection status -->
    <div class="control-ui-header">
      <div class="header-title">
        <span class="title-text">🔴 Control-UI</span>
        <span
          class="connection-indicator"
          :class="{ 'is-connected': controlUi.isReady }"
        >
          {{ controlUi.isReady ? '● Connected' : '○ Disconnected' }}
        </span>
      </div>
      <div class="header-actions">
        <button @click="refreshData" class="btn-refresh">🔄 Refresh</button>
      </div>
    </div>

    <!-- Main content area -->
    <div v-if="controlUi.isReady" class="control-ui-content">
      <!-- Quick stats row -->
      <div class="stats-grid">
        <div class="stat-card">
          <div class="stat-label">Context Usage</div>
          <div class="stat-value">
            {{ (controlUi.contextUsage * 100).toFixed(0) }}%
          </div>
          <div class="stat-meter">
            <div
              class="meter-fill"
              :style="{ width: (controlUi.contextUsage * 100) + '%' }"
              :class="{
                'meter-warning': controlUi.contextUsage > 0.75,
                'meter-critical': controlUi.contextUsage > 0.9,
              }"
            ></div>
          </div>
        </div>

        <div class="stat-card">
          <div class="stat-label">Agent Events</div>
          <div class="stat-value">{{ controlUi.agentEvents.length }}</div>
          <div class="stat-detail">Last 1 minute</div>
        </div>

        <div class="stat-card">
          <div class="stat-label">Alerts</div>
          <div class="stat-value" :class="alertSeverityClass">
            {{ controlUi.alerts.length }}
          </div>
          <div class="stat-detail">{{ alertStatusText }}</div>
        </div>

        <div class="stat-card">
          <div class="stat-label">Compaction State</div>
          <div class="stat-value" v-if="controlUi.compactionState">
            {{ compactionStatusText }}
          </div>
          <div class="stat-value" v-else>Idle</div>
        </div>
      </div>

      <!-- Tabs -->
      <div class="control-ui-tabs">
        <div class="tabs-header">
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

        <div class="tabs-content">
          <!-- Agent Events Tab -->
          <div v-show="activeTab === 'Events'" class="tab-pane">
            <AgentHooksMonitor :events="controlUi.agentEvents" />
          </div>

          <!-- Context Metrics Tab -->
          <div v-show="activeTab === 'Context'" class="tab-pane">
            <ContextMetricsDisplay :metrics="controlUi.compactionState" />
          </div>

          <!-- Alerts Tab -->
          <div v-show="activeTab === 'Alerts'" class="tab-pane">
            <AlertNotifications
              :alerts="controlUi.alerts"
              @clear-all="controlUi.alerts = []"
            />
          </div>

          <!-- HVAC Tab -->
          <div v-show="activeTab === 'HVAC'" class="tab-pane">
            <HVACControlPanel />
          </div>
        </div>
      </div>
    </div>

    <!-- Disconnected state -->
    <div v-else class="control-ui-disconnected">
      <div class="disconnect-icon">🔌</div>
      <div class="disconnect-message">
        Control-UI not connected
      </div>
      <div class="disconnect-help">
        Ensure OpenClaw gateway is running and plugin system is enabled.
      </div>
      <button @click="refreshData" class="btn-primary">Reconnect</button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useControlUiStore } from '../stores/controlUi'
import AgentHooksMonitor from './AgentHooksMonitor.vue'
import ContextMetricsDisplay from './ContextMetricsDisplay.vue'
import AlertNotifications from './AlertNotifications.vue'
import HVACControlPanel from './HVACControlPanel.vue'

const controlUi = useControlUiStore()
const activeTab = ref('Events')
const tabs = ['Events', 'Context', 'Alerts', 'HVAC']

const alertSeverityClass = computed(() => {
  if (controlUi.alerts.length === 0) return 'severity-ok'
  const latest = controlUi.alerts[0]
  return `severity-${latest.severity}`
})

const alertStatusText = computed(() => {
  if (controlUi.alerts.length === 0) return 'No alerts'
  const latest = controlUi.alerts[0]
  return `${latest.type} (${latest.severity})`
})

const compactionStatusText = computed(() => {
  if (!controlUi.compactionState) return 'N/A'
  return controlUi.compactionState.compacted ? 'Compacting...' : 'Idle'
})

const refreshData = () => {
  // Force re-fetch from OpenClaw
  console.log('Refreshing control-ui data...')
  // In a real app, this would trigger a re-fetch from the gateway
}
</script>

<style scoped>
.control-ui-panel {
  background: linear-gradient(135deg, #0f172a 0%, #1a2847 100%);
  border: 1px solid #3b4a6f;
  border-radius: 8px;
  padding: 20px;
  color: #e0e7ff;
  font-family: 'Monaco', 'Courier New', monospace;
}

.control-ui-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding-bottom: 15px;
  border-bottom: 2px solid #3b4a6f;
}

.header-title {
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 18px;
  font-weight: bold;
}

.connection-indicator {
  font-size: 12px;
  padding: 4px 8px;
  border-radius: 4px;
  background: #1e293b;
  color: #8b5cf6;
  transition: all 0.3s ease;
}

.connection-indicator.is-connected {
  background: #064e3b;
  color: #10b981;
}

.header-actions {
  display: flex;
  gap: 8px;
}

.btn-refresh {
  padding: 6px 12px;
  background: #3b4a6f;
  border: 1px solid #4f6095;
  border-radius: 4px;
  color: #e0e7ff;
  cursor: pointer;
  font-size: 12px;
  transition: all 0.2s;
}

.btn-refresh:hover {
  background: #4f6095;
  transform: scale(1.05);
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 12px;
  margin-bottom: 20px;
}

.stat-card {
  background: #1e293b;
  border: 1px solid #3b4a6f;
  border-radius: 6px;
  padding: 12px;
}

.stat-label {
  font-size: 11px;
  color: #94a3b8;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-bottom: 6px;
}

.stat-value {
  font-size: 24px;
  font-weight: bold;
  color: #10b981;
  margin-bottom: 6px;
}

.stat-value.severity-ok {
  color: #10b981;
}

.stat-value.severity-warning {
  color: #f59e0b;
}

.stat-value.severity-error {
  color: #ef4444;
}

.stat-detail {
  font-size: 10px;
  color: #475569;
}

.stat-meter {
  height: 4px;
  background: #0f172a;
  border-radius: 2px;
  overflow: hidden;
  margin-top: 6px;
}

.meter-fill {
  height: 100%;
  background: linear-gradient(90deg, #10b981, #06b6d4);
  transition: all 0.3s ease;
}

.meter-warning {
  background: linear-gradient(90deg, #f59e0b, #f97316) !important;
}

.meter-critical {
  background: linear-gradient(90deg, #ef4444, #dc2626) !important;
}

.control-ui-tabs {
  background: #1e293b;
  border: 1px solid #3b4a6f;
  border-radius: 6px;
  overflow: hidden;
}

.tabs-header {
  display: flex;
  background: #0f172a;
  border-bottom: 1px solid #3b4a6f;
}

.tab-button {
  flex: 1;
  padding: 12px;
  background: none;
  border: none;
  color: #94a3b8;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.tab-button:hover {
  background: #1e293b;
  color: #e0e7ff;
}

.tab-button.active {
  color: #10b981;
  border-bottom: 3px solid #10b981;
  background: rgba(16, 185, 129, 0.05);
}

.tabs-content {
  min-height: 300px;
}

.tab-pane {
  padding: 16px;
  animation: fadeIn 0.2s ease;
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

.control-ui-disconnected {
  text-align: center;
  padding: 40px 20px;
}

.disconnect-icon {
  font-size: 48px;
  margin-bottom: 12px;
  opacity: 0.6;
}

.disconnect-message {
  font-size: 16px;
  font-weight: bold;
  margin-bottom: 8px;
}

.disconnect-help {
  font-size: 12px;
  color: #94a3b8;
  margin-bottom: 20px;
}

.btn-primary {
  padding: 8px 16px;
  background: #10b981;
  border: none;
  border-radius: 4px;
  color: #0f172a;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-primary:hover {
  background: #059669;
  transform: scale(1.05);
}
</style>
