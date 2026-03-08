<template>
  <div class="hvac-control-panel">
    <!-- Status Display -->
    <div class="hvac-status">
      <div class="status-icon">🌡️</div>
      <div class="status-content">
        <div class="status-title">RV-C Thermostat Control</div>
        <div class="status-current">
          <span class="temp-label">Current:</span>
          <span class="temp-value" v-if="currentTemp">{{ currentTemp }}°F</span>
          <span class="temp-value" v-else>--°F</span>
        </div>
        <div class="status-target">
          <span class="temp-label">Target:</span>
          <span class="temp-value" v-if="targetTemp">{{ targetTemp }}°F</span>
          <span class="temp-value" v-else>--°F</span>
        </div>
      </div>
    </div>

    <!-- Control Panel -->
    <div class="control-area">
      <div class="temperature-control">
        <div class="control-label">Set Temperature</div>
        <div class="temp-input-group">
          <button @click="decreaseTemp" class="btn-decrease">−</button>
          <input
            v-model.number="inputTemp"
            type="number"
            class="temp-input"
            min="50"
            max="90"
            @keyup.enter="sendCommand"
          />
          <button @click="increaseTemp" class="btn-increase">+</button>
        </div>
        <div class="temp-range">50°F - 90°F</div>
      </div>

      <div class="mode-control">
        <div class="control-label">Mode</div>
        <div class="mode-buttons">
          <button
            v-for="mode in modes"
            :key="mode"
            @click="selectedMode = mode"
            class="btn-mode"
            :class="{ active: selectedMode === mode }"
          >
            {{ modeEmojis[mode] }} {{ mode }}
          </button>
        </div>
      </div>

      <div class="action-buttons">
        <button @click="sendCommand" class="btn-send" :disabled="isLoading">
          {{ isLoading ? '⏳ Sending...' : '📤 Send Command' }}
        </button>
        <button @click="refreshStatus" class="btn-refresh">🔄 Refresh</button>
      </div>

      <div v-if="lastCommand" class="last-command">
        <div class="command-label">Last Command:</div>
        <div class="command-details">
          <div>{{ lastCommand.temp }}°F ({{ lastCommand.mode }})</div>
          <div class="command-time">{{ lastCommand.time }}</div>
        </div>
      </div>
    </div>

    <!-- Status Indicators -->
    <div class="status-indicators">
      <div class="indicator">
        <div class="indicator-label">HVAC Action</div>
        <div class="indicator-value" :class="`action-${hvacAction}`">
          {{ hvacAction || 'idle' }}
        </div>
      </div>
      <div class="indicator">
        <div class="indicator-label">RV-C Bus</div>
        <div class="indicator-value" :class="{ 'is-connected': busConnected }">
          {{ busConnected ? 'Connected' : 'Offline' }}
        </div>
      </div>
      <div class="indicator">
        <div class="indicator-label">Response</div>
        <div class="indicator-value" v-if="lastResponse">
          ✓ {{ lastResponse }}
        </div>
        <div class="indicator-value" v-else>
          --
        </div>
      </div>
    </div>

    <!-- Command History -->
    <div v-if="commandHistory.length > 0" class="command-history">
      <div class="history-title">Recent Commands</div>
      <div class="history-list">
        <div v-for="cmd in commandHistory.slice(0, 5)" :key="cmd.id" class="history-item">
          <div class="history-time">{{ cmd.timestamp }}</div>
          <div class="history-cmd">{{ cmd.temp }}°F → {{ cmd.mode }}</div>
          <div class="history-status" :class="`status-${cmd.status}`">
            {{ cmd.status }}
          </div>
        </div>
      </div>
    </div>

    <!-- Helper Text -->
    <div class="helper-text">
      <div class="helper-icon">💡</div>
      <div class="helper-content">
        <div class="helper-title">HVAC Control</div>
        <ul>
          <li>Adjust temperature in 1°F increments</li>
          <li>Commands are sent to Aspire RV via Home Assistant</li>
          <li>RV-C bus must be online for commands to work</li>
          <li>Context metrics tracked during command execution</li>
        </ul>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'

