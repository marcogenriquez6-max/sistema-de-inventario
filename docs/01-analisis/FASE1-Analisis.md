# FASE 1 — Análisis del Problema

> Proyecto: Sistema Especializado de Inventarios, Control de Precios y Facturación para Comercialización de Repuestos
> Fecha: Agosto 2026 · Versión 1.0
> Fuente: Propuesta Técnico-Comercial (PDF cliente)

---

## 1.1 Objetivo del Sistema

Implementar una plataforma informática a la medida que:

1. **Centralice la gestión de inventario** de repuestos (autopartes e industriales).
2. **Automatice la estructura de precios** de tres niveles: Costo (compra), Venta Base (PVP sin IVA) y Facturado (PVP con IVA).
3. **Garantice el descuento de stock en tiempo real** sobre cada salida de almacén, bloqueando ventas sin existencias y protegiendo los márgenes de ganancia.
4. **Preserve la integridad histórica**: los precios aplicados en una venta quedan congelados en el detalle, inmutables ante cambios futuros de costo o impuestos.

---

## 1.2 Problema que Resuelve

En la comercialización de repuestos existe alta diversidad de ítems, equivalencias entre marcas, variabilidad en costos de adquisición y exigencia de rapidez en mostrador. Errores comunes actuales:

| Error de negocio | Impacto |
|---|---|
| Vender productos sin stock físico | Pérdida económica y pérdida de confianza del cliente |
| Equivocarse de código al despachar (marcas equivalentes) | Devoluciones, mermas, clientes insatisfechos |
| No aplicar correctamente el impuesto sobre el precio base | Descuares contables y riesgo fiscal |
| No registrar quién/cuándo/por qué movió el stock | Inventario no auditable |

---

## 1.3 Usuarios

| Usuario | Descripción |
|---|---|
| **Administrador** | Configura el sistema: IVA, márgenes, usuarios, ubicaciones de almacén. |
| **Vendedor/Cajero (Mostrador)** | Registra y ejecuta ventas en el punto de venta. |
| **Encargado de Inventario** | Registra compras, ajustes, mermas, entradas, transferencias y ubicaciones físicas. |
| **Jefe de Operaciones / Gerencia** | Consulta reportes: Kardex, márgenes, stock crítico, ventas. |
| **Sistema (Técnico)** | Procesos automáticos: descuento atómico, cálculo de IVA, alertas de reposición. |

---

## 1.4 Roles y Permisos (RBAC)

| Rol | Módulos permitidos |
|---|---|
| `ADMIN` | Todo: usuarios, configuración (IVA, márgenes), catálogo, inventario, ventas, reportes, auditoría |
| `SELLER` | POS (crear ventas/notas), consultar catálogo, consultar stock |
| `INVENTORY_MANAGER` | Catálogo (CRUD), compras/entradas, ajustes, mermas, ubicaciones, reportes de stock |
| `MANAGER` | Solo lectura de reportes: ventas, kardex, márgenes, stock crítico |
| `AUDITOR` | Solo lectura de auditoría y Kardex |

---

## 1.5 Procesos Clave

1. **Catalogación**: alta de repuesto con SKU interno, código OEM, código de barras, compatibilidad (marca/modelo/año/motor), ubicación física y precios.
2. **Reposición/Compra**: entrada de mercancía con costo de adquisición; recalcula sugeridos de venta si cambia el costo.
3. **Venta (POS)**: armado de carrito por código de barras o búsqueda por vehículo → validación de stock → emisión de nota de venta/entrega o factura → descuento atómico de stock → registro en Kardex.
4. **Ajuste y merma**: salidas justificadas (defectuoso, daño, devolución).
5. **Monitoreo**: detección de stock mínimo → alerta de reposición.
6. **Auditoría**: Kardex y trazabilidad de quién/cuándo/por qué.

---

## 1.6 Casos de Uso (nivel resumen)

