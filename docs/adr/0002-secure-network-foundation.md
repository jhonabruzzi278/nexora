# ADR 0002: base de red segura antes del runtime AWS

- Estado: aceptado
- Fecha: 2026-08-28

## Contexto

El acta posponía Amazon VPC hasta una fase de despliegue. Se aprobó adelantar la estructura de networking y seguridad para estudiarla en Floci antes de decidir si la API se ejecutará en ECS, Fargate, EC2 o Lambda.

## Decisión

Se crea una VPC `10.20.0.0/16` distribuida en dos zonas de disponibilidad:

- dos subredes públicas `/24` para componentes de entrada;
- dos subredes privadas `/24` para el runtime de aplicación;
- un Internet Gateway y una única tabla de rutas públicas;
- una tabla de rutas privada por zona, sin ruta por defecto a Internet;
- un grupo de seguridad `edge` con entrada pública solo en TCP 80 y 443;
- un grupo de seguridad `application` con entrada TCP 3000 solo desde los CIDR de las subredes edge;
- salida de `edge` limitada al puerto de aplicación hacia los CIDR privados y salida de la aplicación limitada a HTTPS.

No se habilitan SSH, RDP, IPv6, NAT Gateway, bastion hosts ni rangos administrativos públicos.

## Consecuencias

- La red queda segmentada y preparada para un runtime privado.
- Las subredes privadas no podrán descargar imágenes ni acceder a Internet en AWS real hasta agregar endpoints VPC o NAT.
- DynamoDB continúa siendo el único servicio de datos; los recursos VPC pertenecen al servicio de networking EC2/VPC.
- Los grupos de seguridad todavía no protegen los contenedores locales: serán asociados cuando se incorpore un runtime AWS.
- Antes de AWS real se deben evaluar VPC Flow Logs, Network Access Analyzer, endpoints privados y políticas IAM.
- Se usan CIDR de subred en las reglas entre capas porque Floci 1.5.27 no conserva la referencia de grupo en su API detallada; antes de AWS real se reemplazarán por referencias entre security groups.
- Las reglas se declaran inline porque Floci 1.5.27 no devuelve de forma estable los identificadores de los recursos Terraform `aws_vpc_security_group_*_rule`; esta decisión evita deriva y duplicados en el entorno local.
- Tras crear un security group se ejecuta una segunda convergencia de Terraform: Floci agrega inicialmente la regla egress permisiva de AWS y solo la aplicación siguiente la retira. Un `terraform plan -detailed-exitcode` con salida `0` es el criterio de aceptación.
