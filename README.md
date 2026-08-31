# ⚡ Nexora

> **ERP modular y multi-inquilino (*multi-tenant*) con arquitectura moderna en la nube.**  
> Entorno de desarrollo local 100% reproducible con Vue 3, Node.js/Fastify, Bun, Docker, Terraform y Amazon DynamoDB emulado mediante Floci.

---

## 🧭 Documentación para el Equipo

Si eres nueva en el repositorio o vas a empezar a programar:
- 🚀 **[Guía de Inicio Rápido (Onboarding)](./docs/GUIA_COLABORADOR.md):** Cómo configurar tu entorno paso a paso en 5 minutos.
- 🤝 **[Reglas del Repositorio y Contribución](./CONTRIBUTING.md):** Convenciones de Git, commits, ramas y reglas obligatorias de DynamoDB.
- 📋 **[Plan del MVP](./PLAN_MVP_NEXORA.md):** Alcance funcional, historias de usuario y decisiones arquitectónicas.
- 🗺️ **[Roadmap a 12 semanas](./docs/ROADMAP_PRODUCTO_AWS.md):** Fases, entregas, gates de calidad y ruta AWS.

---

## 🛠️ Requisitos Previos

- **[Docker Desktop](https://www.docker.com/products/docker-desktop/)** (en ejecución)
- **[Bun](https://bun.sh/)** v1.3+
- **[Node.js](https://nodejs.org/)** v20+ / v24+
- **[Terraform](https://developer.hashicorp.com/terraform/install)** v1.10+
- **[AWS CLI v2](https://aws.amazon.com/cli/)**

---

## ⚡ Arranque Rápido en Local

### 1. Clonar e instalar dependencias
```powershell
git clone <url-del-repositorio>
cd nexora
bun install
```

### 2. Levantar el emulador local de AWS (Floci)
```powershell
docker compose up -d floci
```

### 3. Crear la infraestructura local con Terraform
```powershell
terraform -chdir=infra/terraform init
terraform -chdir=infra/terraform apply -auto-approve
terraform -chdir=infra/terraform apply -auto-approve
```
> *Nota: Se aplica dos veces porque en local la segunda pasada limpia reglas de egress que Floci genera automáticamente.*

### 4. Levantar la aplicación (API + Frontend)
```powershell
docker compose up --build -d api web
```

---

## 🌐 Enlaces Locales

| Servicio | URL / Enlace | Descripción |
| :--- | :--- | :--- |
| **Frontend Web** | [http://localhost:5173](http://localhost:5173) | Interfaz web de usuario (Vue 3 + Vite) |
| **API Backend** | [http://localhost:3000](http://localhost:3000) | Endpoints REST de la API Fastify |
| **Health API** | [http://localhost:3000/health](http://localhost:3000/health) | Estado del servicio backend |
| **Floci (AWS Emulado)** | [http://localhost:4566](http://localhost:4566) | Endpoint local compatible con AWS SDK / CLI |
| **Health Floci** | [http://localhost:4566/_floci/health](http://localhost:4566/_floci/health) | Estado de servicios en Floci |

---

## 💻 Desarrollo Diario con Recarga Rápida (Hot Reload)

Si estás trabajando en código y prefieres no reconstruir contenedores Docker en cada cambio:

1. Mantén Floci encendido en Docker: `docker compose up -d floci`
2. En una terminal, ejecuta la API:
   ```powershell
   bun run dev:api
   ```
3. En otra terminal, ejecuta el Frontend:
   ```powershell
   bun run dev:web
   ```

---

## 🧪 Verificación y Comandos del Proyecto

Ejecuta estas validaciones antes de enviar un Pull Request:

```powershell
# Validar tipos TypeScript en todo el monorepo
bun run typecheck

# Ejecutar pruebas unitarias
bun run test

# Probar compilación del proyecto
bun run build

# Validar y formatear Terraform
terraform -chdir=infra/terraform fmt -check -recursive
terraform -chdir=infra/terraform validate
```

### Comandos de Docker útiles
```powershell
docker compose ps           # Ver estado de los contenedores
docker compose logs -f api  # Ver logs del backend en vivo
docker compose down         # Detener todos los contenedores
```

---

## 🔍 Inspeccionar DynamoDB con AWS CLI

Para consultar la tabla local `nexora-local` desde tu terminal:

```powershell
$env:AWS_ACCESS_KEY_ID='test'
$env:AWS_SECRET_ACCESS_KEY='test'
$env:AWS_DEFAULT_REGION='us-east-1'
aws --endpoint-url http://localhost:4566 dynamodb describe-table --table-name nexora-local
```

---

## 🏛️ Estructura del Monorepo

```text
nexora/
├── apps/
│   ├── api/             # Backend Fastify + DynamoDB SDK v3
│   └── web/             # Frontend Vue 3 + Vite + TypeScript
├── packages/
│   └── contracts/       # DTOs, esquemas y tipos compartidos
├── infra/
│   ├── terraform/       # Tabla DynamoDB y VPC local en Floci
│   └── aws/             # Definiciones IaC para despliegue en AWS real
├── docs/                # ADRs, guías de colaboración y formación
├── .github/             # Workflows de CI/CD y plantillas de PR
├── compose.yaml         # Configuración de servicios Docker
└── package.json         # Scripts de raíz del monorepo
```
