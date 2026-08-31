<script setup lang="ts">
import { ref, computed } from "vue";
import { useErpStore } from "../composables/useErpStore";
import ModalDialog from "./ModalDialog.vue";

const { suppliers, addSupplier } = useErpStore();

const searchQuery = ref("");
const showCreateModal = ref(false);

const formData = ref({
  taxId: "",
  name: "",
  contactPerson: "",
  email: "",
  phone: ""
});

const formErrors = ref<Record<string, string>>({});

const filteredSuppliers = computed(() => {
  const query = searchQuery.value.toLowerCase().trim();
  if (!query) return suppliers.value;
  return suppliers.value.filter(
    (s) =>
      s.name.toLowerCase().includes(query) ||
      s.taxId.toLowerCase().includes(query) ||
      s.contactPerson.toLowerCase().includes(query) ||
      s.email.toLowerCase().includes(query)
  );
});

function openModal() {
  formData.value = {
    taxId: "",
    name: "",
    contactPerson: "",
    email: "",
    phone: ""
  };
  formErrors.value = {};
  showCreateModal.value = true;
}

function validateForm() {
  const errors: Record<string, string> = {};
  if (!formData.value.taxId.trim()) errors.taxId = "El RUT o ID es obligatorio.";
  if (!formData.value.name.trim()) errors.name = "La razón social es obligatoria.";
  if (!formData.value.email.trim() || !formData.value.email.includes("@")) {
    errors.email = "Ingresa un correo electrónico válido.";
  }
  formErrors.value = errors;
  return Object.keys(errors).length === 0;
}

function handleSave() {
  if (!validateForm()) return;
  addSupplier({
    taxId: formData.value.taxId.trim(),
    name: formData.value.name.trim(),
    contactPerson: formData.value.contactPerson.trim(),
    email: formData.value.email.trim().toLowerCase(),
    phone: formData.value.phone.trim()
  });
  showCreateModal.value = false;
}
</script>

<template>
  <div class="view-container">
    <header class="view-header">
      <div>
        <p class="eyebrow">Cadena de Suministro</p>
        <h1 class="view-title">Proveedores</h1>
        <p class="view-subtitle">Directorio de empresas proveedoras y contactos de abastecimiento.</p>
      </div>
      <button type="button" class="primary-btn" @click="openModal">
        <span>+</span> Nuevo Proveedor
      </button>
    </header>

    <div class="toolbar">
      <div class="search-box">
        <span class="search-icon" aria-hidden="true">🔍</span>
        <input
          v-model="searchQuery"
          type="search"
          placeholder="Buscar por RUT, razón social o contacto..."
          aria-label="Buscar proveedores"
        />
      </div>
      <div class="toolbar-stats">
        <span>Total: <strong>{{ suppliers.length }}</strong> proveedores</span>
      </div>
    </div>

    <div class="table-card">
      <table class="data-table">
        <thead>
          <tr>
            <th>RUT / ID</th>
            <th>Razón Social</th>
            <th>Contacto Principal</th>
            <th>Correo Electrónico</th>
            <th>Teléfono</th>
            <th>Fecha Registro</th>
          </tr>
        </thead>
        <tbody v-if="filteredSuppliers.length > 0">
          <tr v-for="sup in filteredSuppliers" :key="sup.id">
            <td class="cell-mono">
              <strong>{{ sup.taxId }}</strong>
            </td>
            <td>
              <strong>{{ sup.name }}</strong>
            </td>
            <td>
              <span>{{ sup.contactPerson || "No especificado" }}</span>
            </td>
            <td>
              <a :href="'mailto:' + sup.email" class="link-text">{{ sup.email }}</a>
            </td>
            <td>
              <span class="cell-text-muted">{{ sup.phone || "—" }}</span>
            </td>
            <td>
              <span class="cell-text-muted">
                {{ new Date(sup.createdAt).toLocaleDateString("es-CL") }}
              </span>
            </td>
          </tr>
        </tbody>
        <tbody v-else>
          <tr>
            <td colspan="6" class="empty-table-cell">
              <div class="empty-table-state">
                <span class="empty-icon">🏭</span>
                <h3>No hay proveedores registrados</h3>
                <p>Registra tu primer proveedor para asociar órdenes de compra e inventario.</p>
                <button type="button" class="secondary-btn" @click="openModal">Registrar proveedor</button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Modal Registrar Proveedor -->
    <ModalDialog
      :show="showCreateModal"
      title="Registrar Nuevo Proveedor"
      subtitle="Ingresa la información comercial del proveedor para recepciones de compra."
      @close="showCreateModal = false"
    >
      <form @submit.prevent="handleSave" class="form-grid">
        <div class="form-group">
          <label for="sup-taxid">RUT / Identificador <span class="req">*</span></label>
          <input
            id="sup-taxid"
            v-model="formData.taxId"
            type="text"
            placeholder="Ej: 96.555.444-K"
            class="input-field"
            :class="{ 'input-error': formErrors.taxId }"
          />
          <small v-if="formErrors.taxId" class="error-text">{{ formErrors.taxId }}</small>
        </div>

        <div class="form-group">
          <label for="sup-name">Razón Social del Proveedor <span class="req">*</span></label>
          <input
            id="sup-name"
            v-model="formData.name"
            type="text"
            placeholder="Ej: Global Tech Imports Chile S.A."
            class="input-field"
            :class="{ 'input-error': formErrors.name }"
          />
          <small v-if="formErrors.name" class="error-text">{{ formErrors.name }}</small>
        </div>

        <div class="form-group">
          <label for="sup-contact">Persona de Contacto</label>
          <input
            id="sup-contact"
            v-model="formData.contactPerson"
            type="text"
            placeholder="Ej: Mariana Silva (Ejecutiva de Cuentas)"
            class="input-field"
          />
        </div>

        <div class="form-group-row">
          <div class="form-group">
            <label for="sup-email">Correo Electrónico <span class="req">*</span></label>
            <input
              id="sup-email"
              v-model="formData.email"
              type="email"
              placeholder="ventas@proveedor.cl"
              class="input-field"
              :class="{ 'input-error': formErrors.email }"
            />
            <small v-if="formErrors.email" class="error-text">{{ formErrors.email }}</small>
          </div>

          <div class="form-group">
            <label for="sup-phone">Teléfono</label>
            <input
              id="sup-phone"
              v-model="formData.phone"
              type="tel"
              placeholder="+56 2 2334 5566"
              class="input-field"
            />
          </div>
        </div>

        <div class="modal-actions">
          <button type="button" class="secondary-btn" @click="showCreateModal = false">
            Cancelar
          </button>
          <button type="submit" class="primary-btn">
            Guardar Proveedor
          </button>
        </div>
      </form>
    </ModalDialog>
  </div>
</template>

<style scoped>
.link-text {
  color: var(--green, #1b5d43);
  text-decoration: none;
}

.link-text:hover {
  text-decoration: underline;
}
</style>