| # | Caso de uso | Actor | Descripción |
|---|---|---|---|
| CU-01 | Autenticarse | Todos | Login con usuario/contraseña, sesión JWT + refresh token |
| CU-02 | Gestionar usuarios | Admin | CRUD de usuarios y asignación de roles |
| CU-03 | Configurar parámetros | Admin | IVA (%, configurable), márgenes por defecto |
| CU-04 | Registrar repuesto | Inv. Manager | Ficha completa multicódigo + compatibilidad + ubicación |
| CU-05 | Buscar repuesto | Todos | Por SKU, OEM, código de barras, marca/modelo/año/motor |
| CU-06 | Registrar entrada (compra) | Inv. Manager | Entrada de stock con costo; recalcula PVP sugerido |
| CU-07 | Registrar ajuste/merma | Inv. Manager | Salida justificada con motivo |
| CU-08 | Realizar venta | Seller | Carrito, validación stock, descuento atómico |
| CU-09 | Emitir nota/factura | Seller | Emite documento legal según configuración de IVA |
| CU-10 | Consultar Kardex | Manager/Auditor | Trazabilidad completa de movimientos por repuesto |
| CU-11 | Consultar stock crítico | Manager | Reporte de reposición |
| CU-12 | Consultar reportes | Manager | Ventas, márgenes, rentabilidad |
| CU-13 | Ver auditoría | Auditor/Admin | Registro de acciones sensibles |

---

## 1.7 Flujo Completo (Venta en Mostrador)

```
Cliente solicita repuesto
   ↓
Vendedor escanea código de barras O busca por OEM / vehículo (marca, modelo, año, motor)
   ↓
Sistema presenta ficha: código, descripción, compatibilidad, precio Facturado, stock, ubicación física
   ↓
Vendedor agrega al carrito (cantidad ≤ stock disponible)
   ↓
[Validación: cero stock negativo → bloquea si no hay existencias suficientes]
   ↓
Sistema calcula totales: Venta Base + IVA = Facturado
   ↓
Vendedor elige documento: Nota de Venta/Entrega o Factura
   ↓
Confirmación de venta → TRANSACCIÓN ATÓMICA:
   1) Inserta cabecera + detalle (precios congelados del momento)
   2) Descuenta stock por ítem
   3) Registra movimientos de Kardex (salida, usuario, concepto)
   4) Emite documento
   ↓
Entrega física: se muestra ubicación (pasillo-estantería-nivel-casilla)
```

---

## 1.8 Restricciones

- **Cero stock negativo**: prohibido vender más existencias de las disponibles.
- **Precio histórico inmutable**: el detalle de venta congela costo, venta base e IVA del día de cierre; cambios posteriores no alteran balances ni auditoría.
- **IVA configurable** pero uniforme a nivel sistema (un solo porcentaje global por versión, con historial).
- **Venta = transacción atómica**: no existe "vender y luego descontar".
- **Entorno objetivo**: Windows/Linux, despliegue con Docker.

---

## 1.9 Riesgos y Mitigación

| Riesgo | Probabilidad | Impacto | Mitigación |
|---|---|---|---|
| Duplicidad de códigos (OEM/SKU) | Media | Alto | Restricciones UNIQUE + búsqueda multicódigo centralizada |
| Venta sin stock por concurrencia | Baja | Crítico | Descuento atómico con transacción y bloqueo de fila (SELECT FOR UPDATE) |
| Pérdida de integridad histórica | Media | Alto | Precios congelados en detalle; versionado de parámetros de IVA |
| Errores de despacho | Alta | Alto | Filtro de compatibilidad por vehículo + ubicación física |
| Descuadre inventario físico vs sistema | Media | Alto | Módulo de ajustes/mermas auditado + Kardex completo |
| Acceso no autorizado | Media | Alto | RBAC + JWT con refresh + auditoría + rate limiting |

---

## 1.10 Requerimientos Funcionales (RF)

