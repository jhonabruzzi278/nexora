<script setup lang="ts">
import { ref, computed } from "vue";
import { useErpStore } from "../composables/useErpStore";
import ModalDialog from "./ModalDialog.vue";

const { products, formatCurrency, addProduct } = useErpStore();

const searchQuery = ref("");
const selectedCategory = ref("all");
const onlyLowStock = ref(false);
const showCreateModal = ref(false);

const formData = ref({
  sku: "",
  name: "",
  category: "Hardware de Red",
  priceMinor: 0,
  costMinor: 0,
  currentStock: 0,
  minStock: 5
});

const formErrors = ref<Record<string, string>>({});

const categories = computed(() => {
  const cats = new Set(products.value.map((p) => p.category));
  return Array.from(cats);
});

const filteredProducts = computed(() => {
  let list = products.value;
  const query = searchQuery.value.toLowerCase().trim();

  if (query) {
    list = list.filter(
      (p) =>
        p.name.toLowerCase().includes(query) ||
        p.sku.toLowerCase().includes(query) ||
        p.category.toLowerCase().includes(query)
    );
  }

  if (selectedCategory.value !== "all") {
    list = list.filter((p) => p.category === selectedCategory.value);
  }

  if (onlyLowStock.value) {
    list = list.filter((p) => p.currentStock <= p.minStock);
  }

  return list;
});

const estimatedMargin = computed(() => {
  if (formData.value.priceMinor <= 0) return 0;
  const margin = ((formData.value.priceMinor - formData.value.costMinor) / formData.value.priceMinor) * 100;
  return Math.round(margin);
});

function openModal() {
  formData.value = {
    sku: "",
    name: "",
    category: "Hardware de Red",
    priceMinor: 29990,
    costMinor: 15000,
    currentStock: 10,
    minStock: 5
  };
  formErrors.value = {};
  showCreateModal.value = true;
}

function validateForm() {
  const errors: Record<string, string> = {};
  if (!formData.value.sku.trim()) {
    errors.sku = "El SKU es obligatorio.";
  } else if (
    products.value.some(
      (p) => p.sku.trim().toUpperCase() === formData.value.sku.trim().toUpperCase()
    )
  ) {
    errors.sku = "Este SKU ya existe en el catálogo.";
  }

  if (!formData.value.name.trim()) {
    errors.name = "El nombre del producto es obligatorio.";
  }

  if (formData.value.priceMinor <= 0) {
    errors.priceMinor = "El precio de venta debe ser mayor a 0.";
  }

  if (formData.value.minStock < 0) {
    errors.minStock = "El stock mínimo no puede ser negativo.";
  }

  formErrors.value = errors;
  return Object.keys(errors).length === 0;
}

function handleSave() {
  if (!validateForm()) return;
  try {
    addProduct({
      sku: formData.value.sku.trim().toUpperCase(),
      name: formData.value.name.trim(),
      category: formData.value.category.trim(),
      priceMinor: Math.round(formData.value.priceMinor),
      costMinor: Math.round(formData.value.costMinor),
      currentStock: Math.round(formData.value.currentStock),
      minStock: Math.round(formData.value.minStock)
    });
    showCreateModal.value = false;
  } catch (error) {
    // Error capturado y notificado por el store
  }
}
</script>

