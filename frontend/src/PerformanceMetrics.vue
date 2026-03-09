<template>
  <div class="performance-metrics">
    <h2>📊 Performance Metrics</h2>

    <!-- Current Status -->
    <div class="metrics-grid">
      <div class="metric-card" :class="{ alert: alerts.cpuHigh }">
        <div class="metric-label">CPU Usage</div>
        <div class="metric-value">{{ current.cpu?.toFixed(1) || '0' }}%</div>
        <div class="metric-bar">
          <div class="bar-fill" :style="{ width: (current.cpu || 0) + '%' }"></div>
        </div>
      </div>

      <div class="metric-card" :class="{ alert: alerts.memoryHigh }">
        <div class="metric-label">Memory Usage</div>
        <div class="metric-value">{{ current.memory?.toFixed(1) || '0' }}%</div>
        <div class="metric-bar">
          <div class="bar-fill" :style="{ width: (current.memory || 0) + '%' }"></div>
        </div>
      </div>

      <div class="metric-card" :class="{ alert: alerts.diskHigh }">
        <div class="metric-label">Disk Usage</div>
        <div class="metric-value">{{ current.disk?.toFixed(1) || '0' }}%</div>
        <div class="metric-bar">
          <div class="bar-fill" :style="{ width: (current.disk || 0) + '%' }"></div>
        </div>
      </div>

      <div class="metric-card">
        <div class="metric-label">24h Avg CPU</div>
        <div class="metric-value">{{ avg24h.cpu }}%</div>
        <div class="metric-hint">Average</div>
      </div>
    </div>

    <!-- Alerts -->
    <div v-if="alerts.cpuHigh || alerts.memoryHigh || alerts.diskHigh" class="alerts">
      <div v-if="alerts.cpuHigh" class="alert-item warning">⚠️ CPU usage high (>80%)</div>
      <div v-if="alerts.memoryHigh" class="alert-item warning">⚠️ Memory usage high (>85%)</div>
      <div v-if="alerts.diskHigh" class="alert-item warning">⚠️ Disk usage high (>85%)</div>
    </div>

    <!-- 24h Chart -->
    <div class="chart-section">
      <h3>24-Hour Trend</h3>
      <div class="chart-container">
        <div class="chart-legend">
          <span class="legend-item" style="color: #10b981">CPU</span>
          <span class="legend-item" style="color: #06b6d4">Memory</span>
          <span class="legend-item" style="color: #f59e0b">Disk</span>
        </div>
        
        <svg class="chart" viewBox="0 0 800 200" preserveAspectRatio="xMidYMid meet">
          <!-- CPU line -->
          <polyline
            class="line"
            :points="cpuPoints"
            fill="none"
            stroke="#10b981"
            stroke-width="2"
          />
          
          <!-- Memory line -->
          <polyline
            class="line"
            :points="memoryPoints"
            fill="none"
            stroke="#06b6d4"
            stroke-width="2"
          />
          
          <!-- Disk line -->
          <polyline
            class="line"
            :points="diskPoints"
            fill="none"
            stroke="#f59e0b"
            stroke-width="2"
          />
          
          <!-- Grid lines -->
          <line x1="0" y1="50" x2="800" y2="50" stroke="#3b4a6f" stroke-dasharray="2,2" stroke-width="0.5" />
          <line x1="0" y1="100" x2="800" y2="100" stroke="#3b4a6f" stroke-dasharray="2,2" stroke-width="0.5" />
          <line x1="0" y1="150" x2="800" y2="150" stroke="#3b4a6f" stroke-dasharray="2,2" stroke-width="0.5" />
        </svg>
      </div>
    </div>

    <!-- Services -->
    <div v-if="services.length > 0" class="services-section">
      <h3>🚀 Service Health</h3>
      <div class="services-grid">
        <div v-for="service in services" :key="service.name" class="service-status" :class="{ down: !service.up }">
          <span class="service-name">{{ service.name }}</span>
          <span class="service-indicator" :class="{ up: service.up }">
            {{ service.up ? '✓ Up' : '✗ Down' }}
          </span>
          <div class="service-detail" v-if="service.downtime">
            Downtime: {{ formatSeconds(service.downtime) }}
          </div>
        </div>
      </div>
    </div>

    <!-- Footer -->
    <div class="footer">
      <small>Last updated: {{ lastUpdate }}</small>
      <button @click="refresh" class="btn-refresh-small">🔄 Refresh</button>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'

const current = ref({})
const avg24h = ref({})
const alerts = ref({})
const services = ref([])
const history = ref([])
const lastUpdate = ref(new Date().toLocaleTimeString())

const backendUrl = `${location.protocol}//${location.hostname}:3001`

const cpuPoints = computed(() => generatePoints(history.value, 'cpu'))
const memoryPoints = computed(() => generatePoints(history.value, 'memory'))
const diskPoints = computed(() => generatePoints(history.value, 'disk'))

