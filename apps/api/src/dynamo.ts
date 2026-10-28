import { DescribeTableCommand, DynamoDBClient } from "@aws-sdk/client-dynamodb";
import {
  DynamoDBDocumentClient,
  QueryCommand,
  GetCommand,
  PutCommand,
  DeleteCommand
} from "@aws-sdk/lib-dynamodb";
import type {
  DashboardSummary,
  Contact,
  Product,
  InventoryMovement,
  Sale,
  CashShift,
  CompanySettings
} from "@nexora/contracts";
import type { AppConfig } from "./config.js";

export interface DynamoContext {
  raw: DynamoDBClient;
  document: DynamoDBDocumentClient;
}

export function createDynamoContext(config: AppConfig): DynamoContext {
  const raw = new DynamoDBClient({
    region: config.AWS_REGION,
    endpoint: config.AWS_ENDPOINT_URL,
    credentials:
      config.APP_ENV === "local" || config.APP_ENV === "test"
        ? {
            accessKeyId: config.AWS_ACCESS_KEY_ID ?? "test",
            secretAccessKey: config.AWS_SECRET_ACCESS_KEY ?? "test",
            sessionToken: config.AWS_SESSION_TOKEN
          }
        : undefined
  });

  return {
    raw,
    document: DynamoDBDocumentClient.from(raw, {
      marshallOptions: { removeUndefinedValues: true }
    })
  };
}

// -------------------------------------------------------------
// Configuración de la Empresa Pyme
// -------------------------------------------------------------

const DEFAULT_SETTINGS: CompanySettings = {
  legalName: "Mi Pyme SpA",
  commercialName: "Nexora Store",
  taxId: "76.000.000-0",
  activity: "Comercio y Servicios",
  email: "contacto@mipyme.cl",
  phone: "+56 9 1234 5678",
  address: "Av. Principal 100",
  city: "Santiago",
  currency: "CLP",
  taxRatePercent: 19,
  nextSaleFolio: 1,
  updatedAt: new Date().toISOString()
};

// Almacén en memoria para entornos de test (evita timeouts hacia AWS)
const testMemoryDb = {
  company: { ...DEFAULT_SETTINGS },
  contacts: new Map<string, Contact>(),
  products: new Map<string, Product>(),
  movements: [] as InventoryMovement[],
  sales: [] as Sale[],
  currentShift: null as CashShift | null,
  shiftsHistory: [] as CashShift[]
};

export async function getCompanySettings(
  context: DynamoContext,
  config: AppConfig
): Promise<CompanySettings> {
  if (config.APP_ENV === "test") {
    return testMemoryDb.company;
  }

  try {
    const res = await context.document.send(
      new GetCommand({
        TableName: config.DYNAMODB_TABLE,
        Key: { PK: "COMPANY", SK: "SETTINGS" }
      })
    );
    if (res.Item) {
      return res.Item as unknown as CompanySettings;
    }
  } catch (err) {
    // Si la tabla no está creada aún o hay error de conexión, retornar configuración por defecto
  }
  return DEFAULT_SETTINGS;
}

export async function saveCompanySettings(
  context: DynamoContext,
  config: AppConfig,
  patch: Partial<CompanySettings>
): Promise<CompanySettings> {
  const current = await getCompanySettings(context, config);
  const updated: CompanySettings = {
    ...current,
    ...patch,
    updatedAt: new Date().toISOString()
  };

  if (config.APP_ENV === "test") {
    testMemoryDb.company = updated;
    return updated;
  }

  await context.document.send(
    new PutCommand({
      TableName: config.DYNAMODB_TABLE,
      Item: {
        PK: "COMPANY",
        SK: "SETTINGS",
        ...updated
      }
    })
  );

  return updated;
}

// -------------------------------------------------------------
// Contactos Unificados (Odoo res.partner)
// -------------------------------------------------------------

export async function listContacts(
  context: DynamoContext,
  config: AppConfig
): Promise<Contact[]> {
  if (config.APP_ENV === "test") {
    return Array.from(testMemoryDb.contacts.values());
  }

  try {
    const result = await context.document.send(
      new QueryCommand({
        TableName: config.DYNAMODB_TABLE,
        KeyConditionExpression: "PK = :pk",
        ExpressionAttributeValues: { ":pk": "ENTITY#CONTACT" }
      })
    );
    return (result.Items ?? []).map((item) => {
      const { PK, SK, ...contact } = item;
      return contact as Contact;
    });
  } catch (error) {
    return [];
  }
}

