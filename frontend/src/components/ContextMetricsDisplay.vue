<template>
  <div class="context-metrics">
    <div v-if="!metrics" class="empty-state">
      <div class="empty-icon">📊</div>
      <div class="empty-text">No metrics yet</div>
      <div class="empty-help">Run an agent to collect context metrics</div>
    </div>

    <div v-else class="metrics-content">
      <!-- Compaction Timeline -->
      <div class="metrics-section">
        <div class="section-title">Compaction Timeline</div>
        <div class="compaction-timeline">
          <div
            v-for="(state, idx) in compactionStates"
            :key="idx"
            class="timeline-point"
            :class="`state-${state.name}`"
          >
            <div class="point-dot"></div>
            <div class="point-label">{{ state.label }}</div>
          </div>
        </div>
      </div>

      <!-- Metrics Grid -->
      <div class="metrics-grid">
        <div class="metric-card">
          <div class="metric-title">Context Budget</div>
          <div class="metric-value">
            {{ metrics.contextTokens || 'N/A' }}
          </div>
          <div class="metric-unit">tokens</div>
        </div>

        <div class="metric-card">
          <div class="metric-title">Usage %</div>
          <div class="metric-value">
            {{ (metrics.contextUsage * 100).toFixed(1) }}%
          </div>
          <div class="metric-unit">of available</div>
        </div>

        <div class="metric-card">
          <div class="metric-title">Compacted</div>
          <div class="metric-value">
            {{ metrics.tokensRecovered || 0 }}
          </div>
          <div class="metric-unit">tokens</div>
        </div>

        <div class="metric-card">
          <div class="metric-title">Last Compaction</div>
          <div class="metric-value">
            {{ lastCompactionTime }}
          </div>
          <div class="metric-unit">ago</div>
        </div>
      </div>

      <!-- Current State -->
      <div class="current-state">
        <div class="state-label">Current State:</div>
        <div class="state-badge" :class="`state-${metrics.compactionState}`">
          {{ formatState(metrics.compactionState) }}
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

interface ContextMetrics {
  contextTokens?: number
  contextUsage: number
  compactionState?: string
  tokensRecovered?: number
  lastCompaction?: number
}

const props = defineProps<{
  metrics: ContextMetrics | null
}>()

const compactionStates = [
  { name: 'bootstrap', label: '🔨 Bootstrap' },
  { name: 'ingest', label: '📥 Ingest' },
  { name: 'assemble', label: '🔧 Assemble' },
  { name: 'compact', label: '📦 Compact' },
  { name: 'afterTurn', label: '✓ After Turn' },
]

const lastCompactionTime = computed(() => {
  if (!props.metrics?.lastCompaction) return 'Never'
  const diff = Date.now() - props.metrics.lastCompaction
  if (diff < 1000) return 'just now'
  if (diff < 60000) return `${Math.floor(diff / 1000)}s ago`
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`
  return `${Math.floor(diff / 3600000)}h ago`
})

const formatState = (state: string | undefined) => {
  if (!state) return 'idle'
  return state.replace(/([A-Z])/g, ' $1').trim()
}
</script>

<style scoped>
.context-metrics {
  min-height: 200px;
}

.empty-state {
  text-align: center;
  padding: 40px 20px;
  color: #94a3b8;
}

.empty-icon {
  font-size: 32px;
  margin-bottom: 12px;
  opacity: 0.5;
}

.empty-text {
  font-size: 14px;
  font-weight: bold;
  margin-bottom: 6px;
}

.empty-help {
  font-size: 11px;
  color: #64748b;
}

.metrics-content {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.metrics-section {
  background: #0f172a;
  border: 1px solid #3b4a6f;
  border-radius: 4px;
  padding: 12px;
}

.section-title {
  font-size: 11px;
  color: #94a3b8;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-bottom: 12px;
  font-weight: bold;
}

.compaction-timeline {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 4px;
}

.timeline-point {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
}

.point-dot {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background: #3b4a6f;
  border: 2px solid #1e293b;
  transition: all 0.2s;
}

.timeline-point.state-bootstrap .point-dot {
  background: #f59e0b;
  box-shadow: 0 0 8px #f59e0b;
}

.timeline-point.state-ingest .point-dot {
  background: #06b6d4;
  box-shadow: 0 0 8px #06b6d4;
}

.timeline-point.state-compact .point-dot {
  background: #ef4444;
  box-shadow: 0 0 8px #ef4444;
}

.timeline-point.state-afterTurn .point-dot {
  background: #10b981;
  box-shadow: 0 0 8px #10b981;
}

.point-label {
  font-size: 9px;
  color: #64748b;
  text-align: center;
  word-break: break-word;
}

.metrics-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
  gap: 12px;
}

.metric-card {
  background: #0f172a;
  border: 1px solid #3b4a6f;
  border-radius: 4px;
  padding: 12px;
  text-align: center;
}

.metric-title {
  font-size: 10px;
  color: #94a3b8;
  text-transform: uppercase;
  letter-spacing: 0.3px;
  margin-bottom: 8px;
}

.metric-value {
  font-size: 18px;
  font-weight: bold;
  color: #10b981;
  margin-bottom: 4px;
}

.metric-unit {
  font-size: 9px;
  color: #64748b;
}

.current-state {
  background: #0f172a;
  border: 1px solid #3b4a6f;
  border-radius: 4px;
  padding: 12px;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.state-label {
  font-size: 11px;
  color: #94a3b8;
  text-transform: uppercase;
  letter-spacing: 0.3px;
  font-weight: bold;
}

.state-badge {
  padding: 6px 12px;
  border-radius: 3px;
  font-size: 11px;
  font-weight: bold;
  text-transform: uppercase;
  background: #1e293b;
  color: #94a3b8;
}

.state-bootstrap {
  background: #78350f;
  color: #fbbf24;
}

.state-ingest {
  background: #0c4a6e;
  color: #22d3ee;
}

.state-compact {
  background: #7f1d1d;
  color: #fca5a5;
}

.state-idle {
  background: #064e3b;
  color: #6ee7b7;
}
</style>
