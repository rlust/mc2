<template>
  <div class="ha-panel">
    <h2>🏠 Home Assistant Controls</h2>

    <!-- Instance Selector -->
    <div class="instance-selector">
      <button
        v-for="inst in instances"
        :key="inst"
        @click="currentInstance = inst"
        class="instance-btn"
        :class="{ active: currentInstance === inst }"
      >
        {{ inst === 'newark' ? '🏡 Newark' : '🚐 Aspire RV' }}
      </button>
    </div>

    <!-- Status -->
    <div class="status-bar">
      <span v-if="loading" class="status-loading">⏳ Loading...</span>
      <span v-else-if="!configured" class="status-unconfigured">⚠️ Not configured (using mock data)</span>
      <span v-else class="status-connected">✅ Connected to {{ currentInstance }}</span>
      <button @click="refresh" class="btn-refresh">🔄</button>
    </div>

    <!-- Entities Grid -->
    <div v-if="!loading" class="entities-container">
      <!-- Lights -->
      <div v-if="entities.lights?.length > 0" class="entity-section">
        <h3>💡 Lights</h3>
        <div class="entity-grid">
          <div v-for="light in entities.lights" :key="light.id" class="entity-card light">
            <div class="entity-header">
              <span class="entity-name">{{ light.name }}</span>
              <span class="entity-state" :class="light.state">{{ light.state }}</span>
            </div>
            <div class="entity-controls">
              <div class="toggle-group">
                <button
                  @click="toggleLight(light.id, 'on')"
                  class="btn-small"
                  :class="{ active: light.state === 'on' }"
                >
                  ◯
                </button>
                <button
                  @click="toggleLight(light.id, 'off')"
                  class="btn-small"
                  :class="{ active: light.state === 'off' }"
                >
                  ◐
                </button>
              </div>
              <div v-if="light.state === 'on' && light.attributes?.brightness !== undefined" class="brightness-control">
                <input
                  type="range"
                  :value="Math.round((light.attributes.brightness / 255) * 100)"
                  @input="setBrightness(light.id, ($event.target.value / 100) * 255)"
                  min="0"
                  max="100"
                  class="brightness-slider"
                >
                <span class="brightness-value">{{ Math.round((light.attributes.brightness / 255) * 100) }}%</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Switches -->
      <div v-if="entities.switches?.length > 0" class="entity-section">
        <h3>🎚️ Switches</h3>
        <div class="entity-grid">
          <div v-for="sw in entities.switches" :key="sw.id" class="entity-card switch">
            <div class="entity-header">
              <span class="entity-name">{{ sw.name }}</span>
            </div>
            <div class="entity-controls">
              <button
                @click="toggleSwitch(sw.id, sw.state === 'on' ? 'off' : 'on')"
                class="toggle-btn"
                :class="{ active: sw.state === 'on' }"
              >
                <span class="toggle-label">{{ sw.state === 'on' ? 'ON' : 'OFF' }}</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Locks -->
      <div v-if="entities.locks?.length > 0" class="entity-section">
        <h3>🔒 Locks</h3>
        <div class="entity-grid">
          <div v-for="lock in entities.locks" :key="lock.id" class="entity-card lock">
            <div class="entity-header">
              <span class="entity-name">{{ lock.name }}</span>
              <span class="entity-state" :class="lock.state">{{ lock.state }}</span>
            </div>
            <div class="entity-controls">
              <button
                @click="toggleLock(lock.id, lock.state === 'locked' ? 'unlock' : 'lock')"
                class="lock-btn"
                :class="lock.state"
              >
                {{ lock.state === 'locked' ? '🔒 Locked' : '🔓 Unlocked' }}
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Climate/HVAC -->
      <div v-if="entities.climate?.length > 0" class="entity-section">
        <h3>🌡️ Climate Control</h3>
        <div class="entity-grid">
          <div v-for="climate in entities.climate" :key="climate.id" class="entity-card climate">
            <div class="entity-header">
              <span class="entity-name">{{ climate.name }}</span>
              <span class="entity-state">{{ climate.state }}</span>
            </div>
            <div class="entity-controls">
              <div class="temp-display">
                <div class="temp-item">
                  <span class="label">Current</span>
                  <span class="value">{{ climate.attributes?.current_temperature || '—' }}°</span>
                </div>
                <div class="temp-item">
                  <span class="label">Target</span>
                  <span class="value">{{ climate.attributes?.target_temperature || '—' }}°</span>
                </div>
              </div>
              <div class="temp-input-group">
                <button
                  @click="adjustTemp(climate.id, -1)"
                  class="btn-adjust"
                >
                  −
                </button>
                <input
                  type="number"
                  :value="climate.attributes?.target_temperature || 70"
                  @change="setTemp(climate.id, $event.target.value)"
                  min="50"
                  max="90"
                  class="temp-input"
                >
                <button
                  @click="adjustTemp(climate.id, 1)"
                  class="btn-adjust"
                >
                  +
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Empty State -->
      <div v-if="Object.values(entities).every(e => !e || e.length === 0)" class="empty-state">
        <p>No entities found for {{ currentInstance }}</p>
      </div>
    </div>

    <!-- Loading State -->
    <div v-else class="loading-state">
      <p>⏳ Loading {{ currentInstance }} entities...</p>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'