export async function saveContact(
  context: DynamoContext,
  config: AppConfig,
  contact: Contact
): Promise<Contact> {
  if (config.APP_ENV === "test") {
    testMemoryDb.contacts.set(contact.id, contact);
    return contact;
  }

  await context.document.send(
    new PutCommand({
      TableName: config.DYNAMODB_TABLE,
      Item: {
        PK: "ENTITY#CONTACT",
        SK: contact.id,
        ...contact
      }
    })
  );
  return contact;
}

export async function getContact(
  context: DynamoContext,
  config: AppConfig,
  id: string
): Promise<Contact | null> {
  if (config.APP_ENV === "test") {
    return testMemoryDb.contacts.get(id) ?? null;
  }

  const res = await context.document.send(
    new GetCommand({
      TableName: config.DYNAMODB_TABLE,
      Key: { PK: "ENTITY#CONTACT", SK: id }
    })
  );
  if (!res.Item) return null;
  const { PK, SK, ...contact } = res.Item;
  return contact as Contact;
}

// -------------------------------------------------------------
// Catálogo de Productos y Control de Stock
// -------------------------------------------------------------

export async function listProducts(
  context: DynamoContext,
  config: AppConfig
): Promise<Product[]> {
  if (config.APP_ENV === "test") {
    return Array.from(testMemoryDb.products.values());
  }

  try {
    const result = await context.document.send(
      new QueryCommand({
        TableName: config.DYNAMODB_TABLE,
        KeyConditionExpression: "PK = :pk",
        ExpressionAttributeValues: { ":pk": "ENTITY#PRODUCT" }
      })
    );
    return (result.Items ?? []).map((item) => {
      const { PK, SK, ...product } = item;
      return product as Product;
    });
  } catch (error) {
    return [];
  }
}

export async function saveProduct(
  context: DynamoContext,
  config: AppConfig,
  product: Product
): Promise<Product> {
  if (config.APP_ENV === "test") {
    testMemoryDb.products.set(product.id, product);
    return product;
  }

  await context.document.send(
    new PutCommand({
      TableName: config.DYNAMODB_TABLE,
      Item: {
        PK: "ENTITY#PRODUCT",
        SK: product.id,
        ...product
      }
    })
  );
  return product;
}

export async function getProduct(
  context: DynamoContext,
  config: AppConfig,
  id: string
): Promise<Product | null> {
  if (config.APP_ENV === "test") {
    return testMemoryDb.products.get(id) ?? null;
  }

  const res = await context.document.send(
    new GetCommand({
      TableName: config.DYNAMODB_TABLE,
      Key: { PK: "ENTITY#PRODUCT", SK: id }
    })
  );
  if (!res.Item) return null;
  const { PK, SK, ...product } = res.Item;
  return product as Product;
}

// -------------------------------------------------------------
// Movimientos de Inventario (Partida Doble)
// -------------------------------------------------------------

export async function listMovements(
  context: DynamoContext,
  config: AppConfig,
  limit = 50
): Promise<InventoryMovement[]> {
  if (config.APP_ENV === "test") {
    return testMemoryDb.movements.slice(0, limit);
  }

  try {
    const result = await context.document.send(
      new QueryCommand({
        TableName: config.DYNAMODB_TABLE,
        KeyConditionExpression: "PK = :pk",
        ExpressionAttributeValues: { ":pk": "ENTITY#MOVEMENT" },
        ScanIndexForward: false, // Más recientes primero
        Limit: limit
      })
    );
    return (result.Items ?? []).map((item) => {
      const { PK, SK, ...movement } = item;
      return movement as InventoryMovement;
    });
  } catch (error) {
    return [];
  }
}

export async function recordMovement(
  context: DynamoContext,
  config: AppConfig,
  movement: InventoryMovement
): Promise<InventoryMovement> {
  if (config.APP_ENV === "test") {
    testMemoryDb.movements.unshift(movement);
    const prod = testMemoryDb.products.get(movement.productId);
    if (prod) {
      if (movement.type === "IN") prod.currentStock += movement.quantity;
      else if (movement.type === "OUT") prod.currentStock -= movement.quantity;
      else if (movement.type === "ADJUSTMENT") prod.currentStock = movement.quantity;
      prod.currentStock = Math.max(0, prod.currentStock);
    }
    return movement;
  }

  // 1. Guardar movimiento
  await context.document.send(
    new PutCommand({
      TableName: config.DYNAMODB_TABLE,
      Item: {
        PK: "ENTITY#MOVEMENT",
        SK: `${movement.createdAt}#${movement.id}`,
        ...movement
      }
    })
  );

  // 2. Actualizar stock del producto asociado
  const prod = await getProduct(context, config, movement.productId);
  if (prod) {
    let newStock = prod.currentStock;
    if (movement.type === "IN") {
      newStock += movement.quantity;
    } else if (movement.type === "OUT") {
      newStock -= movement.quantity;
    } else if (movement.type === "ADJUSTMENT") {
      newStock = movement.quantity;
    }
    prod.currentStock = Math.max(0, newStock);
    await saveProduct(context, config, prod);
  }

  return movement;
}

