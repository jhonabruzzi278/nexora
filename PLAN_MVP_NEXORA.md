# Plan de trabajo - MVP Nexora

## 1. Resultado de la revisión del acta

El acta define una visión válida para un ERP educativo y cloud-ready, pero su alcance inicial mezcla doce módulos, ocho fases y más de veinte servicios AWS. Eso contradice parcialmente sus propios principios de "empezar simple" y evitar la sobrearquitectura.

Para el MVP se conserva la intención funcional y educativa, con estos ajustes:

- Se implementa una sola historia de usuario útil por módulo.
- Se utiliza **un solo servicio AWS: Amazon DynamoDB**, emulado localmente con Floci.
- No forman parte del MVP Cognito, API Gateway, Lambda, S3, EventBridge, SQS, SNS, RDS, CloudWatch ni otros servicios del diagrama original.
- La aplicación se ejecuta completamente en Docker Desktop.
- Terraform crea la tabla DynamoDB y sus etiquetas; AWS CLI verifica la infraestructura y el SDK de AWS para JavaScript v3 es el acceso de la aplicación.
- La arquitectura queda preparada para apuntar a AWS real mediante configuración, pero el despliegue cloud no forma parte del MVP.

Este recorte elimina el principal riesgo detectado en el acta: intentar aprender y construir demasiadas piezas a la vez.

## 2. Decisiones tecnológicas

| Área | Decisión para el MVP | Motivo |
|---|---|---|
| Frontend | Vue 3 + TypeScript | Menor ceremonia que Angular para un MVP individual y modular |
| UI/build frontend | Vite, ejecutado con Bun | Integración madura con Vue y ciclo de desarrollo rápido |
| Backend | Node.js + TypeScript + Fastify | API REST pequeña, validación por esquemas y buen rendimiento |
| Paquetes y tareas | Bun | Instalar dependencias y ejecutar scripts, pruebas y builds |
| Empaquetado backend | `bun build --target=node` | Produce un artefacto ejecutable sobre Node.js; Bun no será una dependencia del runtime productivo |
| Acceso AWS | AWS SDK for JavaScript v3 | Cliente DynamoDB desacoplado por endpoint y región |
| Infraestructura | Terraform | Una tabla DynamoDB reproducible en Floci y luego en AWS |
| Verificación manual | AWS CLI v2 | Crear/consultar datos y validar la tabla contra el endpoint local |
| Entorno | Docker Desktop + Docker Compose | Arranque reproducible de frontend, API y Floci |
| Servicio AWS único | Amazon DynamoDB | Cubre datos operacionales, eventos de auditoría y notificaciones sin añadir otra base de datos |
| Repositorio | Monorepo | Comparte tipos y reduce la administración del MVP |

### Aclaración sobre Bun y Node.js

Node.js será el runtime del backend. Bun será el gestor de paquetes, ejecutor de tareas y empaquetador. En el frontend, Vite realiza la transformación específica de Vue y Bun ejecuta el proceso. Esta separación evita depender de compatibilidad particular de Bun en un eventual runtime administrado de AWS.

## 3. Arquitectura mínima

```text
Navegador
   |
   v
Frontend Vue (contenedor, puerto 5173/80)
   |
   v
API REST Node.js/Fastify (contenedor, puerto 3000)
   |
   | AWS SDK JavaScript v3
   v
Floci (contenedor, puerto 4566)
   |
   v
Amazon DynamoDB emulado - tabla nexora-local
```

Los tres contenedores comparten una red privada de Docker Compose. Solo el frontend, la API y el endpoint de Floci que se use para aprendizaje se publican al host. La API usa `http://floci:4566`; AWS CLI y Terraform desde Windows usan `http://localhost:4566`.

### Estructura propuesta

```text
nexora/
  apps/
    web/                 # Vue 3
    api/                 # Node.js + Fastify
  packages/
    contracts/           # DTO, esquemas y tipos compartidos
  infra/
    terraform/           # tabla DynamoDB y variables
  docs/
    adr/                 # decisiones arquitectónicas
    api/                 # OpenAPI
  tests/
    integration/         # API + Floci
  compose.yaml
  bun.lock
  package.json
```

## 4. Alcance funcional del MVP

El flujo demostrable es: configurar empresa -> iniciar sesión -> registrar cliente, proveedor y producto -> recibir una compra -> crear una venta -> comprobar stock, alerta, auditoría y resumen.

