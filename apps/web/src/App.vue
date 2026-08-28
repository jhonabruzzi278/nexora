<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import type { DashboardSummary } from "@nexora/contracts";

const summary = ref<DashboardSummary | null>(null);
const loading = ref(true);
const error = ref("");

const formatter = new Intl.NumberFormat("es-CL", {
  style: "currency",
  currency: "CLP",
  maximumFractionDigits: 0
});

const infrastructureLabel = computed(() =>
  summary.value?.infrastructure === "ready" ? "Infraestructura operativa" : "Infraestructura pendiente"
);

async function loadDashboard() {
  loading.value = true;
  error.value = "";

  try {
    const response = await fetch("/api/v1/dashboard");
    if (!response.ok) throw new Error("No fue posible consultar la API");
    summary.value = await response.json();
  } catch (caught) {
    error.value = caught instanceof Error ? caught.message : "Error inesperado";
  } finally {
    loading.value = false;
  }
}

onMounted(loadDashboard);
</script>

<template>
  <div class="app-shell">
    <aside class="sidebar">
      <a class="brand" href="#" aria-label="Inicio de Nexora">
        <span class="brand-mark">N</span>
        <span>Nexora</span>
      </a>

      <nav aria-label="Navegación principal">
        <p class="nav-label">Workspace</p>
        <a class="nav-item is-active" href="#overview">Resumen</a>
        <a class="nav-item" href="#inventory">Inventario</a>
        <a class="nav-item" href="#sales">Ventas</a>
        <a class="nav-item" href="#customers">Clientes</a>
        <a class="nav-item" href="#suppliers">Proveedores</a>
        <p class="nav-label nav-label-secondary">Sistema</p>
        <a class="nav-item" href="#audit">Auditoría</a>
        <a class="nav-item" href="#settings">Configuración</a>
      </nav>

      <div class="sidebar-footer">
        <span class="environment-dot" aria-hidden="true"></span>
        <div>
          <strong>Entorno Nexora</strong>
          <span>DynamoDB · us-east-1</span>
        </div>
      </div>
    </aside>

    <main id="overview" class="workspace">
      <header class="workspace-header">
        <div>
          <p class="eyebrow">Operación general</p>
          <h1>Resumen</h1>
        </div>
        <div class="header-actions">
          <span class="status" :class="{ pending: summary?.infrastructure !== 'ready' }">
            <span></span>{{ infrastructureLabel }}
          </span>
          <button type="button" class="primary-action" @click="loadDashboard">
            Actualizar
          </button>
        </div>
      </header>

      <section class="metric-row" aria-label="Indicadores principales">
        <div class="metric">
          <span>Ventas acumuladas</span>
          <strong>{{ formatter.format(summary?.salesTotalMinor ?? 0) }}</strong>
          <small>Datos del entorno MVP</small>
        </div>
        <div class="metric">
          <span>Unidades en stock</span>
          <strong>{{ summary?.stockUnits ?? 0 }}</strong>
          <small>{{ summary?.products ?? 0 }} productos registrados</small>
        </div>
        <div class="metric">
          <span>Clientes</span>
          <strong>{{ summary?.customers ?? 0 }}</strong>
          <small>Directorio activo</small>
        </div>
        <div class="metric metric-alert">
          <span>Alertas de stock</span>
          <strong>{{ summary?.lowStockCount ?? 0 }}</strong>
          <small>Requieren revisión</small>
        </div>
      </section>

      <div v-if="error" class="system-message" role="alert">
        <div>
          <strong>La API todavía no responde</strong>
          <span>{{ error }}. Comprueba Docker Compose y vuelve a intentar.</span>
        </div>
        <button type="button" @click="loadDashboard">Reintentar</button>
      </div>

      <section id="inventory" class="operations-grid">
        <div class="stock-panel">
          <div class="section-heading">
            <div>
              <p class="eyebrow">Inventario</p>
              <h2>Productos que necesitan atención</h2>
            </div>
            <a href="#inventory">Ver inventario</a>
          </div>

          <div class="empty-state" :class="{ loading }">
            <div class="empty-visual" aria-hidden="true">
              <span></span><span></span><span></span>
            </div>
            <h3>{{ loading ? "Consultando existencias" : "Inventario listo para comenzar" }}</h3>
            <p>
              {{
                loading
                  ? "Estamos leyendo el estado desde DynamoDB."
                  : "Registra el primer producto y una recepción de compra para activar este espacio."
              }}
            </p>
            <button type="button" disabled>Registrar producto · próximamente</button>
          </div>
        </div>

        <aside class="activity-panel" aria-labelledby="activity-title">
          <div class="section-heading compact">
            <div>
              <p class="eyebrow">Trazabilidad</p>
              <h2 id="activity-title">Actividad reciente</h2>
            </div>
          </div>
          <ol class="activity-list">
            <li>
              <span class="activity-marker active"></span>
              <div>
                <strong>Base del proyecto creada</strong>
                <p>Frontend, API e infraestructura comparten un entorno reproducible.</p>
                <time>Ahora</time>
              </div>
            </li>
            <li>
              <span class="activity-marker"></span>
              <div>
                <strong>Tabla DynamoDB</strong>
                <p>Se habilitará con el primer `terraform apply`.</p>
                <time>Pendiente</time>
              </div>
            </li>
            <li>
              <span class="activity-marker"></span>
              <div>
                <strong>Flujo operacional</strong>
                <p>Clientes, productos, compras y ventas forman la próxima entrega.</p>
                <time>Semana 2</time>
              </div>
            </li>
          </ol>
        </aside>
      </section>

      <footer class="workspace-footer">
        <span>Nexora MVP · {{ new Date().getFullYear() }}</span>
        <span>Última lectura: {{ summary ? new Date(summary.updatedAt).toLocaleTimeString("es-CL") : "—" }}</span>
      </footer>
    </main>
  </div>
</template>
