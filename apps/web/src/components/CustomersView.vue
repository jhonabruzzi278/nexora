<script setup lang="ts">
import { ref, computed } from "vue";
import { useErpStore } from "../composables/useErpStore";
import ModalDialog from "./ModalDialog.vue";

const { customers, addCustomer } = useErpStore();

const searchQuery = ref("");
const showCreateModal = ref(false);

const formData = ref({
  taxId: "",
  name: "",
  email: "",
  phone: "",
  address: "",
  status: "active" as "active" | "inactive"
});

const formErrors = ref<Record<string, string>>({});

const filteredCustomers = computed(() => {
  const query = searchQuery.value.toLowerCase().trim();
  if (!query) return customers.value;
  return customers.value.filter(
    (c) =>
      c.name.toLowerCase().includes(query) ||
      c.taxId.toLowerCase().includes(query) ||
      c.email.toLowerCase().includes(query)
  );
});

function openModal() {
  formData.value = {
    taxId: "",
    name: "",
    email: "",
    phone: "",
    address: "",
    status: "active"
  };
  formErrors.value = {};
  showCreateModal.value = true;
}

function validateForm() {
  const errors: Record<string, string> = {};
  if (!formData.value.taxId.trim()) {
    errors.taxId = "El RUT o Identificador es obligatorio.";
  }
  if (!formData.value.name.trim()) {
    errors.name = "La razón social o nombre es obligatorio.";
  }
  if (!formData.value.email.trim() || !formData.value.email.includes("@")) {
    errors.email = "Ingresa un correo electrónico válido.";
  }
  formErrors.value = errors;
  return Object.keys(errors).length === 0;
}

function handleSave() {
  if (!validateForm()) return;
  addCustomer({
    taxId: formData.value.taxId.trim(),
    name: formData.value.name.trim(),
    email: formData.value.email.trim().toLowerCase(),
    phone: formData.value.phone.trim(),
    address: formData.value.address.trim(),
    status: formData.value.status
  });
  showCreateModal.value = false;
}
</script>

