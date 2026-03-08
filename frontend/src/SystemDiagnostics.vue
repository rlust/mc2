<template>
  <div class="diagnostics-panel">
    <!-- Header -->
    <div class="diag-header">
      <h1>🔧 System Diagnostics & Repair</h1>
      <button @click="runFullDiagnostics" class="btn-diagnose">
        🏥 Run Full Diagnostic
      </button>
    </div>

    <!-- Diagnostic Tabs -->
    <div class="diag-tabs">
      <button
        v-for="tab in diagTabs"
        :key="tab"
        @click="activeDiagTab = tab"
        class="diag-tab-btn"
        :class="{ active: activeDiagTab === tab }"
      >
        {{ tab }}
      </button>
    </div>

    <div class="diag-content">
      <!-- System Health -->
      <div v-if="activeDiagTab === 'System'" class="system-panel">
        <h2>💻 System Health</h2>
        
        <div class="health-grid">
          <div class="health-card">
            <div class="health-title">Mac Mini</div>
            <div class="metrics">
              <div class="metric-row">
                <span>CPU</span>
                <div class="metric-bar">
                  <div class="bar" :style="{ width: macStats.cpu + '%' }"></div>
                </div>
                <span>{{ macStats.cpu }}%</span>
              </div>
              <div class="metric-row">
                <span>Memory</span>
                <div class="metric-bar">
                  <div class="bar" :style="{ width: macStats.memory + '%' }"></div>
                </div>
                <span>{{ macStats.memory }}%</span>
              </div>
              <div class="metric-row">
                <span>Disk</span>
                <div class="metric-bar">
                  <div class="bar" :style="{ width: macStats.disk + '%' }"></div>
                </div>
                <span>{{ macStats.disk }}%</span>
              </div>
            </div>
            <div class="health-status" :class="macStats.status">{{ macStats.status }}</div>
          </div>

          <div class="health-card">
            <div class="health-title">Hetzner VPS</div>
            <div class="metrics">
              <div class="metric-row">
                <span>CPU</span>
                <div class="metric-bar">
                  <div class="bar" :style="{ width: vpsStats.cpu + '%' }"></div>
                </div>
                <span>{{ vpsStats.cpu }}%</span>
              </div>
              <div class="metric-row">
                <span>Memory</span>
                <div class="metric-bar">
                  <div class="bar" :style="{ width: vpsStats.memory + '%' }"></div>
                </div>
                <span>{{ vpsStats.memory }}%</span>
              </div>
              <div class="metric-row">
                <span>Disk</span>
                <div class="metric-bar">
                  <div class="bar" :style="{ width: vpsStats.disk + '%' }"></div>
                </div>
                <span>{{ vpsStats.disk }}%</span>
              </div>
            </div>
            <div class="health-status" :class="vpsStats.status">{{ vpsStats.status }}</div>
          </div>
        </div>

        <div class="info-box">
          <strong>⚠️ Warning:</strong> Use <code>top</code>, <code>free -h</code>, <code>df -h</code> commands for real-time stats
        </div>
      </div>

      <!-- Services Status -->
      <div v-if="activeDiagTab === 'Services'" class="services-panel">
        <h2>🚀 Running Services</h2>

        <div class="service-config">
          <div class="config-row">
            <label class="config-label">Aspire Home Assistant Host/IP</label>
            <input
              v-model="aspireHaHost"
              class="config-input"
              placeholder="e.g. 192.168.1.50 (only reachable when RV network/VPN is up)"
            />
            <button @click="saveServiceConfig" class="btn-small">Save</button>
          </div>
          <div class="config-hint">
            Tip: If the RV is offline (no Wi‑Fi/VPN), Aspire will correctly show as OFFLINE.
          </div>
        </div>
        
        <div class="services-list">
          <div v-for="service in services" :key="service.name" class="service-card" :class="service.status">
            <div class="service-header">
              <span class="service-name">{{ service.icon }} {{ service.name }}</span>
              <span class="service-status-badge">{{ service.status }}</span>
            </div>
            <div class="service-info">
              <small>{{ service.description }}</small>
              <div class="service-port" v-if="service.port">Port: {{ service.port }}</div>
            </div>
            <div class="service-actions">
              <button @click="restartService(service)" class="btn-small">🔄 Restart</button>
              <button @click="viewLogs(service)" class="btn-small">📋 Logs</button>
              <button @click="checkStatus(service)" class="btn-small">✓ Check</button>
            </div>
          </div>
        </div>
      </div>

      <!-- Gateway & API Health -->
      <div v-if="activeDiagTab === 'APIs'" class="api-panel">
        <h2>🔗 API & Connectivity</h2>
        
        <div class="api-grid">
          <div v-for="api in apis" :key="api.name" class="api-card" :class="api.status">
            <div class="api-header">
              <span>{{ api.name }}</span>
              <span class="api-status">{{ api.status }}</span>
            </div>
            <div class="api-endpoint">
              <small>{{ api.endpoint }}</small>
            </div>
            <div class="api-actions">
              <button @click="testAPI(api.name)" class="btn-tiny">Test</button>
              <button @click="viewDocs(api.name)" class="btn-tiny">Docs</button>
            </div>
          </div>
        </div>
      </div>

      <!-- Error Log & Fixes -->
      <div v-if="activeDiagTab === 'Errors'" class="errors-panel">
        <h2>🚨 Recent Errors & Fixes</h2>
        
        <div class="errors-list">
          <div v-for="(error, idx) in commonErrors" :key="idx" class="error-card">
            <div class="error-header">
              <span class="error-type">{{ error.type }}</span>
              <span class="error-time">{{ error.time }}</span>
            </div>
            <div class="error-message">{{ error.message }}</div>
            <div class="error-fix">
              <strong>Fix:</strong>
              <code>{{ error.fix }}</code>
            </div>
            <button @click="copyToClipboard(error.fix)" class="btn-copy">📋 Copy Command</button>
          </div>
        </div>
      </div>

      <!-- Networking & Connectivity -->
      <div v-if="activeDiagTab === 'Network'" class="network-panel">
        <h2>🌐 Network & Connectivity</h2>
        
        <div class="network-grid">
          <div class="network-card">
            <h3>Tailscale</h3>
            <div class="network-info">
              <div class="info-row">
                <span>Status</span>
                <span class="connected">● Connected</span>
              </div>
              <div class="info-row">
                <span>IP Address</span>
                <span>100.78.223.120</span>
              </div>
              <div class="info-row">
                <span>Connected Devices</span>
                <span>3</span>
              </div>
            </div>
            <button @click="openCommand('tailscale status')" class="btn-small">Check Status</button>
          </div>

          <div class="network-card">
            <h3>OpenClaw Gateway</h3>
            <div class="network-info">
              <div class="info-row">
                <span>Status</span>
                <span class="connected">● Running</span>
              </div>
              <div class="info-row">
                <span>Port</span>
                <span>18789</span>
              </div>
              <div class="info-row">
                <span>Uptime</span>
                <span>42 hours</span>
              </div>
            </div>
            <button @click="openCommand('openclaw gateway status')" class="btn-small">Check Status</button>
          </div>

          <div class="network-card">
            <h3>DNS Resolution</h3>
            <div class="network-info">
              <div class="info-row">
                <span>rlust.com</span>
                <span class="ok">✓ Resolves</span>
              </div>
              <div class="info-row">
                <span>IP: 5.161.111.192</span>
              </div>
            </div>
            <button @click="testDNS('rlust.com')" class="btn-small">Test DNS</button>
          </div>
        </div>
      </div>

      <!-- Cron Jobs & Scheduled Tasks -->
      <div v-if="activeDiagTab === 'Cron'" class="cron-panel">
        <h2>⏰ Scheduled Tasks</h2>
        
        <div class="cron-list">
          <div v-for="job in cronJobs" :key="job.name" class="cron-card">
            <div class="cron-header">
              <span class="job-name">{{ job.icon }} {{ job.name }}</span>
              <span class="job-status" :class="job.status">{{ job.status }}</span>
            </div>
            <div class="cron-info">
              <div><small>Schedule:</small> {{ job.schedule }}</div>
              <div><small>Last Run:</small> {{ job.lastRun }}</div>
              <div><small>Next Run:</small> {{ job.nextRun }}</div>
            </div>
            <button @click="runJob(job.name)" class="btn-small">▶ Run Now</button>
          </div>
        </div>
      </div>

      <!-- Quick Fixes -->
      <div v-if="activeDiagTab === 'Fixes'" class="fixes-panel">
        <h2>🔨 Quick Fixes</h2>
        
        <div class="fixes-grid">
          <div v-for="fix in quickFixes" :key="fix.name" class="fix-card">
            <h3>{{ fix.icon }} {{ fix.name }}</h3>
            <p>{{ fix.description }}</p>
            <div class="fix-steps">
              <ol>
                <li v-for="(step, idx) in fix.steps" :key="idx">{{ step }}</li>
              </ol>
            </div>
            <button @click="applyFix(fix.name)" class="btn-primary">Apply Fix</button>
          </div>
        </div>
      </div>

      <!-- Documentation & Resources -->
      <div v-if="activeDiagTab === 'Docs'" class="docs-panel">
        <h2>📚 Documentation & Resources</h2>
        
        <div class="docs-grid">
          <div v-for="doc in documentation" :key="doc.title" class="doc-card">
            <h3>{{ doc.icon }} {{ doc.title }}</h3>
            <p>{{ doc.description }}</p>
            <a :href="doc.url" target="_blank" class="btn-link">Read →</a>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'

