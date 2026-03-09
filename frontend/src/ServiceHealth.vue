<template>
  <div class="service-health">
    <h3>🔧 Service Auto-Recovery</h3>
    
    <div class="services-list">
      <div v-for="service in services" :key="service.name" class="service-card" :class="{ down: !service.up }">
        <div class="service-header">
          <span class="service-name">{{ service.name }}</span>
          <span class="service-status" :class="{ up: service.up }">
            {{ service.up ? '✓ UP' : '✗ DOWN' }}
          </span>
        </div>
        
        <div class="service-details">
          <div class="detail">
            <span>Last Check:</span>
            <span>{{ formatTime(service.lastCheck) }}</span>
          </div>
          <div v-if="service.downtime" class="detail warning">
            <span>Downtime:</span>
            <span>{{ formatSeconds(service.downtime) }}</span>
          </div>
        </div>
        
        <button 
          v-if="!service.up" 
          @click="restartService(service.name)" 
          class="btn-restart"
          :disabled="restarting[service.name]"
        >
          {{ restarting[service.name] ? '⏳ Restarting...' : '🔄 Restart Now' }}
        </button>
      </div>
    </div>
    
    <div v-if="restartLog.length > 0" class="restart-log">
      <h4>📝 Restart History</h4>
      <div class="log-list">
        <div v-for="(entry, idx) in restartLog.slice(-5)" :key="idx" class="log-entry">
          <span class="log-time">{{ formatTime(entry.time) }}</span>
          <span class="log-service">{{ entry.service }}</span>
          <span class="log-status" :class="entry.success ? 'success' : 'error'">
            {{ entry.success ? '✓ Success' : '✗ Failed' }}
          </span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'

const services = ref([])
const restarting = ref({})
const restartLog = ref([])
const backendUrl = `${location.protocol}//${location.hostname}:3001`

const fetchServices = async () => {
  try {
    const response = await fetch(`${backendUrl}/api/services/health`)
    const data = await response.json()
    services.value = data.services || []
  } catch (e) {
    console.error('Failed to fetch service health:', e)
  }
}

const restartService = async (serviceName) => {
  restarting.value[serviceName] = true
  
  try {
    const response = await fetch(`${backendUrl}/api/service/${serviceName}/restart`, {
      method: 'POST'
    })
    const data = await response.json()
    
    restartLog.value.push({
      time: new Date(),
      service: serviceName,
      success: data.success
    })
    
    // Refresh service status
    await new Promise(r => setTimeout(r, 1000))
    fetchServices()
  } catch (e) {
    console.error('Restart failed:', e)
    restartLog.value.push({
      time: new Date(),
      service: serviceName,
      success: false
    })
  } finally {
    restarting.value[serviceName] = false
  }
}

const formatTime = (time) => {
  const date = new Date(time)
  return date.toLocaleTimeString()
}

const formatSeconds = (seconds) => {
  if (seconds < 60) return `${seconds}s ago`
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`
  return `${Math.floor(seconds / 3600)}h ago`
}

onMounted(() => {
  fetchServices()
  const interval = setInterval(fetchServices, 30000)
  return () => clearInterval(interval)
})
</script>

<style scoped>
.service-health {
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
  margin: 1rem 0 0.5rem 0;
  color: #94a3b8;
  font-size: 0.85rem;
}

.services-list {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  margin-bottom: 1rem;
}

.service-card {
  background: #0f172a;
  border: 1px solid #3b4a6f;
  border-left: 3px solid #10b981;
  border-radius: 4px;
  padding: 0.75rem;
}

.service-card.down {
  border-left-color: #ef4444;
  background: rgba(239, 68, 68, 0.1);
}

.service-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.5rem;
}

.service-name {
  font-weight: bold;
  color: #e0e7ff;
}

.service-status {
  padding: 0.2rem 0.5rem;
  border-radius: 3px;
  font-size: 0.7rem;
  font-weight: bold;
  background: #064e3b;
  color: #10b981;
}

.service-status:not(.up) {
  background: #7f1d1d;
  color: #fca5a5;
}

.service-details {
  font-size: 0.8rem;
  color: #94a3b8;
  margin-bottom: 0.5rem;
}

.detail {
  display: flex;
  justify-content: space-between;
  margin-bottom: 0.25rem;
}

.detail.warning {
  color: #f59e0b;
}

.btn-restart {
  width: 100%;
  padding: 0.4rem;
  background: #ef4444;
  border: none;
  border-radius: 3px;
  color: #fff;
  font-weight: bold;
  cursor: pointer;
  font-size: 0.85rem;
  transition: all 0.2s;
}

.btn-restart:hover:not(:disabled) {
  background: #dc2626;
  transform: scale(1.02);
}

.btn-restart:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.restart-log {
  border-top: 1px solid #3b4a6f;
  padding-top: 0.75rem;
}

.log-list {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.log-entry {
  display: grid;
  grid-template-columns: 70px 1fr 80px;
  gap: 0.5rem;
  font-size: 0.75rem;
  padding: 0.4rem;
  background: #0f172a;
  border-radius: 3px;
  align-items: center;
}

.log-time {
  color: #64748b;
  font-family: monospace;
}

.log-service {
  color: #cbd5e1;
}

.log-status {
  text-align: right;
  font-weight: bold;
}

.log-status.success {
  color: #10b981;
}

.log-status.error {
  color: #ef4444;
}
</style>
