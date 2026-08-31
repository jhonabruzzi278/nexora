# 🤝 Guía de Contribución y Reglas del Repositorio — Nexora

¡Te damos la bienvenida al equipo de **Nexora**! 🚀

Este documento contiene las reglas, estándares y buenas prácticas para colaborar de forma ordenada, segura y consistente en el proyecto. Léelo con calma antes de realizar tu primer Pull Request.

---

## 🧭 Índice

1. [Filosofía y Arquitectura Básica](#1-filosofía-y-arquitectura-básica)
2. [Reglas de Oro (Obligatorias)](#2-reglas-de-oro-obligatorias)
3. [Flujo de Trabajo con Git y Ramas](#3-flujo-de-trabajo-con-git-y-ramas)
4. [Convención de Commits](#4-convención-de-commits)
5. [Estándares de Código y Patrones](#5-estándares-de-código-y-patrones)
6. [Cómo Probar tus Cambios Localmente (Pre-flight Checklist)](#6-cómo-probar-tus-cambios-localmente-pre-flight-checklist)
7. [Cómo Crear un Pull Request (PR)](#7-cómo-crear-un-pull-request-pr)

---

## 1. Filosofía y Arquitectura Básica

Nexora es un MVP educativo de un ERP modular y multi-inquilino (*multi-tenant*), diseñado para ser *cloud-ready* en AWS:

- **Monorepo gestionado con Bun:**
  - `apps/web`: Frontend con **Vue 3**, **Vite** y **TypeScript**.
  - `apps/api`: Backend con **Node.js**, **Fastify** y **TypeScript**.
  - `packages/contracts`: Tipos TypeScript y contratos compartidos entre frontend y backend.
  - `infra/terraform`: Infraestructura como Código (IaC) para la tabla DynamoDB y red.
- **Base de Datos:** Única tabla en **Amazon DynamoDB** (emulada localmente con **Floci** en el puerto `4566`).
- **Contenedores:** Todo corre localmente sobre **Docker Desktop** y **Docker Compose**.

---

## 2. Reglas de Oro (Obligatorias)

### 🔒 1. Cero Secretos y Credenciales en Git
- **NUNCA** subas credenciales reales de AWS (`AKIA...`, `ASIA...`), tokens, contraseñas ni archivos `.env` con datos privados.
- El CI rechazará automáticamente cualquier commit que contenga patrones de claves AWS.
- En local solo usamos credenciales ficticias (`test` / `test`).

### 📦 2. Modelo Single-Table en DynamoDB
- Todas las particiones (`PK`) deben comenzar con el prefijo del tenant: `TENANT#<id_tenant>...` (ej: `TENANT#demo#CUSTOMERS`).
- **PROHIBIDO el uso de `Scan`** en operaciones normales de la aplicación. Se debe usar siempre `Query` por partición con paginación.
- **Operaciones atómicas:** Compras y ventas que modifiquen stock deben usar `TransactWriteItems` y expresiones condicionales para evitar stock negativo o duplicados.
- **Moneda:** Los valores monetarios se guardan como **enteros en la unidad mínima** (ej. pesos sin decimales o centavos), nunca como números de coma flotante (`float`/`double`).
- **Fechas:** Siempre en formato UTC ISO 8601 (`new Date().toISOString()`).

### 🧩 3. Monorepo y Contratos
- Toda estructura o DTO que se intercambie entre la API y la Web debe definirse primero en `packages/contracts`.
- El frontend y el backend no deben inventar tipos duplicados por separado.

---

## 3. Flujo de Trabajo con Git y Ramas

Trabajamos con un modelo basado en ramas cortas (*Short-lived feature branches*):

1. **La rama `main` está protegida:** No se realizan commits directos a `main`.
2. **Crea siempre una rama a partir de `main` actualizada:**
   ```bash
   git checkout main
   git pull origin main
   git checkout -b feature/nombre-de-tu-tarea
   ```

### Prefijos de ramas permitidos:
- `feature/` o `feat/`: Nueva funcionalidad (ej: `feature/crud-clientes`).
- `fix/`: Corrección de un error o bug (ej: `fix/calculo-total-venta`).
- `docs/`: Cambios o mejoras solo en documentación (ej: `docs/actualizar-guia`).
- `refactor/`: Refactorización de código sin alterar funcionalidad.
- `test/`: Agregar o modificar pruebas unitarias/integración.
- `infra/`: Cambios en Terraform o Docker Compose.

---

## 4. Convención de Commits

Usamos el estándar **Conventional Commits** en español o inglés sencillo. Esto ayuda a mantener un historial limpio y legible:

### Estructura:
```text
<tipo>(<alcance opcional>): <descripción corta en imperativo>
```

### Tipos comunes:
- `feat`: Nueva característica.
- `fix`: Corrección de bug.
- `docs`: Documentación.
- `refactor`: Cambio de código sin cambio de comportamiento.
- `test`: Añadir o actualizar pruebas.
- `chore`: Tareas de mantenimiento o configuración.

### Ejemplos válidos:
- `feat(api): agregar endpoint para listar productos`
- `feat(web): implementar formulario de registro de cliente`
- `fix(dynamo): corregir condición de stock mínimo en venta`
- `docs: actualizar diagrama de arquitectura en el README`
- `test(api): agregar pruebas unitarias para transacciones de compras`
- `refactor(contracts): simplificar tipo DashboardSummary`

---

## 5. Estándares de Código y Patrones

- **TypeScript:** Modo estricto activado (`strict: true`). Evita el uso de `any`; tipa explícitamente parámetros y retornos.
- **Frontend (Vue 3):**
  - Usa `<script setup lang="ts">` (Composition API).
  - Mantén los componentes limpios y reutilizables.
  - Maneja siempre los estados de **carga (loading)**, **éxito** y **error (empty/error state)**.
- **Backend (Fastify):**
  - Mantén los controladores delgados y la lógica de negocio desacoplada de la capa HTTP.
  - Usa validación de esquemas (JSON Schema / TypeBox / contratos compartidos).
  - Registra logs estructurados en JSON con `request.log`.

---

## 6. Cómo Probar tus Cambios Localmente (Pre-flight Checklist)

Antes de enviar tu Pull Request, ejecuta siempre los siguientes comandos en la raíz del proyecto para asegurar que el CI pasará en verde:

```powershell
# 1. Comprobar tipos TypeScript en todo el monorepo
bun run typecheck

# 2. Ejecutar suite de pruebas
bun run test

# 3. Validar que la compilación pase sin errores
bun run build

# 4. Formatear y validar código de Terraform
terraform -chdir=infra/terraform fmt -check -recursive
terraform -chdir=infra/terraform validate
```

Si todos los comandos terminan sin errores (código de salida `0`), ¡estás lista para hacer Push y abrir tu PR! 🎉

---

## 7. Cómo Crear un Pull Request (PR)

1. Sube tu rama a GitHub:
   ```bash
   git push -u origin feature/tu-rama
   ```
2. Abre el Pull Request en GitHub apuntando hacia `main`.
3. Completa la plantilla de PR explicando:
   - ¿Qué problema resuelve o qué función agrega?
   - ¿Cómo se puede probar manualmente?
   - Marca el checklist de verificación.
4. Espera la ejecución del flujo de GitHub Actions (CI). Si algo falla, revisa el log, corrígelo en tu rama local y vuelve a hacer push.
5. Solicita la revisión a un compañero de equipo.

---

¿Tienes dudas o necesitas ayuda? Pregunta en el canal del equipo o crea un *Issue* en el repositorio. ¡Gracias por contribuir a Nexora! 🌟
