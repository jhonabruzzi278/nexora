<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from "vue";
import type { DashboardSummary } from "@nexora/contracts";
import { useErpStore } from "./composables/useErpStore";
import ToastNotification from "./components/ToastNotification.vue";
import CustomersView from "./components/CustomersView.vue";
import ProductsView from "./components/ProductsView.vue";
import InventoryView from "./components/InventoryView.vue";
import SalesView from "./components/SalesView.vue";
import CashShiftView from "./components/CashShiftView.vue";
import SuppliersView from "./components/SuppliersView.vue";
import SettingsView from "./components/SettingsView.vue";
import AuditView from "./components/AuditView.vue";

const store = useErpStore();
const {
  customers,
  products,
  sales,
  currentShift,
  auditLogs,
  lowStockProducts,
  totalStockUnits,
  totalSalesAmount,
  formatCurrency,
  syncWithBackend
} = store;

type ViewKey = "overview" | "inventory" | "sales" | "cash" | "customers" | "products" | "suppliers" | "settings" | "audit";

const currentView = ref<ViewKey>("overview");
const summary = ref<DashboardSummary | null>(null);
const loading = ref(true);
const error = ref("");

const infrastructureLabel = computed(() =>
  summary.value?.infrastructure === "ready" ? "Infraestructura operativa" : "Floci / DynamoDB conectado"
);

function updateViewFromHash() {
  const hash = window.location.hash.replace("#", "") as ViewKey;
  const validViews: ViewKey[] = [
    "overview",
    "inventory",
    "sales",
    "cash",
    "customers",
    "products",
    "suppliers",
    "settings",
    "audit"
  ];
  if (validViews.includes(hash)) {
    currentView.value = hash;
  } else {
    currentView.value = "overview";
  }
}

function navigateTo(view: ViewKey) {
  currentView.value = view;
  window.location.hash = view;
}

async function loadDashboard() {
  loading.value = true;
  error.value = "";

  try {
    const response = await fetch("/api/v1/dashboard");
    if (!response.ok) throw new Error("No fue posible consultar la API");
    summary.value = await response.json();
  } catch (caught) {
    error.value = caught instanceof Error ? caught.message : "Error de conexión";
    // Fallback: usar métricas reactivas calculadas del store local
    summary.value = {
      infrastructure: "ready",
      customers: customers.value.length,
      products: products.value.length,
      salesTotalMinor: totalSalesAmount.value,
      stockUnits: totalStockUnits.value,
      lowStockCount: lowStockProducts.value.length,
      currency: "CLP",
      updatedAt: new Date().toISOString()
    };
  } finally {
    loading.value = false;
  }
}

onMounted(() => {
  updateViewFromHash();
  window.addEventListener("hashchange", updateViewFromHash);
  syncWithBackend();
  loadDashboard();
});

onUnmounted(() => {
  window.removeEventListener("hashchange", updateViewFromHash);
});
</script>

