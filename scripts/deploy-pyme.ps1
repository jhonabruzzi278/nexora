# ==============================================================================
# NEXORA ERP - Despliegue Automatizado Llave en Mano para Cliente Pyme
# Slogan: "Sencillez y Rapidez"
# Modelo: MSP Dedicado en Cuenta AWS del Cliente
# ==============================================================================

[CmdletBinding()]
param (
    [Parameter(Mandatory = $false)]
    [string]$ClientSlug = "pyme-demo",

    [Parameter(Mandatory = $false)]
    [ValidateSet("lab", "prod")]
    [string]$Environment = "lab",

    [Parameter(Mandatory = $false)]
    [string]$AwsRegion = "us-east-1",

    [Parameter(Mandatory = $false)]
    [string]$CustomDomain = "",

    [Parameter(Mandatory = $false)]
    [switch]$SkipBuild,

    [Parameter(Mandatory = $false)]
    [switch]$AutoApprove
)

$ErrorActionPreference = "Stop"

function Write-Step {
    param([string]$Text)
    Write-Host "`n[NEXORA] " -ForegroundColor Cyan -NoNewline
    Write-Host $Text -ForegroundColor White
}

function Write-Success {
    param([string]$Text)
    Write-Host "  ✓ " -ForegroundColor Green -NoNewline
    Write-Host $Text -ForegroundColor Gray
}

function Write-Alert {
    param([string]$Text)
    Write-Host "  ! " -ForegroundColor Yellow -NoNewline
    Write-Host $Text -ForegroundColor Yellow
}

Clear-Host
Write-Host "=================================================================" -ForegroundColor DarkCyan
Write-Host "       NEXORA ERP PYME - DESPLIEGUE LLAVE EN MANO               " -ForegroundColor Cyan
Write-Host "                 'Sencillez y Rapidez'                           " -ForegroundColor White
Write-Host "=================================================================" -ForegroundColor DarkCyan
Write-Host "Cliente Objetivo: $ClientSlug" -ForegroundColor Yellow
Write-Host "Entorno:          $Environment" -ForegroundColor Yellow
Write-Host "Región AWS:       $AwsRegion" -ForegroundColor Yellow

# 1. Comprobación de Herramientas
Write-Step "1/5 Verificando herramientas locales..."
$tools = @("bun", "terraform", "aws")
foreach ($tool in $tools) {
    if (-not (Get-Command $tool -ErrorAction SilentlyContinue)) {
        Write-Error "Herramienta obligatoria no encontrada en PATH: $tool. Por favor instálala antes de continuar."
    }
    Write-Success "$tool detectado correctamente."
}

# 2. Verificación de Credenciales AWS
Write-Step "2/5 Verificando identidad y permisos en cuenta AWS del cliente..."
try {
    $identityJson = aws sts get-caller-identity --output json | ConvertFrom-Json
    $accountId = $identityJson.Account
    $callerArn = $identityJson.Arn
    Write-Success "Conectado a AWS Account: $accountId"
    Write-Success "Identidad activa: $callerArn"
} catch {
    Write-Error "No se pudo obtener la identidad de AWS. Asegúrate de configurar tus credenciales (AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, AWS_SESSION_TOKEN)."
}

# 3. Compilación de Artefactos de Producción
if (-not $SkipBuild) {
    Write-Step "3/5 Compilando paquetes de producción (API Lambda ARM64 + Web SPA)..."
    Push-Location (Join-Path $PSScriptRoot "..")
    try {
        Write-Host "  Compilando contratos..." -ForegroundColor DarkGray
        bun run --cwd packages/contracts build | Out-Null
        Write-Success "Contratos TypeScript compilados."

        Write-Host "  Compilando API Fastify/Lambda..." -ForegroundColor DarkGray
        bun run --cwd apps/api build:lambda | Out-Null
        Write-Success "Bundle Lambda generado (apps/api/dist/lambda.js)."

        Write-Host "  Compilando Frontend Vue 3 / Vite..." -ForegroundColor DarkGray
        bun run --cwd apps/web build | Out-Null
        Write-Success "Bundle Frontend generado (apps/web/dist)."
    } finally {
        Pop-Location
    }
} else {
    Write-Step "3/5 Omitiendo compilación (-SkipBuild especificado)."
}

# 4. Configurar Parámetros de Terraform
Write-Step "4/5 Configurando infraestructura serverless..."
$infraDir = Join-Path $PSScriptRoot "..\infra\aws\app"

$isLab = ($Environment -eq "lab")
$useLabRole = $isLab
$enableCdn = (-not $isLab) # En lab CloudFront está restringido, en prod se habilita
$enableBudget = (-not $isLab) # En lab Budgets suele estar restringido

$tfvarsContent = @"
aws_account_id              = "$accountId"
aws_region                  = "$AwsRegion"
environment                 = "$Environment"
alert_email                 = "admin@nexora.local"
budget_limit_usd            = 40
lambda_reserved_concurrency = 2
use_lab_role                = $(if ($useLabRole) { "true" } else { "false" })
lab_role_name               = "LabRole"
enable_cdn                  = $(if ($enableCdn) { "true" } else { "false" })
enable_budget               = $(if ($enableBudget) { "true" } else { "false" })
"@