// -------------------------------------------------------------
// Ventas y Ciclo de Documentos
// -------------------------------------------------------------

export async function listSales(
  context: DynamoContext,
  config: AppConfig,
  limit = 50
): Promise<Sale[]> {
  if (config.APP_ENV === "test") {
    return testMemoryDb.sales.slice(0, limit);
  }

  try {
    const result = await context.document.send(
      new QueryCommand({
        TableName: config.DYNAMODB_TABLE,
        KeyConditionExpression: "PK = :pk",
        ExpressionAttributeValues: { ":pk": "ENTITY#SALE" },
        ScanIndexForward: false,
        Limit: limit
      })
    );
    return (result.Items ?? []).map((item) => {
      const { PK, SK, ...sale } = item;
      return sale as Sale;
    });
  } catch (error) {
    return [];
  }
}

export async function recordSale(
  context: DynamoContext,
  config: AppConfig,
  sale: Sale
): Promise<Sale> {
  if (config.APP_ENV === "test") {
    testMemoryDb.sales.unshift(sale);
    for (const item of sale.items) {
      const prod = testMemoryDb.products.get(item.productId);
      if (prod) {
        prod.currentStock = Math.max(0, prod.currentStock - item.quantity);
      }
    }
    if (testMemoryDb.currentShift && testMemoryDb.currentShift.status === "OPEN") {
      if (sale.paymentMethod === "CASH") testMemoryDb.currentShift.cashSalesMinor += sale.totalMinor;
      else if (sale.paymentMethod === "DEBIT" || sale.paymentMethod === "CREDIT") testMemoryDb.currentShift.cardSalesMinor += sale.totalMinor;
      else if (sale.paymentMethod === "TRANSFER") testMemoryDb.currentShift.transferSalesMinor += sale.totalMinor;
      testMemoryDb.currentShift.expectedCashMinor =
        testMemoryDb.currentShift.initialCashMinor + testMemoryDb.currentShift.cashSalesMinor - testMemoryDb.currentShift.cashOutMinor;
    }
    return sale;
  }

  sale.totalMinor = Number(sale.totalMinor) || 0;
  sale.subtotalMinor = Number(sale.subtotalMinor) || 0;
  sale.taxMinor = Number(sale.taxMinor) || 0;

  // 1. Guardar venta
  await context.document.send(
    new PutCommand({
      TableName: config.DYNAMODB_TABLE,
      Item: {
        PK: "ENTITY#SALE",
        SK: `${sale.createdAt}#${sale.id}`,
        ...sale
      }
    })
  );

  // 2. Descontar stock de cada ítem de venta
  for (const item of sale.items) {
    const movement: InventoryMovement = {
      id: "mov-" + Math.random().toString(36).substring(2, 8),
      productId: item.productId,
      productSku: item.productSku,
      productName: item.productName,
      type: "OUT",
      sourceLocation: "BODEGA_CENTRAL",
      destLocation: "CLIENTES",
      quantity: item.quantity,
      reason: `Venta ${sale.id} a ${sale.customerName}`,
      referenceDoc: sale.id,
      performedBy: "Cajero",
      createdAt: sale.createdAt
    };
    await recordMovement(context, config, movement);
  }

  // 3. Si hay turno de caja abierto, sumar a las ventas del turno
  const currentShift = await getCurrentShift(context, config);
  if (currentShift && currentShift.status === "OPEN") {
    const initialCash = Number(currentShift.initialCashMinor) || 0;
    const cashOut = Number(currentShift.cashOutMinor) || 0;
    let cashSales = Number(currentShift.cashSalesMinor) || 0;
    let cardSales = Number(currentShift.cardSalesMinor) || 0;
    let transferSales = Number(currentShift.transferSalesMinor) || 0;

    if (sale.paymentMethod === "CASH") {
      cashSales += sale.totalMinor;
    } else if (sale.paymentMethod === "DEBIT" || sale.paymentMethod === "CREDIT") {
      cardSales += sale.totalMinor;
    } else if (sale.paymentMethod === "TRANSFER") {
      transferSales += sale.totalMinor;
    }

    currentShift.cashSalesMinor = cashSales;
    currentShift.cardSalesMinor = cardSales;
    currentShift.transferSalesMinor = transferSales;
    currentShift.expectedCashMinor = initialCash + cashSales - cashOut;

    await updateCurrentShift(context, config, currentShift);
  }

  return sale;
}

