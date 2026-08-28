# ADR 0001: arquitectura mínima del MVP

- Estado: aceptado
- Fecha: 2026-08-28

## Contexto

El acta propone una arquitectura distribuida con numerosos servicios AWS. El MVP debe conservar una capacidad por módulo, ejecutarse localmente con Floci y permitir una migración posterior sin asumir paridad completa con AWS.

## Decisión

Se construirá un monorepo con Vue 3, una API modular en Node.js/Fastify y una única tabla Amazon DynamoDB. Bun administrará dependencias, scripts y el empaquetado del backend. Docker Compose ejecutará frontend, API y Floci. Terraform será el único mecanismo para crear la tabla.

El endpoint AWS, la región y el nombre de tabla serán configuración externa. El dominio no importará detalles de Floci. Las transacciones e idempotencia se implementarán en los casos de uso de compra y venta.

## Consecuencias

- El entorno local tiene pocas piezas y un costo cloud futuro fácil de estimar.
- Documentos almacenará solo metadatos hasta incorporar S3.
- La autenticación inicial será local hasta evaluar Cognito.
- La compatibilidad crítica deberá probarse posteriormente en una cuenta AWS sandbox.
- Reportes complejos y arquitectura orientada a eventos quedan fuera del MVP.
