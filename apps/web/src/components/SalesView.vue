<script setup lang="ts">
import { ref, computed } from "vue";
import { useErpStore } from "../composables/useErpStore";
import ModalDialog from "./ModalDialog.vue";

const {
  sales,
  customers,
  products,
  formatCurrency,
  totalSalesAmount,
  createSale
} = useErpStore();

const showCreateModal = ref(false);

const selectedCustomerId = ref("");
const cartItems = ref<{ productId: string; quantity: number }[]>([
  { productId: "", quantity: 1 }
]);

const formErrors = ref<Record<string, string>>({});

const averageTicket = computed(() => {
  if (sales.value.length === 0) return 0;
  return Math.round(totalSalesAmount.value / sales.value.length);
});

const currentModalTotal = computed(() => {
  return cartItems.value.reduce((total, item) => {
    const prod = products.value.find((p) => p.id === item.productId);
    if (!prod) return total;
    return total + prod.priceMinor * (item.quantity || 0);
  }, 0);
});

function openModal() {
  selectedCustomerId.value = customers.value[0]?.id || "";
  cartItems.value = [
    {
      productId: products.value[0]?.id || "",
      quantity: 1
    }
  ];
  formErrors.value = {};
  showCreateModal.value = true;
}

function addItemRow() {
  cartItems.value.push({
    productId: products.value[0]?.id || "",
    quantity: 1
  });
}

function removeItemRow(index: number) {
  if (cartItems.value.length > 1) {
    cartItems.value.splice(index, 1);
  }
}

function validateForm() {
  const errors: Record<string, string> = {};
  if (!selectedCustomerId.value) {
    errors.customer = "Selecciona un cliente para la venta.";
  }

  if (cartItems.value.length === 0) {
    errors.items = "Agrega al menos un producto a la orden.";
  }

  for (const [i, item] of cartItems.value.entries()) {
    if (!item) continue;
    if (!item.productId) {
      errors[`item_${i}`] = "Selecciona un producto válido.";
      continue;
    }
    const prod = products.value.find((p) => p.id === item.productId);
    if (!prod) continue;
    if (item.quantity <= 0) {
      errors[`item_${i}`] = "La cantidad debe ser mayor a 0.";
    } else if (item.quantity > prod.currentStock) {
      errors[`item_${i}`] = `Stock insuficiente en ${prod.sku} (disponible: ${prod.currentStock} u.)`;
    }
  }

  formErrors.value = errors;
  return Object.keys(errors).length === 0;
}

function handleSave() {
  if (!validateForm()) return;
  try {
    createSale(selectedCustomerId.value, cartItems.value);
    showCreateModal.value = false;
  } catch (error) {
    // Error notificado por store
  }
}
</script>

