<script setup lang="ts">
import { ref } from "vue";
import { useErpStore } from "../composables/useErpStore";

const { settings, updateSettings } = useErpStore();

const formData = ref({
  legalName: settings.value.legalName,
  taxId: settings.value.taxId,
  email: settings.value.email,
  phone: settings.value.phone,
  address: settings.value.address,
  currency: settings.value.currency
});

const isSaved = ref(false);

function handleSave() {
  updateSettings({
    legalName: formData.value.legalName.trim(),
    taxId: formData.value.taxId.trim(),
    email: formData.value.email.trim(),
    phone: formData.value.phone.trim(),
    address: formData.value.address.trim()
  });
  isSaved.value = true;
  setTimeout(() => {
    isSaved.value = false;
  }, 3000);
}
</script>

<template>
  <div class="view-container">
    <header class="view-header">
      <div>
        <p class="eyebrow">Administración del Sistema</p>
        <h1 class="view-title">Configuración de Empresa</h1>
        <p class="view-subtitle">Datos de la razón social, identificador tributario y parámetros regionales.</p>
      </div>
    </header>

    <div class="settings-card">
      <form @submit.prevent="handleSave" class="form-grid">
        <div class="form-section-title">
          <h3>Información Legal y Tributaria</h3>
          <p>Estos datos aparecen en las órdenes de venta y comprobantes generados.</p>
        </div>

        <div class="form-group-row">
          <div class="form-group">
            <label for="set-legalname">Razón Social <span class="req">*</span></label>
            <input
              id="set-legalname"
              v-model="formData.legalName"
              type="text"
              class="input-field"
              required
            />
          </div>

          <div class="form-group">
            <label for="set-taxid">RUT Empresa <span class="req">*</span></label>
            <input
              id="set-taxid"
              v-model="formData.taxId"
              type="text"
              class="input-field cell-mono"
              required
            />
          </div>
        </div>

        <div class="form-group-row">
          <div class="form-group">
            <label for="set-email">Correo Electrónico Comercial</label>
            <input
              id="set-email"
              v-model="formData.email"
              type="email"
              class="input-field"
              required
            />
          </div>

          <div class="form-group">
            <label for="set-phone">Teléfono de Contacto</label>
            <input
              id="set-phone"
              v-model="formData.phone"
              type="tel"
              class="input-field"
            />
          </div>
        </div>

        <div class="form-group">
          <label for="set-address">Dirección Casa Matriz</label>
          <input
            id="set-address"
            v-model="formData.address"
            type="text"
            class="input-field"
          />
        </div>

        <div class="form-section-title" style="margin-top: 16px;">
          <h3>Parámetros Regionales</h3>
          <p>Configuración fija del entorno MVP.</p>
        </div>

        <div class="form-group-row">
          <div class="form-group">
            <label>Moneda Operacional</label>
            <input type="text" value="CLP (Pesos Chilenos - Sin Decimales)" class="input-field" disabled />
          </div>

          <div class="form-group">
            <label>Partición de Base de Datos</label>
            <input type="text" value="TENANT#demo (Modo Local DynamoDB)" class="input-field cell-mono" disabled />
          </div>
        </div>

        <div class="settings-actions">
          <span v-if="isSaved" class="save-indicator">✓ Cambios guardados correctamente</span>
          <button type="submit" class="primary-btn">
            Guardar Configuración
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<style scoped>
.settings-card {
  background: white;
  border: 1px solid var(--line, #d9ddd5);
  border-radius: 16px;
  padding: 32px;
  max-width: 780px;
}

.form-section-title {
  margin-bottom: 8px;
}

.form-section-title h3 {
  margin: 0 0 4px;
  font-size: 16px;
  color: var(--ink, #17211d);
}

.form-section-title p {
  margin: 0;
  font-size: 13px;
  color: var(--muted, #69736d);
}

.settings-actions {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 16px;
  margin-top: 24px;
  padding-top: 20px;
  border-top: 1px solid var(--line, #d9ddd5);
}

.save-indicator {
  color: #166534;
  font-size: 13px;
  font-weight: 600;
}
</style>