// -------------------------------------------------------------
// Control de Caja y Arqueo (Cash Shift)
// -------------------------------------------------------------

export async function getCurrentShift(
  context: DynamoContext,
  config: AppConfig
): Promise<CashShift | null> {
  if (config.APP_ENV === "test") {
    return testMemoryDb.currentShift;
  }

  try {
    const res = await context.document.send(
      new GetCommand({
        TableName: config.DYNAMODB_TABLE,
        Key: { PK: "SHIFT#CURRENT", SK: "ACTIVE" }
      })
    );
    if (!res.Item) return null;
    const { PK, SK, ...shift } = res.Item;
    return shift as CashShift;
  } catch (error) {
    return null;
  }
}

export async function openShift(
  context: DynamoContext,
  config: AppConfig,
  shift: CashShift
): Promise<CashShift> {
  if (config.APP_ENV === "test") {
    testMemoryDb.currentShift = shift;
    return shift;
  }

  await context.document.send(
    new PutCommand({
      TableName: config.DYNAMODB_TABLE,
      Item: {
        PK: "SHIFT#CURRENT",
        SK: "ACTIVE",
        ...shift
      }
    })
  );
  return shift;
}

export async function updateCurrentShift(
  context: DynamoContext,
  config: AppConfig,
  shift: CashShift
): Promise<CashShift> {
  if (config.APP_ENV === "test") {
    testMemoryDb.currentShift = shift;
    return shift;
  }

  await context.document.send(
    new PutCommand({
      TableName: config.DYNAMODB_TABLE,
      Item: {
        PK: "SHIFT#CURRENT",
        SK: "ACTIVE",
        ...shift
      }
    })
  );
  return shift;
}

export async function closeShift(
  context: DynamoContext,
  config: AppConfig,
  shift: CashShift
): Promise<CashShift> {
  const closedShift: CashShift = {
    ...shift,
    status: "CLOSED",
    closedAt: new Date().toISOString(),
    differenceMinor: (shift.actualCashMinor ?? 0) - shift.expectedCashMinor
  };

  if (config.APP_ENV === "test") {
    testMemoryDb.shiftsHistory.unshift(closedShift);
    testMemoryDb.currentShift = null;
    return closedShift;
  }

  // 1. Guardar en el histórico de turnos
  await context.document.send(
    new PutCommand({
      TableName: config.DYNAMODB_TABLE,
      Item: {
        PK: "ENTITY#SHIFT",
        SK: `${closedShift.openedAt}#${closedShift.id}`,
        ...closedShift
      }
    })
  );

  // 2. Eliminar el puntero de turno activo
  await context.document.send(
    new DeleteCommand({
      TableName: config.DYNAMODB_TABLE,
      Key: { PK: "SHIFT#CURRENT", SK: "ACTIVE" }
    })
  );

  return closedShift;
}


// -------------------------------------------------------------
// Dashboard Resumen General
// -------------------------------------------------------------

export async function readDashboard(
  context: DynamoContext,
  config: AppConfig
): Promise<DashboardSummary> {
  try {
    await context.raw.send(new DescribeTableCommand({ TableName: config.DYNAMODB_TABLE }));

    const [contacts, products, sales, currentShift] = await Promise.all([
      listContacts(context, config),
      listProducts(context, config),
      listSales(context, config, 100),
      getCurrentShift(context, config)
    ]);

    const stockUnits = products.reduce((acc, p) => acc + (Number(p.currentStock) || 0), 0);
    const lowStockCount = products.filter((p) => (Number(p.currentStock) || 0) <= (Number(p.minStock) || 0)).length;
    const salesTotalMinor = sales.reduce((acc, s) => acc + (Number(s.totalMinor) || 0), 0);

    return {
      infrastructure: "ready",
      customers: contacts.filter((c) => c.isCustomer).length,
      products: products.length,
      salesTotalMinor,
      stockUnits,
      lowStockCount,
      currency: "CLP",
      openShift: currentShift?.status === "OPEN",
      cashInRegisterMinor: currentShift ? currentShift.expectedCashMinor : 0,
      updatedAt: new Date().toISOString()
    };
  } catch (error) {
    const name = error instanceof Error ? error.name : "UnknownError";
    if (name !== "ResourceNotFoundException") {
      // Podría ser error de permisos u otro
    }

    return {
      infrastructure: "pending",
      customers: 0,
      products: 0,
      salesTotalMinor: 0,
      stockUnits: 0,
      lowStockCount: 0,
      currency: "CLP",
      openShift: false,
      cashInRegisterMinor: 0,
      updatedAt: new Date().toISOString()
    };
  }
}