<template>
  <div class="app-shell">
    <!-- Toast Floating Alerts -->
    <ToastNotification />

    <!-- Sidebar Navigation -->
    <aside class="sidebar">
      <a class="brand" href="#overview" @click.prevent="navigateTo('overview')" aria-label="Inicio de Nexora">
        <span class="brand-mark">N</span>
        <span>Nexora</span>
      </a>

      <nav aria-label="Navegación principal">
        <p class="nav-label">Workspace</p>
        <a
          class="nav-item"
          :class="{ 'is-active': currentView === 'overview' }"
          href="#overview"
          @click.prevent="navigateTo('overview')"
        >
          Resumen
        </a>
        <a
          class="nav-item"
          :class="{ 'is-active': currentView === 'inventory' }"
          href="#inventory"
          @click.prevent="navigateTo('inventory')"
        >
          Inventario
        </a>
        <a
          class="nav-item"
          :class="{ 'is-active': currentView === 'sales' }"
          href="#sales"
          @click.prevent="navigateTo('sales')"
        >
          Ventas
        </a>
        <a
          class="nav-item"
          :class="{ 'is-active': currentView === 'cash' }"
          href="#cash"
          @click.prevent="navigateTo('cash')"
        >
          Caja / Arqueo
        </a>
        <a
          class="nav-item"
          :class="{ 'is-active': currentView === 'customers' }"
          href="#customers"
          @click.prevent="navigateTo('customers')"
        >
          Clientes
        </a>
        <a
          class="nav-item"
          :class="{ 'is-active': currentView === 'products' }"
          href="#products"
          @click.prevent="navigateTo('products')"
        >
          Productos
        </a>
        <a
          class="nav-item"
          :class="{ 'is-active': currentView === 'suppliers' }"
          href="#suppliers"
          @click.prevent="navigateTo('suppliers')"
        >
          Proveedores
        </a>

        <p class="nav-label nav-label-secondary">Sistema</p>
        <a
          class="nav-item"
          :class="{ 'is-active': currentView === 'audit' }"
          href="#audit"
          @click.prevent="navigateTo('audit')"
        >
          Auditoría
        </a>
        <a
          class="nav-item"
          :class="{ 'is-active': currentView === 'settings' }"
          href="#settings"
          @click.prevent="navigateTo('settings')"
        >
          Configuración
        </a>
      </nav>

      <div class="sidebar-footer">
        <span class="environment-dot" aria-hidden="true"></span>
        <div>
          <strong>Entorno Nexora</strong>
          <span>DynamoDB · us-east-1</span>
        </div>
      </div>
    </aside>

    <!-- Dynamic Workspace Views -->
    <main class="workspace">
      <!-- 1. VISTA OVERVIEW / RESUMEN GENERAL -->
      <div v-if="currentView === 'overview'">
        <header class="workspace-header">
          <div>
            <p class="eyebrow">Operación general</p>
            <h1>Resumen del Sistema</h1>
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
            <span>Ventas Acumuladas</span>
            <strong>{{ formatCurrency(totalSalesAmount) }}</strong>
            <small>{{ sales.length }} órdenes cerradas</small>
          </div>
          <div class="metric">
            <span>Caja del Día</span>
            <strong :style="currentShift ? 'color: #166534;' : 'color: #64748b;'">
              {{ currentShift ? formatCurrency(currentShift.expectedCashMinor) : 'Caja Cerrada' }}
            </strong>
            <small>{{ currentShift ? 'Turno en curso' : 'Sin turno activo' }}</small>
          </div>
          <div class="metric">
            <span>Unidades en Stock</span>
            <strong>{{ totalStockUnits }}</strong>
            <small>{{ products.length }} SKUs registrados</small>
          </div>
          <div class="metric">
            <span>Clientes</span>
            <strong>{{ customers.length }}</strong>
            <small>Directorio activo</small>
          </div>
          <div class="metric" :class="{ 'metric-alert': lowStockProducts.length > 0 }">
            <span>Alertas de Stock</span>
            <strong>{{ lowStockProducts.length }}</strong>
            <small>{{ lowStockProducts.length > 0 ? 'Requieren reposición' : 'Niveles óptimos' }}</small>
          </div>
        </section>

        <section class="operations-grid">
          <div class="stock-panel">
            <div class="section-heading">
              <div>
                <p class="eyebrow">Inventario</p>
                <h2>Productos con stock crítico</h2>
              </div>
              <a href="#inventory" @click.prevent="navigateTo('inventory')">Ver inventario completo →</a>
            </div>

            <div v-if="lowStockProducts.length > 0">
              <table class="data-table">
                <thead>
                  <tr>
                    <th>SKU</th>
                    <th>Producto</th>
                    <th>Stock</th>
                    <th>Mínimo</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="p in lowStockProducts" :key="p.id">
                    <td class="cell-mono"><strong>{{ p.sku }}</strong></td>
                    <td>{{ p.name }}</td>
                    <td><span class="badge badge-alert">{{ p.currentStock }} u.</span></td>
                    <td><span class="cell-text-muted">{{ p.minStock }} u.</span></td>
                  </tr>
                </tbody>
              </table>
            </div>
            <div v-else class="empty-table-state" style="padding: 28px 0;">
              <span class="empty-icon">✓</span>
              <h3>Todos los niveles de stock están saludables</h3>
              <p>No hay alertas de reposición pendientes en el inventario.</p>
            </div>
          </div>

          <aside class="activity-panel" aria-labelledby="activity-title">
            <div class="section-heading compact">
              <div>
                <p class="eyebrow">Trazabilidad</p>
                <h2 id="activity-title">Última actividad</h2>
              </div>
              <a href="#audit" @click.prevent="navigateTo('audit')">Ver todo →</a>
            </div>
            <ol class="activity-list">
              <li v-for="log in auditLogs.slice(0, 3)" :key="log.id">
                <span class="activity-marker active"></span>
                <div>
                  <strong>{{ log.action }}</strong>
                  <p>{{ log.details }}</p>
                  <time>{{ new Date(log.timestamp).toLocaleTimeString("es-CL") }}</time>
                </div>
              </li>
            </ol>
          </aside>
        </section>
      </div>

      <!-- 2. VISTA CLIENTES -->
      <CustomersView v-else-if="currentView === 'customers'" />

      <!-- 3. VISTA PRODUCTOS -->
      <ProductsView v-else-if="currentView === 'products'" />

      <!-- 4. VISTA INVENTARIO -->
      <InventoryView v-else-if="currentView === 'inventory'" />

      <!-- 5. VISTA VENTAS -->
      <SalesView v-else-if="currentView === 'sales'" />

      <!-- 6. VISTA CAJA / ARQUEO -->
      <CashShiftView v-else-if="currentView === 'cash'" />

      <!-- 7. VISTA PROVEEDORES -->
      <SuppliersView v-else-if="currentView === 'suppliers'" />

      <!-- 8. VISTA CONFIGURACIÓN -->
      <SettingsView v-else-if="currentView === 'settings'" />

      <!-- 9. VISTA AUDITORÍA -->
      <AuditView v-else-if="currentView === 'audit'" />

      <!-- Footer Común -->
      <footer class="workspace-footer">
        <span>Nexora ERP Modular · {{ new Date().getFullYear() }}</span>
        <span>
          Última actualización:
          {{ summary ? new Date(summary.updatedAt).toLocaleTimeString("es-CL") : "En sincronía" }}
        </span>
      </footer>
    </main>
  </div>
</template>
