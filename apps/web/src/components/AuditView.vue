<script setup lang="ts">
import { ref, computed } from "vue";
import { useErpStore } from "../composables/useErpStore";

const { auditLogs } = useErpStore();

const searchQuery = ref("");

const filteredLogs = computed(() => {
  const query = searchQuery.value.toLowerCase().trim();
  if (!query) return auditLogs.value;
  return auditLogs.value.filter(
    (l) =>
      l.action.toLowerCase().includes(query) ||
      l.actor.toLowerCase().includes(query) ||
      l.entity.toLowerCase().includes(query) ||
      l.details.toLowerCase().includes(query)
  );
});
</script>

<template>
  <div class="view-container">
    <header class="view-header">
      <div>
        <p class="eyebrow">Seguridad y Trazabilidad</p>
        <h1 class="view-title">Bitácora de Auditoría</h1>
        <p class="view-subtitle">Historial cronológico inmutable de operaciones realizadas en el sistema.</p>
      </div>
    </header>

    <div class="toolbar">
      <div class="search-box">
        <span class="search-icon" aria-hidden="true">🔍</span>
        <input
          v-model="searchQuery"
          type="search"
          placeholder="Buscar por actor, acción o detalles..."
          aria-label="Buscar registros de auditoría"
        />
      </div>
      <div class="toolbar-stats">
        <span>Total: <strong>{{ auditLogs.length }}</strong> eventos</span>
      </div>
    </div>

    <div class="table-card">
      <table class="data-table">
        <thead>
          <tr>
            <th>Fecha / Hora</th>
            <th>Actor</th>
            <th>Evento / Acción</th>
            <th>Entidad</th>
            <th>Detalles de la Operación</th>
          </tr>
        </thead>
        <tbody v-if="filteredLogs.length > 0">
          <tr v-for="log in filteredLogs" :key="log.id">
            <td class="cell-mono">
              {{ new Date(log.timestamp).toLocaleString("es-CL", { dateStyle: "short", timeStyle: "medium" }) }}
            </td>
            <td>
              <span class="actor-badge">{{ log.actor }}</span>
            </td>
            <td>
              <span class="badge badge-neutral font-bold">{{ log.action }}</span>
            </td>
            <td>
              <span class="cell-mono">{{ log.entity }}</span>
            </td>
            <td>
              <span>{{ log.details }}</span>
            </td>
          </tr>
        </tbody>
        <tbody v-else>
          <tr>
            <td colspan="5" class="empty-table-cell">
              <div class="empty-table-state">
                <span class="empty-icon">🛡️</span>
                <h3>Sin eventos de auditoría que coincidan</h3>
                <p>Todas las acciones críticas de inventario, ventas y configuración quedarán registradas aquí.</p>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<style scoped>
.actor-badge {
  background: #f0f4f2;
  padding: 3px 8px;
  border-radius: 6px;
  font-size: 12px;
  color: var(--sidebar, #193127);
  font-weight: 600;
}
</style>
