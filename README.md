# Nexora

MVP educativo de un ERP modular. El entorno local usa Vue, Node.js, Bun, Docker Desktop, Terraform, AWS CLI/SDK y DynamoDB emulado con Floci.

## Requisitos

- Bun 1.3+
- Node.js 24+
- Docker Desktop
- Terraform 1.10+
- AWS CLI v2

## Primer arranque

1. Copiar `.env.example` a `.env` si se trabajará fuera de Docker.
2. Instalar dependencias:

   ```powershell
   bun install
   ```

3. Levantar Floci:

   ```powershell
   docker compose up -d floci
   ```

4. Inicializar la infraestructura local:

   ```powershell
   terraform -chdir=infra/terraform init
   terraform -chdir=infra/terraform apply -auto-approve
   terraform -chdir=infra/terraform apply -auto-approve
   terraform -chdir=infra/terraform plan -detailed-exitcode
   ```

   La segunda aplicación elimina el egress permisivo que Floci agrega al crear
   un security group. El código de salida esperado del plan final es `0`.

5. Levantar la aplicación:

   ```powershell
   docker compose up --build -d api web
   ```

6. Abrir `http://localhost:5173`.

## Verificación con AWS CLI

```powershell
$env:AWS_ACCESS_KEY_ID='test'
$env:AWS_SECRET_ACCESS_KEY='test'
$env:AWS_DEFAULT_REGION='us-east-1'
aws --endpoint-url http://localhost:4566 dynamodb describe-table --table-name nexora-local
```

## Comandos del proyecto

```powershell
bun run typecheck
bun run test
bun run build
terraform -chdir=infra/terraform fmt -check -recursive
terraform -chdir=infra/terraform validate
docker compose ps
docker compose logs -f api
docker compose down
```

## Puertos locales

- Web: `5173`
- API: `3000`
- Floci/AWS: `4566`

La API utiliza `http://floci:4566` dentro de Docker. Terraform y AWS CLI utilizan `http://localhost:4566` desde Windows.

## Red AWS emulada

Terraform también crea una base de red segura en Floci:

- VPC `10.20.0.0/16`;
- dos subredes públicas y dos privadas en `us-east-1a` y `us-east-1b`;
- Internet Gateway y rutas únicamente para las subredes públicas;
- subredes privadas sin NAT ni salida directa a Internet;
- grupo `edge` con entrada TCP 80/443;
- grupo `application` con entrada TCP 3000 solo desde los CIDR de las subredes edge;
- sin SSH/RDP y con salida restringida por puerto y capa.

Para inspeccionarla:

```powershell
aws --endpoint-url http://localhost:4566 ec2 describe-vpcs
aws --endpoint-url http://localhost:4566 ec2 describe-subnets
aws --endpoint-url http://localhost:4566 ec2 describe-security-groups
```

La red es una base para el futuro runtime AWS; los contenedores locales continúan comunicándose mediante la red privada de Docker Compose.

## Alcance

El detalle funcional, las exclusiones y el plan por semanas están en [PLAN_MVP_NEXORA.md](./PLAN_MVP_NEXORA.md). Las decisiones que condicionan la arquitectura se registran en `docs/adr`.

## Prueba en AWS

El despliegue de laboratorio usa S3 privado/CloudFront, API Gateway, Lambda y DynamoDB, con presupuesto y alarmas. No uses datos reales mientras Cognito no esté implementado. La preparación del backend Terraform, los secrets temporales de GitHub, el workflow de despliegue y el apagado están en [docs/AWS_LAB_DEPLOYMENT.md](./docs/AWS_LAB_DEPLOYMENT.md).

La planificación ejecutable de 12 semanas, módulos, gates, pruebas, FinOps y ruta Cloud Practitioner está resumida en [docs/ROADMAP_PRODUCTO_AWS.md](./docs/ROADMAP_PRODUCTO_AWS.md).
