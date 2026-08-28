# ADR 0003: despliegue serverless para AWS laboratorio

- Estado: aceptado
- Fecha: 2026-08-28

## Contexto

La cuenta laboratorio dispone de USD 50 y credenciales temporales. El MVP solo expone una lectura de dashboard y todavía no incorpora Cognito. Un runtime permanente en EC2, ECS/Fargate, NAT Gateway o Application Load Balancer consumiría presupuesto aun sin tráfico.

## Decisión

Se usa S3 privado con CloudFront OAC para Vue, API Gateway HTTP API con Lambda para el backend y DynamoDB bajo demanda. Lambda no se conecta a la VPC porque consume DynamoDB directamente y no requiere recursos privados. La VPC de Floci se conserva como fundamento para una fase que realmente necesite workloads privados.

El despliegue es manual, usa un GitHub Environment y credenciales de sesión. Verifica el account ID antes de cualquier cambio. El runtime usa rol IAM y nunca recibe claves AWS. Se agregan presupuesto, alarmas, retención breve de logs, throttling y concurrencia limitada.

## Consecuencias

- costo proporcional al uso y sin servidores o NAT permanentes;
- bucket web no público y tráfico de usuario cifrado por HTTPS;
- cold starts aceptables para una prueba;
- credenciales de laboratorio deben renovarse en GitHub mientras OIDC no esté permitido;
- la API sigue siendo pública y solo es apta para datos sintéticos hasta incorporar Cognito;
- la eliminación del ambiente borra la tabla y los artefactos web del laboratorio.