| Módulo del acta | Única capacidad comprometida | Criterio de aceptación |
|---|---|---|
| Usuarios y roles | Iniciar sesión con un administrador precreado | Credenciales válidas entregan una sesión; una ruta protegida rechaza una sesión ausente o inválida |
| Clientes | Registrar y listar clientes | Nombre y correo validados quedan visibles después de recargar |
| Productos | Registrar y listar un producto | SKU único, nombre, precio y stock mínimo quedan persistidos |
| Inventario | Consultar stock y movimientos de un producto | Se muestra cantidad actual y el historial generado por compras y ventas |
| Ventas | Crear una venta de un producto | La operación calcula el total y descuenta stock de forma atómica |
| Proveedores | Registrar y listar proveedores | Nombre y contacto quedan persistidos y consultables |
| Compras | Recibir una orden simple de un producto | La recepción incrementa stock y crea el movimiento en una transacción |
| Documentos | Registrar metadatos de un documento | Tipo, nombre y URL externa/local quedan asociados a una venta o compra; no se almacena el archivo binario |
| Notificaciones | Mostrar una alerta interna de stock bajo | Después de una venta que cruza el mínimo aparece una alerta en la aplicación |
| Reportes | Mostrar un resumen operacional | Se ven total de ventas, unidades en stock y cantidad de clientes del conjunto de datos MVP |
| Auditoría | Consultar los cambios principales | Alta, compra y venta registran actor, acción, entidad y fecha |
| Configuración | Editar los datos básicos de la empresa | Nombre, identificador tributario y moneda quedan persistidos |

### Fuera de alcance

- Registro público, recuperación de contraseña, MFA y administración avanzada de permisos.
- Multiempresa real, sucursales, impuestos, facturación electrónica y contabilidad.
- Varias líneas por venta/compra, devoluciones, descuentos y pagos.
- Carga binaria de documentos o imágenes.
- Correo, SMS, push o colas de notificaciones.
- Aplicación móvil, tiempo real, analítica avanzada y exportaciones.
- Despliegue del frontend o backend en AWS.
- Alta disponibilidad multi-región, recuperación ante desastres y SLA productivo.

## 5. Modelo de datos y reglas críticas

Se usará una tabla `nexora-<entorno>` con `PK` y `SK` de tipo texto. Todas las claves incluyen `TENANT#demo` para que el salto futuro a multiempresa no obligue a rediseñar cada contrato.

Patrones principales:

| Entidad | PK | SK |
|---|---|---|
| Configuración | `TENANT#demo` | `CONFIG` |
| Usuario | `TENANT#demo` | `USER#<id>` |
| Cliente | `TENANT#demo#CUSTOMERS` | `CUSTOMER#<id>` |
| Producto | `TENANT#demo#PRODUCTS` | `PRODUCT#<id>` |
| Proveedor | `TENANT#demo#SUPPLIERS` | `SUPPLIER#<id>` |
| Venta | `TENANT#demo#SALES` | `SALE#<fecha>#<id>` |
| Compra | `TENANT#demo#PURCHASES` | `PURCHASE#<fecha>#<id>` |
| Movimiento | `TENANT#demo#PRODUCT#<id>` | `MOVEMENT#<fecha>#<id>` |
| Notificación | `TENANT#demo#NOTIFICATIONS` | `NOTIFICATION#<fecha>#<id>` |
| Auditoría | `TENANT#demo#AUDIT` | `AUDIT#<fecha>#<id>` |
| Documento | `TENANT#demo#DOCUMENTS` | `DOCUMENT#<id>` |

Reglas obligatorias:

- No usar `Scan` en los flujos normales; usar `Query` por partición y paginación.
- Crear venta, descontar stock, registrar movimiento, auditoría y eventual alerta con `TransactWriteItems`.
- Usar expresiones condicionales para impedir stock negativo y SKU duplicado.
- Recibir una compra de forma idempotente mediante una clave de operación.
- Guardar dinero como entero en la unidad mínima de la moneda, nunca como coma flotante.
- Registrar timestamps en UTC y mostrar la zona horaria en el frontend.

## 6. Uso de Floci, AWS CLI, SDK y Terraform

Floci se ejecutará desde una imagen con versión fijada, no con `latest`, para que el entorno sea reproducible. Su endpoint compatible con AWS será `4566` y el estado local tendrá un volumen persistente.

### Configuración local

```dotenv
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=test
AWS_SECRET_ACCESS_KEY=test
AWS_ENDPOINT_URL=http://floci:4566
DYNAMODB_TABLE=nexora-local
```

Las credenciales anteriores son ficticias y solo válidas en desarrollo local. Para AWS real no se guardarán claves en archivos: se usará un perfil de AWS CLI para el operador y un rol IAM para la aplicación.

### Responsabilidad de cada herramienta

