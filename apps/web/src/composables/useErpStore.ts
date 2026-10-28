import { ref, computed } from "vue";
import type {
  Contact,
  Customer,
  Product,
  Supplier,
  MovementType,
  InventoryMovement,
  Sale,
  PaymentMethod,
  CashShift,
  CompanySettings,
  AuditLogEntry,
  ToastMessage
} from "@nexora/contracts";

const customers = ref<Customer[]>([
  {
    id: "cust-01",
    taxId: "76.123.456-7",
    name: "Distribuidora Los Andes SpA",
    isCustomer: true,
    isSupplier: false,
    email: "contacto@losandes.cl",
    phone: "+56 9 8765 4321",
    address: "Av. Providencia 1234, Santiago",
    city: "Santiago",
    status: "active",
    createdAt: new Date(Date.now() - 86400000 * 3).toISOString()
  },
  {
    id: "cust-02",
    taxId: "77.987.654-3",
    name: "Comercial del Valle Ltda.",
    isCustomer: true,
    isSupplier: false,
    email: "ventas@delvalle.cl",
    phone: "+56 9 1234 5678",
    address: "Calle Valparaíso 456, Viña del Mar",
    city: "Viña del Mar",
    status: "active",
    createdAt: new Date(Date.now() - 86400000 * 5).toISOString()
  }
]);

const products = ref<Product[]>([
  {
    id: "prod-01",
    sku: "NEX-SRV-01",
    name: "Router Industrial Gigabit Cloud",
    category: "Hardware de Red",
    priceMinor: 149990,
    costMinor: 85000,
    currentStock: 18,
    minStock: 5,
    location: "Bodega Central - Rack A1",
    status: "active",
    createdAt: new Date(Date.now() - 86400000 * 10).toISOString()
  },
  {
    id: "prod-02",
    sku: "NEX-ACC-02",
    name: "Sensor Térmico IoT Gateway",
    category: "Sensores y Telemetría",
    priceMinor: 49990,
    costMinor: 22000,
    currentStock: 3,
    minStock: 10,
    location: "Bodega Central - Estante B3",
    status: "active",
    createdAt: new Date(Date.now() - 86400000 * 8).toISOString()
  },
  {
    id: "prod-03",
    sku: "NEX-CAB-03",
    name: "Bobina Fibra Óptica Monomodo 500m",
    category: "Cables y Conectividad",
    priceMinor: 189990,
    costMinor: 110000,
    currentStock: 12,
    minStock: 4,
    location: "Bodega Central - Pasillo 4",
    status: "active",
    createdAt: new Date(Date.now() - 86400000 * 6).toISOString()
  }
]);

const suppliers = ref<Supplier[]>([
  {
    id: "sup-01",
    taxId: "96.555.444-K",
    name: "Global Tech Imports Chile S.A.",
    isCustomer: false,
    isSupplier: true,
    contactPerson: "Mariana Silva",
    email: "proveedores@globaltech.cl",
    phone: "+56 2 2334 5566",
    status: "active",
    createdAt: new Date(Date.now() - 86400000 * 12).toISOString()
  },
  {
    id: "sup-02",
    taxId: "99.111.222-3",
    name: "Redes y Telecomunicaciones del Pacífico",
    isCustomer: false,
    isSupplier: true,
    contactPerson: "Carlos Henríquez",
    email: "ventas@redespacifico.cl",
    phone: "+56 2 2778 9900",
    status: "active",
    createdAt: new Date(Date.now() - 86400000 * 15).toISOString()
  }
]);