// Active tab
const activeDiagTab = ref('System')
const diagTabs = ['System', 'Services', 'APIs', 'Errors', 'Network', 'Cron', 'Fixes', 'Docs']

// System stats (simulated)
const macStats = ref({
  cpu: 35,
  memory: 62,
  disk: 78,
  status: 'healthy'
})

const vpsStats = ref({
  cpu: 12,
  memory: 45,
  disk: 32,
  status: 'healthy'
})

// Backend base URL (same machine as the Vite server)
const backendBase = `${location.protocol}//${location.hostname}:3001`

// Service config (stored in browser)
const aspireHaHost = ref(localStorage.getItem('mc2.aspireHaHost') || '')

const saveServiceConfig = () => {
  localStorage.setItem('mc2.aspireHaHost', aspireHaHost.value.trim())
}

// Running services
const services = ref([
  { key: 'gateway', name: 'OpenClaw Gateway', icon: '🔴', description: 'Core gateway service', host: '127.0.0.1', port: 18789, status: 'running' },
  { key: 'mission-control', name: 'Mission Control', icon: '🎯', description: 'Dashboard & monitoring', host: location.hostname, port: 5173, status: 'running' },
  { key: 'lobsterboard', name: 'LobsterBoard', icon: '🦞', description: 'Customizable dashboard', host: location.hostname, port: 8080, status: 'running' },
  { key: 'piwigo', name: 'Piwigo', icon: '📸', description: 'Photo gallery', host: location.hostname, port: 8080, status: 'running' },
  { key: 'ha-newark', name: 'Home Assistant (Newark)', icon: '🏠', description: 'Smart home automation', host: '127.0.0.1', port: 8123, status: 'running' },
  { key: 'ha-aspire', name: 'Home Assistant (Aspire)', icon: '🚐', description: 'RV automation', host: '', port: 8123, status: aspireHaHost.value ? 'offline' : 'unknown' }
])