<template>
  <div class="view-container">
    <header class="view-header">
      <div>
        <p class="eyebrow">Operaciones Comerciales</p>
        <h1 class="view-title">Ventas</h1>
        <p class="view-subtitle">Emisión y registro de ventas con validación y descuento atómico de inventario.</p>
      </div>
      <button type="button" class="primary-btn" @click="openModal">
        <span>+</span> Nueva Venta
      </button>
    </header>

    <!-- KPI Cards -->
    <section class="metric-row">
      <div class="metric">
        <span>Total Facturado</span>
        <strong>{{ formatCurrency(totalSalesAmount) }}</strong>
        <small>Monto acumulado</small>
      </div>
      <div class="metric">
        <span>Órdenes Registradas</span>
        <strong>{{ sales.length }}</strong>
        <small>Ventas finalizadas</small>
      </div>
      <div class="metric">
        <span>Ticket Promedio</span>
        <strong>{{ formatCurrency(averageTicket) }}</strong>
        <small>Por orden de compra</small>
      </div>
    </section>

    <!-- Table of Sales -->
    <div class="table-card">
      <table class="data-table">
        <thead>
          <tr>
            <th>N° Orden</th>
            <th>Cliente</th>
            <th>Detalle de Productos</th>
            <th>Monto Total (CLP)</th>
            <th>Estado</th>
            <th>Fecha / Hora</th>
          </tr>
        </thead>
        <tbody v-if="sales.length > 0">
          <tr v-for="sale in sales" :key="sale.id">
            <td class="cell-mono">
              <strong>{{ sale.id }}</strong>
            </td>
            <td>
              <strong>{{ sale.customerName }}</strong>
            </td>
            <td>
              <ul class="sale-items-summary">
                <li v-for="item in sale.items" :key="item.productId">
                  <span class="cell-mono font-bold">{{ item.productSku }}</span>
                  <span>{{ item.productName }}</span>
                  <strong>({{ item.quantity }} x {{ formatCurrency(item.unitPriceMinor) }})</strong>
                </li>
              </ul>
            </td>
            <td>
              <strong class="total-highlight">{{ formatCurrency(sale.totalMinor) }}</strong>
            </td>
            <td>
              <span class="badge badge-success">Completada</span>
            </td>
            <td>
              <span class="cell-text-muted">
                {{ new Date(sale.createdAt).toLocaleString("es-CL", { dateStyle: "short", timeStyle: "short" }) }}
              </span>
            </td>
          </tr>
        </tbody>
        <tbody v-else>
          <tr>
            <td colspan="6" class="empty-table-cell">
              <div class="empty-table-state">
                <span class="empty-icon">💳</span>
                <h3>Sin ventas registradas aún</h3>
                <p>Genera la primera venta seleccionando un cliente y productos con stock disponible.</p>
                <button type="button" class="secondary-btn" @click="openModal">Crear primera venta</button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Modal Registrar Venta -->
    <ModalDialog
      :show="showCreateModal"
      title="Registrar Nueva Venta"
      subtitle="Genera una orden de venta. El stock de cada producto se descontará automáticamente."
      @close="showCreateModal = false"
    >
      <form @submit.prevent="handleSave" class="form-grid">
        <div class="form-group">
          <label for="sale-customer">Seleccionar Cliente <span class="req">*</span></label>
          <select id="sale-customer" v-model="selectedCustomerId" class="select-field">
            <option v-for="c in customers" :key="c.id" :value="c.id">
              {{ c.name }} (RUT: {{ c.taxId }})
            </option>
          </select>
          <small v-if="formErrors.customer" class="error-text">{{ formErrors.customer }}</small>
        </div>

        <div class="sale-lines-section">
          <div class="sale-lines-header">
            <strong>Líneas de la Venta</strong>
            <button type="button" class="link-btn" @click="addItemRow">+ Agregar Producto</button>
          </div>

          <div v-for="(item, index) in cartItems" :key="index" class="sale-line-row">
            <div class="line-product">
              <select v-model="item.productId" class="select-field">
                <option v-for="p in products" :key="p.id" :value="p.id">
                  {{ p.sku }} - {{ p.name }} ({{ formatCurrency(p.priceMinor) }} · Disp: {{ p.currentStock }})
                </option>
              </select>
            </div>

            <div class="line-qty">
              <input
                v-model.number="item.quantity"
                type="number"
                min="1"
                placeholder="Cant."
                class="input-field"
              />
            </div>

            <div class="line-subtotal">
              <span>
                {{
                  formatCurrency(
                    ((products.find((p) => p.id === item.productId)?.priceMinor) || 0) *
                      (item.quantity || 0)
                  )
                }}
              </span>
            </div>

            <button
              type="button"
              class="line-remove"
              @click="removeItemRow(index)"
              :disabled="cartItems.length === 1"
              title="Eliminar fila"
            >
              ✕
            </button>
          </div>

          <div v-for="(err, key) in formErrors" :key="key">
            <small v-if="key.startsWith('item_')" class="error-text">{{ err }}</small>
          </div>
        </div>

        <div class="sale-total-card">
          <span>Total a Facturar</span>
          <strong>{{ formatCurrency(currentModalTotal) }}</strong>
        </div>

        <div class="modal-actions">
          <button type="button" class="secondary-btn" @click="showCreateModal = false">
            Cancelar
          </button>
          <button type="submit" class="primary-btn" :disabled="currentModalTotal <= 0">
            Confirmar y Emitir Venta
          </button>
        </div>
      </form>
    </ModalDialog>
  </div>
</template>

<style scoped>
.sale-items-summary {
  margin: 0;
  padding: 0;
  list-style: none;
  display: grid;
  gap: 4px;
  font-size: 13px;
}

.sale-items-summary li {
  display: flex;
  gap: 8px;
  align-items: center;
}

.total-highlight {
  font-size: 15px;
  color: var(--green, #1b5d43);
}

.sale-lines-section {
  background: white;
  border: 1px solid var(--line, #d9ddd5);
  border-radius: 12px;
  padding: 16px;
  display: grid;
  gap: 12px;
}

.sale-lines-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 13px;
}

.link-btn {
  background: none;
  border: none;
  color: var(--green, #1b5d43);
  font-weight: 700;
  cursor: pointer;
  padding: 0;
}

.link-btn:hover {
  text-decoration: underline;
}

.sale-line-row {
  display: grid;
  grid-template-columns: 1fr 90px 100px 32px;
  gap: 10px;
  align-items: center;
}

.line-subtotal {
  font-size: 13px;
  font-weight: 700;
  text-align: right;
  color: var(--ink, #17211d);
}

.line-remove {
  background: transparent;
  border: none;
  color: #991b1b;
  cursor: pointer;
  font-size: 14px;
  border-radius: 6px;
  padding: 4px;
}

.line-remove:disabled {
  opacity: 0.3;
  cursor: not-allowed;
}

.sale-total-card {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: #edf7f0;
  border: 1px solid #c7e8d3;
  padding: 16px 20px;
  border-radius: 12px;
}

.sale-total-card span {
  font-size: 14px;
  font-weight: 600;
  color: var(--green, #1b5d43);
}

.sale-total-card strong {
  font-size: 20px;
  color: var(--green, #1b5d43);
}
</style>
