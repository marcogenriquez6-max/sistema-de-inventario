import { Role } from './models';

export interface NavItem {
  label: string;
  path: string;
  icon: string;
  module: string;
  section?: string;
  roles?: Role[];
}

export const NAV: NavItem[] = [
  { label: 'Dashboard', path: '/dashboard', icon: '📊', module: 'dashboard', section: 'Principal' },
  { label: 'Punto de Venta', path: '/pos', icon: '🛒', module: 'pos', section: 'Principal', roles: ['ADMIN', 'MANAGER', 'SELLER'] },
  { label: 'Catálogo', path: '/catalog', icon: '🔩', module: 'catalog', section: 'Operaciones' },
  { label: 'Inventario', path: '/inventory', icon: '📦', module: 'inventory', section: 'Operaciones', roles: ['ADMIN', 'MANAGER', 'INVENTORY_MANAGER'] },
  { label: 'Ventas', path: '/sales', icon: '🧾', module: 'sales', section: 'Operaciones', roles: ['ADMIN', 'MANAGER', 'SELLER'] },
  { label: 'Clientes', path: '/customers', icon: '👤', module: 'customers', section: 'Operaciones' },
  { label: 'Proveedores', path: '/suppliers', icon: '🏭', module: 'suppliers', section: 'Operaciones', roles: ['ADMIN', 'MANAGER'] },
  { label: 'Compras', path: '/purchases', icon: '📥', module: 'purchases', section: 'Operaciones', roles: ['ADMIN', 'MANAGER'] },
  { label: 'Caja', path: '/cash-register', icon: '💵', module: 'cash_register', section: 'Operaciones', roles: ['ADMIN', 'MANAGER', 'SELLER'] },
  { label: 'Contabilidad', path: '/accounting', icon: '📒', module: 'accounting', section: 'Gestión', roles: ['ADMIN', 'MANAGER'] },
  { label: 'Bancos', path: '/banking', icon: '🏦', module: 'banking', section: 'Gestión', roles: ['ADMIN', 'MANAGER'] },
  { label: 'RR.HH.', path: '/hr', icon: '🧑‍💼', module: 'hr', section: 'Gestión', roles: ['ADMIN', 'MANAGER'] },
  { label: 'Documentos', path: '/documents', icon: '🗂️', module: 'documents', section: 'Gestión' },
  { label: 'Tablero', path: '/kanban', icon: '🗃️', module: 'tasks', section: 'Colaboración' },
  { label: 'Calendario', path: '/calendar', icon: '📅', module: 'tasks', section: 'Colaboración' },
  { label: 'Auditoría', path: '/audit', icon: '🔎', module: 'audit', section: 'Sistema', roles: ['ADMIN', 'AUDITOR'] },
  { label: 'Reportes', path: '/reports', icon: '📈', module: 'reports', section: 'Sistema', roles: ['ADMIN', 'MANAGER', 'AUDITOR'] },
  { label: 'Roles y Permisos', path: '/permissions', icon: '🔐', module: 'permissions', section: 'Sistema', roles: ['ADMIN'] },
  { label: 'Usuarios', path: '/users', icon: '👥', module: 'users', section: 'Sistema', roles: ['ADMIN'] },
  { label: 'Módulos del Sistema', path: '/modules', icon: '🧩', module: 'dashboard', section: 'Sistema' },
  { label: 'Configuración', path: '/settings', icon: '⚙️', module: 'settings', section: 'Sistema', roles: ['ADMIN'] },
];

export interface NavSection {
  label: string;
  items: NavItem[];
}

export function groupNav(items: NavItem[]): NavSection[] {
  const groups = new Map<string, NavItem[]>();
  for (const item of items) {
    const key = item.section ?? 'General';
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(item);
  }
  return [...groups.entries()].map(([label, items]) => ({ label, items }));
}

export function navForRole(role: Role | null): NavItem[] {
  return NAV.filter((i) => !i.roles || (role && i.roles.includes(role)));
}

export function navForModules(matrix: Record<string, boolean>): NavItem[] {
  return NAV.filter((i) => matrix[i.module]);
}

export function itemForPath(path: string): NavItem | undefined {
  const p = path.split('?')[0];
  return NAV.find((n) => p === n.path || p.startsWith(n.path + '/'));
}

export interface Crumb {
  label: string;
  path: string;
}

export function crumbsForUrl(url: string): Crumb[] {
  const path = url.split('?')[0];
  const item = itemForPath(path);
  if (!item || item.path === '/dashboard') {
    return [{ label: item?.label ?? 'Inicio', path: '/dashboard' }];
  }
  const rest = path.slice(item.path.length).replace(/^\/+|\/+$/g, '');
  const crumbs: Crumb[] = [{ label: 'Inicio', path: '/dashboard' }, { label: item.label, path: item.path }];
  if (rest) {
    const sub =
      rest === 'new'
        ? 'Nuevo'
        : rest === 'edit'
          ? 'Editar'
          : /^\d+$/.test(rest)
            ? 'Detalle'
            : rest;
    crumbs.push({ label: sub, path });
  }
  return crumbs;
}

export const MODULE_BY_PATH = new Map(NAV.map((n) => [n.path, n]));
