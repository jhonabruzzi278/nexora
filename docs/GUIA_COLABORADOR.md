# 🚀 Guía Rápida para Nuevos Colaboradores (Onboarding)

¡Hola! Esta guía está pensada para que puedas entender el proyecto y tener tu entorno de desarrollo listo en **menos de 10 minutos**.

---

## 💡 ¿Qué es Nexora?

**Nexora** es un ERP modular (gestión de clientes, inventario, ventas, compras y configuración de empresa) diseñado con arquitectura moderna en la nube:
- **Frontend:** Vue 3 con TypeScript y Vite.
- **Backend:** Fastify (Node.js) con TypeScript.
- **Base de datos:** Amazon DynamoDB (utilizamos una sola tabla bajo el patrón *Single-Table Design*).
- **Emulador AWS:** Floci (un contenedor que simula los servicios de AWS en local sin gastar dinero real).

---

## 🛠️ 1. Requisitos Previos en tu Computadora

Asegúrate de tener instalados los siguientes programas:
1. **Docker Desktop** (debe estar abierto y en ejecución).
2. **Bun** (`bun --version` >= 1.3). [Instalar Bun](https://bun.sh/)
3. **Node.js** (`node --version` >= 20 o 24).
4. **Terraform** (`terraform --version` >= 1.10). [Instalar Terraform](https://developer.hashicorp.com/terraform/install)
5. **AWS CLI v2** (`aws --version`).

---

## ⚡ 2. Pasos para levantar el proyecto desde cero

Abre tu terminal (PowerShell en Windows o Bash en Mac/Linux) en la carpeta raíz del proyecto:

### Paso 1: Instalar dependencias del monorepo
```powershell
bun install
```

### Paso 2: Levantar el emulador local de AWS (Floci)
```powershell
docker compose up -d floci
```

### Paso 3: Crear la tabla DynamoDB local con Terraform
```powershell
terraform -chdir=infra/terraform init
terraform -chdir=infra/terraform apply -auto-approve
terraform -chdir=infra/terraform apply -auto-approve
```
*(Nota: Se aplica dos veces porque en local la segunda aplicación limpia reglas de red automáticas de Floci).*

### Paso 4: Levantar los contenedores de la aplicación (API y Web)
```powershell
docker compose up --build -d api web
```

---

## 🌐 3. Enlaces locales de trabajo

Una vez levantado, puedes acceder a:

| Servicio | URL | ¿Para qué sirve? |
| :--- | :--- | :--- |
| **Frontend Web** | [http://localhost:5173](http://localhost:5173) | La aplicación web visual (Vue 3) |
| **API Backend** | [http://localhost:3000](http://localhost:3000) | Endpoints de la API Fastify |
| **Health API** | [http://localhost:3000/health](http://localhost:3000/health) | Verificar si el backend está sano |
| **Floci (AWS Emulado)** | [http://localhost:4566](http://localhost:4566) | Endpoint local de DynamoDB |

---

## 💻 4. Flujo de Desarrollo Día a Día

Si prefieres programar con recarga en caliente (*hot-reload*) en tu máquina sin reconstruir Docker cada vez:

1. Mantén Floci corriendo en Docker (`docker compose up -d floci`).
2. Levanta la API localmente con Bun:
   ```powershell
   bun run dev:api
   ```
3. En otra terminal, levanta el Frontend con Bun:
   ```powershell
   bun run dev:web
   ```

---

## 📁 5. Estructura de Carpetas

```text
nexora/
├── apps/
│   ├── api/             # Código del backend (Fastify, rutas, conexión DynamoDB)
│   └── web/             # Código del frontend (Componentes Vue, vistas, CSS)
├── packages/
│   └── contracts/       # Tipos e interfaces TypeScript compartidos
├── infra/
│   └── terraform/       # Archivos de Terraform para crear la tabla DynamoDB
├── docs/                # Documentación de arquitectura y guías
├── compose.yaml         # Configuración de Docker Compose (floci, api, web)
└── package.json         # Scripts principales del monorepo
```

---

## 📋 6. Comandos útiles que debes conocer

```powershell
# Ver estado de los contenedores Docker
docker compose ps

# Ver logs en tiempo real del backend
docker compose logs -f api

# Apagar todos los contenedores
docker compose down

# Ejecutar las validaciones de calidad antes de hacer commit
bun run typecheck
bun run test
bun run build
```

---

## 🤝 7. Siguientes pasos

Lee la [Guía de Contribución (CONTRIBUTING.md)](../CONTRIBUTING.md) para conocer las reglas sobre commits, ramas y el modelo de datos en DynamoDB.

¡Mucho éxito y bienvenida al desarrollo de Nexora! 🎉
