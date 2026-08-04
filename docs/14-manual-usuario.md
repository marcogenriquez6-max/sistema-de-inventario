# Manual de usuario

Guía rápida del ERP de repuestos para el personal.

## Acceso

1. Abrir la URL del sistema en el navegador.
2. Iniciar sesión con el correo y contraseña asignados.
3. La barra lateral da acceso a los módulos según el rol:

| Rol | Acceso |
|---|---|
| ADMIN | todos los módulos + Configuración + Auditoría |
| MANAGER | ventas, compras, inventario, caja, RR.HH., reportes… |
| SELLER | Punto de Venta, Ventas, Clientes, Caja |
| INVENTORY_MANAGER | Inventario, Catálogo |
| AUDITOR | Auditoría, Reportes (solo lectura) |

## Atajos de teclado

| Atajo | Acción |
|---|---|
| `Ctrl + K` | Búsqueda global |
| `Ctrl + D` | Alternar tema claro/oscuro |
| `Ctrl + B` | Colapsar menú lateral |
| `Ctrl + ?` | Ayuda de atajos |
| `/` | Ir a búsqueda |
| `Esc` | Cerrar ventanas/modales |

## Módulos principales

### Punto de Venta (POS)
- Buscar producto por código o nombre, añadir al carrito y cobrar.
- La venta genera automáticamente número de documento y descuenta stock.

### Catálogo de repuestos
- Listar, buscar y gestionar productos (precio, stock mínimo, códigos
  alternativos, compatibilidades).

### Inventario
- Compras y ajustes de stock.
- **Kardex**: historial de movimientos por producto.
- Alertas de stock bajo: llegan notificaciones en tiempo real.

### Ventas y Clientes
- Registrar ventas, ver historial y anular ventas (con justificación).
- Gestionar clientes y sus datos.

### Compras y Proveedores
- Registrar compras y mantener el catálogo de proveedores.

### Caja, Contabilidad y Bancos
- Apertura/cierre de caja y movimientos.
- Plan de cuentas, asientos y balance de comprobación.
- Cuentas bancarias, movimientos y transferencias.

### RR.HH., Documentos y Auditoría
- Empleados, documentos adjuntos, y registro de auditoría de acciones.

### Reportes y Exportación
- Dashboard, stock bajo y ventas por día.
- Botón **Exportar** en las listas para descargar **CSV**, **Excel (XLSX)**
  o **PDF**.

## Notificaciones en tiempo real

La campana de la barra superior muestra avisos (ventas, compras, stock bajo,
mensajes). El punto verde indica conexión en vivo; si se pierde, se reconecta
automáticamente.

## Chat interno

Botón **💬** abajo a la derecha.

- **Nuevo mensaje**: buscar un usuario y empezar una conversación directa.
- Se muestran las conversaciones con último mensaje y no leídos.
- Los mensajes llegan en tiempo real; también generan notificación.

## Tablero Kanban y Calendario

- **Tablero**: organiza tareas en columnas *Por hacer / En curso / Hecho*.
  Arrastra una tarjeta entre columnas; doble clic para editar.
- **Calendario**: tareas con fecha límite por día. Clic en una tarea para ver
  el detalle. Navega meses con ← / →.

## Configuración

- Tema (claro/oscuro/sistema), ancho del menú y filas por página.
- Parámetros del sistema (impuesto/IVA, etc.) para administradores.

## Solución de problemas

- **Sesión expirada**: vuelve a iniciar sesión; la sesión se refresca
  automáticamente.
- **Sin conexión en tiempo real**: las notificaciones/chat se recargan
  periódicamente y reconectan solos.
- Para reportar errores, contacta al administrador del sistema.
