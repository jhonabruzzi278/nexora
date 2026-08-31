<script setup lang="ts">
import { ref, computed } from "vue";
import { useErpStore } from "../composables/useErpStore";
import type { MovementType } from "@nexora/contracts";
import ModalDialog from "./ModalDialog.vue";

const {
  products,
  movements,
  lowStockProducts,
  totalStockUnits,
  recordInventoryMovement
} = useErpStore();

const activeTab = ref<"stock" | "movements">("stock");
const showMovementModal = ref(false);

const formData = ref({
  productId: "",
  type: "IN" as MovementType,
  quantity: 5,
  reason: ""
});

const formErrors = ref<Record<string, string>>({});

const outOfStockCount = computed(() => {
  return products.value.filter((p) => p.currentStock === 0).length;
});

const selectedProduct = computed(() => {
  return products.value.find((p) => p.id === formData.value.productId);
});

function openModal() {
  formData.value = {
    productId: products.value[0]?.id || "",
    type: "IN",
    quantity: 5,
    reason: ""
  };
  formErrors.value = {};
  showMovementModal.value = true;
}

function validateForm() {
  const errors: Record<string, string> = {};
  if (!formData.value.productId) {
    errors.productId = "Selecciona un producto.";
  }

  if (formData.value.quantity <= 0) {
    errors.quantity = "La cantidad debe ser mayor a 0.";
  }

  if (
    formData.value.type === "OUT" &&
    selectedProduct.value &&
    formData.value.quantity > selectedProduct.value.currentStock
  ) {
    errors.quantity = `Stock insuficiente. Disponible: ${selectedProduct.value.currentStock} unidades.`;
  }

  if (!formData.value.reason.trim()) {
    errors.reason = "Ingresa el motivo del movimiento.";
  }

  formErrors.value = errors;
  return Object.keys(errors).length === 0;
}

function handleSave() {
  if (!validateForm()) return;
  try {
    recordInventoryMovement(
      formData.value.productId,
      formData.value.type,
      formData.value.quantity,
      formData.value.reason.trim()
    );
    showMovementModal.value = false;
  } catch (error) {
    // capturado por store
  }
}
</script>