Set-Content -Path (Join-Path $infraDir "terraform.tfvars") -Value $tfvarsContent -Encoding UTF8
Write-Success "Archivo terraform.tfvars configurado para $accountId ($Environment)."

# 5. Ejecución de Terraform
Write-Step "5/5 Aplicando infraestructura en AWS con Terraform..."
Push-Location $infraDir
try {
    Write-Host "  Inicializando proveedores de Terraform..." -ForegroundColor DarkGray
    terraform init -input=false | Out-Null
    Write-Success "Terraform inicializado."

    $approveArg = if ($AutoApprove) { "-auto-approve" } else { "" }
    Write-Host "  Desplegando recursos (DynamoDB, Lambda ARM64, API Gateway, S3)..." -ForegroundColor Yellow
    
    if ($AutoApprove) {
        terraform apply -auto-approve
    } else {
        terraform apply
    }

    if ($LASTEXITCODE -ne 0) {
        Write-Error "Fallo en la ejecución de terraform apply."
    }

    # Obtener outputs de Terraform
    $outputs = terraform output -json | ConvertFrom-Json
    $apiEndpoint = $outputs.api_endpoint.value
    $dynamoTable = $outputs.dynamodb_table_name.value
    $webBucket = $outputs.web_bucket_name.value

} finally {
    Pop-Location
}

# Sincronizar archivos del frontend a S3 si el bucket está disponible
if ($webBucket) {
    Write-Step "Sincronizando archivos estáticos de la aplicación web con S3..."
    $webDistDir = Join-Path $PSScriptRoot "..\apps\web\dist"
    if (Test-Path $webDistDir) {
        aws s3 sync $webDistDir "s3://$webBucket" --delete | Out-Null
        Write-Success "Frontend sincronizado en s3://$webBucket"
    }
}

# Resumen Final
Write-Host "`n=================================================================" -ForegroundColor Green
Write-Host "     ¡DESPLIEGUE FINALIZADO EXITOSAMENTE PARA EL CLIENTE!        " -ForegroundColor Green
Write-Host "=================================================================" -ForegroundColor Green
Write-Host "`n[DATOS DE ACCESO]" -ForegroundColor White
Write-Host "  URL API Gateway:   " -NoNewline -ForegroundColor Gray
Write-Host "$apiEndpoint" -ForegroundColor Cyan
Write-Host "  Healthcheck:       " -NoNewline -ForegroundColor Gray
Write-Host "$apiEndpoint/health" -ForegroundColor Cyan
Write-Host "  Resumen Dashboard: " -NoNewline -ForegroundColor Gray
Write-Host "$apiEndpoint/api/v1/dashboard" -ForegroundColor Cyan
Write-Host "  Base DynamoDB:     " -NoNewline -ForegroundColor Gray
Write-Host "$dynamoTable" -ForegroundColor Yellow
Write-Host "  Bucket Frontend:   " -NoNewline -ForegroundColor Gray
Write-Host "$webBucket" -ForegroundColor Yellow

if ($CustomDomain) {
    Write-Host "`n[CONFIGURACIÓN DE DOMINIO PERSONALIZADO]" -ForegroundColor White
    Write-Host "  Para activar $CustomDomain:" -ForegroundColor Gray
    Write-Host "  1. Crea un registro CNAME en el DNS del cliente apuntando a: $apiEndpoint" -ForegroundColor Yellow
}

Write-Host "`n[ESTIMACIÓN DE COSTOS MENSUALES AWS]" -ForegroundColor White
Write-Host "  • Amazon DynamoDB (On-Demand):   `$0.00 (Hasta 25 GB y 200M lecturas gratis)" -ForegroundColor Gray
Write-Host "  • AWS Lambda (ARM64 Graviton):   `$0.00 (Hasta 1M invocaciones y 3.2M seg gratis)" -ForegroundColor Gray
Write-Host "  • Amazon API Gateway HTTP API:   `$0.00 a `$0.10 (1M llamadas incluidas)" -ForegroundColor Gray
Write-Host "  • Amazon S3 Almacenamiento:      `$0.02 (Bundle ligero de 150 KB)" -ForegroundColor Gray
Write-Host "  • TOTAL ESTIMADO CLIENTE:        `$0.00 a `$0.50 USD / mes (100% Predecible)" -ForegroundColor Green

Write-Host "`n[OPERACIÓN Y SOPORTE]" -ForegroundColor White
Write-Host "  El cliente paga directamente su factura mínima a AWS." -ForegroundColor Gray
Write-Host "  Tú mantienes y actualizas el sistema ejecutando este mismo script con nuevas versiones." -ForegroundColor Gray
Write-Host "=================================================================`n" -ForegroundColor DarkCyan
