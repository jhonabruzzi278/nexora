<script setup lang="ts">
import { ref, computed } from "vue";
import { useErpStore } from "../composables/useErpStore";
import ModalDialog from "./ModalDialog.vue";

const {
  currentShift,
  sales,
  formatCurrency,
  openCashShift,
  closeCashShift
} = useErpStore();

const showOpenModal = ref(false);
const showCloseModal = ref(false);

const openForm = ref({
  initialCash: 50000,
  openedBy: "Admin"
});

const closeForm = ref({
  actualCash: 0,
  closedBy: "Admin",
  notes: ""
});

const expectedCash = computed(() => {
  return currentShift.value?.expectedCashMinor ?? 0;
});

const calculatedDifference = computed(() => {
  return (closeForm.value.actualCash || 0) - expectedCash.value;
});

function handleOpenShift() {
  openCashShift(openForm.value.initialCash, openForm.value.openedBy);
  showOpenModal.value = false;
}

function prepareCloseModal() {
  closeForm.value = {
    actualCash: expectedCash.value,
    closedBy: currentShift.value?.openedBy || "Admin",
    notes: ""
  };
  showCloseModal.value = true;
}

function handleCloseShift() {
  closeCashShift(
    closeForm.value.actualCash,
    closeForm.value.closedBy,
    closeForm.value.notes
  );
  showCloseModal.value = false;
}
</script>