<template>
  <div class="view-container">
    <header class="view-header">
      <div>
        <p class="eyebrow">Control Operativo</p>
        <h1 class="view-title">Inventario</h1>
        <p class="view-subtitle">Supervisa las existencias físicas, niveles críticos y movimientos atómicos de stock.</p>
      </div>
      <button type="button" class="primary-btn" @click="openModal">
        <span>⚡</span> Registrar Movimiento
      </button>
    </header>

    <!-- KPI Cards -->
    <section class="metric-row">
      <div class="metric">
        <span>Total en Existencias</span>
        <strong>{{ totalStockUnits }} u.</strong>
        <small>{{ products.length }} SKUs en catálogo</small>
      </div>
      <div class="metric" :class="{ 'metric-alert': lowStockProducts.length > 0 }">
        <span>Alertas de Stock Bajo</span>
        <strong>{{ lowStockProducts.length }}</strong>
        <small>En o por debajo del mínimo</small>
      </div>
      <div class="metric" :class="{ 'metric-alert': outOfStockCount > 0 }">
        <span>Productos Agotados</span>
        <strong>{{ outOfStockCount }}</strong>
        <small>Sin stock disponible</small>
      </div>
    </section>

    <!-- Sub-navigation Tabs -->
    <div class="tab-controls">
      <button
        type="button"
        class="tab-btn"
        :class="{ active: activeTab === 'stock' }"
        @click="activeTab = 'stock'"
      >
        Existencias por Producto ({{ products.length }})
      </button>
      <button
        type="button"
        class="tab-btn"
        :class="{ active: activeTab === 'movements' }"
        @click="activeTab = 'movements'"
      >
        Historial de Movimientos ({{ movements.length }})
      </button>
    </div>

    <!-- Tab 1: Existencias -->
    <div v-if="activeTab === 'stock'" class="table-card">
      <table class="data-table">
        <thead>
          <tr>
            <th>SKU</th>
            <th>Producto</th>
            <th>Categoría</th>
            <th>Stock Actual</th>
            <th>Stock Mínimo</th>
            <th>Estado de Disponibilidad</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="prod in products" :key="prod.id">
            <td class="cell-mono">
              <strong>{{ prod.sku }}</strong>
            </td>
            <td>
              <strong>{{ prod.name }}</strong>
            </td>
            <td>
              <span class="cell-text-muted">{{ prod.category }}</span>
            </td>
            <td>
              <span class="stock-number">{{ prod.currentStock }} unidades</span>
            </td>
            <td>
              <span class="cell-text-muted">{{ prod.minStock }} u.</span>
            </td>
            <td>
              <div class="availability-bar-wrapper">
                <span
                  class="badge"
                  :class="{
                    'badge-danger': prod.currentStock === 0,
                    'badge-alert': prod.currentStock <= prod.minStock && prod.currentStock > 0,
                    'badge-success': prod.currentStock > prod.minStock
                  }"
                >
                  {{
                    prod.currentStock === 0
                      ? 'Agotado'
                      : prod.currentStock <= prod.minStock
                      ? 'Stock Crítico'
                      : 'Disponible'
                  }}
                </span>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Tab 2: Movimientos -->
    <div v-if="activeTab === 'movements'" class="table-card">
      <table class="data-table">
        <thead>
          <tr>
            <th>Fecha</th>
            <th>Tipo</th>
            <th>Producto</th>
            <th>Cantidad</th>
            <th>Motivo / Referencia</th>
            <th>Responsable</th>
          </tr>
        </thead>
        <tbody v-if="movements.length > 0">
          <tr v-for="mov in movements" :key="mov.id">
            <td class="cell-mono">
              {{ new Date(mov.createdAt).toLocaleString("es-CL", { dateStyle: "short", timeStyle: "short" }) }}
            </td>
            <td>
              <span
                class="badge"
                :class="{
                  'badge-success': mov.type === 'IN',
                  'badge-alert': mov.type === 'OUT',
                  'badge-neutral': mov.type === 'ADJUSTMENT'
                }"
              >
                {{ mov.type === 'IN' ? '↓ Entrada' : mov.type === 'OUT' ? '↑ Salida' : '↺ Ajuste' }}
              </span>
            </td>
            <td>
              <strong>{{ mov.productName }}</strong>
            </td>
            <td>
              <span class="cell-mono font-bold">
                {{ mov.type === 'IN' ? '+' : mov.type === 'OUT' ? '-' : '' }}{{ mov.quantity }} u.
              </span>
            </td>
            <td>
              <span>{{ mov.reason }}</span>
            </td>
            <td>
              <span class="cell-text-muted">{{ mov.performedBy }}</span>
            </td>
          </tr>
        </tbody>
        <tbody v-else>
          <tr>
            <td colspan="6" class="empty-table-cell">
              <div class="empty-table-state">
                <span class="empty-icon">📜</span>
                <h3>Sin movimientos registrados</h3>
                <p>Las compras, ventas y ajustes manuales se reflejarán aquí automáticamente.</p>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Modal Registrar Movimiento -->
    <ModalDialog
      :show="showMovementModal"
      title="Registrar Movimiento de Inventario"
      subtitle="Actualiza el stock de forma atómica y deja registro en la bitácora de trazabilidad."
      @close="showMovementModal = false"
    >
      <form @submit.prevent="handleSave" class="form-grid">
        <div class="form-group">
          <label for="mov-product">Producto <span class="req">*</span></label>
          <select id="mov-product" v-model="formData.productId" class="select-field">
            <option v-for="p in products" :key="p.id" :value="p.id">
              {{ p.sku }} — {{ p.name }} (Stock actual: {{ p.currentStock }} u.)
            </option>
          </select>
          <small v-if="formErrors.productId" class="error-text">{{ formErrors.productId }}</small>
        </div>

        <div class="form-group-row">
          <div class="form-group">
            <label for="mov-type">Tipo de Operación <span class="req">*</span></label>
            <select id="mov-type" v-model="formData.type" class="select-field">
              <option value="IN">Entrada (Recepción de compra / Devolución)</option>
              <option value="OUT">Salida (Merma / Consumo interno)</option>
              <option value="ADJUSTMENT">Ajuste Directo (Conteo físico de bodega)</option>
            </select>
          </div>

          <div class="form-group">
            <label for="mov-qty">
              {{ formData.type === 'ADJUSTMENT' ? 'Nuevo Stock Total' : 'Cantidad de Unidades' }}
              <span class="req">*</span>
            </label>
            <input
              id="mov-qty"
              v-model.number="formData.quantity"
              type="number"
              min="1"
              class="input-field"
              :class="{ 'input-error': formErrors.quantity }"
            />
            <small v-if="formErrors.quantity" class="error-text">{{ formErrors.quantity }}</small>
          </div>
        </div>

        <div class="form-group">
          <label for="mov-reason">Motivo / Orden de Referencia <span class="req">*</span></label>
          <input
            id="mov-reason"
            v-model="formData.reason"
            type="text"
            placeholder="Ej: Recepción orden #OC-105 de proveedor"
            class="input-field"
            :class="{ 'input-error': formErrors.reason }"
          />
          <small v-if="formErrors.reason" class="error-text">{{ formErrors.reason }}</small>
        </div>

        <div class="modal-actions">
          <button type="button" class="secondary-btn" @click="showMovementModal = false">
            Cancelar
          </button>
          <button type="submit" class="primary-btn">
            Confirmar Movimiento
          </button>
        </div>
      </form>
    </ModalDialog>
  </div>
</template>

<style scoped>
.tab-controls {
  display: flex;
  gap: 10px;
  margin-bottom: 20px;
}

.tab-btn {
  background: white;
  border: 1px solid var(--line, #d9ddd5);
  padding: 10px 18px;
  border-radius: 10px;
  font-weight: 600;
  font-size: 13px;
  color: var(--muted, #69736d);
  cursor: pointer;
  transition: all 160ms ease;
}

.tab-btn:hover {
  color: var(--ink, #17211d);
  border-color: #b0b8ac;
}

.tab-btn.active {
  background: var(--green, #1b5d43);
  color: white;
  border-color: var(--green, #1b5d43);
}

.stock-number {
  font-weight: 700;
  font-size: 14px;
}
</style>