const movements = ref<InventoryMovement[]>([
  {
    id: "mov-01",
    productId: "prod-01",
    productSku: "NEX-SRV-01",
    productName: "Router Industrial Gigabit Cloud",
    type: "IN",
    sourceLocation: "PROVEEDORES",
    destLocation: "BODEGA_CENTRAL",
    quantity: 20,
    unitCostMinor: 85000,
    reason: "Recepción de compra inicial orden #OC-101",
    referenceDoc: "OC-101",
    performedBy: "Administrador",
    createdAt: new Date(Date.now() - 86400000 * 3).toISOString()
  },
  {
    id: "mov-02",
    productId: "prod-02",
    productSku: "NEX-ACC-02",
    productName: "Sensor Térmico IoT Gateway",
    type: "IN",
    sourceLocation: "PROVEEDORES",
    destLocation: "BODEGA_CENTRAL",
    quantity: 5,
    unitCostMinor: 22000,
    reason: "Recepción de compra orden #OC-102",
    referenceDoc: "OC-102",
    performedBy: "Administrador",
    createdAt: new Date(Date.now() - 86400000 * 2).toISOString()
  },
  {
    id: "mov-03",
    productId: "prod-01",
    productSku: "NEX-SRV-01",
    productName: "Router Industrial Gigabit Cloud",
    type: "OUT",
    sourceLocation: "BODEGA_CENTRAL",
    destLocation: "CLIENTES",
    quantity: 2,
    reason: "Venta #VEN-001 a Distribuidora Los Andes",
    referenceDoc: "VEN-001",
    performedBy: "Administrador",
    createdAt: new Date(Date.now() - 86400000 * 1).toISOString()
  }
]);

const sales = ref<Sale[]>([
  {
    id: "VEN-001",
    customerId: "cust-01",
    customerName: "Distribuidora Los Andes SpA",
    items: [
      {
        productId: "prod-01",
        productSku: "NEX-SRV-01",
        productName: "Router Industrial Gigabit Cloud",
        quantity: 2,
        unitPriceMinor: 149990,
        subtotalMinor: 299980
      }
    ],
    subtotalMinor: 252084,
    taxMinor: 47896,
    totalMinor: 299980,
    paymentMethod: "CASH",
    status: "COMPLETED",
    createdAt: new Date(Date.now() - 86400000 * 1).toISOString()
  }
]);

const currentShift = ref<CashShift | null>({
  id: "shift-01",
  openedAt: new Date(Date.now() - 3600000 * 4).toISOString(),
  openedBy: "Admin",
  initialCashMinor: 50000,
  cashSalesMinor: 299980,
  cardSalesMinor: 0,
  transferSalesMinor: 0,
  cashOutMinor: 0,
  expectedCashMinor: 349980,
  status: "OPEN"
});

const settings = ref<CompanySettings>({
  legalName: "Nexora Technologies SpA",
  commercialName: "Nexora Store",
  taxId: "76.999.888-4",
  activity: "Servicios y Soluciones Informáticas",
  email: "contacto@nexora.cloud",
  phone: "+56 2 2999 1100",
  address: "Av. Andrés Bello 2711, Las Condes, Santiago",
  city: "Santiago",
  currency: "CLP",
  taxRatePercent: 19,
  nextSaleFolio: 2,
  updatedAt: new Date().toISOString()
});

const auditLogs = ref<AuditLogEntry[]>([
  {
    id: "aud-01",
    actor: "admin@nexora.cloud",
    action: "SISTEMA_INICIALIZADO",
    entity: "CONFIGURACION",
    entityId: "COMPANY",
    details: "Configuración inicial de empresa y entorno dedicado Pyme en DynamoDB",
    timestamp: new Date(Date.now() - 86400000 * 3).toISOString()
  },
  {
    id: "aud-02",
    actor: "admin@nexora.cloud",
    action: "CREAR_PRODUCTO",
    entity: "PRODUCTO",
    entityId: "prod-01",
    details: "Alta de SKU NEX-SRV-01 con stock mínimo 5",
    timestamp: new Date(Date.now() - 86400000 * 2).toISOString()
  },
  {
    id: "aud-03",
    actor: "admin@nexora.cloud",
    action: "REGISTRAR_VENTA",
    entity: "VENTA",
    entityId: "VEN-001",
    details: "Venta por $299.980 CLP en Efectivo a Distribuidora Los Andes SpA",
    timestamp: new Date(Date.now() - 86400000 * 1).toISOString()
  }
]);

const toasts = ref<ToastMessage[]>([]);