onMounted(() => {
  const aspire = services.value.find(s => s.key === 'ha-aspire')
  if (aspire && aspireHaHost.value.trim()) {
    aspire.host = aspireHaHost.value.trim()
  }
})

// API endpoints
const apis = ref([
  { name: 'OpenClaw Gateway', endpoint: 'http://localhost:18789', status: 'online' },
  { name: 'Home Assistant (Newark)', endpoint: 'Nabu Casa remote', status: 'online' },
  { name: 'Discord API', endpoint: 'api.discord.com', status: 'online' },
  { name: 'Telegram API', endpoint: 'api.telegram.org', status: 'online' },
  { name: 'Home Assistant (Aspire)', endpoint: 'Local network', status: 'offline' }
])

// Common errors & fixes
const commonErrors = ref([
  {
    type: 'Gateway Connection Refused',
    time: '2 hours ago',
    message: 'Cannot connect to OpenClaw gateway on port 18789',
    fix: 'openclaw gateway restart'
  },
  {
    type: 'Home Assistant Timeout',
    time: 'Yesterday',
    message: 'Newark HA requests timing out',
    fix: 'curl https://newark-ha.nabu.casa/api/ -H "Authorization: Bearer TOKEN"'
  },
  {
    type: 'Disk Space Low',
    time: '3 days ago',
    message: 'Mac Mini disk is 78% full',
    fix: 'du -sh ~/* | sort -h'
  }
])