<template>
  <div class="view-container">
    <header class="view-header">
      <div>
        <p class="eyebrow">Directorio Comercial</p>
        <h1 class="view-title">Clientes</h1>
        <p class="view-subtitle">Administra los clientes y empresas registradas en el sistema.</p>
      </div>
      <button type="button" class="primary-btn" @click="openModal">
        <span>+</span> Nuevo Cliente
      </button>
    </header>

    <div class="toolbar">
      <div class="search-box">
        <span class="search-icon" aria-hidden="true">🔍</span>
        <input
          v-model="searchQuery"
          type="search"
          placeholder="Buscar por RUT, razón social o correo..."
          aria-label="Buscar clientes"
        />
      </div>
      <div class="toolbar-stats">
        <span>Total: <strong>{{ customers.length }}</strong> clientes</span>
      </div>
    </div>

    <div class="table-card">
      <table class="data-table">
        <thead>
          <tr>
            <th>RUT / ID</th>
            <th>Razón Social / Nombre</th>
            <th>Contacto</th>
            <th>Ubicación</th>
            <th>Estado</th>
            <th>Registrado</th>
          </tr>
        </thead>
        <tbody v-if="filteredCustomers.length > 0">
          <tr v-for="customer in filteredCustomers" :key="customer.id">
            <td class="cell-mono">
              <strong>{{ customer.taxId }}</strong>
            </td>
            <td>
              <div class="customer-name-cell">
                <span class="avatar-mark">{{ customer.name.charAt(0).toUpperCase() }}</span>
                <span>{{ customer.name }}</span>
              </div>
            </td>
            <td>
              <div class="contact-info">
                <a :href="'mailto:' + customer.email">{{ customer.email }}</a>
                <small v-if="customer.phone">{{ customer.phone }}</small>
              </div>
            </td>
            <td>
              <span class="cell-text-muted">{{ customer.address || "No especificada" }}</span>
            </td>
            <td>
              <span class="badge" :class="customer.status === 'active' ? 'badge-success' : 'badge-neutral'">
                {{ customer.status === 'active' ? 'Activo' : 'Inactivo' }}
              </span>
            </td>
            <td>
              <span class="cell-text-muted">
                {{ new Date(customer.createdAt).toLocaleDateString("es-CL") }}
              </span>
            </td>
          </tr>
        </tbody>
        <tbody v-else>
          <tr>
            <td colspan="6" class="empty-table-cell">
              <div class="empty-table-state">
                <span class="empty-icon">👥</span>
                <h3>No se encontraron clientes</h3>
                <p>Prueba cambiando el término de búsqueda o registra un nuevo cliente.</p>
                <button type="button" class="secondary-btn" @click="openModal">Registrar cliente ahora</button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Modal Registrar Cliente -->
    <ModalDialog
      :show="showCreateModal"
      title="Registrar Nuevo Cliente"
      subtitle="Ingresa los datos comerciales del cliente para emitir ventas y registrar documentos."
      @close="showCreateModal = false"
    >
      <form @submit.prevent="handleSave" class="form-grid">
        <div class="form-group">
          <label for="cust-taxid">RUT / Identificador Tributario <span class="req">*</span></label>
          <input
            id="cust-taxid"
            v-model="formData.taxId"
            type="text"
            placeholder="Ej: 76.123.456-7"
            class="input-field"
            :class="{ 'input-error': formErrors.taxId }"
          />
          <small v-if="formErrors.taxId" class="error-text">{{ formErrors.taxId }}</small>
        </div>

        <div class="form-group">
          <label for="cust-name">Razón Social / Nombre Completo <span class="req">*</span></label>
          <input
            id="cust-name"
            v-model="formData.name"
            type="text"
            placeholder="Ej: Distribuidora Los Andes SpA"
            class="input-field"
            :class="{ 'input-error': formErrors.name }"
          />
          <small v-if="formErrors.name" class="error-text">{{ formErrors.name }}</small>
        </div>

        <div class="form-group-row">
          <div class="form-group">
            <label for="cust-email">Correo Electrónico <span class="req">*</span></label>
            <input
              id="cust-email"
              v-model="formData.email"
              type="email"
              placeholder="contacto@empresa.cl"
              class="input-field"
              :class="{ 'input-error': formErrors.email }"
            />
            <small v-if="formErrors.email" class="error-text">{{ formErrors.email }}</small>
          </div>

          <div class="form-group">
            <label for="cust-phone">Teléfono de Contacto</label>
            <input
              id="cust-phone"
              v-model="formData.phone"
              type="tel"
              placeholder="+56 9 8765 4321"
              class="input-field"
            />
          </div>
        </div>

        <div class="form-group">
          <label for="cust-address">Dirección Comercial</label>
          <input
            id="cust-address"
            v-model="formData.address"
            type="text"
            placeholder="Ej: Av. Providencia 1234, Of. 501"
            class="input-field"
          />
        </div>

        <div class="modal-actions">
          <button type="button" class="secondary-btn" @click="showCreateModal = false">
            Cancelar
          </button>
          <button type="submit" class="primary-btn">
            Guardar Cliente
          </button>
        </div>
      </form>
    </ModalDialog>
  </div>
</template>

<style scoped>
.customer-name-cell {
  display: flex;
  align-items: center;
  gap: 10px;
  font-weight: 600;
}

.avatar-mark {
  width: 28px;
  height: 28px;
  border-radius: 8px;
  background: #e2ece6;
  color: var(--green, #1b5d43);
  display: grid;
  place-items: center;
  font-size: 12px;
  font-weight: 700;
}

.contact-info {
  display: grid;
  gap: 2px;
  font-size: 13px;
}

.contact-info a {
  color: var(--green, #1b5d43);
  text-decoration: none;
}

.contact-info a:hover {
  text-decoration: underline;
}

.contact-info small {
  color: var(--muted, #69736d);
}
</style>
