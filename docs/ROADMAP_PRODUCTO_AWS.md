# Roadmap MVP Nexora en AWS — 3 meses

## Horizonte y condición de viabilidad

El MVP se planifica en 12 semanas, del 31 de agosto al 22 de noviembre de 2026. Incluye 55 tareas y 163 días-persona. El plazo requiere un equipo mínimo de tres personas con frentes simultáneos: backend/SaaS, frontend/producto y cloud/calidad. La capacidad bruta es de 180 días-persona y se dejan 17 días de reserva para defectos, integración e imprevistos.

Con una sola persona no es responsable comprometer la misma fecha y el mismo alcance. “Producción” en la semana 12 significa lanzamiento controlado del MVP, con pocos tenants, datos no regulados, monitoreo diario y rollback; no una plataforma empresarial madura.

La carta Gantt editable contiene resumen, tareas y dependencias, los doce módulos del acta más onboarding y suscripciones, seis gates, catálogo AWS/Cloud Practitioner, control de costos, registro QA y fuentes oficiales.

## Plan de 12 semanas

| Semana | Entrega principal | Gate |
|---:|---|---|
| 1 | Scope congelado, repositorio/CI, Docker, Vue, API Bun, Floci y FinOps | G0: entorno reproducible |
| 2 | Modelo tenant, puerto de autenticación/Cognito IaC, shell y harness de pruebas | — |
| 3 | JWT/RBAC, onboarding, configuración, clientes y proveedores | G1: aislamiento tenant |
| 4 | Productos, inventario y UI de maestros | — |
| 5 | Compras y ventas transaccionales | — |
| 6 | Documentos metadata, alerta interna, auditoría y reporte | — |
| 7 | Plan único, checkout, webhook, entitlements y cancelación sandbox | G2: MVP funcional congelado |
| 8 | E2E, seguridad, carga, OpenAPI y runbooks | G3: release local/Floci |
| 9 | Bootstrap AWS, budget USD 20, Terraform, Cognito, secretos y smoke | — |
| 10 | Paridad local/cloud, costo real, restore, rollback y Well-Architected | G4: laboratorio AWS |
| 11 | Piloto de 3–5 tenants con datos sintéticos y correcciones P0/P1 | — |
| 12 | OIDC, dominio, PITR, alarmas, go/no-go, release e hypercare | G5: lanzamiento controlado |

## Alcance funcional mínimo

Cada módulo entrega una sola capacidad vertical verificable:

- identidad/RBAC y onboarding;
- configuración de empresa;
- clientes, proveedores y productos;
- inventario, compras y ventas;
- documentos: sólo metadatos, sin carga binaria;
- notificación interna de stock bajo;
- auditoría básica y dashboard operacional;
- suscripción con un plan, cobro sandbox, webhook y cancelación.

## Fuera de los tres meses

Quedan en backlog la carga binaria de documentos en S3, email/SNS, BI con Athena o QuickSight, WAF, GuardDuty, AWS Config, colas/eventos, RDS/Aurora, ECS/EC2/Traefik, multi-región, automatización de recuperación avanzada, múltiples planes, cupones, impuestos y autoservicio empresarial. Se documentan como alternativas para aprendizaje Cloud Practitioner, pero no se despliegan por colección de servicios.

## Regla local → AWS

Hasta la semana 8, cada capacidad se construye y prueba en Docker/Floci. Floci no se considera paridad total. Antes de promover a AWS deben existir criterios de aceptación, pruebas unitarias/integración/E2E, aislamiento tenant negativo, documentación, estimación en Pricing Calculator, budget, rollback y teardown.

## Control de costos

- Local + Floci, semanas 1–8: objetivo AWS USD 0.
- AWS laboratorio, semanas 9–10: tope USD 20; destruir si se excede.
- Piloto, semana 11: objetivo máximo USD 25/mes.
- Producción inicial, semana 12+: forecast máximo USD 50/mes, sujeto a Calculator y tráfico real.
- Nunca guardar `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY` ni tokens en Git, frontend, imágenes Docker o archivos Terraform versionados. Para CI/CD se usa OIDC y para runtime Secrets Manager/SSM según el tipo de secreto.

## Fuentes de gobierno

- [AWS Well-Architected Framework](https://docs.aws.amazon.com/wellarchitected/latest/framework/the-pillars-of-the-framework.html)
- [AWS SaaS Lens](https://docs.aws.amazon.com/wellarchitected/latest/saas-lens/saas-lens.html)
- [AWS Cost Optimization Pillar](https://docs.aws.amazon.com/wellarchitected/latest/cost-optimization-pillar/welcome.html)
- [AWS Certified Cloud Practitioner CLF-C02](https://docs.aws.amazon.com/aws-certification/latest/cloud-practitioner-02/cloud-practitioner-02.html)
- [Servicios incluidos en CLF-C02](https://docs.aws.amazon.com/aws-certification/latest/cloud-practitioner-02/clf-02-in-scope-services.html)
- [AWS Pricing Calculator](https://calculator.aws/)

## Uso semanal

Los lunes se actualizan responsables, estado, bloqueos y forecast. Los viernes se adjuntan evidencias y se revisan gates. Desde la semana 7 no se incorporan funciones nuevas: cualquier cambio desplaza otro elemento o pasa al backlog post-MVP.