- **Docker Compose:** inicia y conecta `web`, `api` y `floci`; incorpora health checks.
- **Terraform:** crea exclusivamente la tabla DynamoDB en el endpoint configurado y aplica etiquetas `Project`, `Environment`, `Owner` y `ManagedBy`.
- **AWS CLI:** ejecuta pruebas de humo (`describe-table`, `query`) contra Floci y, en el futuro, contra AWS.
- **AWS SDK v3:** es el único camino de acceso a DynamoDB desde la API.
- **Floci:** emula DynamoDB localmente; no se considera evidencia suficiente de paridad total con AWS real.

Se mantendrán variables separadas para `local` y `aws`. El endpoint local nunca se codificará dentro del dominio. Antes de un despliegue real se ejecutará una prueba de compatibilidad en una cuenta sandbox.

## 7. Plan de ejecución

Estimación base: **20 días laborables, una persona**, con entregas verticales y demostrables. Si trabaja más de una persona, se puede paralelizar interfaz e infraestructura después de cerrar los contratos de la API.

### Semana 1 - Fundamentos y maestros

| ID | Trabajo | Resultado | Estimación |
|---|---|---|---:|
| F01 | Crear monorepo, normas, scripts Bun y variables de entorno | `bun install`, lint, test y build reproducibles | 0,5 d |
| F02 | Crear Compose con Vue, API y Floci fijado por versión | `docker compose up` levanta el entorno con health checks | 1 d |
| F03 | Crear Terraform de DynamoDB y pruebas con AWS CLI | `terraform apply` y `aws dynamodb describe-table` funcionan contra Floci | 1 d |
| F04 | Implementar contratos, manejo de errores, logs y OpenAPI | Esqueleto de API observable y documentado | 1 d |
| F05 | Implementar sesión de administrador y configuración de empresa | Primer recorrido protegido de extremo a extremo | 1,5 d |

### Semana 2 - Catálogos y stock

| ID | Trabajo | Resultado | Estimación |
|---|---|---|---:|
| C01 | Clientes | Alta/listado con validación y pruebas | 1 d |
| C02 | Productos | Alta/listado con SKU único y stock mínimo | 1 d |
| C03 | Proveedores | Alta/listado con validación y pruebas | 0,75 d |
| C04 | Inventario | Consulta de stock y movimientos paginados | 1,25 d |
| C05 | Integración visual | Navegación y estados de carga/error accesibles | 1 d |

### Semana 3 - Flujo operacional

| ID | Trabajo | Resultado | Estimación |
|---|---|---|---:|
| O01 | Recepción de compra | Suma stock de forma atómica e idempotente | 1,5 d |
| O02 | Creación de venta | Calcula total, impide stock negativo y descuenta atómicamente | 2 d |
| O03 | Auditoría automática | Cambios principales visibles por fecha | 0,75 d |
| O04 | Notificación interna | Alerta persistida al cruzar stock mínimo | 0,75 d |

### Semana 4 - Soporte, calidad y entrega

| ID | Trabajo | Resultado | Estimación |
|---|---|---|---:|
| Q01 | Metadatos de documentos | Registro asociado a compra/venta | 0,75 d |
| Q02 | Resumen operacional | Totales mínimos del MVP con dataset acotado | 1 d |
| Q03 | Pruebas E2E e integración con Floci | Flujo principal automatizado | 1,25 d |
| Q04 | Revisión de seguridad, rendimiento y fallos | Checklist Well-Architected sin hallazgos críticos abiertos | 1 d |
| Q05 | README, ADR, manual y demo limpia | Otra persona puede levantar y demostrar el MVP | 1 d |

## 8. Calidad y estrategia de pruebas

- **Unitarias:** reglas de precio, stock, permisos, validación y mapeo de claves.
- **Integración:** repositorios contra Floci, condiciones de concurrencia y transacciones DynamoDB.
- **Contrato/API:** rutas, esquemas, códigos de error y OpenAPI.
- **Frontend:** formularios, estados vacíos, errores y navegación protegida.
- **E2E:** recorrido completo de configuración, catálogos, compra, venta, alerta, auditoría y reporte.
- **Infraestructura:** `terraform fmt -check`, `validate`, `plan` y prueba de humo con AWS CLI.
- **Contenedores:** health checks, usuario no root para la aplicación y build limpio desde cero.

Meta mínima antes de cerrar: 100 % de los criterios de aceptación del alcance, pruebas de reglas críticas y cero secretos reales en el repositorio. No se usará un porcentaje de cobertura aislado como sustituto de estas pruebas.

## 9. Alineación con AWS Well-Architected

