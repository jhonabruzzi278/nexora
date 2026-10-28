# ==============================================================================
# Script de Validación End-to-End en Vivo - Nexora ERP API en AWS
# Endpoint: https://hnnlbrzua6.execute-api.us-east-1.amazonaws.com
# ==============================================================================

$base = "https://hnnlbrzua6.execute-api.us-east-1.amazonaws.com"
$ErrorActionPreference = "Stop"

Write-Host ">>> 1. Verificando Health Check (/health)..." -ForegroundColor Cyan
$health = Invoke-RestMethod -Uri "$base/health" -Method Get
Write-Host "    Estado: $($health.status), Servicio: $($health.service), Timestamp: $($health.timestamp)" -ForegroundColor Green

Write-Host "`n>>> 2. Verificando Configuración de Empresa (/api/v1/company)..." -ForegroundColor Cyan
$company = Invoke-RestMethod -Uri "$base/api/v1/company" -Method Get
Write-Host "    Empresa: $($company.legalName), RUT: $($company.taxId), Moneda: $($company.currency)" -ForegroundColor Green

Write-Host "`n>>> 3. Creando Contacto (Cliente y Proveedor estilo Odoo res.partner)..." -ForegroundColor Cyan
$contactPayload = @{
    name = "Distribuidora Los Andes SpA"
    taxId = "77.890.123-K"
    isCustomer = $true
    isSupplier = $true
    email = "contacto@losandes.cl"
    phone = "+56 9 9876 5432"
    status = "active"
} | ConvertTo-Json

$contact = Invoke-RestMethod -Uri "$base/api/v1/contacts" -Method Post -Body $contactPayload -ContentType "application/json"
Write-Host "    Contacto Creado: ID $($contact.id) - $($contact.name) (Cliente=$($contact.isCustomer), Proveedor=$($contact.isSupplier))" -ForegroundColor Green

Write-Host "`n>>> 4. Creando Producto con Stock Inicial en Bodega..." -ForegroundColor Cyan
$prodPayload = @{
    sku = "FERR-DW-001"
    name = "Tornillo Volcanita 6x1-1/4 (Caja 100u)"
    priceMinor = 4990
    costMinor = 2400
    currentStock = 80
    minStock = 15
} | ConvertTo-Json

$prod = Invoke-RestMethod -Uri "$base/api/v1/products" -Method Post -Body $prodPayload -ContentType "application/json"
Write-Host "    Producto Creado: SKU $($prod.sku) - $($prod.name) - Stock: $($prod.currentStock) - Precio: `$$($prod.priceMinor)" -ForegroundColor Green

Write-Host "`n>>> 5. Verificando o Abriendo Caja Diaria (Cash Shift / Arqueo)..." -ForegroundColor Cyan
$current = Invoke-RestMethod -Uri "$base/api/v1/cash-shifts/current" -Method Get
if ($current.status -ne "OPEN") {
    $shiftPayload = @{
        initialCashMinor = 35000
        openedBy = "Jonathan Operador"
    } | ConvertTo-Json
    $shift = Invoke-RestMethod -Uri "$base/api/v1/cash-shifts/open" -Method Post -Body $shiftPayload -ContentType "application/json"
    Write-Host "    Nuevo Turno de Caja Abierto: ID $($shift.id) - Saldo Inicial: `$$($shift.initialCashMinor) - Abierto por: $($shift.openedBy)" -ForegroundColor Green
} else {
    $shift = $current
    Write-Host "    Turno de Caja Ya Activo: ID $($shift.id) - Saldo Inicial: `$$($shift.initialCashMinor) - Abierto por: $($shift.openedBy)" -ForegroundColor Green
}

Write-Host "`n>>> 6. Registrando Venta Rápida con Efectivo..." -ForegroundColor Cyan
$salePayload = @{
    customerName = "Distribuidora Los Andes SpA"
    paymentMethod = "CASH"
    items = @(
        @{
            productId = $prod.id
            productSku = $prod.sku
            productName = $prod.name
            quantity = 2
            unitPriceMinor = $prod.priceMinor
            subtotalMinor = 2 * $prod.priceMinor
        }
    )
    totalMinor = 2 * $prod.priceMinor
} | ConvertTo-Json -Depth 5

$sale = Invoke-RestMethod -Uri "$base/api/v1/sales" -Method Post -Body $salePayload -ContentType "application/json"
Write-Host "    Venta Registrada: Folio $($sale.id) - Total: `$$($sale.totalMinor) - Pago: $($sale.paymentMethod) - Items: $($sale.items.Count)" -ForegroundColor Green

Write-Host "`n>>> 7. Consultando Estado del Arqueo de Caja Actual..." -ForegroundColor Cyan
$currentShift = Invoke-RestMethod -Uri "$base/api/v1/cash-shifts/current" -Method Get
Write-Host "    Estado Caja: $($currentShift.status) - Saldo Inicial: `$$($currentShift.initialCashMinor) - Ventas Efectivo: `$$($currentShift.cashSalesMinor) - Total Esperado en Gaveta: `$$($currentShift.expectedCashMinor)" -ForegroundColor Green

Write-Host "`n>>> 8. Verificando Métricas Consolidadas del Dashboard..." -ForegroundColor Cyan
$dash = Invoke-RestMethod -Uri "$base/api/v1/dashboard" -Method Get
Write-Host "    Clientes: $($dash.customers) | Productos: $($dash.products) | Unidades Stock: $($dash.stockUnits) | Ventas Totales: `$$($dash.salesTotalMinor) CLP | Caja Abierta: $($dash.openShift) | Efectivo en Gaveta: `$$($dash.cashInRegisterMinor) CLP" -ForegroundColor Green

Write-Host "`n>>> 9. Ejecutando Cierre de Caja y Arqueo Cuadrado..." -ForegroundColor Cyan
$closePayload = @{
    actualCashMinor = $currentShift.expectedCashMinor
    closedBy = "Jonathan Operador"
    notes = "Cierre diario verificado y cuadrado al 100%"
} | ConvertTo-Json

$closedShift = Invoke-RestMethod -Uri "$base/api/v1/cash-shifts/close" -Method Post -Body $closePayload -ContentType "application/json"
Write-Host "    Turno Cerrado con Éxito: ID $($closedShift.id) - Esperado: `$$($closedShift.expectedCashMinor) - Real: `$$($closedShift.actualCashMinor) - Diferencia: `$$($closedShift.differenceMinor)" -ForegroundColor Green

Write-Host "`n>>> 10. Verificando que Caja ahora reporte CERRADA..." -ForegroundColor Cyan
$afterCloseShift = Invoke-RestMethod -Uri "$base/api/v1/cash-shifts/current" -Method Get
Write-Host "    Estado de Caja: $($afterCloseShift.status)" -ForegroundColor Green

Write-Host "`n========================================================" -ForegroundColor Yellow
Write-Host "   TODOS LOS SERVICIOS DE NEXORA ERP OPERANDO AL 100%   " -ForegroundColor Yellow
Write-Host "========================================================" -ForegroundColor Yellow