const currentTemp = ref<number | null>(68)
const targetTemp = ref<number | null>(72)
const inputTemp = ref(72)
const selectedMode = ref('heat')
const modes = ['off', 'heat', 'cool', 'auto']
const hvacAction = ref('idle')
const busConnected = ref(false)
const isLoading = ref(false)
const lastResponse = ref<string | null>(null)

const modeEmojis: Record<string, string> = {
  off: '⏹️',
  heat: '🔥',
  cool: '❄️',
  auto: '🔄',
}

const lastCommand = ref<{ temp: number; mode: string; time: string } | null>(null)
const commandHistory = ref<Array<{
  id: string
  timestamp: string
  temp: number
  mode: string
  status: string
}>>([])

const decreaseTemp = () => {
  if (inputTemp.value > 50) {
    inputTemp.value--
  }
}

const increaseTemp = () => {
  if (inputTemp.value < 90) {
    inputTemp.value++
  }
}

const sendCommand = async () => {
  isLoading.value = true
  try {
    // Simulate API call
    console.log(`Setting thermostat to ${inputTemp.value}°F in ${selectedMode.value} mode`)

    lastCommand.value = {
      temp: inputTemp.value,
      mode: selectedMode.value,
      time: new Date().toLocaleTimeString(),
    }

    commandHistory.value.unshift({
      id: `cmd-${Date.now()}`,
      timestamp: new Date().toLocaleTimeString(),
      temp: inputTemp.value,
      mode: selectedMode.value,
      status: 'sent',
    })

    lastResponse.value = 'Command sent successfully'
    hvacAction.value = selectedMode.value === 'heat' ? 'heating' : 'cooling'

    // Update target temp
    targetTemp.value = inputTemp.value

    setTimeout(() => {
      hvacAction.value = 'idle'
    }, 3000)
  } catch (error) {
    lastResponse.value = 'Command failed'
  } finally {
    isLoading.value = false
  }
}

const refreshStatus = () => {
  console.log('Refreshing thermostat status...')
  // Simulate refresh
  busConnected.value = true
}

// Initialize
refreshStatus()
</script>

