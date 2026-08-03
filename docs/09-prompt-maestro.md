# Prompt maestro para construir el ERP modular de repuestos

Este documento reúne un prompt profesional, completo y listo para usar con IA para diseñar y construir un sistema ERP modular, escalable y listo para producción para el negocio de repuestos.

---

## 1. Objetivo del proyecto

Diseñar y desarrollar un sistema ERP modular, moderno, seguro y preparado para producción, orientado a empresas de repuestos y autocentros, con capacidad de gestionar inventario, ventas, compras, caja, bancos, tesorería, contabilidad, RR.HH., documentos, reportes, auditoría y API pública.

El sistema debe ser construido como una plataforma empresarial modular, donde cada módulo pueda activarse o desactivarse según las necesidades del cliente.

---

## 2. Capacidades que debe exigir el prompt

El prompt debe exigir explícitamente las siguientes capacidades:

- Análisis del negocio y levantamiento de requerimientos.
- Arquitectura empresarial con Clean Architecture, DDD, SOLID y enfoque hexagonal.
- Diseño UX/UI profesional antes de programar.
- Desarrollo Full Stack completo.
- Seguridad siguiendo OWASP Top 10.
- DevOps y despliegue con Docker, CI/CD y producción.
- Testing automatizado.
- Auditoría del sistema.
- Documentación técnica y funcional.
- Optimización y mantenimiento continuo.

---

## 3. Requisitos de interfaz profesional (SaaS Premium)

La interfaz debe cumplir estándares modernos de productos comerciales premium:

- Dashboard ejecutivo con KPI en tiempo real.
- Diseño tipo ERP moderno.
- Estética tipo glassmorphism y Material Design 3.
- Responsive para PC, tablet y móvil.
- Dark/Light Mode.
- Sidebar colapsable.
- Header inteligente.
- Breadcrumbs.
- Tabs dinámicos.
- Tarjetas estadísticas.
- Gráficos interactivos.
- Calendarios.
- Kanban.
- Tablas inteligentes.
- Búsqueda global.
- Filtros avanzados.
- Exportación a Excel, PDF y CSV.
- Notificaciones en tiempo real.
- Chat interno.
- Centro de ayuda.
- Configuración por usuario.
- Atajos de teclado.
- Accesibilidad WCAG 2.2.

---

## 4. Módulos empresariales obligatorios y opcionales

El sistema debe ser modular. Cualquier proyecto debe poder activar o desactivar módulos según su necesidad.

### Módulos base

- Autenticación y seguridad.
- Gestión de usuarios.
- Roles y permisos (RBAC/ABAC).
- Clientes.
- Proveedores.
- Productos.
- Inventario.
- Compras.
- Ventas.
- Facturación.
- Caja.
- Bancos.
- Tesorería.
- Contabilidad.
- Recursos Humanos.
- Documentos.
- Reportes.
- Auditoría.
- Configuración del sistema.
- API pública.
- Integraciones.

### Requisito de diseño modular

Cada módulo debe poder desarrollarse como un bloque independiente, con:

- estructura de feature module.
- separación por dominio.
- configuración por feature flags.
- escalabilidad horizontal y mantenimiento simple.

---

## 5. Tecnologías objetivo

### Frontend

- Angular 21 o superior.
- Signals.
- TailwindCSS.
- TypeScript.
- RxJS.
- Angular Material.
- ApexCharts.
- PrimeNG.

### Backend

- NestJS.
- TypeORM.
- PostgreSQL.
- Swagger.
- JWT.
- Refresh Tokens.
- Redis.
- BullMQ.

### Infraestructura

- Docker.
- Docker Compose.
- Nginx.
- GitHub Actions.
- CI/CD.
- HTTPS.
- Backups automáticos.

---

## 6. Requisitos de calidad del código

El desarrollo debe exigir lo siguiente:

- Clean Code.
- SOLID.
- DRY.
- KISS.
- YAGNI.
- DDD.
- Arquitectura Hexagonal.
- Modularidad.
- Escalabilidad.
- Alto rendimiento.
- Código documentado.
- Sin duplicación.
- Manejo robusto de errores.
- Logging y auditoría.

---

## 7. Diseño UX/UI obligatorio

Antes de programar, la IA debe diseñar primero la experiencia de usuario con:

- Wireframes.
- Flujo de navegación.
- Prototipos.
- Diseño consistente.
- Sistema de colores.
- Tipografía.
- Iconografía.
- Estados de carga.
- Estados vacíos.
- Mensajes de error.
- Microinteracciones.
- Animaciones suaves.

El diseño debe ser coherente, profesional y orientado a productividad empresarial.

---

## 8. Entregables obligatorios

El sistema debe entregarse completamente listo para producción con:

- Código fuente completo.
- Backend.
- Frontend.
- Base de datos.
- Docker.
- Swagger.
- Colección Postman.
- README.
- Manual técnico.
- Manual de usuario.
- Diagramas UML.
- Scripts SQL.
- Migraciones.
- Seeders.
- Datos de prueba.
- Auditoría.
- Pruebas automatizadas.
- Documentación completa.

---

## 9. Criterios de aceptación del proyecto

El resultado debe cumplir estas condiciones:

1. Ser usable por una empresa real desde el primer despliegue.
2. Tener arquitectura clara y mantenible.
3. Incluir seguridad y auditoría por defecto.
4. Tener una interfaz moderna y profesional.
5. Poder extenderse con nuevos módulos sin reescribir el sistema base.
6. Estar preparado para despliegue en producción con Docker y CI/CD.
7. Contar con pruebas automatizadas y documentación completa.

---