function generatePoints(data, key) {
  if (data.length === 0) return ''
  const step = Math.max(1, Math.floor(data.length / 100))
  const points = []
  for (let i = 0; i < data.length; i += step) {
    const x = (i / data.length) * 800
    const y = 160 - (data[i][key] / 100) * 160
    points.push(`${x},${y}`)
  }
  return points.join(' ')
}

function formatSeconds(seconds) {
  if (seconds < 60) return `${seconds}s`
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m`
  return `${Math.floor(seconds / 3600)}h`
}

const fetchMetrics = async () => {
  try {
    const response = await fetch(`${backendUrl}/api/metrics`)
    const data = await response.json()
    current.value = data.current || {}
    avg24h.value = data.avg24h || {}
    alerts.value = data.alerts || {}
    history.value = data.history || []
    services.value = data.services || []
    lastUpdate.value = new Date().toLocaleTimeString()
  } catch (e) {
    console.error('Failed to fetch metrics:', e)
  }
}

const refresh = () => {
  fetchMetrics()
}

onMounted(() => {
  fetchMetrics()
  const interval = setInterval(fetchMetrics, 30000) // Every 30 seconds
  return () => clearInterval(interval)
})
</script>

<style scoped>
.performance-metrics {
  padding: 0;
}

h2 {
  margin: 1rem 1rem 0.5rem 1rem;
  color: #10b981;
}

h3 {
  margin: 1.5rem 1rem 1rem 1rem;
  color: #e0e7ff;
  font-size: 0.95rem;
}

.metrics-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 1rem;
  padding: 0 1rem 1rem 1rem;
}

.metric-card {
  background: #1a1f3a;
  border: 1px solid #3b4a6f;
  border-radius: 6px;
  padding: 0.75rem;
  text-align: center;
}

.metric-card.alert {
  border-color: #f59e0b;
  background: rgba(245, 158, 11, 0.1);
}

.metric-label {
  font-size: 0.7rem;
  color: #94a3b8;
  text-transform: uppercase;
  margin-bottom: 0.25rem;
}

.metric-value {
  font-size: 1.5rem;
  font-weight: bold;
  color: #10b981;
}

.metric-bar {
  height: 4px;
  background: #0f172a;
  border-radius: 2px;
  margin-top: 0.5rem;
  overflow: hidden;
}

.bar-fill {
  height: 100%;
  background: linear-gradient(90deg, #10b981, #06b6d4);
}

.metric-hint {
  font-size: 0.7rem;
  color: #64748b;
  margin-top: 0.25rem;
}

.alerts {
  margin: 0 1rem 1rem 1rem;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.alert-item {
  padding: 0.5rem;
  border-radius: 4px;
  font-size: 0.85rem;
}

.alert-item.warning {
  background: rgba(245, 158, 11, 0.2);
  color: #f59e0b;
  border: 1px solid #f59e0b;
}

.chart-section {
  padding: 0 1rem;
  margin-bottom: 1.5rem;
}

.chart-container {
  background: #1a1f3a;
  border: 1px solid #3b4a6f;
  border-radius: 6px;
  padding: 1rem;
}

.chart-legend {
  display: flex;
  gap: 1.5rem;
  margin-bottom: 1rem;
  font-size: 0.8rem;
}

.legend-item {
  font-weight: bold;
}

.chart {
  width: 100%;
  height: 200px;
}

.services-section {
  padding: 0 1rem;
}

.services-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 0.75rem;
}

.service-status {
  background: #1a1f3a;
  border: 1px solid #3b4a6f;
  border-left: 3px solid #10b981;
  border-radius: 4px;
  padding: 0.75rem;
  font-size: 0.85rem;
}

.service-status.down {
  border-left-color: #ef4444;
  background: rgba(239, 68, 68, 0.1);
}

.service-name {
  display: block;
  font-weight: bold;
  color: #e0e7ff;
  margin-bottom: 0.25rem;
}

.service-indicator {
  display: block;
  color: #10b981;
  font-weight: bold;
}

.service-status.down .service-indicator {
  color: #ef4444;
}

.service-detail {
  font-size: 0.7rem;
  color: #64748b;
  margin-top: 0.25rem;
}

.footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem;
  background: #0a0e27;
  border-top: 1px solid #3b4a6f;
  margin-top: 1rem;
  font-size: 0.8rem;
  color: #64748b;
}

.btn-refresh-small {
  padding: 0.3rem 0.6rem;
  background: #3b4a6f;
  border: 1px solid #4f6095;
  border-radius: 3px;
  color: #e0e7ff;
  cursor: pointer;
  font-size: 0.75rem;
  transition: all 0.2s;
}

.btn-refresh-small:hover {
  background: #4f6095;
}
</style>