| ID | Requerimiento |
|---|---|
| RF-01 | El sistema permite registrar repuestos con SKU interno, código OEM y código de barras (multicódigo). |
| RF-02 | El sistema permite asociar compatibilidad del repuesto: marca de vehículo/equipo, modelo, año y cilindrada/tipo de motor. |
| RF-03 | El sistema registra la ubicación física del repuesto: pasillo, estantería, nivel y casilla. |
| RF-04 | El sistema gestiona tres precios independientes: Costo, Venta Base (sin IVA) y Facturado (con IVA). |
| RF-05 | El sistema calcula automáticamente el precio Facturado aplicando el IVA configurado sobre la Venta Base. |
| RF-06 | El sistema permite configurar el porcentaje de ganancia sobre costo y recalcular el PVP sugerido automáticamente ante variaciones de compra. |
| RF-07 | El sistema valida disponibilidad y **bloquea ventas sin existencias suficientes** (cero stock negativo). |
| RF-08 | El sistema descuenta stock **en tiempo real** mediante transacción atómica al confirmar la venta. |
| RF-09 | El sistema registra stock mínimo por repuesto y genera reportes/alerta de reposición. |
| RF-10 | El sistema permite registrar ajustes y mermas con motivo justificado (defectuoso, daño, devolución). |
| RF-11 | El sistema incluye módulo POS: carrito rápido por código de barras o búsqueda por vehículo. |
| RF-12 | El sistema permite emitir **Nota de Venta/Entrega** o **Factura legal** en un clic. |
| RF-13 | El sistema mantiene un **Kardex por repuesto**: quién, cuándo y por qué concepto entró/salió cada unidad. |
| RF-14 | El sistema congela en el detalle de venta los precios aplicados en la fecha de cierre (integridad histórica). |
| RF-15 | El sistema gestiona usuarios con roles y permisos (RBAC). |
| RF-16 | El sistema permite búsqueda por SKU, OEM, código de barras, marca, modelo, año y motor. |
| RF-17 | El sistema genera reportes: ventas, márgenes, stock crítico, kardex. |
| RF-18 | El sistema registra auditoría de acciones sensibles. |

---

## 1.11 Requerimientos No Funcionales (RNF)

| Categoría | ID | Requerimiento |
|---|---|---|
| Rendimiento | RNF-01 | La búsqueda de repuestos por código retorna en < 300 ms con catálogo de hasta 100k ítems. |
| Rendimiento | RNF-02 | La confirmación de venta (transacción atómica) completa en < 1 s en operación normal. |
| Concurrencia | RNF-03 | Soporta ≥ 5 cajeros simultáneos sin pérdida de stock (bloqueo optimista/pesimista controlado). |
| Disponibilidad | RNF-04 | El API responde health check y el sistema se despliega con Docker Compose. |
| Seguridad | RNF-05 | Autenticación JWT + refresh token; contraseñas con hash (argon2/bcrypt); RBAC; rate limiting; CORS; sanitización (anti XSS/SQLi). |
| Integridad | RNF-06 | Todas las operaciones de inventario son transaccionales y auditables. |
| Escalabilidad | RNF-07 | Monolito modular desplegable horizontalmente (réplicas stateless del API). |
| Usabilidad | RNF-08 | Interfaz responsive, dark mode, accesible (WCAG AA básico). |
| Mantenibilidad | RNF-09 | Clean Architecture, código tipado (TypeScript), SOLID, DRY, módulos independientes. |
| Portabilidad | RNF-10 | 100% dockerizado; variables de entorno para configuración. |
| Testing | RNF-11 | Cobertura unitaria ≥ 80% en capa de dominio/aplicación; e2e del flujo crítico de venta. |

---

## 1.12 Conclusiones de la Fase 1

El sistema es un **monolito modular de gestión de inventario + POS** con las siguientes prioridades de dominio:

1. **Dominio núcleo (core)**: Precios (costo/base/facturado) + Stock (descuento atómico, cero negativo) + Facturación con integridad histórica.
2. **Dominios de soporte**: Catálogo multicódigo y compatibilidad, ubicaciones de almacén, Kardex, usuarios/roles.
3. **Reglas de negocio clave**: transacción atómica de venta, congelado de precios en detalle, cálculo de IVA configurable, validación de stock.

Se procede a la **FASE 2: Arquitectura**.
