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
