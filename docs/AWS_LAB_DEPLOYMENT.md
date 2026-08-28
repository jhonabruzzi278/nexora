# Despliegue seguro en una cuenta AWS laboratorio

## Veredicto

Nexora está preparado para una prueba con datos sintéticos, no para producción ni para datos reales de clientes. Cognito todavía no existe y la API de lectura es pública. El despliegue limita rutas, solicitudes y concurrencia, pero no reemplaza autenticación ni WAF.

La arquitectura de laboratorio es serverless para evitar cargos por capacidad ociosa:

- Vue compilado en un bucket S3 privado, accesible únicamente mediante CloudFront OAC;
- CloudFront con HTTPS, CSP y encabezados de seguridad;
- API Gateway HTTP API con solo `GET /health` y `GET /api/v1/dashboard`;
- Lambda ARM64 con 256 MB, timeout de 10 segundos y concurrencia reservada de 2;
- DynamoDB bajo demanda y cifrado por AWS;
- logs con retención de siete días, alarmas y presupuesto mensual de USD 40;
- bucket separado, privado, cifrado y versionado para el estado de Terraform.

La VPC modelada en Floci no se despliega para este runtime. Lambda accede a DynamoDB mediante la red administrada por AWS; colocarla en subredes privadas exigiría NAT o endpoints y aumentaría costo y complejidad sin aportar valor al MVP de lectura.

## 1. Credenciales temporales

Usar exclusivamente las credenciales temporales entregadas por el laboratorio. No crear access keys de usuario IAM y nunca copiarlas a `.env`, `terraform.tfvars`, código, commits, logs o artefactos.

En PowerShell, para crear una sola vez el backend Terraform:

```powershell
$env:AWS_ACCESS_KEY_ID='<valor temporal del laboratorio>'
$env:AWS_SECRET_ACCESS_KEY='<valor temporal del laboratorio>'
$env:AWS_SESSION_TOKEN='<token temporal del laboratorio>'
$env:AWS_DEFAULT_REGION='us-east-1'

$awsAccountId = aws sts get-caller-identity --query Account --output text
aws sts get-caller-identity

terraform -chdir=infra/aws/bootstrap init
terraform -chdir=infra/aws/bootstrap plan -var="aws_account_id=$awsAccountId" -out=bootstrap.tfplan
terraform -chdir=infra/aws/bootstrap apply bootstrap.tfplan
terraform -chdir=infra/aws/bootstrap output -raw state_bucket_name
```

Verificar visualmente que el ID corresponda a la cuenta laboratorio antes de aplicar. El bucket de estado tiene bloqueo público, cifrado SSE-S3, versionado y `prevent_destroy`.

Al terminar la sesión local:

```powershell
Remove-Item Env:AWS_ACCESS_KEY_ID
Remove-Item Env:AWS_SECRET_ACCESS_KEY
Remove-Item Env:AWS_SESSION_TOKEN
```

## 2. Entorno protegido de GitHub

Crear un Environment de GitHub llamado `aws-lab`, activar aprobación requerida si el plan lo permite y configurar:

Secrets del Environment:

- `AWS_ACCESS_KEY_ID`
- `AWS_SECRET_ACCESS_KEY`
- `AWS_SESSION_TOKEN`

Variables del Environment:

- `AWS_ACCOUNT_ID`: ID de 12 dígitos verificado con STS;
- `AWS_BUDGET_EMAIL`: correo que recibirá presupuesto y alarmas;
- `TF_STATE_BUCKET`: salida exacta del bootstrap.

El session token del laboratorio expira. Actualizar los tres secrets juntos antes de cada despliegue. GitHub OIDC es preferible porque elimina secretos AWS almacenados; úsalo cuando la cuenta laboratorio permita crear un proveedor OIDC y un rol con confianza restringida al repositorio y Environment.

## 3. Despliegue

1. Subir el repositorio a GitHub y esperar que `ci` termine correctamente.
2. Abrir Actions > `deploy-aws-lab` > Run workflow.
3. Escribir exactamente `DEPLOY_NEXORA_LAB`.
4. Revisar el plan y aprobar el Environment.
5. Confirmar la suscripción SNS recibida por correo.
6. Abrir la URL publicada en el resumen del workflow.

El workflow comprueba la cuenta con STS, busca IDs de access key comprometidos, ejecuta pruebas, compila, aplica un plan guardado, sincroniza S3 y prueba el endpoint de salud.

## 4. Costos y apagado

El presupuesto de cuenta completa de USD 40 envía alertas previstas al 50% y reales al 80% y 100%. AWS Budgets no es tiempo real ni detiene automáticamente todos los servicios. Revisar Billing y Cost Explorer después del despliegue.

Para eliminar la aplicación, ejecutar `destroy-aws-lab` y escribir `DESTROY_NEXORA_LAB`. Esto elimina CloudFront, API Gateway, Lambda, logs, tabla DynamoDB y bucket web, incluidos sus objetos. El bucket privado de estado se conserva intencionalmente.

## Riesgos pendientes antes de producción

- incorporar Cognito y autorización por tenant antes de crear rutas de escritura;
- reemplazar las credenciales de GitHub por OIDC y una política de despliegue de mínimo privilegio;
- agregar WAF o controles equivalentes si la API deja de ser una demo de bajo tráfico;
- habilitar recuperación punto en el tiempo y protección contra borrado para datos reales;
- configurar dominio, certificado ACM, auditoría CloudTrail y estrategia de respaldo/restauración;
- ejecutar pruebas de carga, seguridad, recuperación y aislamiento multi-tenant.