export function useErpStore() {
  const currencyFormatter = new Intl.NumberFormat("es-CL", {
    style: "currency",
    currency: "CLP",
    maximumFractionDigits: 0
  });

  function formatCurrency(amountMinor: number): string {
    return currencyFormatter.format(amountMinor);
  }

  function showToast(type: ToastMessage["type"], title: string, message: string) {
    const id = "toast-" + Math.random().toString(36).substring(2, 9);
    toasts.value.push({ id, type, title, message });
    setTimeout(() => {
      removeToast(id);
    }, 4500);
  }

  function removeToast(id: string) {
    toasts.value = toasts.value.filter((t) => t.id !== id);
  }

  function addAudit(action: string, entity: string, entityId: string, details: string) {
    auditLogs.value.unshift({
      id: "aud-" + Math.random().toString(36).substring(2, 9),
      actor: "admin@nexora.cloud",
      action,
      entity,
      entityId,
      details,
      timestamp: new Date().toISOString()
    });
  }

  // -----------------------------------------------------------
  // Contactos (Clientes y Proveedores Unificados)
  // -----------------------------------------------------------

  function addCustomer(
    data: Omit<Contact, "id" | "createdAt" | "isCustomer" | "isSupplier" | "status"> & {
      status?: "active" | "inactive";
    }
  ) {
    const newContact: Contact = {
      status: "active",
      ...data,
      isCustomer: true,
      isSupplier: false,
      id: "cust-" + Math.random().toString(36).substring(2, 7),
      createdAt: new Date().toISOString()
    };
    customers.value.unshift(newContact);
    addAudit("CREAR_CLIENTE", "CLIENTE", newContact.id, `Cliente creado: ${newContact.name} (RUT: ${newContact.taxId})`);
    showToast("success", "Cliente Registrado", `Se guardó correctamente a ${newContact.name}`);

    // Sync en background con Fastify
    fetch("/api/v1/contacts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newContact)
    }).catch(() => {});

    return newContact;
  }

  function addSupplier(
    data: Omit<Contact, "id" | "createdAt" | "isCustomer" | "isSupplier" | "status"> & {
      status?: "active" | "inactive";
    }
  ) {
    const newContact: Contact = {
      status: "active",
      ...data,
      isCustomer: false,
      isSupplier: true,
      id: "sup-" + Math.random().toString(36).substring(2, 7),
      createdAt: new Date().toISOString()
    };
    suppliers.value.unshift(newContact);
    addAudit("CREAR_PROVEEDOR", "PROVEEDOR", newContact.id, `Proveedor registrado: ${newContact.name}`);
    showToast("success", "Proveedor Registrado", `${newContact.name} añadido a proveedores.`);

    fetch("/api/v1/contacts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newContact)
    }).catch(() => {});

    return newContact;
  }

  // -----------------------------------------------------------
  // Catálogo de Productos
  // -----------------------------------------------------------

  function addProduct(data: Omit<Product, "id" | "createdAt">) {
    const exists = products.value.some(
      (p) => p.sku.trim().toUpperCase() === data.sku.trim().toUpperCase()
    );
    if (exists) {
      showToast("error", "SKU Duplicado", `El SKU ${data.sku} ya está registrado en el inventario.`);
      throw new Error(`El SKU ${data.sku} ya existe.`);
    }

    const newProduct: Product = {
      ...data,
      id: "prod-" + Math.random().toString(36).substring(2, 7),
      sku: data.sku.trim().toUpperCase(),
      createdAt: new Date().toISOString()
    };
    products.value.unshift(newProduct);

    if (data.currentStock > 0) {
      const initialMov: InventoryMovement = {
        id: "mov-" + Math.random().toString(36).substring(2, 7),
        productId: newProduct.id,
        productSku: newProduct.sku,
        productName: newProduct.name,
        type: "IN",
        sourceLocation: "PROVEEDORES",
        destLocation: "BODEGA_CENTRAL",
        quantity: data.currentStock,
        reason: "Stock inicial de apertura",
        referenceDoc: "APERTURA",
        performedBy: "Administrador",
        createdAt: new Date().toISOString()
      };
      movements.value.unshift(initialMov);
      fetch("/api/v1/inventory/movements", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(initialMov)
      }).catch(() => {});
    }

    addAudit("CREAR_PRODUCTO", "PRODUCTO", newProduct.id, `Producto creado: SKU ${newProduct.sku} - ${newProduct.name}`);
    showToast("success", "Producto Registrado", `SKU ${newProduct.sku} añadido al catálogo.`);

    fetch("/api/v1/products", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newProduct)
    }).catch(() => {});

    return newProduct;
  }

  // -----------------------------------------------------------
  // Inventario por Partida Doble
  // -----------------------------------------------------------

  function recordInventoryMovement(productId: string, type: MovementType, quantity: number, reason: string) {
    const product = products.value.find((p) => p.id === productId);
    if (!product) {
      showToast("error", "Error", "Producto no encontrado");
      throw new Error("Producto no encontrado");
    }

    if (type === "OUT" && product.currentStock < quantity) {
      showToast("error", "Stock Insuficiente", `Solo hay ${product.currentStock} unidades disponibles.`);
      throw new Error("Stock insuficiente");
    }

    if (type === "IN") {
      product.currentStock += quantity;
    } else if (type === "OUT") {
      product.currentStock -= quantity;
    } else if (type === "ADJUSTMENT") {
      product.currentStock = quantity;
    }

    const movement: InventoryMovement = {
      id: "mov-" + Math.random().toString(36).substring(2, 7),
      productId: product.id,
      productSku: product.sku,
      productName: product.name,
      type,
      sourceLocation: type === "IN" ? "PROVEEDORES" : "BODEGA_CENTRAL",
      destLocation: type === "OUT" ? "CLIENTES" : "BODEGA_CENTRAL",
      quantity,
      reason,
      performedBy: "Administrador",
      createdAt: new Date().toISOString()
    };
    movements.value.unshift(movement);

    addAudit("AJUSTE_INVENTARIO", "INVENTARIO", product.id, `Movimiento ${type} (${quantity} unidades) en ${product.sku}: ${reason}`);
    showToast("success", "Inventario Actualizado", `Stock actual de ${product.name}: ${product.currentStock} unidades.`);

    if (product.currentStock <= product.minStock) {
      showToast("warning", "Alerta de Stock Bajo", `El producto ${product.sku} está en o por debajo del stock mínimo (${product.minStock} u.)`);
    }

    fetch("/api/v1/inventory/movements", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(movement)
    }).catch(() => {});
  }

  // -----------------------------------------------------------
  // Ventas y Control de Caja
  // -----------------------------------------------------------

  function createSale(
    customerId: string,
    itemsData: { productId: string; quantity: number }[],
    paymentMethod: PaymentMethod = "CASH"
  ) {
    const customer = customers.value.find((c) => c.id === customerId);
    if (!customer) {
      showToast("error", "Error", "Cliente no encontrado");
      throw new Error("Cliente no válido");
    }

    for (const item of itemsData) {
      const prod = products.value.find((p) => p.id === item.productId);
      if (!prod) throw new Error("Producto no encontrado");
      if (prod.currentStock < item.quantity) {
        showToast("error", "Stock Insuficiente", `No hay stock suficiente para ${prod.name}. Stock actual: ${prod.currentStock}`);
        throw new Error(`Stock insuficiente para ${prod.name}`);
      }
    }

    const saleItems = itemsData.map((item) => {
      const prod = products.value.find((p) => p.id === item.productId)!;
      prod.currentStock -= item.quantity;

      const mov: InventoryMovement = {
        id: "mov-" + Math.random().toString(36).substring(2, 7),
        productId: prod.id,
        productSku: prod.sku,
        productName: prod.name,
        type: "OUT",
        sourceLocation: "BODEGA_CENTRAL",
        destLocation: "CLIENTES",
        quantity: item.quantity,
        reason: `Venta registrada para ${customer.name}`,
        referenceDoc: "VENTA",
        performedBy: "Administrador",
        createdAt: new Date().toISOString()
      };
      movements.value.unshift(mov);

      if (prod.currentStock <= prod.minStock) {
        showToast("warning", "Alerta de Stock", `${prod.sku} ha alcanzado el nivel de stock mínimo (${prod.currentStock} restantes).`);
      }

      return {
        productId: prod.id,
        productSku: prod.sku,
        productName: prod.name,
        quantity: item.quantity,
        unitPriceMinor: prod.priceMinor,
        subtotalMinor: prod.priceMinor * item.quantity
      };
    });

    const totalMinor = saleItems.reduce((acc, curr) => acc + curr.subtotalMinor, 0);
    const taxRate = (settings.value.taxRatePercent || 19) / 100;
    const subtotalMinor = Math.round(totalMinor / (1 + taxRate));
    const taxMinor = totalMinor - subtotalMinor;

    const folio = "VEN-" + String(sales.value.length + 1).padStart(3, "0");
    const newSale: Sale = {
      id: folio,
      customerId: customer.id,
      customerName: customer.name,
      items: saleItems,
      subtotalMinor,
      taxMinor,
      totalMinor,
      paymentMethod,
      shiftId: currentShift.value?.id,
      status: "COMPLETED",
      createdAt: new Date().toISOString()
    };
    sales.value.unshift(newSale);

    // Si la caja está abierta, registrar el cobro en el turno
    if (currentShift.value && currentShift.value.status === "OPEN") {
      if (paymentMethod === "CASH") {
        currentShift.value.cashSalesMinor += totalMinor;
      } else if (paymentMethod === "DEBIT" || paymentMethod === "CREDIT") {
        currentShift.value.cardSalesMinor += totalMinor;
      } else if (paymentMethod === "TRANSFER") {
        currentShift.value.transferSalesMinor += totalMinor;
      }
      currentShift.value.expectedCashMinor =
        currentShift.value.initialCashMinor + currentShift.value.cashSalesMinor - currentShift.value.cashOutMinor;
    }

    addAudit("REGISTRAR_VENTA", "VENTA", newSale.id, `Venta ${newSale.id} por ${formatCurrency(totalMinor)} (${paymentMethod}) a ${customer.name}`);
    showToast("success", "Venta Completada", `Venta ${newSale.id} generada por ${formatCurrency(totalMinor)}`);

    fetch("/api/v1/sales", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newSale)
    }).catch(() => {});

    return newSale;
  }

  // -----------------------------------------------------------
  // Control de Arqueo y Turnos de Caja
  // -----------------------------------------------------------

  function openCashShift(initialCashMinor: number, openedBy = "Cajero") {
    const shift: CashShift = {
      id: "shift-" + Math.random().toString(36).substring(2, 8),
      openedAt: new Date().toISOString(),
      openedBy,
      initialCashMinor,
      cashSalesMinor: 0,
      cardSalesMinor: 0,
      transferSalesMinor: 0,
      cashOutMinor: 0,
      expectedCashMinor: initialCashMinor,
      status: "OPEN"
    };
    currentShift.value = shift;
    addAudit("APERTURA_CAJA", "CAJA", shift.id, `Apertura de turno de caja con base de ${formatCurrency(initialCashMinor)}`);
    showToast("success", "Caja Abierta", `Turno iniciado con ${formatCurrency(initialCashMinor)}`);

    fetch("/api/v1/cash-shifts/open", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ initialCashMinor, openedBy })
    }).catch(() => {});

    return shift;
  }

  function closeCashShift(actualCashMinor: number, closedBy = "Cajero", notes?: string) {
    if (!currentShift.value) return;

    const diff = actualCashMinor - currentShift.value.expectedCashMinor;
    const closed: CashShift = {
      ...currentShift.value,
      status: "CLOSED",
      closedAt: new Date().toISOString(),
      closedBy,
      actualCashMinor,
      differenceMinor: diff,
      notes
    };

    currentShift.value = null;
    addAudit(
      "CIERRE_CAJA",
      "CAJA",
      closed.id,
      `Cierre de caja. Esperado: ${formatCurrency(closed.expectedCashMinor)}, Contado: ${formatCurrency(actualCashMinor)}, Diferencia: ${formatCurrency(diff)}`
    );

    const diffText = diff === 0 ? "Cuadrada exacta" : diff > 0 ? `Sobrante de ${formatCurrency(diff)}` : `Faltante de ${formatCurrency(Math.abs(diff))}`;
    showToast("info", "Caja Cerrada", `Arqueo completado. ${diffText}.`);

    fetch("/api/v1/cash-shifts/close", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ actualCashMinor, closedBy, notes })
    }).catch(() => {});

    return closed;
  }

  // -----------------------------------------------------------
  // Configuración de la Empresa
  // -----------------------------------------------------------

  function updateSettings(newSettings: Partial<CompanySettings>) {
    settings.value = {
      ...settings.value,
      ...newSettings,
      updatedAt: new Date().toISOString()
    };
    addAudit("ACTUALIZAR_CONFIG", "EMPRESA", "CONFIG", `Datos de empresa actualizados: ${settings.value.legalName}`);
    showToast("success", "Configuración Guardada", "Los datos de la empresa han sido actualizados.");

    fetch("/api/v1/company", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newSettings)
    }).catch(() => {});
  }

  // -----------------------------------------------------------
  // Sincronización con el Backend
  // -----------------------------------------------------------

  async function syncWithBackend() {
    try {
      const [compRes, contRes, prodRes, movRes, saleRes, shiftRes] = await Promise.allSettled([
        fetch("/api/v1/company"),
        fetch("/api/v1/contacts"),
        fetch("/api/v1/products"),
        fetch("/api/v1/inventory/movements"),
        fetch("/api/v1/sales"),
        fetch("/api/v1/cash-shifts/current")
      ]);

      if (compRes.status === "fulfilled" && compRes.value.ok) {
        settings.value = await compRes.value.json();
      }
      if (contRes.status === "fulfilled" && contRes.value.ok) {
        const serverContacts: Contact[] = await contRes.value.json();
        if (serverContacts.length > 0) {
          customers.value = serverContacts.filter((c) => c.isCustomer);
          suppliers.value = serverContacts.filter((c) => c.isSupplier);
        }
      }
      if (prodRes.status === "fulfilled" && prodRes.value.ok) {
        const serverProds: Product[] = await prodRes.value.json();
        if (serverProds.length > 0) products.value = serverProds;
      }
      if (movRes.status === "fulfilled" && movRes.value.ok) {
        const serverMovs: InventoryMovement[] = await movRes.value.json();
        if (serverMovs.length > 0) movements.value = serverMovs;
      }
      if (saleRes.status === "fulfilled" && saleRes.value.ok) {
        const serverSales: Sale[] = await saleRes.value.json();
        if (serverSales.length > 0) sales.value = serverSales;
      }
      if (shiftRes.status === "fulfilled" && shiftRes.value.ok) {
        const serverShift = await shiftRes.value.json();
        if (serverShift && serverShift.status === "OPEN") {
          currentShift.value = serverShift;
        } else if (serverShift && serverShift.status === "CLOSED") {
          currentShift.value = null;
        }
      }
    } catch (e) {
      // Entorno local o backend aún inicializando; permanece en estado reactivo local
    }
  }

  const lowStockProducts = computed(() => {
    return products.value.filter((p) => p.currentStock <= p.minStock);
  });

  const totalStockUnits = computed(() => {
    return products.value.reduce((acc, p) => acc + p.currentStock, 0);
  });

  const totalSalesAmount = computed(() => {
    return sales.value.reduce((acc, s) => acc + s.totalMinor, 0);
  });

  return {
    customers,
    products,
    suppliers,
    movements,
    sales,
    currentShift,
    settings,
    auditLogs,
    toasts,
    lowStockProducts,
    totalStockUnits,
    totalSalesAmount,
    formatCurrency,
    showToast,
    removeToast,
    addCustomer,
    addProduct,
    addSupplier,
    recordInventoryMovement,
    createSale,
    openCashShift,
    closeCashShift,
    updateSettings,
    syncWithBackend
  };
}