## 10. Prompt listo para copiar y usar

Prompt:

Actúa como un arquitecto de software empresarial, líder técnico full stack y UX designer senior. Tu misión es diseñar y construir un sistema ERP modular, moderno, seguro y listo para producción para una empresa dedicada a la comercialización de repuestos.

Debes trabajar con enfoque profesional y empresarial. No entregues una solución improvisada ni un prototipo básico. Debes pensar como si estuvieras construyendo una plataforma SaaS premium para uso real en producción.

Requisitos obligatorios:

- Realizar análisis del negocio y levantar requerimientos claros antes de empezar a programar.
- Diseñar primero la arquitectura empresarial usando Clean Architecture, DDD, SOLID, Hexagonal Architecture y modularidad.
- Diseñar primero la experiencia de usuario con wireframes, flujo de navegación, prototipos, diseño visual consistente, sistema de colores, tipografía, iconografía y microinteracciones.
- Desarrollar el sistema Full Stack completo con frontend y backend robustos.
- Implementar seguridad siguiendo OWASP Top 10, incluyendo autenticación, autorización, protección contra inyección, control de sesiones, gestión de secretos, validación estricta y auditoría.
- Incluir DevOps y despliegue con Docker, Docker Compose, Nginx, GitHub Actions, CI/CD, HTTPS y backups automáticos.
- Implementar testing automatizado a nivel unitario, integración y e2e.
- Incluir auditoría del sistema y logging estructurado.
- Entregar documentación técnica y funcional completa.
- Optimizar el sistema para rendimiento, escalabilidad y mantenimiento.

Interfaz profesional requerida:

- Dashboard ejecutivo con KPI en tiempo real.
- Diseño tipo ERP moderno.
- Estilo glassmorphism y Material Design 3.
- Responsive para PC, tablet y móvil.
- Dark/Light Mode.
- Sidebar colapsable.
- Header inteligente.
- Breadcrumbs.
- Tabs dinámicos.
- Tarjetas estadísticas.
- Gráficos interactivos.
- Calendarios.
- Kanban.
- Tablas inteligentes.
- Búsqueda global.
- Filtros avanzados.
- Exportación a Excel, PDF y CSV.
- Notificaciones en tiempo real.
- Chat interno.
- Centro de ayuda.
- Configuración por usuario.
- Atajos de teclado.
- Accesibilidad WCAG 2.2.

Módulos empresariales requeridos:

- Autenticación y seguridad.
- Gestión de usuarios.
- Roles y permisos (RBAC/ABAC).
- Clientes.
- Proveedores.
- Productos.
- Inventario.
- Compras.
- Ventas.
- Facturación.
- Caja.
- Bancos.
- Tesorería.
- Contabilidad.
- Recursos Humanos.
- Documentos.
- Reportes.
- Auditoría.
- Configuración del sistema.
- API pública.
- Integraciones.

Tecnologías objetivo:

- Frontend: Angular 21+, Signals, TailwindCSS, TypeScript, RxJS, Angular Material, ApexCharts, PrimeNG.
- Backend: NestJS, TypeORM, PostgreSQL, Swagger, JWT, Refresh Tokens, Redis, BullMQ.
- Infraestructura: Docker, Docker Compose, Nginx, GitHub Actions, CI/CD, HTTPS, backups automáticos.

Calidad del código:

- Clean Code.
- SOLID.
- DRY.
- KISS.
- YAGNI.
- DDD.
- Arquitectura Hexagonal.
- Modularidad.
- Escalabilidad.
- Alto rendimiento.
- Código documentado.
- Sin duplicación.
- Manejo robusto de errores.
- Logging y auditoría.

Entregables obligatorios:

- Código fuente completo.
- Backend.
- Frontend.
- Base de datos.
- Docker.
- Swagger.
- Colección Postman.
- README.
- Manual técnico.
- Manual de usuario.
- Diagramas UML.
- Scripts SQL.
- Migraciones.
- Seeders.
- Datos de prueba.
- Auditoría.
- Pruebas automatizadas.
- Documentación completa.

Además, debes asegurar que el sistema sea modular, escalable y extensible, con posibilidad de activar o desactivar módulos según el proyecto. Si existen decisiones ambiguas, documenta las suposiciones de negocio y las recomendaciones técnicas.

Tu respuesta debe incluir:

1. Análisis inicial del negocio.
2. Arquitectura propuesta.
3. Diseño UX/UI propuesto.
4. Estructura del proyecto.
5. Plan de desarrollo por fases.
6. Implementación técnica detallada.
7. Entregables finales.
8. Criterios de calidad y aceptación.

---

## 11. Qué falta aún en este repositorio respecto a este estándar

El repositorio ya tiene una base sólida, pero aún faltan varias piezas para alcanzar el nivel de estándar que se pide:

- Integración completa de Redis y BullMQ para cache y colas.
- Implementación de módulos empresariales como clientes, proveedores, compras, caja, bancos, tesorería, contabilidad, RR.HH. y documentos.
- UI avanzada con diseño SaaS premium, no solo una interfaz funcional.
- Diseño completo de wireframes, flujos y prototipos.
- Colección Postman y manuales técnico/usuario detallados.
- GitHub Actions y pipeline CI/CD completo.
- Backups automáticos y estrategia de recuperación.
- Mayor cobertura de pruebas automatizadas y trazabilidad.
- Integración de feature flags para activar/desactivar módulos.
- Documentación de arquitectura más profunda con diagramas UML y decisiones de diseño.

Este documento sirve como base para cerrar esa brecha y convertir el proyecto en una plataforma ERP más completa, profesional y preparada para producción.
