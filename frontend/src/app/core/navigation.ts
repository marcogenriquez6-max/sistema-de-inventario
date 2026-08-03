import { Role } from './models';

export interface NavItem {
  label: string;
  path: string;
  icon: string;
  roles?: Role[];
}

export const NAV: NavItem[] = [
  { label: 'Dashboard', path: '/dashboard', icon: '📊' },
  { label: 'Punto de Venta', path: '/pos', icon: '🛒', roles: ['ADMIN', 'MANAGER', 'SELLER'] },
  { label: 'Catálogo', path: '/catalog', icon: '🔩' },
  {
    label: 'Inventario',
    path: '/inventory',
    icon: '📦',
    roles: ['ADMIN', 'MANAGER', 'INVENTORY_MANAGER'],
  },
  { label: 'Ventas', path: '/sales', icon: '🧾', roles: ['ADMIN', 'MANAGER', 'SELLER'] },
  { label: 'Clientes', path: '/customers', icon: '👤' },
  { label: 'Proveedores', path: '/suppliers', icon: '🏭', roles: ['ADMIN', 'MANAGER'] },
  { label: 'Compras', path: '/purchases', icon: '📥', roles: ['ADMIN', 'MANAGER'] },
  { label: 'Caja', path: '/cash-register', icon: '💵', roles: ['ADMIN', 'MANAGER', 'SELLER'] },
  { label: 'Contabilidad', path: '/accounting', icon: '📒', roles: ['ADMIN', 'MANAGER'] },
  { label: 'Bancos', path: '/banking', icon: '🏦', roles: ['ADMIN', 'MANAGER'] },
  { label: 'RR.HH.', path: '/hr', icon: '🧑‍💼', roles: ['ADMIN', 'MANAGER'] },
  { label: 'Documentos', path: '/documents', icon: '🗂️' },
  { label: 'Auditoría', path: '/audit', icon: '🔎', roles: ['ADMIN', 'AUDITOR'] },
  { label: 'Reportes', path: '/reports', icon: '📈', roles: ['ADMIN', 'MANAGER', 'AUDITOR'] },
  { label: 'Configuración', path: '/settings', icon: '⚙️', roles: ['ADMIN'] },
];

export function navForRole(role: Role | null): NavItem[] {
  return NAV.filter((i) => !i.roles || (role && i.roles.includes(role)));
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
