const fs = require('fs');

const base = '{{baseUrl}}';
const auth = [{ key: 'Authorization', value: 'Bearer {{token}}', type: 'text' }];

function req(method, url, name, opts = {}) {
  const r = {
    method,
    header: opts.public_ ? [] : auth.map((h) => ({ ...h })),
    url,
    name,
  };
  if (opts.body) {
    r.body = { mode: 'raw', raw: JSON.stringify(opts.body, null, 2), options: { raw: { language: 'json' } } };
    r.header.push({ key: 'Content-Type', value: 'application/json', type: 'text' });
  }
  if (opts.desc) r.desc = { description: opts.desc };
  return r;
}

const folders = {
  '01 Salud': [
    req('GET', `${base}/health`, 'Health', { public_: true }),
    req('GET', `${base}/health/db`, 'Health DB', { public_: true }),
    req('GET', `${base}/health/modules`, 'Módulos registrados', { public_: true }),
  ],
  '02 Auth': [
    req('POST', `${base}/auth/login`, 'Login', {
      public_: true,
      body: { email: 'admin@sistema.com', password: 'Admin@123' },
    }),
    req('POST', `${base}/auth/refresh`, 'Refresh token', { public_: true, body: { refreshToken: '{{refreshToken}}' } }),
    req('POST', `${base}/auth/logout`, 'Logout'),
    req('POST', `${base}/auth/change-password`, 'Cambiar contraseña', { body: { currentPassword: 'Admin@123', newPassword: 'Nueva@123' } }),
  ],
  '03 Catálogo': [
    req('GET', `${base}/products`, 'Listar productos'),
    req('GET', `${base}/products/by-code/:code`, 'Producto por código'),
    req('GET', `${base}/products/:id`, 'Detalle producto'),
    req('POST', `${base}/products`, 'Crear producto', { body: { sku: 'FLT-001', name: 'Filtro de aceite', price: 15.5, stock: 100, minStock: 10 } }),
    req('PATCH', `${base}/products/:id`, 'Actualizar producto', { body: { price: 16.0 } }),
    req('DELETE', `${base}/products/:id`, 'Eliminar producto'),
  ],
  '04 Ventas': [
    req('POST', `${base}/sales`, 'Crear venta', { body: { items: [{ productId: 1, quantity: 2 }], customerId: null } }),
    req('GET', `${base}/sales`, 'Listar ventas'),
    req('GET', `${base}/sales/:id`, 'Detalle venta'),
    req('POST', `${base}/sales/:id/void`, 'Anular venta', { body: { reason: 'Error de caja' } }),
  ],
  '05 Clientes': [
    req('GET', `${base}/customers`, 'Listar clientes'),
    req('GET', `${base}/customers/:id`, 'Detalle cliente'),
    req('POST', `${base}/customers`, 'Crear cliente', { body: { name: 'Juan Pérez', phone: '3001234567' } }),
    req('PATCH', `${base}/customers/:id`, 'Actualizar cliente', { body: { phone: '3010000000' } }),
  ],
  '06 Proveedores': [
    req('GET', `${base}/suppliers`, 'Listar proveedores'),
    req('POST', `${base}/suppliers`, 'Crear proveedor', { body: { name: 'Repuestos XYZ', taxId: '900000000' } }),
    req('PATCH', `${base}/suppliers/:id`, 'Actualizar proveedor'),
  ],
  '07 Compras': [
    req('POST', `${base}/purchases`, 'Registrar compra', { body: { supplierId: 1, items: [{ productId: 1, quantity: 50, cost: 12 }] } }),
    req('GET', `${base}/purchases`, 'Listar compras'),
    req('GET', `${base}/purchases/:id`, 'Detalle compra'),
  ],
  '08 Inventario': [
    req('POST', `${base}/inventory/purchases`, 'Movimiento de compra'),
    req('POST', `${base}/inventory/adjustments`, 'Ajuste de stock', { body: { productId: 1, quantity: -5, reason: 'merma' } }),
    req('GET', `${base}/inventory/kardex/:productId`, 'Kardex por producto'),
  ],
  '09 Caja': [
    req('POST', `${base}/cash-registers`, 'Abrir caja', { body: { openingAmount: 50000 } }),
    req('GET', `${base}/cash-registers/mine`, 'Mi caja'),
    req('POST', `${base}/cash-registers/:id/movements`, 'Movimiento de caja', { body: { type: 'EXPENSE', amount: 10000, note: 'papelería' } }),
    req('GET', `${base}/cash-registers/:id/movements`, 'Movimientos de caja'),
    req('POST', `${base}/cash-registers/:id/close`, 'Cerrar caja', { body: { countedAmount: 65000 } }),
  ],
  '10 Contabilidad': [
    req('GET', `${base}/accounting/accounts`, 'Plan de cuentas'),
    req('POST', `${base}/accounting/accounts`, 'Crear cuenta', { body: { code: '1105', name: 'Caja general', type: 'ASSET' } }),
    req('POST', `${base}/accounting/entries`, 'Registrar asiento', { body: { date: '2026-08-04', lines: [{ accountId: 1, debit: 100 }] } }),
    req('GET', `${base}/accounting/entries`, 'Listar asientos'),
    req('GET', `${base}/accounting/trial-balance`, 'Balance de comprobación'),
  ],
  '11 Bancos': [
    req('GET', `${base}/banking/accounts`, 'Cuentas bancarias'),
    req('POST', `${base}/banking/accounts`, 'Crear cuenta bancaria', { body: { bank: 'Banco Demo', number: '1234567890' } }),
    req('POST', `${base}/banking/accounts/:id/movements`, 'Movimiento bancario'),
    req('POST', `${base}/banking/accounts/:id/transfer`, 'Transferencia'),
  ],
  '12 RRHH': [
    req('GET', `${base}/employees`, 'Listar empleados'),
    req('POST', `${base}/employees`, 'Crear empleado', { body: { fullName: 'Ana García', position: 'Vendedora', department: 'Ventas' } }),
    req('PATCH', `${base}/employees/:id`, 'Actualizar empleado'),
  ],
  '13 Documentos': [
    req('GET', `${base}/documents`, 'Listar documentos'),
    req('POST', `${base}/documents`, 'Subir documento', { body: { name: 'factura.pdf', type: 'PDF' } }),
  ],
  '14 Auditoría': [req('GET', `${base}/audit`, 'Registro de auditoría')],
  '15 Reportes': [
    req('GET', `${base}/reports/dashboard`, 'Dashboard'),
    req('GET', `${base}/reports/low-stock`, 'Stock bajo'),
    req('GET', `${base}/reports/sales-by-day`, 'Ventas por día'),
  ],
  '16 Notificaciones': [
    req('GET', `${base}/notifications`, 'Listar notificaciones'),
    req('GET', `${base}/notifications/unread-count`, 'No leídas'),
    req('PATCH', `${base}/notifications/read/:id`, 'Marcar leída'),
    req('POST', `${base}/notifications/read-all`, 'Marcar todas leídas'),
    req('POST', `${base}/notifications/test`, 'Notificación de prueba'),
  ],
  '17 Chat': [
    req('GET', `${base}/chat/rooms`, 'Salas'),
    req('POST', `${base}/chat/rooms`, 'Crear sala', { body: { type: 'direct', participantIds: [2] } }),
    req('GET', `${base}/chat/rooms/:id/messages`, 'Mensajes'),
    req('POST', `${base}/chat/rooms/:id/messages`, 'Enviar mensaje', { body: { content: 'Hola equipo' } }),
    req('POST', `${base}/chat/rooms/:id/read`, 'Marcar sala leída'),
    req('GET', `${base}/chat/unread-count`, 'Mensajes sin leer'),
    req('GET', `${base}/chat/users`, 'Usuarios disponibles'),
  ],
  '18 Tareas': [
    req('GET', `${base}/tasks`, 'Listar tareas'),
    req('POST', `${base}/tasks`, 'Crear tarea', { body: { title: 'Revisar inventario', status: 'todo', priority: 'high', dueDate: '2026-08-10' } }),
    req('PATCH', `${base}/tasks/:id`, 'Actualizar tarea'),
    req('PATCH', `${base}/tasks/:id/move`, 'Mover tarea', { body: { status: 'doing' } }),
    req('DELETE', `${base}/tasks/:id`, 'Eliminar tarea'),
  ],
  '19 Búsqueda y Exportación': [
    req('GET', `${base}/search?q=filtro`, 'Búsqueda global'),
    req('GET', `${base}/export/products?format=csv`, 'Exportar productos CSV'),
    req('GET', `${base}/export/products?format=xlsx`, 'Exportar productos XLSX'),
    req('GET', `${base}/export/products?format=pdf`, 'Exportar productos PDF'),
  ],
  '20 Parámetros': [
    req('GET', `${base}/settings`, 'Listar parámetros'),
    req('PATCH', `${base}/settings/:key`, 'Actualizar parámetro', { body: { value: '19' } }),
    req('GET', `${base}/settings/public/:key`, 'Parámetro público'),
    req('GET', `${base}/settings/history/:key`, 'Historial de cambios'),
  ],
  '21 Usuarios': [
    req('GET', `${base}/users`, 'Listar usuarios'),
    req('POST', `${base}/users`, 'Crear usuario', { body: { email: 'nuevo@sistema.com', password: 'Admin@123', fullName: 'Nuevo Usuario', role: 'SELLER' } }),
    req('PATCH', `${base}/users/:id`, 'Actualizar usuario'),
  ],
};

const items = Object.entries(folders).map(([name, reqs]) => ({
  name,
  item: reqs.map((r) => {
    const { method, url, name, body, header, desc } = r;
    return {
      name,
      request: {
        method,
        header,
        url: { raw: url, host: ['{{baseUrl}}'] },
        body,
        description: desc?.description,
      },
      response: [],
    };
  }),
}));

const collection = {
  info: {
    name: 'Repuestos ERP API',
    description:
      'Colección de la API del ERP de repuestos. Usa variable {{baseUrl}} (default http://localhost:3000/api) y {{token}} (obtener con POST /auth/login).',
    schema: 'https://schema.getpostman.com/json/collection/v2.1.0/collection.json',
  },
  variable: [
    { key: 'baseUrl', value: 'http://localhost:3000/api', type: 'string' },
    { key: 'token', value: '', type: 'string' },
  ],
  item: items,
};

const path = require('path');
const out = path.resolve(__dirname, '..', '..', 'docs', 'postman', 'repuestos-erp.postman_collection.json');
fs.mkdirSync(path.dirname(out), { recursive: true });
fs.writeFileSync(out, JSON.stringify(collection, null, 2));
console.log('Colección generada:', items.reduce((a, f) => a + f.item.length, 0), 'request →', out);