<style scoped>
.hvac-control-panel {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.hvac-status {
  display: grid;
  grid-template-columns: 48px 1fr;
  gap: 12px;
  background: linear-gradient(135deg, #164e63 0%, #0f172a 100%);
  border: 1px solid #164e63;
  border-radius: 6px;
  padding: 12px;
}

.status-icon {
  font-size: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.status-content {
  display: flex;
  flex-direction: column;
  justify-content: center;
}

.status-title {
  font-size: 12px;
  font-weight: bold;
  color: #e0e7ff;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-bottom: 6px;
}

.status-current,
.status-target {
  font-size: 11px;
  color: #94a3b8;
  display: flex;
  align-items: center;
  gap: 6px;
}

.temp-label {
  color: #64748b;
  font-weight: bold;
}

.temp-value {
  color: #10b981;
  font-weight: bold;
  font-size: 13px;
}

.control-area {
  background: #0f172a;
  border: 1px solid #3b4a6f;
  border-radius: 6px;
  padding: 12px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.control-label {
  font-size: 10px;
  color: #94a3b8;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  font-weight: bold;
  margin-bottom: 6px;
}

.temperature-control {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.temp-input-group {
  display: grid;
  grid-template-columns: 36px 1fr 36px;
  gap: 8px;
}

.btn-decrease,
.btn-increase {
  background: #3b4a6f;
  border: 1px solid #4f6095;
  border-radius: 4px;
  color: #e0e7ff;
  font-size: 18px;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.2s;
  height: 36px;
}

.btn-decrease:hover,
.btn-increase:hover {
  background: #4f6095;
}

.temp-input {
  background: #1e293b;
  border: 1px solid #3b4a6f;
  border-radius: 4px;
  color: #10b981;
  font-size: 16px;
  font-weight: bold;
  text-align: center;
  padding: 6px;
}

.temp-input:focus {
  outline: none;
  border-color: #10b981;
  box-shadow: 0 0 8px rgba(16, 185, 129, 0.2);
}

.temp-range {
  font-size: 9px;
  color: #64748b;
  text-align: center;
}

.mode-control {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.mode-buttons {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 6px;
}

.btn-mode {
  padding: 6px 8px;
  background: #1e293b;
  border: 1px solid #3b4a6f;
  border-radius: 4px;
  color: #94a3b8;
  font-size: 10px;
  cursor: pointer;
  transition: all 0.2s;
  font-weight: bold;
  text-transform: capitalize;
}

.btn-mode:hover {
  background: #3b4a6f;
  color: #e0e7ff;
}

.btn-mode.active {
  background: #10b981;
  color: #0f172a;
  border-color: #10b981;
}

.action-buttons {
  display: grid;
  grid-template-columns: 1fr auto;
  gap: 8px;
}

.btn-send {
  padding: 8px 12px;
  background: #10b981;
  border: none;
  border-radius: 4px;
  color: #0f172a;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.2s;
  font-size: 12px;
}

.btn-send:hover:not(:disabled) {
  background: #059669;
  transform: scale(1.02);
}

.btn-send:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-refresh {
  padding: 8px 12px;
  background: #3b4a6f;
  border: 1px solid #4f6095;
  border-radius: 4px;
  color: #e0e7ff;
  cursor: pointer;
  transition: all 0.2s;
  font-size: 12px;
}

.btn-refresh:hover {
  background: #4f6095;
}

.last-command {
  background: #1e293b;
  border-left: 3px solid #10b981;
  border-radius: 3px;
  padding: 8px;
  font-size: 10px;
}

.command-label {
  color: #94a3b8;
  text-transform: uppercase;
  letter-spacing: 0.3px;
  margin-bottom: 4px;
}

.command-details {
  color: #10b981;
  font-weight: bold;
}

.command-time {
  font-size: 9px;
  color: #64748b;
  margin-top: 2px;
}

.status-indicators {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 8px;
}

.indicator {
  background: #0f172a;
  border: 1px solid #3b4a6f;
  border-radius: 4px;
  padding: 8px;
  text-align: center;
}

.indicator-label {
  font-size: 9px;
  color: #64748b;
  text-transform: uppercase;
  letter-spacing: 0.3px;
  margin-bottom: 4px;
}

.indicator-value {
  font-size: 11px;
  font-weight: bold;
  color: #94a3b8;
}

.indicator-value.is-connected {
  color: #10b981;
}

.action-heating {
  color: #f59e0b;
}

.action-cooling {
  color: #06b6d4;
}

.action-idle {
  color: #64748b;
}

.command-history {
  background: #0f172a;
  border: 1px solid #3b4a6f;
  border-radius: 6px;
  padding: 12px;
}

.history-title {
  font-size: 10px;
  color: #94a3b8;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  font-weight: bold;
  margin-bottom: 8px;
}

.history-list {
  display: flex;
  flex-direction: column;
  gap: 6px;
  max-height: 200px;
  overflow-y: auto;
}

.history-item {
  display: grid;
  grid-template-columns: 70px 1fr 80px;
  gap: 8px;
  padding: 6px;
  background: #1e293b;
  border-radius: 3px;
  border-left: 3px solid #3b4a6f;
  font-size: 10px;
}

.history-time {
  color: #64748b;
  font-weight: bold;
}

.history-cmd {
  color: #10b981;
}

.history-status {
  text-align: right;
  font-weight: bold;
  text-transform: uppercase;
}

.status-sent {
  color: #06b6d4;
}

.status-acked {
  color: #10b981;
}

.status-failed {
  color: #ef4444;
}

.helper-text {
  background: #0f172a;
  border: 1px dashed #3b4a6f;
  border-radius: 6px;
  padding: 12px;
  display: grid;
  grid-template-columns: 32px 1fr;
  gap: 12px;
}

.helper-icon {
  font-size: 20px;
  display: flex;
  align-items: flex-start;
  margin-top: 2px;
}

.helper-content {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.helper-title {
  font-size: 11px;
  font-weight: bold;
  color: #e0e7ff;
  text-transform: uppercase;
  letter-spacing: 0.3px;
}

.helper-content ul {
  list-style: none;
  margin: 0;
  padding: 0;
  font-size: 10px;
  color: #94a3b8;
  line-height: 1.4;
}

.helper-content li {
  margin-left: 12px;
}

.helper-content li:before {
  content: '›';
  margin-left: -8px;
  margin-right: 4px;
  color: #10b981;
  font-weight: bold;
}
</style>