const currentInstance = ref('newark')
const instances = ['newark', 'aspire']
const loading = ref(false)
const entities = ref({
  lights: [],
  switches: [],
  locks: [],
  climate: [],
  cameras: [],
  other: []
})
const configured = ref(false)

const backendUrl = computed(() => {
  const proto = location.protocol
  const host = location.hostname
  const port = 3001
  return `${proto}//${host}:${port}`
})

const fetchEntities = async () => {
  loading.value = true
  try {
    const resp = await fetch(`${backendUrl.value}/api/ha/entities?instance=${currentInstance.value}`)
    const data = await resp.json()
    
    entities.value = {
      lights: data.lights || [],
      switches: data.switches || [],
      locks: data.locks || [],
      climate: data.climate || [],
      cameras: data.cameras || [],
      other: data.other || []
    }
    
    configured.value = data.configured || false
  } catch (err) {
    console.error('Failed to fetch entities:', err)
  } finally {
    loading.value = false
  }
}

const refresh = () => {
  fetchEntities()
}

const toggleLight = async (entityId, action) => {
  try {
    const resp = await fetch(`${backendUrl.value}/api/ha/light-control`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        instance: currentInstance.value,
        entityId,
        action
      })
    })
    const data = await resp.json()
    
    if (data.success || !configured.value) {
      // Update local state
      const light = entities.value.lights.find(l => l.id === entityId)
      if (light) light.state = action
    } else {
      alert('Failed to control light: ' + (data.error || 'Unknown error'))
    }
  } catch (err) {
    console.error('Light control error:', err)
  }
}

const setBrightness = async (entityId, brightness) => {
  try {
    const resp = await fetch(`${backendUrl.value}/api/ha/light-control`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        instance: currentInstance.value,
        entityId,
        action: 'on',
        brightness: Math.round(brightness)
      })
    })
    const data = await resp.json()
    
    if (data.success || !configured.value) {
      const light = entities.value.lights.find(l => l.id === entityId)
      if (light) light.attributes.brightness = Math.round(brightness)
    }
  } catch (err) {
    console.error('Brightness control error:', err)
  }
}

const toggleSwitch = async (entityId, action) => {
  try {
    const resp = await fetch(`${backendUrl.value}/api/ha/switch-control`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        instance: currentInstance.value,
        entityId,
        action
      })
    })
    const data = await resp.json()
    
    if (data.success || !configured.value) {
      const sw = entities.value.switches.find(s => s.id === entityId)
      if (sw) sw.state = action
    } else {
      alert('Failed to control switch: ' + (data.error || 'Unknown error'))
    }
  } catch (err) {
    console.error('Switch control error:', err)
  }
}

