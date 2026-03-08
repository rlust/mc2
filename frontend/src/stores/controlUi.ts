/**
 * Mission Control ← Control-UI Integration
 * Real-time OpenClaw agent session & context metrics visibility
 */

import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

// Import control-ui composables
// (Bundled into mission-control at build time)
import { usePluginHooks } from '../lib/control-ui/src/composables/usePluginHooks'
import { useContextMetrics } from '../lib/control-ui/src/composables/useContextMetrics'
import { useGatewayConnection } from '../lib/control-ui/src/composables/useGatewayConnection'
import { useBootstrapInvalidation } from '../lib/control-ui/src/composables/useBootstrapInvalidation'

export const useControlUiStore = defineStore('controlUi', () => {
  // Control-UI composables
  const { hooks, isConnected: hooksConnected } = usePluginHooks()
  const { metrics } = useContextMetrics()
  const { connection } = useGatewayConnection()
  const { invalidationState } = useBootstrapInvalidation()

  // Computed states
  const isReady = computed(() => hooksConnected && connection.value?.isOpen)
  
  const agentEvents = computed(() => hooks.value.agentEvents || [])
  const transcriptUpdates = computed(() => hooks.value.transcriptUpdates || [])
  const contextUsage = computed(() => metrics.value?.contextUsage || 0)
  const compactionState = computed(() => metrics.value?.compactionState || null)
  const bootstrapInvalidations = computed(() => invalidationState.value?.recentInvalidations || [])

  // Real-time alert system
  const alerts = ref<Array<{
    id: string
    type: 'context-high' | 'context-compacted' | 'agent-spawn' | 'bootstrap-reload' | 'connection-lost'
    message: string
    timestamp: number
    severity: 'info' | 'warning' | 'error'
  }>>([])

  const addAlert = (type: any, message: string, severity: 'info' | 'warning' | 'error' = 'info') => {
    alerts.value.unshift({
      id: `${Date.now()}-${Math.random()}`,
      type,
      message,
      timestamp: Date.now(),
      severity,
    })
    // Auto-clear after 30s for info alerts
    if (severity === 'info') {
      setTimeout(() => {
        alerts.value = alerts.value.filter((a) => a.id !== alerts.value[0].id)
      }, 30000)
    }
  }

  // Monitor context threshold
  const contextThreshold = ref(0.75) // Alert at 75% usage
  const watchContext = () => {
    if (contextUsage.value > contextThreshold.value) {
      addAlert('context-high', `⚠️ Context usage at ${(contextUsage.value * 100).toFixed(0)}%`, 'warning')
    }
  }

  // Monitor compaction events
  const watchCompaction = () => {
    if (compactionState.value?.compacted) {
      addAlert(
        'context-compacted',
        `📦 Context compacted: ${compactionState.value.tokensRecovered} tokens recovered`,
        'info'
      )
    }
  }

  // Monitor connection
  const watchConnection = () => {
    if (!isReady.value) {
      addAlert('connection-lost', '🔌 Control-UI connection lost', 'error')
    }
  }

  // Monitor bootstrap invalidations
  const watchBootstrap = () => {
    if (bootstrapInvalidations.value.length > 0) {
      const latest = bootstrapInvalidations.value[0]
      addAlert('bootstrap-reload', `🔄 Config reloaded: ${latest.source}`, 'info')
    }
  }

  return {
    // State
    isReady,
    alerts,
    contextThreshold,
    
    // Real-time data
    agentEvents,
    transcriptUpdates,
    contextUsage,
    compactionState,
    bootstrapInvalidations,
    
    // Methods
    addAlert,
    watchContext,
    watchCompaction,
    watchConnection,
    watchBootstrap,
  }
})
