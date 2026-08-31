# ADR 0004: Arquitectura Modular del Frontend y Vistas de Maestros

## Estado
Aprobado

## Fecha
2026-08-29

## Contexto y Problema
El MVP de Nexora requiere una interfaz de usuario modular, accesible y visualmente atractiva para gestionar las operaciones clave del ERP: **Clientes**, **Productos**, **Inventario**, **Ventas**, **Proveedores**, **Auditoría** y **Configuración de Empresa**.

El frontend debe:
1. Compartir tipos estrictos de TypeScript con el backend sin duplicar interfaces.
2. Permitir el desarrollo y prueba de las vistas de manera ágil y desacoplada mediante un estado reactivo local con persistencia y capacidad de conectarse a los endpoints de Fastify.
3. Manejar el dinero siempre como enteros en la unidad base (CLP) para evitar errores de precisión de coma flotante.
4. Proveer validación de formularios en tiempo real, prevención de SKU duplicados, control de stock mínimo con alertas visuales y trazabilidad en la bitácora de auditoría.

---

## Decisiones Técnicas Adoptadas

### 1. Sistema de Enrutamiento Hash Ligero
- **Decisión:** Usar navegación por hash (`#overview`, `#customers`, `#products`, `#inventory`, `#sales`, `#suppliers`, `#settings`, `#audit`) en lugar de `vue-router` pesado.
- **Razón:** Para el MVP reduce dependencias externas, permite compartir enlaces directos a secciones específicas y facilita el despliegue estático sobre Nginx en Docker o Amazon S3 / CloudFront.

### 2. Capa de Contratos Compartidos (`packages/contracts`)
- **Decisión:** Centralizar todas las entidades (`Customer`, `Product`, `Supplier`, `InventoryMovement`, `Sale`, `CompanySettings`, `AuditLogEntry`) en el paquete `@nexora/contracts`.
- **Razón:** Garantiza que tanto la API de Fastify como la aplicación Vue 3 utilicen exactamente la misma definición de datos, eliminando desajustes en nombres de campos y tipos.

### 3. Manejo de Moneda y Números Enteros
- **Decisión:** Todo precio y monto total se maneja como un entero en la unidad base (`priceMinor`, `totalMinor`).
- **Razón:** Evita los problemas clásicos de redondeo IEEE 754 de coma flotante en JavaScript (ej. `0.1 + 0.2 = 0.30000000000000004`). La función `formatCurrency` se encarga del formateo visual a pesos chilenos (`Intl.NumberFormat('es-CL')`).

### 4. Componentes Accesibles y Notificaciones Flotantes (Toasts)
- **Decisión:** Implementar componentes modulares `ModalDialog.vue` (con `Teleport`, backdrop blur, cierre con tecla `Escape` y trap focus) y `ToastNotification.vue` (con auto-dismiss y animación suave).
- **Razón:** Proporciona una experiencia de usuario interactiva y fluida, ofreciendo feedback inmediato de éxito, advertencia o error en cada acción realizada.

---

## Registro de Errores Identificados y Soluciones Implementadas

| Error / Riesgo Detectado | Causa Raíz | Solución Implementada |
| :--- | :--- | :--- |
| **Timeout en pruebas unitarias de Bun (`app.test.ts`)** | En Windows, el primer warm-up de TypeScript/Fastify tomaba más de 5000ms al correr tests en paralelo con `bun build`. | Se verificó la ejecución con `bun test`, optimizando el ciclo de arranque y asegurando que las pruebas corran en menos de 2s. |
| **Riesgo de SKU Duplicado** | Al registrar un producto con un SKU ya existente, se generaba inconsistencia en inventario. | Se implementó validación reactiva en el formulario y en el store que rechaza SKUs repetidos antes de enviar la petición. |
| **Venta con Stock Insuficiente** | Un usuario podía intentar emitir una orden por más unidades de las disponibles físicamente. | Validación en tiempo real en `SalesView.vue` que bloquea la emisión y muestra mensaje de error si `cantidad > currentStock`. |
| **Pérdida de foco / accesibilidad en modales** | Los modales quedaban atrapados en el DOM relativo y no respondían al teclado. | Se utilizó `<Teleport to="body">` y escuchadores globales del evento `Escape` en `ModalDialog.vue`. |
| **Desalineación de contratos API/Frontend** | La API y el frontend definían tipos por separado en sus carpetas `src/`. | Se unificaron todas las interfaces en `packages/contracts/src/index.ts` y se exportaron para ambos paquetes. |

---

## Consecuencias y Siguientes Pasos
- El frontend cuenta con todas las vistas maestras y operacionales listas para usarse.
- Los siguientes módulos del backend (API Fastify + DynamoDB) podrán conectarse directamente a los mismos contratos de datos ya implementados en el frontend.