// Cron jobs
const cronJobs = ref([
  { name: 'Daily Investment Report', icon: '📈', schedule: '4 PM ET daily', status: 'active', lastRun: 'Today 4:00 PM', nextRun: 'Tomorrow 4:00 PM' },
  { name: 'Hourly Lust Rentals Check', icon: '💼', schedule: 'Every hour', status: 'active', lastRun: '5 min ago', nextRun: '55 min' },
  { name: 'Piwigo Backup', icon: '💾', schedule: 'Weekly (Sundays)', status: 'active', lastRun: 'Last Sunday', nextRun: 'Next Sunday' },
  { name: 'Newark HA Snapshot', icon: '📸', schedule: 'Every 6 hours', status: 'paused', lastRun: '2 days ago', nextRun: 'Paused' }
])

// Quick fixes
const quickFixes = ref([
  {
    name: 'Restart OpenClaw',
    icon: '🔴',
    description: 'Restart the OpenClaw gateway if it\'s hung or unresponsive',
    steps: [
      'openclaw gateway stop',
      'Wait 5 seconds',
      'openclaw gateway start',
      'Verify: openclaw gateway status'
    ]
  },
  {
    name: 'Clear Node Modules Cache',
    icon: '🧹',
    description: 'Fix npm dependency issues when packages fail to install',
    steps: [
      'rm -rf node_modules package-lock.json',
      'npm cache clean --force',
      'npm install',
      'npm start'
    ]
  },
  {
    name: 'Reset Home Assistant Connection',
    icon: '🏠',
    description: 'Reconnect to Home Assistant if APIs are timing out',
    steps: [
      'Check HA is online: curl https://newark-ha.nabu.casa/api/',
      'Regenerate long-lived token in HA settings',
      'Update ~/.openclaw/.credentials with new token',
      'Restart gateway: openclaw gateway restart'
    ]
  },
  {
    name: 'Fix Disk Space Issues',
    icon: '💾',
    description: 'Free up space on Mac Mini when disk is full',
    steps: [
      'Check usage: df -h',
      'Find large files: du -sh ~/* | sort -h',
      'Clean cache: rm -rf ~/.cache/*',
      'Clean npm: npm cache clean --force',
      'Delete old logs: rm -rf ~/.openclaw/logs/archive/*'
    ]
  }
])