<template>
  <div class="view-container">
    <header class="view-header">
      <div>
        <p class="eyebrow">Catálogo Maestro</p>
        <h1 class="view-title">Productos</h1>
        <p class="view-subtitle">Gestiona SKUs, precios de venta, costos y umbrales de stock mínimo.</p>
      </div>
      <button type="button" class="primary-btn" @click="openModal">
        <span>+</span> Nuevo Producto
      </button>
    </header>

    <div class="toolbar">
      <div class="search-box">
        <span class="search-icon" aria-hidden="true">🔍</span>
        <input
          v-model="searchQuery"
          type="search"
          placeholder="Buscar por SKU o descripción..."
          aria-label="Buscar productos"
        />
      </div>

      <div class="filter-group">
        <select v-model="selectedCategory" class="select-field" aria-label="Filtrar por categoría">
          <option value="all">Todas las categorías</option>
          <option v-for="cat in categories" :key="cat" :value="cat">{{ cat }}</option>
        </select>

        <label class="checkbox-filter">
          <input v-model="onlyLowStock" type="checkbox" />
          <span>Solo stock crítico</span>
        </label>
      </div>
    </div>

    <div class="table-card">
      <table class="data-table">
        <thead>
          <tr>
            <th>SKU</th>
            <th>Producto</th>
            <th>Categoría</th>
            <th>Precio Venta</th>
            <th>Costo</th>
            <th>Stock Actual</th>
            <th>Mínimo</th>
          </tr>
        </thead>
        <tbody v-if="filteredProducts.length > 0">
          <tr v-for="prod in filteredProducts" :key="prod.id">
            <td class="cell-mono">
              <span class="sku-badge">{{ prod.sku }}</span>
            </td>
            <td>
              <strong>{{ prod.name }}</strong>
            </td>
            <td>
              <span class="category-tag">{{ prod.category }}</span>
            </td>
            <td>
              <strong>{{ formatCurrency(prod.priceMinor) }}</strong>
            </td>
            <td>
              <span class="cell-text-muted">{{ formatCurrency(prod.costMinor) }}</span>
            </td>
            <td>
              <div class="stock-cell">
                <span
                  class="badge"
                  :class="{
                    'badge-alert': prod.currentStock <= prod.minStock && prod.currentStock > 0,
                    'badge-danger': prod.currentStock === 0,
                    'badge-success': prod.currentStock > prod.minStock
                  }"
                >
                  {{ prod.currentStock }} u.
                </span>
                <span
                  v-if="prod.currentStock <= prod.minStock"
                  class="stock-warning-icon"
                  title="Stock bajo el mínimo requerido"
                >
                  ⚠️
                </span>
              </div>
            </td>
            <td>
              <span class="cell-text-muted">{{ prod.minStock }} u.</span>
            </td>
          </tr>
        </tbody>
        <tbody v-else>
          <tr>
            <td colspan="7" class="empty-table-cell">
              <div class="empty-table-state">
                <span class="empty-icon">📦</span>
                <h3>No hay productos que coincidan</h3>
                <p>Prueba limpiando los filtros o registra un nuevo SKU en el catálogo.</p>
                <button type="button" class="secondary-btn" @click="openModal">Registrar producto</button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Modal Registrar Producto -->
    <ModalDialog
      :show="showCreateModal"
      title="Registrar Nuevo Producto"
      subtitle="Crea un producto con SKU único, precio de venta en CLP y stock mínimo para alertas."
      @close="showCreateModal = false"
    >
      <form @submit.prevent="handleSave" class="form-grid">
        <div class="form-group-row">
          <div class="form-group">
            <label for="prod-sku">SKU (Código Único) <span class="req">*</span></label>
            <input
              id="prod-sku"
              v-model="formData.sku"
              type="text"
              placeholder="Ej: NEX-SRV-04"
              class="input-field cell-mono"
              :class="{ 'input-error': formErrors.sku }"
            />
            <small v-if="formErrors.sku" class="error-text">{{ formErrors.sku }}</small>
          </div>

          <div class="form-group">
            <label for="prod-category">Categoría</label>
            <input
              id="prod-category"
              v-model="formData.category"
              type="text"
              placeholder="Ej: Hardware de Red"
              class="input-field"
            />
          </div>
        </div>

        <div class="form-group">
          <label for="prod-name">Nombre / Descripción del Producto <span class="req">*</span></label>
          <input
            id="prod-name"
            v-model="formData.name"
            type="text"
            placeholder="Ej: Switch Gestionable 24 Puertos PoE+"
            class="input-field"
            :class="{ 'input-error': formErrors.name }"
          />
          <small v-if="formErrors.name" class="error-text">{{ formErrors.name }}</small>
        </div>

        <div class="form-group-row">
          <div class="form-group">
            <label for="prod-price">Precio de Venta (CLP) <span class="req">*</span></label>
            <input
              id="prod-price"
              v-model.number="formData.priceMinor"
              type="number"
              min="1"
              step="1"
              class="input-field"
              :class="{ 'input-error': formErrors.priceMinor }"
            />
            <small class="help-text">Guardado como entero en unidad base</small>
          </div>

          <div class="form-group">
            <label for="prod-cost">Costo Unitario (CLP)</label>
            <input
              id="prod-cost"
              v-model.number="formData.costMinor"
              type="number"
              min="0"
              step="1"
              class="input-field"
            />
            <small class="help-text">Margen bruto: <strong>{{ estimatedMargin }}%</strong></small>
          </div>
        </div>

        <div class="form-group-row">
          <div class="form-group">
            <label for="prod-stock">Stock Inicial</label>
            <input
              id="prod-stock"
              v-model.number="formData.currentStock"
              type="number"
              min="0"
              class="input-field"
            />
          </div>

          <div class="form-group">
            <label for="prod-minstock">Stock Mínimo (Alerta)</label>
            <input
              id="prod-minstock"
              v-model.number="formData.minStock"
              type="number"
              min="0"
              class="input-field"
            />
          </div>
        </div>

        <div class="modal-actions">
          <button type="button" class="secondary-btn" @click="showCreateModal = false">
            Cancelar
          </button>
          <button type="submit" class="primary-btn">
            Guardar Producto
          </button>
        </div>
      </form>
    </ModalDialog>
  </div>
</template>

<style scoped>
.sku-badge {
  background: #f0f3ee;
  border: 1px solid #d4ddd7;
  padding: 4px 8px;
  border-radius: 6px;
  font-size: 12px;
  font-weight: 700;
  color: var(--sidebar, #193127);
}

.category-tag {
  background: #eaece8;
  padding: 3px 8px;
  border-radius: 5px;
  font-size: 12px;
  color: var(--muted, #69736d);
}

.stock-cell {
  display: inline-flex;
  align-items: center;
  gap: 6px;
}

.stock-warning-icon {
  font-size: 13px;
}
</style>
