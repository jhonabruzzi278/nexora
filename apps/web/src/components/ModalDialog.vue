<script setup lang="ts">
import { onMounted, onUnmounted } from "vue";

const props = defineProps<{
  show: boolean;
  title: string;
  subtitle?: string;
}>();

const emit = defineEmits<{
  (e: "close"): void;
}>();

function handleKeydown(event: KeyboardEvent) {
  if (event.key === "Escape" && props.show) {
    emit("close");
  }
}

onMounted(() => {
  window.addEventListener("keydown", handleKeydown);
});

onUnmounted(() => {
  window.removeEventListener("keydown", handleKeydown);
});
</script>

<template>
  <Teleport to="body">
    <Transition name="modal-fade">
      <div v-if="show" class="modal-overlay" @click.self="emit('close')" role="dialog" aria-modal="true">
        <div class="modal-card">
          <header class="modal-header">
            <div>
              <h2 class="modal-title">{{ title }}</h2>
              <p v-if="subtitle" class="modal-subtitle">{{ subtitle }}</p>
            </div>
            <button type="button" class="modal-close-btn" @click="emit('close')" aria-label="Cerrar ventana">
              ✕
            </button>
          </header>

          <div class="modal-body">
            <slot></slot>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.modal-overlay {
  position: fixed;
  inset: 0;
  z-index: 999;
  background: rgba(18, 30, 24, 0.65);
  backdrop-filter: blur(6px);
  display: grid;
  place-items: center;
  padding: 20px;
  overflow-y: auto;
}

.modal-card {
  width: 100%;
  max-width: 580px;
  background: var(--paper, #f8f7f2);
  border: 1px solid var(--line, #d9ddd5);
  border-radius: 16px;
  box-shadow: 0 24px 48px -12px rgba(0, 0, 0, 0.25);
  overflow: hidden;
  animation: modal-pop 200ms cubic-bezier(0.16, 1, 0.3, 1) both;
}

.modal-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  padding: 24px 28px 18px;
  border-bottom: 1px solid var(--line, #d9ddd5);
}

.modal-title {
  margin: 0;
  font-size: 20px;
  font-weight: 700;
  color: var(--ink, #17211d);
  letter-spacing: -0.02em;
}

.modal-subtitle {
  margin: 4px 0 0;
  font-size: 13px;
  color: var(--muted, #69736d);
}

.modal-close-btn {
  background: transparent;
  border: 1px solid transparent;
  border-radius: 8px;
  width: 32px;
  height: 32px;
  display: grid;
  place-items: center;
  font-size: 14px;
  color: var(--muted, #69736d);
  cursor: pointer;
  transition: all 160ms ease;
}

.modal-close-btn:hover {
  background: rgba(0, 0, 0, 0.05);
  color: var(--ink, #17211d);
}

.modal-body {
  padding: 24px 28px 28px;
}

.modal-fade-enter-active,
.modal-fade-leave-active {
  transition: opacity 200ms ease;
}

.modal-fade-enter-from,
.modal-fade-leave-to {
  opacity: 0;
}

@keyframes modal-pop {
  from {
    opacity: 0;
    transform: scale(0.96) translateY(8px);
  }
  to {
    opacity: 1;
    transform: scale(1) translateY(0);
  }
}
</style>