const toggleLock = async (entityId, action) => {
  try {
    const resp = await fetch(`${backendUrl.value}/api/ha/lock-control`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        instance: currentInstance.value,
        entityId,
        action
      })
    })
    const data = await resp.json()
    
    if (data.success || !configured.value) {
      const lock = entities.value.locks.find(l => l.id === entityId)
      if (lock) lock.state = action
    } else {
      alert('Failed to control lock: ' + (data.error || 'Unknown error'))
    }
  } catch (err) {
    console.error('Lock control error:', err)
  }
}

const adjustTemp = async (entityId, delta) => {
  const climate = entities.value.climate.find(c => c.id === entityId)
  if (climate) {
    const newTemp = (climate.attributes?.target_temperature || 70) + delta
    await setTemp(entityId, newTemp)
  }
}

const setTemp = async (entityId, temp) => {
  const targetTemp = parseInt(temp)
  if (targetTemp < 50 || targetTemp > 90) {
    alert('Temperature must be between 50°F and 90°F')
    return
  }
  
  try {
    const resp = await fetch(`${backendUrl.value}/api/ha/climate-control`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        instance: currentInstance.value,
        entityId,
        targetTemp
      })
    })
    const data = await resp.json()
    
    if (data.success || !configured.value) {
      const climate = entities.value.climate.find(c => c.id === entityId)
      if (climate) climate.attributes.target_temperature = targetTemp
    } else {
      alert('Failed to set temperature: ' + (data.error || 'Unknown error'))
    }
  } catch (err) {
    console.error('Climate control error:', err)
  }
}

// Initialize on mount
onMounted(() => {
  fetchEntities()
})

// Refetch when instance changes
watch(currentInstance, () => {
  fetchEntities()
})

// Refresh every 30 seconds
const interval = ref(null)
onMounted(() => {
  interval.value = setInterval(fetchEntities, 30000)
  return () => {
    if (interval.value) clearInterval(interval.value)
  }
})
</script>

<style scoped>
.ha-panel {
  padding: 0;
}

h2 {
  margin: 0 0 1rem 0;
  color: #10b981;
  font-size: 1.3rem;
}

.instance-selector {
  display: flex;
  gap: 1rem;
  margin-bottom: 1.5rem;
  padding: 0 0 1rem 0;
  border-bottom: 1px solid #3b4a6f;
}

.instance-btn {
  padding: 0.6rem 1.2rem;
  background: #1a1f3a;
  border: 2px solid #3b4a6f;
  border-radius: 6px;
  color: #94a3b8;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.2s;
}

.instance-btn:hover {
  border-color: #10b981;
  color: #10b981;
}

.instance-btn.active {
  background: #10b981;
  border-color: #10b981;
  color: #0f1419;
}

.status-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.75rem;
  background: #1a1f3a;
  border-radius: 6px;
  margin-bottom: 1.5rem;
  font-size: 0.9rem;
}

.status-loading {
  color: #f59e0b;
}

.status-unconfigured {
  color: #fca5a5;
}

.status-connected {  color: #10b981;
}

.btn-refresh {
  padding: 0.5rem 1rem;
  background: #3b4a6f;
  border: 1px solid #4f6095;
  border-radius: 4px;
  color: #e0e7ff;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-refresh:hover {
  background: #4f6095;
}

.entities-container {
  display: flex;
  flex-direction: column;
  gap: 2rem;
}

.entity-section h3 {
  margin: 0 0 1rem 0;
  color: #cbd5e1;
  font-size: 1rem;
}

.entity-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 1rem;
}

.entity-card {
  background: #1a1f3a;
  border: 1px solid #3b4a6f;
  border-radius: 8px;
  padding: 1rem;
}

.entity-card.light {
  border-left: 4px solid #fbbf24;
}

.entity-card.switch {
  border-left: 4px solid #f59e0b;
}

.entity-card.lock {
  border-left: 4px solid #ef4444;
}

.entity-card.climate {
  border-left: 4px solid #06b6d4;
}

.entity-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
  padding-bottom: 0.75rem;
  border-bottom: 1px solid #3b4a6f;
}