El framework tiene seis pilares. Para un entorno emulado, "cumplir" significa aplicar y evidenciar decisiones apropiadas al alcance; la conformidad del entorno AWS real solo puede verificarse después de desplegarlo.

| Pilar | Control verificable en el MVP | Evidencia de cierre |
|---|---|---|
| Excelencia operacional | Infraestructura y arranque automatizados; logs JSON con `requestId`; health checks; ADR y runbook | Pipeline verde, comandos documentados y diagnóstico de un fallo ensayado |
| Seguridad | Validación de entrada; contraseñas con hash; sesiones breves; secretos fuera del repo; contenedores sin root; política futura limitada a la tabla | Pruebas de rutas protegidas, escaneo de secretos y documento de mínimo privilegio |
| Fiabilidad | Escrituras condicionales, transacciones, idempotencia, timeouts y reintentos limitados; persistencia/snapshot local | Pruebas de stock concurrente, repetición de compra y reinicio de contenedores |
| Eficiencia del rendimiento | Consultas por clave, paginación, SDK modular y límites de respuesta | Ausencia de `Scan` en rutas normales y prueba de carga pequeña documentada |
| Optimización de costos | Un único servicio, modo bajo demanda al migrar a AWS, sin recursos ociosos adicionales | `terraform plan` contiene solo una tabla y estimación de costo registrada antes del despliegue |
| Sostenibilidad | Contenedores mínimos, apagado del entorno inactivo, dataset pequeño y ausencia de cómputo sobredimensionado | Tamaño de imágenes registrado y procedimiento `docker compose down` |

## 10. Definition of Done del MVP

El MVP termina cuando:

1. Una máquina con Docker Desktop, Bun, Terraform y AWS CLI puede levantarlo siguiendo el README.
2. Terraform crea una sola tabla DynamoDB en Floci.
3. El flujo demostrable de los doce módulos se completa desde el navegador sin editar datos manualmente.
4. Compra y venta mantienen stock consistente bajo reintentos y concurrencia básica.
5. AWS CLI y AWS SDK v3 prueban el mismo recurso local.
6. Todas las pruebas críticas pasan desde un entorno limpio.
7. El checklist de los seis pilares tiene evidencia y no mantiene riesgos críticos abiertos.
8. Los elementos fuera de alcance permanecen en un backlog posterior y no bloquean la demo.

## 11. Backlog posterior sugerido

Agregar servicios de uno en uno y solo por una necesidad funcional demostrada:

1. **Amazon S3:** carga real de documentos e imágenes.
2. **Amazon Cognito:** usuarios, recuperación, MFA y roles administrados.
3. **AWS Lambda + API Gateway:** experimentar el backend serverless.
4. **Amazon SQS:** desacoplar notificaciones o trabajos demorados.
5. **Amazon CloudWatch:** observabilidad del despliegue AWS.

Cada incorporación requiere un ADR, una prueba en Floci, una prueba corta en AWS sandbox y una actualización del análisis Well-Architected y de costos.

## 12. Riesgos y mitigaciones

| Riesgo | Mitigación |
|---|---|
| Floci no reproduce una operación de DynamoDB exactamente | Pruebas de contrato, versión fijada y validación posterior en AWS sandbox |
| Doce módulos vuelven a crecer | Una historia por módulo; cambios van al backlog posterior |
| Reportes obligan a hacer `Scan` | Resumen acotado o contadores mantenidos por la API; no convertir el MVP en analítica |
| Una tabla genérica se vuelve difícil de entender | Catálogo de patrones de acceso, repositorios por dominio y ADR de modelo de datos |
| Credenciales locales llegan a producción | Configuración separada, validación al arrancar y bloqueo de `test/test` fuera de `local` |
| Bun se confunde con el runtime objetivo | Build con destino Node.js y prueba del artefacto dentro de la imagen final |

## Referencias de decisión

- [Floci: repositorio y compatibilidad con SDK, CLI y Terraform](https://github.com/floci-io/floci)
- [Floci: inicio con CLI, Docker y Docker Compose](https://floci.io/aws/)
- [Floci: configuración del acceso a Docker](https://floci.io/floci/configuration/docker/)
- [AWS Well-Architected Framework](https://docs.aws.amazon.com/wellarchitected/latest/framework/welcome.html)

## Cambio de alcance aprobado - 28 de agosto de 2026

Antes de implementar autenticación se adelantó la base de networking AWS. El MVP incorpora Amazon VPC/EC2 como segundo servicio emulado para aprendizaje: VPC, dos subredes públicas, dos privadas, rutas separadas, Internet Gateway y grupos de seguridad por capas. No se agregan todavía cómputo AWS, NAT Gateway, Load Balancer ni exposición de la API local mediante estos recursos.