<template>
  <div class="view-container">
    <header class="view-header">
      <div>
        <p class="eyebrow">Control de Tesorería</p>
        <h1 class="view-title">Arqueo y Sesión de Caja</h1>
        <p class="view-subtitle">Apertura diaria, control de efectivo en gaveta y cierre con balance de medios de pago.</p>
      </div>

      <div class="header-actions">
        <button
          v-if="!currentShift"
          type="button"
          class="primary-btn"
          @click="showOpenModal = true"
        >
          + Iniciar Turno de Caja
        </button>
        <button
          v-else
          type="button"
          class="danger-btn"
          @click="prepareCloseModal"
        >
          Realizar Arqueo y Cerrar Caja
        </button>
      </div>
    </header>

    <!-- Estado Actual de la Caja -->
    <section v-if="currentShift" class="shift-active-panel">
      <div class="shift-banner">
        <div class="status-indicator">
          <span class="pulsing-dot"></span>
          <div>
            <span class="status-label">Caja Abierta · Turno en Curso</span>
            <small>Iniciado por {{ currentShift.openedBy }} a las {{ new Date(currentShift.openedAt).toLocaleTimeString("es-CL") }}</small>
          </div>
        </div>
        <div class="shift-badge-box">
          <span class="badge-title">Efectivo Total en Gaveta</span>
          <strong class="badge-amount">{{ formatCurrency(expectedCash) }}</strong>
        </div>
      </div>

      <div class="metric-row">
        <div class="metric">
          <span>Saldo Base Inicial</span>
          <strong>{{ formatCurrency(currentShift.initialCashMinor) }}</strong>
          <small>Fondo de cambio</small>
        </div>
        <div class="metric">
          <span>Ventas en Efectivo</span>
          <strong style="color: #166534;">+ {{ formatCurrency(currentShift.cashSalesMinor) }}</strong>
          <small>Recaudación en caja</small>
        </div>
        <div class="metric">
          <span>Ventas con Tarjetas</span>
          <strong>{{ formatCurrency(currentShift.cardSalesMinor) }}</strong>
          <small>Débito y Crédito (POS)</small>
        </div>
        <div class="metric">
          <span>Transferencias</span>
          <strong>{{ formatCurrency(currentShift.transferSalesMinor) }}</strong>
          <small>Bancos en línea</small>
        </div>
      </div>
    </section>

    <!-- Caja Cerrada -->
    <section v-else class="shift-closed-panel">
      <div class="empty-shift-content">
        <div class="empty-icon-circle">🔒</div>
        <h2>La caja se encuentra cerrada</h2>
        <p>Inicia el turno de caja para ingresar el saldo base y registrar ventas en efectivo de la jornada.</p>
        <button type="button" class="primary-btn" @click="showOpenModal = true">
          Abrir Turno de Caja Ahora
        </button>
      </div>
    </section>

    <!-- Desglose de Ventas del Turno -->
    <section class="section-card" style="margin-top: 24px;">
      <div class="section-card-header">
        <div>
          <h3>Órdenes Registradas en el Turno</h3>
          <p class="section-card-subtitle">Movimientos y comprobantes de la jornada</p>
        </div>
      </div>

      <div v-if="sales.length > 0">
        <table class="data-table">
          <thead>
            <tr>
              <th>Folio</th>
              <th>Cliente</th>
              <th>Medio de Pago</th>
              <th>Hora</th>
              <th class="text-right">Total</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="sale in sales.slice(0, 10)" :key="sale.id">
              <td class="cell-mono"><strong>{{ sale.id }}</strong></td>
              <td>{{ sale.customerName }}</td>
              <td>
                <span class="payment-tag" :class="sale.paymentMethod.toLowerCase()">
                  {{ sale.paymentMethod === 'CASH' ? '💵 Efectivo' : sale.paymentMethod === 'DEBIT' ? '💳 Débito' : sale.paymentMethod === 'CREDIT' ? '💳 Crédito' : '📱 Transferencia' }}
                </span>
              </td>
              <td class="cell-text-muted">{{ new Date(sale.createdAt).toLocaleTimeString("es-CL") }}</td>
              <td class="text-right"><strong>{{ formatCurrency(sale.totalMinor) }}</strong></td>
            </tr>
          </tbody>
        </table>
      </div>
      <div v-else class="empty-state">
        <p>No se han emitido ventas en este turno aún.</p>
      </div>
    </section>

    <!-- MODAL: Apertura de Caja -->
    <ModalDialog
      :show="showOpenModal"
      title="Apertura de Turno de Caja"
      subtitle="Ingresa el fondo inicial de sencillo para comenzar la atención."
      @close="showOpenModal = false"
    >
      <form @submit.prevent="handleOpenShift" class="form-grid">
        <div class="form-group">
          <label for="shift-init">Fondo Base en Efectivo ($ CLP) <span class="req">*</span></label>
          <input
            id="shift-init"
            v-model.number="openForm.initialCash"
            type="number"
            min="0"
            step="1000"
            class="input-field"
            required
          />
          <small class="helper-text">Monto en billetes y monedas disponible para dar vuelto.</small>
        </div>

        <div class="form-group">
          <label for="shift-opener">Cajero / Responsable <span class="req">*</span></label>
          <input
            id="shift-opener"
            v-model="openForm.openedBy"
            type="text"
            class="input-field"
            required
          />
        </div>

        <div class="modal-form-actions">
          <button type="button" class="secondary-btn" @click="showOpenModal = false">
            Cancelar
          </button>
          <button type="submit" class="primary-btn">
            Confirmar Apertura
          </button>
        </div>
      </form>
    </ModalDialog>

    <!-- MODAL: Arqueo y Cierre -->
    <ModalDialog
      :show="showCloseModal"
      title="Arqueo y Cierre de Caja"
      subtitle="Cuenta el dinero en físico y compáralo con el saldo calculado por el sistema."
      @close="showCloseModal = false"
    >
      <form @submit.prevent="handleCloseShift" class="form-grid">
        <div class="arqueo-summary-box">
          <div class="arqueo-row">
            <span>Saldo Base:</span>
            <strong>{{ formatCurrency(currentShift?.initialCashMinor || 0) }}</strong>
          </div>
          <div class="arqueo-row">
            <span>Ventas en Efectivo:</span>
            <strong>+ {{ formatCurrency(currentShift?.cashSalesMinor || 0) }}</strong>
          </div>
          <div class="arqueo-row highlight">
            <span>Efectivo Esperado en Gaveta:</span>
            <strong>{{ formatCurrency(expectedCash) }}</strong>
          </div>
        </div>

        <div class="form-group">
          <label for="shift-actual">Efectivo Real Contado ($ CLP) <span class="req">*</span></label>
          <input
            id="shift-actual"
            v-model.number="closeForm.actualCash"
            type="number"
            min="0"
            class="input-field"
            required
          />
        </div>

        <!-- Indicador de Diferencia en Vivo -->
        <div
          class="diff-indicator"
          :class="{
            exact: calculatedDifference === 0,
            surplus: calculatedDifference > 0,
            deficit: calculatedDifference < 0
          }"
        >
          <span v-if="calculatedDifference === 0">✓ Caja Cuadrada (Diferencia: $0)</span>
          <span v-else-if="calculatedDifference > 0">▲ Sobrante en caja: {{ formatCurrency(calculatedDifference) }}</span>
          <span v-else>▼ Faltante en caja: {{ formatCurrency(Math.abs(calculatedDifference)) }}</span>
        </div>

        <div class="form-group">
          <label for="shift-notes">Observaciones del Cierre</label>
          <textarea
            id="shift-notes"
            v-model="closeForm.notes"
            rows="2"
            class="input-field"
            placeholder="Comentarios o justificación de descuadres..."
          ></textarea>
        </div>

        <div class="modal-form-actions">
          <button type="button" class="secondary-btn" @click="showCloseModal = false">
            Cancelar
          </button>
          <button type="submit" class="danger-btn">
            Confirmar y Cerrar Turno
          </button>
        </div>
      </form>
    </ModalDialog>
  </div>