// Documentation
const documentation = ref([
  {
    title: 'OpenClaw Setup',
    icon: '📖',
    description: 'Complete guide to installing and configuring OpenClaw',
    url: 'https://docs.openclaw.ai'
  },
  {
    title: 'Control-UI Guide',
    icon: '🔴',
    description: 'Real-time monitoring dashboard documentation',
    url: '/docs/CONTROL_UI_DEPLOYMENT_REPORT.md',
    local: true
  },
  {
    title: 'Home Assistant Automation',
    icon: '🏠',
    description: 'Creating automations and scripts in Home Assistant',
    url: 'https://www.home-assistant.io/docs/automation/'
  },
  {
    title: 'RV-C HVAC Integration',
    icon: '🌡️',
    description: 'Controlling RV thermostat via RV-C bus',
    url: '/docs/RVC_HVAC_INTEGRATION_GUIDE.md',
    local: true
  },
  {
    title: 'RV-C HVAC Quick Start',
    icon: '⚡',
    description: '10-minute quick start guide for HVAC control',
    url: '/docs/RVC_HVAC_QUICK_START.md',
    local: true
  }
])

// Methods
const runFullDiagnostics = () => {
  alert('Running full system diagnostic...\n\nThis would:\n✓ Check all services\n✓ Test all APIs\n✓ Verify connectivity\n✓ Generate report')
}

const restartService = (service) => {
  // For now we keep this as a guided action (safer), not an automatic restart.
  // Aspire HA is often offline because the RV network isn’t reachable.
  const name = service?.name || 'service'
  alert(
    `Restart: ${name}\n\n` +
      `Suggested actions:\n` +
      `• If this is OpenClaw: run \'openclaw gateway restart\'\n` +
      `• If this is Mission Control: restart the dev server (npm run dev)\n` +
      `• If this is Home Assistant (Aspire): the RV must be online/reachable first\n`
  )
}

const viewLogs = (service) => {
  const name = service?.name || 'service'
  alert(
    `Logs: ${name}\n\n` +
      `OpenClaw logs: ~/.openclaw/logs/\n` +
      `Mission Control logs: ~/mission-control/logs/\n`
  )
}

const checkStatus = async (service) => {
  if (!service) return

  // Determine host to check
  let host = service.host
  if (service.key === 'ha-aspire') {
    host = aspireHaHost.value.trim()
    if (!host) {
      service.status = 'unknown'
      alert('Set Aspire Home Assistant Host/IP first (Services tab → Aspire Host/IP → Save).')
      return
    }
    // keep service.host updated so UI reflects it
    service.host = host
  }

  service.status = 'checking'

  try {
    const url = `${backendBase}/api/tcp-check?host=${encodeURIComponent(host)}&port=${encodeURIComponent(
      service.port
    )}&timeoutMs=1500`

    const resp = await fetch(url)
    const data = await resp.json()

    service.status = data.ok ? 'running' : 'offline'

    if (!data.ok) {
      alert(
        `${service.name} is not reachable at ${host}:${service.port}.\n\n` +
          `Reason: ${data.error || 'unknown'}\n\n` +
          `If this is Aspire: RV likely offline / not on VPN.\n` +
          `If you *are* on the RV network, confirm the HA IP/port and try again.`
      )
    }
  } catch (err) {
    service.status = 'offline'
    alert(`Check failed: ${err?.message || err}`)
  }
}

const testAPI = (apiName) => {
  alert(`Testing ${apiName}...\n\nUse curl or Postman to test endpoint connectivity`)
}

const viewDocs = (docUrl) => {
  if (docUrl.startsWith('http')) {
    // External URLs - open in new tab
    window.open(docUrl, '_blank')
  } else {
    // Local docs - open in new tab with proper path
    window.open(docUrl, '_blank')
  }
}

const testDNS = (domain) => {
  alert(`Testing DNS for ${domain}...\n\nUse: nslookup ${domain}`)
}

const runJob = (jobName) => {
  alert(`Running ${jobName} now...\n\nUse: openclaw cron run <job-id>`)
}

const applyFix = (fixName) => {
  alert(`Applying fix: ${fixName}\n\nFollow the steps carefully.`)
}

