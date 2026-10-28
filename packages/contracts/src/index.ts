export type InfrastructureStatus = "ready" | "pending";

export interface DashboardSummary {
  infrastructure: InfrastructureStatus;
  customers: number;
  products: number;
  salesTotalMinor: number;
  stockUnits: number;
  lowStockCount: number;
  currency: "CLP";
  openShift?: boolean;
  cashInRegisterMinor?: number;
  updatedAt: string;
}

export interface ApiHealth {
  status: "ok";
  service: "nexora-api";
  timestamp: string;
}

// -------------------------------------------------------------
// Contacto Unificado (Patrón res.partner de Odoo)
// -------------------------------------------------------------

export interface Contact {
  id: string;
  taxId: string; // RUT / Identificador fiscal (ej. 76.123.456-7)
  name: string; // Razón Social o Nombre de Fantasía
  isCustomer: boolean; // ¿Es cliente?
  isSupplier: boolean; // ¿Es proveedor?
  contactPerson?: string; // Nombre del contacto directo
  email: string;
  phone: string;
  address?: string;
  city?: string;
  status: "active" | "inactive";
  notes?: string;
  createdAt: string;
}

// Compatibilidad retroactiva con vistas existentes
export type Customer = Contact;
export type Supplier = Contact;

// -------------------------------------------------------------
// Catálogo de Productos y Precios
// -------------------------------------------------------------

export interface Product {
  id: string;
  sku: string;
  name: string;
  category: string;
  priceMinor: number; // Precio de venta en CLP (entero)
  costMinor: number; // Costo de adquisición en CLP (entero)
  currentStock: number;
  minStock: number;
  location?: string; // Bodega / Estante (ej. "Bodega Central - Pasillo 2")
  status?: "active" | "archived";
  createdAt: string;
}

// -------------------------------------------------------------
// Trazabilidad de Inventario (Partida Doble / Ubicaciones)
// -------------------------------------------------------------

export type MovementType = "IN" | "OUT" | "TRANSFER" | "ADJUSTMENT";

export interface InventoryMovement {
  id: string;
  productId: string;
  productSku: string;
  productName: string;
  type: MovementType;
  sourceLocation: string; // ej: "PROVEEDORES", "BODEGA_CENTRAL", "MERMAS"
  destLocation: string; // ej: "BODEGA_CENTRAL", "CLIENTES", "SUCURSAL_1"
  quantity: number;
  unitCostMinor?: number;
  reason: string;
  referenceDoc?: string; // ej: "VEN-001", "OC-102", "GUIA-504"
  performedBy: string;
  createdAt: string;
}

// -------------------------------------------------------------
// Ventas y Ciclo de Documentos (Inspirado en ERPNext)
// -------------------------------------------------------------

export type PaymentMethod = "CASH" | "DEBIT" | "CREDIT" | "TRANSFER";
export type SaleStatus = "DRAFT" | "COMPLETED" | "CANCELLED";

export interface SaleItem {
  productId: string;
  productSku: string;
  productName: string;
  quantity: number;
  unitPriceMinor: number;
  subtotalMinor: number;
}

export interface Sale {
  id: string; // ej: "VEN-001"
  customerId: string;
  customerName: string;
  items: SaleItem[];
  subtotalMinor: number;
  taxMinor: number; // IVA u otro tributo local (19% o configurable)
  totalMinor: number;
  paymentMethod: PaymentMethod;
  shiftId?: string; // ID del arqueo de caja asociado
  status: SaleStatus;
  notes?: string;
  createdAt: string;
}

// -------------------------------------------------------------
// Control de Caja y Arqueo Diario (Cash Shift)
// -------------------------------------------------------------

export type ShiftStatus = "OPEN" | "CLOSED";

export interface CashShift {
  id: string;
  openedAt: string;
  closedAt?: string;
  openedBy: string;
  closedBy?: string;
  initialCashMinor: number; // Saldo base de apertura
  cashSalesMinor: number; // Total ventas en efectivo
  cardSalesMinor: number; // Total ventas tarjetas (Débito/Crédito)
  transferSalesMinor: number; // Total ventas transferencia
  cashOutMinor: number; // Egresos o gastos menores de caja
  expectedCashMinor: number; // initialCash + cashSales - cashOut
  actualCashMinor?: number; // Dinero real contado al cierre
  differenceMinor?: number; // actualCash - expectedCash (sobrante o faltante)
  status: ShiftStatus;
  notes?: string;
}

// -------------------------------------------------------------
// Configuración de la Empresa Pyme
// -------------------------------------------------------------

export interface CompanySettings {
  legalName: string;
  commercialName?: string;
  taxId: string; // RUT de la empresa
  activity?: string; // Giro comercial
  email: string;
  phone: string;
  address: string;
  city?: string;
  currency: "CLP";
  taxRatePercent: number; // ej: 19 para IVA en Chile
  nextSaleFolio: number;
  updatedAt: string;
}

// -------------------------------------------------------------
// Auditoría y Notificaciones
// -------------------------------------------------------------

export interface AuditLogEntry {
  id: string;
  actor: string;
  action: string;
  entity: string;
  entityId: string;
  details: string;
  timestamp: string;
}

export interface ToastMessage {
  id: string;
  type: "success" | "error" | "warning" | "info";
  title: string;
  message: string;
}

