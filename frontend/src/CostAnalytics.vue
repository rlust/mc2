<template>
  <div class="cost-analytics">
    <h2>💰 Cost Analytics</h2>

    <!-- Summary Cards -->
    <div class="summary-grid">
      <div class="summary-card">
        <div class="card-label">Today's Cost</div>
        <div class="card-value">${{ analytics.today?.totalCost.toFixed(2) || '0.00' }}</div>
        <div class="card-detail">{{ analytics.today?.agentCount || 0 }} agents</div>
      </div>

      <div class="summary-card">
        <div class="card-label">7-Day Average</div>
        <div class="card-value">${{ analytics.analytics?.avgCostPerDay.toFixed(2) || '0.00' }}/day</div>
        <div class="card-detail">{{ analytics.history?.length || 0 }} days tracked</div>
      </div>

      <div class="summary-card">
        <div class="card-label">Projected Monthly</div>
        <div class="card-value" :style="{ color: analytics.analytics?.budgetAlert ? '#ef4444' : '#10b981' }">
          ${{ analytics.analytics?.projectedMonthly.toFixed(2) || '0.00' }}
        </div>
        <div class="card-detail">Budget: ${{ analytics.analytics?.budgetThreshold || 100 }}/mo</div>
      </div>

      <div class="summary-card" :class="{ alert: analytics.analytics?.budgetAlert }">
        <div class="card-label">Status</div>
        <div class="card-value" :style="{ color: analytics.analytics?.budgetAlert ? '#ef4444' : '#10b981' }">
          {{ analytics.analytics?.budgetAlert ? '⚠️ ALERT' : '✓ OK' }}
        </div>
        <div class="card-detail" v-if="analytics.analytics?.budgetAlert">
          Over budget forecast
        </div>
        <div class="card-detail" v-else>
          Within budget
        </div>
      </div>
    </div>

    <!-- Budget Alert -->
    <div v-if="analytics.analytics?.budgetAlert" class="budget-alert">
      <strong>⚠️ Budget Alert:</strong> Your projected monthly spending (${{ analytics.analytics?.projectedMonthly.toFixed(2) }}) 
      exceeds your budget (${{ analytics.analytics?.budgetThreshold }}/mo)
    </div>

    <!-- Cost Chart (7-day trend) -->
    <div class="chart-section">
      <h3>7-Day Trend</h3>
      <div class="chart-container">
        <div class="simple-chart">
          <div v-for="(day, idx) in analytics.analytics?.last7Days" :key="idx" class="chart-bar">
            <div class="bar" :style="{ height: calculateBarHeight(day.cost) + '%' }"></div>
            <div class="bar-label">{{ formatDate(day.date) }}</div>
            <div class="bar-value">${{ day.cost.toFixed(2) }}</div>
          </div>
        </div>
      </div>
    </div>

    <!-- Per-Agent Breakdown -->
    <div v-if="Object.keys(analytics.agents || {}).length > 0" class="agents-breakdown">
      <h3>Per-Agent Costs (Today)</h3>
      <div class="agent-costs">
        <div v-for="(cost, agent) in analytics.agents" :key="agent" class="agent-cost-item">
          <div class="agent-header">
            <span class="agent-name">{{ agent }}</span>
            <span class="agent-type">{{ cost.type }}</span>
          </div>
          <div class="agent-details">
            <div class="detail">
              <span>Model:</span>
              <span class="value">{{ cost.model }}</span>
            </div>
            <div class="detail">
              <span>Tokens:</span>
              <span class="value">{{ (cost.inputTokens + cost.outputTokens).toLocaleString() }}</span>
            </div>
            <div class="detail">
              <span>Cost:</span>
              <span class="value cost">${{ cost.totalCost.toFixed(4) }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Token Efficiency -->
    <div class="efficiency-section">
      <h3>Token Efficiency</h3>
      <div class="efficiency-grid">
        <div class="efficiency-card">
          <div class="eff-label">Input Tokens (Today)</div>
          <div class="eff-value">{{ (analytics.today?.totalInputTokens || 0).toLocaleString() }}</div>
        </div>
        <div class="efficiency-card">
          <div class="eff-label">Output Tokens (Today)</div>
          <div class="eff-value">{{ (analytics.today?.totalOutputTokens || 0).toLocaleString() }}</div>
        </div>
        <div class="efficiency-card">
          <div class="eff-label">Cost per 1K Tokens</div>
          <div class="eff-value">${{ costPer1kTokens.toFixed(4) }}</div>
        </div>
      </div>
    </div>

    <!-- Daily Report Section -->
    <div class="daily-report-section">
      <h3>📊 Daily Report</h3>
      <p>Send today's cost summary to Discord (includes 7-day trend chart)</p>
      <button @click="sendDailyReport" class="btn-send-report" :disabled="sendingReport">
        {{ sendingReport ? '📤 Sending...' : '📤 Send Daily Report to Discord' }}
      </button>
      <small v-if="lastReportSent" class="report-status">
        ✅ Last sent: {{ lastReportSent }}
      </small>
    </div>

    <!-- Data Refresh -->
    <div class="footer">
      <small>Last updated: {{ lastUpdate }}</small>
      <button @click="refresh" class="btn-refresh-small">🔄 Refresh</button>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'

const analytics = ref({})
const lastUpdate = ref(new Date().toLocaleTimeString())
const sendingReport = ref(false)
const lastReportSent = ref(null)

const backendUrl = computed(() => {
  const proto = location.protocol
  const host = location.hostname
  const port = 3001
  return `${proto}//${host}:${port}`
})

const costPer1kTokens = computed(() => {
  const total = (analytics.value.today?.totalInputTokens || 0) + (analytics.value.today?.totalOutputTokens || 0)
  const cost = analytics.value.today?.totalCost || 0
  if (total === 0) return 0
  return (cost / total) * 1000
})

const fetchAnalytics = async () => {
  try {
    const resp = await fetch(`${backendUrl.value}/api/analytics`)
    const data = await resp.json()
    analytics.value = data
    lastUpdate.value = new Date().toLocaleTimeString()
  } catch (err) {
    console.error('Failed to fetch analytics:', err)
  }
}

const refresh = () => {
  fetchAnalytics()
}

const calculateBarHeight = (cost) => {
  const max = Math.max(...(analytics.value.analytics?.last7Days?.map(d => d.cost) || [1]))
  return max === 0 ? 0 : (cost / max) * 100
}

const formatDate = (dateStr) => {
  const date = new Date(dateStr)
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

const sendDailyReport = async () => {
  sendingReport.value = true
  try {
    const resp = await fetch(`${backendUrl.value}/api/analytics/report-to-discord`, {
      method: 'POST'
    })
    const data = await resp.json()
    
    if (data.success) {
      lastReportSent.value = new Date().toLocaleTimeString()
      alert('✅ Daily cost report sent to Discord!')
    } else {
      alert(`❌ Failed to send report: ${data.message}`)
    }
  } catch (err) {
    console.error('Failed to send report:', err)
    alert(`❌ Error: ${err.message}`)
  } finally {
    sendingReport.value = false
  }
}

// Initialize on mount
onMounted(() => {
  fetchAnalytics()
  // Poll every 10 seconds
  const interval = setInterval(fetchAnalytics, 10000)
  return () => clearInterval(interval)
})
</script>

<style scoped>
.cost-analytics {
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

.summary-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
  padding: 0 1rem 1rem 1rem;
}

.summary-card {
  background: #1a1f3a;
  border: 1px solid #3b4a6f;
  border-radius: 8px;
  padding: 1rem;
  text-align: center;
}

.summary-card.alert {
  border-color: #ef4444;
  background: rgba(239, 68, 68, 0.1);
}

.card-label {
  font-size: 0.75rem;
  color: #94a3b8;
  text-transform: uppercase;
  margin-bottom: 0.5rem;
}

.card-value {
  font-size: 1.8rem;
  font-weight: bold;
  color: #10b981;
  margin-bottom: 0.25rem;
}

.card-detail {
  font-size: 0.8rem;
  color: #64748b;
}

.budget-alert {
  background: rgba(239, 68, 68, 0.15);
  border: 1px solid #ef4444;
  color: #fca5a5;
  padding: 1rem;
  border-radius: 6px;
  margin: 0 1rem 1rem 1rem;
  font-size: 0.9rem;
}

.chart-section {
  padding: 0 1rem;
  margin-bottom: 1.5rem;
}

.chart-container {
  background: #1a1f3a;
  border: 1px solid #3b4a6f;
  border-radius: 8px;
  padding: 1rem;
}

.simple-chart {
  display: flex;
  align-items: flex-end;
  justify-content: space-around;
  height: 200px;
  gap: 0.5rem;
}

.chart-bar {
  display: flex;
  flex-direction: column;
  align-items: center;
  flex: 1;
  height: 100%;
}

.bar {
  width: 100%;
  background: linear-gradient(180deg, #10b981, #06b6d4);
  border-radius: 4px 4px 0 0;
  transition: all 0.2s;
  min-height: 4px;
}

.bar:hover {
  background: linear-gradient(180deg, #06b6d4, #10b981);
  opacity: 0.8;
}

.bar-label {
  font-size: 0.7rem;
  color: #94a3b8;
  margin-top: 0.5rem;
}

.bar-value {
  font-size: 0.75rem;
  color: #10b981;
  font-weight: bold;
}

.agents-breakdown {
  padding: 0 1rem;
  margin-bottom: 1.5rem;
}

.agent-costs {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  gap: 1rem;
}

.agent-cost-item {
  background: #1a1f3a;
  border: 1px solid #3b4a6f;
  border-left: 3px solid #10b981;
  border-radius: 6px;
  padding: 1rem;
}

.agent-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.75rem;
  border-bottom: 1px solid #3b4a6f;
  padding-bottom: 0.5rem;
}

.agent-name {
  font-weight: bold;
  color: #e0e7ff;
}

.agent-type {
  font-size: 0.7rem;
  background: #0f172a;
  padding: 0.25rem 0.5rem;
  border-radius: 3px;
  color: #94a3b8;
}

.agent-details {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  font-size: 0.85rem;
}

.detail {
  display: flex;
  justify-content: space-between;
}

.detail span:first-child {
  color: #94a3b8;
}

.detail .value {
  color: #e0e7ff;
  font-weight: bold;
}

.detail .value.cost {
  color: #10b981;
}

.efficiency-section {
  padding: 0 1rem;
  margin-bottom: 1.5rem;
}

.efficiency-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 1rem;
}

.efficiency-card {
  background: #1a1f3a;
  border: 1px solid #3b4a6f;
  border-radius: 6px;
  padding: 1rem;
  text-align: center;
}

.eff-label {
  font-size: 0.75rem;
  color: #94a3b8;
  text-transform: uppercase;
  margin-bottom: 0.5rem;
}

.eff-value {
  font-size: 1.5rem;
  font-weight: bold;
  color: #06b6d4;
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
  padding: 0.4rem 0.8rem;
  background: #3b4a6f;
  border: 1px solid #4f6095;
  border-radius: 3px;
  color: #e0e7ff;
  cursor: pointer;
  font-size: 0.8rem;
  transition: all 0.2s;
}

.btn-refresh-small:hover {
  background: #4f6095;
}

.daily-report-section {
  padding: 1rem;
  background: #1a1f3a;
  border: 1px solid #3b4a6f;
  border-radius: 6px;
  margin: 0 1rem 1rem 1rem;
}

.daily-report-section h3 {
  margin: 0 0 0.5rem 0;
  font-size: 0.95rem;
}

.daily-report-section p {
  margin: 0 0 1rem 0;
  font-size: 0.85rem;
  color: #94a3b8;
}

.btn-send-report {
  width: 100%;
  padding: 0.75rem;
  background: #10b981;
  border: none;
  border-radius: 4px;
  color: #0f1419;
  font-weight: bold;
  font-size: 0.9rem;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-send-report:hover:not(:disabled) {
  background: #059669;
  transform: scale(1.02);
}

.btn-send-report:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.report-status {
  display: block;
  margin-top: 0.75rem;
  color: #10b981;
  font-size: 0.75rem;
}
</style>
