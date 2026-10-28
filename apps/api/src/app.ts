import cors from "@fastify/cors";
import Fastify from "fastify";
import type {
  ApiHealth,
  Contact,
  Product,
  InventoryMovement,
  Sale,
  CashShift,
  CompanySettings
} from "@nexora/contracts";
import { loadConfig, type AppConfig } from "./config.js";
import {
  createDynamoContext,
  readDashboard,
  getCompanySettings,
  saveCompanySettings,
  listContacts,
  saveContact,
  getContact,
  listProducts,
  saveProduct,
  getProduct,
  listMovements,
  recordMovement,
  listSales,
  recordSale,
  getCurrentShift,
  openShift,
  closeShift
} from "./dynamo.js";

export interface BuildAppOptions {
  config?: AppConfig;
  logger?: boolean;
}

export async function buildApp(options: BuildAppOptions = {}) {
  const config = options.config ?? loadConfig();
  const dynamo = createDynamoContext(config);
  const app = Fastify({
    logger: options.logger ?? true,
    requestIdHeader: "x-request-id"
  });

  await app.register(cors, {
    origin: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"]
  });

  // Healthcheck liviano (no depende de DynamoDB para cold start rápido)
  app.get("/health", async (): Promise<ApiHealth> => ({
    status: "ok",
    service: "nexora-api",
    timestamp: new Date().toISOString()
  }));

  // -----------------------------------------------------------
  // 1. Dashboard Resumen
  // -----------------------------------------------------------
  app.get("/api/v1/dashboard", async (_request, reply) => {
    try {
      return await readDashboard(dynamo, config);
    } catch (error) {
      app.log.error({ error }, "Error al leer el resumen del dashboard");
      return reply.code(503).send({
        code: "INFRASTRUCTURE_UNAVAILABLE",
        message: "No fue posible conectar con DynamoDB"
      });
    }
  });

  // -----------------------------------------------------------
  // 2. Configuración de Empresa
  // -----------------------------------------------------------
  app.get("/api/v1/company", async () => {
    return await getCompanySettings(dynamo, config);
  });

  app.put<{ Body: Partial<CompanySettings> }>("/api/v1/company", async (request) => {
    return await saveCompanySettings(dynamo, config, request.body);
  });

  // -----------------------------------------------------------
  // 3. Contactos Unificados (Clientes y Proveedores - Odoo res.partner)
  // -----------------------------------------------------------
  app.get<{ Querystring: { type?: "customer" | "supplier" } }>("/api/v1/contacts", async (request) => {
    const all = await listContacts(dynamo, config);
    if (request.query.type === "customer") {
      return all.filter((c) => c.isCustomer);
    }
    if (request.query.type === "supplier") {
      return all.filter((c) => c.isSupplier);
    }
    return all;
  });

  app.post<{ Body: Omit<Contact, "id" | "createdAt"> & { id?: string } }>("/api/v1/contacts", async (request) => {
    const now = new Date().toISOString();
    const contact: Contact = {
      ...request.body,
      id: request.body.id ?? "cont-" + Math.random().toString(36).substring(2, 8),
      createdAt: now
    };
    return await saveContact(dynamo, config, contact);
  });

  app.get<{ Params: { id: string } }>("/api/v1/contacts/:id", async (request, reply) => {
    const contact = await getContact(dynamo, config, request.params.id);
    if (!contact) {
      return reply.code(404).send({ code: "NOT_FOUND", message: "Contacto no encontrado" });
    }
    return contact;
  });

  // -----------------------------------------------------------
  // 4. Catálogo de Productos e Inventario
  // -----------------------------------------------------------
  app.get("/api/v1/products", async () => {
    return await listProducts(dynamo, config);
  });

  app.post<{ Body: Omit<Product, "id" | "createdAt"> & { id?: string } }>("/api/v1/products", async (request) => {
    const now = new Date().toISOString();
    const product: Product = {
      ...request.body,
      id: request.body.id ?? "prod-" + Math.random().toString(36).substring(2, 8),
      sku: request.body.sku.trim().toUpperCase(),
      createdAt: now
    };
    return await saveProduct(dynamo, config, product);
  });

  app.get<{ Params: { id: string } }>("/api/v1/products/:id", async (request, reply) => {
    const prod = await getProduct(dynamo, config, request.params.id);
    if (!prod) {
      return reply.code(404).send({ code: "NOT_FOUND", message: "Producto no encontrado" });
    }
    return prod;
  });

  // -----------------------------------------------------------
  // 5. Movimientos de Inventario (Partida Doble)
  // -----------------------------------------------------------
  app.get<{ Querystring: { limit?: string } }>("/api/v1/inventory/movements", async (request) => {
    const limit = request.query.limit ? parseInt(request.query.limit, 10) : 50;
    return await listMovements(dynamo, config, limit);
  });

  app.post<{ Body: Omit<InventoryMovement, "id" | "createdAt"> & { id?: string } }>("/api/v1/inventory/movements", async (request) => {
    const now = new Date().toISOString();
    const movement: InventoryMovement = {
      ...request.body,
      id: request.body.id ?? "mov-" + Math.random().toString(36).substring(2, 8),
      createdAt: now
    };
    return await recordMovement(dynamo, config, movement);
  });

  // -----------------------------------------------------------
  // 6. Ventas y Ciclo de Documentos
  // -----------------------------------------------------------
  app.get<{ Querystring: { limit?: string } }>("/api/v1/sales", async (request) => {
    const limit = request.query.limit ? parseInt(request.query.limit, 10) : 50;
    return await listSales(dynamo, config, limit);
  });

  app.post<{ Body: Partial<Sale> & { items?: SaleItem[] } }>("/api/v1/sales", async (request) => {
    const now = new Date().toISOString();
    const body = request.body;

    const items: SaleItem[] = (body.items || []).map((item) => {
      const quantity = Number(item.quantity) || 1;
      const unitPriceMinor = Number(item.unitPriceMinor) || 0;
      const subtotalMinor = item.subtotalMinor !== undefined ? Number(item.subtotalMinor) : (quantity * unitPriceMinor);
      return {
        productId: item.productId || "prod-unknown",
        productSku: item.productSku || "SKU-GEN",
        productName: item.productName || "Producto",
        quantity,
        unitPriceMinor,
        subtotalMinor
      };
    });

    const calculatedTotal = items.reduce((sum, item) => sum + item.subtotalMinor, 0);
    const totalMinor = body.totalMinor !== undefined ? Number(body.totalMinor) : calculatedTotal;
    const taxRate = 0.19;
    const subtotalMinor = body.subtotalMinor !== undefined ? Number(body.subtotalMinor) : Math.round(totalMinor / (1 + taxRate));
    const taxMinor = body.taxMinor !== undefined ? Number(body.taxMinor) : (totalMinor - subtotalMinor);

    const sale: Sale = {
      id: body.id ?? "VEN-" + Math.floor(1000 + Math.random() * 9000),
      customerId: body.customerId ?? "default-customer",
      customerName: body.customerName ?? "Cliente Mostrador",
      items,
      subtotalMinor,
      taxMinor,
      totalMinor,
      paymentMethod: body.paymentMethod ?? "CASH",
      status: body.status ?? "COMPLETED",
      shiftId: body.shiftId,
      notes: body.notes,
      createdAt: now
    };

    return await recordSale(dynamo, config, sale);
  });

  // -----------------------------------------------------------
  // 7. Arqueo y Control de Turnos de Caja (Cash Shift)
  // -----------------------------------------------------------
  app.get("/api/v1/cash-shifts/current", async () => {
    const shift = await getCurrentShift(dynamo, config);
    return shift ?? { status: "CLOSED" };
  });

  app.post<{ Body: { initialCashMinor: number; openedBy: string } }>("/api/v1/cash-shifts/open", async (request, reply) => {
    const existing = await getCurrentShift(dynamo, config);
    if (existing && existing.status === "OPEN") {
      return reply.code(400).send({ code: "SHIFT_ALREADY_OPEN", message: "Ya existe un turno de caja abierto" });
    }

    const newShift: CashShift = {
      id: "shift-" + Math.random().toString(36).substring(2, 8),
      openedAt: new Date().toISOString(),
      openedBy: request.body.openedBy || "Cajero",
      initialCashMinor: request.body.initialCashMinor || 0,
      cashSalesMinor: 0,
      cardSalesMinor: 0,
      transferSalesMinor: 0,
      cashOutMinor: 0,
      expectedCashMinor: request.body.initialCashMinor || 0,
      status: "OPEN"
    };

    return await openShift(dynamo, config, newShift);
  });

  app.post<{ Body: { actualCashMinor: number; closedBy: string; notes?: string } }>("/api/v1/cash-shifts/close", async (request, reply) => {
    const existing = await getCurrentShift(dynamo, config);
    if (!existing || existing.status !== "OPEN") {
      return reply.code(400).send({ code: "NO_OPEN_SHIFT", message: "No hay un turno de caja abierto para cerrar" });
    }

    const shiftToClose: CashShift = {
      ...existing,
      actualCashMinor: request.body.actualCashMinor,
      closedBy: request.body.closedBy || "Cajero",
      notes: request.body.notes
    };

    return await closeShift(dynamo, config, shiftToClose);
  });

  app.addHook("onClose", async () => {
    dynamo.raw.destroy();
  });

  return app;
}

