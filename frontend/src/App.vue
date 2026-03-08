<template>
  <div v-if="showDiagnostics" class="app-wrapper">
    <button @click="showDiagnostics = false" class="btn-back">← Back</button>
    <SystemDiagnostics />
  </div>
  <div v-else class="app-wrapper">
    <SimpleControlUI @show-diagnostics="showDiagnostics = true" />
  </div>
</template>

<script>
import { ref } from 'vue';
import SimpleControlUI from './SimpleControlUI.vue';
import SystemDiagnostics from './SystemDiagnostics.vue';

export default {
  name: 'App',
  components: {
    SimpleControlUI,
    SystemDiagnostics
  },
  setup() {
    const showDiagnostics = ref(false);

    return { showDiagnostics };
  }
};
</script>

<style scoped>
.app-wrapper {
  width: 100%;
  height: 100vh;
  overflow: hidden;
}

.btn-back {
  position: fixed;
  top: 1rem;
  right: 1rem;
  z-index: 1000;
  padding: 0.5rem 1rem;
  background: #10b981;
  color: #0f1419;
  border: none;
  border-radius: 4px;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-back:hover {
  background: #059669;
  transform: scale(1.05);
}
</style>