const openCommand = (command) => {
  alert(`Command to run:\n\n${command}`)
}

const copyToClipboard = (text) => {
  navigator.clipboard.writeText(text)
  alert('Copied to clipboard!')
}
</script>

<style scoped>
.diagnostics-panel {
  background: #0f1419;
  color: #e0e7ff;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Monaco, sans-serif;
  display: flex;
  flex-direction: column;
  height: 100vh;
  overflow: hidden;
}

.diag-header {
  background: linear-gradient(135deg, #1a1f3a 0%, #2a2f4a 100%);
  padding: 1rem;
  border-bottom: 2px solid #f59e0b;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.diag-header h1 {
  font-size: 1.5rem;
  color: #f59e0b;
  margin: 0;
}

.btn-diagnose {
  padding: 0.5rem 1rem;
  background: #f59e0b;
  color: #0f1419;
  border: none;
  border-radius: 4px;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-diagnose:hover {
  background: #d97706;
  transform: scale(1.05);
}

.diag-tabs {
  display: flex;
  background: #1a1f3a;
  border-bottom: 1px solid #3b4a6f;
  overflow-x: auto;
  padding: 0 1rem;
}

.diag-tab-btn {
  padding: 0.75rem 1rem;
  background: none;
  border: none;
  color: #94a3b8;
  cursor: pointer;
  font-weight: bold;
  font-size: 0.85rem;
  border-bottom: 3px solid transparent;
  transition: all 0.2s;
  white-space: nowrap;
}

.diag-tab-btn:hover {
  color: #e0e7ff;
}

.diag-tab-btn.active {
  color: #f59e0b;
  border-bottom-color: #f59e0b;
}

.diag-content {
  flex: 1;
  overflow-y: auto;
  padding: 1.5rem;
}

h2 {
  margin-bottom: 1.5rem;
  color: #f59e0b;
}

.health-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 1.5rem;
  margin-bottom: 2rem;
}

.health-card {
  background: #1a1f3a;
  border: 1px solid #3b4a6f;
  border-radius: 8px;
  padding: 1.5rem;
}

.health-title {
  font-size: 1.1rem;
  font-weight: bold;
  margin-bottom: 1rem;
  color: #e0e7ff;
}

.metrics {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  margin-bottom: 1rem;
}

.metric-row {
  display: grid;
  grid-template-columns: 70px 1fr 50px;
  gap: 0.75rem;
  align-items: center;
  font-size: 0.9rem;
}

.metric-row span:first-child {
  color: #94a3b8;
}

.metric-bar {
  height: 6px;
  background: #0f172a;
  border-radius: 3px;
  overflow: hidden;
}

.bar {
  height: 100%;
  background: linear-gradient(90deg, #10b981, #06b6d4);
  transition: width 0.3s;
}

.metric-row span:last-child {
  text-align: right;
  color: #10b981;
  font-weight: bold;
}

.health-status {
  padding: 0.5rem;
  border-radius: 4px;
  text-align: center;
  font-weight: bold;
  font-size: 0.9rem;
}

.health-status.healthy {
  background: #064e3b;
  color: #10b981;
}

.health-status.warning {
  background: #78350f;
  color: #fbbf24;
}

.health-status.error {
  background: #7f1d1d;
  color: #fca5a5;
}

.service-config {
  background: #1a1f3a;
  border: 1px solid #3b4a6f;
  border-radius: 8px;
  padding: 1rem;
  margin-bottom: 1rem;
}

.config-row {
  display: grid;
  grid-template-columns: 220px 1fr 80px;
  gap: 0.75rem;
  align-items: center;
}

.config-label {
  font-size: 0.85rem;
  color: #94a3b8;
  font-weight: bold;
}

.config-input {
  width: 100%;
  padding: 0.5rem 0.75rem;
  background: #0f172a;
  border: 1px solid #3b4a6f;
  border-radius: 4px;
  color: #e0e7ff;
}

.config-input:focus {
  outline: none;
  border-color: #10b981;
  box-shadow: 0 0 8px rgba(16, 185, 129, 0.15);
}

.config-hint {
  margin-top: 0.5rem;
  color: #64748b;
  font-size: 0.8rem;
}

.services-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.service-card {
  background: #1a1f3a;
  border-left: 4px solid #3b4a6f;
  border-radius: 4px;
  padding: 1rem;
}

.service-card.running {
  border-left-color: #10b981;
}

.service-card.offline {
  border-left-color: #ef4444;
  opacity: 0.7;
}

.service-card.unknown {
  border-left-color: #64748b;
}

.service-card.checking {
  border-left-color: #f59e0b;
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

.service-status-badge {
  padding: 0.25rem 0.5rem;
  border-radius: 3px;
  font-size: 0.75rem;
  text-transform: uppercase;
  font-weight: bold;
}

.service-card.running .service-status-badge {
  background: #064e3b;
  color: #10b981;
}

.service-card.offline .service-status-badge {
  background: #7f1d1d;
  color: #fca5a5;
}

.service-card.unknown .service-status-badge {
  background: #334155;
  color: #cbd5e1;
}

.service-card.checking .service-status-badge {
  background: #78350f;
  color: #fbbf24;
}

.service-info {
  font-size: 0.85rem;
  color: #94a3b8;
  margin-bottom: 0.75rem;
}

.service-port {
  margin-top: 0.25rem;
}

.service-actions {
  display: flex;
  gap: 0.5rem;
}

.btn-small {
  padding: 0.4rem 0.8rem;
  background: #3b4a6f;
  border: 1px solid #4f6095;
  border-radius: 3px;
  color: #e0e7ff;
  font-size: 0.75rem;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-small:hover {
  background: #4f6095;
}

.api-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1rem;
}

.api-card {
  background: #1a1f3a;
  border: 1px solid #3b4a6f;
  border-radius: 8px;
  padding: 1rem;
}

.api-card.online {
  border-left: 4px solid #10b981;
}

.api-card.offline {
  border-left: 4px solid #ef4444;
}

.api-header {
  display: flex;
  justify-content: space-between;
  margin-bottom: 0.5rem;
  font-weight: bold;
}

.api-status {
  font-size: 0.8rem;
  padding: 0.25rem 0.5rem;
  border-radius: 3px;
}

.api-card.online .api-status {
  background: #064e3b;
  color: #10b981;
}

.api-card.offline .api-status {
  background: #7f1d1d;
  color: #fca5a5;
}

.api-endpoint {
  color: #94a3b8;
  margin-bottom: 0.75rem;
}

.api-actions {
  display: flex;
  gap: 0.5rem;
}

.btn-tiny {
  padding: 0.3rem 0.6rem;
  background: #3b4a6f;
  border: 1px solid #4f6095;
  border-radius: 3px;
  color: #e0e7ff;
  font-size: 0.7rem;
  cursor: pointer;
}

.errors-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.error-card {
  background: #1a1f3a;
  border-left: 4px solid #ef4444;
  border-radius: 4px;
  padding: 1rem;
}

.error-header {
  display: flex;
  justify-content: space-between;
  margin-bottom: 0.5rem;
}

.error-type {
  font-weight: bold;
  color: #ef4444;
}

.error-time {
  font-size: 0.8rem;
  color: #94a3b8;
}

.error-message {
  color: #cbd5e1;
  margin-bottom: 0.75rem;
}

.error-fix {
  background: #0f172a;
  padding: 0.75rem;
  border-radius: 3px;
  margin-bottom: 0.75rem;
  font-size: 0.85rem;
}

.error-fix code {
  background: #1a1f3a;
  padding: 0.25rem 0.5rem;
  border-radius: 2px;
  color: #10b981;
  font-family: 'Monaco', monospace;
}

.btn-copy {
  padding: 0.4rem 0.8rem;
  background: #3b4a6f;
  border: 1px solid #4f6095;
  border-radius: 3px;
  color: #e0e7ff;
  font-size: 0.75rem;
  cursor: pointer;
}

.network-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 1.5rem;
  margin-bottom: 2rem;
}

.network-card {
  background: #1a1f3a;
  border: 1px solid #3b4a6f;
  border-radius: 8px;
  padding: 1.5rem;
}

.network-card h3 {
  margin-bottom: 1rem;
  color: #e0e7ff;
}

.network-info {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  margin-bottom: 1rem;
}

.info-row {
  display: flex;
  justify-content: space-between;
  font-size: 0.9rem;
}

.info-row span:first-child {
  color: #94a3b8;
}

.connected {
  color: #10b981;
  font-weight: bold;
}

.ok {
  color: #10b981;
}

.cron-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.cron-card {
  background: #1a1f3a;
  border-left: 4px solid #3b4a6f;
  border-radius: 4px;
  padding: 1rem;
}

.cron-card.active {
  border-left-color: #10b981;
}

.cron-header {
  display: flex;
  justify-content: space-between;
  margin-bottom: 0.75rem;
}

.job-name {
  font-weight: bold;
  color: #e0e7ff;
}

.job-status {
  padding: 0.25rem 0.5rem;
  border-radius: 3px;
  font-size: 0.75rem;
  text-transform: uppercase;
}

.job-status.active {
  background: #064e3b;
  color: #10b981;
}

.job-status.paused {
  background: #78350f;
  color: #fbbf24;
}

.cron-info {
  font-size: 0.85rem;
  color: #94a3b8;
  margin-bottom: 0.75rem;
}

.fixes-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 1.5rem;
}

.fix-card {
  background: #1a1f3a;
  border: 1px solid #3b4a6f;
  border-radius: 8px;
  padding: 1.5rem;
}

.fix-card h3 {
  margin-bottom: 0.5rem;
  color: #e0e7ff;
}

.fix-card p {
  color: #94a3b8;
  margin-bottom: 1rem;
  font-size: 0.9rem;
}

.fix-steps {
  background: #0f172a;
  padding: 1rem;
  border-radius: 4px;
  margin-bottom: 1rem;
}

.fix-steps ol {
  margin: 0;
  padding-left: 1.5rem;
}

.fix-steps li {
  color: #cbd5e1;
  margin-bottom: 0.5rem;
  font-size: 0.85rem;
}

.btn-primary {
  width: 100%;
  padding: 0.75rem;
  background: #f59e0b;
  border: none;
  border-radius: 4px;
  color: #0f1419;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-primary:hover {
  background: #d97706;
}

.docs-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 1.5rem;
}

.doc-card {
  background: #1a1f3a;
  border: 1px solid #3b4a6f;
  border-radius: 8px;
  padding: 1.5rem;
}

.doc-card h3 {
  margin-bottom: 0.5rem;
  color: #e0e7ff;
}

.doc-card p {
  color: #94a3b8;
  margin-bottom: 1rem;
  font-size: 0.9rem;
}

.btn-link {
  display: inline-block;
  padding: 0.5rem 1rem;
  background: #3b4a6f;
  border: 1px solid #4f6095;
  border-radius: 4px;
  color: #e0e7ff;
  text-decoration: none;
  cursor: pointer;
  transition: all 0.2s;
  font-size: 0.9rem;
}

.btn-link:hover {
  background: #4f6095;
  color: #f59e0b;
}

.info-box {
  background: #1a1f3a;
  border-left: 4px solid #f59e0b;
  border-radius: 4px;
  padding: 1rem;
  color: #cbd5e1;
  font-size: 0.9rem;
}

.info-box code {
  background: #0f172a;
  padding: 0.25rem 0.5rem;
  border-radius: 2px;
  color: #10b981;
  font-family: 'Monaco', monospace;
}
</style>
