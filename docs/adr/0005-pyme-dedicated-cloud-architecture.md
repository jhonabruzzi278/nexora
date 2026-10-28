# ADR 0005: Arquitectura Cloud Dedicada para Pyme ("Sencillez y Rapidez")

## Estado
Aceptado (Supera y reemplaza la estrategia multi-tenant SaaS de ADR 0001 y la topología costosa de NAT Gateway de ADR 0002).

## Contexto y Motivación
Nexora nació inicialmente concebido como un SaaS multi-inquilino. Sin embargo, tras analizar las necesidades reales de una Pequeña y Mediana Empresa (Pyme) y el modelo de negocio del proveedor de servicios tecnológicos (MSP), se identificaron fricciones críticas:
1. **Costos Variables e Impredecibles:** Una Pyme no tolera sorpresas en facturación ni costos ociosos fijos (como los ~$32/mes de un NAT Gateway en una VPC).
2. **Soberanía de Datos:** Las empresas prefieren que sus datos financieros, de clientes e inventario residan en su propia cuenta de nube (con facturación directa a su razón social).
3. **Complejidad innecesaria de software:** Los ERP tradicionales (SAP, Oracle) y SaaS genéricos son lentos, sobrecargados de menús y difíciles de parametrizar. El lema rector de Nexora es **"Sencillez y Rapidez"** (<1s de respuesta, interfaz limpia, cero bloatware).

## Decisión Arquitectónica

### 1. Modelo de Negocio y Despliegue (Llave en Mano / MSP)
- **Instalación dedicada:** Cada cliente Pyme recibe una instancia completa y aislada de Nexora desplegada directamente en su propia cuenta de AWS.
- **Facturación AWS directa:** El cliente vincula su tarjeta o facturación a AWS, pagando directamente sus consumos mínimos de infraestructura (~$0.00 a $0.50 USD/mes).
- **Servicio Administrado:** El implementador cobra un honorario por instalación llave en mano y una suscripción mensual fija por soporte, mantenimiento y actualizaciones continuas.

### 2. Adopción de Patrones Probados de Odoo y ERPNext
- **Contactos Unificados (`res.partner` de Odoo):** Un único directorio de contactos donde una entidad puede ser cliente, proveedor o ambos (`isCustomer: boolean; isSupplier: boolean`), eliminando redundancias en la base de datos.
- **Inventario por Partida Doble:** Cada movimiento físico de inventario registra ubicación origen (`sourceLocation`) y ubicación destino (`destLocation`), garantizando trazabilidad absoluta de entradas, salidas y mermas.
- **Sesión y Arqueo Diario de Caja (`CashShift`):** Control riguroso de apertura y cierre de caja diaria con conciliación entre el dinero esperado (efectivo, tarjetas, transferencias) y el conteo físico de gaveta, reportando diferencias al instante.
- **Ciclo de Documentos Limpio:** Transición fluida de órdenes de venta (Borrador -> Emitida -> Pagada/Completada).

### 3. Topología Serverless de Costo Fijo Cero ($0.00 en Reposo)
- **Cómputo:** AWS Lambda con arquitectura ARM64 (Graviton2/3). Tiempo de ejecución Fastify bundle minificado (1.5 MB), arranque en frío inferior a 250 ms.
- **Ingreso HTTP:** Amazon API Gateway HTTP API ($1.00 USD por millón de peticiones, 1M gratis los primeros 12 meses).
- **Base de Datos:** Amazon DynamoDB en modo **On-Demand (Pay-per-request)**. Cero costo fijo si no hay tráfico; hasta 25 GB y 200M solicitudes mensuales cubiertas por la capa gratuita permanente de AWS.
- **Frontend SPA:** Single Page Application (Vue 3 + Vite) alojada en Amazon S3 y distribuida opcionalmente mediante Amazon CloudFront o subdominios instantáneos.
- **Eliminación de NAT Gateway y VPCs sobre-dimensionadas:** Al ser servicios serverless administrados por AWS con cifrado TLS 1.3 en tránsito y SSE-KMS en reposo, se eliminan los costos de red ociosa manteniendo la máxima seguridad.

### 4. Cumplimiento de los 6 Pilares de AWS Well-Architected

| Pilar | Implementación en Nexora Pyme |
| :--- | :--- |
| **Excelencia Operativa** | Despliegue 1-Click con scripts automatizados (`deploy-pyme.ps1`), infraestructura como código (Terraform), trazabilidad de auditoría en cada mutación. |
| **Seguridad** | Roles IAM de mínimo privilegio (`LabRole` en labs o roles dedicados en producción), cifrado AES-256 en reposo (DynamoDB y S3), encabezados estrictos de seguridad y CORS controlado. |
| **Fiabilidad** | Multi-AZ nativo administrado por AWS en DynamoDB, S3 y Lambda sin necesidad de configurar clusters manualmente. |
| **Eficiencia de Rendimiento** | Cómputo ARM64 de alto rendimiento, Single-Table Design con consultas directas de clave (`PK/SK`) inferiores a 10 ms, SPA ultraligero de 150 KB. |
| **Optimización de Costos** | $0.00 en reposo. Costo mensual típico entre $0.00 y $0.50 USD. Presupuesto con alertas automáticas (AWS Budgets) a los $5.00 USD. |
| **Sostenibilidad** | Recursos consumidos únicamente bajo demanda de procesamiento real; cero consumo energético ocioso en centros de datos. |

## Consecuencias y Beneficios
- **Para el Cliente Pyme:** Acceso a un sistema ERP empresarial de primer nivel, rápido, confiable y con costo de infraestructura prácticamente nulo.
- **Para el Consultor/Implementador:** Modelo de negocio escalable, repetible e instalable en minutos mediante scripts automatizados, con ingresos recurrentes por soporte y evolución continua.
