import { ref, computed } from "vue";
import type {
  Customer,
  Product,
  Supplier,
  MovementType,
  InventoryMovement,
  Sale,
  CompanySettings,
  AuditLogEntry,
  ToastMessage
} from "@nexora/contracts";

const customers = ref<Customer[]>([
  {
    id: "cust-01",
    taxId: "76.123.456-7",
    name: "Distribuidora Los Andes SpA",
    email: "contacto@losandes.cl",
    phone: "+56 9 8765 4321",
    address: "Av. Providencia 1234, Santiago",
    status: "active",
    createdAt: new Date(Date.now() - 86400000 * 3).toISOString()
  },
  {
    id: "cust-02",
    taxId: "77.987.654-3",
    name: "Comercial del Valle Ltda.",
    email: "ventas@delvalle.cl",
    phone: "+56 9 1234 5678",
    address: "Calle Valparaíso 456, Viña del Mar",
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
    createdAt: new Date(Date.now() - 86400000 * 6).toISOString()
  }
]);

const suppliers = ref<Supplier[]>([
  {
    id: "sup-01",
    taxId: "96.555.444-K",
    name: "Global Tech Imports Chile S.A.",
    contactPerson: "Mariana Silva",
    email: "proveedores@globaltech.cl",
    phone: "+56 2 2334 5566",
    createdAt: new Date(Date.now() - 86400000 * 12).toISOString()
  },
  {
    id: "sup-02",
    taxId: "99.111.222-3",
    name: "Redes y Telecomunicaciones del Pacífico",
    contactPerson: "Carlos Henríquez",
    email: "ventas@redespacifico.cl",
    phone: "+56 2 2778 9900",
    createdAt: new Date(Date.now() - 86400000 * 15).toISOString()
  }
]);

const movements = ref<InventoryMovement[]>([
  {
    id: "mov-01",
    productId: "prod-01",
    productName: "Router Industrial Gigabit Cloud",
    type: "IN",
    quantity: 20,
    reason: "Recepción de compra inicial orden #OC-101",
    performedBy: "Administrador",
    createdAt: new Date(Date.now() - 86400000 * 3).toISOString()
  },
  {
    id: "mov-02",
    productId: "prod-02",
    productName: "Sensor Térmico IoT Gateway",
    type: "IN",
    quantity: 5,
    reason: "Recepción de compra orden #OC-102",
    performedBy: "Administrador",
    createdAt: new Date(Date.now() - 86400000 * 2).toISOString()
  },
  {
    id: "mov-03",
    productId: "prod-01",
    productName: "Router Industrial Gigabit Cloud",
    type: "OUT",
    quantity: 2,
    reason: "Venta #VEN-001 a Distribuidora Los Andes",
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
    totalMinor: 299980,
    status: "COMPLETED",
    createdAt: new Date(Date.now() - 86400000 * 1).toISOString()
  }
]);

const settings = ref<CompanySettings>({
  legalName: "Nexora Technologies SpA",
  taxId: "76.999.888-4",
  email: "contacto@nexora.cloud",
  phone: "+56 2 2999 1100",
  address: "Av. Andrés Bello 2711, Las Condes, Santiago",
  currency: "CLP",
  updatedAt: new Date().toISOString()
});

const auditLogs = ref<AuditLogEntry[]>([
  {
    id: "aud-01",
    actor: "admin@nexora.cloud",
    action: "SISTEMA_INICIALIZADO",
    entity: "CONFIGURACION",
    entityId: "TENANT#demo",
    details: "Configuración inicial de empresa y entorno local DynamoDB",
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
    details: "Venta por $299.980 CLP a Distribuidora Los Andes SpA",
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

  function addCustomer(data: Omit<Customer, "id" | "createdAt">) {
    const newCustomer: Customer = {
      ...data,
      id: "cust-" + Math.random().toString(36).substring(2, 7),
      createdAt: new Date().toISOString()
    };
    customers.value.unshift(newCustomer);
    addAudit("CREAR_CLIENTE", "CLIENTE", newCustomer.id, `Cliente creado: ${newCustomer.name} (RUT: ${newCustomer.taxId})`);
    showToast("success", "Cliente Registrado", `Se guardó correctamente a ${newCustomer.name}`);
    return newCustomer;
  }

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
      movements.value.unshift({
        id: "mov-" + Math.random().toString(36).substring(2, 7),
        productId: newProduct.id,
        productName: newProduct.name,
        type: "IN",
        quantity: data.currentStock,
        reason: "Stock inicial de apertura",
        performedBy: "Administrador",
        createdAt: new Date().toISOString()
      });
    }

    addAudit("CREAR_PRODUCTO", "PRODUCTO", newProduct.id, `Producto creado: SKU ${newProduct.sku} - ${newProduct.name}`);
    showToast("success", "Producto Registrado", `SKU ${newProduct.sku} añadido al catálogo.`);
    return newProduct;
  }

  function addSupplier(data: Omit<Supplier, "id" | "createdAt">) {
    const newSupplier: Supplier = {
      ...data,
      id: "sup-" + Math.random().toString(36).substring(2, 7),
      createdAt: new Date().toISOString()
    };
    suppliers.value.unshift(newSupplier);
    addAudit("CREAR_PROVEEDOR", "PROVEEDOR", newSupplier.id, `Proveedor registrado: ${newSupplier.name}`);
    showToast("success", "Proveedor Registrado", `${newSupplier.name} añadido a proveedores.`);
    return newSupplier;
  }

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
      productName: product.name,
      type,
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
  }

  function createSale(customerId: string, itemsData: { productId: string; quantity: number }[]) {
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

      movements.value.unshift({
        id: "mov-" + Math.random().toString(36).substring(2, 7),
        productId: prod.id,
        productName: prod.name,
        type: "OUT",
        quantity: item.quantity,
        reason: `Venta registrada para ${customer.name}`,
        performedBy: "Administrador",
        createdAt: new Date().toISOString()
      });

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
    const newSale: Sale = {
      id: "VEN-" + String(sales.value.length + 1).padStart(3, "0"),
      customerId: customer.id,
      customerName: customer.name,
      items: saleItems,
      totalMinor,
      status: "COMPLETED",
      createdAt: new Date().toISOString()
    };
    sales.value.unshift(newSale);

    addAudit("REGISTRAR_VENTA", "VENTA", newSale.id, `Venta ${newSale.id} por ${formatCurrency(totalMinor)} a ${customer.name}`);
    showToast("success", "Venta Completada", `Venta ${newSale.id} generada por ${formatCurrency(totalMinor)}`);
    return newSale;
  }

  function updateSettings(newSettings: Partial<CompanySettings>) {
    settings.value = {
      ...settings.value,
      ...newSettings,
      updatedAt: new Date().toISOString()
    };
    addAudit("ACTUALIZAR_CONFIG", "EMPRESA", "CONFIG", `Datos de empresa actualizados: ${settings.value.legalName}`);
    showToast("success", "Configuración Guardada", "Los datos de la empresa han sido actualizados.");
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
    updateSettings
  };
}
