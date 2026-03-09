<template>
  <div class="monitoring-dashboard">
    <!-- Header -->
    <div class="monitor-header">
      <h1>🔍 Advanced Monitoring</h1>
      <button @click="goBack" class="btn-back">← Back</button>
    </div>

    <!-- Tabs -->
    <div class="monitor-tabs">
      <button
        v-for="tab in tabs"
        :key="tab"
        @click="activeMonitorTab = tab"
        class="monitor-tab-btn"
        :class="{ active: activeMonitorTab === tab }"
      >
        {{ tab }}
      </button>
    </div>

    <!-- Tab Content -->
    <div class="monitor-content">
      <!-- Performance Metrics -->
      <div v-if="activeMonitorTab === 'Performance'" class="tab-panel">
        <PerformanceMetrics />
      </div>

      <!-- Service Health -->
      <div v-if="activeMonitorTab === 'Services'" class="tab-panel">
        <ServiceHealth />
      </div>

      <!-- Notifications -->
      <div v-if="activeMonitorTab === 'Alerts'" class="tab-panel">
        <NotificationCenter />
      </div>

      <!-- Session Logs -->
      <div v-if="activeMonitorTab === 'Logs'" class="tab-panel">
        <div class="logs-section">
          <h3>📋 Session Activity Logs</h3>
          <div class="agents-logs">
            <div v-if="agents.length === 0" class="empty">No agents available</div>
            <div v-else class="agent-logs-list">
              <div v-for="agent in agents" :key="agent.id" class="agent-log-card">
                <h4>{{ agent.label }}</h4>
                <SessionLogs :sessionKey="agent.id" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import PerformanceMetrics from './PerformanceMetrics.vue'
import ServiceHealth from './ServiceHealth.vue'
import NotificationCenter from './NotificationCenter.vue'
import SessionLogs from './SessionLogs.vue'

const activeMonitorTab = ref('Performance')
const tabs = ['Performance', 'Services', 'Alerts', 'Logs']
const agents = ref([])

const backendUrl = computed(() => {
  const proto = location.protocol
  const host = location.hostname
  const port = 3001
  return `${proto}//${host}:${port}`
})

const emit = defineEmits(['back'])

const goBack = () => {
  emit('back')
}

const fetchAgents = async () => {
  try {
    const resp = await fetch(`${backendUrl.value}/api/agents`)
    const data = await resp.json()
    agents.value = data.nodes || []
  } catch (err) {
    console.error('Failed to fetch agents:', err)
  }
}

onMounted(() => {
  fetchAgents()
})
</script>

<style scoped>
.monitoring-dashboard {
  background: #0f1419;
  color: #e0e7ff;
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.monitor-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem;
  background: linear-gradient(135deg, #1a1f3a 0%, #2a2f4a 100%);
  border-bottom: 2px solid #10b981;
}

.monitor-header h1 {
  margin: 0;
  color: #10b981;
  font-size: 1.5rem;
}

.btn-back {
  padding: 0.5rem 1rem;
  background: #3b4a6f;
  border: 1px solid #4f6095;
  border-radius: 4px;
  color: #e0e7ff;
  cursor: pointer;
  font-weight: bold;
  transition: all 0.2s;
}

.btn-back:hover {
  background: #4f6095;
}

.monitor-tabs {
  display: flex;
  background: #1a1f3a;
  border-bottom: 1px solid #3b4a6f;
  padding: 0 1rem;
  overflow-x: auto;
}

.monitor-tab-btn {
  padding: 0.75rem 1rem;
  background: none;
  border: none;
  color: #94a3b8;
  cursor: pointer;
  font-weight: bold;
  border-bottom: 3px solid transparent;
  transition: all 0.2s;
  white-space: nowrap;
}

.monitor-tab-btn:hover {
  color: #e0e7ff;
}

.monitor-tab-btn.active {
  color: #10b981;
  border-bottom-color: #10b981;
}

.monitor-content {
  flex: 1;
  overflow-y: auto;
  padding: 1.5rem;
}

.tab-panel {
  animation: fadeIn 0.2s ease-in;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

.logs-section h3 {
  color: #10b981;
  margin-bottom: 1rem;
}

.empty {
  text-align: center;
  color: #64748b;
  padding: 2rem;
  background: #1a1f3a;
  border-radius: 6px;
}

.agent-logs-list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(400px, 1fr));
  gap: 1rem;
}

.agent-log-card {
  background: #1a1f3a;
  border: 1px solid #3b4a6f;
  border-radius: 6px;
  padding: 1rem;
}

.agent-log-card h4 {
  margin: 0 0 0.75rem 0;
  color: #10b981;
  font-size: 0.95rem;
}
</style>