.entity-name {
  font-weight: bold;
  color: #e0e7ff;
  font-size: 0.95rem;
}

.entity-state {
  padding: 0.25rem 0.5rem;
  border-radius: 3px;
  font-size: 0.75rem;
  text-transform: uppercase;
  font-weight: bold;
  background: #0f172a;
  color: #94a3b8;
}

.entity-state.on {
  color: #10b981;
}

.entity-state.off {
  color: #64748b;
}

.entity-state.locked {
  color: #ef4444;
}

.entity-state.unlocked {
  color: #fbbf24;
}

.entity-controls {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.toggle-group {
  display: flex;
  gap: 0.5rem;
}

.btn-small {
  flex: 1;
  padding: 0.5rem;
  background: #0f172a;
  border: 1px solid #3b4a6f;
  border-radius: 4px;
  color: #94a3b8;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-small:hover {
  border-color: #10b981;
  color: #10b981;
}

.btn-small.active {
  background: #10b981;
  color: #0f1419;
  border-color: #10b981;
}

.brightness-control {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.brightness-slider {
  flex: 1;
  height: 6px;
  border-radius: 3px;
  background: #0f172a;
  outline: none;
  -webkit-appearance: none;
  appearance: none;
}

.brightness-slider::-webkit-slider-thumb {
  -webkit-appearance: none;
  appearance: none;
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background: #10b981;
  cursor: pointer;
  border: 2px solid #0f1419;
}

.brightness-slider::-moz-range-thumb {
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background: #10b981;
  cursor: pointer;
  border: 2px solid #0f1419;
}

.brightness-value {
  min-width: 40px;
  text-align: right;
  color: #10b981;
  font-weight: bold;
  font-size: 0.85rem;
}

.toggle-btn {
  width: 100%;
  padding: 0.75rem;
  background: #0f172a;
  border: 2px solid #3b4a6f;
  border-radius: 4px;
  color: #94a3b8;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
}

.toggle-btn:hover {
  border-color: #10b981;
}

.toggle-btn.active {
  background: #10b981;
  border-color: #10b981;
  color: #0f1419;
}

.toggle-label {
  font-size: 0.9rem;
}

.lock-btn {
  width: 100%;
  padding: 0.75rem;
  background: #0f172a;
  border: 2px solid #ef4444;
  border-radius: 4px;
  color: #ef4444;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.2s;
  font-size: 0.9rem;
}

.lock-btn:hover {
  background: #7f1d1d;
}

.lock-btn.locked {
  border-color: #ef4444;
  color: #ef4444;
}

.lock-btn.unlocked {
  border-color: #fbbf24;
  color: #fbbf24;
}

.temp-display {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.75rem;
  padding: 0.75rem;
  background: #0f172a;
  border-radius: 4px;
  margin-bottom: 0.75rem;
}

.temp-item {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.temp-item .label {
  font-size: 0.75rem;
  color: #94a3b8;
  text-transform: uppercase;
}

.temp-item .value {
  font-size: 1.5rem;
  font-weight: bold;
  color: #06b6d4;
}

.temp-input-group {
  display: grid;
  grid-template-columns: 40px 1fr 40px;
  gap: 0.5rem;
  align-items: center;
}

.btn-adjust {
  padding: 0.5rem;
  background: #3b4a6f;
  border: 1px solid #4f6095;
  border-radius: 4px;
  color: #e0e7ff;
  font-size: 1.2rem;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-adjust:hover {
  background: #4f6095;
}

.temp-input {
  padding: 0.5rem;
  background: #0f172a;
  border: 1px solid #3b4a6f;
  border-radius: 4px;
  color: #06b6d4;
  font-size: 1rem;
  font-weight: bold;
  text-align: center;
}

.temp-input:focus {
  outline: none;
  border-color: #06b6d4;
  box-shadow: 0 0 8px rgba(6, 182, 212, 0.2);
}

.empty-state {
  text-align: center;
  padding: 3rem 1rem;
  color: #94a3b8;
}

.loading-state {
  text-align: center;
  padding: 2rem;
  color: #94a3b8;
}
</style>
