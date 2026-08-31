<script setup lang="ts">
import { useErpStore } from "../composables/useErpStore";

const { toasts, removeToast } = useErpStore();
</script>

<template>
  <div class="toast-container" aria-live="polite" aria-atomic="true">
    <TransitionGroup name="toast-slide">
      <div
        v-for="toast in toasts"
        :key="toast.id"
        class="toast-item"
        :class="'toast-' + toast.type"
        role="alert"
      >
        <div class="toast-icon">
          <span v-if="toast.type === 'success'">✓</span>
          <span v-else-if="toast.type === 'warning'">⚠</span>
          <span v-else-if="toast.type === 'error'">✕</span>
          <span v-else>ℹ</span>
        </div>
        <div class="toast-content">
          <strong class="toast-title">{{ toast.title }}</strong>
          <p class="toast-message">{{ toast.message }}</p>
        </div>
        <button
          type="button"
          class="toast-dismiss"
          @click="removeToast(toast.id)"
          aria-label="Cerrar notificación"
        >
          ✕
        </button>
      </div>
    </TransitionGroup>
  </div>
</template>

<style scoped>
.toast-container {
  position: fixed;
  bottom: 24px;
  right: 24px;
  z-index: 1000;
  display: flex;
  flex-direction: column;
  gap: 12px;
  max-width: 380px;
  width: calc(100% - 48px);
  pointer-events: none;
}

.toast-item {
  pointer-events: auto;
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 14px 16px;
  border-radius: 12px;
  background: white;
  border: 1px solid var(--line, #d9ddd5);
  box-shadow: 0 12px 32px -4px rgba(0, 0, 0, 0.14);
  color: var(--ink, #17211d);
}

.toast-icon {
  width: 26px;
  height: 26px;
  border-radius: 50%;
  display: grid;
  place-items: center;
  font-size: 13px;
  font-weight: 700;
  flex-shrink: 0;
}

.toast-success .toast-icon {
  background: #dff5e8;
  color: #166534;
}

.toast-warning .toast-icon {
  background: #fef3c7;
  color: #92400e;
}

.toast-error .toast-icon {
  background: #fee2e2;
  color: #991b1b;
}

.toast-info .toast-icon {
  background: #e0f2fe;
  color: #075985;
}

.toast-content {
  flex: 1;
  min-width: 0;
}

.toast-title {
  display: block;
  font-size: 14px;
  font-weight: 700;
  margin-bottom: 2px;
}

.toast-message {
  margin: 0;
  font-size: 12px;
  color: var(--muted, #69736d);
  line-height: 1.4;
}

.toast-dismiss {
  background: transparent;
  border: none;
  font-size: 12px;
  color: var(--muted, #69736d);
  cursor: pointer;
  padding: 4px;
}

.toast-dismiss:hover {
  color: var(--ink, #17211d);
}

.toast-slide-enter-active,
.toast-slide-leave-active {
  transition: all 260ms cubic-bezier(0.16, 1, 0.3, 1);
}

.toast-slide-enter-from {
  opacity: 0;
  transform: translateY(16px) scale(0.95);
}

.toast-slide-leave-to {
  opacity: 0;
  transform: translateX(30px);
}
</style>