</template>

<style scoped>
.shift-active-panel {
  background: white;
  border: 1px solid var(--line, #d9ddd5);
  border-radius: 16px;
  padding: 24px;
  margin-bottom: 24px;
}

.shift-banner {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-bottom: 20px;
  margin-bottom: 20px;
  border-bottom: 1px solid var(--line, #d9ddd5);
}

.status-indicator {
  display: flex;
  align-items: center;
  gap: 12px;
}

.pulsing-dot {
  width: 12px;
  height: 12px;
  background: #16a34a;
  border-radius: 50%;
  box-shadow: 0 0 0 0 rgba(22, 163, 74, 0.7);
  animation: pulse-green 2s infinite;
}

@keyframes pulse-green {
  0% {
    transform: scale(0.95);
    box-shadow: 0 0 0 0 rgba(22, 163, 74, 0.7);
  }
  70% {
    transform: scale(1);
    box-shadow: 0 0 0 10px rgba(22, 163, 74, 0);
  }
  100% {
    transform: scale(0.95);
    box-shadow: 0 0 0 0 rgba(22, 163, 74, 0);
  }
}

.status-label {
  display: block;
  font-size: 16px;
  font-weight: 700;
  color: var(--ink, #17211d);
}

.shift-badge-box {
  text-align: right;
}

.badge-title {
  display: block;
  font-size: 12px;
  color: var(--muted, #69736d);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.badge-amount {
  font-size: 24px;
  font-weight: 800;
  color: #166534;
}

.shift-closed-panel {
  background: white;
  border: 1px dashed var(--line, #d9ddd5);
  border-radius: 16px;
  padding: 48px 24px;
  text-align: center;
}

.empty-shift-content {
  max-width: 440px;
  margin: 0 auto;
}

.empty-icon-circle {
  width: 56px;
  height: 56px;
  background: #f3f4f6;
  border-radius: 50%;
  display: grid;
  place-items: center;
  font-size: 24px;
  margin: 0 auto 16px;
}

.empty-shift-content h2 {
  font-size: 20px;
  font-weight: 700;
  margin: 0 0 8px;
}

.empty-shift-content p {
  color: var(--muted, #69736d);
  font-size: 14px;
  margin-bottom: 20px;
}

.payment-tag {
  display: inline-block;
  padding: 3px 8px;
  border-radius: 6px;
  font-size: 12px;
  font-weight: 600;
  background: #f1f5f9;
  color: #334155;
}

.payment-tag.cash {
  background: #dcfce7;
  color: #166534;
}

.payment-tag.debit,
.payment-tag.credit {
  background: #e0f2fe;
  color: #0369a1;
}

.payment-tag.transfer {
  background: #fef3c7;
  color: #92400e;
}

.arqueo-summary-box {
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  padding: 14px 16px;
  margin-bottom: 16px;
}

.arqueo-row {
  display: flex;
  justify-content: space-between;
  font-size: 13px;
  padding: 4px 0;
  color: #475569;
}

.arqueo-row.highlight {
  border-top: 1px solid #cbd5e1;
  margin-top: 6px;
  padding-top: 8px;
  font-size: 14px;
  font-weight: 700;
  color: #0f172a;
}

.diff-indicator {
  padding: 10px 14px;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 600;
  text-align: center;
  margin-bottom: 14px;
}

.diff-indicator.exact {
  background: #dcfce7;
  color: #166534;
  border: 1px solid #86efac;
}

.diff-indicator.surplus {
  background: #e0f2fe;
  color: #0369a1;
  border: 1px solid #7dd3fc;
}

.diff-indicator.deficit {
  background: #fee2e2;
  color: #991b1b;
  border: 1px solid #fca5a5;
}

.danger-btn {
  background: #dc2626;
  color: white;
  border: none;
  border-radius: 8px;
  padding: 10px 18px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: background 150ms ease;
}

.danger-btn:hover {
  background: #b91c1c;
}

.modal-form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  margin-top: 20px;
}
</style>
