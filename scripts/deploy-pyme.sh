#!/usr/bin/env bash
# ==============================================================================
# NEXORA ERP - Despliegue Automatizado Llave en Mano para Cliente Pyme
# Slogan: "Sencillez y Rapidez"
# ==============================================================================

set -euo pipefail

CLIENT_SLUG="${1:-pyme-demo}"
ENVIRONMENT="${2:-lab}"
AWS_REGION="${3:-us-east-1}"

echo "================================================================="
echo "       NEXORA ERP PYME - DESPLIEGUE LLAVE EN MANO               "
echo "                 'Sencillez y Rapidez'                           "
echo "================================================================="
echo "Cliente: $CLIENT_SLUG | Entorno: $ENVIRONMENT | Región: $AWS_REGION"

# 1. Comprobar herramientas
command -v bun >/dev/null 2>&1 || { echo "Error: bun es requerido"; exit 1; }
command -v terraform >/dev/null 2>&1 || { echo "Error: terraform es requerido"; exit 1; }
command -v aws >/dev/null 2>&1 || { echo "Error: aws CLI es requerido"; exit 1; }

# 2. Identidad AWS
ACCOUNT_ID=$(aws sts get-caller-identity --query "Account" --output text)
echo "Conectado a AWS Account: $ACCOUNT_ID"

# 3. Compilación
echo "Compilando paquetes (contratos, API Lambda, Web SPA)..."
bun run --cwd packages/contracts build
bun run --cwd apps/api build:lambda
bun run --cwd apps/web build

# 4. Terraform
cd infra/aws/app
terraform init -input=false

USE_LAB_ROLE="false"
ENABLE_CDN="true"
ENABLE_BUDGET="true"

if [ "$ENVIRONMENT" = "lab" ]; then
  USE_LAB_ROLE="true"
  ENABLE_CDN="false"
  ENABLE_BUDGET="false"
fi

cat <<EOF > terraform.tfvars
environment        = "$ENVIRONMENT"
aws_region         = "$AWS_REGION"
project_name       = "nexora-$CLIENT_SLUG"
account_id         = "$ACCOUNT_ID"
use_lab_role       = $USE_LAB_ROLE
enable_cdn         = $ENABLE_CDN
enable_budget      = $ENABLE_BUDGET
budget_amount      = "5.0"
notification_email = "admin@nexora.cloud"
cors_origins       = ["*"]
EOF

terraform apply -auto-approve

API_ENDPOINT=$(terraform output -raw api_endpoint)
WEB_BUCKET=$(terraform output -raw web_bucket_name || echo "")

cd ../../..

if [ -n "$WEB_BUCKET" ] && [ -d "apps/web/dist" ]; then
  echo "Sincronizando frontend a S3 ($WEB_BUCKET)..."
  aws s3 sync apps/web/dist "s3://$WEB_BUCKET" --delete
fi

echo "================================================================="
echo "¡DESPLIEGUE COMPLETADO!"
echo "API Endpoint: $API_ENDPOINT"
echo "Healthcheck:  $API_ENDPOINT/health"
echo "Costo mensual estimado: \$0.00 a \$0.50 USD / mes (100% Predecible)"
echo "================================================================="
