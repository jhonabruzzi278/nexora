export type InfrastructureStatus = "ready" | "pending";

export interface DashboardSummary {
  infrastructure: InfrastructureStatus;
  customers: number;
  products: number;
  salesTotalMinor: number;
  stockUnits: number;
  lowStockCount: number;
  currency: "CLP";
  updatedAt: string;
}

export interface ApiHealth {
  status: "ok";
  service: "nexora-api";
  timestamp: string;
}

// -------------------------------------------------------------
// Modelos del Dominio ERP MVP
// -------------------------------------------------------------

export interface Customer {
  id: string;
  taxId: string; // RUT / Identificador tributario
  name: string;
  email: string;
  phone: string;
  address?: string;
  status: "active" | "inactive";
  createdAt: string;
}

export interface Product {
  id: string;
  sku: string;
  name: string;
  category: string;
  priceMinor: number; // Guardado en CLP (entero)
  costMinor: number; // Costo unitario en CLP (entero)
  currentStock: number;
  minStock: number;
  createdAt: string;
}

export interface Supplier {
  id: string;
  taxId: string; // RUT
  name: string;
  contactPerson: string;
  email: string;
  phone: string;
  createdAt: string;
}

export type MovementType = "IN" | "OUT" | "ADJUSTMENT";

export interface InventoryMovement {
  id: string;
  productId: string;
  productName: string;
  type: MovementType;
  quantity: number;
  reason: string;
  performedBy: string;
  createdAt: string;
}

export interface SaleItem {
  productId: string;
  productSku: string;
  productName: string;
  quantity: number;
  unitPriceMinor: number;
  subtotalMinor: number;
}

export interface Sale {
  id: string;
  customerId: string;
  customerName: string;
  items: SaleItem[];
  totalMinor: number;
  status: "COMPLETED" | "CANCELLED";
  createdAt: string;
}

export interface CompanySettings {
  legalName: string;
  taxId: string;
  email: string;
  phone: string;
  address: string;
  currency: "CLP";
  updatedAt: string;
}

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
